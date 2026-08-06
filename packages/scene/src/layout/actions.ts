import type { SceneElement } from "@deckory/schema/v2";

export type LayoutPatchCommand = {
  type: "patch-element";
  slideId: string;
  elementId: string;
  patch: Partial<Pick<SceneElement, "content" | "constraints">>;
};

type StackElement = Extract<SceneElement, { kind: "stack" }>;
type GridElement = Extract<SceneElement, { kind: "grid" }>;

type StackPatch = Partial<StackElement["content"]>;
type GridPatch = Partial<GridElement["content"]>;

export type ChildSizingPatch = {
  width?: "fixed" | "hug" | "fill";
  height?: "fixed" | "hug" | "fill";
};

function finiteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and non-negative`);
}

function validatePadding(padding: StackElement["content"]["padding"]): void {
  const values = Array.isArray(padding) ? padding : [padding];
  values.forEach((value) => finiteNonNegative(value, "Layout padding"));
}

function stackContent(element: StackElement, patch: StackPatch): StackElement["content"] {
  const next = { ...structuredClone(element.content), ...structuredClone(patch) };
  finiteNonNegative(next.gap, "Stack gap");
  validatePadding(next.padding);
  return next;
}

function gridContent(element: GridElement, patch: GridPatch): GridElement["content"] {
  const next = { ...structuredClone(element.content), ...structuredClone(patch) };
  if (!Number.isInteger(next.columns) || next.columns <= 0 || next.columns > 24) {
    throw new RangeError("Grid columns must be an integer from 1 to 24");
  }
  if (next.rows !== undefined && (!Number.isInteger(next.rows) || next.rows <= 0 || next.rows > 24)) {
    throw new RangeError("Grid rows must be an integer from 1 to 24");
  }
  finiteNonNegative(next.columnGap, "Grid column gap");
  finiteNonNegative(next.rowGap, "Grid row gap");
  finiteNonNegative(next.padding, "Grid padding");
  return next;
}

export function createLayoutContainerPatchCommand(
  slideId: string,
  element: SceneElement,
  patch: StackPatch | GridPatch
): LayoutPatchCommand {
  if (Object.keys(patch).length === 0) throw new Error("Layout patch không được để trống.");
  if (element.kind === "stack") {
    return {
      type: "patch-element",
      slideId,
      elementId: element.id,
      patch: { content: stackContent(element, patch as StackPatch) }
    };
  }
  if (element.kind === "grid") {
    return {
      type: "patch-element",
      slideId,
      elementId: element.id,
      patch: { content: gridContent(element, patch as GridPatch) }
    };
  }
  throw new Error(`Thành phần "${element.id}" phải là stack hoặc grid để cập nhật auto layout.`);
}

export function createChildSizingCommand(
  slideId: string,
  element: SceneElement,
  patch: ChildSizingPatch
): LayoutPatchCommand {
  if (patch.width === undefined && patch.height === undefined) throw new Error("Sizing patch không được để trống.");
  const constraints = { ...structuredClone(element.constraints) };
  if (patch.width !== undefined) constraints.width = patch.width;
  if (patch.height !== undefined) constraints.height = patch.height;
  return {
    type: "patch-element",
    slideId,
    elementId: element.id,
    patch: { constraints }
  };
}
