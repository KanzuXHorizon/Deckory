import { describe, expect, it } from "vitest";
import type { DeckDocument, Slide } from "@deckory/schema";
import { cloneDeckDocument, getSlideTitle } from "./deck-document";

const deck: DeckDocument = {
  id: "deck",
  version: 1,
  title: "Deck",
  locale: "vi-VN",
  themeId: "theme",
  slides: [{
    id: "cover",
    layout: "cover",
    components: [{ id: "heading", type: "heading", props: { title: "Kết luận chính" } }]
  }]
};

describe("deck document helpers", () => {
  it("deep clones an editable deck", () => {
    const clone = cloneDeckDocument(deck);
    clone.slides[0]!.id = "changed";

    expect(deck.slides[0]!.id).toBe("cover");
    expect(clone.slides[0]!.id).toBe("changed");
  });

  it("prefers heading, then statement, then slide id", () => {
    const statement: Slide = {
      id: "claim",
      layout: "statement",
      components: [{ id: "statement", type: "statement", props: { quote: "Một luận điểm rõ" } }]
    };
    const fallback: Slide = {
      id: "fallback",
      layout: "cover",
      components: [{ id: "footer", type: "evidence-footer", props: { source: "Fixture" } }]
    };

    expect(getSlideTitle(deck.slides[0]!)).toBe("Kết luận chính");
    expect(getSlideTitle(statement)).toBe("Một luận điểm rõ");
    expect(getSlideTitle(fallback)).toBe("fallback");
  });
});
