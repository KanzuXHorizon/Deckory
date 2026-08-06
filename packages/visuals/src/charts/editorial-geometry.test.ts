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

  it("keeps a line gap disconnected instead of bridging missing evidence", () => {
    const spec = ChartSpecSchema.parse({
      ...barSpec(),
      variant: "line",
      data: [
        { id: "round-1", category: "Round 1", value: 62 },
        { id: "round-2", category: "Round 2", value: null },
        { id: "round-3", category: "Round 3", value: 84 }
      ],
      encoding: { categoryField: "category", valueField: "value", zeroBaseline: false },
      highlights: [],
      animation: { mode: "trace", durationMs: 600 }
    });
    const result = buildEditorialChartGeometry(spec, {
      x: 0,
      y: 0,
      width: 640,
      height: 320
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.marks.filter((mark) => mark.kind === "line")).toHaveLength(0);
    expect(result.marks.filter((mark) => mark.kind === "circle")).toHaveLength(2);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "missing-value-gap", datumId: "round-2" })
    );
  });

  it("honors labels mode none for grouped and stacked bars", () => {
    for (const variant of ["grouped-bar", "stacked-bar"] as const) {
      const spec = ChartSpecSchema.parse({
        ...barSpec(),
        variant,
        data: [
          { id: "a-1", category: "A", series: "Current", value: 10 },
          { id: "a-2", category: "A", series: "Target", value: 12 },
          { id: "b-1", category: "B", series: "Current", value: 8 },
          { id: "b-2", category: "B", series: "Target", value: 11 }
        ],
        labels: { mode: "none", showValues: false, collisionPolicy: "diagnose" },
        highlights: [],
        animation: { mode: "none", durationMs: 0 }
      });
      const result = buildEditorialChartGeometry(spec, {
        x: 0,
        y: 0,
        width: 640,
        height: 320
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.diagnostics[0]?.message);
      expect(result.labels).toEqual([]);
    }
  });

  it("keeps bullet targets inside the resolved numeric domain", () => {
    const spec = ChartSpecSchema.parse({
      ...barSpec([40, 55]),
      variant: "bullet",
      data: [
        { id: "visual", category: "Visual hierarchy", value: 40, target: 95 },
        { id: "layout", category: "Layout", value: 55, target: 80 }
      ],
      highlights: []
    });
    const bounds = { x: 0, y: 0, width: 640, height: 320 };
    const result = buildEditorialChartGeometry(spec, bounds);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.domain.max).toBeGreaterThanOrEqual(95);
    for (const mark of result.marks) {
      expect(mark.x).toBeGreaterThanOrEqual(bounds.x);
      expect(mark.x).toBeLessThanOrEqual(bounds.x + bounds.width);
      if (mark.x2 !== undefined) {
        expect(mark.x2).toBeGreaterThanOrEqual(bounds.x);
        expect(mark.x2).toBeLessThanOrEqual(bounds.x + bounds.width);
      }
    }
  });

  it("keeps an area baseline inside the plot when zero is not in the domain", () => {
    const spec = ChartSpecSchema.parse({
      ...barSpec([82, 88]),
      variant: "area",
      encoding: { categoryField: "category", valueField: "value", zeroBaseline: false },
      animation: { mode: "fade", durationMs: 300 },
      highlights: []
    });
    const bounds = { x: 0, y: 0, width: 640, height: 320 };
    const result = buildEditorialChartGeometry(spec, bounds);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.baseline.y).toBeGreaterThanOrEqual(bounds.y);
    expect(result.baseline.y).toBeLessThanOrEqual(bounds.y + bounds.height);
    const area = result.marks.find((mark) => mark.kind === "area");
    expect(area?.points?.every((point) =>
      point.y >= bounds.y && point.y <= bounds.y + bounds.height
    )).toBe(true);
  });

  it("builds independent slope segments for each series", () => {
    const spec = ChartSpecSchema.parse({
      ...barSpec(),
      variant: "slope",
      data: [
        { id: "a-before", category: "Before", series: "A", value: 20 },
        { id: "a-after", category: "After", series: "A", value: 45 },
        { id: "b-before", category: "Before", series: "B", value: 60 },
        { id: "b-after", category: "After", series: "B", value: 50 }
      ],
      encoding: {
        categoryField: "category",
        valueField: "value",
        seriesField: "series",
        zeroBaseline: false
      },
      animation: { mode: "fade", durationMs: 300 },
      highlights: []
    });
    const result = buildEditorialChartGeometry(spec, {
      x: 0,
      y: 0,
      width: 640,
      height: 320
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    const segments = result.marks.filter((mark) => mark.kind === "line");
    expect(segments.map((mark) => mark.datumId)).toEqual([
      "slope:A:a-before:a-after",
      "slope:B:b-before:b-after"
    ]);
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
