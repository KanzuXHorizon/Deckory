import { describe, expect, it } from "vitest";
import { beginGestureTransaction, cancelGestureTransaction, commitGestureTransaction, createNudgeCommand, nudgeDeltaForKey, toLogicalDelta } from "./gesture-transaction";

const frames = {
  a: { x: 10, y: 20, width: 100, height: 80 },
  b: { x: 140, y: 20, width: 100, height: 80 }
};

describe("gesture transaction adapter", () => {
  it("converts scaled pointer delta to logical-pixel movement", () => {
    expect(toLogicalDelta({ x: 24, y: -12 }, 0.75)).toEqual({ x: 32, y: -16 });
  });

  it("commits the final multi-element frames as exactly one scene command", () => {
    const transaction = beginGestureTransaction("cover", frames);
    const result = commitGestureTransaction(transaction, {
      a: { x: 20, y: 30, width: 100, height: 80 },
      b: { x: 150, y: 30, width: 100, height: 80 }
    });

    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]).toEqual({
      type: "transform-elements",
      slideId: "cover",
      changes: [
        { elementId: "a", frame: { x: 20, y: 30, width: 100, height: 80 } },
        { elementId: "b", frame: { x: 150, y: 30, width: 100, height: 80 } }
      ]
    });
  });

  it("commits rotation with frames as one history command", () => {
    const transaction = beginGestureTransaction("cover", frames, {
      a: { rotation: 0 },
      b: { rotation: 15 }
    });
    const result = commitGestureTransaction(transaction, frames, {
      a: { rotation: 22.5 },
      b: { rotation: 37.5 }
    });

    expect(result.commands).toEqual([{
      type: "transform-elements",
      slideId: "cover",
      changes: [
        { elementId: "a", frame: frames.a, transform: { rotation: 22.5 } },
        { elementId: "b", frame: frames.b, transform: { rotation: 37.5 } }
      ]
    }]);
    expect(result.transforms).toEqual({ a: { rotation: 22.5 }, b: { rotation: 37.5 } });
  });

  it("preserves transforms when a drag supplies only final frames", () => {
    const transaction = beginGestureTransaction("cover", frames, { a: { rotation: 12 }, b: undefined });
    const result = commitGestureTransaction(transaction, {
      a: { ...frames.a, x: 20 },
      b: { ...frames.b, x: 150 }
    });

    expect(result.commands[0]?.changes[0]).not.toHaveProperty("transform");
    expect(result.commands[0]?.changes[1]).not.toHaveProperty("transform");
    expect(result.transforms).toEqual({ a: { rotation: 12 }, b: undefined });
  });

  it("rejects non-positive scale before command dispatch", () => {
    const transaction = beginGestureTransaction("cover", frames);
    expect(() => commitGestureTransaction(transaction, frames, { a: { scaleX: 0 } })).toThrow(/positive|dương/i);
  });

  it("cancels without producing a history command", () => {
    const transaction = beginGestureTransaction("cover", frames, { a: { rotation: 12 }, b: undefined });
    expect(cancelGestureTransaction(transaction)).toEqual({
      frames,
      transforms: { a: { rotation: 12 }, b: undefined },
      commands: []
    });
  });

  it("maps Arrow and Shift+Arrow to logical nudge deltas", () => {
    expect(nudgeDeltaForKey("ArrowLeft", false)).toEqual({ x: -1, y: 0 });
    expect(nudgeDeltaForKey("ArrowDown", true)).toEqual({ x: 0, y: 10 });
    expect(nudgeDeltaForKey("Enter", false)).toBeUndefined();
  });

  it("uses the same transform command path for keyboard nudge", () => {
    expect(createNudgeCommand("cover", frames, { x: 10, y: 0 })).toEqual({
      type: "transform-elements",
      slideId: "cover",
      changes: [
        { elementId: "a", frame: { x: 20, y: 20, width: 100, height: 80 } },
        { elementId: "b", frame: { x: 150, y: 20, width: 100, height: 80 } }
      ]
    });
  });
});
