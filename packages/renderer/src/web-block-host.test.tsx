import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WEB_BLOCK_RENDER_TIMEOUT_MS,
  WebBlockHost,
  createWebBlockSandboxPolicy,
  createWebBlockSrcDoc,
  reduceWebBlockLifecycle,
  shouldUseWebBlockFallback,
  type WebBlockHostElement
} from "./web-block-host";

const element: WebBlockHostElement = {
  id: "custom-radar",
  name: "Custom radar",
  manifest: {
    id: "custom-radar",
    version: "1.0.0",
    accessibleSummary: "Biểu đồ radar tùy chỉnh",
    staticFallback: { type: "svg", assetId: "custom-radar-fallback" }
  }
};

const bundle = {
  code: "document.getElementById('root').textContent = 'Radar';",
  css: ".root { display: grid; }",
  protocolVersion: "1.0"
};

describe("Web Block sandbox policy and host", () => {
  it("creates a deny-by-default CSP and never grants same-origin access", () => {
    const policy = createWebBlockSandboxPolicy();
    expect(policy.sandbox).toBe("allow-scripts");
    expect(policy.sandbox).not.toContain("allow-same-origin");
    expect(policy.csp).toContain("default-src 'none'");
    expect(policy.csp).toContain("connect-src 'none'");
    expect(policy.csp).toContain("img-src data: blob:");
    expect(policy.csp).toContain("object-src 'none'");
    expect(policy.csp).toContain("form-action 'none'");
    expect(policy.csp).toContain("navigate-to 'none'");
  });

  it("escapes bundle boundaries instead of allowing srcdoc breakout", () => {
    const html = createWebBlockSrcDoc({
      ...bundle,
      code: "document.body.dataset.safe='yes';</script><script>window.parent.document.body.remove()</script>"
    }, element.manifest);
    expect(html).toContain("default-src 'none'");
    expect(html).not.toContain("</script><script>window.parent");
    expect(html).toContain("<\\/script><script>window.parent");
    expect(html).toContain("Biểu đồ radar tùy chỉnh");
  });

  it("renders an isolated iframe with an accessible summary outside the frame", () => {
    const html = renderToStaticMarkup(createElement(WebBlockHost, {
      element,
      bundle,
      fallbackSrc: "/assets/custom-radar.svg",
      mode: "studio"
    }));
    expect(html).toContain('sandbox="allow-scripts"');
    expect(html).not.toContain("allow-same-origin");
    expect(html).toContain('data-web-block-status="booting"');
    expect(html).toContain('data-web-block-accessible-summary="true"');
    expect(html).toContain('title="Biểu đồ radar tùy chỉnh"');
  });

  it("uses the mandatory static fallback for export and failures", () => {
    const exportHtml = renderToStaticMarkup(createElement(WebBlockHost, {
      element,
      bundle,
      fallbackSrc: "/assets/custom-radar.svg",
      mode: "export"
    }));
    expect(exportHtml).toContain('data-web-block-status="static-export"');
    expect(exportHtml).toContain('<img src="/assets/custom-radar.svg"');
    expect(exportHtml).not.toContain("<iframe");

    const errorHtml = renderToStaticMarkup(createElement(WebBlockHost, {
      element,
      fallbackSrc: "/assets/custom-radar.svg",
      mode: "final"
    }));
    expect(errorHtml).toContain('data-web-block-status="bundle-missing"');
    expect(errorHtml).toContain('<img src="/assets/custom-radar.svg"');
  });

  it("disables pointer interaction in thumbnail mode", () => {
    const html = renderToStaticMarkup(createElement(WebBlockHost, {
      element,
      bundle,
      fallbackSrc: "/assets/custom-radar.svg",
      mode: "thumbnail"
    }));
    expect(html).toContain("pointer-events:none");
  });

  it("models ready, rendered, error and timeout states deterministically", () => {
    expect(WEB_BLOCK_RENDER_TIMEOUT_MS).toBe(1500);
    const ready = reduceWebBlockLifecycle({ status: "booting" }, { type: "ready" });
    expect(ready).toEqual({ status: "ready" });
    const rendered = reduceWebBlockLifecycle(ready, { type: "render-complete" });
    expect(rendered).toEqual({ status: "rendered" });
    const timedOut = reduceWebBlockLifecycle({ status: "booting" }, { type: "timeout" });
    expect(timedOut).toEqual({ status: "timed-out" });
    expect(shouldUseWebBlockFallback(timedOut)).toBe(true);
    expect(shouldUseWebBlockFallback({ status: "error", message: "failed" })).toBe(true);
  });
});
