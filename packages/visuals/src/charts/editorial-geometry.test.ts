import { describe, expect, it } from "vitest";

import { ChartSpecSchema, type ChartSpec } from "./chart-spec";
import {
  buildEditorialChartGeometry,
  editorialChartVariants
} from "./editorial-geometry";

function barSpec(values: Array<number | null> = [95, 88]): ChartSpec {
  return ChartSpecSchema.parse({
    question: "Which dimension leads?",
    title: "Visual hierarchy leads",
    accessibleSummary: "Visual hierarchy leads the scorecard.",
    variant: "horizontal-bar",
    data: [
      { id: "visual", category: "Visual hierarchy", value: values[0] ?? null },
      { id: "layout", category: "Layout", value: values[1] ?? null }
    ],
    encoding: { categoryField: "category", valueField: "value", zeroBaseline: true },
    unit: "points",
    numberFormat: { style: "decimal", maximumFractionDigits: 0 },
    labels: { mode: "direct", showValues: true, collisionPolicy: "diagnose" },
    highlights: [{ datumId: "visual", level: "primary", label: "Strongest" }],
    annotations: [],
    referenceLines: [],
    evidence: { status: "verified", sourceIds: ["review"], label: "Review" },
    missingValuePolicy: "gap",
    animation: { mode: "zero-to-value", durationMs: 600 }
  });
}

describe("editorial chart geometry", () => {
  it("builds direct labels and one highlighted horizontal bar", () => {
    const result = buildEditorialChartGeometry(barSpec(), {
      x: 0,
      y: 0,
      width: 640,
      height: 320
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.marks).toHaveLength(2);
    expect(result.marks[0]).toMatchObject({
      kind: "rect",
      datumId: "visual",
      primaryHighlight: true
    });
    expect(result.labels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ datumId: "visual", text: "Visual hierarchy" }),
        expect.objectContaining({ datumId: "visual", text: "95" })
      ])
    );
  });

  it("places a truthful zero baseline between negative and positive values", () => {
    const result = buildEditorialChartGeometry(barSpec([-20, 40]), {
      x: 0,
      y: 0,
      width: 600,
      height: 260
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.baseline.x).toBeGreaterThan(0);
    expect(result.baseline.x).toBeLessThan(600);
    const negative = result.marks.find((mark) => mark.datumId === "visual");
    const positive = result.marks.find((mark) => mark.datumId === "layout");
    expect(negative).toMatchObject({ direction: "negative" });
    expect(positive).toMatchObject({ direction: "positive" });
  });

  it("emits a gap diagnostic instead of converting missing values to zero", () => {
    const result = buildEditorialChartGeometry(barSpec([95, null]), {
      x: 0,
      y: 0,
      width: 640,
      height: 320
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.marks).toHaveLength(1);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "missing-value-gap", datumId: "layout" })
    );
  });

  it("computes cumulative waterfall starts and ends", () => {
    const spec = ChartSpecSchema.parse({
      ...barSpec(),
      variant: "waterfall",
      data: [
        { id: "start", category: "Start", value: 100, role: "total" },
        { id: "gain", category: "Gain", value: 40, role: "delta" },
        { id: "cost", category: "Cost", value: -20, role: "delta" },
        { id: "end", category: "End", value: 120, role: "total" }
      ],
      highlights: []
    });
    const result = buildEditorialChartGeometry(spec, {
      x: 0,
      y: 0,
      width: 720,
      height: 360
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.marks.map((mark) => [mark.datumId, mark.startValue, mark.endValue])).toEqual([
      ["start", 0, 100],
      ["gain", 100, 140],
      ["cost", 140, 120],
      ["end", 0, 120]
    ]);
  });

  it("declares all common editorial variants and repeats deterministically", () => {
    expect(editorialChartVariants).toEqual([
      "horizontal-bar",
      "vertical-bar",
      "grouped-bar",
      "stacked-bar",
      "line",
      "area",
      "dot-plot",
      "lollipop",
      "bullet",
      "slope",
      "waterfall"
    ]);
    const spec = barSpec();
    const bounds = { x: 0, y: 0, width: 640, height: 320 };
    expect(JSON.stringify(buildEditorialChartGeometry(spec, bounds))).toBe(
      JSON.stringify(buildEditorialChartGeometry(spec, bounds))
    );
  });
});
