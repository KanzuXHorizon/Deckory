import type { Slide } from "@deckory/schema";
import { SlideFrame } from "./slide-frame";

export function DeckThumbnail({ slide, label }: { slide: Slide; label?: string }) {
  return (
    <div className="deck-thumbnail" aria-label={label ?? `Xem trước slide ${slide.id}`}>
      <div className="deck-thumbnail-canvas">
        <SlideFrame slide={slide} sequenceStep={Number.MAX_SAFE_INTEGER} reducedMotion />
      </div>
    </div>
  );
}
