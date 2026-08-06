import {
  DeckDocumentV2Schema,
  type DeckDocumentV2,
  type SceneElement,
  type SceneSlide
} from "@deckory/schema/v2";
import {
  isEChartsVariant,
  layoutDiagram,
  validateEvidenceDomain
} from "@deckory/visuals";

export type DeckAuditIssueCodeV2 =
  | "v2-schema-invalid"
  | "missing-slide-purpose"
  | "missing-slide-conclusion"
  | "missing-slide-notes"
  | "missing-accessible-summary"
  | "visible-element-outside-canvas"
  | "chart-missing-evidence"
  | "chart-adapter-required"
  | "diagram-adapter-required"
  | "diagram-layout-failure"
  | "broken-evidence-lineage"
  | "evidence-source-missing"
  | "hidden-source-orphan"
  | "export-fallback-undisclosed"
  | "web-block-fallback-missing";

export type DeckAuditIssueV2 = {
  code: DeckAuditIssueCodeV2;
  severity: "error" | "warning";
  deckId: string;
  slideId?: string;
  elementId?: string;
  propertyPath?: string;
  message: string;
  remediation: string;
};

export type DeckQualityDimensionIdV2 =
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
  | "production-quality"
  | "customizability"
  | "visual-variety"
  | "editability"
  | "export-fidelity"
  | "performance";

export type DeckQualityConfidenceV2 =
  | "structural"
  | "runtime-required"
  | "manual-review-required";

export type DeckQualityCheckV2 = {
  id: string;
  label: string;
  passed: boolean;
  deduction: number;
  detail: string;
  remediation: string;
};

export type DeckQualityDimensionV2 = {
  id: DeckQualityDimensionIdV2;
  label: string;
  score: number;
  confidence: DeckQualityConfidenceV2;
  checks: DeckQualityCheckV2[];
};

export type DeckQualityScorecardV2 = {
  overallScore: number;
  readiness: "draft" | "review" | "demo-ready" | "production-ready";
  dimensions: DeckQualityDimensionV2[];
};

export type DeckQualityRuntimeEvidenceV2 = {
  revision: string;
  browserUi?: boolean;
  keyboardAndZoom?: boolean;
  visualReview?: boolean;
  accessibility?: boolean;
  interaction?: boolean;
  exportComparison?: boolean;
  performance?: boolean;
  productionGates?: boolean;
};

export type DeckAuditCapabilitiesV2 = {
  echartsSvg?: boolean;
  elk?: boolean;
};

export type DeckAuditOptionsV2 = {
  runtimeEvidence?: DeckQualityRuntimeEvidenceV2;
  capabilities?: DeckAuditCapabilitiesV2;
};

export type DeckAuditReportV2 = {
  schemaVersion: 2;
  deckId: string;
  title: string;
  summary: {
    passed: boolean;
    slideCount: number;
    errorCount: number;
    warningCount: number;
  };
  issues: DeckAuditIssueV2[];
  scorecard: DeckQualityScorecardV2;
};

const DIMENSIONS: readonly {
  id: DeckQualityDimensionIdV2;
  label: string;
  confidence: DeckQualityConfidenceV2;
}[] = [
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
  { id: "production-quality", label: "Production Quality", confidence: "runtime-required" },
  { id: "customizability", label: "Customizability", confidence: "structural" },
  { id: "visual-variety", label: "Visual Variety", confidence: "structural" },
  { id: "editability", label: "Editability", confidence: "structural" },
  { id: "export-fidelity", label: "Export Fidelity", confidence: "runtime-required" },
  { id: "performance", label: "Performance", confidence: "runtime-required" }
] as const;

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function check(
  id: string,
  label: string,
  passed: boolean,
  deduction: number,
  detail: string,
  remediation: string
): DeckQualityCheckV2 {
  return { id, label, passed, deduction: passed ? 0 : deduction, detail, remediation };
}

function runtimeCheck(
  id: string,
  label: string,
  verified: boolean,
  detail: string,
  remediation: string
): DeckQualityCheckV2 {
  return check(id, label, verified, verified ? 0 : 10, detail, remediation);
}

