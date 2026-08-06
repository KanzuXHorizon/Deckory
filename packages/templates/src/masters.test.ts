import { describe, expect, it } from "vitest";
import { SUPPORTED_LAYOUTS, validateDeck, type DeckDocument, type Slide } from "@deckory/schema";
import {
  compatibleSlideMasters,
  getSlideMaster,
  recommendSlideMaster,
  slideMasters,
  visualStyles
} from "./index";

function slide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "evidence-slide",
    layout: "data",
    components: [
      { id: "heading", type: "heading", props: { title: "Kết quả cần được giải thích bằng bằng chứng." } },
      {
        id: "chart",
        type: "chart",
        props: { title: "Mức độ sẵn sàng", unit: "%", values: [{ label: "Hiện tại", value: 82 }] }
      },
      { id: "evidence", type: "evidence-footer", props: { source: "Báo cáo kiểm thử nội bộ" } }
    ],
    ...overrides
  };
}

describe("slide master intelligence", () => {
  it("covers every supported layout with at least two stable masters", () => {
    const ids = new Set(slideMasters.map((master) => master.id));

    expect(ids.size).toBe(slideMasters.length);
    for (const layout of SUPPORTED_LAYOUTS) {
      expect(slideMasters.filter((master) => master.layout === layout).length).toBeGreaterThanOrEqual(2);
    }
    expect(slideMasters.every((master) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(master.id))).toBe(true);
  });

  it("returns only masters compatible with the current semantic layout", () => {
    const compatible = compatibleSlideMasters(slide({ layout: "data" }));

    expect(compatible.length).toBeGreaterThanOrEqual(2);
    expect(compatible.every((master) => master.layout === "data")).toBe(true);
  });

  it("recommends an evidence-led master for a sourced data slide", () => {
    const style = visualStyles.find((item) => item.id === "data-briefing");
    if (!style) throw new Error("Missing data-briefing fixture");
    const recommendation = recommendSlideMaster({
      slide: slide(),
      style
    });

    expect(recommendation?.master.layout).toBe("data");
    expect(recommendation?.master.compositionFamily).toBe("evidence");
    expect(recommendation?.reasons.length).toBeGreaterThan(0);
  });

  it("avoids repeating the same composition family when a compatible alternative exists", () => {
    const previousMaster = getSlideMaster("data-analysis")!;
    const current = slide({ id: "current" });
    const previousSlides = [
      slide({ id: "previous-1", masterId: previousMaster.id }),
      slide({ id: "previous-2", masterId: previousMaster.id })
    ];

    const recommendation = recommendSlideMaster({ slide: current, previousSlides });

    expect(recommendation?.master.compositionFamily).not.toBe(previousMaster.compositionFamily);
  });

  it("produces master metadata that can be stored in a valid deck", () => {
    const master = getSlideMaster("data-analysis")!;
    const deck: DeckDocument = {
      id: "mastered-deck",
      version: 1,
      title: "Mastered deck",
      locale: "vi-VN",
      themeId: "data-briefing",
      slides: [{
        ...slide(),
        masterId: master.id,
        variant: master.variant,
        background: master.background,
        transition: master.transition
      }]
    };

    expect(validateDeck(deck)).toMatchObject({ ok: true });
  });
});
