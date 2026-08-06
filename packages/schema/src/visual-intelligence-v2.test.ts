import { describe, expect, it } from "vitest";
import { DeckDocumentV2Schema } from "./v2";

const chart = {
  question: "Tiêu chí nào đang dẫn đầu?",
  title: "Điểm chất lượng",
  accessibleSummary: "Visual hierarchy dẫn đầu với 95 điểm.",
  variant: "horizontal-bar" as const,
  data: [
    { id: "layout", category: "Layout", value: 88 },
    { id: "visual", category: "Visual hierarchy", value: 95 }
  ],
  encoding: { categoryField: "category", valueField: "value", zeroBaseline: true },
  unit: "điểm / 100",
  numberFormat: { style: "decimal" as const, maximumFractionDigits: 0 },
  labels: { mode: "direct" as const, showValues: true, collisionPolicy: "diagnose" as const },
  highlights: [{ datumId: "visual", level: "primary" as const }],
  annotations: [],
  referenceLines: [],
  evidence: { status: "verified" as const, sourceIds: ["source-1"] },
  missingValuePolicy: "gap" as const,
  animation: { mode: "zero-to-value" as const, durationMs: 600 }
};

const diagram = {
  question: "Dữ liệu đi qua hệ thống như thế nào?",
  title: "Luồng dữ liệu",
  accessibleSummary: "Ứng dụng gửi yêu cầu đến API rồi lưu vào cơ sở dữ liệu.",
  intent: "architecture" as const,
  layout: "tree" as const,
  direction: "left-to-right" as const,
  nodes: [
    { id: "app", label: "Ứng dụng", kind: "service" as const, ports: [{ id: "out", direction: "out" as const, side: "right" as const }] },
    { id: "api", label: "API", kind: "service" as const, ports: [{ id: "in", direction: "in" as const, side: "left" as const }, { id: "out", direction: "out" as const, side: "right" as const }] },
    { id: "db", label: "Cơ sở dữ liệu", kind: "database" as const, ports: [{ id: "in", direction: "in" as const, side: "left" as const }] }
  ],
  edges: [
    { id: "app-api", source: { nodeId: "app", portId: "out" }, target: { nodeId: "api", portId: "in" }, kind: "request" as const },
    { id: "api-db", source: { nodeId: "api", portId: "out" }, target: { nodeId: "db", portId: "in" }, kind: "data-flow" as const }
  ],
  generatedLayout: {
    strategy: "tree" as const,
    nodes: [
      { nodeId: "app", x: 20, y: 100, width: 160, height: 80 },
      { nodeId: "api", x: 260, y: 100, width: 160, height: 80 },
      { nodeId: "db", x: 500, y: 100, width: 180, height: 80 }
    ],
    edges: [
      { edgeId: "app-api", points: [{ x: 180, y: 140 }, { x: 260, y: 140 }] },
      { edgeId: "api-db", points: [{ x: 420, y: 140 }, { x: 500, y: 140 }] }
    ]
  },
  manualOverrides: [],
  accessibleTraversalOrder: ["app", "api", "db"],
  edgeRouting: "orthogonal" as const,
  evidence: { status: "verified" as const, sourceIds: ["source-1"] }
};

const validDeck = {
  schemaVersion: 2 as const,
  id: "visual-intelligence",
  revision: 1,
  title: "Visual intelligence",
  locale: "vi-VN" as const,
  canvas: { width: 1280 as const, height: 720 as const, unit: "px" as const },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  visualIntelligence: {
    narrative: {
      audience: { role: "Hội đồng", knowledgeLevel: "informed" as const, needs: ["Bằng chứng rõ"] },
      decisionOrOutcome: "Chấp thuận giải pháp",
      timeBudgetMinutes: 15,
      thesis: "Deckory biến dữ liệu có nguồn thành câu chuyện có thể kiểm chứng.",
      sections: [{ id: "proof", role: "proof" as const, objective: "Chứng minh hệ thống", slideIds: ["cover"] }],
      unresolvedQuestions: []
    },
    evidence: {
      sources: [{ id: "source-1", kind: "manual" as const, label: "Dữ liệu kiểm thử", status: "verified" as const }],
      evidence: [{ id: "evidence-1", sourceId: "source-1", label: "Kết quả kiểm thử" }],
      claims: [{ id: "claim-1", text: "Visual hierarchy đạt 95 điểm", slideId: "cover", elementId: "quality-chart", evidenceIds: ["evidence-1"], status: "supported" as const }],
      datasets: [{
        id: "quality-data",
        label: "Điểm chất lượng",
        sourceIds: ["source-1"],
        status: "verified" as const,
        columns: [{ key: "category", label: "Tiêu chí", type: "string" as const }, { key: "value", label: "Điểm", type: "number" as const }],
        rows: [{ category: "Layout", value: 88 }, { category: "Visual hierarchy", value: 95 }]
      }],
      visualBindings: [{ id: "quality-binding", kind: "chart" as const, slideId: "cover", elementId: "quality-chart", datasetId: "quality-data", claimIds: ["claim-1"] }]
    }
  },
  slides: [{
    id: "cover",
    name: "Proof",
    background: { layers: [] },
    elements: [
      {
        id: "quality-chart",
        name: "Quality chart",
        kind: "chart" as const,
        frame: { x: 60, y: 80, width: 560, height: 460 },
        zIndex: 1,
        content: { chart },
        accessibility: { label: chart.accessibleSummary }
      },
      {
        id: "data-flow",
        name: "Data flow",
        kind: "diagram" as const,
        frame: { x: 660, y: 80, width: 560, height: 460 },
        zIndex: 1,
        content: { diagram },
        accessibility: { label: diagram.accessibleSummary }
      }
    ]
  }]
};

describe("DeckDocumentV2 visual intelligence integration", () => {
  it("persists typed chart, diagram, narrative and evidence contracts", () => {
    const parsed = DeckDocumentV2Schema.parse(validDeck);
    expect(parsed.visualIntelligence?.narrative?.thesis).toContain("có thể kiểm chứng");
    expect(parsed.visualIntelligence?.evidence?.datasets[0]?.id).toBe("quality-data");
    expect(parsed.slides[0]!.elements[0]!.kind).toBe("chart");
    expect(parsed.slides[0]!.elements[1]!.kind).toBe("diagram");
  });

  it("rejects raw ECharts and ELK payload keys", () => {
    const invalidChart = structuredClone(validDeck);
    invalidChart.slides[0]!.elements[0]!.content = { chart, option: { series: [] } } as never;
    expect(() => DeckDocumentV2Schema.parse(invalidChart)).toThrow();

    const invalidDiagram = structuredClone(validDeck);
    invalidDiagram.slides[0]!.elements[1]!.content = { diagram, elkGraph: { children: [] } } as never;
    expect(() => DeckDocumentV2Schema.parse(invalidDiagram)).toThrow();
  });

  it("rejects broken evidence-domain references at the document boundary", () => {
    const invalid = structuredClone(validDeck);
    invalid.visualIntelligence.evidence.evidence[0]!.sourceId = "missing-source";
    expect(() => DeckDocumentV2Schema.parse(invalid)).toThrow(/missing-source|source không tồn tại/i);
  });
});
