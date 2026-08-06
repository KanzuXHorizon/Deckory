import {
  buildNarrativeIndex,
  type DeckNarrative,
  type NarrativeSectionRole,
  type NarrativeSlide
} from "./narrative-model";

export type NarrativeDiagnosticCode =
  | "weak-thesis"
  | "solution-before-evidence"
  | "context-without-tension"
  | "evidence-without-interpretation"
  | "abrupt-transition"
  | "duplicate-slide"
  | "weak-conclusion-heading"
  | "weak-closing"
  | "appendix-leakage"
  | "unassigned-slide"
  | "missing-slide";

export type NarrativeDiagnostic = {
  code: NarrativeDiagnosticCode;
  severity: "info" | "warning" | "error";
  message: string;
  recommendation: string;
  slideId?: string;
  sectionId?: string;
};

export type NarrativeAuditInput = {
  narrative: DeckNarrative;
  slides: readonly NarrativeSlide[];
};

export type NarrativeAuditResult = {
  diagnostics: NarrativeDiagnostic[];
  orderedSlideIds: string[];
  mainSlideIds: string[];
  appendixSlideIds: string[];
};

const ROLE_ORDER: Record<NarrativeSectionRole, number> = {
  opening: 0,
  context: 1,
  tension: 2,
  evidence: 3,
  solution: 4,
  proof: 5,
  decision: 6,
  closing: 7,
  appendix: 8
};

const TOPIC_HEADING_PATTERN =
  /^(kết quả(?: đánh giá)?|tổng quan|giới thiệu|phương pháp|kiến trúc|results?|overview|methodology|architecture)$/iu;
const ACTION_PATTERN =
  /(?:hãy|cần|tiếp theo|phê duyệt|chọn|triển khai|bắt đầu|adopt|approve|choose|next|start|ship|decide)/iu;

function firstSlideIdForSection(
  narrative: DeckNarrative,
  sectionId: string
): string | undefined {
  return narrative.sections.find((section) => section.id === sectionId)?.slideIds[0];
}

function sectionRoleById(
  narrative: DeckNarrative
): ReadonlyMap<string, NarrativeSectionRole> {
  return new Map(narrative.sections.map((section) => [section.id, section.role]));
}

function hasInterpretation(slide: NarrativeSlide): boolean {
  return Boolean(slide.interpretation?.trim() || slide.conclusion.trim());
}

