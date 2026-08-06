import { describe, expect, it } from "vitest";
import type { SceneElement } from "@deckory/schema/v2";
import { createChildSizingCommand, createLayoutContainerPatchCommand } from "./actions";

const stack: Extract<SceneElement, { kind: "stack" }> = {
  id: "stack",
  name: "Stack",
  kind: "stack",
  frame: { x: 80, y: 60, width: 600, height: 240 },
  zIndex: 1,
  content: { direction: "horizontal", gap: 16, padding: 20, align: "start", justify: "start", wrap: false },
  accessibility: { label: "Stack" }
};

const grid: Extract<SceneElement, { kind: "grid" }> = {
  id: "grid",
  name: "Grid",
  kind: "grid",
  frame: { x: 80, y: 60, width: 600, height: 240 },
  zIndex: 1,
  content: { columns: 2, columnGap: 16, rowGap: 12, padding: 20 },
  accessibility: { label: "Grid" }
};

const child: SceneElement = {
  id: "card",
  name: "Card",
  kind: "shape",
  parentId: "stack",
  frame: { x: 20, y: 20, width: 180, height: 100 },
  zIndex: 2,
  content: { shape: "rectangle" },
  accessibility: { decorative: true }
};

describe("layout action commands", () => {
  it("patches stack settings as one patch-element command", () => {
    expect(createLayoutContainerPatchCommand("cover", stack, {
      gap: 24,
      direction: "vertical",
      padding: [12, 20, 16, 20],
      justify: "space-between"
    })).toEqual({
      type: "patch-element",
      slideId: "cover",
      elementId: "stack",
      patch: {
        content: {
          direction: "vertical",
          gap: 24,
          padding: [12, 20, 16, 20],
          align: "start",
          justify: "space-between",
          wrap: false
        }
      }
    });
  });

  it("patches current grid fields without inventing unsupported alignment", () => {
    expect(createLayoutContainerPatchCommand("cover", grid, { columns: 3, rowGap: 20 })).toEqual({
      type: "patch-element",
      slideId: "cover",
      elementId: "grid",
      patch: { content: { columns: 3, columnGap: 16, rowGap: 20, padding: 20 } }
    });
  });

  it("patches child fixed, hug and fill sizing through constraints", () => {
    expect(createChildSizingCommand("cover", child, { width: "fill", height: "hug" })).toEqual({
      type: "patch-element",
      slideId: "cover",
      elementId: "card",
      patch: { constraints: { width: "fill", height: "hug" } }
    });
  });

  it("rejects layout patches for non-container elements", () => {
    expect(() => createLayoutContainerPatchCommand("cover", child, { gap: 20 })).toThrow(/stack|grid/i);
  });
});
