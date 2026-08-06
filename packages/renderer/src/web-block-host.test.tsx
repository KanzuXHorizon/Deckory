import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WEB_BLOCK_RENDER_TIMEOUT_MS,
  WebBlockHost,
  createWebBlockSandboxPolicy,
  createWebBlockSrcDoc,
  parseWebBlockHostMessage,
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

  it("escapes bundle boundaries and embedded JSON literals instead of allowing srcdoc breakout", () => {
    const html = createWebBlockSrcDoc({
      ...bundle,
      protocolVersion: "1.0</script><script>window.parent.document.body.remove()</script>",
      code: "document.body.dataset.safe='yes';</script><script>window.parent.document.body.remove()</script>"
    }, {
      ...element.manifest,
      id: "custom-radar</script><script>window.parent.document.body.remove()</script>"
    });
    expect(html).toContain("default-src 'none'");
    expect(html).not.toContain("</script><script>window.parent");
    expect(html).toContain("<\\/script><script>window.parent");
    expect(html).toContain("\\u003c/script\\u003e\\u003cscript\\u003e");
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

  it("requires the reviewed runtime to signal actual render completion", () => {
    const html = createWebBlockSrcDoc(bundle, element.manifest);
    expect(html).toContain("__deckoryWebBlockBridge");
    expect(html).toContain("renderComplete");
    expect(html).not.toContain(`${bundle.code}\n    post("render-complete", {});`);
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

  it("models ready, rendered, reset, error and timeout states deterministically", () => {
    expect(WEB_BLOCK_RENDER_TIMEOUT_MS).toBe(1500);
    const ready = reduceWebBlockLifecycle({ status: "booting" }, { type: "ready" });
    expect(ready).toEqual({ status: "ready" });
    const rendered = reduceWebBlockLifecycle(ready, { type: "render-complete" });
    expect(rendered).toEqual({ status: "rendered" });
    expect(reduceWebBlockLifecycle(rendered, { type: "reset" })).toEqual({ status: "booting" });
    const timedOut = reduceWebBlockLifecycle({ status: "booting" }, { type: "timeout" });
    expect(timedOut).toEqual({ status: "timed-out" });
    expect(shouldUseWebBlockFallback(timedOut)).toBe(true);
    expect(shouldUseWebBlockFallback({ status: "error", message: "failed" })).toBe(true);
  });

  it("strictly validates the bounded lifecycle messages consumed by the host", () => {
    expect(parseWebBlockHostMessage({
      protocolVersion: "1.0",
      blockId: "custom-radar",
      type: "render-error",
      payload: { message: "failed" }
    }, { protocolVersion: "1.0", blockId: "custom-radar" })).toMatchObject({ type: "render-error" });

    expect(parseWebBlockHostMessage({
      protocolVersion: "1.0",
      blockId: "custom-radar",
      type: "render-error",
      payload: { message: "x".repeat(2_001) }
    }, { protocolVersion: "1.0", blockId: "custom-radar" })).toBeUndefined();

    expect(parseWebBlockHostMessage({
      protocolVersion: "1.0",
      blockId: "custom-radar",
      type: "render-complete",
      payload: { unexpected: true }
    }, { protocolVersion: "1.0", blockId: "custom-radar" })).toBeUndefined();
  });
});
