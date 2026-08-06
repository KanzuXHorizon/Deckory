import { describe, expect, it } from "vitest";
import { findAnyDeck, resolveAnyDeck, v2DeckCatalog } from "./deck-catalog.js";
import { isDeckDocumentV2 } from "./deck-version.js";

describe("Deckory V2 deck catalog", () => {
  it("keeps MyInterview V2 first and exposes four unique production migrations", () => {
    expect(v2DeckCatalog.map((item) => item.deck.id)).toEqual([
      "myinterview-defense-v2",
      "deckory-story-v2",
      "visual-lab-v2",
      "template-gallery-v2"
    ]);
    expect(new Set(v2DeckCatalog.map((item) => item.deck.id)).size).toBe(4);
    expect(v2DeckCatalog.every((item) => item.audit.summary.errorCount === 0 && item.audit.summary.warningCount === 0)).toBe(true);
  });

  it("resolves migrated V2 decks without removing V1 rollback sources", () => {
    const v2 = findAnyDeck("myinterview-defense-v2");
    const v1 = findAnyDeck("myinterview-defense");

    expect(v2 && isDeckDocumentV2(v2)).toBe(true);
    expect(v1 && !isDeckDocumentV2(v1)).toBe(true);
    expect(v2?.slides).toHaveLength(23);
    expect(v1?.slides).toHaveLength(23);
    expect(resolveAnyDeck("missing-deck").id).toBe("myinterview-defense");
  });
});