function dimension(
  definition: (typeof DIMENSIONS)[number],
  checks: DeckQualityCheckV2[]
): DeckQualityDimensionV2 {
  return {
    id: definition.id,
    label: definition.label,
    confidence: definition.confidence,
    score: roundOne(Math.max(0, 10 - checks.reduce((sum, item) => sum + item.deduction, 0))),
    checks
  };
}

function issue(
  deckId: string,
  code: DeckAuditIssueCodeV2,
  severity: DeckAuditIssueV2["severity"],
  message: string,
  remediation: string,
  location: {
    slideId?: string;
    elementId?: string;
    propertyPath?: string;
  } = {}
): DeckAuditIssueV2 {
  return {
    code,
    severity,
    deckId,
    ...(location.slideId ? { slideId: location.slideId } : {}),
    ...(location.elementId ? { elementId: location.elementId } : {}),
    ...(location.propertyPath ? { propertyPath: location.propertyPath } : {}),
    message,
    remediation
  };
}

function sourceIdsForElement(element: SceneElement): readonly string[] {
  if (element.kind === "chart") return element.content.chart.evidence.sourceIds;
  if (element.kind === "diagram") return element.content.diagram.evidence.sourceIds;
  return [];
}

function isVisibleOutsideCanvas(
  element: SceneElement,
  canvas: DeckDocumentV2["canvas"]
): boolean {
  if (element.hidden) return false;
  const { x, y, width, height } = element.frame;
  return x < 0 || y < 0 || x + width > canvas.width || y + height > canvas.height;
}

function hasAccessibleSummary(element: SceneElement): boolean {
  if (element.accessibility.decorative) return true;
  if (element.accessibility.label?.trim() || element.accessibility.description?.trim()) return true;
  if (element.kind === "chart") return Boolean(element.content.chart.accessibleSummary.trim());
  if (element.kind === "diagram") return Boolean(element.content.diagram.accessibleSummary.trim());
  return false;
}

function webBlockHasFallback(element: Extract<SceneElement, { kind: "web-block" }>): boolean {
  const fallback = element.content.manifest.staticFallback;
  return Boolean(
    fallback &&
    typeof fallback === "object" &&
    (fallback as Record<string, unknown>).assetId &&
    ["png", "svg"].includes(String((fallback as Record<string, unknown>).type))
  );
}

function usesHiddenSource(deck: DeckDocumentV2, sourceId: string): boolean {
  return deck.slides.some((slide) => slide.elements.some((element) =>
    element.semantic?.sourceElementIds?.includes(sourceId)));
}

