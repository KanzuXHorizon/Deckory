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
        expect.objectContaining({ propertyPath: "id", expected: "ID dạng kebab-case" }),
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
        expected: "Văn bản không trống"
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

  it("accepts professional slide-master metadata and composition variants", () => {
    const variants = ["cinematic", "asymmetric", "editorial", "evidence", "gallery"] as const;

    for (const variant of variants) {
      const result = validateDeck({
        id: `master-${variant}`,
        version: 1,
        title: `Master ${variant}`,
        locale: "vi-VN",
        themeId: "deckory-editorial",
        slides: [{
          id: `slide-${variant}`,
          masterId: `master-${variant}`,
          layout: "split",
          variant,
          background: "bands",
          components: [{ id: "heading", type: "heading", props: { title: `Bố cục ${variant}` } }]
        }]
      });

      expect(result).toMatchObject({ ok: true });
    }
  });

  it("rejects unstable slide-master IDs", () => {
    const result = validateDeck({
      id: "invalid-master-id",
      version: 1,
      title: "Master lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "slide",
        masterId: "Master Hero",
        layout: "cover",
        components: [{ id: "heading", type: "heading", props: { title: "Master không hợp lệ" } }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.masterId" })
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

  it("accepts typed semantic diagrams with accessible summaries", () => {
    const variants = ["timeline", "funnel", "pyramid", "cycle", "quadrant", "roadmap"] as const;

    for (const variant of variants) {
      const itemCount = variant === "cycle" || variant === "funnel" || variant === "pyramid" ? 3 : variant === "quadrant" ? 4 : 2;
      const result = validateDeck({
        id: `diagram-${variant}`,
        version: 1,
        title: `Diagram ${variant}`,
        locale: "vi-VN",
        themeId: "deckory-editorial",
        slides: [{
          id: `slide-${variant}`,
          layout: variant === "roadmap" || variant === "timeline" ? "process" : "data",
          components: [{
            id: `diagram-${variant}`,
            type: "diagram",
            props: {
              title: `Sơ đồ ${variant}`,
              summary: `Tóm tắt accessible cho sơ đồ ${variant}.`,
              variant,
              items: Array.from({ length: itemCount }, (_, index) => ({
                id: `item-${index + 1}`,
                label: `Mục ${index + 1}`,
                value: `${index + 1}`,
                tone: index === 0 ? "cobalt" : "neutral",
                featured: index === 0
              }))
            }
          }]
        }]
      });

      expect(result).toMatchObject({ ok: true });
    }
  });

  it("rejects semantic diagrams without an accessible summary", () => {
    const result = validateDeck({
      id: "diagram-without-summary",
      version: 1,
      title: "Diagram thiếu tóm tắt",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "cycle",
        layout: "data",
        components: [{
          id: "cycle-diagram",
          type: "diagram",
          props: {
            title: "Chu trình lỗi",
            variant: "cycle",
            items: [
              { id: "one", label: "Một" },
              { id: "two", label: "Hai" },
              { id: "three", label: "Ba" }
            ]
          }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.summary" })
      ])
    });
  });

  it("rejects quadrant diagrams with duplicate semantic positions", () => {
    const result = validateDeck({
      id: "diagram-duplicate-position",
      version: 1,
      title: "Diagram trùng vị trí",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "quadrant",
        layout: "comparison",
        components: [{
          id: "priority-quadrant",
          type: "diagram",
          props: {
            title: "Ma trận ưu tiên",
            summary: "Bốn nhóm cần nằm ở bốn vùng semantic khác nhau.",
            variant: "quadrant",
            items: [
              { id: "one", label: "Một", position: "top-left" },
              { id: "two", label: "Hai", position: "top-left" },
              { id: "three", label: "Ba", position: "bottom-left" },
              { id: "four", label: "Bốn", position: "bottom-right" }
            ]
          }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.items.1.position" })
      ])
    });
  });

  it("rejects cycle diagrams with fewer than three items", () => {
    const result = validateDeck({
      id: "diagram-short-cycle",
      version: 1,
      title: "Diagram chu trình thiếu bước",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "cycle",
        layout: "data",
        components: [{
          id: "cycle-diagram",
          type: "diagram",
          props: {
            title: "Chu trình lỗi",
            summary: "Chu trình đang thiếu bước nên không thể hiện đầy đủ vòng lặp.",
            variant: "cycle",
            items: [
              { id: "one", label: "Một" },
              { id: "two", label: "Hai" }
            ]
          }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.items" })
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
        expect.objectContaining({
          propertyPath: "slides.0.components.0.props.items.0.parentId",
          message: "Nút cha phải tham chiếu đến một nút khác đang tồn tại."
        }),
        expect.objectContaining({
          propertyPath: "slides.0.components.0.props.items.1.parentId",
          message: "Nút không thể tham chiếu chính nó làm nút cha."
        })
      ])
    });
  });

  it("accepts local media showcases and rejects missing or ambiguous assets", () => {
    const valid = validateDeck({
      id: "media-evidence",
      version: 1,
      title: "Bằng chứng giao diện",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      assets: [
        { id: "dashboard-shot", type: "image", src: "/media/dashboard.svg", mediaType: "image/svg+xml" },
        { id: "feedback-shot", type: "image", src: "/media/feedback.svg", mediaType: "image/svg+xml" }
      ],
      slides: [{
        id: "product-proof",
        layout: "data",
        components: [{
          id: "product-media",
          type: "media-showcase",
          props: {
            title: "Luồng sản phẩm đã được triển khai",
            summary: "Hai bề mặt đại diện cho đầu vào và kết quả coaching.",
            variant: "duo",
            items: [
              { assetId: "dashboard-shot", alt: "Bảng điều khiển MyInterview", eyebrow: "BỐI CẢNH", title: "Chuẩn bị đúng dữ liệu", caption: "CV, JD và mục tiêu nghề nghiệp." },
              { assetId: "feedback-shot", alt: "Màn hình phản hồi MyInterview", eyebrow: "KẾT QUẢ", title: "Phản hồi có bằng chứng", caption: "Điểm, lý do và bước cải thiện.", featured: true }
            ]
          }
        }]
      }]
    });
    const invalidShape = validateDeck({
      id: "invalid-media-shape",
      version: 1,
      title: "Bằng chứng giao diện lỗi",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      assets: [{ id: "dashboard-shot", type: "image", src: "/media/dashboard.svg", mediaType: "image/svg+xml" }],
      slides: [{
        id: "product-proof",
        layout: "data",
        components: [{
          id: "product-media",
          type: "media-showcase",
          props: {
            variant: "triptych",
            items: [
              { assetId: "dashboard-shot", alt: "Ảnh thứ nhất", title: "Featured thứ nhất", featured: true },
              { assetId: "dashboard-shot", alt: "Ảnh thứ hai", title: "Featured thứ hai", featured: true },
              { assetId: "dashboard-shot", alt: "Ảnh thứ ba", title: "Ảnh hợp lệ" },
              { assetId: "dashboard-shot", alt: "Ảnh thứ tư", title: "Quá số lượng" }
            ]
          }
        }]
      }]
    });
    const missingAsset = validateDeck({
      id: "missing-media-asset",
      version: 1,
      title: "Thiếu ảnh giao diện",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{
        id: "product-proof",
        layout: "data",
        components: [{
          id: "product-media",
          type: "media-showcase",
          props: {
            variant: "single",
            items: [{ assetId: "missing-shot", alt: "Ảnh không tồn tại", title: "Thiếu asset" }]
          }
        }]
      }]
    });

    expect(valid).toMatchObject({ ok: true });
    expect(invalidShape).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.items" })
      ])
    });
    expect(missingAsset).toMatchObject({
      ok: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ propertyPath: "slides.0.components.0.props.items.0.assetId" })
      ])
    });
  });
});
