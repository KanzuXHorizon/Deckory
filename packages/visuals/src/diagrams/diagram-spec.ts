import { z } from "zod";

export const DiagramLayoutStrategySchema = z.enum([
  "elk-layered",
  "elk-force",
  "tree",
  "radial",
  "timeline",
  "matrix",
  "cycle",
  "manual"
]);
export type DiagramLayoutStrategy = z.infer<typeof DiagramLayoutStrategySchema>;

export const DiagramDirectionSchema = z.enum([
  "left-to-right",
  "right-to-left",
  "top-to-bottom",
  "bottom-to-top"
]);
export type DiagramDirection = z.infer<typeof DiagramDirectionSchema>;

export const DiagramPortSchema = z
  .object({
    id: z.string().trim().min(1),
    direction: z.enum(["in", "out", "bidirectional"]),
    side: z.enum(["top", "right", "bottom", "left", "auto"]),
    semantic: z.string().trim().min(1).optional()
  })
  .strict();
export type DiagramPort = z.infer<typeof DiagramPortSchema>;

export const DiagramNodeSchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    kind: z.enum([
      "step",
      "decision",
      "service",
      "database",
      "external",
      "person",
      "team",
      "evidence",
      "state",
      "entity",
      "group",
      "milestone"
    ]),
    parentId: z.string().trim().min(1).optional(),
    minimumWidth: z.number().finite().positive().optional(),
    minimumHeight: z.number().finite().positive().optional(),
    ports: z.array(DiagramPortSchema)
  })
  .strict()
  .superRefine((node, context) => {
    const seen = new Set<string>();
    node.ports.forEach((port, index) => {
      if (seen.has(port.id)) {
        context.addIssue({
          code: "custom",
          path: ["ports", index, "id"],
          message: `Duplicate port ID on node ${node.id}: ${port.id}.`
        });
      }
      seen.add(port.id);
    });
  });
export type DiagramNode = z.infer<typeof DiagramNodeSchema>;

export const DiagramEndpointSchema = z
  .object({
    nodeId: z.string().trim().min(1),
    portId: z.string().trim().min(1).optional()
  })
  .strict();
export type DiagramEndpoint = z.infer<typeof DiagramEndpointSchema>;

export const DiagramEdgeSchema = z
  .object({
    id: z.string().trim().min(1),
    source: DiagramEndpointSchema,
    target: DiagramEndpointSchema,
    kind: z.enum([
      "sequence",
      "request",
      "response",
      "data-flow",
      "dependency",
      "causal",
      "ownership",
      "evidence",
      "association",
      "transition"
    ]),
    label: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional()
  })
  .strict();
export type DiagramEdge = z.infer<typeof DiagramEdgeSchema>;

export const DiagramPositionedNodeSchema = z
  .object({
    nodeId: z.string().trim().min(1),
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite().positive(),
    height: z.number().finite().positive()
  })
  .strict();
export type DiagramPositionedNode = z.infer<typeof DiagramPositionedNodeSchema>;

export const DiagramPointSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite()
  })
  .strict();
export type DiagramPoint = z.infer<typeof DiagramPointSchema>;

export const DiagramRoutedEdgeSchema = z
  .object({
    edgeId: z.string().trim().min(1),
    points: z.array(DiagramPointSchema).min(2)
  })
  .strict();
export type DiagramRoutedEdge = z.infer<typeof DiagramRoutedEdgeSchema>;

export const GeneratedDiagramLayoutSchema = z
  .object({
    strategy: DiagramLayoutStrategySchema,
    nodes: z.array(DiagramPositionedNodeSchema),
    edges: z.array(DiagramRoutedEdgeSchema)
  })
  .strict();
export type GeneratedDiagramLayout = z.infer<typeof GeneratedDiagramLayoutSchema>;

export const DiagramManualOverrideSchema = z
  .object({
    nodeId: z.string().trim().min(1),
    x: z.number().finite(),
    y: z.number().finite()
  })
  .strict();
export type DiagramManualOverride = z.infer<typeof DiagramManualOverrideSchema>;

export const DiagramEvidenceSchema = z
  .object({
    status: z.enum(["verified", "unverified", "illustrative", "stale"]),
    sourceIds: z.array(z.string().trim().min(1)),
    label: z.string().trim().min(1).optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "illustrative" && !value.label) {
      context.addIssue({
        code: "custom",
        path: ["label"],
        message: "Illustrative diagram evidence requires a visible label."
      });
    }
    if (value.status !== "illustrative" && value.sourceIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["sourceIds"],
        message: "Non-illustrative diagram evidence requires at least one source ID."
      });
    }
  });