function auditSlideV2(
  deck: DeckDocumentV2,
  slide: SceneSlide,
  issues: DeckAuditIssueV2[],
  capabilities: DeckAuditCapabilitiesV2
): void {
  if (!slide.purpose?.trim()) {
    issues.push(issue(deck.id, "missing-slide-purpose", "warning", "Slide chưa khai báo communication purpose.", "Thêm purpose mô tả nhiệm vụ của slide để recommendation, audit và template selection có ngữ cảnh.", { slideId: slide.id }));
  }
  if (!slide.conclusion?.trim()) {
    issues.push(issue(deck.id, "missing-slide-conclusion", "warning", "Slide chưa có conclusion có thể đọc độc lập.", "Ghi conclusion ngắn, có thể kiểm chứng và phù hợp với heading.", { slideId: slide.id }));
  }
  if (!slide.notes?.trim()) {
    issues.push(issue(deck.id, "missing-slide-notes", "warning", "Slide chưa có speaker notes.", "Bổ sung điểm nói, caveat, nguồn và câu chuyển sang slide tiếp theo.", { slideId: slide.id }));
  }

  const sourceIds = new Set(deck.visualIntelligence?.evidence?.sources.map((source) => source.id) ?? []);
  for (const element of slide.elements) {
    const location = { slideId: slide.id, elementId: element.id };
    if (!hasAccessibleSummary(element)) {
      issues.push(issue(deck.id, "missing-accessible-summary", "error", "Thành phần không có accessible label hoặc summary tương đương visual.", "Bổ sung accessibility.label/description hoặc summary typed của chart/diagram.", location));
    }
    if (isVisibleOutsideCanvas(element, deck.canvas)) {
      issues.push(issue(deck.id, "visible-element-outside-canvas", "warning", "Thành phần hiển thị nằm ngoài canvas 1280 × 720.", "Đưa frame vào canvas, tăng container hoặc tách slide; không dựa vào overflow clipping.", location));
    }

    const elementSourceIds = sourceIdsForElement(element);
    for (const sourceId of elementSourceIds) {
      if (!sourceIds.has(sourceId)) {
        issues.push(issue(deck.id, "evidence-source-missing", "error", `Visual tham chiếu source không tồn tại: ${sourceId}.`, "Khôi phục source trong evidence domain hoặc sửa sourceIds của visual.", location));
      }
    }

    if (element.kind === "chart") {
      const spec = element.content.chart;
      if (spec.evidence.status !== "illustrative" && spec.evidence.sourceIds.length === 0) {
        issues.push(issue(deck.id, "chart-missing-evidence", "error", "Chart được trình bày như dữ liệu thật nhưng không có sourceId.", "Liên kết chart với source/dataset hoặc đổi evidence status thành illustrative cùng nhãn hiển thị.", location));
      }
      if (isEChartsVariant(spec.variant) && !capabilities.echartsSvg) {
        issues.push(issue(deck.id, "chart-adapter-required", "warning", `Chart ${spec.variant} cần ECharts SVG adapter nhưng capability chưa được xác nhận.`, "Tích hợp adapter đã review hoặc đổi sang chart native phù hợp; không xuất fallback như native-editable.", location));
      }
    }

    if (element.kind === "diagram") {
      const spec = element.content.diagram;
      const isElk = spec.layout === "elk-layered" || spec.layout === "elk-force";
      if (isElk && !spec.generatedLayout && !capabilities.elk) {
        issues.push(issue(deck.id, "diagram-adapter-required", "warning", `Diagram ${spec.layout} chưa có generated layout hoặc ELK capability.`, "Chạy ELK adapter trong worker và lưu generatedLayout, hoặc chọn deterministic native layout.", location));
      }
      if (!isElk && !spec.generatedLayout) {
        const result = layoutDiagram(spec, {
          x: 0,
          y: 0,
          width: element.frame.width,
          height: element.frame.height
        });
        if (!result.ok) {
          issues.push(issue(deck.id, "diagram-layout-failure", "warning", result.diagnostics.map((diagnostic) => diagnostic.message).join("; "), "Tăng bounds, rút nhãn có kiểm soát, giảm node hoặc tách diagram; không clip node.", location));
        }
      }
    }

    if (element.kind === "web-block") {
      if (!webBlockHasFallback(element)) {
        issues.push(issue(deck.id, "web-block-fallback-missing", "error", "Web Block thiếu static fallback bắt buộc.", "Khai báo SVG/PNG fallback cục bộ để thumbnail, export và failure state luôn có nội dung.", location));
      }
      if (!element.exportPolicy) {
        issues.push(issue(deck.id, "export-fallback-undisclosed", "warning", "Web Block chưa công bố capability/fallback theo định dạng xuất.", "Thêm exportPolicy và hiển thị capability report trước export.", location));
      }
    }

    if (
      element.hidden &&
      element.semantic?.purpose === "visual-source-text" &&
      !usesHiddenSource(deck, element.id)
    ) {
      issues.push(issue(deck.id, "hidden-source-orphan", "warning", "Source text đang bị ẩn nhưng không có visual nào khai báo sourceElementIds trỏ về nó.", "Liên kết visual tới source text hoặc bỏ hidden để tránh mất ngữ cảnh và claim gốc.", location));
    }
  }
}

