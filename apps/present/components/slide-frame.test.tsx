import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Slide } from "@deckory/schema";
import { SlideFrame } from "./slide-frame";

const dataSlide: Slide = {
  id: "quality-signal",
  layout: "data",
  variant: "spotlight",
  components: [
    {
      id: "heading",
      type: "heading",
      morphId: "quality-title",
      effect: { type: "wipe", duration: 0.4 },
      props: { title: "Khả năng tiếp cận đang dẫn đầu" }
    },
    {
      id: "chart",
      type: "chart",
      props: {
        title: "Điểm chất lượng",
        unit: "điểm / 100",
        values: [
          { label: "Khả năng đọc", value: 88 },
          { label: "Khả năng tiếp cận", value: 96, highlight: true }
        ]
      }
    },
    {
      id: "insight",
      type: "insight",
      props: {
        label: "KẾT LUẬN",
        title: "Khả năng tiếp cận đang dẫn đầu",
        description: "Cao hơn khả năng đọc 8 điểm.",
        metric: "+8",
        tone: "teal"
      }
    }
  ]
};

describe("SlideFrame", () => {
  it("renders semantic component slots and an accessible chart summary", () => {
    const html = renderToStaticMarkup(
      <SlideFrame slide={dataSlide} deckId="deckory-story" sequenceStep={0} reducedMotion />
    );

    expect(html).toContain("slide--data");
    expect(html).toContain("slide--spotlight");
    expect(html).toContain("component-slot--insight");
    expect(html).toContain('role="img"');
    expect(html).toContain("Khả năng đọc: 88");
    expect(html).toContain('role="note"');
    expect(html).toContain('data-effect="wipe"');
    expect(html).toContain('data-morph-id="deckory-story--quality-title"');
  });

  it("renders accessible tables and code snippets with presentation highlights", () => {
    const technicalSlide: Slide = {
      id: "technical-proof",
      layout: "data",
      variant: "technical",
      components: [
        {
          id: "comparison-table",
          type: "table",
          props: {
            title: "So sánh contract",
            columns: ["Tiêu chí", "Trước", "Sau"],
            rows: [
              { cells: ["Schema", "Record tự do", "Discriminated union"], highlight: true },
              { cells: ["Validation", "Muộn", "Trước Presenter"] }
            ],
            note: "Dữ liệu minh hoạ"
          }
        },
        {
          id: "validation-code",
          type: "code",
          props: {
            title: "Chặn document lỗi",
            language: "typescript",
            code: "const result = validateDeck(deck);\nif (!result.ok) throw new Error('<invalid>');",
            caption: "Validation là ranh giới trước khi trình chiếu.",
            showLineNumbers: true,
            highlightLines: [2]
          }
        }
      ]
    };

    const html = renderToStaticMarkup(
      <SlideFrame slide={technicalSlide} deckId="deckory-story" sequenceStep={0} reducedMotion />
    );

    expect(html).toContain("component-slot--table");
    expect(html).toContain("component-slot--code");
    expect(html).toContain("<table");
    expect(html).toContain("So sánh contract");
    expect(html).toContain('class="data-table-row is-highlighted"');
    expect(html).toContain("<pre");
    expect(html).toContain('data-language="typescript"');
    expect(html).toContain('data-highlighted="true"');
    expect(html).toContain("&lt;invalid&gt;");
    expect(html).toContain('aria-label="Chặn document lỗi. Ngôn ngữ typescript. 2 dòng."');
  });

  it("renders professional team showcases and semantic visualizers", () => {
    const storySlide: Slide = {
      id: "people-and-growth",
      layout: "data",
      components: [
        {
          id: "team",
          type: "team-showcase",
          props: {
            title: "Đội ngũ biến cấu trúc thành trải nghiệm",
            subtitle: "Ba vai trò, một source of truth.",
            project: "Deckory",
            variant: "editorial",
            members: [
              {
                id: "thai-van",
                name: "Nguyễn Thái Vân",
                role: "Product Lead",
                studentId: "PS00001",
                summary: "Định hướng sản phẩm và visual quality.",
                skills: ["Product", "Presentation"],
                image: { src: "/team/thai-van.webp", alt: "Chân dung Nguyễn Thái Vân", position: "top" },
                accent: "cobalt",
                featured: true
              },
              {
                id: "minh-anh",
                name: "Minh Anh",
                role: "Visual Systems",
                contributions: ["Motion grammar", "Data visualization"],
                accent: "teal"
              }
            ]
          }
        },
        {
          id: "growth",
          type: "visualizer",
          props: {
            title: "Mỗi vòng review làm hệ thống trưởng thành hơn",
            summary: "Từ ý tưởng đến sản phẩm có thể kiểm chứng.",
            center: "Deckory",
            variant: "growth-tree",
            interaction: "inspect",
            animation: "grow",
            items: [
              { id: "seed", label: "Ý tưởng", icon: "seed" },
              { id: "prototype", label: "Nguyên mẫu", parentId: "seed", icon: "code", tone: "teal" },
              { id: "product", label: "Sản phẩm", parentId: "prototype", icon: "sparkle", featured: true }
            ]
          }
        }
      ]
    };

    const html = renderToStaticMarkup(
      <SlideFrame slide={storySlide} deckId="deckory-story" sequenceStep={0} reducedMotion />
    );

    expect(html).toContain("component-slot--team-showcase");
    expect(html).toContain("team-showcase--editorial");
    expect(html).toContain("Nguyễn Thái Vân");
    expect(html).toContain('src="/team/thai-van.webp"');
    expect(html).toContain('alt="Chân dung Nguyễn Thái Vân"');
    expect(html).toContain("MA");
    expect(html).toContain("component-slot--visualizer");
    expect(html).toContain("visualizer--growth-tree");
    expect(html).toContain('data-parent-id="seed"');
    expect(html).toContain("Mỗi vòng review làm hệ thống trưởng thành hơn");
    expect(html).toContain("Deckory");
  });

  it("keeps unrevealed sequence content inaccessible and disables motion for thumbnails", () => {
    const slide: Slide = {
      id: "sequence-slide",
      layout: "statement",
      components: [{
        id: "statement",
        type: "statement",
        sequence: 2,
        effect: { type: "blur", delay: 0.2 },
        props: { quote: "Nội dung xuất hiện theo nhịp kể." }
      }]
    };

    const hiddenHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={1} reducedMotion={false} />
    );
    const thumbnailHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={0} reducedMotion={false} motionDisabled />
    );

    expect(hiddenHtml).toContain('aria-hidden="true"');
    expect(hiddenHtml).toContain('data-visible="false"');
    expect(hiddenHtml).toContain("pointer-events:none");
    expect(thumbnailHtml).toContain('data-motion-disabled="true"');
    expect(thumbnailHtml).toContain('data-visible="true"');
  });
});
