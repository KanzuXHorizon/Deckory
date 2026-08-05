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

  it("accepts typed table and code components for data-heavy technical slides", () => {
    const result = validateDeck({
      id: "technical-evidence",
      version: 1,
      title: "Bằng chứng kỹ thuật",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "implementation-proof",
        layout: "data",
        variant: "technical",
        components: [
          {
            id: "comparison-table",
            type: "table",
            props: {
              title: "So sánh renderer",
              columns: ["Tiêu chí", "Trước", "Sau"],
              rows: [
                { cells: ["Component có type", "Không", "Có"], highlight: true },
                { cells: ["Accessible summary", "Thiếu", "Đầy đủ"] }
              ],
              note: "Dữ liệu minh hoạ"
            }
          },
          {
            id: "validation-code",
            type: "code",
            props: {
              title: "Validation trước khi trình chiếu",
              language: "typescript",
              code: "const result = validateDeck(deck);\nif (!result.ok) throw new Error('Invalid deck');",
              caption: "Chặn document lỗi trước khi vào Presenter.",
              showLineNumbers: true,
              highlightLines: [1]
            }
          }
        ]
      }]
    });

    expect(result).toMatchObject({ ok: true });
  });

  it("rejects malformed table rows and code highlights outside the snippet", () => {
    const result = validateDeck({
      id: "invalid-technical-evidence",
      version: 1,
      title: "Bằng chứng kỹ thuật lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "invalid-components",
        layout: "data",
        components: [
          {
            id: "broken-table",
            type: "table",
            props: {
              title: "Bảng lỗi",
              columns: ["A", "B", "C"],
              rows: [{ cells: ["1", "2"] }]
            }
          },
          {
            id: "broken-code",
            type: "code",
            props: {
              title: "Code lỗi",
              language: "typescript",
              code: "const deck = defineDeck(input);",
              highlightLines: [2]
            }
          }
        ]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({
          componentId: "broken-table",
          propertyPath: "slides.0.components.0.props.rows.0.cells"
        }),
        expect.objectContaining({
          componentId: "broken-code",
          propertyPath: "slides.0.components.1.props.highlightLines.0"
        })
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

  it("accepts professional team showcases with optional member fields and local images", () => {
    const result = validateDeck({
      id: "team-story",
      version: 1,
      title: "Đội ngũ",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "team",
        layout: "split",
        components: [{
          id: "project-team",
          type: "team-showcase",
          props: {
            project: "Deckory",
            variant: "editorial",
            members: [
              { id: "thai-van", name: "Nguyễn Thái Vân", role: "Product Lead", studentId: "PS00001", image: { src: "/team/thai-van.webp", alt: "Chân dung Nguyễn Thái Vân", position: "top" }, featured: true },
              { id: "minh-anh", name: "Minh Anh", skills: ["Research", "Motion"] }
            ]
          }
        }]
      }]
    });

    expect(result).toMatchObject({ ok: true });
  });

  it("rejects remote team images and duplicate member identities", () => {
    const result = validateDeck({
      id: "invalid-team-story",
      version: 1,
      title: "Đội ngũ lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "team",
        layout: "split",
        components: [{
          id: "project-team",
          type: "team-showcase",
          props: {
            members: [
              { id: "same-member", name: "Một", image: { src: "https://example.com/avatar.png", alt: "Ảnh một" }, featured: true },
              { id: "same-member", name: "Hai", featured: true }
            ]
          }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.members.0.image.src" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.members.1.id" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.members" })
      ])
    });
  });

  it("accepts a single-member profile showcase and rejects hidden extra members", () => {
    const base = {
      id: "member-profile",
      version: 1,
      title: "Hồ sơ thành viên",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "member-profile",
        layout: "data",
        components: [{
          id: "member",
          type: "team-showcase",
          props: {
            variant: "profile",
            members: [{
              id: "thai-van",
              name: "Nguyễn Thái Vân",
              role: "Product Lead",
              summary: "Phụ trách định hướng sản phẩm và chất lượng trình bày.",
              image: { src: "/team/thai-van.webp", alt: "Chân dung Nguyễn Thái Vân", position: "top" }
            }]
          }
        }]
      }]
    } as const;
    const valid = validateDeck(base);
    const invalid = validateDeck({
      ...base,
      id: "invalid-member-profile",
      slides: [{
        ...base.slides[0],
        components: [{
          ...base.slides[0].components[0],
          props: {
            ...base.slides[0].components[0].props,
            members: [
              ...base.slides[0].components[0].props.members,
              { id: "second-member", name: "Thành viên 02" }
            ]
          }
        }]
      }]
    });

    expect(valid).toMatchObject({ ok: true });
    expect(invalid).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.members" })
      ])
    });
  });

  it("rejects profile content that cannot fit the professional slide budget", () => {
    const result = validateDeck({
      id: "dense-member-profile",
      version: 1,
      title: "Hồ sơ quá dày",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "member-profile",
        layout: "data",
        components: [{
          id: "member",
          type: "team-showcase",
          props: {
            variant: "profile",
            members: [{
              id: "dense-member",
              name: "Thành viên có quá nhiều nội dung",
              summary: "Nội dung mô tả quá dài ".repeat(14),
              contributions: ["Một", "Hai", "Ba", "Bốn", "Năm"],
              links: [
                { label: "Một", href: "https://example.com/1" },
                { label: "Hai", href: "https://example.com/2" },
                { label: "Ba", href: "https://example.com/3" },
                { label: "Bốn", href: "https://example.com/4" }
              ]
            }]
          }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.members.0.summary" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.members.0.contributions" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.members.0.links" })
      ])
    });
  });

  it("accepts semantic visualizers and rejects invalid parent references", () => {
    const valid = validateDeck({
      id: "growth-story",
      version: 1,
      title: "Hành trình phát triển",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "growth",
        layout: "process",
        components: [{
          id: "growth-tree",
          type: "visualizer",
          props: {
            variant: "growth-tree",
            interaction: "inspect",
            animation: "grow",
            center: "Sản phẩm trưởng thành",
            items: [
              { id: "seed", label: "Hạt giống", description: "Ý tưởng ban đầu", icon: "seed" },
              { id: "prototype", label: "Nguyên mẫu", parentId: "seed", tone: "teal" },
              { id: "product", label: "Sản phẩm", parentId: "prototype", featured: true }
            ]
          }
        }]
      }]
    });
    const invalid = validateDeck({
      id: "broken-growth-story",
      version: 1,
      title: "Hành trình lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "growth",
        layout: "process",
        components: [{
          id: "growth-tree",
          type: "visualizer",
          props: {
            variant: "network",
            items: [
              { id: "source", label: "Nguồn", parentId: "missing" },
              { id: "sink", label: "Đích", parentId: "sink" }
            ]
          }
        }]
      }]
    });

    expect(valid).toMatchObject({ ok: true });
    expect(invalid).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.items.0.parentId" }),
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.items.1.parentId" })
      ])
    });
  });
});
