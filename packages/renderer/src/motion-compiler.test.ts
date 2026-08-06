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

  it("keeps the declared from state visible before a delayed live cue begins", () => {
    const delayed: CompilerMotionTrack = {
      ...track,
      cues: [{ ...track.cues[0]!, delay: 0.5 }]
    };

    expect(resolveMotionState(delayed, { mode: "live", time: 0 })).toEqual({
      opacity: 0,
      translateY: 24,
      blur: 8
    });
  });

  it("merges final states from multiple tracks targeting the same element", () => {
    const timeline = compileMotionTimeline([
      {
        id: "claim-opacity",
        elementId: "claim",
        finalState: { opacity: 1 },
        cues: [{
          id: "claim-opacity-in",
          type: "entrance",
          trigger: "on-enter",
          duration: 0.2,
          easing: "standard",
          from: { opacity: 0 },
          to: { opacity: 1 }
        }]
      },
      {
        id: "claim-scale",
        elementId: "claim",
        finalState: { scale: 1 },
        cues: [{
          id: "claim-scale-in",
          type: "emphasis",
          trigger: "with-previous",
          duration: 0.2,
          easing: "standard",
          from: { scale: 0.95 },
          to: { scale: 1 }
        }]
      }
    ]);

    expect(timeline.finalStateByElement.claim).toEqual({ opacity: 1, scale: 1 });
  });

  it("returns the declared final state after the live timeline completes", () => {
    const emphasis: CompilerMotionTrack = {
      id: "emphasis-track",
      elementId: "claim",
      finalState: { scale: 1 },
      cues: [{
        id: "claim-pulse",
        type: "emphasis",
        trigger: "on-enter",
        duration: 0.2,
        easing: "emphasized",
        from: { scale: 1 },
        to: { scale: 1.08 }
      }]
    };

    expect(resolveMotionState(emphasis, { mode: "live", time: 1 })).toEqual({ scale: 1 });
  });

  it("reports invalid type-specific and ordering metadata at the compiler boundary", () => {
    const invalid: CompilerMotionTrack = {
      id: "invalid-track",
      elementId: "claim",
      finalState: { opacity: 1 },
      cues: [
        {
          id: "path",
          type: "path",
          trigger: "on-enter",
          duration: 0.2,
          easing: "standard",
          from: { opacity: 0 },
          to: { opacity: 1 },
          sourceOrder: Number.NaN
        },
        {
          id: "stagger",
          type: "stagger",
          trigger: "on-click",
          duration: 0.2,
          easing: "standard",
          from: { opacity: 0 },
          to: { opacity: 1 },
          clickStep: 0
        }
      ]
    };

    expect(compileMotionTimeline([invalid]).diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "motion-path-id-missing", cueId: "path" }),
      expect.objectContaining({ code: "motion-source-order-invalid", cueId: "path" }),
      expect.objectContaining({ code: "motion-group-id-missing", cueId: "stagger" }),
      expect.objectContaining({ code: "motion-click-step-invalid", cueId: "stagger" })
    ]));
  });
});
