import { describe, expect, it } from "vitest";

import { DiagramSpecSchema, type DiagramLayoutStrategy, type DiagramSpec } from "./diagram-spec";
import { layoutDiagram } from "./layout";

function processSpec(layout: DiagramLayoutStrategy): DiagramSpec {
  return DiagramSpecSchema.parse({
    question: "How does the workflow progress?",
    title: "The workflow advances through four controlled stages",
    accessibleSummary: "Prepare, validate, analyze and publish in sequence.",
    intent: "process",
    layout,
    direction: "left-to-right",
    nodes: [
      { id: "prepare", label: "Chuẩn bị dữ liệu", kind: "step", ports: [] },
      { id: "validate", label: "Kiểm tra tính hợp lệ", kind: "step", ports: [] },
      { id: "analyze", label: "Phân tích kết quả", kind: "step", ports: [] },
      { id: "publish", label: "Xuất bản báo cáo", kind: "step", ports: [] }
    ],
    edges: [
      { id: "prepare-validate", source: { nodeId: "prepare" }, target: { nodeId: "validate" }, kind: "sequence" },
      { id: "validate-analyze", source: { nodeId: "validate" }, target: { nodeId: "analyze" }, kind: "sequence" },
      { id: "analyze-publish", source: { nodeId: "analyze" }, target: { nodeId: "publish" }, kind: "sequence" }
    ],
    generatedLayout: null,
    manualOverrides: [],
    accessibleTraversalOrder: ["prepare", "validate", "analyze", "publish"],
    edgeRouting: "orthogonal",
    evidence: { status: "illustrative", sourceIds: [], label: "Dữ liệu fixture minh hoạ" }
  });
}

describe("layoutDiagram", () => {
  it.each(["tree", "radial", "timeline", "matrix", "cycle"] as const)(
    "lays out %s deterministically inside the requested bounds",
    (strategy) => {
      const spec = processSpec(strategy);
      const bounds = { x: 0, y: 0, width: 1080, height: 520 };
      const first = layoutDiagram(spec, bounds);
      const second = layoutDiagram(spec, bounds);

      expect(first).toEqual(second);
      expect(first.ok).toBe(true);
      if (!first.ok) throw new Error(first.diagnostics[0]?.message);
      expect(first.strategy).toBe(strategy);
      expect(first.nodes).toHaveLength(4);
      for (const node of first.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(bounds.x);
        expect(node.y).toBeGreaterThanOrEqual(bounds.y);
        expect(node.x + node.width).toBeLessThanOrEqual(bounds.width);
        expect(node.y + node.height).toBeLessThanOrEqual(bounds.height);
        expect(node.width).toBeGreaterThanOrEqual(node.measuredTextWidth);
      }
    }
  );

  it("uses manual overrides without mutating generated positions", () => {
    const spec = DiagramSpecSchema.parse({
      ...processSpec("manual"),
      generatedLayout: {
        strategy: "tree",
        nodes: [
          { nodeId: "prepare", x: 40, y: 40, width: 180, height: 80 },
          { nodeId: "validate", x: 280, y: 40, width: 180, height: 80 },
          { nodeId: "analyze", x: 520, y: 40, width: 180, height: 80 },
          { nodeId: "publish", x: 760, y: 40, width: 180, height: 80 }
        ],
        edges: [
          {
            edgeId: "prepare-validate",
            points: [{ x: 220, y: 80 }, { x: 280, y: 80 }]
          },
          {
            edgeId: "validate-analyze",
            points: [{ x: 460, y: 80 }, { x: 520, y: 80 }]
          },
          {
            edgeId: "analyze-publish",
            points: [{ x: 700, y: 80 }, { x: 760, y: 80 }]
          }
        ]
      },
      manualOverrides: [{ nodeId: "validate", x: 300, y: 180 }]
    });

    const result = layoutDiagram(spec, { x: 0, y: 0, width: 1080, height: 520 });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.nodes.find((node) => node.nodeId === "validate")).toMatchObject({
      x: 300,
      y: 180
    });
    expect(spec.generatedLayout?.nodes.find((node) => node.nodeId === "validate")).toMatchObject({
      x: 280,
      y: 40
    });
  });

  it("returns an actionable does-not-fit diagnostic instead of clipping", () => {
    const spec = DiagramSpecSchema.parse({
      ...processSpec("matrix"),
      nodes: Array.from({ length: 12 }, (_, index) => ({
        id: `node-${index}`,
        label: `Nhãn tiếng Việt rất dài cho thành phần số ${index + 1}`,
        kind: "step" as const,
        ports: []
      })),
      edges: [],
      accessibleTraversalOrder: Array.from({ length: 12 }, (_, index) => `node-${index}`)
    });

    const result = layoutDiagram(spec, { x: 0, y: 0, width: 420, height: 200 });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected layout failure");
    expect(result.diagnostics[0]).toMatchObject({
      code: "diagram-does-not-fit",
      recommendation: expect.stringMatching(/tách|giảm|canvas/i)
    });
  });

  it("rejects a directed cycle when tree layout is requested", () => {
    const spec = DiagramSpecSchema.parse({
      ...processSpec("tree"),
      edges: [
        ...processSpec("tree").edges,
        {
          id: "publish-prepare",
          source: { nodeId: "publish" },
          target: { nodeId: "prepare" },
          kind: "sequence"
        }
      ]
    });

    const result = layoutDiagram(spec, { x: 0, y: 0, width: 1080, height: 520 });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "graph-cycle" })]
    });
  });

  it("routes typed ports from their declared node sides", () => {
    const base = processSpec("manual");
    const spec = DiagramSpecSchema.parse({
      ...base,
      nodes: [
        {
          id: "prepare",
          label: "Prepare",
          kind: "step",
          ports: [{ id: "bottom-out", direction: "out", side: "bottom" }]
        },
        {
          id: "validate",
          label: "Validate",
          kind: "step",
          ports: [{ id: "top-in", direction: "in", side: "top" }]
        }
      ],
      edges: [
        {
          id: "prepare-validate",
          source: { nodeId: "prepare", portId: "bottom-out" },
          target: { nodeId: "validate", portId: "top-in" },
          kind: "sequence"
        }
      ],
      generatedLayout: {
        strategy: "tree",
        nodes: [
          { nodeId: "prepare", x: 100, y: 40, width: 160, height: 80 },
          { nodeId: "validate", x: 100, y: 220, width: 160, height: 80 }
        ],
        edges: [
          {
            edgeId: "prepare-validate",
            points: [{ x: 180, y: 120 }, { x: 180, y: 220 }]
          }
        ]
      },
      accessibleTraversalOrder: ["prepare", "validate"]
    });

    const result = layoutDiagram(spec, { x: 0, y: 0, width: 500, height: 400 });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.edges[0]?.points[0]).toEqual({ x: 180, y: 120 });
    expect(result.edges[0]?.points.at(-1)).toEqual({ x: 180, y: 220 });
  });

  it("routes edges from node boundaries and reports no collisions", () => {
    const result = layoutDiagram(processSpec("tree"), {
      x: 0,
      y: 0,
      width: 1080,
      height: 520
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.edges).toHaveLength(3);
    expect(result.edges[0]?.points.length).toBeGreaterThanOrEqual(2);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "node-collision")).toBe(false);
  });
});
