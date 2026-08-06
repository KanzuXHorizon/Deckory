import { describe, expect, it } from "vitest";
import type { DeckDocumentV2 } from "@deckory/schema/v2";
import { applySceneCommand } from "@deckory/scene";
import {
  analyzeTextForVisuals,
  createTextToVisualCommand,
  resolveElementEvidenceLineage
} from "./visual-assistant-v2";

const deck: DeckDocumentV2 = {
  schemaVersion: 2,
  id: "assistant-fixture",
  revision: 1,
  title: "Assistant fixture",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  visualIntelligence: {
    evidence: {
      sources: [{ id: "source-1", kind: "manual", label: "Local fixture", status: "verified" }],
      evidence: [{ id: "evidence-1", sourceId: "source-1", label: "Test result" }],
      claims: [{
        id: "claim-1",
        text: "Quy trình có bốn bước.",
        slideId: "workflow",
        elementId: "workflow-text",
        evidenceIds: ["evidence-1"],
        status: "supported"
      }],
      datasets: [{
        id: "workflow-data",
        label: "Workflow steps",
        sourceIds: ["source-1"],
        status: "verified",
        columns: [{ key: "step", label: "Step", type: "string" }],
        rows: [{ step: "Thiết lập hồ sơ" }, { step: "Tạo phiên" }]
      }],
      visualBindings: [{
        id: "workflow-binding",
        kind: "diagram",
        slideId: "workflow",
        elementId: "workflow-text",
        datasetId: "workflow-data",
        claimIds: ["claim-1"]
      }]
    }
  },
  slides: [{
    id: "workflow",
    name: "Workflow",
    background: { layers: [] },
    elements: [{
      id: "workflow-text",
      name: "Workflow text",
      kind: "text",
      frame: { x: 72, y: 120, width: 920, height: 360 },
      zIndex: 1,
      content: { text: "Thiết lập hồ sơ. Tạo phiên. Thực hành. Nhận phản hồi." },
      accessibility: { label: "Quy trình thực hành" }
    }]
  }]
};

describe("Studio V2 visual assistant", () => {
  it("recommends an explainable linear process without inventing chart data", () => {
    const result = analyzeTextForVisuals(deck.slides[0]!.elements[0]!.kind === "text"
      ? deck.slides[0]!.elements[0]!.content.text
      : "");

    expect(result.analysis.primary).toBe("process");
    expect(result.analysis.extractedSteps).toHaveLength(4);
    expect(result.recommendations[0]?.componentId).toBe("linear-process");
    expect(result.recommendations.some((item) => item.family === "chart")).toBe(false);
    expect(result.recommendations[0]?.reasons.length).toBeGreaterThan(0);
  });

  it("converts process text to an editable native diagram while preserving source text", () => {
    const result = createTextToVisualCommand(deck, "workflow", "workflow-text", "linear-process");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const next = applySceneCommand(deck, result.command).deck;
    const source = next.slides[0]!.elements.find((element) => element.id === "workflow-text");
    const visual = next.slides[0]!.elements.find((element) => element.id === "workflow-text-visual");

    expect(source).toMatchObject({ kind: "text", hidden: true });
    expect(source?.kind === "text" ? source.content.text : "").toContain("Thiết lập hồ sơ");
    expect(visual?.kind).toBe("diagram");
    if (visual?.kind === "diagram") {
      expect(visual.content.diagram.nodes.map((node) => node.label)).toEqual([
        "Thiết lập hồ sơ",
        "Tạo phiên",
        "Thực hành",
        "Nhận phản hồi"
      ]);
      expect(visual.content.diagram.evidence.status).toBe("illustrative");
      expect(visual.content.diagram.evidence.label).toContain("Chuyển đổi từ source text");
    }
  });

  it("returns missing-input diagnostics for unsupported recommendation application", () => {
    const result = createTextToVisualCommand(deck, "workflow", "workflow-text", "comparison-matrix");
    expect(result).toMatchObject({ ok: false, code: "recommendation-not-applicable" });
  });

  it("resolves selected-element claim, evidence, source and dataset lineage", () => {
    const lineage = resolveElementEvidenceLineage(deck, "workflow", "workflow-text");
    expect(lineage.bindings.map((binding) => binding.id)).toEqual(["workflow-binding"]);
    expect(lineage.claims.map((claim) => claim.id)).toEqual(["claim-1"]);
    expect(lineage.evidence.map((record) => record.id)).toEqual(["evidence-1"]);
    expect(lineage.sources.map((source) => source.id)).toEqual(["source-1"]);
    expect(lineage.datasets.map((dataset) => dataset.id)).toEqual(["workflow-data"]);
  });
});
