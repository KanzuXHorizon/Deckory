import { describe, expect, it } from "vitest";
import { findAnyDeck, resolveAnyDeck, v2DeckCatalog } from "./deck-catalog.js";
import { isDeckDocumentV2 } from "./deck-version.js";

describe("Deckory V2 deck catalog", () => {
  it("keeps one canonical MyInterview Scene V2 deck first", () => {
    expect(v2DeckCatalog.map((item) => item.deck.id)).toEqual([
      "myinterview-defense",
      "deckory-story-v2",
      "visual-lab-v2",
      "template-gallery-v2"
    ]);
    expect(new Set(v2DeckCatalog.map((item) => item.deck.id)).size).toBe(4);
    expect(v2DeckCatalog.every((item) => item.audit.summary.errorCount === 0 && item.audit.summary.warningCount === 0)).toBe(true);
  });

  it("resolves only the canonical MyInterview document", () => {
    const canonical = findAnyDeck("myinterview-defense");

    expect(canonical && isDeckDocumentV2(canonical)).toBe(true);
    expect(canonical?.slides).toHaveLength(23);
    expect(findAnyDeck("myinterview-defense-v2")).toBeUndefined();
    expect(resolveAnyDeck("missing-deck").id).toBe("myinterview-defense");
    expect(isDeckDocumentV2(resolveAnyDeck("missing-deck"))).toBe(true);
  });
});
