import { describe, expect, it } from "vitest";
import type { DeckDocumentV2 } from "@deckory/schema/v2";
import { auditDeckV2, scoreDeckQualityV2 } from "./v2.js";

function chartSpec(variant: "horizontal-bar" | "scatter" = "horizontal-bar") {
  return {
    question: "Tiêu chí nào dẫn đầu?",
    title: "Điểm chất lượng",
    accessibleSummary: "Visual hierarchy dẫn đầu với 95 điểm.",
    variant,
    data: variant === "scatter"
      ? [{ id: "point", x: 10, y: 20 }]
      : [{ id: "layout", category: "Layout", value: 88 }, { id: "visual", category: "Visual hierarchy", value: 95 }],
    encoding: variant === "scatter"
      ? { xField: "x", yField: "y" }
      : { categoryField: "category", valueField: "value", zeroBaseline: true },
    unit: "điểm / 100",
    numberFormat: { style: "decimal" as const, maximumFractionDigits: 0 },
    labels: { mode: "direct" as const, showValues: true, collisionPolicy: "diagnose" as const },
    highlights: variant === "scatter" ? [] : [{ datumId: "visual", level: "primary" as const }],
    annotations: [],
    referenceLines: [],
    evidence: { status: "verified" as const, sourceIds: ["source-1"] },
    missingValuePolicy: "gap" as const,
    animation: { mode: variant === "scatter" ? "none" as const : "zero-to-value" as const, durationMs: variant === "scatter" ? 0 : 600 }
  };
}

function diagramSpec(layout: "tree" | "elk-layered" = "tree") {
  return {
    question: "Dữ liệu đi đâu?",
    title: "Luồng dữ liệu",
    accessibleSummary: "Ứng dụng gửi dữ liệu đến API.",
    intent: "architecture" as const,
    layout,
    direction: "left-to-right" as const,
    nodes: [
      { id: "app", label: "Ứng dụng", kind: "service" as const, ports: [{ id: "out", direction: "out" as const, side: "right" as const }] },
      { id: "api", label: "API", kind: "service" as const, ports: [{ id: "in", direction: "in" as const, side: "left" as const }] }
    ],
    edges: [{ id: "app-api", source: { nodeId: "app", portId: "out" }, target: { nodeId: "api", portId: "in" }, kind: "request" as const }],
    generatedLayout: layout === "tree" ? {
      strategy: "tree" as const,
      nodes: [
        { nodeId: "app", x: 20, y: 100, width: 160, height: 80 },
        { nodeId: "api", x: 260, y: 100, width: 160, height: 80 }
      ],
      edges: [{ edgeId: "app-api", points: [{ x: 180, y: 140 }, { x: 260, y: 140 }] }]
    } : null,
    manualOverrides: [],
    accessibleTraversalOrder: ["app", "api"],
    edgeRouting: "orthogonal" as const,
    evidence: { status: "verified" as const, sourceIds: ["source-1"] }
  };
}

function validDeck(): DeckDocumentV2 {
  return {
    schemaVersion: 2,
    id: "v2-audit-fixture",
    revision: 1,
    title: "V2 audit fixture",
    locale: "vi-VN",
    canvas: { width: 1280, height: 720, unit: "px" },
    theme: { id: "deckory-editorial", tokens: {} },
    assets: [],
    visualIntelligence: {
      narrative: {
        audience: { role: "Hội đồng", knowledgeLevel: "informed", needs: ["Bằng chứng rõ"] },
        decisionOrOutcome: "Chấp thuận giải pháp",
        timeBudgetMinutes: 8,
        thesis: "Một contract có evidence tạo ra deck đáng tin cậy.",
        sections: [{ id: "proof", role: "proof", objective: "Chứng minh contract", slideIds: ["proof"] }],
        unresolvedQuestions: []
      },
      evidence: {
        sources: [{ id: "source-1", kind: "manual", label: "Local fixture", status: "verified" }],
        evidence: [{ id: "evidence-1", sourceId: "source-1", label: "Quality result" }],
        claims: [{ id: "claim-1", text: "Visual hierarchy đạt 95 điểm.", slideId: "proof", elementId: "chart", evidenceIds: ["evidence-1"], status: "supported" }],
        datasets: [{
          id: "quality-data",
          label: "Quality data",
          sourceIds: ["source-1"],
          status: "verified",
          columns: [{ key: "category", label: "Category", type: "string" }, { key: "value", label: "Value", type: "number" }],
          rows: [{ category: "Layout", value: 88 }, { category: "Visual hierarchy", value: 95 }]
        }],
        visualBindings: [{ id: "chart-binding", kind: "chart", slideId: "proof", elementId: "chart", datasetId: "quality-data", claimIds: ["claim-1"] }]
      }
    },
    slides: [{
      id: "proof",
      name: "Proof",
      purpose: "evidence-and-architecture",
      conclusion: "Typed chart và diagram giữ evidence trong document.",
      notes: "Đọc kết luận, sau đó giải thích chart và luồng dữ liệu.",
      background: { layers: [{ id: "paper", type: "solid", color: "#ffffff", opacity: 1 }] },
      evidence: { source: "Local fixture", status: "verified", sourceIds: ["source-1"] },
      elements: [
        {
          id: "chart",
          name: "Chart",
          kind: "chart",
          frame: { x: 60, y: 120, width: 540, height: 420 },
          zIndex: 1,
          content: { chart: chartSpec() },
          accessibility: { label: "Visual hierarchy dẫn đầu với 95 điểm.", readingOrder: 1 },
          exportPolicy: { html: "native", svg: "native", png: "native", pdf: "native", pptx: "fallback" }
        },
        {
          id: "diagram",
          name: "Diagram",
          kind: "diagram",
          frame: { x: 660, y: 120, width: 540, height: 420 },
          zIndex: 1,
          content: { diagram: diagramSpec() },
          accessibility: { label: "Ứng dụng gửi dữ liệu đến API.", readingOrder: 2 },
          exportPolicy: { html: "native", svg: "native", png: "native", pdf: "native", pptx: "fallback" }
        }
      ]
    }]
  };
}

