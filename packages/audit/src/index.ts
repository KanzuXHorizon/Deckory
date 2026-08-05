import {
  validateDeck,
  type DeckDocument,
  type Slide,
  type SlideComponent
} from "@deckory/schema";

export type DeckAuditIssueCode =
  | "schema-invalid"
  | "missing-notes"
  | "missing-evidence"
  | "generic-heading"
  | "dense-slide"
  | "chart-highlight-overuse"
  | "repeated-layout";

export type DeckAuditIssue = {
  code: DeckAuditIssueCode;
  severity: "error" | "warning";
  deckId: string;
  slideId?: string;
  componentId?: string;
  message: string;
  remediation: string;
  propertyPath?: string;
};

export type DeckAuditReport = {
  deckId: string;
  title: string;
  summary: {
    passed: boolean;
    slideCount: number;
    errorCount: number;
    warningCount: number;
  };
  issues: DeckAuditIssue[];
};

const GENERIC_HEADINGS = new Set([
  "architecture",
  "biểu đồ",
  "chart",
  "data",
  "dữ liệu",
  "kết quả",
  "overview",
  "results",
  "tổng quan"
]);

const EVIDENCE_COMPONENTS = new Set<SlideComponent["type"]>(["chart", "table"]);

export function auditDeck(input: unknown): DeckAuditReport {
  const validation = validateDeck(input);
  if (!validation.ok) {
    const fallback = readDeckIdentity(input);
    const issues: DeckAuditIssue[] = validation.diagnostics.map((diagnostic) => ({
      code: "schema-invalid",
      severity: "error",
      deckId: diagnostic.documentId || fallback.deckId,
      ...(diagnostic.slideId ? { slideId: diagnostic.slideId } : {}),
      ...(diagnostic.componentId ? { componentId: diagnostic.componentId } : {}),
      message: diagnostic.message,
      remediation: diagnostic.remediation,
      ...(diagnostic.propertyPath ? { propertyPath: diagnostic.propertyPath } : {})
    }));
    return buildReport(fallback.deckId, fallback.title, 0, issues);
  }

  const deck = validation.deck;
  const issues: DeckAuditIssue[] = [];

  deck.slides.forEach((slide, slideIndex) => {
    auditSlide(deck, slide, slideIndex, issues);
  });

  return buildReport(deck.id, deck.title, deck.slides.length, issues);
}

export function auditDecks(inputs: readonly unknown[]): DeckAuditReport[] {
  return inputs.map((input) => auditDeck(input));
}

export function formatAuditReport(reports: readonly DeckAuditReport[]): string {
  const passed = reports.filter((report) => report.summary.passed).length;
  const errorCount = reports.reduce((sum, report) => sum + report.summary.errorCount, 0);
  const warningCount = reports.reduce((sum, report) => sum + report.summary.warningCount, 0);
  const lines = [
    "Deckory quality audit",
    `${reports.length} deck · ${passed} PASS · ${reports.length - passed} NEEDS REVIEW · ${errorCount} error · ${warningCount} warning`
  ];

  for (const report of reports) {
    lines.push(`\n${report.summary.passed ? "PASS" : "REVIEW"} ${report.title} (${report.summary.slideCount} slide)`);
    for (const issue of report.issues) {
      const location = [issue.slideId, issue.componentId].filter(Boolean).join(" / ");
      lines.push(`- ${issue.severity.toUpperCase()} ${issue.code}${location ? ` [${location}]` : ""}: ${issue.message}`);
      lines.push(`  ${issue.remediation}`);
    }
  }

  return lines.join("\n");
}

function auditSlide(deck: DeckDocument, slide: Slide, slideIndex: number, issues: DeckAuditIssue[]): void {
  if (!slide.notes?.trim()) {
    issues.push(issue(deck, slide, "missing-notes", "warning", "Slide chưa có ghi chú người thuyết trình.", "Bổ sung điểm cần nói, lưu ý bằng chứng và câu chuyển sang slide tiếp theo."));
  }

  const heading = slide.components.find((component) => component.type === "heading");
  if (heading?.type === "heading" && GENERIC_HEADINGS.has(normalizeHeading(heading.props.title))) {
    issues.push(issue(deck, slide, "generic-heading", "warning", "Heading chỉ nêu chủ đề, chưa nói điều khán giả cần hiểu.", "Viết heading thành một kết luận hoặc quyết định có thể đọc độc lập.", heading.id));
  }

  const needsEvidence = slide.components.some((component) => EVIDENCE_COMPONENTS.has(component.type));
  const hasEvidence = slide.components.some((component) => component.type === "evidence-footer");
  if (needsEvidence && !hasEvidence) {
    issues.push(issue(deck, slide, "missing-evidence", "warning", "Slide dữ liệu chưa ghi nguồn hoặc trạng thái minh hoạ.", "Thêm evidence-footer với nguồn, phạm vi dữ liệu hoặc nhãn fixture minh hoạ."));
  }

  if (slide.components.length > 6) {
    issues.push(issue(deck, slide, "dense-slide", "warning", `Slide có ${slide.components.length} thành phần và có nguy cơ quá tải thị giác.`, "Tách thành nhiều nhịp kể, bỏ chi tiết phụ hoặc chuyển phần giải thích sang speaker notes."));
  }

  for (const component of slide.components) {
    if (component.type !== "chart") continue;
    const highlighted = component.props.values.filter((value) => value.highlight).length;
    if (highlighted > 1) {
      issues.push(issue(deck, slide, "chart-highlight-overuse", "warning", `Biểu đồ đang nhấn mạnh ${highlighted} điểm dữ liệu.`, "Giữ một điểm nhấn mang kết luận chính; dùng màu trung tính cho các điểm còn lại.", component.id));
    }
  }

  if (slideIndex >= 2) {
    const previous = deck.slides[slideIndex - 1];
    const beforePrevious = deck.slides[slideIndex - 2];
    if (previous?.layout === slide.layout && beforePrevious?.layout === slide.layout) {
      issues.push(issue(deck, slide, "repeated-layout", "warning", `Ba slide liên tiếp cùng dùng bố cục ${slide.layout}.`, "Đổi nhịp bằng statement, comparison, process hoặc một bố cục phù hợp hơn với nhiệm vụ slide."));
    }
  }
}

function issue(
  deck: DeckDocument,
  slide: Slide,
  code: DeckAuditIssueCode,
  severity: DeckAuditIssue["severity"],
  message: string,
  remediation: string,
  componentId?: string
): DeckAuditIssue {
  return {
    code,
    severity,
    deckId: deck.id,
    slideId: slide.id,
    ...(componentId ? { componentId } : {}),
    message,
    remediation
  };
}

function buildReport(deckId: string, title: string, slideCount: number, issues: DeckAuditIssue[]): DeckAuditReport {
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  return {
    deckId,
    title,
    summary: {
      passed: issues.length === 0,
      slideCount,
      errorCount,
      warningCount
    },
    issues
  };
}

function normalizeHeading(value: string): string {
  return value.trim().toLocaleLowerCase("vi-VN").replace(/[.:!?]+$/g, "");
}

function readDeckIdentity(input: unknown): { deckId: string; title: string } {
  if (typeof input !== "object" || input === null) return { deckId: "unknown-deck", title: "Unknown deck" };
  const record = input as { id?: unknown; title?: unknown };
  return {
    deckId: typeof record.id === "string" ? record.id : "unknown-deck",
    title: typeof record.title === "string" ? record.title : "Unknown deck"
  };
}
