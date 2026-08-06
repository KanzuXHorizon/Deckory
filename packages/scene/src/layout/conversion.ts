import type { Frame, SceneElement } from "@deckory/schema/v2";
import { layoutGrid, layoutStack, type AutoLayoutAlign, type AutoLayoutChild, type AutoLayoutJustify } from "./auto-layout";
import type { LayoutSizingMode, LayoutSizingPolicy } from "./sizing";
import { failure, normalizePadding, type LayoutFailure, type LayoutPaddingInput } from "./types";

export type LayoutGroupSnapshot = {
  parent: Extract<SceneElement, { kind: "group" | "stack" | "grid" }>;
  children: SceneElement[];
};

export type LayoutConversionMode = "freeform" | "constraint" | "stack-horizontal" | "stack-vertical" | "grid";

export type LayoutConversionOptions = {
  mode: LayoutConversionMode;
  slideId: string;
  padding?: LayoutPaddingInput;
  gap?: number;
  align?: AutoLayoutAlign;
  justify?: AutoLayoutJustify;
  wrap?: boolean;
  columns?: number;
};

export type ReplaceSceneElementsCommand = {
  type: "replace-scene-elements";
  slideId: string;
  elements: SceneElement[];
};

export type LayoutConversionSuccess = {
  ok: true;
  before: LayoutGroupSnapshot;
  after: LayoutGroupSnapshot;
  beforeBounds: Frame;
  afterBounds: Frame;
  command: ReplaceSceneElementsCommand;
  inverse: ReplaceSceneElementsCommand;
};

export type LayoutConversionResult = LayoutConversionSuccess | LayoutFailure;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function toSizingMode(value: "fixed" | "hug" | "fill" | undefined): LayoutSizingMode {
  if (value === "hug") return "hug-content";
  if (value === "fill") return "fill-container";
  return "fixed";
}

function childPolicy(child: SceneElement, axis: "width" | "height"): LayoutSizingPolicy {
  const constraints = child.constraints;
  const mode = toSizingMode(axis === "width" ? constraints?.width : constraints?.height);
  const fixed = axis === "width" ? child.frame.width : child.frame.height;
  const policy: LayoutSizingPolicy = { mode };
  if (mode === "fixed") policy.value = fixed;
  const minValue = axis === "width" ? constraints?.minWidth : constraints?.minHeight;
  const maxValue = axis === "width" ? constraints?.maxWidth : constraints?.maxHeight;
  if (minValue !== undefined) policy.min = minValue;
  if (maxValue !== undefined) policy.max = maxValue;
  return policy;
}

function toLayoutChild(child: SceneElement): AutoLayoutChild {
  return {
    id: child.id,
    frame: clone(child.frame),
    width: childPolicy(child, "width"),
    height: childPolicy(child, "height"),
    intrinsicSize: { width: child.frame.width, height: child.frame.height }
  };
}

function command(slideId: string, before: SceneElement[], after: SceneElement[]): { command: ReplaceSceneElementsCommand; inverse: ReplaceSceneElementsCommand } {
  return {
    command: { type: "replace-scene-elements", slideId, elements: clone(after) },
    inverse: { type: "replace-scene-elements", slideId, elements: clone(before) }
  };
}

function conversionFailure(source: LayoutFailure, elementIds: string[]): LayoutFailure {
  return failure({
    code: "layout-conversion-does-not-fit",
    message: source.diagnostics[0]?.message ?? "Không thể chuyển chế độ layout mà vẫn giữ nội dung hợp lệ.",
    recommendation: source.diagnostics[0]?.recommendation ?? "Tăng kích thước nhóm hoặc điều chỉnh sizing trước khi chuyển đổi.",
    elementIds
  });
}

