import type { DeckDocument } from "@deckory/schema";

const DEFAULT_THEME = {
  preset: "editorial-light",
  accent: "cobalt",
  typography: "editorial",
  density: "comfortable"
} as const;

export function deckThemeClassName(deck: Pick<DeckDocument, "theme">): string {
  const theme = deck.theme ?? DEFAULT_THEME;

  return [
    `theme--${theme.preset}`,
    `accent--${theme.accent}`,
    `type--${theme.typography}`,
    `density--${theme.density}`
  ].join(" ");
}
