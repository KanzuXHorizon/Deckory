import { describe, expect, it } from "vitest";
import type { SceneElement } from "@deckory/schema/v2";
import { buildLayersTree, createLayerPatchCommand, filterLayersTree, layerDropPositionFromPointer, moveLayerFocus, resolveLayerDropIntent, resolveLayerRename, resolveLayerTreeKey } from "./layers-model";

const elements: SceneElement[] = [
  { id: "title", name: "Tiêu đề", kind: "text", frame: { x: 72, y: 64, width: 600, height: 120 }, zIndex: 1, content: { text: "Deckory" }, accessibility: { label: "Deckory" } },
  { id: "feature-group", name: "Nhóm tính năng", kind: "group", frame: { x: 72, y: 220, width: 600, height: 320 }, zIndex: 2, content: { children: ["feature-a", "feature-b"] }, accessibility: { label: "Nhóm tính năng" } },
  { id: "feature-a", name: "Tính năng A", kind: "shape", parentId: "feature-group", frame: { x: 20, y: 20, width: 240, height: 120 }, zIndex: 3, content: { shape: "rectangle" }, accessibility: { decorative: true } },
  { id: "feature-b", name: "Tính năng B", kind: "shape", parentId: "feature-group", frame: { x: 300, y: 20, width: 240, height: 120 }, zIndex: 4, locked: true, content: { shape: "rectangle" }, accessibility: { decorative: true } }
];

describe("Layers model", () => {
  it("builds a hierarchical tree in document order", () => {
    expect(buildLayersTree(elements).map((node) => [node.id, node.children.map((child) => child.id)])).toEqual([
      ["title", []],
      ["feature-group", ["feature-a", "feature-b"]]
    ]);
  });

  it("rejects duplicate IDs and hierarchy cycles instead of hiding invalid layers", () => {
    expect(() => buildLayersTree([...elements, { ...elements[0]! }])).toThrow(/trùng/i);
    expect(() => buildLayersTree([
      { ...elements[1]!, parentId: "feature-a" },
      { ...elements[2]!, parentId: "feature-group" }
    ])).toThrow(/chu kỳ/i);
  });

  it("keeps ancestors visible when search matches a descendant", () => {
    expect(filterLayersTree(buildLayersTree(elements), "Tính năng B").map((node) => ({
      id: node.id,
      children: node.children.map((child) => child.id)
    }))).toEqual([{ id: "feature-group", children: ["feature-b"] }]);
  });

  it("moves keyboard focus through the visible flattened order", () => {
    const tree = buildLayersTree(elements);
    expect(moveLayerFocus(tree, "feature-group", "next")).toBe("feature-a");
    expect(moveLayerFocus(tree, "feature-a", "parent")).toBe("feature-group");
    expect(moveLayerFocus(tree, "feature-group", "last-child")).toBe("feature-b");
  });

  it("maps tree keyboard gestures to focus, selection and rename actions", () => {
    const tree = buildLayersTree(elements);
    expect(resolveLayerTreeKey(tree, "feature-group", { key: "ArrowDown" })).toEqual({ type: "focus", elementId: "feature-a" });
    expect(resolveLayerTreeKey(tree, "feature-a", { key: "ArrowLeft" })).toEqual({ type: "focus", elementId: "feature-group" });
    expect(resolveLayerTreeKey(tree, "feature-a", { key: " " })).toEqual({ type: "select", elementId: "feature-a", additive: true });
    expect(resolveLayerTreeKey(tree, "feature-a", { key: "Enter" })).toEqual({ type: "select", elementId: "feature-a", additive: false });
    expect(resolveLayerTreeKey(tree, "feature-a", { key: "F2" })).toEqual({ type: "rename", elementId: "feature-a" });
  });

  it("rejects an empty layer name before creating a command", () => {
    expect(() => createLayerPatchCommand("cover", "feature-b", { name: "   " })).toThrow(/tên layer/i);
  });

  it("maps pointer position to before, inside and after drop zones", () => {
    expect(layerDropPositionFromPointer({ clientY: 102, top: 100, height: 40 }, true)).toBe("before");
    expect(layerDropPositionFromPointer({ clientY: 120, top: 100, height: 40 }, true)).toBe("inside");
    expect(layerDropPositionFromPointer({ clientY: 138, top: 100, height: 40 }, true)).toBe("after");
    expect(layerDropPositionFromPointer({ clientY: 120, top: 100, height: 40 }, false)).toBe("after");
  });

  it("resolves drag reorder and reparent intents without creating cycles", () => {
    const tree = buildLayersTree(elements);
    expect(resolveLayerDropIntent(tree, "title", "feature-group", "inside")).toEqual({
      elementId: "title",
      parentId: "feature-group",
      index: 2
    });
    expect(resolveLayerDropIntent(tree, "feature-b", "feature-a", "before")).toEqual({
      elementId: "feature-b",
      parentId: "feature-group",
      index: 0
    });
    expect(() => resolveLayerDropIntent(tree, "feature-group", "feature-a", "inside")).toThrow(/chu kỳ/i);
  });

  it("cancels rename without emitting a patch and trims committed names", () => {
    expect(resolveLayerRename("Tên cũ", "Tên mới", true)).toBeUndefined();
    expect(resolveLayerRename("Tên cũ", "  Tên mới  ", false)).toEqual({ name: "Tên mới" });
    expect(resolveLayerRename("Tên cũ", "   ", false)).toBeUndefined();
  });

  it("maps rename, lock and hide actions to one patch-element command", () => {
    expect(createLayerPatchCommand("cover", "feature-b", { name: "Tính năng chính", locked: false, hidden: true })).toEqual({
      type: "patch-element",
      slideId: "cover",
      elementId: "feature-b",
      patch: { name: "Tính năng chính", locked: false, hidden: true }
    });
  });
});
