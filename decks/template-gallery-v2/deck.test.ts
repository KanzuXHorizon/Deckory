import { describe, expect, it } from "vitest";
import { templateGalleryDeck } from "@deckory/template-gallery";
import { evaluateV2MigrationAcceptance } from "@deckory/templates";
import { templateGalleryV2, templateGalleryV2MigrationDiagnostics } from "./deck.js";

describe("Template Gallery V2", () => {
  it("preserves the nine-slide template system and passes migration acceptance", () => {
    const report = evaluateV2MigrationAcceptance(templateGalleryDeck, templateGalleryV2);
    expect(templateGalleryV2MigrationDiagnostics).toEqual([]);
    expect(templateGalleryV2.slides).toHaveLength(9);
    expect(report.issues, JSON.stringify(report.issues, null, 2)).toEqual([]);
  });
});
