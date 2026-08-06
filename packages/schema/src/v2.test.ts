import { describe, expect, it } from "vitest";
import { DeckDocumentV2Schema } from "./v2.js";

const validDeck = {
  schemaVersion: 2,
  id: "scene-fixture",
  revision: 1,
  title: "Scene fixture",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  slides: [{
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
      accessibility: { label: "Deckory V2" }
    }]
  }]
};

describe("DeckDocumentV2Schema", () => {
  it("accepts an explicit scene document", () => {
    expect(DeckDocumentV2Schema.parse(validDeck).schemaVersion).toBe(2);
  });

  it("rejects non-finite geometry", () => {
    const invalid = structuredClone(validDeck);
    invalid.slides[0]!.elements[0]!.frame.x = Number.NaN;
    expect(() => DeckDocumentV2Schema.parse(invalid)).toThrow();
  });

  it("rejects duplicate element IDs within one slide", () => {
    const invalid = structuredClone(validDeck);
    invalid.slides[0]!.elements.push(structuredClone(invalid.slides[0]!.elements[0]!));
    expect(() => DeckDocumentV2Schema.parse(invalid)).toThrow(/element ID/i);
  });

  it("rejects a parent reference to a missing element", () => {
    const invalid = structuredClone(validDeck) as typeof validDeck & {
      slides: Array<{ elements: Array<(typeof validDeck.slides)[number]["elements"][number] & { parentId?: string }> }>;
    };
    invalid.slides[0]!.elements[0]!.parentId = "missing-group";
    expect(() => DeckDocumentV2Schema.parse(invalid)).toThrow(/parentId/i);
  });

  it("rejects duplicate background layer IDs", () => {
    const invalid = structuredClone(validDeck);
    invalid.slides[0]!.background.layers.push(structuredClone(invalid.slides[0]!.background.layers[0]!));
    expect(() => DeckDocumentV2Schema.parse(invalid)).toThrow(/background layer ID/i);
  });
});
