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

  it("accepts typed theme customization and a data insight component", () => {
    const result = validateDeck({
      id: "customized-story",
      version: 1,
      title: "Deck có thương hiệu",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      theme: {
        preset: "editorial-light",
        accent: "cobalt",
        typography: "editorial",
        density: "comfortable"
      },
      slides: [{
        id: "quality-signal",
        layout: "data",
        variant: "spotlight",
        components: [
          { id: "heading", type: "heading", props: { title: "Tín hiệu chính" } },
          { id: "insight", type: "insight", props: { label: "KẾT LUẬN", title: "Khả năng tiếp cận đang dẫn đầu", description: "Điểm cao nhất trong bộ dữ liệu minh hoạ.", metric: "96/100", tone: "teal" } },
          { id: "footer", type: "evidence-footer", props: { source: "Dữ liệu minh hoạ" } }
        ]
      }]
    });

    expect(result).toMatchObject({ ok: true });
  });

  it("rejects unsupported theme values and insight components outside compatible layouts", () => {
    const result = validateDeck({
      id: "invalid-theme",
      version: 1,
      title: "Deck lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      theme: { preset: "glass-ai", accent: "purple-neon" },
      slides: [{
        id: "cover",
        layout: "cover",
        components: [{ id: "insight", type: "insight", props: { label: "KẾT LUẬN", title: "Không hợp layout", description: "Insight này không thuộc cover." } }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "theme.preset" }),
        expect.objectContaining({ propertyPath: "theme.accent" })
      ])
    });
  });

  it("accepts typed slide transitions, element effects, and shared morph IDs", () => {
    const result = validateDeck({
      id: "motion-story",
      version: 1,
      title: "Deck chuyển động",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "motion-cover",
        layout: "cover",
        transition: { type: "morph", duration: 0.7, easing: "emphasized" },
        components: [{
          id: "motion-title",
          type: "heading",
          morphId: "story-title",
          effect: { type: "rise", duration: 0.42, delay: 0.1, easing: "standard" },
          props: { title: "Chuyển động có chủ đích" }
        }]
      }]
    });

    expect(result).toMatchObject({ ok: true });
  });

  it("rejects unsupported motion presets and unstable morph IDs", () => {
    const result = validateDeck({
      id: "invalid-motion",
      version: 1,
      title: "Deck lỗi motion",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "cover",
        layout: "cover",
        transition: { type: "spin" },
        components: [{
          id: "title",
          type: "heading",
          morphId: "Story Title",
          effect: { type: "bounce" },
          props: { title: "Không hợp lệ" }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.transition.type" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.effect.type" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.morphId" })
      ])
    });
  });

  it("rejects motion timing outside the safe performance budget", () => {
    const result = validateDeck({
      id: "unsafe-motion",
      version: 1,
      title: "Deck lỗi timing",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "cover",
        layout: "cover",
        transition: { type: "wipe", duration: 1.21 },
        components: [{
          id: "title",
          type: "heading",
          effect: { type: "blur", duration: 0.09, delay: 1.51 },
          props: { title: "Timing không hợp lệ" }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.transition.duration" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.effect.duration" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.effect.delay" })
      ])
    });
  });

  it("rejects components that do not belong in a closing layout", () => {
    const result = validateDeck({
      id: "invalid-closing",
      version: 1,
      title: "Closing không hợp lệ",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "closing",
        layout: "closing",
        components: [{
          id: "chart",
          type: "chart",
          props: { title: "Không dành cho closing", unit: "điểm", values: [{ label: "A", value: 1 }] }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.type" })
      ])
    });
  });
});
