import { describe, expect, it } from "vitest";
import type { DeckDocumentV2 } from "@deckory/schema";
import { applySceneCommand } from "./commands.js";

const deck: DeckDocumentV2 = {
  schemaVersion: 2,
  id: "command-fixture",
  revision: 1,
  title: "Command fixture",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  slides: [{
    id: "cover",
    name: "Cover",
    background: { layers: [] },
    elements: [
      { id: "title", name: "Title", kind: "text", frame: { x: 72, y: 64, width: 720, height: 140 }, zIndex: 1, content: { text: "Deckory" }, accessibility: { label: "Deckory" } },
      { id: "hero", name: "Hero", kind: "shape", frame: { x: 820, y: 90, width: 320, height: 420 }, zIndex: 2, content: { shape: "rectangle" }, accessibility: { decorative: true } }
    ]
  }]
};

describe("scene commands", () => {
  it("moves multiple elements as one transaction", () => {
    const result = applySceneCommand(deck, {
      type: "transform-elements",
      slideId: "cover",
      changes: [
        { elementId: "title", frame: { x: 90, y: 64, width: 720, height: 140 } },
        { elementId: "hero", frame: { x: 800, y: 90, width: 320, height: 420 } }
      ]
    });
    expect(result.deck.revision).toBe(2);
    expect(result.inverse.type).toBe("transform-elements");
    expect(result.deck.slides[0]!.elements[0]!.frame.x).toBe(90);
    expect(deck.slides[0]!.elements[0]!.frame.x).toBe(72);
  });

  it("applies the inverse to restore the original deck", () => {
    const result = applySceneCommand(deck, {
      type: "patch-element",
      slideId: "cover",
      elementId: "title",
      patch: { name: "Primary title" }
    });
    const restored = applySceneCommand(result.deck, result.inverse);
    expect(restored.deck.slides[0]!.elements[0]!.name).toBe("Title");
  });

  it("rejects duplicate inserted IDs with an actionable diagnostic", () => {
    expect(() => applySceneCommand(deck, {
      type: "insert-elements",
      slideId: "cover",
      elements: [{ id: "title", name: "Duplicate", kind: "text", frame: { x: 0, y: 0, width: 100, height: 50 }, zIndex: 4, content: { text: "Duplicate" }, accessibility: { label: "Duplicate" } }]
    })).toThrow(/đã tồn tại/i);
  });

  it("rejects missing element IDs", () => {
    expect(() => applySceneCommand(deck, {
      type: "delete-elements",
      slideId: "cover",
      elementIds: ["missing"]
    })).toThrow(/không tồn tại/i);
  });
});
