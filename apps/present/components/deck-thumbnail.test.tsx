import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Slide } from "@deckory/schema";
import { DeckThumbnail, ScaledSlidePreview } from "./deck-thumbnail";

const slide: Slide = {
  id: "preview",
  layout: "cover",
  components: [{ id: "heading", type: "heading", props: { title: "Deckory preview" } }]
};

describe("ScaledSlidePreview", () => {
  it("exports a reusable fixed-canvas preview for presenter and overview surfaces", () => {
    const html = renderToStaticMarkup(
      <ScaledSlidePreview
        slide={slide}
        deckId="deckory-story"
        sequenceStep={0}
        className="next-slide-preview-canvas"
      />
    );

    expect(html).toContain("scaled-slide-preview");
    expect(html).toContain("next-slide-preview-canvas");
    expect(html).toContain('data-motion-disabled="true"');
  });

  it("lets Studio opt into motion without changing static thumbnail behavior", () => {
    const animated = renderToStaticMarkup(
      <ScaledSlidePreview
        slide={slide}
        deckId="deckory-story"
        sequenceStep={0}
        motionDisabled={false}
        reducedMotion={false}
        previewKey="replay-1"
      />
    );
    const thumbnail = renderToStaticMarkup(<DeckThumbnail slide={slide} />);

    expect(animated).not.toContain('data-motion-disabled="true"');
    expect(thumbnail).toContain('data-motion-disabled="true"');
  });
});
