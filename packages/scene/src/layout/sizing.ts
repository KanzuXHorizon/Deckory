import { roundSceneNumber } from "../geometry";
import { failure, type LayoutFailure, type LayoutValueResult } from "./types";

export type LayoutSizingMode = "fixed" | "hug-content" | "fill-container";

export type LayoutSizingPolicy = {
  mode: LayoutSizingMode;
  value?: number;
  min?: number;
  max?: number;
  aspectRatio?: number;
};

export type ResolveSizingPolicyInput = {
  policy: LayoutSizingPolicy;
  fixedSize: number;
  intrinsicSize: number;
  availableSize: number;
};

function finiteNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and non-negative`);
  return value;
}

function validatePolicy(policy: LayoutSizingPolicy): void {
  if (policy.value !== undefined) finiteNonNegative(policy.value, "Sizing value");
  if (policy.min !== undefined) finiteNonNegative(policy.min, "Sizing minimum");
  if (policy.max !== undefined) finiteNonNegative(policy.max, "Sizing maximum");
  if (policy.min !== undefined && policy.max !== undefined && policy.min > policy.max) {
    throw new RangeError("Sizing minimum cannot exceed maximum");
  }
  if (policy.aspectRatio !== undefined && (!Number.isFinite(policy.aspectRatio) || policy.aspectRatio <= 0)) {
    throw new RangeError("Aspect ratio must be finite and positive");
  }
}

export function resolveSizingPolicy(input: ResolveSizingPolicyInput): LayoutValueResult<number> {
  validatePolicy(input.policy);
  finiteNonNegative(input.fixedSize, "Fixed size");
  finiteNonNegative(input.intrinsicSize, "Intrinsic size");
  finiteNonNegative(input.availableSize, "Available size");

  const minimum = input.policy.min ?? 0;
  const maximum = input.policy.max ?? Number.POSITIVE_INFINITY;
  const requested = input.policy.mode === "fixed"
    ? (input.policy.value ?? input.fixedSize)
    : input.policy.mode === "hug-content"
      ? input.intrinsicSize
      : input.availableSize;

  if (input.availableSize < minimum) {
    return failure({
      code: "sizing-minimum-does-not-fit",
      message: `Không đủ không gian: cần tối thiểu ${minimum}px nhưng chỉ còn ${input.availableSize}px.`,
      recommendation: "Tăng kích thước khung cha, giảm padding/gap hoặc hạ kích thước tối thiểu."
    });
  }

  if (requested > input.availableSize && input.policy.mode !== "fill-container") {
    return failure({
      code: "sizing-minimum-does-not-fit",
      message: `Kích thước yêu cầu ${requested}px vượt quá ${input.availableSize}px khả dụng.`,
      recommendation: "Tăng kích thước khung cha hoặc chuyển sang fill-container với giới hạn phù hợp."
    });
  }

  const value = Math.min(Math.max(requested, minimum), maximum);
  return { ok: true, value: roundSceneNumber(value) };
}

function validateResolvedAxis(
  value: number,
  policy: LayoutSizingPolicy,
  availableSize: number,
  axisLabel: "chiều rộng" | "chiều cao"
): LayoutFailure | undefined {
  if (policy.min !== undefined && value < policy.min) {
    return failure({
      code: "sizing-minimum-does-not-fit",
      message: `Tỷ lệ khung hình tạo ${axisLabel} ${value}px, thấp hơn mức tối thiểu ${policy.min}px.`,
      recommendation: "Tăng trục chủ đạo, giảm kích thước tối thiểu hoặc bỏ ràng buộc tỷ lệ."
    });
  }
  if (policy.max !== undefined && value > policy.max) {
    return failure({
      code: "sizing-maximum-exceeded",
      message: `Tỷ lệ khung hình tạo ${axisLabel} ${value}px, vượt mức tối đa ${policy.max}px.`,
      recommendation: "Giảm trục chủ đạo, tăng giới hạn tối đa hoặc bỏ ràng buộc tỷ lệ."
    });
  }
  if (value > availableSize) {
    return failure({
      code: "sizing-minimum-does-not-fit",
      message: `Tỷ lệ khung hình cần ${axisLabel} ${value}px nhưng vùng khả dụng chỉ có ${availableSize}px.`,
      recommendation: "Tăng khung cha hoặc giảm kích thước trục chủ đạo."
    });
  }
  return undefined;
}

export type ResolveCoupledSizeInput = {
  width: LayoutSizingPolicy;
  height: LayoutSizingPolicy;
  fixedSize: { width: number; height: number };
  intrinsicSize: { width: number; height: number };
  availableSize: { width: number; height: number };
};

export function resolveCoupledSize(input: ResolveCoupledSizeInput): LayoutValueResult<{ width: number; height: number }> {
  const width = resolveSizingPolicy({
    policy: input.width,
    fixedSize: input.fixedSize.width,
    intrinsicSize: input.intrinsicSize.width,
    availableSize: input.availableSize.width
  });
  if (!width.ok) return width;

  const height = resolveSizingPolicy({
    policy: input.height,
    fixedSize: input.fixedSize.height,
    intrinsicSize: input.intrinsicSize.height,
    availableSize: input.availableSize.height
  });
  if (!height.ok) return height;

  let resolvedWidth = width.value;
  let resolvedHeight = height.value;
  const ratio = input.width.aspectRatio ?? input.height.aspectRatio;

  if (ratio !== undefined) {
    if (input.width.aspectRatio !== undefined || input.width.mode !== "fill-container") {
      resolvedHeight = roundSceneNumber(resolvedWidth / ratio);
    } else {
      resolvedWidth = roundSceneNumber(resolvedHeight * ratio);
    }

  }

  const widthFailure = validateResolvedAxis(resolvedWidth, input.width, input.availableSize.width, "chiều rộng");
  if (widthFailure) return widthFailure;
  const heightFailure = validateResolvedAxis(resolvedHeight, input.height, input.availableSize.height, "chiều cao");
  if (heightFailure) return heightFailure;

  return { ok: true, value: { width: resolvedWidth, height: resolvedHeight } };
}
