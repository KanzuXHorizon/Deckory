import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Slide } from "@deckory/schema";
import { AudienceView } from "./presenter";

const slide: Slide = {
  id: "audience-contract",
  layout: "cover",
  notes: "Ghi chú riêng không được xuất hiện ở màn hình khán giả.",
  components: [
    {
      id: "heading",
      type: "heading",
      props: { title: "Audience chỉ hiển thị nội dung trình chiếu" }
    }
  ]
};

describe("AudienceView", () => {
  it("keeps speaker notes private while exposing a discoverable fullscreen control", () => {
    const html = renderToStaticMarkup(
      <AudienceView
        slide={slide}
        deckId="deckory-story"
        sequenceStep={0}
        blackout={false}
        reducedMotion
        direction={1}
        themeClassName="deck-theme--editorial"
        isFullscreen={false}
        fullscreenSupported
        onToggleFullscreen={async () => "entered"}
      />
    );

    expect(html).toContain("audience-stage");
    expect(html).toContain("audience-utility");
    expect(html).toContain("Bật toàn màn hình");
    expect(html).toContain(">F<");
    expect(html).not.toContain(slide.notes);
    expect(html).not.toContain("speaker-note-copy");
  });
});
