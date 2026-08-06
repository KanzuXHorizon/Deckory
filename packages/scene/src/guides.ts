import type { Frame } from "@deckory/schema/v2";
import { normalizeFrame, roundSceneNumber } from "./geometry";

export type SnapGuideKind =
  | "canvas-left"
  | "canvas-center-x"
  | "canvas-right"
  | "canvas-top"
  | "canvas-center-y"
  | "canvas-bottom"
  | "safe-left"
  | "safe-right"
  | "safe-top"
  | "safe-bottom"
  | "sibling-left"
  | "sibling-center-x"
  | "sibling-right"
  | "sibling-top"
  | "sibling-center-y"
  | "sibling-bottom"
  | "text-baseline"
  | "auto-layout-padding"
  | "auto-layout-gap"
  | "custom";

export type SnapGuide = {
  id: string;
  axis: "x" | "y";
  position: number;
  kind: SnapGuideKind;
  sourceId?: string;
};

export type GuideElement = {
  id: string;
  frame: Frame;
  baseline?: number;
  hidden?: boolean;
};

export type CustomGuide = {
  id: string;
  axis: "x" | "y";
  position: number;
};

export type CollectGuideOptions = {
  safeArea?: { top: number; right: number; bottom: number; left: number };
  autoLayoutGuides?: SnapGuide[];
};

export type SnapTarget = "start" | "center" | "end";
export type SnapMatch = {
  axis: "x" | "y";
  kind: SnapGuideKind;
  guideId: string;
  target: SnapTarget;
  delta: number;
  position: number;
};

export type SnapFrameResult = {
  frame: Frame;
  matches: SnapMatch[];
};

function guide(id: string, axis: "x" | "y", position: number, kind: SnapGuideKind, sourceId?: string): SnapGuide {
  if (!Number.isFinite(position)) throw new RangeError(`Guide "${id}" must use a finite position`);
  const result: SnapGuide = { id, axis, position: roundSceneNumber(position), kind };
  if (sourceId !== undefined) result.sourceId = sourceId;
  return result;
}

