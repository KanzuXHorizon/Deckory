import type {
  DiagramDirection,
  DiagramLayoutStrategy,
  DiagramPoint,
  DiagramSpec
} from "./diagram-spec";
import {
  measureDiagramNodes,
  type MeasuredDiagramNode
} from "./measure";

export type DiagramLayoutBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LaidOutDiagramNode = MeasuredDiagramNode & {
  x: number;
  y: number;
};

export type LaidOutDiagramEdge = {
  edgeId: string;
  points: DiagramPoint[];
};

export type DiagramLayoutDiagnosticCode =
  | "diagram-does-not-fit"
  | "node-collision"
  | "adapter-required"
  | "missing-generated-layout";

export type DiagramLayoutDiagnostic = {
  code: DiagramLayoutDiagnosticCode;
  message: string;
  recommendation: string;
  nodeIds?: string[];
  edgeId?: string;
};

export type DiagramLayoutSuccess = {
  ok: true;
  strategy: DiagramLayoutStrategy;
  nodes: LaidOutDiagramNode[];
  edges: LaidOutDiagramEdge[];
  diagnostics: DiagramLayoutDiagnostic[];
};

export type DiagramLayoutFailure = {
  ok: false;
  strategy: DiagramLayoutStrategy;
  diagnostics: DiagramLayoutDiagnostic[];
};

export type DiagramLayoutResult = DiagramLayoutSuccess | DiagramLayoutFailure;

type PositionedNode = MeasuredDiagramNode & { x: number; y: number };

const DEFAULT_MARGIN = 20;
const DEFAULT_GAP = 28;

function round(value: number): number {
  return Number(value.toFixed(3));
}

function fail(
  strategy: DiagramLayoutStrategy,
  code: DiagramLayoutDiagnosticCode,
  message: string,
  recommendation: string,
  nodeIds?: string[]
): DiagramLayoutFailure {
  return {
    ok: false,
    strategy,
    diagnostics: [
      {
        code,
        message,
        recommendation,
        ...(nodeIds ? { nodeIds } : {})
      }
    ]
  };
}

function availableBounds(bounds: DiagramLayoutBounds): DiagramLayoutBounds {
  return {
    x: bounds.x + DEFAULT_MARGIN,
    y: bounds.y + DEFAULT_MARGIN,
    width: Math.max(0, bounds.width - DEFAULT_MARGIN * 2),
    height: Math.max(0, bounds.height - DEFAULT_MARGIN * 2)
  };
}

function fitsInside(node: PositionedNode, bounds: DiagramLayoutBounds): boolean {
  return (
    node.x >= bounds.x &&
    node.y >= bounds.y &&
    node.x + node.width <= bounds.x + bounds.width &&
    node.y + node.height <= bounds.y + bounds.height
  );
}

function overlaps(left: PositionedNode, right: PositionedNode): boolean {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

function collisionPairs(nodes: readonly PositionedNode[]): string[][] {
  const pairs: string[][] = [];
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex];
      const right = nodes[rightIndex];
      if (left && right && overlaps(left, right)) {
        pairs.push([left.nodeId, right.nodeId]);
      }
    }
  }
  return pairs;
}

function orientPoint(
  x: number,
  y: number,
  width: number,
  height: number,
  direction: DiagramDirection
): { x: number; y: number } {
  switch (direction) {
    case "left-to-right":
      return { x, y };
    case "right-to-left":
      return { x: width - x, y };
    case "top-to-bottom":
      return { x: y * (width / Math.max(height, 1)), y: x * (height / Math.max(width, 1)) };
    case "bottom-to-top":
      return {
        x: y * (width / Math.max(height, 1)),
        y: height - x * (height / Math.max(width, 1))
      };
  }
}

