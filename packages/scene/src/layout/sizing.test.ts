import { describe, expect, it } from "vitest";
import { resolveCoupledSize, resolveSizingPolicy } from "./sizing";

describe("layout sizing policies", () => {
  it("uses intrinsic size for hug-content within declared bounds", () => {
    expect(resolveSizingPolicy({
      policy: { mode: "hug-content", min: 80, max: 240 },
      fixedSize: 120,
      intrinsicSize: 190,
      availableSize: 400
    })).toEqual({ ok: true, value: 190 });
  });

  it("uses available space for fill-container without exceeding maximum", () => {
    expect(resolveSizingPolicy({
      policy: { mode: "fill-container", min: 100, max: 300 },
      fixedSize: 120,
      intrinsicSize: 180,
      availableSize: 420
    })).toEqual({ ok: true, value: 300 });
  });

  it("preserves an aspect ratio when one axis is authoritative", () => {
    expect(resolveCoupledSize({
      width: { mode: "fixed", value: 240, aspectRatio: 16 / 9 },
      height: { mode: "hug-content" },
      fixedSize: { width: 240, height: 120 },
      intrinsicSize: { width: 200, height: 160 },
      availableSize: { width: 600, height: 400 }
    })).toEqual({ ok: true, value: { width: 240, height: 135 } });
  });

  it("rejects an aspect-ratio result that violates the dependent-axis minimum", () => {
    const result = resolveCoupledSize({
      width: { mode: "fixed", value: 240, aspectRatio: 2 },
      height: { mode: "hug-content", min: 150 },
      fixedSize: { width: 240, height: 160 },
      intrinsicSize: { width: 240, height: 160 },
      availableSize: { width: 600, height: 400 }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics[0]?.code).toBe("sizing-minimum-does-not-fit");
  });

  it("rejects fill when available space is below the declared minimum", () => {
    const result = resolveSizingPolicy({
      policy: { mode: "fill-container", min: 180 },
      fixedSize: 120,
      intrinsicSize: 140,
      availableSize: 120
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics[0]?.code).toBe("sizing-minimum-does-not-fit");
  });
});