export type DiagramEvidence = z.infer<typeof DiagramEvidenceSchema>;

export const DiagramSpecSchema = z
  .object({
    question: z.string().trim().min(1),
    title: z.string().trim().min(1),
    accessibleSummary: z.string().trim().min(1),
    intent: z.enum([
      "process",
      "journey",
      "lifecycle",
      "timeline",
      "roadmap",
      "hierarchy",
      "architecture",
      "dependency",
      "network",
      "causality",
      "ownership",
      "evidence-chain",
      "state-machine",
      "entity-relationship",
      "matrix",
      "cycle"
    ]),
    layout: DiagramLayoutStrategySchema,
    direction: DiagramDirectionSchema,
    nodes: z.array(DiagramNodeSchema).min(1),
    edges: z.array(DiagramEdgeSchema),
    generatedLayout: GeneratedDiagramLayoutSchema.nullable(),
    manualOverrides: z.array(DiagramManualOverrideSchema),
    accessibleTraversalOrder: z.array(z.string().trim().min(1)),
    edgeRouting: z.enum(["orthogonal", "polyline", "straight", "spline"]),
    evidence: DiagramEvidenceSchema
  })
  .strict()
  .superRefine((spec, context) => {
    const nodeById = new Map<string, DiagramNode>();
    spec.nodes.forEach((node, index) => {
      if (nodeById.has(node.id)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index, "id"],
          message: `Duplicate node ID: ${node.id}.`
        });
      }
      nodeById.set(node.id, node);
    });

    const edgeIds = new Set<string>();
    spec.edges.forEach((edge, index) => {
      if (edgeIds.has(edge.id)) {
        context.addIssue({
          code: "custom",
          path: ["edges", index, "id"],
          message: `Duplicate edge ID: ${edge.id}.`
        });
      }
      edgeIds.add(edge.id);

      const sourceNode = nodeById.get(edge.source.nodeId);
      const targetNode = nodeById.get(edge.target.nodeId);
      if (!sourceNode) {
        context.addIssue({
          code: "custom",
          path: ["edges", index, "source", "nodeId"],
          message: `Source node does not exist: ${edge.source.nodeId}.`
        });
      }
      if (!targetNode) {
        context.addIssue({
          code: "custom",
          path: ["edges", index, "target", "nodeId"],
          message: `Target node does not exist: ${edge.target.nodeId}.`
        });
      }
      if (sourceNode && edge.source.portId) {
        const port = sourceNode.ports.find((candidate) => candidate.id === edge.source.portId);
        if (!port) {
          context.addIssue({
            code: "custom",
            path: ["edges", index, "source", "portId"],
            message: `Source port does not exist: ${edge.source.nodeId}.${edge.source.portId}.`
          });
        } else if (port.direction === "in") {
          context.addIssue({
            code: "custom",
            path: ["edges", index, "source", "portId"],
            message: `Source port must support out direction: ${edge.source.nodeId}.${edge.source.portId}.`
          });
        }
      }
      if (targetNode && edge.target.portId) {
        const port = targetNode.ports.find((candidate) => candidate.id === edge.target.portId);
        if (!port) {
          context.addIssue({
            code: "custom",
            path: ["edges", index, "target", "portId"],
            message: `Target port does not exist: ${edge.target.nodeId}.${edge.target.portId}.`
          });
        } else if (port.direction === "out") {
          context.addIssue({
            code: "custom",
            path: ["edges", index, "target", "portId"],
            message: `Target port must support in direction: ${edge.target.nodeId}.${edge.target.portId}.`
          });
        }
      }
    });

    const parentByNodeId = new Map<string, string>();
    spec.nodes.forEach((node, index) => {
      if (node.parentId && !nodeById.has(node.parentId)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index, "parentId"],
          message: `Parent node does not exist: ${node.parentId}.`
        });
      }
      if (node.parentId === node.id) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index, "parentId"],
          message: `Node cannot parent itself: ${node.id}.`
        });
      } else if (node.parentId) {
        parentByNodeId.set(node.id, node.parentId);
      }
    });

    for (const node of spec.nodes) {
      const visited = new Set<string>([node.id]);
      let parentId = parentByNodeId.get(node.id);
      while (parentId) {
        if (visited.has(parentId)) {
          context.addIssue({
            code: "custom",
            path: ["nodes"],
            message: `Parent hierarchy cycle detected from node ${node.id} through ${parentId}.`
          });
          break;
        }
        visited.add(parentId);
        parentId = parentByNodeId.get(parentId);
      }
    }

    const traversalIds = new Set<string>();
    spec.accessibleTraversalOrder.forEach((nodeId, index) => {
      if (!nodeById.has(nodeId)) {
        context.addIssue({
          code: "custom",
          path: ["accessibleTraversalOrder", index],
          message: `Traversal references missing node: ${nodeId}.`
        });
      }
      if (traversalIds.has(nodeId)) {
        context.addIssue({
          code: "custom",
          path: ["accessibleTraversalOrder", index],
          message: `Traversal contains duplicate node: ${nodeId}.`
        });
      }
      traversalIds.add(nodeId);
    });
    if (traversalIds.size !== nodeById.size) {
      const missing = [...nodeById.keys()].filter((nodeId) => !traversalIds.has(nodeId));
      context.addIssue({
        code: "custom",
        path: ["accessibleTraversalOrder"],
        message: `Traversal must contain every node exactly once; missing: ${missing.join(", ")}.`
      });
    }

    const overrideIds = new Set<string>();
    spec.manualOverrides.forEach((override, index) => {
      if (!nodeById.has(override.nodeId)) {
        context.addIssue({
          code: "custom",
          path: ["manualOverrides", index, "nodeId"],
          message: `Manual override references missing node: ${override.nodeId}.`
        });
      }
      if (overrideIds.has(override.nodeId)) {
        context.addIssue({
          code: "custom",
          path: ["manualOverrides", index, "nodeId"],
          message: `Duplicate manual override for node: ${override.nodeId}.`
        });
      }
      overrideIds.add(override.nodeId);
    });

    if (spec.generatedLayout) {
      if (spec.generatedLayout.strategy === "manual") {
        context.addIssue({
          code: "custom",
          path: ["generatedLayout", "strategy"],
          message: "Generated layout strategy cannot be manual; manual positions belong in manualOverrides."
        });
      }
      if (spec.layout !== "manual" && spec.generatedLayout.strategy !== spec.layout) {
        context.addIssue({
          code: "custom",
          path: ["generatedLayout", "strategy"],
          message: `Generated layout strategy ${spec.generatedLayout.strategy} does not match selected layout ${spec.layout}.`
        });
      }

      const generatedNodeIds = new Set<string>();
      spec.generatedLayout.nodes.forEach((node, index) => {
        if (generatedNodeIds.has(node.nodeId)) {
          context.addIssue({
            code: "custom",
            path: ["generatedLayout", "nodes", index, "nodeId"],
            message: `Duplicate generated layout node: ${node.nodeId}.`
          });
        }
        generatedNodeIds.add(node.nodeId);
        if (!nodeById.has(node.nodeId)) {
          context.addIssue({
            code: "custom",
            path: ["generatedLayout", "nodes", index, "nodeId"],
            message: `Generated layout references missing node: ${node.nodeId}.`
          });
        }
      });
      if (generatedNodeIds.size !== nodeById.size) {
        const missing = [...nodeById.keys()].filter((nodeId) => !generatedNodeIds.has(nodeId));
        context.addIssue({
          code: "custom",
          path: ["generatedLayout", "nodes"],
          message: `Generated layout must contain every node exactly once; missing node(s): ${missing.join(", ")}.`
        });
      }

      const generatedEdgeIds = new Set<string>();
      spec.generatedLayout.edges.forEach((edge, index) => {
        if (generatedEdgeIds.has(edge.edgeId)) {
          context.addIssue({
            code: "custom",
            path: ["generatedLayout", "edges", index, "edgeId"],
            message: `Duplicate generated layout edge: ${edge.edgeId}.`
          });
        }
        generatedEdgeIds.add(edge.edgeId);
        if (!edgeIds.has(edge.edgeId)) {
          context.addIssue({
            code: "custom",
            path: ["generatedLayout", "edges", index, "edgeId"],
            message: `Generated layout references missing edge: ${edge.edgeId}.`
          });
        }
      });
      if (generatedEdgeIds.size !== edgeIds.size) {
        const missing = [...edgeIds].filter((edgeId) => !generatedEdgeIds.has(edgeId));
        context.addIssue({
          code: "custom",
          path: ["generatedLayout", "edges"],
          message: `Generated layout must contain every edge exactly once; missing edge(s): ${missing.join(", ")}.`
        });
      }
    }
  });

export type DiagramSpec = z.infer<typeof DiagramSpecSchema>;
