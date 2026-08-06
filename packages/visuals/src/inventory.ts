import { visualCatalog } from "./catalog";
import {
  advancedChartVariants,
  editorialChartVariants,
  type ChartVariant
} from "./charts/chart-spec";
import type { DiagramLayoutStrategy } from "./diagrams/diagram-spec";

export type VisualCoverageKind = "chart" | "diagram";
export type VisualCoverageRenderer =
  | "deckory-native"
  | "echarts-adapter"
  | "elk-adapter";

export type VisualCoverageEntry = {
  kind: VisualCoverageKind;
  publicId: string;
  fixtureId: string;
  relationship: string;
  requiredInputs: string[];
  optionalInputs: string[];
  evidenceRequirements: string[];
  useWhen: string[];
  avoidWhen: string[];
  density: { minItems: number; maxItems: number };
  accessibility: {
    summaryStrategy: string;
    traversalStrategy: string;
  };
  rendererCapability: VisualCoverageRenderer;
  exportCapabilities: Array<"svg" | "png" | "pdf" | "pptx">;
  defaultLayout?: DiagramLayoutStrategy;
};

export type VisualFixtureRecord = {
  fixtureId: string;
  publicId: string;
  kind: "chart" | "diagram" | "composition" | "editorial";
  locale: "vi-VN" | "en-US";
  dataStatus: "illustrative";
  visibleEvidenceLabel: string;
  unitCoverage: string[];
  browserReview: "required-after-integration";
};

export const requiredDiagramVisualIds = [
  "linear-process",
  "branching-process",
  "flowchart",
  "swimlane",
  "customer-journey",
  "service-blueprint",
  "cycle",
  "feedback-loop",
  "lifecycle",
  "timeline",
  "roadmap-path",
  "hierarchy-tree",
  "org-chart",
  "mind-map",
  "concept-map",
  "dependency-graph",
  "network-graph",
  "ecosystem-map",
  "causal-graph",
  "architecture-layers",
  "system-context",
  "container-diagram",
  "component-architecture",
  "sequence-diagram",
  "data-flow",
  "api-pipeline",
  "event-flow",
  "state-machine",
  "entity-relationship-diagram",
  "quadrant",
  "matrix",
  "pyramid",
  "funnel-diagram",
  "venn-diagram",
  "concentric-layers",
  "orbit",
  "constellation",
  "evidence-chain"
] as const;

export type RequiredDiagramVisualId = (typeof requiredDiagramVisualIds)[number];

const chartFixtureIds: Partial<Record<ChartVariant, string>> = {
  "horizontal-bar": "horizontal-bar-quality",
  line: "line-chart-score-rounds",
  histogram: "distribution-interview-scores",
  sankey: "sankey-candidate-funnel"
};

function chartRelationship(variant: ChartVariant): string {
  if (["horizontal-bar", "vertical-bar", "grouped-bar", "stacked-bar", "dot-plot", "lollipop", "bullet"].includes(variant)) {
    return "magnitude comparison";
  }
  if (["line", "area", "slope", "waterfall", "gantt", "timeline", "calendar-heatmap"].includes(variant)) {
    return "change over ordered time or stages";
  }
  if (["scatter", "bubble"].includes(variant)) return "relationship between quantitative variables";
  if (["histogram", "box-plot"].includes(variant)) return "statistical distribution";
  if (["heatmap", "small-multiples"].includes(variant)) return "pattern across two or more dimensions";
  if (["donut", "waffle", "treemap", "sunburst"].includes(variant)) return "part-to-whole composition";
  if (["funnel", "sankey"].includes(variant)) return "stage conversion or weighted flow";
  if (["choropleth", "proportional-symbol-map"].includes(variant)) return "geographic distribution";
  if (["radar", "gauge"].includes(variant)) return "multi-dimension profile or threshold status";
  return "quantitative comparison";
}

function chartRequiredInputs(variant: ChartVariant): string[] {
  const inputs = ["numeric-data"];
  if (["scatter", "bubble", "heatmap"].includes(variant)) inputs.push("x-y-fields");
  else if (["sankey"].includes(variant)) inputs.push("weighted-source-target-links");
  else if (["choropleth", "proportional-symbol-map"].includes(variant)) inputs.push("local-geography-asset", "geography-keys");
  else if (["gantt"].includes(variant)) inputs.push("start-end-dates");
  else if (["calendar-heatmap"].includes(variant)) inputs.push("dates");
  else inputs.push("categories");
  if (["grouped-bar", "stacked-bar", "slope", "small-multiples"].includes(variant)) inputs.push("series");
  return inputs;
}

