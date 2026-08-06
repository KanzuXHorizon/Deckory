import type { Frame, SceneElement, SceneSlide } from "@deckory/schema/v2";
import { normalizeFrame } from "./geometry";
import type { ReplaceSceneElementsCommand } from "./layout/conversion";

export type HierarchyTransaction = {
  slide: SceneSlide;
  command: ReplaceSceneElementsCommand;
  inverse: ReplaceSceneElementsCommand;
};

export type FlattenedSceneNode = {
  id: string;
  depth: number;
  parentId?: string;
  element: SceneElement;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function elementMap(slide: SceneSlide): Map<string, SceneElement> {
  return new Map(slide.elements.map((element) => [element.id, element]));
}

function requireElement(slide: SceneSlide, id: string): SceneElement {
  const element = slide.elements.find((candidate) => candidate.id === id);
  if (!element) throw new Error(`Thành phần "${id}" không tồn tại trong slide "${slide.id}".`);
  return element;
}

function commandPair(slideId: string, before: SceneElement[], after: SceneElement[]): Pick<HierarchyTransaction, "command" | "inverse"> {
  return {
    command: { type: "replace-scene-elements", slideId, elements: clone(after) },
    inverse: { type: "replace-scene-elements", slideId, elements: clone(before) }
  };
}

function parentFrameAbsolute(slide: SceneSlide, parentId: string | undefined, frames: Record<string, Frame>): Frame {
  return parentId ? frames[parentId]! : { x: 0, y: 0, width: 1280, height: 720 };
}

export function absoluteFrames(slide: SceneSlide): Record<string, Frame> {
  const byId = elementMap(slide);
  const cache = new Map<string, Frame>();
  const resolving = new Set<string>();

  const resolve = (id: string): Frame => {
    const cached = cache.get(id);
    if (cached) return cached;
    if (resolving.has(id)) throw new Error(`Hierarchy chứa chu kỳ tại thành phần "${id}".`);
    const element = byId.get(id);
    if (!element) throw new Error(`Thành phần "${id}" không tồn tại.`);
    resolving.add(id);
    const parent = element.parentId ? resolve(element.parentId) : undefined;
    const frame = normalizeFrame({
      ...element.frame,
      x: element.frame.x + (parent?.x ?? 0),
      y: element.frame.y + (parent?.y ?? 0)
    });
    resolving.delete(id);
    cache.set(id, frame);
    return frame;
  };

  const result: Record<string, Frame> = {};
  for (const element of slide.elements) result[element.id] = resolve(element.id);
  return result;
}

function ensureStableId(id: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`ID nhóm "${id}" phải ở dạng kebab-case ổn định.`);
}

function hasSelectedAncestor(slide: SceneSlide, selectedIds: Set<string>, element: SceneElement): boolean {
  let parentId = element.parentId;
  while (parentId) {
    if (selectedIds.has(parentId)) return true;
    parentId = slide.elements.find((candidate) => candidate.id === parentId)?.parentId;
  }
  return false;
}

function withParent(element: SceneElement, parentId: string | undefined): SceneElement {
  const next = clone(element) as SceneElement & { parentId?: string };
  if (parentId === undefined) delete next.parentId;
  else next.parentId = parentId;
  return next;
}

function updateGroupChildren(element: SceneElement, updater: (ids: string[]) => string[]): SceneElement {
  if (element.kind !== "group") return element;
  return { ...element, content: { children: updater(element.content.children ?? []) } };
}

function hasNonIdentityTransform(element: SceneElement): boolean {
  const transform = element.transform;
  if (!transform) return false;
  return (transform.rotation ?? 0) !== 0
    || (transform.scaleX ?? 1) !== 1
    || (transform.scaleY ?? 1) !== 1
    || (transform.skewX ?? 0) !== 0
    || (transform.skewY ?? 0) !== 0;
}

