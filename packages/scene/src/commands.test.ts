import { describe, expect, it } from "vitest";
import type { DeckDocumentV2 } from "@deckory/schema";
import { applySceneCommand } from "./commands";

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

  it("persists frame and transform changes atomically and restores them through the inverse", () => {
    const rotatedDeck: DeckDocumentV2 = structuredClone(deck);
    rotatedDeck.slides[0]!.elements[0]!.transform = { rotation: 8, originX: 360, originY: 70 };

    const result = applySceneCommand(rotatedDeck, {
      type: "transform-elements",
      slideId: "cover",
      changes: [
        {
          elementId: "title",
          frame: { x: 100, y: 80, width: 700, height: 140 },
          transform: { rotation: 24, originX: 350, originY: 70 }
        },
        {
          elementId: "hero",
          frame: { x: 780, y: 100, width: 340, height: 400 }
        }
      ]
    });

    expect(result.deck.revision).toBe(rotatedDeck.revision + 1);
    expect(result.deck.slides[0]!.elements[0]!.transform?.rotation).toBe(24);
    expect(result.deck.slides[0]!.elements[1]!.transform).toBeUndefined();

    const restored = applySceneCommand(result.deck, result.inverse);
    expect(restored.deck.slides[0]!.elements[0]!.frame).toEqual(rotatedDeck.slides[0]!.elements[0]!.frame);
    expect(restored.deck.slides[0]!.elements[0]!.transform).toEqual(rotatedDeck.slides[0]!.elements[0]!.transform);
    expect(restored.deck.slides[0]!.elements[1]!.frame).toEqual(rotatedDeck.slides[0]!.elements[1]!.frame);
  });

  it("preserves an existing transform when a frame-only change omits transform", () => {
    const rotatedDeck: DeckDocumentV2 = structuredClone(deck);
    rotatedDeck.slides[0]!.elements[0]!.transform = { rotation: 12 };

    const result = applySceneCommand(rotatedDeck, {
      type: "transform-elements",
      slideId: "cover",
      changes: [{ elementId: "title", frame: { x: 96, y: 64, width: 720, height: 140 } }]
    });

    expect(result.deck.slides[0]!.elements[0]!.transform).toEqual({ rotation: 12 });
  });

  it("replaces a complete scene element collection in one reversible transaction", () => {
    const originalElements = structuredClone(deck.slides[0]!.elements);
    const groupedElements = [
      {
        id: "content-group",
        name: "Content group",
        kind: "group" as const,
        frame: { x: 60, y: 50, width: 1100, height: 500 },
        zIndex: 0,
        content: { children: ["title", "hero"] },
        accessibility: { label: "Content group" }
      },
      { ...structuredClone(originalElements[0]!), parentId: "content-group", frame: { x: 12, y: 14, width: 720, height: 140 } },
      { ...structuredClone(originalElements[1]!), parentId: "content-group", frame: { x: 760, y: 40, width: 320, height: 420 } }
    ];

    const result = applySceneCommand(deck, {
      type: "replace-scene-elements",
      slideId: "cover",
      elements: groupedElements
    });

    expect(result.deck.revision).toBe(deck.revision + 1);
    expect(result.deck.slides[0]!.elements).toEqual(groupedElements);
    expect(result.inverse.type).toBe("replace-scene-elements");

    const restored = applySceneCommand(result.deck, result.inverse);
    expect(restored.deck.slides[0]!.elements).toEqual(originalElements);
  });

  it("rejects an invalid replacement without returning a partial deck", () => {
    expect(() => applySceneCommand(deck, {
      type: "replace-scene-elements",
      slideId: "cover",
      elements: [
        { ...structuredClone(deck.slides[0]!.elements[0]!), parentId: "missing-parent" }
      ]
    })).toThrow(/không hợp lệ/i);

    expect(deck.slides[0]!.elements).toHaveLength(2);
  });
});
