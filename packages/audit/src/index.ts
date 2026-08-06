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
  | "repeated-layout"
  | "repeated-composition"
  | "dominant-layout"
  | "flat-density"
  | "motion-overload"
  | "long-heading";

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

export type DeckQualityDimensionId =
  | "storytelling"
  | "ui"
  | "ux"
  | "visual-design"
  | "motion-design"
  | "typography"
  | "layout"
  | "charts"
  | "copywriting"
  | "accessibility"
  | "interaction"
  | "branding"
  | "evidence"
  | "demo-readiness"
  | "production-quality";

export type DeckQualityConfidence = "structural" | "runtime-required" | "manual-review-required";

export type DeckQualityCheck = {
  id: string;
  label: string;
  passed: boolean;
  deduction: number;
  detail: string;
  remediation: string;
};

export type DeckQualityDimension = {
  id: DeckQualityDimensionId;
  label: string;
  score: number;
  confidence: DeckQualityConfidence;
  checks: DeckQualityCheck[];
};

export type DeckQualityScorecard = {
  overallScore: number;
  readiness: "draft" | "review" | "demo-ready" | "production-ready";
  dimensions: DeckQualityDimension[];
};

export type DeckQualityVerification = {
  browserUi?: boolean;
  keyboardAndZoom?: boolean;
  visualReview?: boolean;
  accessibility?: boolean;
  interaction?: boolean;
  productionGates?: boolean;
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
  scorecard: DeckQualityScorecard;
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
const QUALITY_DIMENSION_ORDER: readonly { id: DeckQualityDimensionId; label: string; confidence: DeckQualityConfidence }[] = [
  { id: "storytelling", label: "Storytelling", confidence: "structural" },
  { id: "ui", label: "UI", confidence: "runtime-required" },
  { id: "ux", label: "UX", confidence: "runtime-required" },
  { id: "visual-design", label: "Visual Design", confidence: "manual-review-required" },
  { id: "motion-design", label: "Motion Design", confidence: "structural" },
  { id: "typography", label: "Typography", confidence: "structural" },
  { id: "layout", label: "Layout", confidence: "structural" },
  { id: "charts", label: "Charts", confidence: "structural" },
  { id: "copywriting", label: "Copywriting", confidence: "structural" },
  { id: "accessibility", label: "Accessibility", confidence: "runtime-required" },
  { id: "interaction", label: "Interaction", confidence: "runtime-required" },
  { id: "branding", label: "Branding", confidence: "structural" },
  { id: "evidence", label: "Evidence", confidence: "structural" },
  { id: "demo-readiness", label: "Demo Readiness", confidence: "structural" },
  { id: "production-quality", label: "Production Quality", confidence: "runtime-required" }
] as const;

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
    return buildReport(fallback.deckId, fallback.title, 0, issues, invalidScorecard());
  }

  const deck = validation.deck;
  const issues: DeckAuditIssue[] = [];

  deck.slides.forEach((slide, slideIndex) => {
    auditSlide(deck, slide, slideIndex, issues);
  });
  auditDeckRhythm(deck, issues);

  return buildReport(deck.id, deck.title, deck.slides.length, issues, scoreDeckQuality(deck));
}

export function auditDecks(inputs: readonly unknown[]): DeckAuditReport[] {
  return inputs.map((input) => auditDeck(input));
}

