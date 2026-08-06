import { describe, expect, it } from "vitest";
import { DeckDocumentV2Schema } from "@deckory/schema";
import { createCompleteTemplateInput } from "../test-fixtures.js";
import { createDeckV2FromTemplate } from "./instantiate.js";

describe("createDeckV2FromTemplate", () => {
  it("instantiates a V2 recipe with explicit frames and semantic metadata", () => {
    const input = createCompleteTemplateInput("professional-presentation", "modern-professional");
    const result = createDeckV2FromTemplate(input);
    expect(result.ok, JSON.stringify(result.ok ? [] : result.diagnostics, null, 2)).toBe(true);
    if (!result.ok) return;

    expect(result.deck.schemaVersion).toBe(2);
    expect(result.deck.slides.length).toBeGreaterThan(0);
    expect(result.deck.slides.every((slide) =>
      Boolean(slide.purpose && slide.conclusion && slide.notes) &&
      slide.elements.every((element) =>
        element.frame.width > 0 &&
        element.frame.height > 0 &&
        element.frame.x >= 0 &&
        element.frame.y >= 0 &&
        element.frame.x + element.frame.width <= 1280 &&
        element.frame.y + element.frame.height <= 720
      ))).toBe(true);
    expect(result.deck.visualIntelligence?.narrative?.thesis).toBeTruthy();
    expect(result.deck.visualIntelligence?.evidence?.claims).toHaveLength(result.deck.slides.length);
    expect(DeckDocumentV2Schema.safeParse(result.deck).success).toBe(true);
  });

  it("is deterministic for the same template input", () => {
    const input = createCompleteTemplateInput("professional-presentation", "modern-professional");
    expect(createDeckV2FromTemplate(input)).toEqual(createDeckV2FromTemplate(input));
  });

  it("preserves template diagnostics instead of producing a partial deck", () => {
    const input = createCompleteTemplateInput("professional-presentation", "modern-professional");
    const result = createDeckV2FromTemplate({ ...input, slides: [] });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
