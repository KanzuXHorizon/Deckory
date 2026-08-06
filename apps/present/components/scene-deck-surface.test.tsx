import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckDocumentV2 } from "@deckory/schema";
import { SceneDeckSurface } from "./scene-deck-surface";

const deck: DeckDocumentV2 = {
  schemaVersion: 2,
  id: "surface-proof",
  revision: 1,
  title: "Surface proof",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  slides: ["opening", "proof", "closing"].map((id, index) => ({
    id,
    name: id,
    purpose: "surface-proof",
    conclusion: `${id} conclusion`,
    notes: `${id} private notes`,
    background: { layers: [{ id: `${id}-background`, type: "solid", color: "#ffffff", opacity: 1 }] },
    elements: [{
      id: `${id}-title`,
      name: `${id} title`,
      kind: "text",
      frame: { x: 80, y: 80, width: 900, height: 100 },
      zIndex: 1,
      content: { text: `${id} conclusion` },
      accessibility: { label: `${id} conclusion`, readingOrder: 1 }
    }]
  }))
};

describe("SceneDeckSurface", () => {
  it("selects the requested slide and exposes all slide navigation", () => {
    const html = renderToStaticMarkup(<SceneDeckSurface deck={deck} surface="preview" initialSlideId="proof" />);

    expect(html).toContain('data-scene-v2-surface="preview"');
    expect(html).toContain('data-active-slide-id="proof"');
    expect(html).toContain('data-slide-id="proof"');
    expect(html).toContain('aria-label="Chọn slide 1: opening"');
    expect(html).toContain('aria-label="Chọn slide 3: closing"');
    expect(html).toContain("2 / 3");
  });

  it("never renders private notes in audience mode", () => {
    const html = renderToStaticMarkup(<SceneDeckSurface deck={deck} surface="presenter" view="audience" initialSlideId="opening" />);
    expect(html).not.toContain("private notes");
    expect(html).not.toContain("Ghi chú người thuyết trình");
  });

  it("provides presenter-only controls without showing notes by default", () => {
    const html = renderToStaticMarkup(<SceneDeckSurface deck={deck} surface="presenter" view="presenter" />);
    expect(html).toContain('aria-label="Mở ghi chú người thuyết trình"');
    expect(html).toContain('aria-label="Mở tổng quan slide"');
    expect(html).not.toContain("opening private notes");
  });
});