function topologicalLevels(spec: DiagramSpec): Map<string, number> {
  const nodeIds = spec.nodes.map((node) => node.id);
  const incoming = new Map(nodeIds.map((id) => [id, 0]));
  const outgoing = new Map(nodeIds.map((id) => [id, [] as string[]]));
  for (const edge of spec.edges) {
    incoming.set(edge.target.nodeId, (incoming.get(edge.target.nodeId) ?? 0) + 1);
    outgoing.get(edge.source.nodeId)?.push(edge.target.nodeId);
  }
  for (const targets of outgoing.values()) targets.sort((a, b) => a.localeCompare(b, "en"));

  const queue = nodeIds.filter((id) => (incoming.get(id) ?? 0) === 0).sort((a, b) =>
    a.localeCompare(b, "en")
  );
  const levels = new Map(nodeIds.map((id) => [id, 0]));
  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited += 1;
    const currentLevel = levels.get(current) ?? 0;
    for (const target of outgoing.get(current) ?? []) {
      levels.set(target, Math.max(levels.get(target) ?? 0, currentLevel + 1));
      incoming.set(target, (incoming.get(target) ?? 1) - 1);
      if (incoming.get(target) === 0) {
        queue.push(target);
        queue.sort((a, b) => a.localeCompare(b, "en"));
      }
    }
  }

  if (visited !== nodeIds.length) {
    const ordered = spec.accessibleTraversalOrder.length > 0
      ? spec.accessibleTraversalOrder
      : [...nodeIds].sort((a, b) => a.localeCompare(b, "en"));
    ordered.forEach((id, index) => levels.set(id, index));
  }
  return levels;
}

function layoutTree(
  spec: DiagramSpec,
  measured: readonly MeasuredDiagramNode[],
  bounds: DiagramLayoutBounds
): PositionedNode[] | undefined {
  const area = availableBounds(bounds);
  const levels = topologicalLevels(spec);
  const grouped = new Map<number, MeasuredDiagramNode[]>();
  for (const node of measured) {
    const level = levels.get(node.nodeId) ?? 0;
    const group = grouped.get(level) ?? [];
    group.push(node);
    grouped.set(level, group);
  }
  for (const group of grouped.values()) {
    group.sort((left, right) => left.nodeId.localeCompare(right.nodeId, "en"));
  }
  const levelNumbers = [...grouped.keys()].sort((a, b) => a - b);
  const horizontal = spec.direction === "left-to-right" || spec.direction === "right-to-left";
  const levelSizes = levelNumbers.map((level) => {
    const nodes = grouped.get(level) ?? [];
    return horizontal
      ? Math.max(...nodes.map((node) => node.width), 0)
      : Math.max(...nodes.map((node) => node.height), 0);
  });
  const primaryAvailable = horizontal ? area.width : area.height;
  const totalPrimary = levelSizes.reduce((sum, value) => sum + value, 0) +
    Math.max(0, levelNumbers.length - 1) * DEFAULT_GAP;
  if (totalPrimary > primaryAvailable) return undefined;

  const primaryStart = (primaryAvailable - totalPrimary) / 2;
  const positions: PositionedNode[] = [];
  let primaryCursor = primaryStart;
  levelNumbers.forEach((level, levelIndex) => {
    const nodes = grouped.get(level) ?? [];
    const levelPrimarySize = levelSizes[levelIndex] ?? 0;
    const totalSecondary = nodes.reduce(
      (sum, node) => sum + (horizontal ? node.height : node.width),
      0
    ) + Math.max(0, nodes.length - 1) * DEFAULT_GAP;
    const secondaryAvailable = horizontal ? area.height : area.width;
    if (totalSecondary > secondaryAvailable) return;
    let secondaryCursor = (secondaryAvailable - totalSecondary) / 2;
    for (const node of nodes) {
      let localX: number;
      let localY: number;
      if (horizontal) {
        localX = primaryCursor + (levelPrimarySize - node.width) / 2;
        localY = secondaryCursor;
      } else {
        localX = secondaryCursor;
        localY = primaryCursor + (levelPrimarySize - node.height) / 2;
      }
      if (spec.direction === "right-to-left") {
        localX = area.width - localX - node.width;
      } else if (spec.direction === "bottom-to-top") {
        localY = area.height - localY - node.height;
      }
      positions.push({
        ...node,
        x: round(area.x + localX),
        y: round(area.y + localY)
      });
      secondaryCursor += (horizontal ? node.height : node.width) + DEFAULT_GAP;
    }
    primaryCursor += levelPrimarySize + DEFAULT_GAP;
  });
  return positions.length === measured.length ? positions : undefined;
}

