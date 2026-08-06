import type { Frame } from "@deckory/schema/v2";

export type StudioSelection = {
  elementIds: string[];
  primaryElementId?: string;
};

export type SelectableElement = {
  id: string;
  parentId?: string;
  frame: Frame;
  locked?: boolean;
  hidden?: boolean;
};

export type PointerSelectionInput = {
  current: readonly string[];
  targetId: string;
  additive: boolean;
  documentOrder: readonly string[];
};

function ordered(ids: ReadonlySet<string>, documentOrder: readonly string[]): string[] {
  const known = documentOrder.filter((id) => ids.has(id));
  const knownSet = new Set(known);
  const unknown = [...ids].filter((id) => !knownSet.has(id)).sort();
  return [...known, ...unknown];
}

function selection(elementIds: string[], preferredPrimary?: string): StudioSelection {
  const result: StudioSelection = { elementIds };
  const primary = preferredPrimary && elementIds.includes(preferredPrimary)
    ? preferredPrimary
    : elementIds.at(-1);
  if (primary !== undefined) result.primaryElementId = primary;
  return result;
}

export function resolveSelectionFromPointer(input: PointerSelectionInput): StudioSelection {
  if (!input.additive) return selection([input.targetId], input.targetId);
  const next = new Set(input.current);
  const removing = next.has(input.targetId);
  if (removing) next.delete(input.targetId);
  else next.add(input.targetId);
  const elementIds = ordered(next, input.documentOrder);
  return selection(elementIds, removing ? elementIds.at(-1) : input.targetId);
}

function intersects(left: Frame, right: Frame): boolean {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
}

function contains(outer: Frame, inner: Frame): boolean {
  return inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height;
}

export function resolveMarqueeSelection(input: {
  elements: readonly SelectableElement[];
  marquee: Frame;
  mode: "contain" | "intersect";
  deepSelect: boolean;
}): StudioSelection {
  const elementIds = input.elements
    .filter((element) => !element.hidden && !element.locked)
    .filter((element) => input.deepSelect || element.parentId === undefined)
    .filter((element) => input.mode === "contain"
      ? contains(input.marquee, element.frame)
      : intersects(input.marquee, element.frame))
    .map((element) => element.id);
  return selection(elementIds);
}
