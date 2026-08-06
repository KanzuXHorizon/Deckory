import { describe, expect, it } from "vitest";
import { myInterviewDefense } from "@deckory/myinterview-defense";
import { SUPPORTED_COMPONENT_TYPES } from "@deckory/schema";
import { deckCatalog, resolveAnyDeck, resolveDeck, sceneFoundationDeck, visualCoverage } from "./deck-catalog";

describe("deck catalog", () => {
  it("uses the tracked MyInterview package as the only active defense deck", () => {
    const catalogDeck = resolveDeck("myinterview-defense");

    expect(catalogDeck).toBe(myInterviewDefense);
    expect(catalogDeck.id).toBe("myinterview-defense");
    expect(catalogDeck.slides).toHaveLength(23);
    expect(deckCatalog.filter((item) => item.deck.id === "myinterview-defense")).toHaveLength(1);
  });

  it("resolves the hidden V2 scene fixture without changing the V1 Hub catalog", () => {
    expect(resolveAnyDeck("scene-foundation")).toBe(sceneFoundationDeck);
    expect(sceneFoundationDeck.schemaVersion).toBe(2);
    expect(deckCatalog.some((item) => item.deck.id === sceneFoundationDeck.id)).toBe(false);
  });

  it("derives visual coverage from the canonical component catalog", () => {
    const componentCoverage = visualCoverage.find((item) => item.label === "Components");

    expect(componentCoverage?.value).toBe(String(SUPPORTED_COMPONENT_TYPES.length));
  });
});
