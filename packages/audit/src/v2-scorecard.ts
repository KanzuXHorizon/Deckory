import type { DeckDocumentV2 } from "@deckory/schema/v2";
import {
  auditDeckV2,
  type DeckAuditCapabilitiesV2,
  type DeckQualityDimensionIdV2,
  type DeckQualityScorecardV2
} from "./v2";
import {
  summarizeRuntimeEvidence,
  type RuntimeEvidenceKind,
  type RuntimeEvidenceRecord
} from "./runtime-evidence";

export type ScoreDeckV2Options = {
  revision?: string;
  runtimeEvidence?: readonly RuntimeEvidenceRecord[];
  capabilities?: DeckAuditCapabilitiesV2;
};

const runtimeDimensionEvidence = new Map<DeckQualityDimensionIdV2, RuntimeEvidenceKind>([
  ["ui", "browser-ui"],
  ["ux", "keyboard-zoom"],
  ["visual-design", "visual-review"],
  ["accessibility", "accessibility"],
  ["interaction", "interaction"],
  ["production-quality", "production-gates"],
  ["export-fidelity", "export-comparison"],
  ["performance", "performance"]
]);

export function scoreDeckV2(
  deck: DeckDocumentV2,
  options: ScoreDeckV2Options = {}
): DeckQualityScorecardV2 {
  const revision = options.revision ?? "";
  const summary = summarizeRuntimeEvidence(options.runtimeEvidence ?? [], {
    revision,
    documentRevision: deck.revision
  });
  const report = auditDeckV2(deck, {
    ...(options.capabilities ? { capabilities: options.capabilities } : {}),
    runtimeEvidence: {
      revision,
      browserUi: summary.browserUi,
      keyboardAndZoom: summary.keyboardAndZoom,
      visualReview: summary.visualReview,
      accessibility: summary.accessibility,
      interaction: summary.interaction,
      exportComparison: summary.exportComparison,
      performance: summary.performance,
      productionGates: summary.productionGates
    }
  });
  const matchedKinds = new Set(
    (options.runtimeEvidence ?? [])
      .filter((record) => summary.matchedRecordIds.includes(record.id))
      .map((record) => record.kind)
  );
  return {
    ...report.scorecard,
    dimensions: report.scorecard.dimensions.map((dimension) => {
      const requiredKind = runtimeDimensionEvidence.get(dimension.id);
      if (!requiredKind) return dimension;
      return {
        ...dimension,
        confidence: matchedKinds.has(requiredKind)
          ? "runtime-required"
          : "manual-review-required"
      };
    })
  };
}

export type {
  DeckQualityDimensionIdV2,
  DeckQualityScorecardV2
} from "./v2";