function hasTransformedAncestry(slide: SceneSlide, parentId: string | undefined): boolean {
  let currentId = parentId;
  while (currentId) {
    const current = requireElement(slide, currentId);
    if (hasNonIdentityTransform(current)) return true;
    currentId = current.parentId;
  }
  return false;
}

export function groupElements(
  slide: SceneSlide,
  elementIds: readonly string[],
  group: { id: string; name: string }
): HierarchyTransaction {
  if (elementIds.length < 2) throw new Error("Nhóm cần ít nhất hai thành phần.");
  ensureStableId(group.id);
  if (slide.elements.some((element) => element.id === group.id)) throw new Error(`Thành phần "${group.id}" đã tồn tại.`);
  const selectedIds = new Set(elementIds);
  if (selectedIds.size !== elementIds.length) throw new Error("Danh sách nhóm chứa ID trùng.");
  const selected = elementIds.map((id) => requireElement(slide, id));
  if (selected.some((element) => hasSelectedAncestor(slide, selectedIds, element))) {
    throw new Error("Không thể nhóm đồng thời một thành phần cha và hậu duệ của nó.");
  }
  const commonParent = selected[0]!.parentId;
  if (selected.some((element) => element.parentId !== commonParent)) {
    throw new Error("Các thành phần cần cùng một cấp hierarchy trước khi nhóm.");
  }

  const left = Math.min(...selected.map((element) => element.frame.x));
  const top = Math.min(...selected.map((element) => element.frame.y));
  const right = Math.max(...selected.map((element) => element.frame.x + element.frame.width));
  const bottom = Math.max(...selected.map((element) => element.frame.y + element.frame.height));
  const groupElementBase = {
    id: group.id,
    name: group.name,
    kind: "group" as const,
    frame: normalizeFrame({ x: left, y: top, width: right - left, height: bottom - top }),
    zIndex: Math.min(...selected.map((element) => element.zIndex)),
    content: { children: [...elementIds] },
    accessibility: { label: group.name }
  };
  const groupElement: Extract<SceneElement, { kind: "group" }> = commonParent === undefined
    ? groupElementBase
    : { ...groupElementBase, parentId: commonParent };

  const firstSelectedIndex = Math.min(...selected.map((element) => slide.elements.findIndex((candidate) => candidate.id === element.id)));
  const nextElements = slide.elements.map((element) => {
    if (!selectedIds.has(element.id)) return clone(element);
    const child = withParent(element, group.id);
    return {
      ...child,
      frame: normalizeFrame({
        ...child.frame,
        x: child.frame.x - left,
        y: child.frame.y - top
      })
    } as SceneElement;
  });
  nextElements.splice(firstSelectedIndex, 0, groupElement);

  if (commonParent) {
    const parentIndex = nextElements.findIndex((element) => element.id === commonParent);
    if (parentIndex >= 0) {
      nextElements[parentIndex] = updateGroupChildren(nextElements[parentIndex]!, (ids) => {
        const filtered = ids.filter((id) => !selectedIds.has(id));
        const insertionIndex = Math.max(0, ids.findIndex((id) => selectedIds.has(id)));
        filtered.splice(Math.min(insertionIndex, filtered.length), 0, group.id);
        return filtered;
      });
    }
  }

  const nextSlide = { ...clone(slide), elements: nextElements };
  return { slide: nextSlide, ...commandPair(slide.id, slide.elements, nextElements) };
}