export function auditNarrative(input: NarrativeAuditInput): NarrativeAuditResult {
  const { narrative, slides } = input;
  const diagnostics: NarrativeDiagnostic[] = [];
  const index = buildNarrativeIndex(narrative, slides);
  const slideById = new Map(slides.map((slide) => [slide.id, slide]));
  const roleBySection = sectionRoleById(narrative);

  if (narrative.thesis.trim().length < 16) {
    diagnostics.push({
      code: "weak-thesis",
      severity: "warning",
      message: "Thesis quá ngắn hoặc chưa nêu được lập luận chính.",
      recommendation: "Viết thesis thành một claim có chủ thể, thay đổi và outcome cho audience."
    });
  }

  const firstEvidenceIndex = narrative.sections.findIndex(
    (section) => section.role === "evidence" || section.role === "tension"
  );
  const firstSolutionIndex = narrative.sections.findIndex(
    (section) => section.role === "solution"
  );
  if (
    firstSolutionIndex >= 0 &&
    (firstEvidenceIndex < 0 || firstSolutionIndex < firstEvidenceIndex)
  ) {
    const section = narrative.sections[firstSolutionIndex];
    diagnostics.push({
      code: "solution-before-evidence",
      severity: "error",
      message: "Giải pháp xuất hiện trước khi vấn đề hoặc bằng chứng được thiết lập.",
      recommendation: "Đưa tension/evidence lên trước hoặc thêm transition giải thích vì sao giải pháp cần thiết.",
      ...(section?.slideIds[0] ? { slideId: section.slideIds[0] } : {}),
      ...(section ? { sectionId: section.id } : {})
    });
  }

  const hasContext = narrative.sections.some((section) => section.role === "context");
  const hasTensionOrEvidence = narrative.sections.some(
    (section) => section.role === "tension" || section.role === "evidence"
  );
  if (hasContext && !hasTensionOrEvidence) {
    const contextSection = narrative.sections.find((section) => section.role === "context");
    diagnostics.push({
      code: "context-without-tension",
      severity: "warning",
      message: "Phần context chưa dẫn tới tension hoặc bằng chứng cần giải quyết.",
      recommendation: "Thêm một slide nêu vấn đề, rủi ro hoặc bằng chứng trước khi giới thiệu giải pháp.",
      ...(contextSection?.slideIds[0] ? { slideId: contextSection.slideIds[0] } : {}),
      ...(contextSection ? { sectionId: contextSection.id } : {})
    });
  }

  const seenSemanticSignatures = new Map<string, string>();
  for (const slideId of index.orderedSlideIds) {
    const slide = slideById.get(slideId);
    if (!slide) continue;
    const role = roleBySection.get(slide.sectionId);

    if (
      (role === "evidence" || role === "proof") &&
      slide.evidenceStatus !== "unsupported" &&
      !hasInterpretation(slide)
    ) {
      diagnostics.push({
        code: "evidence-without-interpretation",
        severity: "warning",
        slideId: slide.id,
        sectionId: slide.sectionId,
        message: "Slide có bằng chứng nhưng chưa nêu audience nên hiểu hoặc quyết định điều gì.",
        recommendation: "Bổ sung conclusion diễn giải ý nghĩa của bằng chứng, không chỉ mô tả dữ liệu."
      });
    }

    if (TOPIC_HEADING_PATTERN.test(slide.heading.trim())) {
      diagnostics.push({
        code: "weak-conclusion-heading",
        severity: "warning",
        slideId: slide.id,
        sectionId: slide.sectionId,
        message: `Heading “${slide.heading}” chỉ nêu chủ đề, chưa nêu kết luận.`,
        recommendation: "Viết lại heading thành claim được hỗ trợ bởi nội dung slide."
      });
    }

    if (slide.semanticSignature) {
      const originalSlideId = seenSemanticSignatures.get(slide.semanticSignature);
      if (originalSlideId) {
        diagnostics.push({
          code: "duplicate-slide",
          severity: "warning",
          slideId: slide.id,
          sectionId: slide.sectionId,
          message: `Slide lặp lại cùng semantic content với ${originalSlideId}.`,
          recommendation: "Gộp hai slide, thay đổi câu hỏi được trả lời hoặc chuyển chi tiết sang appendix."
        });
      } else {
        seenSemanticSignatures.set(slide.semanticSignature, slide.id);
      }
    }

    if (role !== "appendix" && slide.purpose === "reference") {
      diagnostics.push({
        code: "appendix-leakage",
        severity: "warning",
        slideId: slide.id,
        sectionId: slide.sectionId,
        message: "Nội dung tham chiếu đang nằm trong main story.",
        recommendation: "Chuyển chi tiết tham chiếu sang appendix hoặc nêu rõ insight chính cho audience."
      });
    }
  }

  const mainSections = narrative.sections.filter((section) => section.role !== "appendix");
  for (let indexValue = 1; indexValue < mainSections.length; indexValue += 1) {
    const previous = mainSections[indexValue - 1];
    const current = mainSections[indexValue];
    if (!previous || !current) continue;
    const jump = ROLE_ORDER[current.role] - ROLE_ORDER[previous.role];
    if (jump > 2) {
      const slideId = firstSlideIdForSection(narrative, current.id);
      diagnostics.push({
        code: "abrupt-transition",
        severity: "warning",
        ...(slideId ? { slideId } : {}),
        sectionId: current.id,
        message: `Transition từ ${previous.role} sang ${current.role} bỏ qua bước lập luận trung gian.`,
        recommendation: "Thêm transition, evidence hoặc proof để giải thích bước nhảy trong story."
      });
    }
  }

  const closingSection = narrative.sections.find((section) => section.role === "closing");
  if (closingSection) {
    const closingSlideId = closingSection.slideIds.at(-1);
    const closingSlide = closingSlideId ? slideById.get(closingSlideId) : undefined;
    const closingText = `${closingSlide?.heading ?? ""} ${closingSlide?.conclusion ?? ""}`;
    if (!closingSlide || !ACTION_PATTERN.test(closingText)) {
      diagnostics.push({
        code: "weak-closing",
        severity: "warning",
        ...(closingSlideId ? { slideId: closingSlideId } : {}),
        sectionId: closingSection.id,
        message: "Closing chưa nêu quyết định hoặc hành động tiếp theo.",
        recommendation: "Kết thúc bằng một decision, approval request hoặc next action cụ thể."
      });
    }
  }

  for (const slideId of index.unassignedSlideIds) {
    diagnostics.push({
      code: "unassigned-slide",
      severity: "warning",
      slideId,
      message: "Slide chưa thuộc narrative section nào.",
      recommendation: "Gán slide vào main story hoặc appendix để thứ tự kể chuyện có thể audit."
    });
  }

  for (const slideId of index.missingSlideIds) {
    diagnostics.push({
      code: "missing-slide",
      severity: "error",
      slideId,
      message: "Narrative tham chiếu một slide không tồn tại.",
      recommendation: "Khôi phục slide hoặc xoá tham chiếu khỏi section."
    });
  }

  return {
    diagnostics,
    orderedSlideIds: index.orderedSlideIds,
    mainSlideIds: index.mainSlideIds,
    appendixSlideIds: index.appendixSlideIds
  };
}
