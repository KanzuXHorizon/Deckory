import { describe, expect, it } from "vitest";
import { validateDeck } from "@deckory/schema";
import { deckBlueprints } from "./catalog/index.js";
import { createDeckFromTemplate } from "./instantiate.js";
import { createCompleteTemplateInput } from "./test-fixtures.js";

const styleByBlueprint: Readonly<Record<string, string>> = {
  "professional-presentation": "modern-professional",
  "executive-briefing": "executive-editorial",
  "startup-pitch": "bold-keynote",
  "product-strategy": "modern-professional",
  "quarterly-business-review": "data-briefing",
  "technical-architecture-review": "technical-precision",
  "academic-defense": "academic-defense",
  "training-workshop": "modern-professional",
  "case-study": "executive-editorial",
  "project-proposal": "executive-editorial"
};

describe("blueprint integration", () => {
  it("instantiates every blueprint into a complete valid DeckDocument", () => {
    expect(deckBlueprints).toHaveLength(10);
    for (const blueprint of deckBlueprints) {
      const styleId = styleByBlueprint[blueprint.id];
      expect(styleId, `Missing style mapping for ${blueprint.id}`).toBeTruthy();
      if (!styleId) continue;
      const result = createDeckFromTemplate(createCompleteTemplateInput(blueprint.id, styleId));
      expect(result.ok, result.ok ? "" : JSON.stringify(result.diagnostics, null, 2)).toBe(true);
      if (!result.ok) continue;
      expect(result.value.slides.length).toBeGreaterThanOrEqual(6);
      expect(result.value.slides.every((slide) => slide.components.length > 0)).toBe(true);
      expect(JSON.stringify(result.value)).not.toContain('""');
      expect(validateDeck(result.value).ok).toBe(true);
    }
  });
});
