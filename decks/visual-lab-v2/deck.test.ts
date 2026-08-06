import { describe, expect, it } from "vitest";
import { evaluateV2MigrationAcceptance } from "@deckory/templates";
import { visualLabV1Fixture, visualLabV2, visualLabV2MigrationDiagnostics } from "./deck.js";

describe("Visual Lab V2", () => {
  it("preserves eleven visual QA beats and typed data lineage", () => {
    const report = evaluateV2MigrationAcceptance(visualLabV1Fixture, visualLabV2);
    expect(visualLabV2MigrationDiagnostics).toEqual([]);
    expect(visualLabV2.slides).toHaveLength(11);
    expect(visualLabV2.slides.flatMap((slide) => slide.elements).filter((element) => element.kind === "chart")).toHaveLength(4);
    expect(visualLabV2.visualIntelligence?.evidence?.datasets).toHaveLength(4);
    expect(report.issues, JSON.stringify(report.issues, null, 2)).toEqual([]);
  });
});
