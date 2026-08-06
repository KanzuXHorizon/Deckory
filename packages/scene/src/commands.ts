import { DeckDocumentV2Schema, type DeckDocumentV2, type Frame, type SceneElement, type SceneSlide } from "@deckory/schema";

export type ElementFrameChange = { elementId: string; frame: Frame };
export type SceneElementPatch = Partial<Omit<SceneElement, "id" | "kind">>;
export type SceneSlidePatch = Partial<Omit<SceneSlide, "id" | "elements">>;

export type SceneCommand =
  | { type: "transform-elements"; slideId: string; changes: ElementFrameChange[] }
  | { type: "insert-elements"; slideId: string; elements: SceneElement[]; positions?: number[] }
  | { type: "delete-elements"; slideId: string; elementIds: string[] }
  | { type: "reorder-elements"; slideId: string; orderedIds: string[] }
  | { type: "patch-element"; slideId: string; elementId: string; patch: SceneElementPatch }
  | { type: "patch-slide"; slideId: string; patch: SceneSlidePatch };

export type SceneTransaction = {
  deck: DeckDocumentV2;
  command: SceneCommand;
  inverse: SceneCommand;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function slideIndex(deck: DeckDocumentV2, slideId: string): number {
  const index = deck.slides.findIndex((slide) => slide.id === slideId);
  if (index < 0) throw new Error(`Slide "${slideId}" không tồn tại trong deck.`);
  return index;
}

function elementIndex(slide: SceneSlide, elementId: string): number {
  const index = slide.elements.findIndex((element) => element.id === elementId);
  if (index < 0) throw new Error(`Thành phần "${elementId}" không tồn tại trong slide "${slide.id}".`);
  return index;
}

function ensureUnique(values: readonly string[], label: string): void {
  const ids = new Set<string>();
  for (const value of values) {
    if (ids.has(value)) throw new Error(`${label} "${value}" bị trùng trong cùng một lệnh.`);
    ids.add(value);
  }
}

function previousPatch<T extends object>(target: T, patch: Partial<T>): Partial<T> {
  const previous: Partial<T> = {};
  for (const key of Object.keys(patch) as Array<keyof T>) previous[key] = clone(target[key]);
  return previous;
}

export function applySceneCommand(deck: DeckDocumentV2, command: SceneCommand): SceneTransaction {
  const next = clone(deck);
  const index = slideIndex(next, command.slideId);
  const slide = next.slides[index]!;
  let inverse: SceneCommand;

  switch (command.type) {
    case "transform-elements": {
      ensureUnique(command.changes.map((change) => change.elementId), "Element ID");
      const previous: ElementFrameChange[] = [];
      for (const change of command.changes) {
        const targetIndex = elementIndex(slide, change.elementId);
        const target = slide.elements[targetIndex]!;
        previous.push({ elementId: target.id, frame: clone(target.frame) });
        slide.elements[targetIndex] = { ...target, frame: clone(change.frame) } as SceneElement;
      }
      inverse = { type: "transform-elements", slideId: command.slideId, changes: previous };
      break;
    }

    case "insert-elements": {
      ensureUnique(command.elements.map((element) => element.id), "Element ID");
      const existing = new Set(slide.elements.map((element) => element.id));
      for (const element of command.elements) {
        if (existing.has(element.id)) throw new Error(`Thành phần "${element.id}" đã tồn tại trong slide "${slide.id}".`);
        existing.add(element.id);
      }
      if (command.positions && command.positions.length !== command.elements.length) {
        throw new Error("Số vị trí chèn phải bằng số thành phần cần chèn.");
      }
      if (command.positions) {
        command.elements
          .map((element, elementOrder) => ({ element: clone(element), position: command.positions![elementOrder]! }))
          .sort((left, right) => left.position - right.position)
          .forEach(({ element, position }) => slide.elements.splice(Math.max(0, Math.min(position, slide.elements.length)), 0, element));
      } else {
        slide.elements.push(...clone(command.elements));
      }
      inverse = { type: "delete-elements", slideId: command.slideId, elementIds: command.elements.map((element) => element.id) };
      break;
    }

    case "delete-elements": {
      ensureUnique(command.elementIds, "Element ID");
      const targetIds = new Set(command.elementIds);
      const descendants = slide.elements.filter((element) => {
        let parentId = element.parentId;
        while (parentId) {
          if (targetIds.has(parentId)) return true;
          parentId = slide.elements.find((candidate) => candidate.id === parentId)?.parentId;
        }
        return false;
      }).map((element) => element.id);
      descendants.forEach((id) => targetIds.add(id));
      for (const id of targetIds) elementIndex(slide, id);
      const removed = slide.elements
        .map((element, position) => ({ element, position }))
        .filter(({ element }) => targetIds.has(element.id));
      slide.elements = slide.elements.filter((element) => !targetIds.has(element.id));
      inverse = {
        type: "insert-elements",
        slideId: command.slideId,
        elements: removed.map(({ element }) => clone(element)),
        positions: removed.map(({ position }) => position)
      };
      break;
    }

    case "reorder-elements": {
      ensureUnique(command.orderedIds, "Element ID");
      if (command.orderedIds.length !== slide.elements.length) {
        throw new Error("Danh sách sắp xếp phải chứa chính xác mọi thành phần trong slide.");
      }
      const byId = new Map(slide.elements.map((element) => [element.id, element]));
      for (const id of command.orderedIds) if (!byId.has(id)) throw new Error(`Thành phần "${id}" không tồn tại trong slide "${slide.id}".`);
      const previous = slide.elements.map((element) => element.id);
      slide.elements = command.orderedIds.map((id) => clone(byId.get(id)!));
      inverse = { type: "reorder-elements", slideId: command.slideId, orderedIds: previous };
      break;
    }

    case "patch-element": {
      const targetIndex = elementIndex(slide, command.elementId);
      const target = slide.elements[targetIndex]!;
      const previous = previousPatch(target, command.patch as Partial<SceneElement>);
      slide.elements[targetIndex] = { ...target, ...clone(command.patch), id: target.id, kind: target.kind } as SceneElement;
      inverse = { type: "patch-element", slideId: command.slideId, elementId: command.elementId, patch: previous as SceneElementPatch };
      break;
    }

    case "patch-slide": {
      const previous = previousPatch(slide, command.patch as Partial<SceneSlide>);
      next.slides[index] = { ...slide, ...clone(command.patch), id: slide.id, elements: slide.elements };
      inverse = { type: "patch-slide", slideId: command.slideId, patch: previous as SceneSlidePatch };
      break;
    }
  }

  next.revision += 1;
  const parsed = DeckDocumentV2Schema.safeParse(next);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Lệnh scene tạo tài liệu không hợp lệ tại ${issue?.path.join(".") || "document"}: ${issue?.message ?? "unknown error"}`);
  }

  return { deck: parsed.data, command: clone(command), inverse };
}