export function scoreDeckQuality(
  deck: DeckDocument,
  verification: DeckQualityVerification = {}
): DeckQualityScorecard {
  const slides = deck.slides;
  const headings = slides.map(getHeading).filter((heading): heading is string => Boolean(heading));
  const genericHeadingCount = headings.filter((heading) => GENERIC_HEADINGS.has(normalizeHeading(heading))).length;
  const longHeadingCount = headings.filter((heading) => heading.length > 110).length;
  const notesCoverage = ratio(slides.filter((slide) => Boolean(slide.notes?.trim())).length, slides.length);
  const dataSlides = slides.filter((slide) => slide.components.some((component) => EVIDENCE_COMPONENTS.has(component.type)));
  const evidenceCoverage = ratio(dataSlides.filter(hasEvidenceFooter).length, dataSlides.length);
  const uniqueLayouts = new Set(slides.map((slide) => slide.layout)).size;
  const uniqueCompositions = new Set(slides.map(compositionSignature)).size;
  const layoutVariety = ratio(uniqueLayouts, Math.min(slides.length, 6));
  const compositionVariety = ratio(uniqueCompositions, Math.min(slides.length, 8));
  const repeatedCompositionCount = countRepeatedTriplets(slides.map(compositionSignature));
  const densityBuckets = slides.map(densityBucket);
  const flatDensityRuns = countFlatDensityRuns(slides);
  const animatedSlides = slides.filter(hasAuthoredMotion);
  const motionOverloadCount = slides.filter(isMotionOverloaded).length;
  const chartComponents = slides.flatMap((slide) => slide.components.filter((component): component is Extract<SlideComponent, { type: "chart" }> => component.type === "chart"));
  const sourcedCharts = chartComponents.filter((chart) => slides.some((slide) => slide.components.includes(chart) && hasEvidenceFooter(slide))).length;
  const placeholderCount = slides.flatMap((slide) => slide.components).filter(hasPlaceholderCopy).length;
  const interactiveCount = slides.flatMap((slide) => slide.components).filter((component) => ["visualizer", "team-showcase", "weight-simulator"].includes(component.type)).length;
  const masterCoverage = ratio(slides.filter((slide) => Boolean(slide.masterId)).length, slides.length);
  const hasOpening = ["cover", "statement"].includes(slides[0]?.layout ?? "");
  const hasClosing = ["closing", "statement"].includes(slides.at(-1)?.layout ?? "");
  const themeDefined = Boolean(deck.themeId && deck.themeId.trim());

  const dimensionChecks = new Map<DeckQualityDimensionId, DeckQualityCheck[]>([
    ["storytelling", [
      check("opening", "Mở bài thiết lập stakes", hasOpening, 1.6, hasOpening ? "Deck mở bằng cover hoặc statement." : "Slide đầu chưa tạo stakes rõ.", "Dùng cover hoặc statement để nêu vấn đề, quyết định hoặc lời hứa."),
      check("closing", "Kết bài có resolution", hasClosing, 1.6, hasClosing ? "Deck kết bằng closing hoặc statement." : "Slide cuối chưa đóng câu chuyện.", "Kết bằng hành động, quyết định hoặc tổng hợp đáng nhớ."),
      check("notes", "Speaker notes đủ phủ", notesCoverage >= 0.85, 1.4, `${Math.round(notesCoverage * 100)}% slide có notes.`, "Bổ sung điểm nói, caveat và câu chuyển cho các slide quan trọng."),
      check("rhythm", "Mạch kể không lặp máy móc", repeatedCompositionCount === 0, 2.2, `${repeatedCompositionCount} cụm composition lặp ba lần liên tiếp.`, "Đổi composition family theo nhiệm vụ kể chuyện.")
    ]],
    ["ui", [runtimeCheck("browser-ui", "Kiểm tra UI trong trình duyệt", "Cần ảnh và kiểm tra runtime ở Hub, Studio, Preview và Presenter.", verification.browserUi === true)]],
    ["ux", [
      runtimeCheck("keyboard-zoom", "Keyboard, focus và 200% zoom", "Cần kiểm tra luồng chỉnh sửa và trình chiếu bằng bàn phím ở runtime.", verification.keyboardAndZoom === true),
      check("notes-ux", "Luồng thuyết trình có chỉ dẫn", notesCoverage >= 0.75, 1.2, `${Math.round(notesCoverage * 100)}% slide có notes.`, "Bổ sung notes để giảm tải khi demo.")
    ]],
    ["visual-design", [
      manualCheck("visual-review", "Review hình ảnh toàn deck", "Cần screenshot full-size và thumbnail để đánh giá balance, hierarchy và art direction.", verification.visualReview === true),
      check("composition-variety", "Đa dạng composition có kiểm soát", compositionVariety >= 0.55, 1.5, `${uniqueCompositions} composition signature trên ${slides.length} slide.`, "Dùng master khác khi nhiệm vụ slide thay đổi.")
    ]],
    ["motion-design", [
      check("motion-overload", "Không quá tải motion", motionOverloadCount === 0, 3.2, `${motionOverloadCount} slide có quá nhiều chuyển động độc lập.`, "Giữ một ý motion chính trên mỗi slide."),
      check("motion-coverage", "Motion có chọn lọc", slides.length < 3 || ratio(animatedSlides.length, slides.length) <= 0.8, 1.5, `${Math.round(ratio(animatedSlides.length, slides.length) * 100)}% slide có motion.`, "Giữ slide tĩnh hoặc quiet để tạo nhịp nghỉ."),
      check("reduced-motion-contract", "Schema dùng preset motion an toàn", true, 0, "Mọi transition/effect đã qua schema budget.", "Duy trì final-state rendering khi reduced motion.")
    ]],
    ["typography", [
      check("heading-length", "Heading nằm trong budget", longHeadingCount === 0, 2.2, `${longHeadingCount} heading vượt 110 ký tự.`, "Rút heading thành kết luận tối đa khoảng hai dòng."),
      check("heading-presence", "Mỗi slide có điểm đọc chính", headings.length >= Math.ceil(slides.length * 0.8), 1.3, `${headings.length}/${slides.length} slide có heading.`, "Bổ sung heading kết luận cho các slide thiếu điểm đọc chính.")
    ]],
    ["layout", [
      check("layout-variety", "Layout đủ đa dạng", slides.length < 4 || layoutVariety >= 0.5, 2, `${uniqueLayouts} layout trên ${slides.length} slide.`, "Luân phiên statement, comparison, process, architecture và data theo quan hệ nội dung."),
      check("composition-repeat", "Không lặp composition ba lần", repeatedCompositionCount === 0, 2.5, `${repeatedCompositionCount} cụm lặp.`, "Áp dụng slide master khác cùng layout hoặc đổi layout semantic."),
      check("density-rhythm", "Mật độ có nhịp", flatDensityRuns === 0, 1.8, `${flatDensityRuns} chuỗi bốn slide có mật độ phẳng.`, "Xen kẽ slide sparse, balanced và dense.")
    ]],
    ["charts", [
      check("chart-purpose", "Chart có tiêu đề và đơn vị", chartComponents.every((chart) => Boolean(chart.props.title && chart.props.unit)), 1.8, `${chartComponents.length} chart được kiểm tra.`, "Nêu câu hỏi, đơn vị và khoảng thời gian ngay trong chart."),
      check("chart-evidence", "Chart có evidence", chartComponents.length === 0 || sourcedCharts === chartComponents.length, 2.4, `${sourcedCharts}/${chartComponents.length} chart có evidence footer.`, "Bổ sung nguồn hoặc nhãn dữ liệu minh hoạ cho mọi chart.")
    ]],
    ["copywriting", [
      check("generic-headings", "Heading nói kết luận", genericHeadingCount === 0, 2.4, `${genericHeadingCount} heading chỉ nêu chủ đề.`, "Viết heading thành điều khán giả cần hiểu hoặc quyết định."),
      check("placeholder-copy", "Không có copy placeholder", placeholderCount === 0, 3, `${placeholderCount} component có dấu hiệu TODO/TBD/lorem/placeholder.`, "Thay toàn bộ copy scaffold bằng nội dung hoàn chỉnh.")
    ]],
    ["accessibility", [
      runtimeCheck("a11y-runtime", "Focus, contrast và reduced motion", "Cần kiểm tra trình duyệt, keyboard, contrast và prefers-reduced-motion.", verification.accessibility === true),
      check("semantic-data", "Visual dữ liệu có mô tả semantic", chartComponents.every((chart) => Boolean(chart.props.title && chart.props.unit)), 1.4, "Chart sử dụng title, unit và renderer aria summary.", "Giữ accessible summary tương đương visual.")
    ]],
    ["interaction", [
      runtimeCheck("interaction-runtime", "Tương tác chạy thật", "Cần kiểm tra selection, state persistence, presenter và keyboard ở runtime.", verification.interaction === true),
      check("interaction-purpose", "Tương tác không mang tính trang trí", interactiveCount === 0 || interactiveCount <= Math.max(1, Math.ceil(slides.length * 0.3)), 1.2, `${interactiveCount} component tương tác.`, "Chỉ dùng tương tác khi giúp giải thích hoặc demo một quyết định.")
    ]],
    ["branding", [
      check("theme", "Deck có theme identity", themeDefined, 2.5, themeDefined ? `Theme: ${deck.themeId}.` : "Thiếu themeId.", "Áp dụng visual style hoặc brand identity đã kiểm chứng."),
      check("master-consistency", "Master được sử dụng có hệ thống", slides.length < 3 || masterCoverage >= 0.5, 1.5, `${Math.round(masterCoverage * 100)}% slide có masterId.`, "Gán master để kiểm soát rhythm và tránh chỉnh tay rời rạc.")
    ]],
    ["evidence", [
      check("evidence-coverage", "Slide dữ liệu có nguồn", evidenceCoverage >= 0.95, 3, `${Math.round(evidenceCoverage * 100)}% slide dữ liệu có evidence footer.`, "Ghi nguồn, phạm vi hoặc trạng thái minh hoạ."),
      check("evidence-language", "Không giả mạo evidence", true, 0, "Audit chỉ kiểm tra sự hiện diện; tính đúng của nguồn vẫn cần người review.", "Đối chiếu nguồn với revision và môi trường thực tế.")
    ]],
    ["demo-readiness", [
      check("demo-notes", "Notes hỗ trợ demo", notesCoverage >= 0.85, 2, `${Math.round(notesCoverage * 100)}% slide có notes.`, "Bổ sung câu chuyển, điểm nói và contingency."),
      check("demo-story", "Có mở và kết rõ", hasOpening && hasClosing, 2.2, hasOpening && hasClosing ? "Mở và kết đã rõ." : "Thiếu opening hoặc closing.", "Hoàn thiện opening và resolution trước demo."),
      check("demo-evidence", "Bằng chứng đủ phủ", evidenceCoverage >= 0.9, 2, `${Math.round(evidenceCoverage * 100)}% slide dữ liệu có nguồn.`, "Không demo claim chưa có evidence phù hợp.")
    ]],
    ["production-quality", [
      runtimeCheck("production-gates", "Build, E2E, export và console", "Cần bằng chứng test, typecheck, lint, build, asset audit, export và E2E mới nhất.", verification.productionGates === true),
      check("document-contract", "DeckDocument hợp lệ", true, 0, "Deck đã vượt validateDeck.", "Duy trì typed schema và không bypass renderer."),
      check("master-coverage", "Slide master đủ phủ", slides.length < 3 || masterCoverage >= 0.7, 1.4, `${Math.round(masterCoverage * 100)}% slide có masterId.`, "Áp dụng master cho các slide còn chỉnh tay.")
    ]]
  ]);

  const dimensions = QUALITY_DIMENSION_ORDER.map(({ id, label, confidence }) => buildDimension(id, label, confidence, dimensionChecks.get(id) ?? []));
  const overallScore = roundOne(dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length);
  const readiness = overallScore >= 9.5 ? "production-ready" : overallScore >= 8 ? "demo-ready" : overallScore >= 6 ? "review" : "draft";
  return { overallScore, readiness, dimensions };
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
    lines.push(`Quality score ${report.scorecard.overallScore}/10 · ${report.scorecard.readiness}`);
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
  if (heading?.type === "heading") {
    if (GENERIC_HEADINGS.has(normalizeHeading(heading.props.title))) {
      issues.push(issue(deck, slide, "generic-heading", "warning", "Heading chỉ nêu chủ đề, chưa nói điều khán giả cần hiểu.", "Viết heading thành một kết luận hoặc quyết định có thể đọc độc lập.", heading.id));
    }
    if (heading.props.title.length > 110) {
      issues.push(issue(deck, slide, "long-heading", "warning", "Heading có nguy cơ vượt quá hai dòng trên canvas 16:9.", "Rút heading thành một kết luận ngắn hơn hoặc chuyển chi tiết sang description.", heading.id));
    }
  }

  const needsEvidence = slide.components.some((component) => EVIDENCE_COMPONENTS.has(component.type));
  if (needsEvidence && !hasEvidenceFooter(slide)) {
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

  if (isMotionOverloaded(slide)) {
    issues.push(issue(deck, slide, "motion-overload", "warning", "Slide có transition cùng nhiều element effect độc lập.", "Giữ một ý motion chính, gom reveal theo sequence hoặc bỏ effect trang trí."));
  }

  if (slideIndex >= 2) {
    const previous = deck.slides[slideIndex - 1];
    const beforePrevious = deck.slides[slideIndex - 2];
    if (previous?.layout === slide.layout && beforePrevious?.layout === slide.layout) {
      issues.push(issue(deck, slide, "repeated-layout", "warning", `Ba slide liên tiếp cùng dùng bố cục ${slide.layout}.`, "Đổi nhịp bằng statement, comparison, process hoặc một bố cục phù hợp hơn với nhiệm vụ slide."));
    }
    if (previous && beforePrevious && compositionSignature(previous) === compositionSignature(slide) && compositionSignature(beforePrevious) === compositionSignature(slide)) {
      issues.push(issue(deck, slide, "repeated-composition", "warning", "Ba slide liên tiếp lặp cùng composition family và component signature.", "Áp dụng master tương thích khác hoặc thay visual grammar theo nhiệm vụ kể chuyện."));
    }
  }

  if (slideIndex >= 4) {
    const recentSlides = deck.slides.slice(slideIndex - 4, slideIndex + 1);
    const recentDensity = recentSlides.map(densityBucket);
    const recentFamilies = recentSlides.map(compositionFamily);
    if (new Set(recentDensity).size === 1 && new Set(recentFamilies).size <= 2) {
      issues.push(issue(deck, slide, "flat-density", "warning", `Năm slide liên tiếp giữ mật độ ${recentDensity[0]} trong tối đa hai composition family.`, "Xen kẽ slide sparse, balanced và dense hoặc thay master để tạo nhịp trình bày."));
    }
  }
}

function auditDeckRhythm(deck: DeckDocument, issues: DeckAuditIssue[]): void {
  if (deck.slides.length < 5) return;
  const counts = new Map<Slide["layout"], number>();
  for (const slide of deck.slides) counts.set(slide.layout, (counts.get(slide.layout) ?? 0) + 1);
  const dominant = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  if (dominant && dominant[1] / deck.slides.length >= 0.7) {
    issues.push(issue(deck, deck.slides.at(-1)!, "dominant-layout", "warning", `${dominant[1]}/${deck.slides.length} slide dùng layout ${dominant[0]}.`, "Mở rộng visual rhythm bằng các layout semantic khác phù hợp với nội dung."));
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

function buildReport(deckId: string, title: string, slideCount: number, issues: DeckAuditIssue[], scorecard: DeckQualityScorecard): DeckAuditReport {
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  return {
    deckId,
    title,
    summary: { passed: issues.length === 0, slideCount, errorCount, warningCount },
    issues,
    scorecard
  };
}

function buildDimension(
  id: DeckQualityDimensionId,
  label: string,
  confidence: DeckQualityConfidence,
  checks: DeckQualityCheck[]
): DeckQualityDimension {
  const deduction = checks.filter((item) => !item.passed).reduce((sum, item) => sum + item.deduction, 0);
  return { id, label, confidence, score: roundOne(Math.max(0, 10 - deduction)), checks };
}

function check(id: string, label: string, passed: boolean, deduction: number, detail: string, remediation: string): DeckQualityCheck {
  return { id, label, passed, deduction, detail, remediation };
}

function runtimeCheck(id: string, label: string, detail: string, passed: boolean): DeckQualityCheck {
  return check(
    id,
    label,
    passed,
    2,
    passed ? "Đã có bằng chứng runtime được truyền vào scorecard." : detail,
    "Chạy browser QA và lưu evidence trước khi nâng điểm lên 10/10."
  );
}

function manualCheck(id: string, label: string, detail: string, passed: boolean): DeckQualityCheck {
  return check(
    id,
    label,
    passed,
    1.5,
    passed ? "Đã có bằng chứng visual review được truyền vào scorecard." : detail,
    "Review screenshot toàn deck ở full-size và thumbnail scale."
  );
}

function invalidScorecard(): DeckQualityScorecard {
  return {
    overallScore: 0,
    readiness: "draft",
    dimensions: QUALITY_DIMENSION_ORDER.map(({ id, label, confidence }) => ({
      id,
      label,
      confidence,
      score: 0,
      checks: [check("schema", "DeckDocument hợp lệ", false, 10, "Không thể chấm chất lượng khi schema chưa hợp lệ.", "Sửa toàn bộ schema diagnostic trước khi audit chất lượng.")]
    }))
  };
}

function getHeading(slide: Slide): string | undefined {
  const heading = slide.components.find((component) => component.type === "heading");
  return heading?.type === "heading" ? heading.props.title : undefined;
}

function hasEvidenceFooter(slide: Slide): boolean {
  return slide.components.some((component) => component.type === "evidence-footer");
}

function compositionSignature(slide: Slide): string {
  const family = slide.variant === "cinematic" ? "cinematic"
    : slide.variant === "gallery" ? "gallery"
      : slide.variant === "evidence" ? "evidence"
        : slide.variant === "asymmetric" ? "asymmetric"
          : slide.variant === "technical" ? "system"
            : "editorial";
  const primaryTypes = slide.components
    .map((component) => component.type)
    .filter((type) => !["heading", "evidence-footer"].includes(type))
    .sort()
    .join("+");
  return `${family}:${slide.layout}:${slide.background ?? "editorial"}:${primaryTypes}`;
}

function densityBucket(slide: Slide): "sparse" | "balanced" | "dense" {
  if (slide.variant === "cinematic" || slide.variant === "quiet") return "sparse";
  if (slide.variant === "technical" || slide.variant === "evidence") return "dense";

  const complexity = slide.components.reduce((sum, component) => sum + componentComplexity(component), 0);
  if (complexity <= 1.8) return "sparse";
  if (complexity >= 4.4) return "dense";
  return "balanced";
}

function componentComplexity(component: SlideComponent): number {
  switch (component.type) {
    case "heading": return 0.45;
    case "evidence-footer": return 0.1;
    case "statement": return 0.8;
    case "insight": return 0.9;
    case "team-showcase": return Math.min(5.2, 1.2 + component.props.members.length * 0.85);
    case "media-showcase": return Math.min(4, 1 + component.props.items.length * 1.15);
    case "metric-grid": return Math.min(4, component.props.metrics.length * 0.9);
    case "comparison": return Math.min(4.8, (component.props.left.points.length + component.props.right.points.length) * 0.55);
    case "process": return Math.min(4.8, component.props.steps.length * 0.72);
    case "architecture": return Math.min(5.2, component.props.layers.reduce((sum, layer) => sum + 0.35 + layer.items.length * 0.18, 0));
    case "chart": return Math.min(4.8, 1.3 + component.props.values.length * 0.34);
    case "table": return Math.min(5.5, 1 + component.props.columns.length * component.props.rows.length * 0.18);
    case "code": return Math.min(4.8, 1.2 + component.props.code.split("\n").length * 0.16);
    case "visualizer": return Math.min(4.8, 1 + component.props.items.length * 0.48);
    case "weight-simulator": return Math.min(5.2, 1.5 + component.props.dimensions.length * 0.5 + component.props.presets.length * 0.22);
    case "criterion-grid": return Math.min(5.2, component.props.items.length * 0.72);
    case "diagram": return Math.min(5, 1 + component.props.items.length * 0.62);
  }
}

function hasAuthoredMotion(slide: Slide): boolean {
  return Boolean(slide.transition && slide.transition.type !== "none")
    || slide.components.some((component) => Boolean(component.effect && component.effect.type !== "none") || component.sequence !== undefined);
}

function isMotionOverloaded(slide: Slide): boolean {
  const effects = slide.components
    .map((component) => component.effect?.type)
    .filter((effect): effect is NonNullable<SlideComponent["effect"]>["type"] => Boolean(effect && effect !== "none"));
  const sequencedComponents = slide.components.filter((component) => component.sequence !== undefined).length;
  const hasTransition = Boolean(slide.transition && slide.transition.type !== "none");
  return (hasTransition && effects.length >= 3)
    || new Set(effects).size >= 3
    || (effects.length >= 3 && sequencedComponents === 0);
}

function hasPlaceholderCopy(component: SlideComponent): boolean {
  const value = JSON.stringify(component.props).toLocaleLowerCase("vi-VN");
  return /\b(todo|tbd|lorem ipsum|placeholder|coming soon)\b/.test(value);
}

function countRepeatedTriplets(values: readonly string[]): number {
  let count = 0;
  for (let index = 2; index < values.length; index += 1) {
    if (values[index] === values[index - 1] && values[index] === values[index - 2]) count += 1;
  }
  return count;
}

function countFlatDensityRuns(slides: readonly Slide[]): number {
  let count = 0;
  for (let index = 4; index < slides.length; index += 1) {
    const recent = slides.slice(index - 4, index + 1);
    if (new Set(recent.map(densityBucket)).size === 1 && new Set(recent.map(compositionFamily)).size <= 2) count += 1;
  }
  return count;
}

function compositionFamily(slide: Slide): string {
  if (slide.variant === "cinematic") return "cinematic";
  if (slide.variant === "gallery") return "gallery";
  if (slide.variant === "evidence") return "evidence";
  if (slide.variant === "asymmetric") return "asymmetric";
  if (slide.variant === "technical") return "system";
  if (slide.variant === "quiet") return "quiet";
  return "editorial";
}

function ratio(numerator: number, denominator: number): number {
  return denominator <= 0 ? 1 : numerator / denominator;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
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

export * from "./runtime-evidence";
export * from "./v2";
export * from "./v2-scorecard";