function chartUseWhen(variant: ChartVariant): string[] {
  const relationship = chartRelationship(variant);
  return [`Dùng khi ${relationship} là câu hỏi chính và dữ liệu số đã được xác minh.`];
}

function chartAvoidWhen(variant: ChartVariant): string[] {
  if (variant === "gauge") return ["Tránh khi không có threshold thật hoặc chỉ cần hiển thị một con số."];
  if (variant === "radar") return ["Tránh khi audience cần so sánh chính xác nhiều giá trị hoặc có quá nhiều chuỗi."];
  if (variant === "donut") return ["Tránh khi có nhiều lát, tổng không bằng một toàn thể có nghĩa hoặc cần đọc chính xác."];
  if (variant === "sankey") return ["Tránh khi luồng không có trọng số đáng tin cậy hoặc graph quá dày."];
  return ["Tránh khi không có numeric evidence hoặc quan hệ có thể giải thích rõ hơn bằng copy/diagram."];
}

function chartDensity(variant: ChartVariant): { minItems: number; maxItems: number } {
  if (["histogram", "box-plot"].includes(variant)) return { minItems: 5, maxItems: 5000 };
  if (["scatter", "bubble"].includes(variant)) return { minItems: 3, maxItems: 2000 };
  if (["sankey", "treemap", "sunburst"].includes(variant)) return { minItems: 2, maxItems: 60 };
  if (["heatmap", "calendar-heatmap"].includes(variant)) return { minItems: 4, maxItems: 500 };
  if (["line", "area", "timeline", "gantt"].includes(variant)) return { minItems: 2, maxItems: 80 };
  return { minItems: 1, maxItems: 16 };
}

function createChartCoverage(variant: ChartVariant): VisualCoverageEntry {
  const editorial = (editorialChartVariants as readonly ChartVariant[]).includes(variant);
  return {
    kind: "chart",
    publicId: variant,
    fixtureId: chartFixtureIds[variant] ?? `chart-${variant}-fixture`,
    relationship: chartRelationship(variant),
    requiredInputs: chartRequiredInputs(variant),
    optionalInputs: ["annotations", "reference-lines", "secondary-highlights"],
    evidenceRequirements: ["numeric-evidence", "unit", "accessible-summary"],
    useWhen: chartUseWhen(variant),
    avoidWhen: chartAvoidWhen(variant),
    density: chartDensity(variant),
    accessibility: {
      summaryStrategy: "Nêu conclusion, phạm vi, giá trị chính, ngoại lệ và evidence status.",
      traversalStrategy: "direct-label-order"
    },
    rendererCapability: editorial ? "deckory-native" : "echarts-adapter",
    exportCapabilities: editorial ? ["svg", "png", "pdf", "pptx"] : ["svg", "png", "pdf"]
  };
}

const diagramLayouts: Record<RequiredDiagramVisualId, DiagramLayoutStrategy> = {
  "linear-process": "timeline",
  "branching-process": "tree",
  flowchart: "tree",
  swimlane: "elk-layered",
  "customer-journey": "timeline",
  "service-blueprint": "matrix",
  cycle: "cycle",
  "feedback-loop": "cycle",
  lifecycle: "cycle",
  timeline: "timeline",
  "roadmap-path": "timeline",
  "hierarchy-tree": "tree",
  "org-chart": "tree",
  "mind-map": "radial",
  "concept-map": "radial",
  "dependency-graph": "elk-layered",
  "network-graph": "elk-force",
  "ecosystem-map": "radial",
  "causal-graph": "elk-layered",
  "architecture-layers": "elk-layered",
  "system-context": "radial",
  "container-diagram": "elk-layered",
  "component-architecture": "elk-layered",
  "sequence-diagram": "timeline",
  "data-flow": "elk-layered",
  "api-pipeline": "timeline",
  "event-flow": "timeline",
  "state-machine": "elk-layered",
  "entity-relationship-diagram": "elk-layered",
  quadrant: "matrix",
  matrix: "matrix",
  pyramid: "tree",
  "funnel-diagram": "tree",
  "venn-diagram": "manual",
  "concentric-layers": "radial",
  orbit: "radial",
  constellation: "elk-force",
  "evidence-chain": "tree"
};

const diagramFixtureIds: Partial<Record<RequiredDiagramVisualId, string>> = {
  "linear-process": "linear-process-vietnamese",
  "branching-process": "branching-process-decision",
  timeline: "timeline-release",
  "hierarchy-tree": "hierarchy-team",
  "architecture-layers": "architecture-layered-long-labels",
  "evidence-chain": "evidence-chain-academic"
};

