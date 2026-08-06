import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SceneSlide } from "@deckory/schema/v2";
import type { SceneRendererExtensions } from "./renderer-extensions";
import { SceneRenderer } from "./scene-renderer";

const componentSlide: SceneSlide = {
  id: "component-slide",
  name: "Component slide",
  background: { layers: [] },
  elements: [{
    id: "score",
    name: "Score",
    kind: "component-instance",
    frame: { x: 80, y: 80, width: 320, height: 240 },
    zIndex: 1,
    content: { componentId: "score-ring", version: "1.0.0", props: { value: 92 } },
    accessibility: { label: "Điểm 92 trên 100" }
  }]
};

const webBlockSlide: SceneSlide = {
  id: "web-block-slide",
  name: "Web Block slide",
  background: { layers: [] },
  elements: [{
    id: "custom-radar",
    name: "Custom radar",
    kind: "web-block",
    frame: { x: 80, y: 80, width: 480, height: 360 },
    zIndex: 1,
    content: {
      manifest: {
        id: "custom-radar",
        version: "1.0.0",
        accessibleSummary: "Radar tuỳ chỉnh",
        staticFallback: { type: "png", assetId: "custom-radar-fallback" }
      },
      sourceId: "custom-radar-source"
    },
    accessibility: { label: "Radar tuỳ chỉnh" }
  }]
};

const extensions: SceneRendererExtensions = {
  components: {
    resolve: ({ componentId, version }) => componentId === "score-ring" && version === "1.0.0"
      ? {
          id: "score-ring",
          version: "1.0.0",
          parseProps(input) {
            const value = (input as { value?: unknown }).value;
            if (typeof value !== "number") throw new TypeError("value must be numeric");
            return { value };
          },
          render: ({ props }) => <strong data-custom-component="score-ring">{(props as { value: number }).value}</strong>,
          accessibleSummary: (props) => `Điểm ${(props as { value: number }).value} trên 100`,
          exportCapabilities: ["html", "svg", "png", "pdf"]
        }
      : undefined
  },
  webBlocks: {
    resolve: ({ elementId }) => elementId === "custom-radar"
      ? { fallbackSrc: "/assets/custom-radar-fallback.png" }
      : undefined
  },
  exportTarget: "png"
};

describe("SceneRenderer extensions", () => {
  it("renders a resolved trusted component through the component host", () => {
    const html = renderToStaticMarkup(
      <SceneRenderer slide={componentSlide} mode="final" extensions={extensions} />
    );

    expect(html).toContain('data-component-status="ready"');
    expect(html).toContain('data-custom-component="score-ring"');
    expect(html).toContain("92");
  });

  it("uses the reviewed static fallback for Web Block export", () => {
    const html = renderToStaticMarkup(
      <SceneRenderer slide={webBlockSlide} mode="export" extensions={extensions} />
    );

    expect(html).toContain('data-web-block-status="static-export"');
    expect(html).toContain('/assets/custom-radar-fallback.png');
    expect(html).not.toContain("<iframe");
  });

  it("preserves an explicit fallback when no component definition is registered", () => {
    const html = renderToStaticMarkup(<SceneRenderer slide={componentSlide} mode="final" />);
    expect(html).toContain('class="scene-component-fallback"');
    expect(html).toContain("score-ring");
  });
});
