import type {
  Dataset,
  EvidenceDomain,
  VisualDataBinding
} from "./domain";

export type SourceDependentKind =
  | "evidence"
  | "claim"
  | "dataset"
  | "chart"
  | "diagram"
  | "table";

export type SourceDependent = {
  kind: SourceDependentKind;
  id: string;
  slideId?: string;
  via?: string;
};

const KIND_ORDER: Record<SourceDependentKind, number> = {
  evidence: 0,
  claim: 1,
  dataset: 2,
  chart: 3,
  diagram: 4,
  table: 5
};

function bindingDependsOnSource(
  binding: VisualDataBinding,
  datasetIds: ReadonlySet<string>,
  claimIds: ReadonlySet<string>
): boolean {
  return Boolean(
    (binding.datasetId && datasetIds.has(binding.datasetId)) ||
      binding.claimIds.some((claimId) => claimIds.has(claimId))
  );
}

export function traceSourceDependents(
  domain: EvidenceDomain,
  sourceId: string
): SourceDependent[] {
  const evidenceIds = new Set(
    domain.evidence
      .filter((record) => record.sourceId === sourceId)
      .map((record) => record.id)
  );
  const claimIds = new Set(
    domain.claims
      .filter((claim) => claim.evidenceIds.some((evidenceId) => evidenceIds.has(evidenceId)))
      .map((claim) => claim.id)
  );
  const datasetIds = new Set(
    domain.datasets
      .filter((dataset) => dataset.sourceIds.includes(sourceId))
      .map((dataset) => dataset.id)
  );
  const dependents: SourceDependent[] = [];

  for (const record of domain.evidence) {
    if (evidenceIds.has(record.id)) {
      dependents.push({ kind: "evidence", id: record.id, via: sourceId });
    }
  }
  for (const claim of domain.claims) {
    if (claimIds.has(claim.id)) {
      dependents.push({ kind: "claim", id: claim.id, slideId: claim.slideId, via: sourceId });
    }
  }
  for (const dataset of domain.datasets) {
    if (datasetIds.has(dataset.id)) {
      dependents.push({ kind: "dataset", id: dataset.id, via: sourceId });
    }
  }
  for (const binding of domain.visualBindings) {
    if (bindingDependsOnSource(binding, datasetIds, claimIds)) {
      const via = binding.datasetId ?? [...binding.claimIds].sort()[0];
      dependents.push({
        kind: binding.kind,
        id: binding.id,
        slideId: binding.slideId,
        ...(via ? { via } : {})
      });
    }
  }

  return dependents.sort((left, right) => {
    const kindDifference = KIND_ORDER[left.kind] - KIND_ORDER[right.kind];
    if (kindDifference !== 0) return kindDifference;
    return left.id.localeCompare(right.id, "en");
  });
}

export type ResolvedDatasetReference = {
  dataset: Dataset;
  dependentVisuals: VisualDataBinding[];
};

export function resolveDataset(
  domain: EvidenceDomain,
  datasetId: string
): ResolvedDatasetReference {
  const dataset = domain.datasets.find((candidate) => candidate.id === datasetId);
  if (!dataset) {
    throw new Error(`Dataset không tồn tại: ${datasetId}.`);
  }
  return {
    dataset: {
      ...dataset,
      columns: dataset.columns.map((column) => ({ ...column })),
      rows: dataset.rows.map((row) => ({ ...row })),
      sourceIds: [...dataset.sourceIds],
      ...(dataset.lineage
        ? {
            lineage: {
              ...dataset.lineage,
              sourceIds: [...dataset.lineage.sourceIds],
              transforms: dataset.lineage.transforms.map((step) => ({ ...step }))
            }
          }
        : {})
    },
    dependentVisuals: domain.visualBindings
      .filter((binding) => binding.datasetId === datasetId)
      .map((binding) => ({ ...binding, claimIds: [...binding.claimIds] }))
  };
}
