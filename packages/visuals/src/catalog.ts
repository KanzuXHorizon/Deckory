import type { VisualIntent } from "./intent";

export type VisualFamily = "editorial" | "composition" | "chart" | "diagram";

export type VisualInputKind =
  | "claim"
  | "steps"
  | "sides"
  | "entities"
  | "categories"
  | "series"
  | "numeric-data"
  | "dates"
  | "hierarchy"
  | "relationships"
  | "geography"
  | "evidence";

export type VisualInputRequirement = {
  kind: VisualInputKind;
  label: string;
  required: boolean;
  minimumItems?: number;
};

export type EvidenceRequirement = {
  kind:
    | "claim-source"
    | "numeric-evidence"
    | "time-period"
    | "sample"
    | "local-asset";
  required: boolean;
  description: string;
};

export type RendererCapability =
  | "deckory-native"
  | "echarts-adapter"
  | "elk-adapter";

export type VisualCatalogEntry = {
  id: string;
  family: VisualFamily;
  relationship: string;
  intents: readonly VisualIntent[];
  recommendationPriority: number;
  requiredInputs: readonly VisualInputRequirement[];
  optionalInputs: readonly VisualInputRequirement[];
  evidenceRequirements: readonly EvidenceRequirement[];
  density: {
    minItems: number;
    maxItems: number;
  };
  useWhen: readonly string[];
  avoidWhen: readonly string[];
  accessibility: {
    summaryStrategy: string;
    traversalStrategy: string;
  };
  rendererCapability: RendererCapability;
  exportCapabilities: readonly ("svg" | "png" | "pdf" | "pptx")[];
  fixtureId: string;
};

export type CatalogDiagnostic = {
  code:
    | "duplicate-id"
    | "missing-metadata"
    | "invalid-density"
    | "chart-missing-numeric-input"
    | "chart-missing-evidence";
  entryId: string;
  message: string;
};

const numericEvidence: EvidenceRequirement = {
  kind: "numeric-evidence",
  required: true,
  description: "Mọi giá trị phải liên kết đến dữ liệu số rõ ràng hoặc được ghi nhãn minh hoạ."
};

const numericInput: VisualInputRequirement = {
  kind: "numeric-data",
  label: "Dữ liệu số",
  required: true,
  minimumItems: 1
};

