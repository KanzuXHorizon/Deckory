import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Slide } from "@deckory/schema";
import { encodeWeightSimulatorInteraction, getComponentInteractionKey } from "./interaction-state";
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
      <SlideFrame slide={dataSlide} deckId="deckory-story" sequenceStep={0} reducedMotion={false} />
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

  it("marks six-member rosters for a compact two-column layout", () => {
    const rosterSlide: Slide = {
      id: "six-member-team",
      layout: "data",
      components: [{
        id: "team",
        type: "team-showcase",
        props: {
          variant: "editorial",
          members: Array.from({ length: 6 }, (_, index) => ({
            id: `member-${index + 1}`,
            name: `Thành viên ${index + 1}`,
            role: index === 0 ? "Project Lead" : undefined
          }))
        }
      }]
    };

    const html = renderToStaticMarkup(
      <SlideFrame slide={rosterSlide} deckId="deckory-story" sequenceStep={0} reducedMotion />
    );

    expect(html).toContain('data-member-count="6"');
    expect(html.match(/class="team-member /g)).toHaveLength(6);
  });

  it("renders a dedicated single-member profile without a roster control", () => {
    const profileSlide: Slide = {
      id: "member-profile",
      layout: "data",
      components: [
        {
          id: "heading",
          type: "heading",
          props: { eyebrow: "ĐỘI NGŨ", title: "Nguyễn Thái Vân", description: "Product Lead" }
        },
        {
          id: "profile",
          type: "team-showcase",
          props: {
            project: "Deckory",
            variant: "profile",
            members: [{
              id: "thai-van",
              name: "Nguyễn Thái Vân",
              role: "Product Lead",
              studentId: "PS00001",
              summary: "Phụ trách định hướng sản phẩm và chất lượng trình bày.",
              skills: ["Product", "Storytelling"],
              contributions: ["Product thesis", "Visual review"],
              image: { src: "/team/thai-van.webp", alt: "Chân dung Nguyễn Thái Vân", position: "top" },
              accent: "cobalt"
            }]
          }
        }
      ]
    };

    const html = renderToStaticMarkup(
      <SlideFrame slide={profileSlide} deckId="deckory-story" sequenceStep={0} reducedMotion />
    );

    expect(html).toContain("team-showcase--profile");
    expect(html).toContain("team-profile-layout");
    expect(html).toContain('alt="Chân dung Nguyễn Thái Vân"');
    expect(html).toContain("Product thesis");
    expect(html).not.toContain("Danh sách thành viên");
  });

  it("keeps sequenced semantic interactions inert until their reveal step", () => {
    const slide: Slide = {
      id: "semantic-sequence",
      layout: "process",
      components: [{
        id: "visualizer",
        type: "visualizer",
        sequence: 1,
        props: {
          variant: "growth-tree",
          interaction: "inspect",
          animation: "pulse",
          items: [
            { id: "idea", label: "Ý tưởng", featured: true },
            { id: "quality", label: "Quality gates", parentId: "idea" }
          ]
        }
      }]
    };

    const hiddenHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={0} reducedMotion={false} />
    );
    const visibleHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={1} reducedMotion={false} />
    );

    expect(hiddenHtml).toContain('data-active="false"');
    expect(hiddenHtml).not.toContain('role="button"');
    expect(hiddenHtml).not.toContain('aria-pressed=');
    expect(hiddenHtml).not.toContain("is-pulse-target");
    expect(visibleHtml).toContain('data-active="true"');
    expect(visibleHtml).toContain('role="button"');
    expect(visibleHtml).toContain('aria-pressed="true"');
    expect(visibleHtml).toContain("is-pulse-target");
    expect(visibleHtml).not.toContain('class="visual-canvas" aria-hidden="true"');
    expect(visibleHtml).toMatch(/<svg class="visual-connections"[^>]*aria-hidden="true"/);
  });

  it("renders synchronized semantic selections as read-only when no interaction handler is available", () => {
    const slide: Slide = {
      id: "audience-selections",
      layout: "process",
      components: [
        {
          id: "team",
          type: "team-showcase",
          props: {
            members: [
              { id: "lead", name: "Trưởng nhóm", featured: true },
              { id: "designer", name: "Thiết kế" }
            ]
          }
        },
        {
          id: "map",
          type: "visualizer",
          props: {
            variant: "network",
            interaction: "inspect",
            items: [
              { id: "source", label: "Nguồn", featured: true },
              { id: "result", label: "Kết quả", parentId: "source" }
            ]
          }
        }
      ]
    };

    const html = renderToStaticMarkup(
      <SlideFrame
        slide={slide}
        sequenceStep={0}
        reducedMotion={false}
        interactionState={{
          [getComponentInteractionKey(slide.id, "team")]: "designer",
          [getComponentInteractionKey(slide.id, "map")]: "result"
        }}
      />
    );

    expect(html).toContain("Thiết kế");
    expect(html).toContain("Kết quả");
    expect(html).not.toContain('role="button"');
    expect(html).not.toContain('aria-pressed=');
  });

  it("renders a synchronized weight simulator state and keeps read-only audiences non-interactive", () => {
    const slide: Slide = {
      id: "weighting",
      layout: "data",
      components: [{
        id: "simulator",
        type: "weight-simulator",
        props: {
          title: "Mô phỏng trọng số",
          description: "Thử nhiều ưu tiên đánh giá.",
          dimensions: [
            { id: "quality", label: "Chất lượng", score: 86, weight: 60 },
            { id: "speed", label: "Tốc độ", score: 72, weight: 40 }
          ],
          presets: [
            { id: "balanced", label: "Cân bằng", description: "Ưu tiên đồng đều", weights: { quality: 50, speed: 50 } },
            { id: "quality-first", label: "Ưu tiên chất lượng", description: "Tăng trọng số chất lượng", weights: { quality: 75, speed: 25 } }
          ],
          disclaimer: "Dữ liệu minh hoạ."
        }
      }]
    };
    const interactionState = {
      [getComponentInteractionKey(slide.id, "simulator")]: encodeWeightSimulatorInteraction({ presetId: "custom", weights: { quality: 64, speed: 36 } })
    };

    const html = renderToStaticMarkup(
      <SlideFrame slide={slide} sequenceStep={0} reducedMotion={false} interactionState={interactionState} />
    );
    const staticHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} sequenceStep={0} reducedMotion={false} motionDisabled />
    );

    expect(html).toContain('value="64"');
    expect(html).toContain('value="36"');
    expect(html).toContain("Tổng trọng số 100%");
    expect(html).toContain('data-read-only="true"');
    expect(html).toContain("disabled=\"\"");
    expect(staticHtml).toContain('data-read-only="true"');
    expect(staticHtml).toContain("disabled=\"\"");
  });

  it("preserves reveal state when motion is disabled or reduced", () => {
    const slide: Slide = {
      id: "sequence-slide",
      layout: "statement",
      components: [{
        id: "statement",
        type: "statement",
        sequence: 2,
        morphId: "story-point",
        effect: { type: "blur", delay: 0.2 },
        props: { quote: "Nội dung xuất hiện theo nhịp kể." }
      }]
    };

    const animatedHiddenHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={1} reducedMotion={false} />
    );
    const staticHiddenHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={1} reducedMotion={false} motionDisabled />
    );
    const reducedHiddenHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={1} reducedMotion />
    );
    const staticVisibleHtml = renderToStaticMarkup(
      <SlideFrame slide={slide} deckId="deckory-story" sequenceStep={2} reducedMotion={false} motionDisabled />
    );

    for (const html of [animatedHiddenHtml, staticHiddenHtml, reducedHiddenHtml]) {
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('data-visible="false"');
      expect(html).toContain("pointer-events:none");
    }
    expect(staticHiddenHtml).toContain('data-motion-disabled="true"');
    expect(staticHiddenHtml).not.toContain('data-morph-id="deckory-story--story-point"');
    expect(reducedHiddenHtml).not.toContain('data-morph-id="deckory-story--story-point"');
    expect(staticVisibleHtml).toContain('data-visible="true"');
  });
});