describe("auditDeckV2", () => {
  it("passes a complete native V2 deck and scores twenty dimensions", () => {
    const report = auditDeckV2(validDeck());
    expect(report.summary).toEqual({ passed: true, slideCount: 1, errorCount: 0, warningCount: 0 });
    expect(report.issues).toEqual([]);
    expect(report.scorecard.dimensions.map((dimension) => dimension.id)).toEqual([
      "storytelling", "ui", "ux", "visual-design", "motion-design",
      "typography", "layout", "charts", "copywriting", "accessibility",
      "interaction", "branding", "evidence", "demo-readiness", "production-quality",
      "customizability", "visual-variety", "editability", "export-fidelity", "performance"
    ]);
  });

  it("reports adapter requirements instead of treating advanced visuals as ready", () => {
    const deck = validDeck();
    const chart = deck.slides[0]!.elements[0]!;
    const diagram = deck.slides[0]!.elements[1]!;
    if (chart.kind === "chart") chart.content.chart = chartSpec("scatter");
    if (diagram.kind === "diagram") diagram.content.diagram = diagramSpec("elk-layered");

    const report = auditDeckV2(deck);
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "chart-adapter-required",
      "diagram-adapter-required"
    ]));
    expect(report.summary.passed).toBe(false);
  });

  it("detects orphaned hidden source text", () => {
    const deck = validDeck();
    deck.slides[0]!.elements.push({
      id: "source-text",
      name: "Source text",
      kind: "text",
      frame: { x: 60, y: 580, width: 500, height: 80 },
      zIndex: 1,
      hidden: true,
      content: { text: "Thiết lập hồ sơ. Tạo phiên." },
      accessibility: { label: "Source text" },
      semantic: { purpose: "visual-source-text" }
    });

    const report = auditDeckV2(deck);
    expect(report.issues).toContainEqual(expect.objectContaining({ code: "hidden-source-orphan", elementId: "source-text" }));
  });

  it("returns schema errors for broken evidence references without throwing", () => {
    const deck = validDeck();
    deck.visualIntelligence!.evidence!.evidence[0]!.sourceId = "missing-source";
    const report = auditDeckV2(deck);
    expect(report.issues.some((issue) => issue.code === "v2-schema-invalid" && issue.severity === "error")).toBe(true);
  });

  it("does not award runtime-only confidence without revision-matched evidence", () => {
    const scorecard = scoreDeckQualityV2(validDeck());
    expect(scorecard.dimensions.find((dimension) => dimension.id === "performance")).toMatchObject({
      confidence: "runtime-required",
      score: 0
    });
    expect(scorecard.dimensions.find((dimension) => dimension.id === "visual-design")?.confidence).toBe("manual-review-required");
  });

  it("unlocks runtime checks only from matching verification evidence", () => {
    const scorecard = scoreDeckQualityV2(validDeck(), {
      revision: "abc123",
      browserUi: true,
      keyboardAndZoom: true,
      visualReview: true,
      accessibility: true,
      interaction: true,
      exportComparison: true,
      performance: true,
      productionGates: true
    });
    const runtimeDimensions = scorecard.dimensions.filter((dimension) =>
      ["ui", "ux", "visual-design", "accessibility", "interaction", "production-quality", "export-fidelity", "performance"].includes(dimension.id));
    expect(runtimeDimensions.every((dimension) => dimension.score > 0)).toBe(true);
  });
});
