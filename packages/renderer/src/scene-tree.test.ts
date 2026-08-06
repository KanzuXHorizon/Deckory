import { describe, expect, it } from "vitest";
import type { SceneElement } from "@deckory/schema/v2";
import { buildSceneTree } from "./scene-tree";

function shape(
  id: string,
  frame: { x: number; y: number; width: number; height: number },
  options: { parentId?: string; zIndex?: number } = {}
): SceneElement {
  return {
    id,
    name: id,
    kind: "shape",
    ...(options.parentId ? { parentId: options.parentId } : {}),
    frame,
    zIndex: options.zIndex ?? 0,
    content: { shape: "rectangle" },
    accessibility: { decorative: true }
  };
}

function group(
  id: string,
  frame: { x: number; y: number; width: number; height: number },
  options: { parentId?: string; zIndex?: number } = {}
): SceneElement {
  return {
    id,
    name: id,
    kind: "group",
    ...(options.parentId ? { parentId: options.parentId } : {}),
    frame,
    zIndex: options.zIndex ?? 0,
    content: {},
    accessibility: { label: id }
  };
}

describe("buildSceneTree", () => {
  it("nests parent-local children without flattening their frames", () => {
    const result = buildSceneTree([
      group("parent", { x: 80, y: 60, width: 400, height: 300 }),
      shape("child", { x: 20, y: 30, width: 120, height: 80 }, { parentId: "parent" })
    ]);

    expect(result.diagnostics).toEqual([]);
    expect(result.roots).toHaveLength(1);
    expect(result.roots[0]!.element.id).toBe("parent");
    expect(result.roots[0]!.children[0]!.element).toMatchObject({
      id: "child",
      frame: { x: 20, y: 30, width: 120, height: 80 }
    });
  });

  it("composes arbitrary hierarchy depth and orders siblings by z-index then document order", () => {
    const result = buildSceneTree([
      group("root", { x: 40, y: 40, width: 600, height: 500 }),
      shape("later", { x: 0, y: 0, width: 40, height: 40 }, { parentId: "root", zIndex: 2 }),
      group("nested", { x: 60, y: 80, width: 300, height: 200 }, { parentId: "root", zIndex: 1 }),
      shape("deep", { x: 10, y: 12, width: 50, height: 50 }, { parentId: "nested" }),
      shape("same-z-first", { x: 0, y: 0, width: 20, height: 20 }, { parentId: "root", zIndex: 2 })
    ]);

    expect(result.diagnostics).toEqual([]);
    expect(result.roots[0]!.children.map((node) => node.element.id)).toEqual([
      "nested",
      "later",
      "same-z-first"
    ]);
    expect(result.roots[0]!.children[0]!.children[0]!.element.id).toBe("deep");
  });

  it("returns diagnostics for missing parents, duplicate IDs and cycles", () => {
    const missing = buildSceneTree([
      shape("orphan", { x: 0, y: 0, width: 10, height: 10 }, { parentId: "missing" })
    ]);
    expect(missing.diagnostics[0]?.code).toBe("scene-parent-missing");

    const duplicate = buildSceneTree([
      shape("duplicate", { x: 0, y: 0, width: 10, height: 10 }),
      shape("duplicate", { x: 20, y: 0, width: 10, height: 10 })
    ]);
    expect(duplicate.diagnostics[0]?.code).toBe("scene-element-id-duplicate");

    const cycle = buildSceneTree([
      group("a", { x: 0, y: 0, width: 100, height: 100 }, { parentId: "b" }),
      group("b", { x: 0, y: 0, width: 100, height: 100 }, { parentId: "a" })
    ]);
    expect(cycle.diagnostics.some((diagnostic) => diagnostic.code === "scene-hierarchy-cycle")).toBe(true);
  });
});
