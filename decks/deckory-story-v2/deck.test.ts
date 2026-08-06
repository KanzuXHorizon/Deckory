import { describe, expect, it } from "vitest";
import { deckoryStory } from "@deckory/deckory-story";
import { evaluateV2MigrationAcceptance } from "@deckory/templates";
import { deckoryStoryV2, deckoryStoryV2MigrationDiagnostics } from "./deck.js";

describe("Deckory Story V2", () => {
  it("preserves the twelve-slide product story and passes migration acceptance", () => {
    const report = evaluateV2MigrationAcceptance(deckoryStory, deckoryStoryV2);
    expect(deckoryStoryV2MigrationDiagnostics).toEqual([]);
    expect(deckoryStoryV2.slides).toHaveLength(12);
    expect(report.issues, JSON.stringify(report.issues, null, 2)).toEqual([]);
  });
});