function structuralChecks(
  deck: DeckDocumentV2,
  issues: readonly DeckAuditIssueV2[]
): Map<DeckQualityDimensionIdV2, DeckQualityCheckV2[]> {
  const slides = deck.slides;
  const elements = slides.flatMap((slide) => slide.elements);
  const charts = elements.filter((element) => element.kind === "chart");
  const diagrams = elements.filter((element) => element.kind === "diagram");
  const webBlocks = elements.filter((element) => element.kind === "web-block");
  const nativeElements = elements.filter((element) => element.kind !== "web-block");
  const styledElements = elements.filter((element) => element.style && Object.keys(element.style).length > 0);
  const layoutContainers = elements.filter((element) => ["group", "stack", "grid"].includes(element.kind));
  const kinds = new Set(elements.map((element) => element.kind));
  const backgroundKinds = new Set(slides.flatMap((slide) => slide.background.layers.map((layer) => layer.type)));
  const motionTracks = elements.reduce((sum, element) => sum + (element.motion?.length ?? 0), 0);
  const notesCoverage = slides.filter((slide) => Boolean(slide.notes?.trim())).length / Math.max(1, slides.length);
  const purposeCoverage = slides.filter((slide) => Boolean(slide.purpose?.trim())).length / Math.max(1, slides.length);
  const conclusionCoverage = slides.filter((slide) => Boolean(slide.conclusion?.trim())).length / Math.max(1, slides.length);
  const accessibleCoverage = elements.filter(hasAccessibleSummary).length / Math.max(1, elements.length);
  const evidenceIssueCount = issues.filter((item) => ["chart-missing-evidence", "broken-evidence-lineage", "evidence-source-missing"].includes(item.code)).length;
  const adapterIssueCount = issues.filter((item) => ["chart-adapter-required", "diagram-adapter-required"].includes(item.code)).length;
  const layoutIssueCount = issues.filter((item) => ["visible-element-outside-canvas", "diagram-layout-failure"].includes(item.code)).length;
  const orphanCount = issues.filter((item) => item.code === "hidden-source-orphan").length;
  const exportIssueCount = issues.filter((item) => ["export-fallback-undisclosed", "web-block-fallback-missing"].includes(item.code)).length;
  const narrative = deck.visualIntelligence?.narrative;

  return new Map<DeckQualityDimensionIdV2, DeckQualityCheckV2[]>([
    ["storytelling", [
      check("thesis", "Deck thesis rõ", Boolean(narrative?.thesis.trim()), 3, narrative?.thesis ?? "Thiếu thesis.", "Khai báo thesis và audience outcome trước khi tối ưu từng slide."),
      check("purpose-coverage", "Slide purpose đủ phủ", purposeCoverage >= 0.95, 2, `${Math.round(purposeCoverage * 100)}% slide có purpose.`, "Bổ sung purpose cho mọi slide sản xuất."),
      check("conclusion-coverage", "Conclusion đủ phủ", conclusionCoverage >= 0.95, 2, `${Math.round(conclusionCoverage * 100)}% slide có conclusion.`, "Mỗi slide cần một kết luận hoặc quyết định có thể đọc độc lập.")
    ]],
    ["motion-design", [
      check("motion-bounded", "Motion dùng typed tracks", true, 0, `${motionTracks} motion track được lưu trong typed contract.`, "Duy trì final state và reduced-motion equivalence."),
      check("motion-density", "Motion có chọn lọc", motionTracks <= Math.max(1, elements.length), 2, `${motionTracks} track trên ${elements.length} element.`, "Giữ một ý motion chính trên mỗi slide.")
    ]],
    ["typography", [
      check("text-summary", "Text và rich text có accessible summary", accessibleCoverage >= 0.95, 2, `${Math.round(accessibleCoverage * 100)}% element có summary.`, "Bổ sung label, reading order và overflow diagnostics.")
    ]],
    ["layout", [
      check("layout-fit", "Không có overflow/layout failure", layoutIssueCount === 0, 4, `${layoutIssueCount} layout issue.`, "Sửa frame, bounds hoặc tách visual thay vì clipping."),
      check("layout-model", "Scene có explicit frames", elements.every((element) => element.frame.width > 0 && element.frame.height > 0), 2, "Mọi element có frame dương.", "Giữ geometry finite và explicit.")
    ]],
    ["charts", [
      check("typed-charts", "Chart dùng ChartSpec", charts.every((element) => element.kind === "chart" && Boolean(element.content.chart.question)), 2, `${charts.length} chart typed.`, "Không lưu raw ECharts option trong document."),
      check("chart-adapters", "Chart adapter sẵn sàng", adapterIssueCount === 0, 4, `${adapterIssueCount} adapter issue.`, "Tích hợp adapter hoặc dùng native chart.")
    ]],
    ["copywriting", [
      check("conclusion-copy", "Conclusion không để trống", conclusionCoverage >= 0.95, 3, `${Math.round(conclusionCoverage * 100)}% slide có conclusion.`, "Viết conclusion thành claim hoặc quyết định rõ.")
    ]],
    ["branding", [
      check("theme", "Deck có theme typed", Boolean(deck.theme.id.trim()), 3, `Theme ${deck.theme.id}.`, "Dùng visual world có token rõ thay vì style rời rạc."),
      check("background-system", "Background dùng typed layers", backgroundKinds.size > 0, 1, `${backgroundKinds.size} background layer type.`, "Khai báo background trong document thay vì CSS ngoài contract.")
    ]],
    ["evidence", [
      check("lineage", "Evidence lineage hợp lệ", evidenceIssueCount === 0, 5, `${evidenceIssueCount} evidence issue.`, "Sửa source, claim, evidence, dataset và visual binding trước release."),
      check("visual-evidence", "Visual dữ liệu có evidence", [...charts, ...diagrams].every((element) => sourceIdsForElement(element).length > 0 || (element.kind === "chart" ? element.content.chart.evidence.status : element.content.diagram.evidence.status) === "illustrative"), 3, `${charts.length + diagrams.length} data visual được kiểm tra.`, "Gắn sourceIds hoặc nhãn illustrative hiển thị.")
    ]],
    ["demo-readiness", [
      check("notes", "Speaker notes đủ phủ", notesCoverage >= 0.95, 3, `${Math.round(notesCoverage * 100)}% slide có notes.`, "Bổ sung notes, caveat và câu chuyển."),
      check("blocking-issues", "Không có structural error", !issues.some((item) => item.severity === "error"), 5, `${issues.filter((item) => item.severity === "error").length} error.`, "Xử lý mọi error trước demo.")
    ]],
    ["customizability", [
      check("explicit-geometry", "Element có geometry chỉnh được", elements.every((element) => Number.isFinite(element.frame.x) && Number.isFinite(element.frame.y)), 3, `${elements.length} element có frame.`, "Không lưu untyped coordinate ngoài SceneDocument."),
      check("layout-modes", "Có hỗ trợ layout container", layoutContainers.length > 0 || slides.length <= 1, 1, `${layoutContainers.length} layout container.`, "Dùng group/stack/grid khi quan hệ bố cục cần chỉnh trực tiếp."),
      check("style-overrides", "Style override có kiểm soát", styledElements.length > 0 || elements.length === 0, 1, `${styledElements.length} styled element.`, "Dùng theme token hoặc bounded element style.")
    ]],
    ["visual-variety", [
      check("element-variety", "Visual vocabulary đa dạng", kinds.size >= Math.min(3, elements.length), 2, `${kinds.size} element kind.`, "Chọn visual theo relationship, không lặp một composition."),
      check("background-variety", "Background có hệ thống", backgroundKinds.size >= 1, 1, `${backgroundKinds.size} background kind.`, "Dùng background layer có mục đích và contrast rõ.")
    ]],
    ["editability", [
      check("native-ratio", "Phần lớn nội dung là native scene", nativeElements.length / Math.max(1, elements.length) >= 0.8, 3, `${nativeElements.length}/${elements.length} element native.`, "Ưu tiên native scene hoặc registered component trước Web Block."),
      check("source-preservation", "Không có hidden source orphan", orphanCount === 0, 3, `${orphanCount} orphan source.`, "Liên kết sourceElementIds hoặc khôi phục source text hiển thị.")
    ]],
    ["export-fidelity", [
      check("export-disclosure", "Fallback được công bố", exportIssueCount === 0, 4, `${exportIssueCount} export disclosure issue.`, "Khai báo exportPolicy và static fallback cho custom content."),
      check("web-block-fallback", "Web Block có fallback", webBlocks.every(webBlockHasFallback), 3, `${webBlocks.length} Web Block được kiểm tra.`, "Bổ sung PNG/SVG fallback cục bộ.")
    ]]
  ]);
}

