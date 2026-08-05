import { describe, expect, it } from "vitest";
import { defineDeck, validateDeck } from "./index.js";

describe("Deck document contract", () => {
  it("accepts a valid versioned 16:9 deck", () => {
    const deck = defineDeck({
      id: "deckory-intro",
      version: 1,
      title: "Deckory",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [
        {
          id: "cover",
          layout: "cover",
          components: [
            { id: "cover-title", type: "heading", props: { title: "Trình bày có cấu trúc" } }
          ]
        }
      ]
    });

    expect(validateDeck(deck).ok).toBe(true);
  });

  it("reports duplicate component IDs with a slide-scoped diagnostic", () => {
    const result = validateDeck({
      id: "duplicate-components",
      version: 1,
      title: "Deck lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [
        {
          id: "cover",
          layout: "cover",
          components: [
            { id: "same", type: "heading", props: { title: "Một" } },
            { id: "same", type: "heading", props: { title: "Hai" } }
          ]
        }
      ]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ slideId: "cover", propertyPath: "slides.0.components.1.id" })]
    });
  });

  it("rejects unstable IDs and reports the complete property path", () => {
    const result = validateDeck({
      id: "Invalid Deck",
      version: 1,
      title: "Deck lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{ id: "Cover Slide", layout: "cover", components: [{ id: "Title", type: "heading", props: { title: "Deckory" } }] }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "id", expected: "stable kebab-case ID" }),
        expect.objectContaining({ slideId: "Cover Slide", propertyPath: "slides.0.id" }),
        expect.objectContaining({ componentId: "Title", propertyPath: "slides.0.components.0.id" })
      ])
    });
  });

  it("validates semantic component props instead of accepting arbitrary records", () => {
    const result = validateDeck({
      id: "invalid-heading",
      version: 1,
      title: "Deck lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{ id: "cover", layout: "cover", components: [{ id: "title", type: "heading", props: { title: "" } }] }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({
        slideId: "cover",
        componentId: "title",
        propertyPath: "slides.0.components.0.props.title",
        expected: "non-empty text"
      })]
    });
  });

  it("rejects components that are incompatible with the selected layout", () => {
    const result = validateDeck({
      id: "invalid-layout",
      version: 1,
      title: "Deck lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{ id: "cover", layout: "cover", components: [{ id: "chart", type: "chart", props: { title: "Điểm", unit: "%", values: [{ label: "A", value: 10 }] } }] }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ propertyPath: "slides.0.components.0.type", expected: expect.stringContaining("cover") })]
    });
  });

  it("reports components outside the registered vocabulary", () => {
    const result = validateDeck({
      id: "unknown-component",
      version: 1,
      title: "Deck lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [
        {
          id: "cover",
          layout: "cover",
          components: [{ id: "custom", type: "unsupported", props: {} }]
        }
      ]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ componentId: "custom", propertyPath: "slides.0.components.0.type" })]
    });
  });
});