function layoutTimeline(
  spec: DiagramSpec,
  measured: readonly MeasuredDiagramNode[],
  bounds: DiagramLayoutBounds
): PositionedNode[] | undefined {
  const area = availableBounds(bounds);
  const orderedIds = spec.accessibleTraversalOrder.length > 0
    ? spec.accessibleTraversalOrder
    : spec.nodes.map((node) => node.id);
  const byId = new Map(measured.map((node) => [node.nodeId, node]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((node): node is MeasuredDiagramNode => Boolean(node));
  const horizontal = spec.direction === "left-to-right" || spec.direction === "right-to-left";
  const totalPrimary = ordered.reduce(
    (sum, node) => sum + (horizontal ? node.width : node.height),
    0
  ) + Math.max(0, ordered.length - 1) * DEFAULT_GAP;
  const primaryAvailable = horizontal ? area.width : area.height;
  if (totalPrimary > primaryAvailable) return undefined;
  let cursor = (primaryAvailable - totalPrimary) / 2;
  const positions: PositionedNode[] = [];
  for (const node of ordered) {
    let localX = horizontal ? cursor : (area.width - node.width) / 2;
    let localY = horizontal ? (area.height - node.height) / 2 : cursor;
    if (spec.direction === "right-to-left") localX = area.width - localX - node.width;
    if (spec.direction === "bottom-to-top") localY = area.height - localY - node.height;
    positions.push({ ...node, x: round(area.x + localX), y: round(area.y + localY) });
    cursor += (horizontal ? node.width : node.height) + DEFAULT_GAP;
  }
  return positions;
}

function layoutMatrix(
  measured: readonly MeasuredDiagramNode[],
  bounds: DiagramLayoutBounds
): PositionedNode[] | undefined {
  const area = availableBounds(bounds);
  const columns = Math.ceil(Math.sqrt(measured.length));
  const rows = Math.ceil(measured.length / columns);
  const cellWidth = area.width / columns;
  const cellHeight = area.height / rows;
  if (
    measured.some((node) => node.width + DEFAULT_GAP > cellWidth || node.height + DEFAULT_GAP > cellHeight)
  ) {
    return undefined;
  }
  return measured.map((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      ...node,
      x: round(area.x + column * cellWidth + (cellWidth - node.width) / 2),
      y: round(area.y + row * cellHeight + (cellHeight - node.height) / 2)
    };
  });
}

function layoutRing(
  measured: readonly MeasuredDiagramNode[],
  bounds: DiagramLayoutBounds,
  centerFirst: boolean
): PositionedNode[] | undefined {
  const area = availableBounds(bounds);
  const maxWidth = Math.max(...measured.map((node) => node.width));
  const maxHeight = Math.max(...measured.map((node) => node.height));
  const radiusX = (area.width - maxWidth) / 2;
  const radiusY = (area.height - maxHeight) / 2;
  if (radiusX <= maxWidth / 2 || radiusY <= maxHeight / 2) return undefined;

  const positions: PositionedNode[] = [];
  const ringNodes = centerFirst ? measured.slice(1) : measured;
  if (centerFirst && measured[0]) {
    positions.push({
      ...measured[0],
      x: round(area.x + (area.width - measured[0].width) / 2),
      y: round(area.y + (area.height - measured[0].height) / 2)
    });
  }
  ringNodes.forEach((node, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, ringNodes.length)) * Math.PI * 2;
    const centerX = area.x + area.width / 2 + Math.cos(angle) * radiusX;
    const centerY = area.y + area.height / 2 + Math.sin(angle) * radiusY;
    positions.push({
      ...node,
      x: round(centerX - node.width / 2),
      y: round(centerY - node.height / 2)
    });
  });
  return positions;
}

function layoutManual(
  spec: DiagramSpec,
  measured: readonly MeasuredDiagramNode[],
  bounds: DiagramLayoutBounds
): PositionedNode[] | DiagramLayoutFailure {
  if (!spec.generatedLayout) {
    return fail(
      spec.layout,
      "missing-generated-layout",
      "Manual layout cần generatedLayout làm vị trí nền.",
      "Chạy một layout strategy trước, sau đó lưu manual overrides riêng."
    );
  }
  const generatedById = new Map(spec.generatedLayout.nodes.map((node) => [node.nodeId, node]));
  const overrideById = new Map(spec.manualOverrides.map((override) => [override.nodeId, override]));
  const nodes: PositionedNode[] = [];
  for (const measuredNode of measured) {
    const generated = generatedById.get(measuredNode.nodeId);
    if (!generated) {
      return fail(
        spec.layout,
        "missing-generated-layout",
        `Generated layout thiếu node ${measuredNode.nodeId}.`,
        "Re-layout toàn bộ diagram trước khi áp dụng manual overrides.",
        [measuredNode.nodeId]
      );
    }
    const override = overrideById.get(measuredNode.nodeId);
    nodes.push({
      ...measuredNode,
      x: round(override?.x ?? generated.x),
      y: round(override?.y ?? generated.y),
      width: Math.max(measuredNode.width, generated.width),
      height: Math.max(measuredNode.height, generated.height)
    });
  }
  if (nodes.some((node) => !fitsInside(node, bounds))) {
    return fail(
      spec.layout,
      "diagram-does-not-fit",
      "Manual override đặt node ra ngoài canvas hoặc làm node vượt bounds.",
      "Di chuyển node vào canvas, tăng canvas hoặc giảm mật độ nội dung."
    );
  }
  return nodes;
}

