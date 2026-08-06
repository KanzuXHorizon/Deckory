export const runtimeEvidenceKinds = [
  "browser-ui",
  "keyboard-zoom",
  "visual-review",
  "accessibility",
  "interaction",
  "export-comparison",
  "performance",
  "production-gates"
] as const;

export type RuntimeEvidenceKind = (typeof runtimeEvidenceKinds)[number];

export const runtimeEvidenceModes = [
  "hub",
  "studio",
  "preview",
  "presenter",
  "export"
] as const;

export type RuntimeEvidenceMode = (typeof runtimeEvidenceModes)[number];

export type RuntimeEvidenceRecord = {
  id: string;
  kind: RuntimeEvidenceKind;
  revision: string;
  documentRevision: number;
  viewport: {
    width: number;
    height: number;
    zoom: number;
  };
  mode: RuntimeEvidenceMode;
  capturedAt: string;
  artifact: string;
  passed: boolean;
};

export type RuntimeEvidenceContext = {
  revision: string;
  documentRevision: number;
};

export type RuntimeEvidenceSummary = {
  browserUi: boolean;
  keyboardAndZoom: boolean;
  visualReview: boolean;
  accessibility: boolean;
  interaction: boolean;
  exportComparison: boolean;
  performance: boolean;
  productionGates: boolean;
  matchedRecordIds: string[];
};

const kinds = new Set<string>(runtimeEvidenceKinds);
const modes = new Set<string>(runtimeEvidenceModes);

function isValidRecord(record: RuntimeEvidenceRecord): boolean {
  return Boolean(
    record.id.trim() &&
    kinds.has(record.kind) &&
    record.revision.trim() &&
    Number.isInteger(record.documentRevision) &&
    record.documentRevision >= 0 &&
    Number.isFinite(record.viewport.width) &&
    record.viewport.width > 0 &&
    Number.isFinite(record.viewport.height) &&
    record.viewport.height > 0 &&
    Number.isFinite(record.viewport.zoom) &&
    record.viewport.zoom > 0 &&
    modes.has(record.mode) &&
    Number.isFinite(Date.parse(record.capturedAt)) &&
    record.artifact.trim()
  );
}

export function matchRuntimeEvidence(
  records: readonly RuntimeEvidenceRecord[],
  context: RuntimeEvidenceContext
): RuntimeEvidenceRecord[] {
  if (!context.revision.trim() || !Number.isInteger(context.documentRevision) || context.documentRevision < 0) {
    return [];
  }
  return records.filter((record) =>
    record.passed &&
    record.revision === context.revision &&
    record.documentRevision === context.documentRevision &&
    isValidRecord(record)
  );
}

export function summarizeRuntimeEvidence(
  records: readonly RuntimeEvidenceRecord[],
  context: RuntimeEvidenceContext
): RuntimeEvidenceSummary {
  const matched = matchRuntimeEvidence(records, context);
  const matchedKinds = new Set(matched.map((record) => record.kind));
  return {
    browserUi: matchedKinds.has("browser-ui"),
    keyboardAndZoom: matchedKinds.has("keyboard-zoom"),
    visualReview: matchedKinds.has("visual-review"),
    accessibility: matchedKinds.has("accessibility"),
    interaction: matchedKinds.has("interaction"),
    exportComparison: matchedKinds.has("export-comparison"),
    performance: matchedKinds.has("performance"),
    productionGates: matchedKinds.has("production-gates"),
    matchedRecordIds: matched.map((record) => record.id)
  };
}
