import { describe, expect, it } from "vitest";
import type { DeckDocument, DeckDocumentV2 } from "@deckory/schema";
import { isDeckDocumentV2, resolveRenderableDeck } from "./deck-version";

const v1Deck: DeckDocument = {
  id: "v1-fixture",
  version: 1,
  title: "V1 fixture",
  locale: "vi-VN",
  themeId: "deckory-editorial",
  slides: [{
    id: "cover",
    layout: "cover",
    components: [{ id: "heading", type: "heading", props: { title: "V1" } }]
  }]
};

const v2Deck: DeckDocumentV2 = {
  schemaVersion: 2,
  id: "v2-fixture",
  revision: 1,
  title: "V2 fixture",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  slides: [{
    id: "cover",
    name: "Cover",
    background: { layers: [] },
    elements: [{
      id: "title",
      name: "Title",
      kind: "text",
      frame: { x: 72, y: 64, width: 720, height: 140 },
      zIndex: 1,
      content: { text: "V2" },
      accessibility: { label: "V2" }
    }]
  }]
};

describe("deck version resolution", () => {
  it("resolves V1 and V2 without guessing from unrelated fields", () => {
    expect(resolveRenderableDeck(v1Deck).version).toBe(1);
    expect(resolveRenderableDeck(v2Deck).version).toBe(2);
  });

  it("identifies a valid V2 deck", () => {
    expect(isDeckDocumentV2(v2Deck)).toBe(true);
    expect(isDeckDocumentV2(v1Deck)).toBe(false);
  });

  it("rejects an unknown explicit schema version", () => {
    expect(() => resolveRenderableDeck({ ...v2Deck, schemaVersion: 9 })).toThrow(/phiên bản tài liệu/i);
  });

  it("rejects an invalid declared V2 document with the failing path", () => {
    expect(() => resolveRenderableDeck({ ...v2Deck, canvas: { width: 100, height: 100, unit: "px" } })).toThrow(/canvas/i);
  });
});
