import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  TrustedComponentHost,
  type ComponentHostDefinition,
  type ComponentHostElement
} from "./component-host";

const element: ComponentHostElement = {
  id: "score",
  name: "Score",
  content: {
    componentId: "score-ring",
    version: "1.0.0",
    props: { value: 82 }
  },
  accessibility: { label: "Điểm 82 trên 100" }
};

const definition: ComponentHostDefinition<{ value: number }> = {
  id: "score-ring",
  version: "1.0.0",
  parseProps: (input) => {
    const value = (input as { value?: unknown }).value;
    if (typeof value !== "number" || value < 0 || value > 100) throw new Error("invalid score");
    return { value };
  },
  render: ({ props }) => createElement("output", null, props.value),
  accessibleSummary: ({ value }) => `Điểm ${value} trên 100`,
  exportCapabilities: ["html", "svg", "png", "pdf"]
};

describe("TrustedComponentHost", () => {
  it("renders validated trusted component output with its accessible summary", () => {
    const html = renderToStaticMarkup(createElement(TrustedComponentHost, {
      element,
      definition,
      mode: "final"
    }));
    expect(html).toContain('data-component-status="ready"');
    expect(html).toContain('aria-label="Điểm 82 trên 100"');
    expect(html).toContain("<output>82</output>");
    expect(html).toContain('data-component-accessible-summary="true"');
  });

  it("returns an element-level fallback when the definition is missing", () => {
    const html = renderToStaticMarkup(createElement(TrustedComponentHost, {
      element,
      mode: "final"
    }));
    expect(html).toContain('data-component-status="missing"');
    expect(html).toContain("score-ring@1.0.0");
    expect(html).toContain("Điểm 82 trên 100");
  });

  it("contains invalid props and renderer failures without blanking the slide", () => {
    const invalidHtml = renderToStaticMarkup(createElement(TrustedComponentHost, {
      element: { ...element, content: { ...element.content, props: { value: 120 } } },
      definition,
      mode: "studio"
    }));
    expect(invalidHtml).toContain('data-component-status="invalid-props"');

    const throwingDefinition: ComponentHostDefinition<{ value: number }> = {
      ...definition,
      render: () => { throw new Error("render failed"); }
    };
    const errorHtml = renderToStaticMarkup(createElement(TrustedComponentHost, {
      element,
      definition: throwingDefinition,
      mode: "final"
    }));
    expect(errorHtml).toContain('data-component-status="render-error"');
    expect(errorHtml).toContain("score-ring@1.0.0");
  });

  it("uses a disclosed fallback when the requested export capability is unavailable", () => {
    const html = renderToStaticMarkup(createElement(TrustedComponentHost, {
      element,
      definition,
      mode: "export",
      exportTarget: "pptx"
    }));
    expect(html).toContain('data-component-status="export-unsupported"');
    expect(html).not.toContain("<output>82</output>");
  });
});
