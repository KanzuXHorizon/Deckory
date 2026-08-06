import { describe, expect, it } from "vitest";
import {
  collectSnapGuides,
  convertGroupLayoutMode,
  createAlignmentCommand,
  createChildSizingCommand,
  createLayoutContainerPatchCommand,
  fitTextToFrame,
  groupElements,
  layoutGrid,
  layoutStack,
  normalizeRichText,
  resolveConstraints,
  semanticMotionPresets
} from "./index";

describe("@deckory/scene public API", () => {
  it("exports the integrated layout, hierarchy, text and motion surface", () => {
    expect(collectSnapGuides).toBeTypeOf("function");
    expect(convertGroupLayoutMode).toBeTypeOf("function");
    expect(createAlignmentCommand).toBeTypeOf("function");
    expect(createChildSizingCommand).toBeTypeOf("function");
    expect(createLayoutContainerPatchCommand).toBeTypeOf("function");
    expect(groupElements).toBeTypeOf("function");
    expect(layoutGrid).toBeTypeOf("function");
    expect(layoutStack).toBeTypeOf("function");
    expect(resolveConstraints).toBeTypeOf("function");
    expect(normalizeRichText).toBeTypeOf("function");
    expect(fitTextToFrame).toBeTypeOf("function");
    expect(semanticMotionPresets).toBeTypeOf("object");
  });
});
