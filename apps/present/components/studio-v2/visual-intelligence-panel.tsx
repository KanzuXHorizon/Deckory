import type { DeckDocumentV2, SceneElement } from "@deckory/schema/v2";
import {
  analyzeTextForVisuals,
  resolveElementEvidenceLineage
} from "../../lib/visual-assistant-v2";
import styles from "./studio-v2.module.css";

function confidenceLabel(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function VisualIntelligencePanel({
  deck,
  slideId,
  element,
  onApply
}: {
  deck: DeckDocumentV2;
  slideId: string;
  element: SceneElement;
  onApply: (recommendationId: string) => void;
}) {
  const textAnalysis = element.kind === "text"
    ? analyzeTextForVisuals(element.content.text)
    : undefined;
  const lineage = resolveElementEvidenceLineage(deck, slideId, element.id);
  const hasLineage = lineage.bindings.length + lineage.claims.length + lineage.evidence.length + lineage.sources.length + lineage.datasets.length > 0;

  if (!textAnalysis && !hasLineage) return null;

  return (
    <section className={styles.intelligencePanel} aria-labelledby="visual-intelligence-title">
      <header className={styles.intelligenceHeading}>
        <div>
          <span className={styles.panelLabel}>Visual Intelligence</span>
          <h2 id="visual-intelligence-title">Relationship trước, component sau.</h2>
        </div>
        {textAnalysis ? <strong data-visual-intent={textAnalysis.analysis.primary}>{textAnalysis.analysis.primary}</strong> : null}
      </header>

      {textAnalysis ? (
        <div className={styles.recommendationList}>
          <p>
            {textAnalysis.analysis.extractedClaims.length} claim · {textAnalysis.analysis.extractedSteps.length} bước · {textAnalysis.analysis.numericClaims.length} numeric claim
          </p>
          {textAnalysis.recommendations.length > 0 ? textAnalysis.recommendations.map((recommendation) => {
            const missing = recommendation.requiredInputs.filter((input) => input.required && input.status !== "available");
            const canApply = recommendation.componentId === "linear-process" && missing.length === 0;
            return (
              <article key={recommendation.componentId} className={styles.recommendationCard} data-recommendation-id={recommendation.componentId}>
                <div>
                  <strong>{recommendation.componentId}</strong>
                  <span>{recommendation.family} · {confidenceLabel(recommendation.confidence)}</span>
                </div>
                <p>{recommendation.reasons[0]}</p>
                {missing.length > 0 ? (
                  <ul>
                    {missing.map((input) => <li key={input.kind}>Thiếu: {input.label}</li>)}
                  </ul>
                ) : null}
                {recommendation.warnings.length > 0 ? <small>{recommendation.warnings.join(" ")}</small> : null}
                <button
                  type="button"
                  disabled={!canApply}
                  title={canApply ? "Tạo native editable diagram và giữ source text trong Layers" : "Conversion native cho recommendation này chưa được mở"}
                  onClick={() => onApply(recommendation.componentId)}
                >
                  {canApply ? "Visualize as native process" : "Preview recommendation"}
                </button>
              </article>
            );
          }) : <p>Chưa có recommendation đủ điều kiện; Deckory không tự tạo input còn thiếu.</p>}
        </div>
      ) : null}

      {hasLineage ? (
        <div className={styles.lineage} data-evidence-lineage="true">
          <h3>Evidence lineage</h3>
          {lineage.claims.length > 0 ? (
            <div><span>Claims</span>{lineage.claims.map((claim) => <strong key={claim.id}>{claim.text} · {claim.status}</strong>)}</div>
          ) : null}
          {lineage.datasets.length > 0 ? (
            <div><span>Datasets</span>{lineage.datasets.map((dataset) => <strong key={dataset.id}>{dataset.label} · {dataset.rows.length} rows · {dataset.status}</strong>)}</div>
          ) : null}
          {lineage.evidence.length > 0 ? (
            <div><span>Evidence</span>{lineage.evidence.map((record) => <strong key={record.id}>{record.label}</strong>)}</div>
          ) : null}
          {lineage.sources.length > 0 ? (
            <div><span>Sources</span>{lineage.sources.map((source) => <strong key={source.id}>{source.label} · {source.status}</strong>)}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
