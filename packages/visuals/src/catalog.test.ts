import { describe, expect, it } from "vitest";

import { validateVisualCatalog, visualCatalog } from "./catalog";

describe("visual catalog", () => {
  it("contains unique, complete and inspectable metadata", () => {
    const result = validateVisualCatalog(visualCatalog);

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(new Set(visualCatalog.map((entry) => entry.id)).size).toBe(visualCatalog.length);

    for (const entry of visualCatalog) {
      expect(entry.fixtureId).not.toHaveLength(0);
      expect(entry.useWhen.length).toBeGreaterThan(0);
      expect(entry.avoidWhen.length).toBeGreaterThan(0);
      expect(entry.accessibility.summaryStrategy).not.toHaveLength(0);
      expect(entry.exportCapabilities.length).toBeGreaterThan(0);
      expect(entry.density.minItems).toBeLessThanOrEqual(entry.density.maxItems);
    }
  });

  it("requires explicit numeric evidence for every chart entry", () => {
    const chartEntries = visualCatalog.filter((entry) => entry.family === "chart");

    expect(chartEntries.length).toBeGreaterThan(0);
    for (const entry of chartEntries) {
      expect(entry.evidenceRequirements).toContainEqual(
        expect.objectContaining({ kind: "numeric-evidence", required: true })
      );
      expect(entry.requiredInputs).toContainEqual(
        expect.objectContaining({ kind: "numeric-data" })
      );
    }
  });

  it("declares adapter capabilities without exposing raw vendor payloads", () => {
    const serialized = JSON.stringify(visualCatalog);

    expect(serialized).not.toContain("seriesOption");
    expect(serialized).not.toContain("elkGraph");
    expect(
      visualCatalog.some((entry) => entry.rendererCapability === "echarts-adapter")
    ).toBe(true);
    expect(
      visualCatalog.some((entry) => entry.rendererCapability === "elk-adapter")
    ).toBe(true);
  });
});
