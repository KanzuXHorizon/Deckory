import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import {
  auditDeck,
  auditDecks,
  formatAuditReport,
  scoreDeckQuality,
  type DeckAuditReport
} from "./index.js";

function validDeck(): DeckDocument {
  return {
    id: "quality-deck",
    version: 1,
    title: "Quality deck",
    locale: "vi-VN",
    themeId: "quality-deck",
    slides: [
      {
        id: "cover",
        layout: "cover",
        notes: "Mở đầu bằng vấn đề và dẫn vào mục tiêu của deck.",
        components: [
          { id: "heading", type: "heading", props: { title: "Một cấu trúc rõ giúp khán giả quyết định nhanh hơn" } }
        ]
      },
      {
        id: "quality-signal",
        layout: "data",
        notes: "Đọc kết luận trước, sau đó dùng chart để chứng minh.",
        components: [
          { id: "heading", type: "heading", props: { title: "Khả năng tiếp cận đang dẫn đầu" } },
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
            id: "evidence",
            type: "evidence-footer",
            props: { source: "Dữ liệu fixture minh hoạ / Deckory audit" }
          }
        ]
      }
    ]
  };
}

describe("auditDeck", () => {
  it("passes a structured deck with notes and evidence", () => {
    const report = auditDeck(validDeck());

    expect(report.summary).toEqual({
      passed: true,
      slideCount: 2,
      errorCount: 0,
      warningCount: 0
    });
    expect(report.issues).toEqual([]);
    expect(report.scorecard.dimensions).toHaveLength(15);
    expect(report.scorecard.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.scorecard.overallScore).toBeLessThanOrEqual(10);
  });

  it("returns actionable quality diagnostics for real presentation risks", () => {
    const deck = validDeck();
    deck.slides = [
      {
        id: "results",
        layout: "data",
        components: [
          { id: "heading", type: "heading", props: { title: "Kết quả" } },
          {
            id: "chart",
            type: "chart",
            props: {
              title: "Điểm chất lượng",
              unit: "điểm / 100",
              values: [
                { label: "A", value: 10, highlight: true },
                { label: "B", value: 20, highlight: true },
                { label: "C", value: 30, highlight: true }
              ]
            }
          },
          { id: "insight-1", type: "insight", props: { label: "Ý 1", title: "Một", description: "Một", tone: "neutral" } },
          { id: "insight-2", type: "insight", props: { label: "Ý 2", title: "Hai", description: "Hai", tone: "neutral" } },
          { id: "insight-3", type: "insight", props: { label: "Ý 3", title: "Ba", description: "Ba", tone: "neutral" } },
          { id: "insight-4", type: "insight", props: { label: "Ý 4", title: "Bốn", description: "Bốn", tone: "neutral" } },
          { id: "insight-5", type: "insight", props: { label: "Ý 5", title: "Năm", description: "Năm", tone: "neutral" } }
        ]
      }
    ];

    const report = auditDeck(deck);
    const codes = report.issues.map((issue) => issue.code);

    expect(codes).toEqual(expect.arrayContaining([
      "missing-notes",
      "missing-evidence",
      "generic-heading",
      "dense-slide",
      "chart-highlight-overuse"
    ]));
    expect(report.summary.passed).toBe(false);
    expect(report.issues.every((issue) => issue.remediation.length > 0)).toBe(true);
  });

  it("converts schema failures into audit errors without throwing", () => {
    const invalid = { ...validDeck(), id: "Invalid ID" };
    const report = auditDeck(invalid);

    expect(report.summary.passed).toBe(false);
    expect(report.issues.some((issue) => issue.code === "schema-invalid" && issue.severity === "error")).toBe(true);
  });

  it("scores all 15 quality dimensions with transparent confidence labels", () => {
    const scorecard = scoreDeckQuality(validDeck());

    expect(scorecard.dimensions.map((dimension) => dimension.id)).toEqual([
      "storytelling",
      "ui",
      "ux",
      "visual-design",
      "motion-design",
      "typography",
      "layout",
      "charts",
      "copywriting",
      "accessibility",
      "interaction",
      "branding",
      "evidence",
      "demo-readiness",
      "production-quality"
    ]);
    expect(scorecard.dimensions.every((dimension) => dimension.score >= 0 && dimension.score <= 10)).toBe(true);
    expect(scorecard.dimensions.every((dimension) => dimension.checks.length > 0)).toBe(true);
    expect(scorecard.dimensions.some((dimension) => dimension.confidence === "runtime-required")).toBe(true);
  });

  it("does not penalize evidence coverage when a deck has no data slides", () => {
    const deck = validDeck();
    deck.slides = [{
      id: "statement",
      layout: "statement",
      notes: "Nêu một luận điểm không cần dữ liệu định lượng.",
      components: [
        { id: "heading", type: "heading", props: { title: "Một luận điểm định tính không cần evidence footer" } },
        { id: "statement-copy", type: "statement", props: { quote: "Không có chart hoặc table trên slide này." } }
      ]
    }];

    const scorecard = scoreDeckQuality(deck);
    const evidence = scorecard.dimensions.find((dimension) => dimension.id === "evidence")!;
    const demoReadiness = scorecard.dimensions.find((dimension) => dimension.id === "demo-readiness")!;

    expect(evidence.checks.find((check) => check.id === "evidence-coverage")).toMatchObject({ passed: true });
    expect(demoReadiness.checks.find((check) => check.id === "demo-evidence")).toMatchObject({ passed: true });
  });

  it("uses explicit verification evidence to unlock runtime quality checks", () => {
    const deck = validDeck();
    deck.slides = [
      {
        ...deck.slides[0]!,
        masterId: "cover-editorial"
      },
      {
        ...deck.slides[1]!,
        masterId: "data-analysis"
      },
      {
        id: "closing",
        masterId: "closing-action",
        layout: "closing",
        notes: "Khép lại bằng quyết định và bước tiếp theo.",
        components: [
          { id: "heading", type: "heading", props: { title: "Cấu trúc, bằng chứng và kiểm chứng tạo nên một deck đáng tin cậy" } },
          { id: "statement", type: "statement", props: { quote: "Sẵn sàng trình chiếu sau khi mọi gate runtime đã có bằng chứng." } }
        ]
      }
    ];

    const scorecard = scoreDeckQuality(deck, {
      browserUi: true,
      keyboardAndZoom: true,
      visualReview: true,
      accessibility: true,
      interaction: true,
      productionGates: true
    });

    expect(scorecard.dimensions
      .flatMap((dimension) => dimension.checks)
      .filter((check) => ["browser-ui", "keyboard-zoom", "visual-review", "a11y-runtime", "interaction-runtime", "production-gates"].includes(check.id))
      .every((check) => check.passed)).toBe(true);
    expect(scorecard).toMatchObject({ overallScore: 10, readiness: "production-ready" });
  });

  it("detects repeated composition, flat density, and motion overload beyond layout names", () => {
    const source = validDeck().slides[1]!;
    const deck = validDeck();
    deck.slides = Array.from({ length: 6 }, (_, index) => ({
      ...source,
      id: `evidence-${index + 1}`,
      masterId: `data-analysis-${index + 1}`,
      variant: "evidence" as const,
      background: "grid" as const,
      transition: { type: "wipe" as const, duration: 0.55 },
      notes: `Ghi chú ${index + 1}`,
      components: source.components.map((component, componentIndex) => ({
        ...component,
        id: `${component.id}-${index + 1}`,
        effect: componentIndex < 3 ? { type: componentIndex === 0 ? "rise" as const : componentIndex === 1 ? "wipe" as const : "scale" as const, duration: 0.4 } : undefined
      }))
    }));

    const report = auditDeck(deck);
    const codes = report.issues.map((issue) => issue.code);
    const layoutScore = report.scorecard.dimensions.find((dimension) => dimension.id === "layout")!.score;
    const motionScore = report.scorecard.dimensions.find((dimension) => dimension.id === "motion-design")!.score;

    expect(codes).toEqual(expect.arrayContaining(["repeated-composition", "dominant-layout", "flat-density", "motion-overload"]));
    expect(layoutScore).toBeLessThan(8);
    expect(motionScore).toBeLessThan(8);
  });

  it("warns when the same layout creates a flat visual rhythm", () => {
    const deck = validDeck();
    const sourceSlide = deck.slides[1]!;
    deck.slides = [0, 1, 2].map((index) => ({
      ...sourceSlide,
      id: `data-${index + 1}`,
      notes: `Ghi chú cho slide ${index + 1}.`,
      components: sourceSlide.components.map((component) => ({ ...component, id: `${component.id}-${index + 1}` }))
    }));

    const report = auditDeck(deck);
    expect(report.issues.some((issue) => issue.code === "repeated-layout" && issue.slideId === "data-3")).toBe(true);
  });
});

describe("audit reporting", () => {
  it("aggregates deck reports and formats a readable summary", () => {
    const reports = auditDecks([validDeck(), { ...validDeck(), id: "quality-deck-2", title: "Quality deck 2" }]);
    expect(reports).toHaveLength(2);

    const text = formatAuditReport(reports as readonly DeckAuditReport[]);
    expect(text).toContain("Deckory quality audit");
    expect(text).toContain("2 deck");
    expect(text).toContain("PASS");
    expect(text).toContain("Quality score");
  });
});
