import { describe, expect, it } from "vitest";
import { layoutGrid, layoutStack } from "./auto-layout";

const fixed = (id: string, width: number, height: number) => ({
  id,
  frame: { x: 0, y: 0, width, height },
  width: { mode: "fixed" as const, value: width },
  height: { mode: "fixed" as const, value: height }
});

const fill = (id: string, height: number) => ({
  id,
  frame: { x: 0, y: 0, width: 1, height },
  width: { mode: "fill-container" as const, min: 80 },
  height: { mode: "fixed" as const, value: height }
});

describe("auto layout", () => {
  it("lays out a horizontal stack with deterministic padding and gaps", () => {
    const result = layoutStack({
      frame: { x: 100, y: 100, width: 600, height: 180 },
      direction: "horizontal",
      padding: { top: 20, right: 24, bottom: 20, left: 24 },
      gap: 16,
      align: "center",
      justify: "start",
      wrap: false,
      children: [fixed("a", 120, 80), fill("b", 80), fixed("c", 100, 80)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.frames.a).toEqual({ x: 124, y: 150, width: 120, height: 80 });
    expect(result.frames.b!.width).toBe(300);
    expect(result.frames.c!.x + result.frames.c!.width).toBe(676);
  });

  it("wraps fixed children into deterministic lines", () => {
    const result = layoutStack({
      frame: { x: 0, y: 0, width: 300, height: 220 },
      direction: "horizontal",
      padding: 20,
      gap: 12,
      lineGap: 16,
      align: "start",
      justify: "start",
      wrap: true,
      children: [fixed("a", 110, 60), fixed("b", 110, 60), fixed("c", 110, 60)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines).toEqual([["a", "b"], ["c"]]);
    expect(result.frames.c!.y).toBe(96);
  });

  it("lays out an explicit grid and respects row and column gaps", () => {
    const result = layoutGrid({
      frame: { x: 40, y: 60, width: 520, height: 300 },
      columns: 2,
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      columnGap: 20,
      rowGap: 16,
      align: "stretch",
      children: [fixed("a", 100, 80), fixed("b", 100, 80), fixed("c", 100, 80), fixed("d", 100, 80)]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.frames.a).toEqual({ x: 60, y: 80, width: 230, height: 122 });
    expect(result.frames.d).toEqual({ x: 310, y: 218, width: 230, height: 122 });
  });

  it("returns a diagnostic when minimum child sizes cannot fit", () => {
    const result = layoutStack({
      frame: { x: 0, y: 0, width: 240, height: 120 },
      direction: "horizontal",
      padding: 24,
      gap: 16,
      align: "start",
      justify: "start",
      wrap: false,
      children: [
        { ...fixed("a", 120, 80), width: { mode: "fixed", value: 120, min: 120 } },
        { ...fixed("b", 120, 80), width: { mode: "fixed", value: 120, min: 120 } }
      ]
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.code).toBe("auto-layout-does-not-fit");
      expect(result.diagnostics[0]?.recommendation).toMatch(/tách nội dung|tăng kích thước/i);
    }
  });
});
