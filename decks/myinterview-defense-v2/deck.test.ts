import { describe, expect, it } from "vitest";
import { myInterviewDefense } from "@deckory/myinterview-defense";
import { evaluateV2MigrationAcceptance } from "@deckory/templates";
import { myInterviewDefenseV2, myInterviewDefenseV2MigrationDiagnostics } from "./deck.js";

const expectedSlideIds = [
  "cover", "member-hao", "member-minh", "member-quynh", "member-hoang", "member-thu",
  "topic", "current-state-gap", "solution", "architecture", "ai-scoring",
  "data-responsible-ai", "implementation", "testing-evidence", "limitations-roadmap",
  "conclusion", "demo", "appendix-backend", "appendix-state-machines", "appendix-rubric",
  "appendix-auth-data", "appendix-voice", "appendix-deployment-stack"
];

describe("MyInterview Defense V2", () => {
  it("preserves all 23 story beats, assets, roster and migration acceptance", () => {
    const report = evaluateV2MigrationAcceptance(myInterviewDefense, myInterviewDefenseV2, {
      requireTeamRoster: true,
      maximumRepeatedComposition: 4
    });
    expect(myInterviewDefenseV2MigrationDiagnostics).toEqual([]);
    expect(myInterviewDefenseV2.slides.map((slide) => slide.id)).toEqual(expectedSlideIds);
    expect(myInterviewDefenseV2.assets).toHaveLength(10);
    expect(report.issues, JSON.stringify(report.issues, null, 2)).toEqual([]);
  });

  it("keeps every material migrated claim explicitly illustrative until separately verified", () => {
    const evidence = myInterviewDefenseV2.visualIntelligence?.evidence;
    expect(evidence?.claims).toHaveLength(23);
    expect(evidence?.claims.every((claim) => claim.status === "illustrative")).toBe(true);
    expect(evidence?.sources[0]?.illustrativeLabel).toMatch(/V1/i);
  });
});
