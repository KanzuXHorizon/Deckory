import { describe, expect, it } from "vitest";

import {
  detectCompositionRepetition,
  fingerprintSlideComposition,
  type SlideCompositionInput
} from "./composition-fingerprint";

function repeatedSlide(id: string): SlideCompositionInput {
  return {
    slideId: id,
    layoutMode: "split",
    dominantVisualFamily: "image",
    relationship: "text-image",
    occupiedRegions: ["left", "right"],
    scaleHierarchy: ["hero", "support"],
    elementFrames: [
      { x: 64, y: 80, width: 520, height: 540 },
      { x: 640, y: 80, width: 576, height: 540 }
    ]
  };
}

describe("composition fingerprints", () => {
  it("detects five consecutive slides with the same composition fingerprint", () => {
    const diagnostics = detectCompositionRepetition([
      repeatedSlide("one"),
      repeatedSlide("two"),
      repeatedSlide("three"),
      repeatedSlide("four"),
      repeatedSlide("five")
    ]);

    expect(diagnostics[0]).toMatchObject({
      code: "composition-sequence-repeated",
      count: 5,
      slideIds: ["one", "two", "three", "four", "five"]
    });
  });

  it("does not collapse visually distinct freeform slides into one fingerprint", () => {
    const editorial = fingerprintSlideComposition({
      slideId: "editorial",
      layoutMode: "freeform",
      dominantVisualFamily: "image",
      relationship: "text-image",
      occupiedRegions: ["top-left", "bottom-right"],
      scaleHierarchy: ["hero", "caption"],
      elementFrames: [
        { x: 48, y: 42, width: 740, height: 520 },
        { x: 848, y: 510, width: 320, height: 120 }
      ]
    });
    const collage = fingerprintSlideComposition({
      slideId: "collage",
      layoutMode: "freeform",
      dominantVisualFamily: "image",
      relationship: "text-image",
      occupiedRegions: ["top-left", "bottom-right"],
      scaleHierarchy: ["hero", "caption"],
      elementFrames: [
        { x: 48, y: 42, width: 340, height: 240 },
        { x: 420, y: 100, width: 340, height: 240 },
        { x: 790, y: 300, width: 340, height: 240 }
      ]
    });

    expect(editorial.key).not.toBe(collage.key);
  });

  it("returns stable fingerprints independent of input region ordering", () => {
    const first = fingerprintSlideComposition({
      ...repeatedSlide("first"),
      occupiedRegions: ["right", "left"]
    });
    const second = fingerprintSlideComposition(repeatedSlide("second"));

    expect(first.key).toBe(second.key);
  });
});
