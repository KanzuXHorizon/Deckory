import { describe, expect, it } from "vitest";
import type { DeckDocumentV2 } from "@deckory/schema/v2";
import { scoreDeckV2 } from "./v2-scorecard";
import type { RuntimeEvidenceKind, RuntimeEvidenceRecord } from "./runtime-evidence";

function completeDeck(): DeckDocumentV2 {
  return {
    schemaVersion: 2,
    id: "scorecard-fixture",
    revision: 7,
    title: "Scorecard fixture",
    locale: "vi-VN",
    canvas: { width: 1280, height: 720, unit: "px" },
    theme: { id: "deckory-editorial", tokens: {} },
    assets: [],
    visualIntelligence: {
      narrative: {
        audience: { role: "Hội đồng", knowledgeLevel: "informed", needs: ["Bằng chứng rõ"] },
        decisionOrOutcome: "Chấp thuận giải pháp",
        thesis: "Scene V2 giữ nội dung, evidence và khả năng chỉnh sửa trong một contract.",
        sections: [{ id: "proof", role: "proof", objective: "Chứng minh contract", slideIds: ["proof"] }],
        unresolvedQuestions: []
      }
    },
    slides: [{
      id: "proof",
      name: "Proof",
      purpose: "technical-proof",
      conclusion: "Scene V2 dùng chung cho Studio, Presenter và Export.",
      notes: "Giải thích contract và các gate runtime.",
      background: { layers: [{ id: "paper", type: "solid", color: "#ffffff", opacity: 1 }] },
      elements: [{
        id: "summary",
        name: "Summary",
        kind: "text",
        frame: { x: 80, y: 100, width: 1120, height: 180 },
        zIndex: 1,
        content: { text: "Scene V2 dùng chung cho Studio, Presenter và Export." },
        style: { color: "#17191c", fontSize: 48 },
        accessibility: { label: "Scene V2 dùng chung cho Studio, Presenter và Export.", readingOrder: 1 }
      }]
    }]
  };
}

const runtimeKinds: readonly RuntimeEvidenceKind[] = [
  "browser-ui",
  "keyboard-zoom",
  "visual-review",
  "accessibility",
  "interaction",
  "export-comparison",
  "performance",
  "production-gates"
];

function runtimeEvidence(): RuntimeEvidenceRecord[] {
  return runtimeKinds.map((kind, index) => ({
    id: `runtime-${kind}`,
    kind,
    revision: "abc123",
    documentRevision: 7,
    viewport: { width: index % 2 === 0 ? 1440 : 375, height: 900, zoom: kind === "keyboard-zoom" ? 2 : 1 },
    mode: kind === "export-comparison" ? "export" : kind === "performance" ? "presenter" : "studio",
    capturedAt: "2026-08-06T12:00:00.000Z",
    artifact: `output/evidence/${kind}.json`,
    passed: true
  }));
}

describe("scoreDeckV2", () => {
  it("returns all twenty named dimensions", () => {
    expect(scoreDeckV2(completeDeck()).dimensions.map((item) => item.id)).toEqual([
      "storytelling", "ui", "ux", "visual-design", "motion-design",
      "typography", "layout", "charts", "copywriting", "accessibility",
      "interaction", "branding", "evidence", "demo-readiness", "production-quality",
      "customizability", "visual-variety", "editability", "export-fidelity", "performance"
    ]);
  });

  it("does not award runtime-only confidence without revision-matched evidence", () => {
    const score = scoreDeckV2(completeDeck(), { revision: "abc123", runtimeEvidence: [] });
    expect(score.dimensions.find((item) => item.id === "performance")).toMatchObject({
      confidence: "manual-review-required",
      score: 0
    });
  });

  it("ignores otherwise complete evidence from another code or document revision", () => {
    const mismatched = runtimeEvidence().map((record) => ({ ...record, revision: "other-revision" }));
    const score = scoreDeckV2(completeDeck(), { revision: "abc123", runtimeEvidence: mismatched });

    expect(score.readiness).not.toBe("production-ready");
    expect(score.dimensions.find((item) => item.id === "ui")?.confidence).toBe("manual-review-required");
  });

  it("uses complete revision-matched evidence without hiding structural deductions", () => {
    const score = scoreDeckV2(completeDeck(), { revision: "abc123", runtimeEvidence: runtimeEvidence() });
    const runtimeDimensions = score.dimensions.filter((dimension) =>
      ["ui", "ux", "visual-design", "accessibility", "interaction", "production-quality", "export-fidelity", "performance"].includes(dimension.id));

    expect(runtimeDimensions.every((dimension) => dimension.confidence !== "manual-review-required")).toBe(true);
    expect(runtimeDimensions.every((dimension) => dimension.score > 0)).toBe(true);
  });
});
