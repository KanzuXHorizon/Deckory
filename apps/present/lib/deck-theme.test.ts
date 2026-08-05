import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import { deckThemeClassName } from "./deck-theme";

function deck(theme?: DeckDocument["theme"]): DeckDocument {
  return {
    id: "theme-test",
    version: 1,
    title: "Theme test",
    locale: "vi-VN",
    themeId: "theme-test",
    ...(theme ? { theme } : {}),
    slides: [{ id: "cover", layout: "cover", components: [{ id: "heading", type: "heading", props: { title: "Theme" } }] }]
  };
}

describe("deck theme class names", () => {
  it("maps an explicit technical deck to the renderer theme classes", () => {
    expect(deckThemeClassName(deck({
      preset: "technical-clean",
      accent: "teal",
      typography: "modern",
      density: "compact"
    }))).toBe("theme--technical-clean accent--teal type--modern density--compact");
  });

  it("uses stable editorial defaults when a deck omits optional theme data", () => {
    expect(deckThemeClassName(deck())).toBe("theme--editorial-light accent--cobalt type--editorial density--comfortable");
  });
});
