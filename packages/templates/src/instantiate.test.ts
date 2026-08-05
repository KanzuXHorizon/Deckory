import { describe, expect, it } from "vitest";
import { validateDeck } from "@deckory/schema";
import { createDeckFromTemplate, getDeckBlueprint, getSlideRecipe, getVisualStyle } from "./instantiate.js";
import { createCompleteTemplateInput } from "./test-fixtures.js";

describe("createDeckFromTemplate", () => {
  it("creates a stable valid DeckDocument", () => {
    const input = createCompleteTemplateInput("professional-presentation", "modern-professional");
    const first = createDeckFromTemplate(input);
    const second = createDeckFromTemplate(input);
    expect(first.ok, JSON.stringify(first.ok ? [] : first.diagnostics, null, 2)).toBe(true);
    expect(second).toEqual(first);
    if (!first.ok) return;
    expect(first.value.locale).toBe("vi-VN");
    expect(first.value.version).toBe(1);
    expect(first.value.theme).toEqual(getVisualStyle("modern-professional")?.theme);
    expect(new Set(first.value.slides.map((slide) => slide.id)).size).toBe(first.value.slides.length);
    expect(validateDeck(first.value).ok).toBe(true);
  });

  it("preserves actionable template diagnostics", () => {
    const input = createCompleteTemplateInput("professional-presentation", "modern-professional");
    const result = createDeckFromTemplate({ ...input, slides: [] });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "missing-step")).toBe(true);
  });

  it("exposes typed catalog lookup helpers", () => {
    expect(getDeckBlueprint("academic-defense")?.scenario).toBe("academic");
    expect(getSlideRecipe("system-architecture")?.layout).toBe("architecture");
    expect(getVisualStyle("technical-precision")?.theme.preset).toBe("technical-clean");
  });
});
