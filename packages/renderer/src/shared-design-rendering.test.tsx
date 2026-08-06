import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckAssetV2, SceneSlide } from "@deckory/schema/v2";
import { SceneRenderer } from "./scene-renderer";

const assets: DeckAssetV2[] = [{
  id: "product-shot",
  type: "image",
  src: "/assets/product-shot.png",
  mediaType: "image/png",
  width: 1200,
  height: 800
}];

const slide: SceneSlide = {
  id: "design-proof",
  name: "Design proof",
  background: {
    layers: [
      { id: "base", type: "solid", color: "#ffffff", opacity: 1 },
      { id: "grain", type: "noise", seed: 42, scale: 2, opacity: 0.08 }
    ]
  },
  elements: [
    {
      id: "rich-copy",
      name: "Rich copy",
      kind: "rich-text",
      frame: { x: 72, y: 64, width: 600, height: 180 },
      zIndex: 1,
      content: {
        document: {
          verticalAlign: "center",
          paragraphs: [{
            id: "claim",
            runs: [
              { text: "Phản hồi ", marks: { bold: true } },
              { text: "có bằng chứng.", marks: { emphasis: "primary" } }
            ],
            style: { role: "title", align: "left" }
          }]
        },
        plainText: "Phản hồi có bằng chứng."
      },
      accessibility: { label: "Phản hồi có bằng chứng." }
    },
    {
      id: "panel",
      name: "Panel",
      kind: "shape",
      frame: { x: 72, y: 280, width: 420, height: 260 },
      zIndex: 2,
      style: { fill: "#f4f5f7", stroke: "#d8dadf", strokeWidth: 2, borderRadius: [16, 28, 8, 20] },
      content: { shape: "rectangle" },
      accessibility: { decorative: true }
    },
    {
      id: "product-image",
      name: "Product image",
      kind: "image",
      frame: { x: 540, y: 260, width: 620, height: 360 },
      zIndex: 3,
      opacity: 0.95,
      style: { objectFit: "cover", focalPoint: { x: 0.72, y: 0.28 }, borderRadius: 24 },
      content: { assetId: "product-shot", alt: "Ảnh giao diện sản phẩm" },
      accessibility: { label: "Ảnh giao diện sản phẩm" },
      motion: [{
        id: "image-in",
        type: "entrance",
        trigger: "on-enter",
        duration: 0.4,
        easing: "emphasized",
        finalState: { opacity: 1, translateY: 0 }
      }]
    }
  ]
};

describe("shared design rendering", () => {
  it("uses the deterministic layered background renderer", () => {
    const first = renderToStaticMarkup(<SceneRenderer slide={slide} assets={assets} mode="final" />);
    const second = renderToStaticMarkup(<SceneRenderer slide={slide} assets={assets} mode="final" />);
    expect(first).toBe(second);
    expect(first).toContain('data-background-layer="base"');
    expect(first).toContain('data-background-layer="grain"');
    expect(first).toContain("deckory-noise-grain");
  });

  it("renders semantic rich text instead of the plain-text fallback", () => {
    const html = renderToStaticMarkup(<SceneRenderer slide={slide} assets={assets} mode="final" />);
    expect(html).toContain('class="deckory-rich-text"');
    expect(html).toContain('data-paragraph-id="claim"');
    expect(html).toContain("<strong>");
    expect(html).toContain('data-emphasis="primary"');
  });

  it("dispatches shape and image elements through bounded renderers", () => {
    const html = renderToStaticMarkup(<SceneRenderer slide={slide} assets={assets} mode="final" />);
    expect(html).toContain('data-shape-id="panel"');
    expect(html).toContain("16px 28px 8px 20px");
    expect(html).toContain('data-image-id="product-image"');
    expect(html).toContain("object-position:72% 28%");
  });

  it("resolves complete final motion state for final, thumbnail and export modes", () => {
    for (const mode of ["final", "thumbnail", "export"] as const) {
      const html = renderToStaticMarkup(<SceneRenderer slide={slide} assets={assets} mode={mode} />);
      expect(html).toContain('data-element-id="product-image"');
      expect(html).toContain("opacity:1");
      expect(html).toContain("translateY(0px)");
    }
  });
});
