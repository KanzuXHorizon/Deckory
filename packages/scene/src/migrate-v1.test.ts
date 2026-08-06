import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import { migrateDeckV1ToV2 } from "./migrate-v1";

const v1Deck: DeckDocument = {
  id: "migration-fixture",
  version: 1,
  title: "Migration fixture",
  locale: "vi-VN",
  themeId: "deckory-editorial",
  assets: [],
  slides: [{
    id: "cover",
    layout: "cover",
    notes: "Preserve these notes.",
    components: [
      { id: "heading", type: "heading", props: { eyebrow: "V2", title: "Scene foundation", description: "Deterministic migration." } },
      { id: "footer", type: "evidence-footer", props: { source: "Fixture minh hoạ", page: "01" } }
    ]
  }]
};

const v1InteractiveDeck: DeckDocument = {
  ...v1Deck,
  id: "interactive-fixture",
  slides: [{
    id: "visualizer",
    layout: "data",
    components: [{
      id: "relationship",
      type: "visualizer",
      sequence: 1,
      props: {
        title: "Relationship",
        variant: "network",
        interaction: "inspect",
        items: [
          { id: "source", label: "Source" },
          { id: "result", label: "Result", parentId: "source" }
        ]
      }
    }]
  }]
};

describe("migrateDeckV1ToV2", () => {
  it("migrates the same V1 deck deterministically", () => {
    expect(migrateDeckV1ToV2(v1Deck)).toEqual(migrateDeckV1ToV2(v1Deck));
  });

  it("preserves component IDs, notes and evidence source", () => {
    const result = migrateDeckV1ToV2(v1Deck);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const slide = result.deck.slides[0]!;
    expect(slide.elements.map((element) => element.id)).toEqual(["heading", "footer"]);
    expect(slide.evidence?.source).toBe("Fixture minh hoạ");
    expect(slide.notes).toBe("Preserve these notes.");
  });

  it("assigns finite explicit frames inside the canonical canvas", () => {
    const result = migrateDeckV1ToV2(v1Deck);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const element of result.deck.slides[0]!.elements) {
      expect(Number.isFinite(element.frame.x)).toBe(true);
      expect(element.frame.width).toBeGreaterThan(0);
      expect(element.frame.x + element.frame.width).toBeLessThanOrEqual(1280);
      expect(element.frame.y + element.frame.height).toBeLessThanOrEqual(720);
    }
  });

  it("reports unsupported interactive behavior instead of dropping it", () => {
    const result = migrateDeckV1ToV2(v1InteractiveDeck);
    expect(result.diagnostics.some((item) => item.code === "migration-review-required")).toBe(true);
    expect(result.ok && result.deck.slides[0]!.elements[0]!.id).toBe("relationship");
  });
});
