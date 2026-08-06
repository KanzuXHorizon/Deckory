import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckAuditReportV2 } from "@deckory/audit";
import { QualitySummaryV2 } from "./quality-summary-v2";

function report(overrides: Partial<DeckAuditReportV2> = {}): DeckAuditReportV2 {
  return {
    schemaVersion: 2,
    deckId: "scene-foundation",
    title: "Deckory V2 Scene Foundation",
    summary: { passed: false, slideCount: 3, errorCount: 0, warningCount: 2 },
    issues: [
      {
        code: "missing-slide-notes",
        severity: "warning",
        deckId: "scene-foundation",
        slideId: "cover",
        message: "Slide chưa có speaker notes.",
        remediation: "Bổ sung notes."
      },
      {
        code: "diagram-adapter-required",
        severity: "warning",
        deckId: "scene-foundation",
        slideId: "visual-proof",
        elementId: "architecture-diagram",
        message: "Diagram cần adapter.",
        remediation: "Tích hợp adapter."
      }
    ],
    scorecard: {
      overallScore: 7.8,
      readiness: "review",
      dimensions: [
        { id: "storytelling", label: "Storytelling", score: 9, confidence: "structural", checks: [] },
        { id: "ui", label: "UI", score: 0, confidence: "manual-review-required", checks: [] },
        { id: "performance", label: "Performance", score: 0, confidence: "manual-review-required", checks: [] }
      ]
    },
    ...overrides
  };
}

describe("QualitySummaryV2", () => {
  it("shows score, readiness, top issues and categories awaiting evidence", () => {
    const html = renderToStaticMarkup(<QualitySummaryV2 report={report()} />);

    expect(html).toContain('data-v2-quality-summary="true"');
    expect(html).toContain("7.8");
    expect(html).toContain("Cần review");
    expect(html).toContain("Slide chưa có speaker notes.");
    expect(html).toContain("Diagram cần adapter.");
    expect(html).toContain("UI");
    expect(html).toContain("Performance");
    expect(html).toContain("Chờ bằng chứng runtime/manual");
  });

  it("never presents a green production badge while any category awaits manual evidence", () => {
    const pending = report({
      summary: { passed: true, slideCount: 3, errorCount: 0, warningCount: 0 },
      issues: [],
      scorecard: {
        overallScore: 10,
        readiness: "production-ready",
        dimensions: [
          { id: "visual-design", label: "Visual Design", score: 10, confidence: "manual-review-required", checks: [] }
        ]
      }
    });
    const html = renderToStaticMarkup(<QualitySummaryV2 report={pending} />);

    expect(html).toContain("Chờ bằng chứng runtime/manual");
    expect(html).not.toContain("Sẵn sàng production");
    expect(html).toContain('data-quality-state="evidence-pending"');
  });

  it("uses a concise empty issue state when structural checks are clean", () => {
    const clean = report({ issues: [], summary: { passed: true, slideCount: 3, errorCount: 0, warningCount: 0 } });
    const html = renderToStaticMarkup(<QualitySummaryV2 report={clean} compact />);

    expect(html).toContain("Không có lỗi cấu trúc đang mở");
    expect(html).toContain('data-quality-density="compact"');
  });
});
