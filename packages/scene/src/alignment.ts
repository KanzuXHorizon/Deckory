import type { Frame } from "@deckory/schema/v2";
import type { ElementFrameChange, SceneCommand } from "./commands";
import { normalizeFrame, roundSceneNumber } from "./geometry";
import { failure, type LayoutFailure, type LayoutValueResult } from "./layout/types";

export type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type DistributionAxis = "horizontal" | "vertical";
export type FramedElement = { id: string; frame: Frame };
export type AlignmentAction =
  | { type: "align"; mode: AlignMode }
  | { type: "distribute"; axis: DistributionAxis };

export class DistributionError extends Error {
  readonly diagnostics: LayoutFailure["diagnostics"];

  constructor(result: LayoutFailure) {
    super(result.diagnostics[0]?.message ?? "Không thể phân bố thành phần.");
    this.name = "DistributionError";
    this.diagnostics = result.diagnostics;
  }
}

function requireSelection(elements: readonly FramedElement[], minimum: number, action: string): void {
  if (elements.length < minimum) throw new RangeError(`${action} cần ít nhất ${minimum} thành phần.`);
  const ids = new Set<string>();
  for (const element of elements) {
    if (ids.has(element.id)) throw new Error(`Element ID "${element.id}" bị trùng trong vùng chọn.`);
    ids.add(element.id);
  }
}

function selectionBounds(elements: readonly FramedElement[]): Frame {
  const left = Math.min(...elements.map(({ frame }) => frame.x));
  const top = Math.min(...elements.map(({ frame }) => frame.y));
  const right = Math.max(...elements.map(({ frame }) => frame.x + frame.width));
  const bottom = Math.max(...elements.map(({ frame }) => frame.y + frame.height));
  return normalizeFrame({ x: left, y: top, width: right - left, height: bottom - top });
}

export function alignElements(elements: readonly FramedElement[], mode: AlignMode): ElementFrameChange[] {
  requireSelection(elements, 2, "Căn chỉnh");
  const bounds = selectionBounds(elements);
  return elements.map(({ id, frame }) => {
    let x = frame.x;
    let y = frame.y;
    if (mode === "left") x = bounds.x;
    if (mode === "center") x = bounds.x + (bounds.width - frame.width) / 2;
    if (mode === "right") x = bounds.x + bounds.width - frame.width;
    if (mode === "top") y = bounds.y;
    if (mode === "middle") y = bounds.y + (bounds.height - frame.height) / 2;
    if (mode === "bottom") y = bounds.y + bounds.height - frame.height;
    return { elementId: id, frame: normalizeFrame({ ...frame, x, y }) };
  });
}

export function tryDistributeElements(
  elements: readonly FramedElement[],
  axis: DistributionAxis
): LayoutValueResult<ElementFrameChange[]> {
  requireSelection(elements, 3, "Phân bố");
  const horizontal = axis === "horizontal";
  const sorted = [...elements].sort((left, right) => {
    const delta = horizontal ? left.frame.x - right.frame.x : left.frame.y - right.frame.y;
    return delta || left.id.localeCompare(right.id);
  });
  const first = sorted[0]!;
  const outerStart = horizontal ? first.frame.x : first.frame.y;
  const outerEnd = Math.max(...sorted.map((element) => horizontal
    ? element.frame.x + element.frame.width
    : element.frame.y + element.frame.height));
  const totalSize = sorted.reduce((sum, element) => sum + (horizontal ? element.frame.width : element.frame.height), 0);
  const gap = (outerEnd - outerStart - totalSize) / (sorted.length - 1);

  if (gap < 0) {
    return failure({
      code: "distribution-does-not-fit",
      message: `Không thể phân bố ${sorted.length} thành phần vì tổng kích thước vượt vùng chọn ${roundSceneNumber(-gap * (sorted.length - 1))}px.`,
      recommendation: "Mở rộng vùng chọn, giảm kích thước thành phần hoặc dùng auto layout có wrap.",
      elementIds: sorted.map((element) => element.id)
    });
  }

  const byId = new Map<string, Frame>();
  let cursor = outerStart;
  for (const element of sorted) {
    const frame = horizontal
      ? normalizeFrame({ ...element.frame, x: cursor })
      : normalizeFrame({ ...element.frame, y: cursor });
    byId.set(element.id, frame);
    cursor += (horizontal ? element.frame.width : element.frame.height) + gap;
  }

  return {
    ok: true,
    value: elements.map((element) => ({ elementId: element.id, frame: byId.get(element.id)! }))
  };
}

export function distributeElements(elements: readonly FramedElement[], axis: DistributionAxis): ElementFrameChange[] {
  const result = tryDistributeElements(elements, axis);
  if (!result.ok) throw new DistributionError(result);
  return result.value;
}

export function createAlignmentCommand(
  slideId: string,
  elements: readonly FramedElement[],
  action: AlignmentAction
): Extract<SceneCommand, { type: "transform-elements" }> {
  const changes = action.type === "align"
    ? alignElements(elements, action.mode)
    : distributeElements(elements, action.axis);
  return { type: "transform-elements", slideId, changes };
}
