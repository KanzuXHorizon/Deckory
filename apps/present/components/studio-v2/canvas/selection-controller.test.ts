import { describe, expect, it } from "vitest";
import { resolveMarqueeSelection, resolveSelectionFromPointer } from "./selection-controller";

const elements = [
  { id: "group", frame: { x: 20, y: 20, width: 300, height: 220 } },
  { id: "visible-card", parentId: "group", frame: { x: 40, y: 40, width: 100, height: 80 } },
  { id: "locked-card", parentId: "group", frame: { x: 160, y: 40, width: 100, height: 80 }, locked: true },
  { id: "hidden-card", parentId: "group", frame: { x: 40, y: 140, width: 100, height: 60 }, hidden: true }
];

describe("selection controller", () => {
  it("replaces selection on plain click and toggles in document order on additive click", () => {
    const selected = resolveSelectionFromPointer({
      current: ["group"],
      targetId: "visible-card",
      additive: false,
      documentOrder: elements.map((element) => element.id)
    });
    expect(selected).toEqual({ elementIds: ["visible-card"], primaryElementId: "visible-card" });

    expect(resolveSelectionFromPointer({
      current: selected.elementIds,
      targetId: "group",
      additive: true,
      documentOrder: elements.map((element) => element.id)
    })).toEqual({ elementIds: ["group", "visible-card"], primaryElementId: "group" });
  });

  it("removes an already-selected target on additive click", () => {
    expect(resolveSelectionFromPointer({
      current: ["group", "visible-card"],
      targetId: "group",
      additive: true,
      documentOrder: elements.map((element) => element.id)
    })).toEqual({ elementIds: ["visible-card"], primaryElementId: "visible-card" });
  });

  it("does not select hidden or locked descendants through marquee", () => {
    expect(resolveMarqueeSelection({
      elements,
      marquee: { x: 0, y: 0, width: 400, height: 300 },
      mode: "intersect",
      deepSelect: true
    })).toEqual({ elementIds: ["group", "visible-card"], primaryElementId: "visible-card" });
  });

  it("selects only top-level containers without deep-select", () => {
    expect(resolveMarqueeSelection({
      elements,
      marquee: { x: 0, y: 0, width: 400, height: 300 },
      mode: "contain",
      deepSelect: false
    })).toEqual({ elementIds: ["group"], primaryElementId: "group" });
  });
});