export function ungroupElement(slide: SceneSlide, groupId: string): HierarchyTransaction {
  const group = requireElement(slide, groupId);
  if (group.kind !== "group" && group.kind !== "stack" && group.kind !== "grid") {
    throw new Error(`Thành phần "${groupId}" không phải container có thể ungroup.`);
  }
  const directChildren = slide.elements.filter((element) => element.parentId === groupId);
  if (directChildren.length === 0) throw new Error(`Nhóm "${groupId}" không có thành phần con.`);
  if (hasNonIdentityTransform(group)) {
    throw new Error(`Không thể ungroup "${groupId}" khi container đang có transform xoay, scale hoặc skew; hãy reset transform trước để giữ nguyên hình học.`);
  }

  const childIds = new Set(directChildren.map((element) => element.id));
  let nextElements = slide.elements
    .filter((element) => element.id !== groupId)
    .map((element) => {
      if (!childIds.has(element.id)) return clone(element);
      const next = withParent(element, group.parentId);
      return {
        ...next,
        frame: normalizeFrame({ ...next.frame, x: next.frame.x + group.frame.x, y: next.frame.y + group.frame.y })
      } as SceneElement;
    });

  if (group.parentId) {
    nextElements = nextElements.map((element) => element.id === group.parentId
      ? updateGroupChildren(element, (ids) => ids.flatMap((id) => id === groupId ? directChildren.map((child) => child.id) : [id]))
      : element);
  }

  const nextSlide = { ...clone(slide), elements: nextElements };
  return { slide: nextSlide, ...commandPair(slide.id, slide.elements, nextElements) };
}

function isDescendant(slide: SceneSlide, possibleDescendantId: string, ancestorId: string): boolean {
  let current = slide.elements.find((element) => element.id === possibleDescendantId)?.parentId;
  while (current) {
    if (current === ancestorId) return true;
    current = slide.elements.find((element) => element.id === current)?.parentId;
  }
  return false;
}

export function reparentElements(slide: SceneSlide, elementIds: readonly string[], newParentId: string | undefined): HierarchyTransaction {
  if (elementIds.length === 0) throw new Error("Cần chọn ít nhất một thành phần để đổi parent.");
  const selectedIds = new Set(elementIds);
  if (selectedIds.size !== elementIds.length) throw new Error("Danh sách reparent chứa ID trùng.");
  const selected = elementIds.map((id) => requireElement(slide, id));
  if (selected.some((element) => hasSelectedAncestor(slide, selectedIds, element))) {
    throw new Error("Không thể reparent đồng thời một thành phần cha và hậu duệ của nó.");
  }
  if (newParentId !== undefined) {
    const parent = requireElement(slide, newParentId);
    for (const id of elementIds) {
      if (id === newParentId || isDescendant(slide, newParentId, id)) {
        throw new Error(`Không thể reparent "${id}" vào "${newParentId}" vì thao tác sẽ tạo chu kỳ hierarchy.`);
      }
    }
    if (parent.kind !== "group" && parent.kind !== "stack" && parent.kind !== "grid") {
      throw new Error(`Thành phần "${newParentId}" không thể chứa thành phần con.`);
    }
  }

  for (const element of selected) {
    if (element.parentId === newParentId) continue;
    if (hasTransformedAncestry(slide, element.parentId) || hasTransformedAncestry(slide, newParentId)) {
      throw new Error(`Không thể reparent "${element.id}" qua hierarchy có transform xoay, scale hoặc skew; hãy reset transform trước.`);
    }
  }

  const beforeAbsolute = absoluteFrames(slide);
  const parentAbsolute = parentFrameAbsolute(slide, newParentId, beforeAbsolute);
  let nextElements = slide.elements.map((element) => {
    if (!selectedIds.has(element.id)) return clone(element);
    const absolute = beforeAbsolute[element.id]!;
    const next = withParent(element, newParentId);
    return {
      ...next,
      frame: normalizeFrame({
        ...next.frame,
        x: absolute.x - parentAbsolute.x,
        y: absolute.y - parentAbsolute.y
      })
    } as SceneElement;
  });

  const previousParents = new Set(selected.map((element) => element.parentId).filter((id): id is string => id !== undefined));
  nextElements = nextElements.map((element) => {
    if (previousParents.has(element.id)) return updateGroupChildren(element, (ids) => ids.filter((id) => !selectedIds.has(id)));
    if (newParentId !== undefined && element.id === newParentId) {
      return updateGroupChildren(element, (ids) => [...ids.filter((id) => !selectedIds.has(id)), ...elementIds]);
    }
    return element;
  });

  const nextSlide = { ...clone(slide), elements: nextElements };
  return { slide: nextSlide, ...commandPair(slide.id, slide.elements, nextElements) };
}

