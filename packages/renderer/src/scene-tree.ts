import type { SceneElement } from "@deckory/schema/v2";

export type SceneTreeDiagnosticCode =
  | "scene-element-id-duplicate"
  | "scene-parent-missing"
  | "scene-hierarchy-cycle";

export type SceneTreeDiagnostic = {
  code: SceneTreeDiagnosticCode;
  elementId: string;
  parentId?: string;
  message: string;
};

export type SceneTreeNode = {
  element: SceneElement;
  children: SceneTreeNode[];
};

export type SceneTreeResult = {
  roots: SceneTreeNode[];
  diagnostics: SceneTreeDiagnostic[];
};

type IndexedElement = {
  element: SceneElement;
  index: number;
};

function compareIndexed(left: IndexedElement, right: IndexedElement): number {
  return left.element.zIndex - right.element.zIndex || left.index - right.index;
}

export function buildSceneTree(elements: readonly SceneElement[]): SceneTreeResult {
  const diagnostics: SceneTreeDiagnostic[] = [];
  const indexed = elements.map((element, index) => ({ element, index }));
  const byId = new Map<string, IndexedElement>();

  for (const item of indexed) {
    if (byId.has(item.element.id)) {
      diagnostics.push({
        code: "scene-element-id-duplicate",
        elementId: item.element.id,
        message: `Element ID bị trùng: ${item.element.id}`
      });
      continue;
    }
    byId.set(item.element.id, item);
  }

  for (const item of indexed) {
    const parentId = item.element.parentId;
    if (parentId && !byId.has(parentId)) {
      diagnostics.push({
        code: "scene-parent-missing",
        elementId: item.element.id,
        parentId,
        message: `parentId không tham chiếu thành phần hợp lệ: ${parentId}`
      });
    }
  }

  for (const item of indexed) {
    const path = new Set<string>();
    let current: IndexedElement | undefined = item;
    while (current) {
      if (path.has(current.element.id)) {
        diagnostics.push({
          code: "scene-hierarchy-cycle",
          elementId: item.element.id,
          ...(item.element.parentId ? { parentId: item.element.parentId } : {}),
          message: `Scene hierarchy chứa chu kỳ tại ${current.element.id}`
        });
        break;
      }
      path.add(current.element.id);
      current = current.element.parentId ? byId.get(current.element.parentId) : undefined;
    }
  }

  if (diagnostics.length > 0) return { roots: [], diagnostics };

  const childrenByParent = new Map<string, IndexedElement[]>();
  const roots: IndexedElement[] = [];
  for (const item of indexed) {
    const parentId = item.element.parentId;
    if (!parentId) {
      roots.push(item);
      continue;
    }
    const children = childrenByParent.get(parentId) ?? [];
    children.push(item);
    childrenByParent.set(parentId, children);
  }

  const toNode = (item: IndexedElement): SceneTreeNode => ({
    element: item.element,
    children: (childrenByParent.get(item.element.id) ?? [])
      .sort(compareIndexed)
      .map(toNode)
  });

  return {
    roots: roots.sort(compareIndexed).map(toNode),
    diagnostics
  };
}
