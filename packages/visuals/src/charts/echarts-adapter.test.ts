import { describe, expect, it } from "vitest";

import { ChartSpecSchema } from "./chart-spec";
import {
  createEChartsRenderRequest,
  isEChartsVariant,
  resolveEChartsRenderConfig,
  type EChartsAdapter
} from "./echarts-adapter";

function scatterSpec() {
  return ChartSpecSchema.parse({
    question: "How do effort and impact relate?",
    title: "High-impact items cluster at moderate effort",
    accessibleSummary: "Three items have high impact with moderate effort.",
    variant: "scatter",
    data: [
      { id: "a", x: 3, y: 8, category: "A" },
      { id: "b", x: 5, y: 9, category: "B" }
    ],
    encoding: { xField: "x", yField: "y", categoryField: "category" },
    unit: "score",
    numberFormat: { style: "decimal", maximumFractionDigits: 0 },
    labels: { mode: "direct", showValues: false, collisionPolicy: "diagnose" },
    highlights: [],
    annotations: [],
    referenceLines: [],
    evidence: { status: "verified", sourceIds: ["prioritization"], label: "Prioritization workshop" },
    missingValuePolicy: "omit",
    animation: { mode: "fade", durationMs: 400 }
  });
}

describe("ECharts adapter boundary", () => {
  it("forces SVG and disables animation for thumbnails or reduced motion", () => {
    expect(resolveEChartsRenderConfig("thumbnail", false)).toEqual({
      renderer: "svg",
      animation: false
    });
    expect(resolveEChartsRenderConfig("final", true)).toEqual({
      renderer: "svg",
      animation: false
    });
    expect(resolveEChartsRenderConfig("final", false)).toEqual({
      renderer: "svg",
      animation: true
    });
  });

  it("creates a Deckory-owned request without raw ECharts option fields", () => {
    const request = createEChartsRenderRequest(scatterSpec(), {
      mode: "final",
      reducedMotion: false,
      themeTokenIds: ["chart.accent", "chart.grid"]
    });
    const serialized = JSON.stringify(request);

    expect(request).toMatchObject({
      renderer: "svg",
      animation: true,
      spec: { variant: "scatter" }
    });
    expect(serialized).not.toContain("seriesOption");
    expect(serialized).not.toContain("xAxisOption");
    expect(serialized).not.toContain("setOption");
  });

  it("rejects native editorial variants at the advanced adapter boundary", () => {
    const editorial = ChartSpecSchema.parse({
      ...scatterSpec(),
      variant: "horizontal-bar",
      data: [{ id: "a", category: "A", value: 10 }],
      encoding: { categoryField: "category", valueField: "value", zeroBaseline: true }
    });

    expect(isEChartsVariant("scatter")).toBe(true);
    expect(isEChartsVariant("horizontal-bar")).toBe(false);
    expect(() =>
      createEChartsRenderRequest(editorial, {
        mode: "final",
        reducedMotion: false,
        themeTokenIds: []
      })
    ).toThrow(/editorial|ECharts/i);
  });

  it("defines an SVG-result interface that hides vendor payloads", async () => {
    const adapter: EChartsAdapter = {
      id: "fixture-echarts-svg",
      version: "6.x",
      supportedVariants: ["scatter"],
      async renderSvg(request) {
        return {
          svg: `<svg data-variant="${request.spec.variant}"></svg>`,
          accessibleSummary: request.spec.accessibleSummary,
          warnings: []
        };
      }
    };

    const result = await adapter.renderSvg(
      createEChartsRenderRequest(scatterSpec(), {
        mode: "export",
        reducedMotion: true,
        themeTokenIds: []
      })
    );

    expect(result.svg).toContain("data-variant=\"scatter\"");
    expect(result).not.toHaveProperty("option");
  });
});
