import type {
  DiagramDirection,
  DiagramLayoutStrategy,
  DiagramPoint,
  DiagramSpec
} from "./diagram-spec";
import type { DiagramLayoutBounds } from "./layout";
import type { MeasuredDiagramNode } from "./measure";

export type ElkLayoutStrategy = Extract<
  DiagramLayoutStrategy,
  "elk-layered" | "elk-force"
>;

export type ElkLayoutRequestNode = MeasuredDiagramNode & {
  ports: Array<{
    portId: string;
    direction: "in" | "out" | "bidirectional";
    side: "top" | "right" | "bottom" | "left" | "auto";
    semantic?: string;
  }>;
};

export type ElkLayoutRequestEdge = {
  edgeId: string;
  sourceNodeId: string;
  sourcePortId?: string;
  targetNodeId: string;
  targetPortId?: string;
  kind: string;
};

export type ElkLayoutRequest = {
  strategy: ElkLayoutStrategy;
  direction: DiagramDirection;
  routing: DiagramSpec["edgeRouting"];
  bounds: DiagramLayoutBounds;
  nodes: ElkLayoutRequestNode[];
  edges: ElkLayoutRequestEdge[];
};

export type ElkLayoutResult = {
  nodes: Array<{
    nodeId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  edges: Array<{
    edgeId: string;
    points: DiagramPoint[];
  }>;
  warnings: string[];
};

export interface ElkLayoutAdapter {
  readonly id: string;
  readonly version: string;
  readonly supportedStrategies: readonly ElkLayoutStrategy[];
  layout(request: ElkLayoutRequest): Promise<ElkLayoutResult>;
}

function isElkStrategy(
  strategy: DiagramLayoutStrategy
): strategy is ElkLayoutStrategy {
  return strategy === "elk-layered" || strategy === "elk-force";
}

export function createElkLayoutRequest(
  spec: DiagramSpec,
  measuredNodes: readonly MeasuredDiagramNode[],
  bounds: DiagramLayoutBounds
): ElkLayoutRequest {
  if (!isElkStrategy(spec.layout)) {
    throw new Error(
      `Layout ${spec.layout} thuộc Deckory deterministic core, không thuộc ELK adapter.`
    );
  }
  const measuredById = new Map(
    measuredNodes.map((node) => [node.nodeId, node])
  );
  return {
    strategy: spec.layout,
    direction: spec.direction,
    routing: spec.edgeRouting,
    bounds: { ...bounds },
    nodes: spec.nodes.map((node) => {
      const measured = measuredById.get(node.id);
      if (!measured) {
        throw new Error(`Thiếu measurement cho diagram node ${node.id}.`);
      }
      return {
        ...measured,
        lines: [...measured.lines],
        labelLines: [...measured.labelLines],
        descriptionLines: [...measured.descriptionLines],
        ports: node.ports.map((port) => ({
          portId: port.id,
          direction: port.direction,
          side: port.side,
          ...(port.semantic ? { semantic: port.semantic } : {})
        }))
      };
    }),
    edges: spec.edges.map((edge) => ({
      edgeId: edge.id,
      sourceNodeId: edge.source.nodeId,
      ...(edge.source.portId ? { sourcePortId: edge.source.portId } : {}),
      targetNodeId: edge.target.nodeId,
      ...(edge.target.portId ? { targetPortId: edge.target.portId } : {}),
      kind: edge.kind
    }))
  };
}