function runtimeDimensionChecks(
  evidence: DeckQualityRuntimeEvidenceV2 | undefined
): Map<DeckQualityDimensionIdV2, DeckQualityCheckV2[]> {
  return new Map<DeckQualityDimensionIdV2, DeckQualityCheckV2[]>([
    ["ui", [runtimeCheck("browser-ui", "UI đã kiểm tra trong trình duyệt", evidence?.browserUi === true, "Cần screenshot và DOM evidence trên đúng revision.", "Chạy Hub/Studio/Preview/Presenter ở các viewport yêu cầu.")]],
    ["ux", [runtimeCheck("keyboard-zoom", "Keyboard và 200% zoom", evidence?.keyboardAndZoom === true, "Cần runtime keyboard/focus/zoom evidence.", "Chạy E2E keyboard và kiểm tra 200% zoom.")]],
    ["visual-design", [runtimeCheck("visual-review", "Manual visual review", evidence?.visualReview === true, "Cần người review ảnh full-size và thumbnail.", "Kiểm tra balance, hierarchy, crops, typography và repetition.")]],
    ["accessibility", [runtimeCheck("a11y-runtime", "Accessibility runtime", evidence?.accessibility === true, "Cần focus, contrast, reading order và reduced motion evidence.", "Chạy accessibility và keyboard review trên đúng revision.")]],
    ["interaction", [runtimeCheck("interaction-runtime", "Interaction runtime", evidence?.interaction === true, "Cần drag, undo, direct edit, presenter và state persistence evidence.", "Chạy E2E interaction V2.")]],
    ["production-quality", [runtimeCheck("production-gates", "Production gates", evidence?.productionGates === true, "Cần test, typecheck, lint, audit, assets, build và E2E trên cùng revision.", "Chạy quality gate đầy đủ và ghi revision.")]],
    ["export-fidelity", [runtimeCheck("export-comparison", "Export đã so với Preview", evidence?.exportComparison === true, "Cần screenshot/PDF/PNG comparison trên cùng revision.", "So sánh representative slides giữa Preview và export.")]],
    ["performance", [runtimeCheck("performance-budget", "Performance budget", evidence?.performance === true, "Cần metric selection, drag FPS, undo, slide switch và bundle boundary.", "Chạy performance-v2 E2E và lưu evidence revision.")]]
  ]);
}

