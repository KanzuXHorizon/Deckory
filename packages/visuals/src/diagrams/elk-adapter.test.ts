import { describe, expect, it } from "vitest";

import { DiagramSpecSchema } from "./diagram-spec";
import {
  createElkLayoutRequest,
  type ElkLayoutAdapter
} from "./elk-adapter";
import { measureDiagramNodes } from "./measure";

function layeredSpec() {
  return DiagramSpecSchema.parse({
    question: "How are services connected?",
    title: "Requests flow through three architecture layers",
    accessibleSummary: "The client calls the API, which calls the service and database.",
    intent: "architecture",
    layout: "elk-layered",
    direction: "left-to-right",
    nodes: [
      { id: "client", label: "Client", kind: "external", ports: [] },
      { id: "api", label: "API Gateway", kind: "service", ports: [] },
      { id: "service", label: "Evaluation Service", kind: "service", ports: [] },
      { id: "database", label: "Database", kind: "database", ports: [] }
    ],
    edges: [
      { id: "client-api", source: { nodeId: "client" }, target: { nodeId: "api" }, kind: "request" },
      { id: "api-service", source: { nodeId: "api" }, target: { nodeId: "service" }, kind: "request" },
      { id: "service-db", source: { nodeId: "service" }, target: { nodeId: "database" }, kind: "dependency" }
    ],
    generatedLayout: null,
    manualOverrides: [],
    accessibleTraversalOrder: ["client", "api", "service", "database"],
    edgeRouting: "orthogonal",
    evidence: { status: "verified", sourceIds: ["architecture-doc"], label: "Architecture documentation" }
  });
}

describe("ELK adapter boundary", () => {
  it("creates a measured Deckory request without raw ELK payload fields", () => {
    const spec = layeredSpec();
    const measuredNodes = measureDiagramNodes(spec);
    const request = createElkLayoutRequest(spec, measuredNodes, {
      x: 0,
      y: 0,
      width: 1080,
      height: 520
    });
    const serialized = JSON.stringify(request);

    expect(request).toMatchObject({
      strategy: "elk-layered",
      direction: "left-to-right",
      routing: "orthogonal"
    });
    expect(request.nodes.every((node) => node.width >= node.measuredTextWidth)).toBe(true);
    expect(serialized).not.toContain("elkGraph");
    expect(serialized).not.toContain("layoutOptions");
    expect(serialized).not.toContain("org.eclipse.elk");
  });

  it("rejects invalid bounds and ambiguous node measurements", () => {
    const spec = layeredSpec();
    const measured = measureDiagramNodes(spec);

    expect(() =>
      createElkLayoutRequest(spec, measured, {
        x: 0,
        y: 0,
        width: 0,
        height: 520
      })
    ).toThrow(/bounds/i);

    expect(() =>
      createElkLayoutRequest(spec, [...measured, { ...measured[0]! }], {
        x: 0,
        y: 0,
        width: 1080,
        height: 520
      })
    ).toThrow(/duplicate measurement/i);

    expect(() =>
      createElkLayoutRequest(spec, measured.slice(1), {
        x: 0,
        y: 0,
        width: 1080,
        height: 520
      })
    ).toThrow(/missing measurement|thiếu measurement/i);
  });

  it("rejects non-ELK strategies at the adapter boundary", () => {
    const spec = DiagramSpecSchema.parse({ ...layeredSpec(), layout: "tree" });

    expect(() =>
      createElkLayoutRequest(spec, measureDiagramNodes(spec), {
        x: 0,
        y: 0,
        width: 1080,
        height: 520
      })
    ).toThrow(/ELK|tree/i);
  });

  it("defines a layout result interface independent of ELK response objects", async () => {
    const spec = layeredSpec();
    const adapter: ElkLayoutAdapter = {
      id: "fixture-elk",
      version: "0.10.x",
      supportedStrategies: ["elk-layered"],
      async layout(request) {
        return {
          nodes: request.nodes.map((node, index) => ({
            nodeId: node.nodeId,
            x: 40 + index * 220,
            y: 120,
            width: node.width,
            height: node.height
          })),
          edges: request.edges.map((edge, index) => ({
            edgeId: edge.edgeId,
            points: [
              { x: 200 + index * 220, y: 160 },
              { x: 260 + index * 220, y: 160 }
            ]
          })),
          warnings: []
        };
      }
    };
    const request = createElkLayoutRequest(
      spec,
      measureDiagramNodes(spec),
      { x: 0, y: 0, width: 1080, height: 520 }
    );
    const result = await adapter.layout(request);

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(3);
    expect(result).not.toHaveProperty("elkGraph");
  });
});
