import type {
  EvidenceRequirement,
  VisualCatalogEntry,
  VisualFamily,
  VisualInputKind,
  VisualInputRequirement
} from "./catalog";
import type { VisualIntent, VisualIntentAnalysis } from "./intent";

export type VisualInputStatus = "available" | "partial" | "missing";

export type ResolvedVisualInputRequirement = VisualInputRequirement & {
  status: VisualInputStatus;
  observedItems: number;
};

export type VisualAlternative = {
  componentId: string;
  family: VisualFamily;
  reason: string;
};

export type VisualRecommendation = {
  intent: VisualIntent;
  componentId: string;
  family: VisualFamily;
  confidence: number;
  reasons: string[];
  requiredInputs: ResolvedVisualInputRequirement[];
  evidenceRequirements: EvidenceRequirement[];
  alternatives: VisualAlternative[];
  warnings: string[];
};

type RankedCandidate = {
  entry: VisualCatalogEntry;
  score: number;
  reasons: string[];
  requiredInputs: ResolvedVisualInputRequirement[];
  warnings: string[];
};

const INTENT_REASONS: Partial<Record<VisualIntent, string>> = {
  "single-claim": "Nội dung tập trung vào một kết luận chính.",
  comparison: "Nội dung cần đối chiếu các lựa chọn trên cùng tiêu chí.",
  "before-after": "Nội dung mô tả hai trạng thái trước và sau rõ ràng.",
  "trade-off": "Nội dung chứa đánh đổi cần được nhìn theo hai chiều.",
  ranking: "Các giá trị cần được đọc theo thứ hạng.",
  magnitude: "Độ lớn tương đối giữa các giá trị là quan hệ chính.",
  trend: "Nội dung có thay đổi qua các mốc có thứ tự.",
  distribution: "Hình dạng phân bố và độ biến thiên là câu hỏi chính.",
  "part-to-whole": "Nội dung mô tả đóng góp của các phần vào tổng thể.",
  chronology: "Thứ tự thời gian quyết định cách đọc nội dung.",
  process: "Nội dung có thứ tự thao tác rõ ràng.",
  journey: "Các bước phản ánh hành trình qua nhiều trạng thái.",
  lifecycle: "Nội dung mô tả các giai đoạn của một vòng đời.",
  roadmap: "Các cột mốc tạo thành một lộ trình có thứ tự.",
  hierarchy: "Quan hệ cha-con là cấu trúc chính.",
  architecture: "Các thành phần và lớp hệ thống cần được giải thích cùng nhau.",
  dependency: "Các kết nối phụ thuộc quyết định cách đọc hệ thống.",
  network: "Quan hệ nhiều chiều giữa các thực thể là insight chính.",
  causality: "Nội dung mô tả nguyên nhân và hệ quả.",
  geography: "Vị trí địa lý là một chiều dữ liệu cần thiết.",
  ownership: "Vai trò và trách nhiệm giữa các thực thể cần được làm rõ.",
  "evidence-chain": "Claim cần được truy vết tới bằng chứng tương ứng.",
  risk: "Xác suất và tác động cần được đọc cùng nhau.",
  prioritization: "Các lựa chọn cần được xếp ưu tiên theo tiêu chí rõ ràng.",
  "implementation-proof": "Bằng chứng triển khai cần nối trực tiếp tới claim.",
  decision: "Nội dung cần hỗ trợ một quyết định cụ thể.",
  action: "Slide cần dẫn tới hành động tiếp theo rõ ràng."
};

function observedItems(kind: VisualInputKind, analysis: VisualIntentAnalysis): number {
  switch (kind) {
    case "claim":
      return analysis.extractedClaims.length;
    case "steps":
      return analysis.inputAvailability.steps;
    case "sides":
      return analysis.inputAvailability.sides;
    case "entities":
      return analysis.inputAvailability.entities;
    case "categories":
      return analysis.inputAvailability.categories;
    case "series":
      return analysis.inputAvailability.series;
    case "numeric-data":
      return analysis.inputAvailability.numericData;
    case "dates":
      return analysis.primary === "chronology" || analysis.primary === "roadmap" ? 1 : 0;
    case "hierarchy":
      return analysis.primary === "hierarchy" ? Math.max(analysis.entities.length, 1) : 0;
    case "relationships":
      return analysis.primary === "architecture" ||
        analysis.primary === "dependency" ||
        analysis.primary === "network" ||
        analysis.primary === "causality"
        ? 1
        : 0;
    case "geography":
      return analysis.primary === "geography" ? 1 : 0;
    case "evidence":
      return analysis.primary === "evidence-chain" ||
        analysis.primary === "implementation-proof"
        ? 1
        : 0;
  }
}

