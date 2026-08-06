import type { SceneElement } from "@deckory/schema/v2";

export type LayerNode = {
  id: string;
  element: SceneElement;
  children: LayerNode[];
};

export type LayerPatch = Pick<SceneElement, "name" | "locked" | "hidden">;

export type LayerPatchCommand = {
  type: "patch-element";
  slideId: string;
  elementId: string;
  patch: Partial<LayerPatch>;
};

export function buildLayersTree(elements: readonly SceneElement[]): LayerNode[] {
  const ids = new Set<string>();
  for (const element of elements) {
    if (ids.has(element.id)) throw new Error(`Layer ID "${element.id}" bị trùng.`);
    ids.add(element.id);
  }
  const nodes = new Map(elements.map((element) => [element.id, { id: element.id, element, children: [] as LayerNode[] }]));
  const roots: LayerNode[] = [];
  for (const element of elements) {
    const node = nodes.get(element.id)!;
    if (element.parentId === undefined) {
      roots.push(node);
      continue;
    }
    const parent = nodes.get(element.parentId);
    if (!parent) throw new Error(`Layer "${element.id}" tham chiếu parent không tồn tại: "${element.parentId}".`);
    parent.children.push(node);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const validate = (node: LayerNode): void => {
    if (visiting.has(node.id)) throw new Error(`Hierarchy layer chứa chu kỳ tại "${node.id}".`);
    if (visited.has(node.id)) return;
    visiting.add(node.id);
    node.children.forEach(validate);
    visiting.delete(node.id);
    visited.add(node.id);
  };
  nodes.forEach(validate);
  return roots;
}

export function filterLayersTree(nodes: readonly LayerNode[], query: string): LayerNode[] {
  const normalized = query.trim().toLocaleLowerCase("vi-VN");
  if (!normalized) return nodes.map((node) => ({ ...node, children: filterLayersTree(node.children, "") }));

  const filterNode = (node: LayerNode): LayerNode | undefined => {
    const selfMatches = `${node.element.name} ${node.element.kind} ${node.id}`.toLocaleLowerCase("vi-VN").includes(normalized);
    const matchingChildren = node.children.map(filterNode).filter((child): child is LayerNode => child !== undefined);
    if (!selfMatches && matchingChildren.length === 0) return undefined;
    return {
      ...node,
      children: selfMatches
        ? node.children.map((child) => ({ ...child, children: filterLayersTree(child.children, "") }))
        : matchingChildren
    };
  };

  return nodes.map(filterNode).filter((node): node is LayerNode => node !== undefined);
}

export function flattenLayersTree(nodes: readonly LayerNode[]): LayerNode[] {
  const result: LayerNode[] = [];
  const visit = (node: LayerNode): void => {
    result.push(node);
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return result;
}

export type LayerFocusMove = "next" | "previous" | "parent" | "first-child" | "last-child";

export type LayerTreeKeyInput = {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
};

export type LayerTreeKeyAction =
  | { type: "focus"; elementId: string }
  | { type: "select"; elementId: string; additive: boolean }
  | { type: "rename"; elementId: string };

export function moveLayerFocus(nodes: readonly LayerNode[], currentId: string, move: LayerFocusMove): string | undefined {
  const flat = flattenLayersTree(nodes);
  const index = flat.findIndex((node) => node.id === currentId);
  if (index < 0) return flat[0]?.id;
  const current = flat[index]!;
  if (move === "next") return flat[Math.min(index + 1, flat.length - 1)]?.id;
  if (move === "previous") return flat[Math.max(index - 1, 0)]?.id;
  if (move === "first-child") return current.children[0]?.id ?? current.id;
  if (move === "last-child") return current.children.at(-1)?.id ?? current.id;
  return current.element.parentId ?? current.id;
}

export function resolveLayerTreeKey(
  nodes: readonly LayerNode[],
  currentId: string,
  input: LayerTreeKeyInput
): LayerTreeKeyAction | undefined {
  if (input.key === "ArrowDown") return { type: "focus", elementId: moveLayerFocus(nodes, currentId, "next") ?? currentId };
  if (input.key === "ArrowUp") return { type: "focus", elementId: moveLayerFocus(nodes, currentId, "previous") ?? currentId };
  if (input.key === "ArrowRight") return { type: "focus", elementId: moveLayerFocus(nodes, currentId, "first-child") ?? currentId };
  if (input.key === "ArrowLeft") return { type: "focus", elementId: moveLayerFocus(nodes, currentId, "parent") ?? currentId };
  if (input.key === "Home") return { type: "focus", elementId: flattenLayersTree(nodes)[0]?.id ?? currentId };
  if (input.key === "End") return { type: "focus", elementId: flattenLayersTree(nodes).at(-1)?.id ?? currentId };
  if (input.key === "Enter") return { type: "select", elementId: currentId, additive: Boolean(input.shiftKey || input.ctrlKey || input.metaKey) };
  if (input.key === " ") return { type: "select", elementId: currentId, additive: true };
  if (input.key === "F2") return { type: "rename", elementId: currentId };
  return undefined;
}

export type LayerDropPosition = "before" | "inside" | "after";

export type LayerDropIntent = {
  elementId: string;
  parentId?: string;
  index: number;
};

function nodeMap(nodes: readonly LayerNode[]): Map<string, LayerNode> {
  return new Map(flattenLayersTree(nodes).map((node) => [node.id, node]));
}

function containsNode(root: LayerNode, targetId: string): boolean {
  return root.id === targetId || root.children.some((child) => containsNode(child, targetId));
}

export function resolveLayerDropIntent(
  nodes: readonly LayerNode[],
  draggedId: string,
  targetId: string,
  position: LayerDropPosition
): LayerDropIntent {
  const byId = nodeMap(nodes);
  const dragged = byId.get(draggedId);
  const target = byId.get(targetId);
  if (!dragged) throw new Error(`Layer kéo "${draggedId}" không tồn tại.`);
  if (!target) throw new Error(`Layer đích "${targetId}" không tồn tại.`);
  if (draggedId === targetId || containsNode(dragged, targetId)) {
    throw new Error(`Không thể thả "${draggedId}" vào hậu duệ vì thao tác sẽ tạo chu kỳ hierarchy.`);
  }

  let parentId: string | undefined;
  let siblings: readonly LayerNode[];
  let index: number;
  if (position === "inside") {
    if (target.element.kind !== "group" && target.element.kind !== "stack" && target.element.kind !== "grid") {
      throw new Error(`Layer "${targetId}" không thể chứa layer con.`);
    }
    parentId = targetId;
    siblings = target.children.filter((child) => child.id !== draggedId);
    index = siblings.length;
  } else {
    parentId = target.element.parentId;
    const parent = parentId ? byId.get(parentId) : undefined;
    siblings = (parent?.children ?? nodes).filter((node) => node.id !== draggedId);
    const targetIndex = siblings.findIndex((node) => node.id === targetId);
    if (targetIndex < 0) throw new Error(`Không thể xác định vị trí sibling của "${targetId}".`);
    index = targetIndex + (position === "after" ? 1 : 0);
  }

  const intent: LayerDropIntent = { elementId: draggedId, index };
  if (parentId !== undefined) intent.parentId = parentId;
  return intent;
}

export function resolveLayerRename(originalName: string, draftName: string, cancelled: boolean): Partial<LayerPatch> | undefined {
  if (cancelled) return undefined;
  const name = draftName.trim();
  if (!name || name === originalName) return undefined;
  return { name };
}

export function createLayerPatchCommand(
  slideId: string,
  elementId: string,
  patch: Partial<LayerPatch>
): LayerPatchCommand {
  if (Object.keys(patch).length === 0) throw new Error("Layer patch không được để trống.");
  if (patch.name !== undefined && patch.name.trim().length === 0) throw new Error("Tên layer không được để trống.");
  return { type: "patch-element", slideId, elementId, patch: structuredClone(patch) };
}
