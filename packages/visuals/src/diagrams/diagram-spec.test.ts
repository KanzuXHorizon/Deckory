import { describe, expect, it } from "vitest";

import { DiagramSpecSchema, type DiagramSpec } from "./diagram-spec";

function architectureSpec(): DiagramSpec {
  return DiagramSpecSchema.parse({
    question: "How does a request move through the system?",
    title: "Requests pass through API, service and database",
    accessibleSummary: "The API sends validated requests to the service, which reads the database.",
    intent: "architecture",
    layout: "tree",
    direction: "left-to-right",
    nodes: [
      {
        id: "api",
        label: "API Gateway",
        description: "Validates incoming requests",
        kind: "service",
        ports: [
          { id: "out", direction: "out", side: "right", semantic: "request" }
        ]
      },
      {
        id: "service",
        label: "Interview Evaluation Service",
        description: "Calculates the evaluation result",
        kind: "service",
        ports: [
          { id: "in", direction: "in", side: "left", semantic: "request" },
          { id: "data", direction: "out", side: "right", semantic: "query" }
        ]
      },
      {
        id: "database",
        label: "PostgreSQL",
        description: "Stores evaluation data",
        kind: "database",
        ports: [
          { id: "query", direction: "in", side: "left", semantic: "query" }
        ]
      }
    ],
    edges: [
      {
        id: "api-to-service",
        source: { nodeId: "api", portId: "out" },
        target: { nodeId: "service", portId: "in" },
        kind: "data-flow",
        label: "Validated request"
      },
      {
        id: "service-to-database",
        source: { nodeId: "service", portId: "data" },
        target: { nodeId: "database", portId: "query" },
        kind: "dependency",
        label: "Read/write"
      }
    ],
    generatedLayout: null,
    manualOverrides: [],
    accessibleTraversalOrder: ["api", "service", "database"],
    edgeRouting: "orthogonal",
    evidence: { status: "verified", sourceIds: ["architecture-doc"], label: "Architecture documentation" }
  });
}

describe("DiagramSpecSchema", () => {
  it("requires stable unique node and edge IDs", () => {
    const spec = architectureSpec();

    expect(() =>
      DiagramSpecSchema.parse({
        ...spec,
        nodes: [spec.nodes[0], { ...spec.nodes[1], id: "api" }]
      })
    ).toThrow(/duplicate node id/i);
    expect(() =>
      DiagramSpecSchema.parse({
        ...spec,
        edges: [spec.edges[0], { ...spec.edges[1], id: "api-to-service" }]
      })
    ).toThrow(/duplicate edge id/i);
  });

  it("rejects missing nodes and ports with actionable paths", () => {
    const spec = architectureSpec();

    expect(() =>
      DiagramSpecSchema.parse({
        ...spec,
        edges: [
          {
            ...spec.edges[0],
            target: { nodeId: "missing", portId: "in" }
          }
        ]
      })
    ).toThrow(/target node/i);
    expect(() =>
      DiagramSpecSchema.parse({
        ...spec,
        edges: [
          {
            ...spec.edges[0],
            source: { nodeId: "api", portId: "missing-port" }
          }
        ]
      })
    ).toThrow(/source port/i);
  });

  it("rejects incompatible typed port directions", () => {
    const spec = architectureSpec();

    expect(() =>
      DiagramSpecSchema.parse({
        ...spec,
        edges: [
          {
            ...spec.edges[0],
            source: { nodeId: "service", portId: "in" },
            target: { nodeId: "api", portId: "out" }
          }
        ]
      })
    ).toThrow(/source port.*out|target port.*in/i);
  });

  it("keeps generated layout and manual overrides as separate contracts", () => {
    const parsed = DiagramSpecSchema.parse({
      ...architectureSpec(),
      generatedLayout: {
        strategy: "tree",
        nodes: [
          { nodeId: "api", x: 10, y: 20, width: 160, height: 80 }
        ],
        edges: []
      },
      manualOverrides: [
        { nodeId: "api", x: 42, y: 64 }
      ]
    });

    expect(parsed.generatedLayout?.nodes[0]).toMatchObject({ x: 10, y: 20 });
    expect(parsed.manualOverrides[0]).toMatchObject({ x: 42, y: 64 });
  });

  it("rejects traversal and overrides that reference missing nodes", () => {
    const spec = architectureSpec();

    expect(() =>
      DiagramSpecSchema.parse({
        ...spec,
        accessibleTraversalOrder: ["api", "missing"]
      })
    ).toThrow(/traversal/i);
    expect(() =>
      DiagramSpecSchema.parse({
        ...spec,
        manualOverrides: [{ nodeId: "missing", x: 0, y: 0 }]
      })
    ).toThrow(/manual override/i);
  });

  it("strictly rejects raw ELK payload fields", () => {
    expect(() =>
      DiagramSpecSchema.parse({
        ...architectureSpec(),
        elkGraph: { id: "root", children: [] }
      })
    ).toThrow();
  });
});
