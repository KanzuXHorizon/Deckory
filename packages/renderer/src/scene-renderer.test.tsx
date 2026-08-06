import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SceneSlide } from "@deckory/schema";
import { SceneRenderer } from "./scene-renderer.js";

const sceneSlide: SceneSlide = {
  id: "cover",
  name: "Cover",
  background: { layers: [{ id: "paper", type: "solid", color: "#ffffff", opacity: 1 }] },
  elements: [{
    id: "title",
    name: "Title",
    kind: "text",
    frame: { x: 72, y: 64, width: 720, height: 140 },
    zIndex: 1,
    content: { text: "Deckory V2" },
    accessibility: { label: "Deckory V2", readingOrder: 1 }
  }]
};

const sceneSlideWithEvidence: SceneSlide = {
  ...sceneSlide,
  id: "evidence",
  elements: [
    ...sceneSlide.elements,
    {
      id: "footer",
      name: "Evidence",
      kind: "evidence-footer",
      frame: { x: 72, y: 660, width: 1136, height: 28 },
      zIndex: 2,
      content: { source: "Fixture minh hoạ", page: "01" },
      accessibility: { label: "Nguồn: Fixture minh hoạ", readingOrder: 2 }
    }
  ]
};

describe("SceneRenderer", () => {
  it("renders explicit frames using logical-pixel CSS variables", () => {
    const html = renderToStaticMarkup(<SceneRenderer slide={sceneSlide} assets={[]} mode="final" />);
    expect(html).toContain('data-element-id="title"');
    expect(html).toContain("--scene-x:72");
    expect(html).toContain("--scene-width:720");
    expect(html).toContain("Deckory V2");
  });

  it("keeps the evidence footer in the final renderer", () => {
    const html = renderToStaticMarkup(<SceneRenderer slide={sceneSlideWithEvidence} assets={[]} mode="final" />);
    expect(html).toContain("Fixture minh hoạ");
    expect(html).toContain('data-element-kind="evidence-footer"');
  });

  it("sorts by z-index while preserving stable document order", () => {
    const textElement = sceneSlide.elements[0] as Extract<SceneSlide["elements"][number], { kind: "text" }>;
    const slide: SceneSlide = {
      ...sceneSlide,
      elements: [
        { ...textElement, id: "later", name: "Later", zIndex: 2, content: { text: "Later" } },
        { ...textElement, id: "first", name: "First", zIndex: 1, content: { text: "First" } },
        { ...textElement, id: "same", name: "Same", zIndex: 2, content: { text: "Same" } }
      ]
    };
    const html = renderToStaticMarkup(<SceneRenderer slide={slide} assets={[]} mode="final" />);
    expect(html.indexOf("First")).toBeLessThan(html.indexOf("Later"));
    expect(html.indexOf("Later")).toBeLessThan(html.indexOf("Same"));
  });
});