function diagramRelationship(id: RequiredDiagramVisualId): string {
  if (["linear-process", "branching-process", "flowchart", "swimlane", "api-pipeline", "event-flow"].includes(id)) return "ordered flow and decisions";
  if (["customer-journey", "service-blueprint"].includes(id)) return "experience across stages and actors";
  if (["cycle", "feedback-loop", "lifecycle"].includes(id)) return "repeating stages and feedback";
  if (["timeline", "roadmap-path", "sequence-diagram"].includes(id)) return "chronology and ordered events";
  if (["hierarchy-tree", "org-chart", "pyramid", "concentric-layers"].includes(id)) return "hierarchy and containment";
  if (["mind-map", "concept-map", "ecosystem-map", "system-context", "orbit"].includes(id)) return "relationships around a central concept";
  if (["dependency-graph", "network-graph", "causal-graph", "constellation"].includes(id)) return "multi-node relationship graph";
  if (["architecture-layers", "container-diagram", "component-architecture", "data-flow"].includes(id)) return "system components and dependencies";
  if (["state-machine"].includes(id)) return "states and permitted transitions";
  if (["entity-relationship-diagram"].includes(id)) return "entities and cardinal relationships";
  if (["quadrant", "matrix"].includes(id)) return "two-dimensional classification";
  if (["venn-diagram"].includes(id)) return "set overlap";
  if (["funnel-diagram"].includes(id)) return "progressive narrowing";
  if (["evidence-chain"].includes(id)) return "claim-to-evidence trace";
  return "semantic relationship";
}

function diagramRequiredInputs(id: RequiredDiagramVisualId): string[] {
  if (id === "quadrant" || id === "matrix") return ["entities", "two-dimensions"];
  if (id === "venn-diagram") return ["sets", "overlaps"];
  if (id === "evidence-chain") return ["claims", "evidence", "relationships"];
  if (id === "timeline" || id === "roadmap-path") return ["nodes", "dates-or-order"];
  return ["nodes", "typed-relationships"];
}

function createDiagramCoverage(id: RequiredDiagramVisualId): VisualCoverageEntry {
  const layout = diagramLayouts[id];
  const adapter = layout === "elk-layered" || layout === "elk-force";
  return {
    kind: "diagram",
    publicId: id,
    fixtureId: diagramFixtureIds[id] ?? `diagram-${id}-fixture`,
    relationship: diagramRelationship(id),
    requiredInputs: diagramRequiredInputs(id),
    optionalInputs: ["node-descriptions", "typed-ports", "manual-overrides"],
    evidenceRequirements: id === "evidence-chain" ? ["claim-source"] : ["accessible-summary"],
    useWhen: [`Dùng khi ${diagramRelationship(id)} là quan hệ audience cần hiểu.`],
    avoidWhen: ["Tránh khi nội dung không có quan hệ rõ hoặc số node vượt mật độ đọc được trên một slide."],
    density: id === "network-graph" || id === "constellation"
      ? { minItems: 3, maxItems: 40 }
      : { minItems: 2, maxItems: 24 },
    accessibility: {
      summaryStrategy: "Nêu mục tiêu, traversal order, node quan trọng và các edge quyết định.",
      traversalStrategy: layout === "tree" ? "breadth-first" : layout === "timeline" ? "chronological" : "declared-order"
    },
    rendererCapability: adapter ? "elk-adapter" : "deckory-native",
    exportCapabilities: ["svg", "png", "pdf", "pptx"],
    defaultLayout: layout
  };
}

const chartCoverage = ([...editorialChartVariants, ...advancedChartVariants] as ChartVariant[])
  .map(createChartCoverage);
const diagramCoverage = requiredDiagramVisualIds.map(createDiagramCoverage);

export const visualCoverageCatalog: readonly VisualCoverageEntry[] = [
  ...chartCoverage,
  ...diagramCoverage
];

function fixtureFromCoverage(entry: VisualCoverageEntry): VisualFixtureRecord {
  return {
    fixtureId: entry.fixtureId,
    publicId: entry.publicId,
    kind: entry.kind,
    locale: entry.publicId === "horizontal-bar" || entry.publicId === "linear-process" ? "vi-VN" : "en-US",
    dataStatus: "illustrative",
    visibleEvidenceLabel: entry.publicId === "horizontal-bar" || entry.publicId === "linear-process"
      ? "Dữ liệu fixture minh hoạ"
      : "Illustrative fixture data",
    unitCoverage: entry.kind === "chart"
      ? ["schema", entry.rendererCapability === "deckory-native" ? "editorial-geometry" : "adapter-boundary"]
      : ["schema", entry.rendererCapability === "deckory-native" ? "deterministic-layout" : "adapter-boundary"],
    browserReview: "required-after-integration"
  };
}

