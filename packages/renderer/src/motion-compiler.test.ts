import { describe, expect, it } from "vitest";
import {
  compileMotionTimeline,
  resolveMotionState,
  type CompilerMotionTrack
} from "./motion-compiler";

const track: CompilerMotionTrack = {
  id: "claim-track",
  elementId: "claim",
  finalState: { opacity: 1, translateY: 0, blur: 0 },
  cues: [
    {
      id: "claim-in",
      type: "entrance",
      trigger: "on-enter",
      duration: 0.4,
      easing: "emphasized",
      from: { opacity: 0, translateY: 24, blur: 8 },
      to: { opacity: 1, translateY: 0, blur: 0 },
      sourceOrder: 0
    }
  ]
};

describe("motion compiler", () => {
  it("resolves equivalent complete final state for reduced, thumbnail and export", () => {
    const reduced = resolveMotionState(track, { mode: "reduced", time: 0 });
    const thumbnail = resolveMotionState(track, { mode: "thumbnail", time: 0 });
    const exported = resolveMotionState(track, { mode: "export", time: 0 });

    expect(reduced).toEqual(track.finalState);
    expect(thumbnail).toEqual(reduced);
    expect(exported).toEqual(reduced);
  });

  it("orders and schedules after/with-previous cues deterministically", () => {
    const timeline = compileMotionTimeline([
      track,
      {
        id: "chart-track",
        elementId: "chart",
        finalState: { progress: 1 },
        cues: [{
          id: "chart-draw",
          type: "chart-progress",
          trigger: "after-previous",
          duration: 0.6,
          delay: 0.1,
          easing: "linear",
          from: { progress: 0 },
          to: { progress: 1 },
          sourceOrder: 1
        }]
      },
      {
        id: "insight-track",
        elementId: "insight",
        finalState: { opacity: 1 },
        cues: [{
          id: "insight-in",
          type: "entrance",
          trigger: "with-previous",
          duration: 0.3,
          easing: "standard",
          from: { opacity: 0 },
          to: { opacity: 1 },
          sourceOrder: 2
        }]
      }
    ]);

    expect(timeline.cues.map((cue) => cue.id)).toEqual(["claim-in", "chart-draw", "insight-in"]);
    expect(timeline.cues[1]!.start).toBeCloseTo(0.5);
    expect(timeline.cues[2]!.start).toBeCloseTo(timeline.cues[1]!.start);
    expect(compileMotionTimeline([track])).toEqual(compileMotionTimeline([track]));
  });

  it("returns diagnostics instead of compiling tracks without complete final state", () => {
    const invalid: CompilerMotionTrack = {
      ...track,
      finalState: { opacity: 1 }
    };

    const timeline = compileMotionTimeline([invalid]);
    expect(timeline.diagnostics).toEqual([
      expect.objectContaining({ code: "motion-final-state-missing", property: "translateY" }),
      expect.objectContaining({ code: "motion-final-state-missing", property: "blur" })
    ]);
  });
});
