import { describe, expect, it } from "vitest";
import type { SceneElement } from "@deckory/schema/v2";
import { buildLayersTree, createLayerPatchCommand, filterLayersTree, moveLayerFocus, resolveLayerTreeKey } from "./layers-model";

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

  it("maps rename, lock and hide actions to one patch-element command", () => {
    expect(createLayerPatchCommand("cover", "feature-b", { name: "Tính năng chính", locked: false, hidden: true })).toEqual({
      type: "patch-element",
      slideId: "cover",
      elementId: "feature-b",
      patch: { name: "Tính năng chính", locked: false, hidden: true }
    });
  });
});
