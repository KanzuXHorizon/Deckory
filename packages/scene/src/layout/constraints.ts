import type { ElementConstraints, Frame } from "@deckory/schema/v2";
import { normalizeFrame, roundSceneNumber } from "../geometry";
import { failure, type LayoutFailure, type LayoutValueResult } from "./types";

export type ConstraintResolutionInput = {
  originalParent: { width: number; height: number };
  nextParent: { width: number; height: number };
  child: Frame;
  constraints: Pick<ElementConstraints, "horizontal" | "vertical">;
  minimumSize?: { width: number; height: number };
  maximumSize?: { width?: number; height?: number };
};

export class LayoutConstraintError extends Error {
  readonly diagnostics: LayoutFailure["diagnostics"];

  constructor(failureResult: LayoutFailure) {
    super(failureResult.diagnostics[0]?.message ?? "Không thể áp dụng constraints.");
    this.name = "LayoutConstraintError";
    this.diagnostics = failureResult.diagnostics;
  }
}

type AxisMode = "start" | "end" | "center" | "stretch" | "scale";

type AxisInput = {
  originalParent: number;
  nextParent: number;
  start: number;
  size: number;
  mode: AxisMode;
  minimum: number;
  maximum: number | undefined;
  axisLabel: "ngang" | "dọc";
};

function validateDimension(value: number, label: string, positive = true): void {
  if (!Number.isFinite(value) || (positive ? value <= 0 : value < 0)) {
    throw new RangeError(`${label} must be finite and ${positive ? "positive" : "non-negative"}`);
  }
}

function resolveAxis(input: AxisInput): LayoutValueResult<{ start: number; size: number }> {
  const endMargin = input.originalParent - input.start - input.size;
  let start = input.start;
  let size = input.size;

  switch (input.mode) {
    case "start":
      break;
    case "end":
      start = input.nextParent - endMargin - input.size;
      break;
    case "center": {
      const centerOffset = input.start + input.size / 2 - input.originalParent / 2;
      start = input.nextParent / 2 + centerOffset - input.size / 2;
      break;
    }
    case "stretch":
      size = input.nextParent - input.start - endMargin;
      break;
    case "scale": {
      const scale = input.nextParent / input.originalParent;
      start = input.start * scale;
      size = input.size * scale;
      break;
    }
  }

  if (size < input.minimum) {
    return failure({
      code: "constraint-minimum-does-not-fit",
      message: `Constraint ${input.axisLabel} chỉ còn ${roundSceneNumber(size)}px, thấp hơn mức tối thiểu ${input.minimum}px; hãy tăng kích thước khung cha, giảm lề hoặc hạ kích thước tối thiểu.`,
      recommendation: "Tăng kích thước khung cha, giảm lề hoặc hạ kích thước tối thiểu."
    });
  }

  if (input.maximum !== undefined && size > input.maximum) {
    return failure({
      code: "constraint-maximum-exceeded",
      message: `Constraint ${input.axisLabel} tạo kích thước ${roundSceneNumber(size)}px, vượt mức tối đa ${input.maximum}px.`,
      recommendation: "Đổi constraint, tăng giới hạn tối đa hoặc giữ kích thước fixed."
    });
  }

  return { ok: true, value: { start: roundSceneNumber(start), size: roundSceneNumber(size) } };
}

export function tryResolveConstraints(input: ConstraintResolutionInput): LayoutValueResult<Frame> {
  validateDimension(input.originalParent.width, "Original parent width");
  validateDimension(input.originalParent.height, "Original parent height");
  validateDimension(input.nextParent.width, "Next parent width");
  validateDimension(input.nextParent.height, "Next parent height");
  validateDimension(input.minimumSize?.width ?? 1, "Minimum width");
  validateDimension(input.minimumSize?.height ?? 1, "Minimum height");
  if (input.maximumSize?.width !== undefined) validateDimension(input.maximumSize.width, "Maximum width");
  if (input.maximumSize?.height !== undefined) validateDimension(input.maximumSize.height, "Maximum height");

  const horizontalMode: AxisMode = input.constraints.horizontal === "right"
    ? "end"
    : input.constraints.horizontal === "center"
      ? "center"
      : input.constraints.horizontal === "stretch"
        ? "stretch"
        : input.constraints.horizontal === "scale"
          ? "scale"
          : "start";
  const verticalMode: AxisMode = input.constraints.vertical === "bottom"
    ? "end"
    : input.constraints.vertical === "center"
      ? "center"
      : input.constraints.vertical === "stretch"
        ? "stretch"
        : input.constraints.vertical === "scale"
          ? "scale"
          : "start";

  const horizontal = resolveAxis({
    originalParent: input.originalParent.width,
    nextParent: input.nextParent.width,
    start: input.child.x,
    size: input.child.width,
    mode: horizontalMode,
    minimum: input.minimumSize?.width ?? 1,
    maximum: input.maximumSize?.width,
    axisLabel: "ngang"
  });
  if (!horizontal.ok) return horizontal;

  const vertical = resolveAxis({
    originalParent: input.originalParent.height,
    nextParent: input.nextParent.height,
    start: input.child.y,
    size: input.child.height,
    mode: verticalMode,
    minimum: input.minimumSize?.height ?? 1,
    maximum: input.maximumSize?.height,
    axisLabel: "dọc"
  });
  if (!vertical.ok) return vertical;

  return {
    ok: true,
    value: normalizeFrame({
      x: horizontal.value.start,
      y: vertical.value.start,
      width: horizontal.value.size,
      height: vertical.value.size
    })
  };
}

export function resolveConstraints(input: ConstraintResolutionInput): Frame {
  const result = tryResolveConstraints(input);
  if (!result.ok) throw new LayoutConstraintError(result);
  return result.value;
}
