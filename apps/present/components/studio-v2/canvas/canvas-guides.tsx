import type { CSSProperties } from "react";

export type CanvasGuideMatch = {
  axis: "x" | "y";
  kind: string;
  guideId: string;
  target: "start" | "center" | "end";
  delta: number;
  position: number;
};

export type CanvasSpacingMeasurement = {
  axis: "horizontal" | "vertical";
  gap: number;
  elementIds: string[];
};

type GuideStyle = CSSProperties & { "--guide-position": string };

export function CanvasGuides({
  matches,
  measurements
}: {
  matches: readonly CanvasGuideMatch[];
  measurements: readonly CanvasSpacingMeasurement[];
}) {
  return (
    <div className="studio-v2-canvas-guides" aria-hidden="true" data-editor-overlay="guides">
      {matches.map((match) => (
        <div
          key={`${match.axis}-${match.guideId}-${match.target}`}
          className="studio-v2-canvas-guide"
          data-guide-axis={match.axis}
          data-guide-kind={match.kind}
          data-guide-target={match.target}
          style={{ "--guide-position": `${match.position}px` } as GuideStyle}
        />
      ))}
      {measurements.map((measurement) => (
        <div
          key={`${measurement.axis}-${measurement.elementIds.join("-")}`}
          className="studio-v2-spacing-measurement"
          data-spacing-axis={measurement.axis}
          title={`Khoảng cách đều giữa ${measurement.elementIds.length} thành phần`}
        >
          <span>{measurement.gap} px</span>
          <span>Khoảng cách đều giữa {measurement.elementIds.length} thành phần</span>
        </div>
      ))}
    </div>
  );
}
