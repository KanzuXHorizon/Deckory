import type { Frame } from "@deckory/schema/v2";
import { roundSceneNumber } from "../geometry";
import { resolveSizingPolicy, type LayoutSizingPolicy } from "./sizing";
import { failure, normalizePadding, type LayoutFailure, type LayoutPaddingInput } from "./types";

export type AutoLayoutAlign = "start" | "center" | "end" | "stretch";
export type AutoLayoutJustify = "start" | "center" | "end" | "space-between";

export type AutoLayoutChild = {
  id: string;
  frame: Frame;
  width: LayoutSizingPolicy;
  height: LayoutSizingPolicy;
  intrinsicSize?: { width: number; height: number };
};

export type StackLayoutInput = {
  frame: Frame;
  direction: "horizontal" | "vertical";
  padding: LayoutPaddingInput;
  gap: number;
  lineGap?: number;
  align: AutoLayoutAlign;
  justify: AutoLayoutJustify;
  wrap: boolean;
  children: AutoLayoutChild[];
};

export type GridLayoutInput = {
  frame: Frame;
  columns: number;
  rows?: number;
  padding: LayoutPaddingInput;
  columnGap: number;
  rowGap: number;
  align: AutoLayoutAlign;
  children: AutoLayoutChild[];
};

export type AutoLayoutSuccess = {
  ok: true;
  frames: Record<string, Frame>;
  lines: string[][];
};

export type AutoLayoutResult = AutoLayoutSuccess | LayoutFailure;

type MeasuredChild = {
  child: AutoLayoutChild;
  main: number;
  cross: number;
  mainMinimum: number;
  mainMaximum: number;
  mainFill: boolean;
};

function finiteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and non-negative`);
}

function sizingForAxis(child: AutoLayoutChild, axis: "width" | "height"): LayoutSizingPolicy {
  return axis === "width" ? child.width : child.height;
}

function frameSizeForAxis(child: AutoLayoutChild, axis: "width" | "height"): number {
  return child.frame[axis];
}

function intrinsicForAxis(child: AutoLayoutChild, axis: "width" | "height"): number {
  return child.intrinsicSize?.[axis] ?? child.frame[axis];
}

function minimumForPolicy(policy: LayoutSizingPolicy): number {
  return policy.min ?? (policy.mode === "fixed" ? (policy.value ?? 1) : 0);
}

function maximumForPolicy(policy: LayoutSizingPolicy): number {
  return policy.max ?? Number.POSITIVE_INFINITY;
}

function measureChild(
  child: AutoLayoutChild,
  mainAxis: "width" | "height",
  crossAxis: "width" | "height",
  availableMain: number,
  availableCross: number,
  forceCrossStretch: boolean
): MeasuredChild | LayoutFailure {
  const mainPolicy = sizingForAxis(child, mainAxis);
  const crossPolicy = sizingForAxis(child, crossAxis);
  const mainFill = mainPolicy.mode === "fill-container";
  const mainMinimum = minimumForPolicy(mainPolicy);
  const mainMaximum = maximumForPolicy(mainPolicy);

  let main = mainMinimum;
  if (!mainFill) {
    const resolved = resolveSizingPolicy({
      policy: mainPolicy,
      fixedSize: frameSizeForAxis(child, mainAxis),
      intrinsicSize: intrinsicForAxis(child, mainAxis),
      availableSize: availableMain
    });
    if (!resolved.ok) return resolved;
    main = resolved.value;
  }

  let cross: number;
  if (forceCrossStretch || crossPolicy.mode === "fill-container") {
    const minimum = minimumForPolicy(crossPolicy);
    const maximum = maximumForPolicy(crossPolicy);
    if (availableCross < minimum) {
      return failure({
        code: "auto-layout-does-not-fit",
        message: `Thành phần "${child.id}" cần tối thiểu ${minimum}px theo trục phụ nhưng chỉ còn ${availableCross}px.`,
        recommendation: "Tăng kích thước khung cha, giảm padding hoặc tách nội dung sang nhóm khác.",
        elementIds: [child.id]
      });
    }
    cross = Math.min(availableCross, maximum);
  } else {
    const resolved = resolveSizingPolicy({
      policy: crossPolicy,
      fixedSize: frameSizeForAxis(child, crossAxis),
      intrinsicSize: intrinsicForAxis(child, crossAxis),
      availableSize: availableCross
    });
    if (!resolved.ok) return resolved;
    cross = resolved.value;
  }

  return { child, main, cross, mainMinimum, mainMaximum, mainFill };
}

function allocateFillSizes(items: MeasuredChild[], availableMain: number, gap: number): LayoutFailure | number[] {
  const totalGap = Math.max(0, items.length - 1) * gap;
  const fixedTotal = items.reduce((sum, item) => sum + (item.mainFill ? item.mainMinimum : item.main), 0);
  if (fixedTotal + totalGap > availableMain + 0.001) {
    return failure({
      code: "auto-layout-does-not-fit",
      message: `Nội dung cần ${roundSceneNumber(fixedTotal + totalGap)}px nhưng vùng khả dụng chỉ có ${roundSceneNumber(availableMain)}px.`,
      recommendation: "Tăng kích thước khung cha, giảm padding/gap hoặc tách nội dung thành nhiều nhóm.",
      elementIds: items.map((item) => item.child.id)
    });
  }

  const sizes = items.map((item) => item.mainFill ? item.mainMinimum : item.main);
  let remaining = availableMain - totalGap - sizes.reduce((sum, size) => sum + size, 0);
  let candidates = items.map((item, index) => ({ item, index })).filter(({ item }) => item.mainFill && item.mainMaximum > item.mainMinimum);

  while (remaining > 0.001 && candidates.length > 0) {
    const share = remaining / candidates.length;
    let consumed = 0;
    const nextCandidates: typeof candidates = [];
    for (const candidate of candidates) {
      const capacity = candidate.item.mainMaximum - sizes[candidate.index]!;
      const delta = Math.min(share, capacity);
      sizes[candidate.index] = sizes[candidate.index]! + delta;
      consumed += delta;
      if (capacity - delta > 0.001) nextCandidates.push(candidate);
    }
    if (consumed <= 0.001) break;
    remaining -= consumed;
    candidates = nextCandidates;
  }

  return sizes.map(roundSceneNumber);
}

function justifyOffsets(justify: AutoLayoutJustify, available: number, content: number, itemCount: number, baseGap: number): { offset: number; gap: number } {
  const extra = Math.max(0, available - content);
  if (justify === "center") return { offset: extra / 2, gap: baseGap };
  if (justify === "end") return { offset: extra, gap: baseGap };
  if (justify === "space-between" && itemCount > 1) return { offset: 0, gap: baseGap + extra / (itemCount - 1) };
  return { offset: 0, gap: baseGap };
}

function crossOffset(align: AutoLayoutAlign, available: number, size: number): number {
  if (align === "center") return (available - size) / 2;
  if (align === "end") return available - size;
  return 0;
}

function toFrame(
  direction: "horizontal" | "vertical",
  mainStart: number,
  crossStart: number,
  mainSize: number,
  crossSize: number
): Frame {
  return direction === "horizontal"
    ? { x: roundSceneNumber(mainStart), y: roundSceneNumber(crossStart), width: roundSceneNumber(mainSize), height: roundSceneNumber(crossSize) }
    : { x: roundSceneNumber(crossStart), y: roundSceneNumber(mainStart), width: roundSceneNumber(crossSize), height: roundSceneNumber(mainSize) };
}

export function layoutStack(input: StackLayoutInput): AutoLayoutResult {
  finiteNonNegative(input.gap, "Stack gap");
  finiteNonNegative(input.lineGap ?? input.gap, "Stack line gap");
  const padding = normalizePadding(input.padding);
  const horizontal = input.direction === "horizontal";
  const mainAxis = horizontal ? "width" : "height";
  const crossAxis = horizontal ? "height" : "width";
  const mainPaddingStart = horizontal ? padding.left : padding.top;
  const mainPaddingEnd = horizontal ? padding.right : padding.bottom;
  const crossPaddingStart = horizontal ? padding.top : padding.left;
  const crossPaddingEnd = horizontal ? padding.bottom : padding.right;
  const frameMainStart = horizontal ? input.frame.x : input.frame.y;
  const frameCrossStart = horizontal ? input.frame.y : input.frame.x;
  const frameMain = horizontal ? input.frame.width : input.frame.height;
  const frameCross = horizontal ? input.frame.height : input.frame.width;
  const availableMain = frameMain - mainPaddingStart - mainPaddingEnd;
  const availableCross = frameCross - crossPaddingStart - crossPaddingEnd;

  if (availableMain <= 0 || availableCross <= 0) {
    return failure({
      code: "auto-layout-does-not-fit",
      message: "Padding chiếm toàn bộ vùng nội dung của auto layout.",
      recommendation: "Giảm padding hoặc tăng kích thước khung cha."
    });
  }

  const measured: MeasuredChild[] = [];
  for (const child of input.children) {
    const item = measureChild(child, mainAxis, crossAxis, availableMain, availableCross, input.align === "stretch" && !input.wrap);
    if ("ok" in item && item.ok === false) {
      return failure({
        code: "auto-layout-does-not-fit",
        message: item.diagnostics[0]?.message ?? `Không thể đo thành phần "${child.id}".`,
        recommendation: item.diagnostics[0]?.recommendation ?? "Kiểm tra sizing policy và kích thước khung cha.",
        elementIds: [child.id]
      });
    }
    measured.push(item as MeasuredChild);
  }

  const lineItems: MeasuredChild[][] = [];
  if (!input.wrap) {
    lineItems.push(measured);
  } else {
    let current: MeasuredChild[] = [];
    let currentMinimum = 0;
    for (const item of measured) {
      const itemMinimum = item.mainFill ? item.mainMinimum : item.main;
      const nextMinimum = current.length === 0 ? itemMinimum : currentMinimum + input.gap + itemMinimum;
      if (current.length > 0 && nextMinimum > availableMain + 0.001) {
        lineItems.push(current);
        current = [item];
        currentMinimum = itemMinimum;
      } else {
        current.push(item);
        currentMinimum = nextMinimum;
      }
      if (itemMinimum > availableMain + 0.001) {
        return failure({
          code: "auto-layout-does-not-fit",
          message: `Thành phần "${item.child.id}" rộng hơn một dòng auto layout.`,
          recommendation: "Giảm kích thước tối thiểu, tăng khung cha hoặc tách nội dung.",
          elementIds: [item.child.id]
        });
      }
    }
    if (current.length > 0) lineItems.push(current);
  }

  const lineCrossSizes = input.wrap
    ? lineItems.map((line) => Math.max(0, ...line.map((item) => item.cross)))
    : lineItems.map(() => availableCross);
  const lineGap = input.lineGap ?? input.gap;
  const totalCross = lineCrossSizes.reduce((sum, value) => sum + value, 0) + Math.max(0, lineItems.length - 1) * lineGap;
  if (totalCross > availableCross + 0.001) {
    return failure({
      code: "auto-layout-does-not-fit",
      message: `Các dòng cần ${roundSceneNumber(totalCross)}px theo trục phụ nhưng chỉ có ${roundSceneNumber(availableCross)}px.`,
      recommendation: "Tăng kích thước khung cha, giảm line gap hoặc tách nội dung.",
      elementIds: input.children.map((child) => child.id)
    });
  }

  const frames: Record<string, Frame> = {};
  let crossCursor = frameCrossStart + crossPaddingStart;
  lineItems.forEach((line, lineIndex) => {
    const lineCross = lineCrossSizes[lineIndex]!;
    const sizes = allocateFillSizes(line, availableMain, input.gap);
    if (!Array.isArray(sizes)) return;
    const baseContent = sizes.reduce((sum, size) => sum + size, 0) + Math.max(0, line.length - 1) * input.gap;
    const justification = justifyOffsets(input.justify, availableMain, baseContent, line.length, input.gap);
    let mainCursor = frameMainStart + mainPaddingStart + justification.offset;

    line.forEach((item, index) => {
      const size = sizes[index]!;
      const stretchedCross = input.align === "stretch" ? lineCross : item.cross;
      const itemCross = Math.min(stretchedCross, maximumForPolicy(sizingForAxis(item.child, crossAxis)));
      const itemCrossStart = crossCursor + crossOffset(input.align, lineCross, itemCross);
      frames[item.child.id] = toFrame(input.direction, mainCursor, itemCrossStart, size, itemCross);
      mainCursor += size + justification.gap;
    });

    crossCursor += lineCross + lineGap;
  });

  if (Object.keys(frames).length !== input.children.length) {
    return failure({
      code: "auto-layout-does-not-fit",
      message: "Không thể phân bổ kích thước fill-container cho tất cả thành phần.",
      recommendation: "Kiểm tra min/max sizing hoặc tăng kích thước khung cha."
    });
  }

  return { ok: true, frames, lines: lineItems.map((line) => line.map((item) => item.child.id)) };
}

function resolveGridAxisSize(policy: LayoutSizingPolicy, fixedSize: number, intrinsicSize: number, cellSize: number, stretch: boolean): number | LayoutFailure {
  const minimum = minimumForPolicy(policy);
  const maximum = maximumForPolicy(policy);
  if (cellSize < minimum) {
    return failure({
      code: "grid-does-not-fit",
      message: `Ô lưới ${roundSceneNumber(cellSize)}px nhỏ hơn mức tối thiểu ${minimum}px.`,
      recommendation: "Giảm số cột/hàng, giảm gap hoặc tăng kích thước khung lưới."
    });
  }
  if (stretch || policy.mode === "fill-container") return roundSceneNumber(Math.min(cellSize, maximum));
  const resolved = resolveSizingPolicy({ policy, fixedSize, intrinsicSize, availableSize: cellSize });
  return resolved.ok ? resolved.value : resolved;
}

export function layoutGrid(input: GridLayoutInput): AutoLayoutResult {
  if (!Number.isInteger(input.columns) || input.columns <= 0) throw new RangeError("Grid columns must be a positive integer");
  if (input.rows !== undefined && (!Number.isInteger(input.rows) || input.rows <= 0)) throw new RangeError("Grid rows must be a positive integer");
  finiteNonNegative(input.columnGap, "Grid column gap");
  finiteNonNegative(input.rowGap, "Grid row gap");
  const padding = normalizePadding(input.padding);
  const rows = input.rows ?? Math.max(1, Math.ceil(input.children.length / input.columns));
  if (input.children.length > input.columns * rows) {
    return failure({
      code: "grid-does-not-fit",
      message: `Lưới ${input.columns} × ${rows} không đủ ô cho ${input.children.length} thành phần.`,
      recommendation: "Tăng số hàng/cột hoặc tách nội dung thành nhiều lưới."
    });
  }

  const innerWidth = input.frame.width - padding.left - padding.right;
  const innerHeight = input.frame.height - padding.top - padding.bottom;
  const cellWidth = (innerWidth - Math.max(0, input.columns - 1) * input.columnGap) / input.columns;
  const cellHeight = (innerHeight - Math.max(0, rows - 1) * input.rowGap) / rows;
  if (cellWidth <= 0 || cellHeight <= 0) {
    return failure({
      code: "grid-does-not-fit",
      message: "Padding hoặc gap làm kích thước ô lưới không còn hợp lệ.",
      recommendation: "Giảm padding/gap, giảm số hàng cột hoặc tăng kích thước khung lưới."
    });
  }

  const frames: Record<string, Frame> = {};
  for (let index = 0; index < input.children.length; index += 1) {
    const child = input.children[index]!;
    const column = index % input.columns;
    const row = Math.floor(index / input.columns);
    const width = resolveGridAxisSize(child.width, child.frame.width, child.intrinsicSize?.width ?? child.frame.width, cellWidth, input.align === "stretch");
    if (typeof width !== "number") return width;
    const height = resolveGridAxisSize(child.height, child.frame.height, child.intrinsicSize?.height ?? child.frame.height, cellHeight, input.align === "stretch");
    if (typeof height !== "number") return height;
    const cellX = input.frame.x + padding.left + column * (cellWidth + input.columnGap);
    const cellY = input.frame.y + padding.top + row * (cellHeight + input.rowGap);
    frames[child.id] = {
      x: roundSceneNumber(cellX + crossOffset(input.align, cellWidth, width)),
      y: roundSceneNumber(cellY + crossOffset(input.align, cellHeight, height)),
      width,
      height
    };
  }

  const lines = Array.from({ length: rows }, (_, row) => input.children.slice(row * input.columns, (row + 1) * input.columns).map((child) => child.id));
  return { ok: true, frames, lines };
}
