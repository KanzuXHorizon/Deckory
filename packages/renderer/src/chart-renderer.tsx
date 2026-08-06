import type { ReactNode } from "react";
import {
  buildEditorialChartGeometry,
  isEChartsVariant,
  type ChartGeometryLabel,
  type ChartGeometryMark,
  type ChartSpec
} from "@deckory/visuals";
import type { SceneRenderMode } from "./element-renderer";

function markNode(mark: ChartGeometryMark): ReactNode {
  const common = {
    "data-chart-datum-id": mark.datumId,
    "data-primary-highlight": mark.primaryHighlight ? "true" : undefined,
    "data-chart-direction": mark.direction
  };
  const fill = mark.primaryHighlight ? "currentColor" : "color-mix(in srgb, currentColor 52%, transparent)";
  const stroke = mark.primaryHighlight ? "currentColor" : "color-mix(in srgb, currentColor 72%, transparent)";

  switch (mark.kind) {
    case "rect":
      return <rect key={mark.datumId} {...common} x={mark.x} y={mark.y} width={mark.width ?? 0} height={mark.height ?? 0} fill={fill} rx="4" />;
    case "circle":
      return <circle key={mark.datumId} {...common} cx={mark.x} cy={mark.y} r={mark.radius ?? 4} fill={fill} />;
    case "line":
      return <line key={mark.datumId} {...common} x1={mark.x} y1={mark.y} x2={mark.x2 ?? mark.x} y2={mark.y2 ?? mark.y} stroke={stroke} strokeWidth={mark.primaryHighlight ? 3 : 2} vectorEffect="non-scaling-stroke" />;
    case "area": {
      const points = (mark.points ?? []).map((point) => `${point.x},${point.y}`).join(" ");
      return <polygon key={mark.datumId} {...common} points={points} fill={fill} fillOpacity="0.28" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />;
    }
  }
}

function labelNode(label: ChartGeometryLabel): ReactNode {
  return (
    <text
      key={`${label.datumId}-${label.role}-${label.text}`}
      data-chart-label-role={label.role}
      data-chart-datum-id={label.datumId}
      data-primary-highlight={label.primaryHighlight ? "true" : undefined}
      x={label.x}
      y={label.y}
      textAnchor={label.anchor}
      dominantBaseline="middle"
      fontSize={label.role === "value" ? 14 : 13}
      fontWeight={label.primaryHighlight ? 750 : 520}
      fill="currentColor"
    >
      {label.text}
    </text>
  );
}

export function ChartRenderer({
  spec,
  width,
  height,
  mode
}: {
  spec: ChartSpec;
  width: number;
  height: number;
  mode: SceneRenderMode;
}) {
  if (isEChartsVariant(spec.variant)) {
    return (
      <section
        className="deckory-chart deckory-chart--adapter-required"
        data-chart-status="adapter-required"
        data-chart-variant={spec.variant}
        role="img"
        aria-label={spec.accessibleSummary}
      >
        <strong>{spec.title}</strong>
        <p>{spec.variant} cần ECharts SVG adapter đã được review.</p>
      </section>
    );
  }

  const headerHeight = Math.min(54, Math.max(38, height * 0.14));
  const footerHeight = spec.evidence.label || spec.evidence.sourceIds.length > 0 ? 28 : 8;
  const geometry = buildEditorialChartGeometry(spec, {
    x: 0,
    y: headerHeight,
    width,
    height: Math.max(1, height - headerHeight - footerHeight)
  });

  if (!geometry.ok) {
    return (
      <section
        className="deckory-chart deckory-chart--error"
        data-chart-status="geometry-error"
        data-chart-variant={spec.variant}
        role="img"
        aria-label={spec.accessibleSummary}
      >
        <strong>{spec.title}</strong>
        <p>{geometry.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}</p>
      </section>
    );
  }

  const motionState = mode === "thumbnail" || mode === "export" ? "final" : spec.animation.mode === "none" ? "final" : "authored-final";
  return (
    <figure
      className="deckory-chart"
      data-chart-status="ready"
      data-chart-variant={spec.variant}
      data-chart-motion={motionState}
      aria-label={spec.accessibleSummary}
      style={{ margin: 0, width: "100%", height: "100%", display: "grid", gridTemplateRows: `${headerHeight}px 1fr ${footerHeight}px`, color: "inherit" }}
    >
      <figcaption style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingInline: 4 }}>
        <strong>{spec.title}</strong>
        <span>{spec.unit}</span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="presentation" aria-hidden="true">
        <line
          x1={geometry.baseline.x}
          y1={geometry.baseline.y}
          x2={geometry.baseline.orientation === "horizontal" ? geometry.baseline.x + geometry.baseline.length : geometry.baseline.x}
          y2={geometry.baseline.orientation === "vertical" ? geometry.baseline.y + geometry.baseline.length : geometry.baseline.y}
          stroke="currentColor"
          strokeOpacity="0.2"
          vectorEffect="non-scaling-stroke"
        />
        {geometry.marks.map(markNode)}
        {geometry.labels.map(labelNode)}
      </svg>
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 11, opacity: 0.74 }}>
        <span>{spec.evidence.label ?? spec.evidence.sourceIds.join(", ")}</span>
        {geometry.diagnostics.length > 0 ? <span data-chart-diagnostic-count={geometry.diagnostics.length}>{geometry.diagnostics.length} cảnh báo</span> : null}
      </footer>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{spec.accessibleSummary}</span>
    </figure>
  );
}
