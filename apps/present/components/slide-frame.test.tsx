import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Slide } from "@deckory/schema";
import { SlideFrame } from "./slide-frame";

const dataSlide: Slide = {
  id: "quality-signal",
  layout: "data",
  variant: "spotlight",
  components: [
    {
      id: "heading",
      type: "heading",
      morphId: "quality-title",
      effect: { type: "wipe", duration: 0.4 },
      props: { title: "Khả năng tiếp cận đang dẫn đầu" }
    },
    {
      id: "chart",
      type: "chart",
      props: {
        title: "Điểm chất lượng",
        unit: "điểm / 100",
        values: [
          { label: "Khả năng đọc", value: 88 },
          { label: "Khả năng tiếp cận", value: 96, highlight: true }
        ]
      }
    },
    {
      id: "insight",
      type: "insight",
      props: {
        label: "KẾT LUẬN",
        title: "Khả năng tiếp cận đang dẫn đầu",
        description: "Cao hơn khả năng đọc 8 điểm.",
        metric: "+8",
        tone: "teal"
      }
    }
  ]
};

describe("SlideFrame", () => {
  it("renders semantic component slots and an accessible chart summary", () => {
    const html = renderToStaticMarkup(
      <SlideFrame slide={dataSlide} deckId="deckory-story" sequenceStep={0} reducedMotion />
    );

    expect(html).toContain("slide--data");
    expect(html).toContain("slide--spotlight");
    expect(html).toContain("component-slot--insight");
    expect(html).toContain('role="img"');
    expect(html).toContain("Khả năng đọc: 88");
    expect(html).toContain('role="note"');
    expect(html).toContain('data-effect="wipe"');
    expect(html).toContain('data-morph-id="deckory-story--quality-title"');
  });

  it("keeps unrevealed sequence content inaccessible and disables motion for thumbnails", () => {
    const slide: Slide = {
      id: "sequence-slide",
      layout: "statement",
      components: [{
        id: "statement",
        type: "statement",
        sequence: 2,
        effect: { type: "blur", delay: 0.2 },
        props: { quote: "Nội dung xuất hiện theo nhịp kể." }
      }]
    };

    const hiddenHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={1} reducedMotion={false} />
    );
    const thumbnailHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={0} reducedMotion={false} motionDisabled />
    );

    expect(hiddenHtml).toContain('aria-hidden="true"');
    expect(hiddenHtml).toContain('data-visible="false"');
    expect(hiddenHtml).toContain("pointer-events:none");
    expect(thumbnailHtml).toContain('data-motion-disabled="true"');
    expect(thumbnailHtml).toContain('data-visible="true"');
  });
});