export function scoreDeckQualityV2(
  deck: DeckDocumentV2,
  runtimeEvidence?: DeckQualityRuntimeEvidenceV2,
  issues: readonly DeckAuditIssueV2[] = []
): DeckQualityScorecardV2 {
  const structural = structuralChecks(deck, issues);
  const runtime = runtimeDimensionChecks(runtimeEvidence);
  const dimensions = DIMENSIONS.map((definition) => {
    const checks = [
      ...(structural.get(definition.id) ?? []),
      ...(runtime.get(definition.id) ?? [])
    ];
    return dimension(definition, checks.length > 0 ? checks : [
      check(`${definition.id}-contract`, `${definition.label} contract`, true, 0, "Không có deduction structural cho dimension này.", "Duy trì typed document và runtime evidence phù hợp.")
    ]);
  });
  const overallScore = roundOne(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length);
  const structuralErrors = issues.filter((item) => item.severity === "error").length;
  const runtimeComplete = Boolean(
    runtimeEvidence?.revision &&
    runtimeEvidence.browserUi &&
    runtimeEvidence.keyboardAndZoom &&
    runtimeEvidence.visualReview &&
    runtimeEvidence.accessibility &&
    runtimeEvidence.interaction &&
    runtimeEvidence.exportComparison &&
    runtimeEvidence.performance &&
    runtimeEvidence.productionGates
  );
  const readiness = structuralErrors > 0 || overallScore < 6
    ? "draft"
    : runtimeComplete && overallScore >= 9.5
      ? "production-ready"
      : overallScore >= 8
        ? "demo-ready"
        : "review";
  return { overallScore, readiness, dimensions };
}

