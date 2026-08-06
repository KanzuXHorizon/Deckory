import { describe, expect, it } from "vitest";

import { visualCatalog } from "./catalog";
import {
  advancedChartVariants,
  editorialChartVariants
} from "./charts/chart-spec";
import {
  requiredDiagramVisualIds,
  requiredSemanticVisualIds,
  validateVisualCoverageInventory,
  visualCoverageCatalog,
  visualFixtureInventory
} from "./inventory";

describe("visual coverage inventory", () => {
  it("covers every public chart variant exactly once", () => {
    const expected = [...editorialChartVariants, ...advancedChartVariants].sort();
    const actual = visualCoverageCatalog
      .filter((entry) => entry.kind === "chart")
      .map((entry) => entry.publicId)
      .sort();

    expect(actual).toEqual(expected);
    for (const entry of visualCoverageCatalog.filter((item) => item.kind === "chart")) {
      expect(entry.requiredInputs).toContain("numeric-data");
      expect(entry.evidenceRequirements).toContain("numeric-evidence");
      expect(entry.rendererCapability).toBe(
        (editorialChartVariants as readonly string[]).includes(entry.publicId)
          ? "deckory-native"
          : "echarts-adapter"
      );
    }
  });

  it("covers every required diagram visual family with a deterministic or adapter layout", () => {
    const actual = visualCoverageCatalog
      .filter((entry) => entry.kind === "diagram")
      .map((entry) => entry.publicId)
      .sort();

    expect(actual).toEqual([...requiredDiagramVisualIds].sort());
    for (const entry of visualCoverageCatalog.filter((item) => item.kind === "diagram")) {
      expect(entry.defaultLayout).toMatch(
        /^(tree|radial|timeline|matrix|cycle|manual|elk-layered|elk-force)$/
      );
      expect(entry.requiredInputs.length).toBeGreaterThan(0);
      expect(entry.accessibility.summaryStrategy).not.toHaveLength(0);
    }
  });

  it("covers every required semantic component with native metadata", () => {
    const semanticEntries = visualCoverageCatalog.filter(
      (entry) => entry.kind === "editorial" || entry.kind === "composition"
    );

    expect(semanticEntries.map((entry) => entry.publicId).sort()).toEqual(
      [...requiredSemanticVisualIds].sort()
    );
    for (const entry of semanticEntries) {
      expect(entry.rendererCapability).toBe("deckory-native");
      expect(entry.requiredInputs.length).toBeGreaterThan(0);
      expect(entry.evidenceRequirements.length).toBeGreaterThan(0);
      expect(entry.exportCapabilities).toContain("pptx");
    }
  });

  it("declares complete use, avoid, density, accessibility and export metadata", () => {
    for (const entry of visualCoverageCatalog) {
      expect(entry.fixtureId).not.toHaveLength(0);
      expect(entry.useWhen.length).toBeGreaterThan(0);
      expect(entry.avoidWhen.length).toBeGreaterThan(0);
      expect(entry.density.minItems).toBeLessThanOrEqual(entry.density.maxItems);
      expect(entry.accessibility.summaryStrategy).not.toHaveLength(0);
      expect(entry.accessibility.traversalStrategy).not.toHaveLength(0);
      expect(entry.exportCapabilities.length).toBeGreaterThan(0);
    }
  });

  it("provides one stable fixture record for every coverage entry and base catalog fixture", () => {
    const fixtureIds = visualFixtureInventory.map((fixture) => fixture.fixtureId);
    const publicKeys = new Set(
      visualFixtureInventory.map((fixture) => `${fixture.kind}:${fixture.publicId}`)
    );

    expect(new Set(fixtureIds).size).toBe(fixtureIds.length);
    for (const entry of visualCoverageCatalog) {
      expect(publicKeys.has(`${entry.kind}:${entry.publicId}`)).toBe(true);
    }
    for (const entry of visualCatalog) {
      expect(fixtureIds).toContain(entry.fixtureId);
    }
    for (const fixture of visualFixtureInventory) {
      expect(fixture.dataStatus).toBe("illustrative");
      expect(fixture.visibleEvidenceLabel).toMatch(/fixture|illustrative|minh hoạ/i);
      expect(fixture.unitCoverage.length).toBeGreaterThan(0);
      expect(fixture.browserReview).toBe("required-after-integration");
    }
  });

  it("returns no inventory diagnostics and exposes no vendor payload contract", () => {
    const result = validateVisualCoverageInventory(
      visualCoverageCatalog,
      visualFixtureInventory
    );
    const serialized = JSON.stringify({ visualCoverageCatalog, visualFixtureInventory });

    expect(result).toEqual({ ok: true, diagnostics: [] });
    expect(serialized).not.toContain("seriesOption");
    expect(serialized).not.toContain("echartsOption");
    expect(serialized).not.toContain("elkGraph");
    expect(serialized).not.toContain("layoutOptions");
  });

  it("reports a fixture that is not owned by coverage or the base catalog", () => {
    const result = validateVisualCoverageInventory(
      visualCoverageCatalog,
      [
        ...visualFixtureInventory,
        {
          fixtureId: "orphan-fixture",
          publicId: "unknown-visual",
          kind: "diagram",
          locale: "en-US",
          dataStatus: "illustrative",
          visibleEvidenceLabel: "Illustrative fixture data",
          unitCoverage: ["schema"],
          browserReview: "required-after-integration"
        }
      ]
    );

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "orphan-fixture", recordId: "orphan-fixture" })
    );
  });

  it("is byte-for-byte deterministic across repeated inventory validation", () => {
    expect(
      JSON.stringify(
        validateVisualCoverageInventory(
          visualCoverageCatalog,
          visualFixtureInventory
        )
      )
    ).toBe(
      JSON.stringify(
        validateVisualCoverageInventory(
          visualCoverageCatalog,
          visualFixtureInventory
        )
      )
    );
  });
});
