import { describe, expect, it } from "vitest";

import { ChartSpecSchema, type ChartSpec } from "./chart-spec";

function baseChart(): ChartSpec {
  return ChartSpecSchema.parse({
    question: "Which quality dimension is strongest?",
    title: "Visual hierarchy leads the scorecard",
    accessibleSummary: "Visual hierarchy scores 95, ahead of layout at 88.",
    variant: "horizontal-bar",
    data: [
      { id: "visual", category: "Visual hierarchy", value: 95 },
      { id: "layout", category: "Layout", value: 88 }
    ],
    encoding: {
      categoryField: "category",
      valueField: "value",
      zeroBaseline: true
    },
    unit: "points",
    numberFormat: { style: "decimal", maximumFractionDigits: 0 },
    labels: { mode: "direct", showValues: true, collisionPolicy: "diagnose" },
    highlights: [{ datumId: "visual", level: "primary", label: "Strongest" }],
    annotations: [],
    referenceLines: [],
    evidence: {
      status: "verified",
      sourceIds: ["quality-review"],
      label: "Quality review, 2026-08-01"
    },
    missingValuePolicy: "gap",
    animation: { mode: "zero-to-value", durationMs: 600 }
  });
}

describe("ChartSpecSchema", () => {
  it("requires question, unit, summary and evidence", () => {
    expect(() =>
      ChartSpecSchema.parse({
        variant: "horizontal-bar",
        title: "Điểm chất lượng",
        data: [{ id: "layout", category: "Layout", value: 92 }]
      })
    ).toThrow(/question|summary|unit|evidence/i);
  });

  it("rejects more than one primary highlight", () => {
    const chart = baseChart();

    expect(() =>
      ChartSpecSchema.parse({
        ...chart,
        highlights: [
          { datumId: "visual", level: "primary", label: "One" },
          { datumId: "layout", level: "primary", label: "Two" }
        ]
      })
    ).toThrow(/primary highlight/i);
  });

  it("requires variant-specific data fields", () => {
    const chart = baseChart();

    expect(() =>
      ChartSpecSchema.parse({
        ...chart,
        variant: "scatter",
        data: [{ id: "point", category: "A", value: 10 }],
        encoding: { xField: "x", yField: "y" }
      })
    ).toThrow(/x.*y|scatter/i);
  });

  it("keeps illustrative chart evidence visibly labelled", () => {
    const chart = baseChart();

    expect(() =>
      ChartSpecSchema.parse({
        ...chart,
        evidence: { status: "illustrative", sourceIds: [] }
      })
    ).toThrow(/illustrative.*label/i);
  });

  it("rejects raw vendor payload keys in the public contract", () => {
    const chart = baseChart();

    expect(() =>
      ChartSpecSchema.parse({
        ...chart,
        option: { series: [{ type: "bar" }] }
      })
    ).toThrow();
    expect(JSON.stringify(chart)).not.toContain("seriesOption");
    expect(JSON.stringify(chart)).not.toContain("echartsOption");
  });

  it("accepts a local geographic asset reference without a remote URL", () => {
    const chart = baseChart();
    const parsed = ChartSpecSchema.parse({
      ...chart,
      variant: "choropleth",
      data: [{ id: "hcm", category: "Hồ Chí Minh", value: 42, geographyKey: "VN-SG" }],
      encoding: { geographyField: "geographyKey", valueField: "value" },
      highlights: [],
      animation: { mode: "fade", durationMs: 400 },
      localGeoAssetId: "vn-provinces-geojson"
    });

    expect(parsed.localGeoAssetId).toBe("vn-provinces-geojson");
    expect(JSON.stringify(parsed)).not.toContain("http://");
    expect(JSON.stringify(parsed)).not.toContain("https://");
  });
});
