import { describe, expect, it } from "vitest";
import { slideRecipes, visualStyles } from "@deckory/templates";
import { validateDeck, type DeckDocument } from "@deckory/schema";
import {
  applyVisualStyle,
  createSlideFromRecipe,
  customizeDeckTheme,
  filterStudioRecipes
} from "./studio-template-intelligence";

const sourceDeck: DeckDocument = {
  id: "template-studio",
  version: 1,
  title: "Template Studio",
  locale: "vi-VN",
  themeId: "deckory-editorial",
  theme: {
    preset: "editorial-light",
    accent: "cobalt",
    typography: "editorial",
    density: "comfortable"
  },
  slides: [{
    id: "cover",
    layout: "cover",
    components: [{ id: "heading", type: "heading", props: { title: "Mở đầu" } }]
  }]
};

describe("Studio template intelligence", () => {
  it("searches Vietnamese without accents and respects recipe category", () => {
    const results = filterStudioRecipes(slideRecipes, "xu huong", "data");

    expect(results.map((recipe) => recipe.id)).toContain("trend-over-time");
    expect(results.every((recipe) => recipe.category === "data")).toBe(true);
  });

  it("creates a valid editable slide with a stable unique ID and recipe motion", () => {
    const recipe = slideRecipes.find((candidate) => candidate.id === "trend-over-time")!;
    const slide = createSlideFromRecipe(recipe, ["trend-over-time", "trend-over-time-2"]);
    const result = validateDeck({ ...sourceDeck, slides: [...sourceDeck.slides, slide] });

    expect(slide.id).toBe("trend-over-time-3");
    expect(slide.layout).toBe("data");
    expect(slide.transition).toEqual(recipe.transition);
    expect(slide.components.map((component) => component.id)).toEqual(recipe.components.map((component) => component.id));
    expect(slide.components.find((component) => component.type === "heading")).toMatchObject({
      type: "heading",
      props: { title: recipe.name, description: recipe.purpose }
    });
    expect(slide.components.find((component) => component.type === "chart")).toMatchObject({
      type: "chart",
      props: { variant: "line" }
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("applies a visual style without mutating the catalog object", () => {
    const style = visualStyles.find((candidate) => candidate.id === "technical-precision")!;
    const styled = applyVisualStyle(sourceDeck, style);

    expect(styled.themeId).toBe("technical-precision");
    expect(styled.theme).toEqual(style.theme);
    expect(styled.theme).not.toBe(style.theme);
    expect(sourceDeck.theme?.accent).toBe("cobalt");
  });

  it("customizes only safe theme tokens and keeps a stable custom theme ID", () => {
    const first = customizeDeckTheme(sourceDeck, { accent: "amber", density: "compact" });
    const second = customizeDeckTheme(first, { typography: "modern" });

    expect(first.themeId).toBe("deckory-editorial-custom");
    expect(second.themeId).toBe("deckory-editorial-custom");
    expect(second.theme).toEqual({
      preset: "editorial-light",
      accent: "amber",
      typography: "modern",
      density: "compact"
    });
    expect(validateDeck(second)).toMatchObject({ ok: true });
  });
});
