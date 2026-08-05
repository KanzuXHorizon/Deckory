import { describe, expect, it } from "vitest";
import { calculatePreviewScale } from "./deck-thumbnail";

describe("scaled slide preview", () => {
  it("fits the fixed 16:9 canvas inside both width- and height-constrained containers", () => {
    expect(calculatePreviewScale(640, 360)).toBe(0.5);
    expect(calculatePreviewScale(640, 240)).toBeCloseTo(1 / 3);
    expect(calculatePreviewScale(320, 720)).toBe(0.25);
  });

  it("never emits an invalid or negative scale while a container is being measured", () => {
    expect(calculatePreviewScale(0, 0)).toBe(0);
    expect(calculatePreviewScale(-20, 360)).toBe(0);
    expect(calculatePreviewScale(Number.NaN, 360)).toBe(0);
  });
});
