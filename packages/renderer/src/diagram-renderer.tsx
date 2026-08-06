import {
  layoutDiagram,
  measureDiagramNodes,
  type DiagramLayoutFailure,
  type DiagramLayoutSuccess,
  type DiagramSpec
} from "@deckory/visuals";

function generatedLayout(spec: DiagramSpec): DiagramLayoutSuccess | undefined {
  const generated = spec.generatedLayout;
  if (!generated) return undefined;
  const measuredById = new Map(measureDiagramNodes(spec).map((node) => [node.nodeId, node]));
  return {
    ok: true,
    strategy: generated.strategy,
    nodes: generated.nodes.map((node) => ({
      ...(measuredById.get(node.nodeId) ?? {
        nodeId: node.nodeId,
        width: node.width,
        height: node.height,
        measuredTextWidth: node.width,
        measuredTextHeight: node.height,
        lines: [node.nodeId],
        labelLines: [node.nodeId],
        descriptionLines: []
      }),
      width: node.width,
      height: node.height,
      x: node.x,
      y: node.y
    })),
    edges: generated.edges.map((edge) => ({ edgeId: edge.edgeId, points: edge.points.map((point) => ({ ...point })) })),
    diagnostics: []
  };
}

function diagramFailure(spec: DiagramSpec, failure: DiagramLayoutFailure) {
  const status = failure.diagnostics.some((diagnostic) => diagnostic.code === "adapter-required")
    ? "adapter-required"
    : "layout-error";
  return (
    <section
      className="deckory-diagram deckory-diagram--error"
      data-diagram-status={status}
      data-diagram-strategy={spec.layout}
      role="img"
      aria-label={spec.accessibleSummary}
    >
      <strong>{spec.title}</strong>
      <p>{failure.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}</p>
    </section>
  );
}

export function DiagramRenderer({
  spec,
  width,
  height
}: {
  spec: DiagramSpec;
  width: number;
  height: number;
}) {
  const headerHeight = Math.min(54, Math.max(38, height * 0.14));
  const footerHeight = spec.evidence.label || spec.evidence.sourceIds.length > 0 ? 28 : 8;
  const bounds = {
    x: 12,
    y: headerHeight + 8,
    width: Math.max(1, width - 24),
    height: Math.max(1, height - headerHeight - footerHeight - 16)
  };
  const result = generatedLayout(spec) ?? layoutDiagram(spec, bounds);
  if (!result.ok) return diagramFailure(spec, result);

  const nodeById = new Map(spec.nodes.map((node) => [node.id, node]));
  const edgeById = new Map(spec.edges.map((edge) => [edge.id, edge]));
  return (
    <figure
      className="deckory-diagram"
      data-diagram-status="ready"
      data-diagram-strategy={result.strategy}
      aria-label={spec.accessibleSummary}
      style={{ margin: 0, width: "100%", height: "100%", display: "grid", gridTemplateRows: `${headerHeight}px 1fr ${footerHeight}px`, color: "inherit" }}
    >
      <figcaption style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingInline: 4 }}>
        <strong>{spec.title}</strong>
        <span>{spec.intent}</span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="presentation" aria-hidden="true">
        <defs>
          <marker id={`arrow-${spec.title.replace(/[^a-z0-9]/giu, "-")}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        {result.edges.map((edge) => {
          const source = edgeById.get(edge.edgeId);
          const points = edge.points.map((point) => `${point.x},${point.y}`).join(" ");
          const middle = edge.points[Math.floor(edge.points.length / 2)]!;
          return (
            <g key={edge.edgeId} data-diagram-edge-id={edge.edgeId} data-edge-kind={source?.kind}>
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.55"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                markerEnd={`url(#arrow-${spec.title.replace(/[^a-z0-9]/giu, "-")})`}
              />
              {source?.label ? <text x={middle.x} y={middle.y - 8} textAnchor="middle" fontSize="11" fill="currentColor">{source.label}</text> : null}
            </g>
          );
        })}
        {result.nodes.map((node) => {
          const source = nodeById.get(node.nodeId);
          return (
            <g key={node.nodeId} data-diagram-node-id={node.nodeId} data-node-kind={source?.kind}>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx="12"
                fill="color-mix(in srgb, currentColor 7%, transparent)"
                stroke="currentColor"
                strokeOpacity="0.34"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={node.x + node.width / 2}
                y={node.y + node.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="650"
                fill="currentColor"
              >
                {source?.label ?? node.labelLines.join(" ")}
              </text>
            </g>
          );
        })}
      </svg>
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 11, opacity: 0.74 }}>
        <span>{spec.evidence.label ?? spec.evidence.sourceIds.join(", ")}</span>
        {result.diagnostics.length > 0 ? <span data-diagram-diagnostic-count={result.diagnostics.length}>{result.diagnostics.length} cảnh báo</span> : null}
      </footer>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{spec.accessibleSummary}</span>
    </figure>
  );
}
