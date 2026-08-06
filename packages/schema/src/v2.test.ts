import { describe, expect, it } from "vitest";
import { DeckDocumentV2Schema, ElementConstraintsSchema, SceneElementSchema } from "./v2";

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

  it("persists an explicit positive aspect ratio and authoritative axis", () => {
    expect(ElementConstraintsSchema.parse({
      width: "fixed",
      height: "hug",
      aspectRatio: { value: 16 / 9, preserve: "width" }
    })).toMatchObject({
      aspectRatio: { value: 16 / 9, preserve: "width" }
    });
  });

  it("rejects invalid aspect-ratio constraints", () => {
    expect(() => ElementConstraintsSchema.parse({ aspectRatio: { value: 0, preserve: "width" } })).toThrow();
    expect(() => ElementConstraintsSchema.parse({ aspectRatio: { value: Number.NaN, preserve: "height" } })).toThrow();
    expect(() => ElementConstraintsSchema.parse({ aspectRatio: { value: 1.5, preserve: "diagonal" } })).toThrow();
  });

  it("accepts independent grid padding and alignment while preserving numeric padding compatibility", () => {
    const common = {
      id: "grid",
      name: "Grid",
      kind: "grid" as const,
      frame: { x: 40, y: 40, width: 800, height: 500 },
      zIndex: 1,
      accessibility: { label: "Grid" }
    };

    const independent = SceneElementSchema.parse({
      ...common,
      content: {
        columns: 3,
        rows: 2,
        columnGap: 24,
        rowGap: 16,
        padding: [12, 20, 28, 36],
        align: "center"
      }
    });
    expect(independent.kind).toBe("grid");
    if (independent.kind === "grid") {
      expect(independent.content.padding).toEqual([12, 20, 28, 36]);
      expect(independent.content.align).toBe("center");
    }

    const compatible = SceneElementSchema.parse({
      ...common,
      content: { columns: 2, columnGap: 8, rowGap: 8, padding: 24 }
    });
    expect(compatible.kind).toBe("grid");
    if (compatible.kind === "grid") expect(compatible.content.align).toBe("stretch");
  });
});