function boundaryPoint(from: PositionedNode, to: PositionedNode): DiagramPoint {
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: round(dx >= 0 ? from.x + from.width : from.x),
      y: round(fromCenter.y)
    };
  }
  return {
    x: round(fromCenter.x),
    y: round(dy >= 0 ? from.y + from.height : from.y)
  };
}

function routeEdges(spec: DiagramSpec, nodes: readonly PositionedNode[]): LaidOutDiagramEdge[] {
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  return spec.edges.map((edge) => {
    const source = byId.get(edge.source.nodeId)!;
    const target = byId.get(edge.target.nodeId)!;
    const start = boundaryPoint(source, target);
    const end = boundaryPoint(target, source);
    let points: DiagramPoint[];
    if (spec.edgeRouting === "orthogonal") {
      const horizontalFirst = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
      points = horizontalFirst
        ? [start, { x: round((start.x + end.x) / 2), y: start.y }, { x: round((start.x + end.x) / 2), y: end.y }, end]
        : [start, { x: start.x, y: round((start.y + end.y) / 2) }, { x: end.x, y: round((start.y + end.y) / 2) }, end];
    } else {
      points = [start, end];
    }
    return { edgeId: edge.id, points };
  });
}

export function layoutDiagram(
  spec: DiagramSpec,
  bounds: DiagramLayoutBounds
): DiagramLayoutResult {
  if (bounds.width <= 0 || bounds.height <= 0) {
    return fail(
      spec.layout,
      "diagram-does-not-fit",
      "Diagram bounds phải có width và height dương.",
      "Cấp canvas bounds hợp lệ trước khi layout."
    );
  }
  if (spec.layout === "elk-layered" || spec.layout === "elk-force") {
    return fail(
      spec.layout,
      "adapter-required",
      `${spec.layout} cần ELK adapter được coordinator tích hợp.`,
      "Gọi createElkLayoutRequest và cung cấp ElkLayoutAdapter, không nhúng raw ELK payload vào document."
    );
  }

  const measured = measureDiagramNodes(spec);
  let positioned: PositionedNode[] | DiagramLayoutFailure | undefined;
  switch (spec.layout) {
    case "tree":
      positioned = layoutTree(spec, measured, bounds);
      break;
    case "timeline":
      positioned = layoutTimeline(spec, measured, bounds);
      break;
    case "matrix":
      positioned = layoutMatrix(measured, bounds);
      break;
    case "radial":
      positioned = layoutRing(measured, bounds, true);
      break;
    case "cycle":
      positioned = layoutRing(measured, bounds, false);
      break;
    case "manual":
      positioned = layoutManual(spec, measured, bounds);
      break;
    default:
      positioned = undefined;
  }
  if (positioned && !Array.isArray(positioned)) return positioned;
  if (!positioned || positioned.some((node) => !fitsInside(node, bounds))) {
    return fail(
      spec.layout,
      "diagram-does-not-fit",
      `Diagram ${spec.layout} không vừa canvas ${bounds.width}×${bounds.height} ở kích thước chữ tối thiểu.`,
      "Tách diagram, giảm số node, rút gọn nhãn có kiểm soát hoặc tăng canvas bounds."
    );
  }
  const collisions = collisionPairs(positioned);
  if (collisions.length > 0) {
    return fail(
      spec.layout,
      "node-collision",
      `Layout tạo ${collisions.length} cặp node va chạm.`,
      "Tăng gap/canvas, đổi strategy hoặc tách diagram thay vì chồng node.",
      collisions.flat()
    );
  }

  return {
    ok: true,
    strategy: spec.layout,
    nodes: positioned,
    edges: routeEdges(spec, positioned),
    diagnostics: []
  };
}