function resolveRequirement(
  requirement: VisualInputRequirement,
  analysis: VisualIntentAnalysis
): ResolvedVisualInputRequirement {
  const observed = observedItems(requirement.kind, analysis);
  const minimum = requirement.minimumItems ?? 1;
  const status: VisualInputStatus =
    observed >= minimum ? "available" : observed > 0 ? "partial" : "missing";

  return {
    ...requirement,
    status,
    observedItems: observed
  };
}

function candidateReasons(
  entry: VisualCatalogEntry,
  analysis: VisualIntentAnalysis
): string[] {
  const reasons = [
    INTENT_REASONS[analysis.primary] ?? "Visual phù hợp với quan hệ nội dung đã nhận diện.",
    entry.useWhen[0] ?? `Visual ${entry.id} hỗ trợ quan hệ ${entry.relationship}.`
  ];

  if (entry.family === "chart") {
    reasons.push(
      `Có ${analysis.numericClaims.length} numeric claim được trích xuất trực tiếp từ nội dung.`
    );
  }

  return reasons;
}

function buildCandidate(
  entry: VisualCatalogEntry,
  analysis: VisualIntentAnalysis
): RankedCandidate {
  const primaryMatch = entry.intents.includes(analysis.primary);
  const secondaryMatch = analysis.secondary.some((intent) => entry.intents.includes(intent));
  const requiredInputs = entry.requiredInputs.map((requirement) =>
    resolveRequirement(requirement, analysis)
  );
  const availableCount = requiredInputs.filter((input) => input.status === "available").length;
  const missingRequired = requiredInputs.filter(
    (input) => input.required && input.status !== "available"
  );
  const score =
    (primaryMatch ? 100 : secondaryMatch ? 65 : 0) +
    entry.recommendationPriority / 10 +
    availableCount * 4 -
    missingRequired.length * 8;
  const warnings = missingRequired.map(
    (input) => `Thiếu đầu vào bắt buộc: ${input.label}. Deckory không tự tạo dữ liệu này.`
  );

  const observedDensity = Math.max(
    analysis.extractedSteps.length,
    analysis.entities.length,
    analysis.numericClaims.length,
    analysis.sides.length
  );
  if (observedDensity > entry.density.maxItems) {
    warnings.push(
      `Mật độ ${observedDensity} mục vượt giới hạn ${entry.density.maxItems}; cần tách visual hoặc giảm phạm vi.`
    );
  }

  return {
    entry,
    score,
    reasons: candidateReasons(entry, analysis),
    requiredInputs,
    warnings
  };
}

function toConfidence(score: number): number {
  const normalized = Math.max(0.2, Math.min(0.98, score / 120));
  return Number(normalized.toFixed(2));
}

export function recommendVisuals(
  analysis: VisualIntentAnalysis,
  catalog: readonly VisualCatalogEntry[]
): VisualRecommendation[] {
  const candidates = catalog
    .filter((entry) => {
      const matches =
        entry.intents.includes(analysis.primary) ||
        analysis.secondary.some((intent) => entry.intents.includes(intent));
      if (!matches) return false;
      if (entry.family === "chart" && analysis.numericClaims.length === 0) return false;
      return true;
    })
    .map((entry) => buildCandidate(entry, analysis))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.entry.recommendationPriority !== left.entry.recommendationPriority) {
        return right.entry.recommendationPriority - left.entry.recommendationPriority;
      }
      return left.entry.id.localeCompare(right.entry.id, "en");
    });

  return candidates.map((candidate) => ({
    intent: analysis.primary,
    componentId: candidate.entry.id,
    family: candidate.entry.family,
    confidence: toConfidence(candidate.score),
    reasons: candidate.reasons,
    requiredInputs: candidate.requiredInputs,
    evidenceRequirements: [...candidate.entry.evidenceRequirements],
    alternatives: candidates
      .filter((alternative) => alternative.entry.id !== candidate.entry.id)
      .slice(0, 3)
      .map((alternative) => ({
        componentId: alternative.entry.id,
        family: alternative.entry.family,
        reason: alternative.entry.useWhen[0] ?? alternative.entry.relationship
      })),
    warnings: candidate.warnings
  }));
}
