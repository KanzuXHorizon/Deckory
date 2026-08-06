import { describe, expect, it } from "vitest";
import type { SceneSlide } from "@deckory/schema/v2";
import { absoluteFrames, flattenSceneHierarchy, groupElements, reparentElements, ungroupElement } from "./hierarchy";

const slide: SceneSlide = {
  id: "cover",
  name: "Cover",
  background: { layers: [] },
  elements: [
    { id: "a", name: "A", kind: "shape", frame: { x: 100, y: 120, width: 140, height: 80 }, zIndex: 1, content: { shape: "rectangle" }, accessibility: { decorative: true } },
    { id: "b", name: "B", kind: "shape", frame: { x: 280, y: 140, width: 120, height: 100 }, zIndex: 2, content: { shape: "rectangle" }, accessibility: { decorative: true } },
    { id: "outer", name: "Outer", kind: "group", frame: { x: 500, y: 100, width: 300, height: 220 }, zIndex: 3, content: { children: ["inner"] }, accessibility: { label: "Outer" } },
    { id: "inner", name: "Inner", kind: "group", parentId: "outer", frame: { x: 20, y: 30, width: 180, height: 120 }, zIndex: 4, content: { children: ["leaf"] }, accessibility: { label: "Inner" } },
    { id: "leaf", name: "Leaf", kind: "shape", parentId: "inner", frame: { x: 10, y: 15, width: 60, height: 40 }, zIndex: 5, content: { shape: "ellipse" }, accessibility: { decorative: true } }
  ]
};

describe("scene hierarchy", () => {
  it("groups selected elements without changing their absolute positions", () => {
    const before = absoluteFrames(slide);
    const result = groupElements(slide, ["a", "b"], { id: "feature-group", name: "Nhóm tính năng" });
    const after = absoluteFrames(result.slide);

    expect(after.a).toEqual(before.a);
    expect(after.b).toEqual(before.b);
    expect(result.command.type).toBe("replace-scene-elements");
    expect(result.inverse.type).toBe("replace-scene-elements");
  });

  it("ungroups and restores parent-local coordinates", () => {
    const grouped = groupElements(slide, ["a", "b"], { id: "feature-group", name: "Nhóm tính năng" });
    const ungrouped = ungroupElement(grouped.slide, "feature-group");

    expect(absoluteFrames(ungrouped.slide).a).toEqual(absoluteFrames(slide).a);
    expect(absoluteFrames(ungrouped.slide).b).toEqual(absoluteFrames(slide).b);
    expect(ungrouped.slide.elements.some((element) => element.id === "feature-group")).toBe(false);
  });

  it("reparents an element while preserving its absolute frame", () => {
    const before = absoluteFrames(slide).a;
    const result = reparentElements(slide, ["a"], "outer");

    expect(absoluteFrames(result.slide).a).toEqual(before);
    expect(result.slide.elements.find((element) => element.id === "a")?.parentId).toBe("outer");
  });

  it("rejects reparenting a parent and its descendant in one transaction", () => {
    expect(() => reparentElements(slide, ["inner", "leaf"], undefined)).toThrow(/cha và hậu duệ/i);
  });

  it("rejects ungrouping a transformed container instead of changing visual geometry", () => {
    const transformed = {
      ...slide,
      elements: slide.elements.map((element) => element.id === "inner"
        ? { ...element, transform: { rotation: 12 } }
        : element)
    } as SceneSlide;

    expect(() => ungroupElement(transformed, "inner")).toThrow(/transform|xoay/i);
  });

  it("rejects reparenting across transformed coordinate spaces", () => {
    const transformed = {
      ...slide,
      elements: slide.elements.map((element) => element.id === "outer"
        ? { ...element, transform: { scaleX: 1.2, scaleY: 1.2 } }
        : element)
    } as SceneSlide;

    expect(() => reparentElements(transformed, ["a"], "outer")).toThrow(/transform|tỷ lệ/i);
  });

  it("rejects hierarchy cycles with an actionable Vietnamese diagnostic", () => {
    expect(() => reparentElements(slide, ["outer"], "leaf")).toThrow(/chu kỳ/i);
  });

  it("flattens hierarchy in stable document order with depth metadata", () => {
    expect(flattenSceneHierarchy(slide).map(({ id, depth }) => [id, depth])).toEqual([
      ["a", 0],
      ["b", 0],
      ["outer", 0],
      ["inner", 1],
      ["leaf", 2]
    ]);
  });
});
