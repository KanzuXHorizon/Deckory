import { describe, expect, it } from "vitest";
import {
  auditDeckV2,
  matchRuntimeEvidence,
  scoreDeckV2,
  summarizeRuntimeEvidence
} from "./index";

describe("@deckory/audit V2 public API", () => {
  it("exports the V2 audit, scorecard and runtime evidence contracts", () => {
    expect(auditDeckV2).toBeTypeOf("function");
    expect(scoreDeckV2).toBeTypeOf("function");
    expect(matchRuntimeEvidence).toBeTypeOf("function");
    expect(summarizeRuntimeEvidence).toBeTypeOf("function");
  });
});