export function convertGroupLayoutMode(input: LayoutGroupSnapshot, options: LayoutConversionOptions): LayoutConversionResult {
  const before = clone(input);
  const parentFrame = clone(input.parent.frame);
  const childrenIds = input.children.map((child) => child.id);
  if (new Set(childrenIds).size !== childrenIds.length) {
    return failure({
      code: "invalid-layout-input",
      message: "Không thể chuyển layout vì danh sách thành phần con có ID trùng nhau.",
      recommendation: "Đổi ID trùng trước khi chuyển chế độ layout.",
      elementIds: childrenIds
    });
  }

  let afterParent: LayoutGroupSnapshot["parent"];
  let afterChildren = clone(input.children);

  if (options.mode === "freeform" || options.mode === "constraint") {
    afterParent = {
      ...clone(input.parent),
      kind: "group",
      content: { children: childrenIds }
    } as Extract<SceneElement, { kind: "group" }>;
    if (options.mode === "constraint") {
      afterChildren = afterChildren.map((child) => ({
        ...child,
        constraints: {
          ...child.constraints,
          horizontal: child.constraints?.horizontal ?? "left",
          vertical: child.constraints?.vertical ?? "top"
        }
      })) as SceneElement[];
    }
  } else if (options.mode === "stack-horizontal" || options.mode === "stack-vertical") {
    const padding = options.padding ?? 0;
    const normalizedPadding = normalizePadding(padding);
    const result = layoutStack({
      frame: { x: 0, y: 0, width: parentFrame.width, height: parentFrame.height },
      direction: options.mode === "stack-horizontal" ? "horizontal" : "vertical",
      padding: normalizedPadding,
      gap: options.gap ?? 0,
      align: options.align ?? "start",
      justify: options.justify ?? "start",
      wrap: options.wrap ?? false,
      children: input.children.map(toLayoutChild)
    });
    if (!result.ok) return conversionFailure(result, childrenIds);
    afterChildren = afterChildren.map((child) => ({ ...child, frame: result.frames[child.id]! })) as SceneElement[];
    afterParent = {
      ...clone(input.parent),
      kind: "stack",
      content: {
        direction: options.mode === "stack-horizontal" ? "horizontal" : "vertical",
        gap: options.gap ?? 0,
        padding: [normalizedPadding.top, normalizedPadding.right, normalizedPadding.bottom, normalizedPadding.left],
        align: options.align ?? "start",
        justify: options.justify ?? "start",
        wrap: options.wrap ?? false
      }
    } as Extract<SceneElement, { kind: "stack" }>;
  } else {
    const padding = normalizePadding(options.padding ?? 0);
    if (!(padding.top === padding.right && padding.right === padding.bottom && padding.bottom === padding.left)) {
      return failure({
        code: "invalid-layout-input",
        message: "Grid contract hiện tại chỉ lưu được padding đồng nhất ở bốn cạnh.",
        recommendation: "Dùng một giá trị padding chung hoặc yêu cầu mở rộng schema grid.",
        elementIds: [input.parent.id]
      });
    }
    const columns = options.columns ?? Math.max(1, Math.ceil(Math.sqrt(input.children.length)));
    const gap = options.gap ?? 0;
    const result = layoutGrid({
      frame: { x: 0, y: 0, width: parentFrame.width, height: parentFrame.height },
      columns,
      padding: padding.top,
      columnGap: gap,
      rowGap: gap,
      align: options.align ?? "stretch",
      children: input.children.map(toLayoutChild)
    });
    if (!result.ok) return conversionFailure(result, childrenIds);
    afterChildren = afterChildren.map((child) => ({ ...child, frame: result.frames[child.id]! })) as SceneElement[];
    afterParent = {
      ...clone(input.parent),
      kind: "grid",
      content: {
        columns,
        rows: Math.max(1, Math.ceil(input.children.length / columns)),
        columnGap: gap,
        rowGap: gap,
        padding: padding.top
      }
    } as Extract<SceneElement, { kind: "grid" }>;
  }

  const after: LayoutGroupSnapshot = { parent: afterParent, children: afterChildren };
  const beforeElements: SceneElement[] = [before.parent, ...before.children];
  const afterElements: SceneElement[] = [after.parent, ...after.children];
  const commands = command(options.slideId, beforeElements, afterElements);

  return {
    ok: true,
    before,
    after,
    beforeBounds: clone(parentFrame),
    afterBounds: clone(after.parent.frame),
    ...commands
  };
}
