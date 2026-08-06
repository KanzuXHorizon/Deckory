import type { DeckAsset, Slide } from "@deckory/schema";

export type LegacyRenderableSlide = {
  version: 1;
  slide: Slide;
  assets?: readonly DeckAsset[];
};

export function renderableSlideFromV1(slide: Slide, assets?: readonly DeckAsset[]): LegacyRenderableSlide {
  return assets ? { version: 1, slide, assets } : { version: 1, slide };
}
