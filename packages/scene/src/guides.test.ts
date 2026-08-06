import { describe, expect, it } from "vitest";
import { collectSnapGuides, measureEqualSpacing, snapFrame } from "./guides";

describe("smart guides", () => {
  it("snaps an element center to the slide center within tolerance", () => {
    const result = snapFrame(
      { x: 532, y: 200, width: 200, height: 120 },
      collectSnapGuides({ width: 1280, height: 720 }, [], []),
      { tolerance: 10 }
    );

    expect(result.frame.x).toBe(540);
    expect(result.matches.some((match) => match.kind === "canvas-center-x")).toBe(true);
  });

  it("collects safe-area, sibling, baseline and custom guides deterministically", () => {
    const guides = collectSnapGuides(
      { width: 1280, height: 720 },
      [{ id: "title", frame: { x: 72, y: 64, width: 500, height: 120 }, baseline: 148 }],
      [{ id: "custom-x", axis: "x", position: 96 }],
      { safeArea: { top: 48, right: 64, bottom: 48, left: 64 } }
    );

    expect(guides.map((guide) => guide.kind)).toEqual(expect.arrayContaining([
      "safe-left",
      "safe-right",
      "sibling-left",
      "sibling-center-x",
      "text-baseline",
      "custom"
    ]));
    expect(guides.map((guide) => guide.id)).toEqual([...guides.map((guide) => guide.id)].sort());
  });

  it("prefers the closest guide and reports the snapped anchor", () => {
    const result = snapFrame(
      { x: 96, y: 94, width: 100, height: 80 },
      [
        { id: "far", axis: "y", position: 90, kind: "custom" },
        { id: "near", axis: "y", position: 95, kind: "custom" }
      ],
      { tolerance: 8 }
    );

    expect(result.frame.y).toBe(95);
    expect(result.matches[0]).toMatchObject({ guideId: "near", target: "start", delta: 1 });
  });

  it("rejects invalid safe areas and custom guides outside the canvas", () => {
    expect(() => collectSnapGuides(
      { width: 1280, height: 720 },
      [],
      [{ id: "outside", axis: "x", position: 1400 }]
    )).toThrow(/canvas/i);
    expect(() => collectSnapGuides(
      { width: 1280, height: 720 },
      [],
      [],
      { safeArea: { top: 400, right: 700, bottom: 400, left: 700 } }
    )).toThrow(/safe area/i);
  });

  it("does not report equal spacing when elements overlap", () => {
    expect(measureEqualSpacing([
      { id: "a", frame: { x: 0, y: 0, width: 100, height: 60 } },
      { id: "b", frame: { x: 80, y: 0, width: 100, height: 60 } },
      { id: "c", frame: { x: 160, y: 0, width: 100, height: 60 } }
    ], "horizontal", 0.25)).toBeUndefined();
  });

  it("detects equal horizontal spacing for temporary measurement labels", () => {
    expect(measureEqualSpacing([
      { id: "a", frame: { x: 20, y: 20, width: 80, height: 60 } },
      { id: "b", frame: { x: 120, y: 20, width: 80, height: 60 } },
      { id: "c", frame: { x: 220, y: 20, width: 80, height: 60 } }
    ], "horizontal", 0.25)).toEqual({ axis: "horizontal", gap: 20, elementIds: ["a", "b", "c"] });
  });
});
