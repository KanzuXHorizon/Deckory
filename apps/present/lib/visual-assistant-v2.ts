import type { DeckDocumentV2, SceneElement } from "@deckory/schema/v2";
import type { SceneCommand } from "@deckory/scene";
import {
  classifyVisualIntent,
  recommendVisuals,
  visualCatalog,
  type Dataset,
  type DeckDataSource,
  type EvidenceRecord,
  type ClaimRecord,
  type VisualDataBinding,
  type VisualRecommendation
} from "@deckory/visuals";

export type TextVisualAnalysis = {
  analysis: ReturnType<typeof classifyVisualIntent>;
  recommendations: VisualRecommendation[];
};

export type TextToVisualResult =
  | { ok: true; command: SceneCommand; recommendation: VisualRecommendation }
  | {
      ok: false;
      code:
        | "slide-not-found"
        | "text-element-not-found"
        | "visual-id-conflict"
        | "recommendation-not-applicable"
        | "insufficient-input";
      message: string;
    };

export type ElementEvidenceLineage = {
  bindings: VisualDataBinding[];
  claims: ClaimRecord[];
  evidence: EvidenceRecord[];
  sources: DeckDataSource[];
  datasets: Dataset[];
};

export function analyzeTextForVisuals(text: string): TextVisualAnalysis {
  const analysis = classifyVisualIntent({ text, locale: "vi-VN" });
  return {
    analysis,
    recommendations: recommendVisuals(analysis, visualCatalog).slice(0, 3)
  };
}

function processDiagramElement(
  source: Extract<SceneElement, { kind: "text" }>,
  steps: readonly string[]
): Extract<SceneElement, { kind: "diagram" }> {
  const visualId = `${source.id}-visual`;
  const nodes = steps.map((step, index) => ({
    id: `step-${index + 1}`,
    label: step,
    kind: "step" as const,
    ports: [
      ...(index > 0 ? [{ id: "in", direction: "in" as const, side: "left" as const }] : []),
      ...(index < steps.length - 1 ? [{ id: "out", direction: "out" as const, side: "right" as const }] : [])
    ]
  }));
  const edges = steps.slice(0, -1).map((_, index) => ({
    id: `step-${index + 1}-to-step-${index + 2}`,
    source: { nodeId: `step-${index + 1}`, portId: "out" },
    target: { nodeId: `step-${index + 2}`, portId: "in" },
    kind: "sequence" as const
  }));
  const accessibleSummary = `Quy trình gồm ${steps.length} bước: ${steps.join("; ")}.`;

  return {
    id: visualId,
    name: `Visual · ${source.name}`,
    kind: "diagram",
    frame: structuredClone(source.frame),
    zIndex: source.zIndex,
    content: {
      diagram: {
        question: "Quy trình diễn ra theo thứ tự nào?",
        title: source.accessibility.label ?? source.name,
        accessibleSummary,
        intent: "process",
        layout: "timeline",
        direction: "left-to-right",
        nodes,
        edges,
        generatedLayout: null,
        manualOverrides: [],
        accessibleTraversalOrder: nodes.map((node) => node.id),
        edgeRouting: "orthogonal",
        evidence: {
          status: "illustrative",
          sourceIds: [],
          label: "Chuyển đổi từ source text; chưa bổ sung evidence bên ngoài."
        }
      }
    },
    accessibility: { label: accessibleSummary },
    semantic: {
      purpose: "visualized-process",
      sourceElementIds: [source.id]
    }
  };
}

export function createTextToVisualCommand(
  deck: DeckDocumentV2,
  slideId: string,
  elementId: string,
  recommendationId: string
): TextToVisualResult {
  const slide = deck.slides.find((candidate) => candidate.id === slideId);
  if (!slide) {
    return { ok: false, code: "slide-not-found", message: `Slide không tồn tại: ${slideId}` };
  }
  const source = slide.elements.find((element): element is Extract<SceneElement, { kind: "text" }> =>
    element.id === elementId && element.kind === "text");
  if (!source) {
    return { ok: false, code: "text-element-not-found", message: `Text element không tồn tại: ${elementId}` };
  }

  const analysis = analyzeTextForVisuals(source.content.text);
  const recommendation = analysis.recommendations.find((item) => item.componentId === recommendationId);
  if (!recommendation || recommendationId !== "linear-process") {
    return {
      ok: false,
      code: "recommendation-not-applicable",
      message: `Deckory chưa có native conversion an toàn cho recommendation ${recommendationId}.`
    };
  }
  if (analysis.analysis.extractedSteps.length < 2) {
    return {
      ok: false,
      code: "insufficient-input",
      message: "Linear process cần ít nhất hai bước được trích xuất rõ ràng."
    };
  }

  const visualId = `${source.id}-visual`;
  if (slide.elements.some((element) => element.id === visualId)) {
    return { ok: false, code: "visual-id-conflict", message: `Element ID đã tồn tại: ${visualId}` };
  }

  const preservedSource: Extract<SceneElement, { kind: "text" }> = {
    ...structuredClone(source),
    name: `Source · ${source.name}`,
    hidden: true,
    semantic: {
      ...source.semantic,
      purpose: "visual-source-text"
    }
  };
  const visual = processDiagramElement(source, analysis.analysis.extractedSteps);
  const elements = slide.elements.flatMap((element) =>
    element.id === source.id ? [preservedSource, visual] : [element]);

  return {
    ok: true,
    recommendation,
    command: { type: "replace-scene-elements", slideId, elements }
  };
}

function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function resolveElementEvidenceLineage(
  deck: DeckDocumentV2,
  slideId: string,
  elementId: string
): ElementEvidenceLineage {
  const domain = deck.visualIntelligence?.evidence;
  if (!domain) return { bindings: [], claims: [], evidence: [], sources: [], datasets: [] };

  const bindings = domain.visualBindings.filter((binding) =>
    binding.slideId === slideId && binding.elementId === elementId);
  const claimIds = new Set(bindings.flatMap((binding) => binding.claimIds));
  const claims = domain.claims.filter((claim) =>
    (claim.slideId === slideId && claim.elementId === elementId) || claimIds.has(claim.id));
  const evidenceIds = new Set(claims.flatMap((claim) => claim.evidenceIds));
  const evidence = domain.evidence.filter((record) => evidenceIds.has(record.id));
  const datasetIds = new Set(bindings.flatMap((binding) => binding.datasetId ? [binding.datasetId] : []));
  const datasets = domain.datasets.filter((dataset) => datasetIds.has(dataset.id));
  const sourceIds = new Set([
    ...evidence.map((record) => record.sourceId),
    ...datasets.flatMap((dataset) => dataset.sourceIds)
  ]);
  const sources = domain.sources.filter((source) => sourceIds.has(source.id));

  return {
    bindings: uniqueById(bindings),
    claims: uniqueById(claims),
    evidence: uniqueById(evidence),
    sources: uniqueById(sources),
    datasets: uniqueById(datasets)
  };
}
