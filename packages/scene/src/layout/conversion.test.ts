import { describe, expect, it } from "vitest";
import type { SceneElement } from "@deckory/schema/v2";
import { convertGroupLayoutMode } from "./conversion";

const parent: Extract<SceneElement, { kind: "group" }> = {
  id: "feature-group",
  name: "Feature group",
  kind: "group",
  frame: { x: 100, y: 80, width: 500, height: 220 },
  zIndex: 1,
  content: { children: ["a", "b"] },
  accessibility: { label: "Feature group" }
};

const children: SceneElement[] = [
  { id: "a", name: "A", kind: "shape", parentId: "feature-group", frame: { x: 20, y: 30, width: 180, height: 120 }, zIndex: 2, content: { shape: "rectangle" }, accessibility: { decorative: true } },
  { id: "b", name: "B", kind: "shape", parentId: "feature-group", frame: { x: 260, y: 30, width: 180, height: 120 }, zIndex: 3, content: { shape: "rectangle" }, accessibility: { decorative: true } }
];

describe("convertGroupLayoutMode", () => {
  it("converts freeform to stack while preserving the parent visual bounds", () => {
    const result = convertGroupLayoutMode({ parent, children }, {
      mode: "stack-horizontal",
      slideId: "cover",
      gap: 20,
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      align: "center",
      justify: "start"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.beforeBounds).toEqual(result.afterBounds);
    expect(result.after.parent.kind).toBe("stack");
    expect(result.command.type).toBe("replace-scene-elements");
    expect(result.command.elements).toHaveLength(3);
    expect(result.inverse.type).toBe("replace-scene-elements");
  });

  it("round-trips through the generated inverse payload", () => {
    const result = convertGroupLayoutMode({ parent, children }, {
      mode: "grid",
      slideId: "cover",
      columns: 2,
      gap: 20,
      padding: 20
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.inverse.elements).toEqual([parent, ...children]);
  });

  it("rejects a conversion that cannot satisfy child minimums", () => {
    const result = convertGroupLayoutMode({
      parent: { ...parent, frame: { x: 100, y: 80, width: 220, height: 120 } },
      children: children.map((child) => ({ ...child, constraints: { minWidth: 160, minHeight: 80 } }))
    }, {
      mode: "stack-horizontal",
      slideId: "cover",
      gap: 20,
      padding: 20
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics[0]?.code).toBe("layout-conversion-does-not-fit");
  });
});
