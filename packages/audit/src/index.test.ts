import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import {
  auditDeck,
  auditDecks,
  formatAuditReport,
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
  });
});