export function moveElementInHierarchy(
  slide: SceneSlide,
  elementId: string,
  targetParentId: string | undefined,
  targetIndex: number
): HierarchyTransaction {
  if (!Number.isInteger(targetIndex) || targetIndex < 0) throw new RangeError("Vị trí layer phải là số nguyên không âm.");
  requireElement(slide, elementId);
  const reparented = reparentElements(slide, [elementId], targetParentId).slide;
  const siblings = reparented.elements.filter((element) => element.parentId === targetParentId && element.id !== elementId);
  if (targetIndex > siblings.length) {
    throw new RangeError(`Vị trí layer ${targetIndex} vượt quá ${siblings.length} sibling khả dụng.`);
  }

  const orderedSiblingIds = siblings.map((element) => element.id);
  orderedSiblingIds.splice(targetIndex, 0, elementId);
  const zIndices = reparented.elements
    .filter((element) => element.parentId === targetParentId)
    .map((element) => element.zIndex)
    .sort((left, right) => left - right);
  const zIndexById = new Map(orderedSiblingIds.map((id, index) => [id, zIndices[index]! ]));

  const withoutMoving = reparented.elements.filter((element) => element.id !== elementId);
  const moving = reparented.elements.find((element) => element.id === elementId)!;
  let insertionIndex: number;
  if (targetIndex < siblings.length) {
    insertionIndex = withoutMoving.findIndex((element) => element.id === siblings[targetIndex]!.id);
  } else if (siblings.length > 0) {
    insertionIndex = withoutMoving.findIndex((element) => element.id === siblings.at(-1)!.id) + 1;
  } else if (targetParentId !== undefined) {
    insertionIndex = withoutMoving.findIndex((element) => element.id === targetParentId) + 1;
  } else {
    insertionIndex = withoutMoving.length;
  }
  if (insertionIndex < 0) insertionIndex = withoutMoving.length;
  withoutMoving.splice(insertionIndex, 0, moving);

  const nextElements = withoutMoving.map((element) => {
    const nextZIndex = zIndexById.get(element.id);
    let next = nextZIndex === undefined ? clone(element) : { ...clone(element), zIndex: nextZIndex } as SceneElement;
    if (targetParentId !== undefined && element.id === targetParentId) {
      next = updateGroupChildren(next, () => [...orderedSiblingIds]);
    }
    return next;
  });
  const nextSlide = { ...clone(slide), elements: nextElements };
  return { slide: nextSlide, ...commandPair(slide.id, slide.elements, nextElements) };
}

export function detachElementFromAutoLayout(slide: SceneSlide, elementId: string): HierarchyTransaction {
  const element = requireElement(slide, elementId);
  if (!element.parentId) throw new Error(`Thành phần "${elementId}" không nằm trong auto layout.`);
  const parent = requireElement(slide, element.parentId);
  if (parent.kind !== "stack" && parent.kind !== "grid") {
    throw new Error(`Parent của "${elementId}" phải là stack hoặc grid để detach khỏi auto layout.`);
  }
  return reparentElements(slide, [elementId], parent.parentId);
}

export function flattenSceneHierarchy(slide: SceneSlide): FlattenedSceneNode[] {
  absoluteFrames(slide);
  const byParent = new Map<string | undefined, SceneElement[]>();
  for (const element of slide.elements) {
    const siblings = byParent.get(element.parentId) ?? [];
    siblings.push(element);
    byParent.set(element.parentId, siblings);
  }

  const result: FlattenedSceneNode[] = [];
  const visit = (element: SceneElement, depth: number): void => {
    const node: FlattenedSceneNode = { id: element.id, depth, element };
    if (element.parentId !== undefined) node.parentId = element.parentId;
    result.push(node);
    for (const child of byParent.get(element.id) ?? []) visit(child, depth + 1);
  };
  for (const root of byParent.get(undefined) ?? []) visit(root, 0);
  return result;
}