const coverageFixtures = visualCoverageCatalog.map(fixtureFromCoverage);
const coveredFixtureIds = new Set(coverageFixtures.map((fixture) => fixture.fixtureId));
const baseCatalogFixtures = visualCatalog
  .filter((entry) => !coveredFixtureIds.has(entry.fixtureId))
  .map<VisualFixtureRecord>((entry) => ({
    fixtureId: entry.fixtureId,
    publicId: entry.id,
    kind: entry.family,
    locale: "vi-VN",
    dataStatus: "illustrative",
    visibleEvidenceLabel: "Dữ liệu fixture minh hoạ",
    unitCoverage: ["catalog-metadata", "recommendation"],
    browserReview: "required-after-integration"
  }));

export const visualFixtureInventory: readonly VisualFixtureRecord[] = [
  ...coverageFixtures,
  ...baseCatalogFixtures
];

export type VisualCoverageDiagnostic = {
  code:
    | "duplicate-public-entry"
    | "duplicate-fixture"
    | "missing-metadata"
    | "missing-fixture"
    | "orphan-fixture"
    | "chart-input-required"
    | "chart-evidence-required";
  recordId: string;
  message: string;
};

export function validateVisualCoverageInventory(
  catalog: readonly VisualCoverageEntry[],
  fixtures: readonly VisualFixtureRecord[]
): { ok: boolean; diagnostics: VisualCoverageDiagnostic[] } {
  const diagnostics: VisualCoverageDiagnostic[] = [];
  const entryKeys = new Set<string>();
  const fixtureIds = new Set<string>();
  const fixtureKeys = new Set<string>();

  for (const entry of catalog) {
    const key = `${entry.kind}:${entry.publicId}`;
    if (entryKeys.has(key)) {
      diagnostics.push({
        code: "duplicate-public-entry",
        recordId: key,
        message: `Public visual entry bị trùng: ${key}.`
      });
    }
    entryKeys.add(key);
    if (
      entry.fixtureId.trim().length === 0 ||
      entry.useWhen.length === 0 ||
      entry.avoidWhen.length === 0 ||
      entry.requiredInputs.length === 0 ||
      entry.accessibility.summaryStrategy.trim().length === 0 ||
      entry.exportCapabilities.length === 0 ||
      entry.density.minItems < 1 ||
      entry.density.maxItems < entry.density.minItems
    ) {
      diagnostics.push({
        code: "missing-metadata",
        recordId: key,
        message: `Visual ${key} thiếu coverage metadata bắt buộc.`
      });
    }
    if (entry.kind === "chart" && !entry.requiredInputs.includes("numeric-data")) {
      diagnostics.push({
        code: "chart-input-required",
        recordId: key,
        message: `Chart ${entry.publicId} phải yêu cầu numeric-data.`
      });
    }
    if (entry.kind === "chart" && !entry.evidenceRequirements.includes("numeric-evidence")) {
      diagnostics.push({
        code: "chart-evidence-required",
        recordId: key,
        message: `Chart ${entry.publicId} phải yêu cầu numeric-evidence.`
      });
    }
  }

  for (const fixture of fixtures) {
    const key = `${fixture.kind}:${fixture.publicId}`;
    if (fixtureIds.has(fixture.fixtureId)) {
      diagnostics.push({
        code: "duplicate-fixture",
        recordId: fixture.fixtureId,
        message: `Fixture ID bị trùng: ${fixture.fixtureId}.`
      });
    }
    fixtureIds.add(fixture.fixtureId);
    fixtureKeys.add(key);
    if (
      fixture.fixtureId.trim().length === 0 ||
      fixture.visibleEvidenceLabel.trim().length === 0 ||
      fixture.unitCoverage.length === 0
    ) {
      diagnostics.push({
        code: "missing-metadata",
        recordId: fixture.fixtureId,
        message: `Fixture ${fixture.fixtureId} thiếu evidence hoặc coverage metadata.`
      });
    }
  }

  for (const entry of catalog) {
    const key = `${entry.kind}:${entry.publicId}`;
    if (!fixtureKeys.has(key)) {
      diagnostics.push({
        code: "missing-fixture",
        recordId: key,
        message: `Visual ${key} chưa có fixture record.`
      });
    }
  }

  return { ok: diagnostics.length === 0, diagnostics };
}