export const visualCatalog: readonly VisualCatalogEntry[] = [
  {
    id: "single-claim",
    family: "editorial",
    relationship: "one conclusion with supporting context",
    intents: ["single-claim", "action"],
    recommendationPriority: 70,
    requiredInputs: [
      { kind: "claim", label: "Kết luận chính", required: true, minimumItems: 1 }
    ],
    optionalInputs: [
      { kind: "evidence", label: "Bằng chứng hỗ trợ", required: false }
    ],
    evidenceRequirements: [
      {
        kind: "claim-source",
        required: false,
        description: "Liên kết nguồn khi kết luận là một claim thực tế."
      }
    ],
    density: { minItems: 1, maxItems: 3 },
    useWhen: ["Một kết luận là trọng tâm duy nhất của slide."],
    avoidWhen: ["Nội dung chứa chuỗi bước hoặc quan hệ nhiều thực thể."],
    accessibility: {
      summaryStrategy: "Đọc kết luận trước, sau đó đọc ngữ cảnh và bằng chứng.",
      traversalStrategy: "heading-then-support"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "single-claim-basic"
  },
  {
    id: "linear-process",
    family: "diagram",
    relationship: "ordered sequence",
    intents: ["process", "journey", "lifecycle", "chronology"],
    recommendationPriority: 100,
    requiredInputs: [
      { kind: "steps", label: "Các bước theo thứ tự", required: true, minimumItems: 2 }
    ],
    optionalInputs: [
      { kind: "evidence", label: "Bằng chứng theo bước", required: false }
    ],
    evidenceRequirements: [],
    density: { minItems: 2, maxItems: 7 },
    useWhen: ["Nội dung có thứ tự rõ và mỗi bước dẫn đến bước tiếp theo."],
    avoidWhen: ["Quy trình có nhiều nhánh quyết định hoặc vòng phản hồi."],
    accessibility: {
      summaryStrategy: "Tóm tắt mục tiêu rồi đọc tuần tự từng bước.",
      traversalStrategy: "ordered-nodes"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "linear-process-vietnamese"
  },
  {
    id: "branching-process",
    family: "diagram",
    relationship: "ordered sequence with decisions",
    intents: ["process", "decision", "causality"],
    recommendationPriority: 85,
    requiredInputs: [
      { kind: "steps", label: "Các bước", required: true, minimumItems: 3 },
      { kind: "relationships", label: "Nhánh quyết định", required: true, minimumItems: 1 }
    ],
    optionalInputs: [],
    evidenceRequirements: [],
    density: { minItems: 3, maxItems: 10 },
    useWhen: ["Luồng có điều kiện hoặc nhiều kết quả tiếp theo."],
    avoidWhen: ["Nội dung chỉ là một chuỗi tuyến tính ngắn."],
    accessibility: {
      summaryStrategy: "Đọc điểm bắt đầu, điều kiện nhánh và từng kết quả.",
      traversalStrategy: "branch-aware-depth-first"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "branching-process-decision"
  },
  {
    id: "before-after",
    family: "composition",
    relationship: "state transition",
    intents: ["before-after", "comparison"],
    recommendationPriority: 100,
    requiredInputs: [
      { kind: "sides", label: "Trạng thái trước và sau", required: true, minimumItems: 2 }
    ],
    optionalInputs: [numericInput],
    evidenceRequirements: [
      {
        kind: "claim-source",
        required: false,
        description: "Nguồn cần thiết khi thay đổi được trình bày như kết quả thực tế."
      }
    ],
    density: { minItems: 2, maxItems: 6 },
    useWhen: ["Hai trạng thái có thể đối chiếu trực tiếp."],
    avoidWhen: ["Có hơn hai lựa chọn hoặc không có trạng thái gốc rõ ràng."],
    accessibility: {
      summaryStrategy: "Đọc trạng thái trước, trạng thái sau và thay đổi chính.",
      traversalStrategy: "before-then-after"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "before-after-operating-model"
  },
  {
    id: "comparison-matrix",
    family: "composition",
    relationship: "multi-criteria comparison",
    intents: ["comparison", "trade-off", "prioritization", "decision"],
    recommendationPriority: 80,
    requiredInputs: [
      { kind: "sides", label: "Các lựa chọn", required: true, minimumItems: 2 },
      { kind: "categories", label: "Tiêu chí so sánh", required: true, minimumItems: 2 }
    ],
    optionalInputs: [numericInput],
    evidenceRequirements: [],
    density: { minItems: 2, maxItems: 12 },
    useWhen: ["Cần so sánh nhiều lựa chọn trên các tiêu chí nhất quán."],
    avoidWhen: ["Câu chuyện chỉ cần nhấn mạnh một thay đổi trước/sau."],
    accessibility: {
      summaryStrategy: "Đọc từng tiêu chí rồi so sánh các lựa chọn theo hàng.",
      traversalStrategy: "criteria-first-grid"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "comparison-matrix-options"
  },
  {
    id: "timeline",
    family: "diagram",
    relationship: "events over time",
    intents: ["chronology", "roadmap", "lifecycle"],
    recommendationPriority: 90,
    requiredInputs: [
      { kind: "dates", label: "Mốc thời gian", required: true, minimumItems: 2 },
      { kind: "steps", label: "Sự kiện hoặc cột mốc", required: true, minimumItems: 2 }
    ],
    optionalInputs: [],
    evidenceRequirements: [
      {
        kind: "time-period",
        required: true,
        description: "Mỗi mốc phải có thời điểm hoặc thứ tự thời gian xác định."
      }
    ],
    density: { minItems: 2, maxItems: 8 },
    useWhen: ["Thứ tự thời gian là quan hệ chính cần giải thích."],
    avoidWhen: ["Các bước không gắn với thời điểm hoặc thời lượng."],
    accessibility: {
      summaryStrategy: "Đọc các mốc theo trình tự thời gian cùng kết quả mỗi mốc.",
      traversalStrategy: "chronological"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "timeline-release"
  },
  {
    id: "hierarchy-tree",
    family: "diagram",
    relationship: "parent-child hierarchy",
    intents: ["hierarchy", "ownership"],
    recommendationPriority: 95,
    requiredInputs: [
      { kind: "hierarchy", label: "Quan hệ cha-con", required: true, minimumItems: 2 },
      { kind: "entities", label: "Thực thể", required: true, minimumItems: 2 }
    ],
    optionalInputs: [],
    evidenceRequirements: [],
    density: { minItems: 2, maxItems: 24 },
    useWhen: ["Mỗi thực thể có một vị trí phân cấp rõ ràng."],
    avoidWhen: ["Quan hệ là mạng nhiều chiều hoặc có nhiều cha."],
    accessibility: {
      summaryStrategy: "Đọc từ gốc xuống từng nhánh và mô tả cấp độ.",
      traversalStrategy: "breadth-first"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "hierarchy-team"
  },
  {
    id: "architecture-layers",
    family: "diagram",
    relationship: "layered system dependencies",
    intents: ["architecture", "dependency", "network"],
    recommendationPriority: 95,
    requiredInputs: [
      { kind: "entities", label: "Thành phần hệ thống", required: true, minimumItems: 2 },
      { kind: "relationships", label: "Kết nối giữa thành phần", required: true, minimumItems: 1 }
    ],
    optionalInputs: [
      { kind: "hierarchy", label: "Các lớp kiến trúc", required: false }
    ],
    evidenceRequirements: [],
    density: { minItems: 2, maxItems: 30 },
    useWhen: ["Cần giải thích thành phần, lớp và hướng phụ thuộc."],
    avoidWhen: ["Chỉ có một chuỗi bước tuyến tính."],
    accessibility: {
      summaryStrategy: "Đọc theo lớp, sau đó mô tả các kết nối quan trọng.",
      traversalStrategy: "layer-then-edge"
    },
    rendererCapability: "elk-adapter",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "architecture-layered-long-labels"
  },
  {
    id: "evidence-chain",
    family: "diagram",
    relationship: "claim to evidence trace",
    intents: ["evidence-chain", "implementation-proof"],
    recommendationPriority: 95,
    requiredInputs: [
      { kind: "claim", label: "Claim", required: true, minimumItems: 1 },
      { kind: "evidence", label: "Bằng chứng", required: true, minimumItems: 1 },
      { kind: "relationships", label: "Liên kết claim-bằng chứng", required: true, minimumItems: 1 }
    ],
    optionalInputs: [],
    evidenceRequirements: [
      {
        kind: "claim-source",
        required: true,
        description: "Mỗi claim phải trỏ đến ít nhất một bằng chứng."
      }
    ],
    density: { minItems: 2, maxItems: 18 },
    useWhen: ["Khả năng truy vết claim là nội dung chính."],
    avoidWhen: ["Chỉ cần một footnote nguồn ngắn."],
    accessibility: {
      summaryStrategy: "Đọc claim, bằng chứng liên quan và trạng thái hỗ trợ.",
      traversalStrategy: "claim-then-evidence"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "evidence-chain-academic"
  },
  {
    id: "line-chart",
    family: "chart",
    relationship: "change over ordered categories",
    intents: ["trend", "chronology"],
    recommendationPriority: 100,
    requiredInputs: [
      numericInput,
      { kind: "categories", label: "Mốc hoặc danh mục có thứ tự", required: true, minimumItems: 2 }
    ],
    optionalInputs: [
      { kind: "series", label: "Chuỗi dữ liệu", required: false, minimumItems: 1 }
    ],
    evidenceRequirements: [numericEvidence],
    density: { minItems: 2, maxItems: 40 },
    useWhen: ["Cần thể hiện hướng thay đổi qua các mốc có thứ tự."],
    avoidWhen: ["Chỉ có một giá trị hoặc danh mục không có thứ tự."],
    accessibility: {
      summaryStrategy: "Nêu xu hướng, điểm đầu-cuối và ngoại lệ quan trọng.",
      traversalStrategy: "series-then-points"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "line-chart-score-rounds"
  },
  {
    id: "horizontal-bar",
    family: "chart",
    relationship: "ranked magnitude comparison",
    intents: ["ranking", "magnitude", "comparison"],
    recommendationPriority: 95,
    requiredInputs: [
      numericInput,
      { kind: "categories", label: "Danh mục", required: true, minimumItems: 2 }
    ],
    optionalInputs: [],
    evidenceRequirements: [numericEvidence],
    density: { minItems: 2, maxItems: 12 },
    useWhen: ["Cần so sánh độ lớn và nhãn danh mục tương đối dài."],
    avoidWhen: ["Quan hệ chính là thay đổi liên tục theo thời gian."],
    accessibility: {
      summaryStrategy: "Đọc thứ hạng và giá trị trực tiếp của từng danh mục.",
      traversalStrategy: "rank-order"
    },
    rendererCapability: "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    fixtureId: "horizontal-bar-quality"
  },
  {
    id: "distribution-plot",
    family: "chart",
    relationship: "statistical distribution",
    intents: ["distribution"],
    recommendationPriority: 100,
    requiredInputs: [numericInput],
    optionalInputs: [
      { kind: "categories", label: "Nhóm phân bố", required: false, minimumItems: 1 }
    ],
    evidenceRequirements: [numericEvidence, {
      kind: "sample",
      required: true,
      description: "Cỡ mẫu hoặc phạm vi quan sát phải được khai báo."
    }],
    density: { minItems: 5, maxItems: 5000 },
    useWhen: ["Hình dạng phân bố và độ biến thiên là insight chính."],
    avoidWhen: ["Chỉ có giá trị tổng hợp hoặc cỡ mẫu quá nhỏ."],
    accessibility: {
      summaryStrategy: "Nêu trung tâm, độ trải, ngoại lệ và cỡ mẫu.",
      traversalStrategy: "summary-statistics"
    },
    rendererCapability: "echarts-adapter",
    exportCapabilities: ["svg", "png", "pdf"],
    fixtureId: "distribution-interview-scores"
  },
  {
    id: "sankey-flow",
    family: "chart",
    relationship: "weighted flow between stages",
    intents: ["network", "dependency", "part-to-whole"],
    recommendationPriority: 75,
    requiredInputs: [
      numericInput,
      { kind: "entities", label: "Nút nguồn và đích", required: true, minimumItems: 2 },
      { kind: "relationships", label: "Luồng có trọng số", required: true, minimumItems: 1 }
    ],
    optionalInputs: [],
    evidenceRequirements: [numericEvidence],
    density: { minItems: 2, maxItems: 40 },
    useWhen: ["Độ lớn của luồng giữa các giai đoạn là insight chính."],
    avoidWhen: ["Cạnh không có trọng số đáng tin cậy hoặc mạng quá dày."],
    accessibility: {
      summaryStrategy: "Nêu tổng luồng và các đường đi lớn nhất theo nguồn-đích.",
      traversalStrategy: "source-flow-target"
    },
    rendererCapability: "echarts-adapter",
    exportCapabilities: ["svg", "png", "pdf"],
    fixtureId: "sankey-candidate-funnel"
  }
] as const;

export function getVisualCatalogEntry(id: string): VisualCatalogEntry | undefined {
  return visualCatalog.find((entry) => entry.id === id);
}

export function validateVisualCatalog(
  catalog: readonly VisualCatalogEntry[]
): { ok: boolean; diagnostics: CatalogDiagnostic[] } {
  const diagnostics: CatalogDiagnostic[] = [];
  const seen = new Set<string>();

  for (const entry of catalog) {
    if (seen.has(entry.id)) {
      diagnostics.push({
        code: "duplicate-id",
        entryId: entry.id,
        message: `Visual catalog ID bị trùng: ${entry.id}.`
      });
    }
    seen.add(entry.id);

    if (
      entry.id.trim().length === 0 ||
      entry.fixtureId.trim().length === 0 ||
      entry.useWhen.length === 0 ||
      entry.avoidWhen.length === 0 ||
      entry.accessibility.summaryStrategy.trim().length === 0 ||
      entry.exportCapabilities.length === 0
    ) {
      diagnostics.push({
        code: "missing-metadata",
        entryId: entry.id,
        message: `Visual ${entry.id} thiếu metadata bắt buộc.`
      });
    }

    if (
      entry.density.minItems < 1 ||
      entry.density.maxItems < entry.density.minItems
    ) {
      diagnostics.push({
        code: "invalid-density",
        entryId: entry.id,
        message: `Visual ${entry.id} có giới hạn mật độ không hợp lệ.`
      });
    }

    if (
      entry.family === "chart" &&
      !entry.requiredInputs.some((input) => input.kind === "numeric-data")
    ) {
      diagnostics.push({
        code: "chart-missing-numeric-input",
        entryId: entry.id,
        message: `Chart ${entry.id} phải yêu cầu dữ liệu số.`
      });
    }

    if (
      entry.family === "chart" &&
      !entry.evidenceRequirements.some(
        (requirement) => requirement.kind === "numeric-evidence" && requirement.required
      )
    ) {
      diagnostics.push({
        code: "chart-missing-evidence",
        entryId: entry.id,
        message: `Chart ${entry.id} phải yêu cầu numeric evidence.`
      });
    }
  }

  return { ok: diagnostics.length === 0, diagnostics };
}