export function collectSnapGuides(
  canvas: { width: number; height: number },
  elements: readonly GuideElement[],
  customGuides: readonly CustomGuide[],
  options: CollectGuideOptions = {}
): SnapGuide[] {
  if (!Number.isFinite(canvas.width) || canvas.width <= 0 || !Number.isFinite(canvas.height) || canvas.height <= 0) {
    throw new RangeError("Canvas size must be finite and positive");
  }

  const guides: SnapGuide[] = [
    guide("canvas-bottom", "y", canvas.height, "canvas-bottom"),
    guide("canvas-center-x", "x", canvas.width / 2, "canvas-center-x"),
    guide("canvas-center-y", "y", canvas.height / 2, "canvas-center-y"),
    guide("canvas-left", "x", 0, "canvas-left"),
    guide("canvas-right", "x", canvas.width, "canvas-right"),
    guide("canvas-top", "y", 0, "canvas-top")
  ];

  if (options.safeArea) {
    guides.push(
      guide("safe-bottom", "y", canvas.height - options.safeArea.bottom, "safe-bottom"),
      guide("safe-left", "x", options.safeArea.left, "safe-left"),
      guide("safe-right", "x", canvas.width - options.safeArea.right, "safe-right"),
      guide("safe-top", "y", options.safeArea.top, "safe-top")
    );
  }

  for (const element of elements) {
    if (element.hidden) continue;
    const prefix = `sibling-${element.id}`;
    guides.push(
      guide(`${prefix}-bottom`, "y", element.frame.y + element.frame.height, "sibling-bottom", element.id),
      guide(`${prefix}-center-x`, "x", element.frame.x + element.frame.width / 2, "sibling-center-x", element.id),
      guide(`${prefix}-center-y`, "y", element.frame.y + element.frame.height / 2, "sibling-center-y", element.id),
      guide(`${prefix}-left`, "x", element.frame.x, "sibling-left", element.id),
      guide(`${prefix}-right`, "x", element.frame.x + element.frame.width, "sibling-right", element.id),
      guide(`${prefix}-top`, "y", element.frame.y, "sibling-top", element.id)
    );
    if (element.baseline !== undefined) guides.push(guide(`${prefix}-baseline`, "y", element.baseline, "text-baseline", element.id));
  }

  for (const custom of customGuides) guides.push(guide(`custom-${custom.id}`, custom.axis, custom.position, "custom", custom.id));
  for (const layoutGuide of options.autoLayoutGuides ?? []) guides.push({ ...layoutGuide });

  const unique = new Map<string, SnapGuide>();
  for (const item of guides) {
    if (unique.has(item.id)) throw new Error(`Guide ID "${item.id}" bị trùng.`);
    unique.set(item.id, item);
  }
  return [...unique.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function anchorCandidates(frame: Frame, axis: "x" | "y"): Array<{ target: SnapTarget; position: number }> {
  const start = axis === "x" ? frame.x : frame.y;
  const size = axis === "x" ? frame.width : frame.height;
  return [
    { target: "start", position: start },
    { target: "center", position: start + size / 2 },
    { target: "end", position: start + size }
  ];
}

function closestMatch(frame: Frame, guides: readonly SnapGuide[], axis: "x" | "y", tolerance: number): SnapMatch | undefined {
  const matches: SnapMatch[] = [];
  for (const item of guides) {
    if (item.axis !== axis) continue;
    for (const anchor of anchorCandidates(frame, axis)) {
      const delta = item.position - anchor.position;
      if (Math.abs(delta) <= tolerance) {
        matches.push({
          axis,
          kind: item.kind,
          guideId: item.id,
          target: anchor.target,
          delta: roundSceneNumber(delta),
          position: item.position
        });
      }
    }
  }
  return matches.sort((left, right) =>
    Math.abs(left.delta) - Math.abs(right.delta)
    || left.guideId.localeCompare(right.guideId)
    || ["start", "center", "end"].indexOf(left.target) - ["start", "center", "end"].indexOf(right.target)
  )[0];
}

export function snapFrame(frame: Frame, guides: readonly SnapGuide[], options: { tolerance: number }): SnapFrameResult {
  if (!Number.isFinite(options.tolerance) || options.tolerance < 0) throw new RangeError("Snap tolerance must be finite and non-negative");
  const x = closestMatch(frame, guides, "x", options.tolerance);
  const y = closestMatch(frame, guides, "y", options.tolerance);
  const snapped = normalizeFrame({
    ...frame,
    x: frame.x + (x?.delta ?? 0),
    y: frame.y + (y?.delta ?? 0)
  });
  return { frame: snapped, matches: [x, y].filter((match): match is SnapMatch => match !== undefined) };
}

export type EqualSpacingMeasurement = {
  axis: "horizontal" | "vertical";
  gap: number;
  elementIds: string[];
};

export function measureEqualSpacing(
  elements: readonly GuideElement[],
  axis: "horizontal" | "vertical",
  tolerance: number
): EqualSpacingMeasurement | undefined {
  if (elements.length < 3) return undefined;
  if (!Number.isFinite(tolerance) || tolerance < 0) throw new RangeError("Spacing tolerance must be finite and non-negative");
  const horizontal = axis === "horizontal";
  const sorted = [...elements].sort((left, right) => {
    const delta = horizontal ? left.frame.x - right.frame.x : left.frame.y - right.frame.y;
    return delta || left.id.localeCompare(right.id);
  });
  const gaps = sorted.slice(1).map((element, index) => {
    const previous = sorted[index]!;
    const previousEnd = horizontal ? previous.frame.x + previous.frame.width : previous.frame.y + previous.frame.height;
    const currentStart = horizontal ? element.frame.x : element.frame.y;
    return currentStart - previousEnd;
  });
  const average = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;
  if (gaps.some((value) => Math.abs(value - average) > tolerance)) return undefined;
  return { axis, gap: roundSceneNumber(average), elementIds: sorted.map((element) => element.id) };
}
