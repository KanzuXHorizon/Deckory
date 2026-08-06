import { describe, expect, it } from "vitest";
import { beginGestureTransaction, cancelGestureTransaction, commitGestureTransaction, createNudgeCommand, toLogicalDelta } from "./gesture-transaction";

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

  it("cancels without producing a history command", () => {
    const transaction = beginGestureTransaction("cover", frames);
    expect(cancelGestureTransaction(transaction)).toEqual({ frames, commands: [] });
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
