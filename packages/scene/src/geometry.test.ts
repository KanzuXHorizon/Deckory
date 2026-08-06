import { describe, expect, it } from "vitest";
import { resizeFrame, rotateTransform, translateFrame } from "./geometry.js";

describe("scene geometry", () => {
  it("translates a frame without mutating the input", () => {
    const input = { x: 10, y: 20, width: 100, height: 80 };
    const output = translateFrame(input, { x: 15, y: -5 });
    expect(output).toEqual({ x: 25, y: 15, width: 100, height: 80 });
    expect(input).toEqual({ x: 10, y: 20, width: 100, height: 80 });
  });

  it("resizes from the center while preserving ratio", () => {
    expect(resizeFrame(
      { x: 100, y: 100, width: 200, height: 100 },
      { handle: "se", deltaX: 100, deltaY: 10, keepRatio: true, fromCenter: true }
    )).toEqual({ x: 50, y: 75, width: 300, height: 150 });
  });

  it("rounds geometry to quarter pixels and normalizes negative zero", () => {
    expect(translateFrame(
      { x: -0, y: 1.12, width: 10, height: 10 },
      { x: 0, y: 0.14 }
    )).toEqual({ x: 0, y: 1.25, width: 10, height: 10 });
  });

  it("rejects non-finite geometry", () => {
    expect(() => translateFrame(
      { x: Number.NaN, y: 0, width: 10, height: 10 },
      { x: 1, y: 1 }
    )).toThrow(/finite/i);
  });

  it("rotates without mutating the original transform", () => {
    const input = { rotation: 10 };
    expect(rotateTransform(input, 22.4)).toEqual({ rotation: 32.5 });
    expect(input).toEqual({ rotation: 10 });
  });
});