function invalidScorecardV2(): DeckQualityScorecardV2 {
  const dimensions = DIMENSIONS.map((definition) => dimension(definition, [
    check("schema", "DeckDocumentV2 hợp lệ", false, 10, "Schema invalid nên chưa thể audit dimension này.", "Sửa schema diagnostics trước khi chấm chất lượng.")
  ]));
  return { overallScore: 0, readiness: "draft", dimensions };
}

export function auditDeckV2(
  input: unknown,
  options: DeckAuditOptionsV2 = {}
): DeckAuditReportV2 {
  const parsed = DeckDocumentV2Schema.safeParse(input);
  if (!parsed.success) {
    const identity = typeof input === "object" && input !== null
      ? input as { id?: unknown; title?: unknown }
      : {};
    const deckId = typeof identity.id === "string" ? identity.id : "unknown-v2-deck";
    const title = typeof identity.title === "string" ? identity.title : "Unknown V2 deck";
    const issues: DeckAuditIssueV2[] = parsed.error.issues.map((schemaIssue) => issue(
      deckId,
      "v2-schema-invalid",
      "error",
      schemaIssue.message,
      "Sửa DeckDocumentV2 theo property path trước khi chạy audit lại.",
      { propertyPath: schemaIssue.path.join(".") }
    ));
    return {
      schemaVersion: 2,
      deckId,
      title,
      summary: {
        passed: false,
        slideCount: 0,
        errorCount: issues.length,
        warningCount: 0
      },
      issues,
      scorecard: invalidScorecardV2()
    };
  }

  const deck = parsed.data;
  const issues: DeckAuditIssueV2[] = [];
  const evidence = deck.visualIntelligence?.evidence;
  if (evidence) {
    const validation = validateEvidenceDomain(evidence);
    for (const diagnostic of validation.diagnostics) {
      issues.push(issue(
        deck.id,
        "broken-evidence-lineage",
        diagnostic.severity,
        diagnostic.message,
        diagnostic.recommendation,
        { propertyPath: `visualIntelligence.evidence.${diagnostic.recordId}` }
      ));
    }
  }

  for (const slide of deck.slides) {
    auditSlideV2(deck, slide, issues, options.capabilities ?? {});
  }

  const scorecard = scoreDeckQualityV2(deck, options.runtimeEvidence, issues);
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  return {
    schemaVersion: 2,
    deckId: deck.id,
    title: deck.title,
    summary: {
      passed: issues.length === 0,
      slideCount: deck.slides.length,
      errorCount,
      warningCount
    },
    issues,
    scorecard
  };
}

export function auditDecksV2(
  inputs: readonly unknown[],
  options: DeckAuditOptionsV2 = {}
): DeckAuditReportV2[] {
  return inputs.map((input) => auditDeckV2(input, options));
}

export function formatAuditReportV2(reports: readonly DeckAuditReportV2[]): string {
  const passed = reports.filter((report) => report.summary.passed).length;
  const errors = reports.reduce((sum, report) => sum + report.summary.errorCount, 0);
  const warnings = reports.reduce((sum, report) => sum + report.summary.warningCount, 0);
  const lines = [
    "Deckory V2 quality audit",
    `${reports.length} deck · ${passed} PASS · ${reports.length - passed} NEEDS REVIEW · ${errors} error · ${warnings} warning`
  ];
  for (const report of reports) {
    lines.push(`\n${report.summary.passed ? "PASS" : "REVIEW"} ${report.title} (${report.summary.slideCount} slide)`);
    lines.push(`Quality score ${report.scorecard.overallScore}/10 · ${report.scorecard.readiness}`);
    for (const item of report.issues) {
      const location = [item.slideId, item.elementId].filter(Boolean).join(" / ");
      lines.push(`- ${item.severity.toUpperCase()} ${item.code}${location ? ` [${location}]` : ""}: ${item.message}`);
      lines.push(`  ${item.remediation}`);
    }
  }
  return lines.join("\n");
}
