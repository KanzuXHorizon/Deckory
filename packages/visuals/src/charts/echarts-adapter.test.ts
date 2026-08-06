import { describe, expect, it } from "vitest";
import { advancedChartVariants } from "./chart-spec";
import { advancedChartFixtures } from "./advanced-fixtures";
import {
  assertNoRemoteReferences,
  isEChartsVariant,
  resolveEChartsRenderConfig,
  toEChartsOption
} from "./echarts-adapter";

describe("advanced ECharts adapter", () => {
  it("exposes the reviewed advanced-variant boundary to renderer and audit consumers", () => {
    expect(advancedChartVariants.every((variant) => isEChartsVariant(variant))).toBe(true);
    expect(isEChartsVariant("horizontal-bar")).toBe(false);
  });

  it("maps a Deckory sankey spec without exposing raw document or remote fields", () => {
    const spec = advancedChartFixtures.sankey;
    const option = toEChartsOption(spec);
    expect(option.series).toEqual([expect.objectContaining({ type: "sankey" })]);
    expect(JSON.stringify(option)).not.toContain("http://");
    expect(JSON.stringify(option)).not.toContain("sourceIds");
  });

  it("forces SVG rendering and disables animation for thumbnail/export/reduced motion", () => {
    expect(resolveEChartsRenderConfig("thumbnail", false, 700)).toEqual({ renderer: "svg", animation: false, animationDuration: 0 });
    expect(resolveEChartsRenderConfig("export", false, 700)).toEqual({ renderer: "svg", animation: false, animationDuration: 0 });
    expect(resolveEChartsRenderConfig("final", true, 700)).toEqual({ renderer: "svg", animation: false, animationDuration: 0 });
    expect(resolveEChartsRenderConfig("final", false, 700)).toEqual({ renderer: "svg", animation: true, animationDuration: 700 });
  });

  it("translates every public advanced variant with a valid fixture", () => {
    expect(Object.keys(advancedChartFixtures).sort()).toEqual([...advancedChartVariants].sort());
    for (const variant of advancedChartVariants) {
      const spec = advancedChartFixtures[variant];
      const option = toEChartsOption(spec, undefined, {
        mode: "thumbnail",
        ...(variant === "choropleth" || variant === "proportional-symbol-map" ? { mapName: "local-map" } : {})
      });
      expect(option.series, variant).toBeTruthy();
      expect(JSON.stringify(option), variant).not.toMatch(/https?:\/\//i);
    }
  });

  it("requires local map registration for geographic variants", () => {
    expect(() => toEChartsOption(advancedChartFixtures.choropleth)).toThrow(/local map/i);
    expect(() => toEChartsOption(advancedChartFixtures["proportional-symbol-map"])).toThrow(/local map/i);
  });

  it("rejects remote references recursively", () => {
    expect(() => assertNoRemoteReferences({ series: [{ dataUrl: "https://example.com/data.json" }] })).toThrow(/remote/i);
    expect(() => assertNoRemoteReferences({ series: [{ dataUrl: "file:///tmp/data.json" }] })).toThrow(/remote/i);
  });
});
