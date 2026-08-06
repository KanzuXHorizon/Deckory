import { describe, expect, it } from "vitest";
import {
  orderMotionCues,
  semanticMotionPresets,
  validateMotionTrack,
  type MotionTrack
} from "./motion";

function validTrack(): MotionTrack {
  return {
    id: "argument-track",
    elementId: "claim",
    finalState: { opacity: 1, translateY: 0 },
    cues: [
      {
        id: "claim-in",
        type: "entrance",
        trigger: "on-enter",
        duration: 0.4,
        easing: "emphasized",
        from: { opacity: 0, translateY: 20 },
        to: { opacity: 1, translateY: 0 }
      }
    ]
  };
}

describe("typed motion tracks", () => {
  it("rejects an exit cue before its entrance cue", () => {
    const track = validTrack();
    track.cues = [
      {
        id: "claim-out",
        type: "exit",
        trigger: "on-enter",
        duration: 0.2,
        easing: "standard",
        from: { opacity: 1 },
        to: { opacity: 0 }
      },
      ...track.cues
    ];

    expect(validateMotionTrack(track)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "motion-exit-before-entrance" })])
    );
  });

  it("requires a final state for every animated property", () => {
    const track = validTrack();
    track.finalState = { opacity: 1 };

    expect(validateMotionTrack(track)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "motion-final-state-missing", property: "translateY" })
      ])
    );
  });

  it("orders cue groups deterministically", () => {
    const cues = [
      { ...validTrack().cues[0]!, id: "title-in", trigger: "on-enter" as const, sourceOrder: 0 },
      { ...validTrack().cues[0]!, id: "insight-in", trigger: "after-previous" as const, sourceOrder: 2 },
      { ...validTrack().cues[0]!, id: "chart-draw", type: "chart-progress" as const, trigger: "after-previous" as const, sourceOrder: 1 }
    ];

    expect(orderMotionCues(cues).map((cue) => cue.id)).toEqual([
      "title-in",
      "chart-draw",
      "insight-in"
    ]);
  });

  it("ships all eight semantic presets as typed data", () => {
    expect(Object.keys(semanticMotionPresets)).toEqual([
      "reveal-argument",
      "compare-states",
      "trace-process",
      "spotlight-evidence",
      "overview-to-detail",
      "problem-to-solution-morph",
      "chart-and-conclusion",
      "architecture-walkthrough"
    ]);
    for (const preset of Object.values(semanticMotionPresets)) {
      expect(preset.cues.length).toBeGreaterThan(0);
      expect(preset.finalStatePolicy).toBe("complete");
    }
  });
});
