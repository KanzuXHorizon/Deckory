import { z } from "zod";

export const EvidenceStatusSchema = z.enum([
  "verified",
  "unverified",
  "illustrative",
  "stale"
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

export const DataSourceKindSchema = z.enum([
  "manual",
  "csv",
  "json",
  "table",
  "document",
  "code",
  "image",
  "url-reference"
]);
export type DataSourceKind = z.infer<typeof DataSourceKindSchema>;

export const DeckDataSourceSchema = z
  .object({
    id: z.string().trim().min(1),
    kind: DataSourceKindSchema,
    label: z.string().trim().min(1),
    localAssetId: z.string().trim().min(1).optional(),
    referenceUrl: z.string().url().optional(),
    importedAt: z.string().trim().min(1).optional(),
    sourceDate: z.string().trim().min(1).optional(),
    status: EvidenceStatusSchema,
    illustrativeLabel: z.string().trim().min(1).optional(),
    notes: z.string().trim().optional(),
    privacyNote: z.string().trim().optional(),
    copyrightNote: z.string().trim().optional()
  })
  .superRefine((source, context) => {
    if (source.kind === "url-reference" && !source.referenceUrl) {
      context.addIssue({
        code: "custom",
        path: ["referenceUrl"],
        message: "URL-reference source requires referenceUrl metadata."
      });
    }
    if (source.kind !== "url-reference" && source.referenceUrl) {
      context.addIssue({
        code: "custom",
        path: ["referenceUrl"],
        message: "referenceUrl is allowed only for url-reference metadata sources."
      });
    }
  });
export type DeckDataSource = z.infer<typeof DeckDataSourceSchema>;

export const EvidenceRecordSchema = z.object({
  id: z.string().trim().min(1),
  sourceId: z.string().trim().min(1),
  label: z.string().trim().min(1),
  locator: z.string().trim().min(1).optional(),
  excerpt: z.string().trim().min(1).optional(),
  unit: z.string().trim().min(1).optional(),
  period: z.string().trim().min(1).optional(),
  sample: z.string().trim().min(1).optional(),
  confidence: z.enum(["high", "medium", "low"]).optional()
});
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;

export const ClaimRecordSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1),
  slideId: z.string().trim().min(1),
  elementId: z.string().trim().min(1).optional(),
  evidenceIds: z.array(z.string().trim().min(1)),
  status: z.enum([
    "supported",
    "partially-supported",
    "unsupported",
    "illustrative"
  ])
});
export type ClaimRecord = z.infer<typeof ClaimRecordSchema>;

export const DataValueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null()
]);
export type DataValue = z.infer<typeof DataValueSchema>;
export type DataRow = Record<string, DataValue>;

export const DatasetColumnSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  type: z.enum(["string", "number", "boolean", "date"])
});
export type DatasetColumn = z.infer<typeof DatasetColumnSchema>;

export const TransformLineageStepSchema = z.object({
  transformId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  version: z.number().int().positive(),
  inputRowCount: z.number().int().nonnegative(),
  outputRowCount: z.number().int().nonnegative()
});
export type TransformLineageStep = z.infer<typeof TransformLineageStepSchema>;

export const DatasetLineageSchema = z.object({
  sourceDatasetId: z.string().trim().min(1),
  sourceIds: z.array(z.string().trim().min(1)),
  transforms: z.array(TransformLineageStepSchema)
});
export type DatasetLineage = z.infer<typeof DatasetLineageSchema>;

export const DatasetSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  sourceIds: z.array(z.string().trim().min(1)).min(1),
  status: EvidenceStatusSchema,
  illustrativeLabel: z.string().trim().min(1).optional(),
  columns: z.array(DatasetColumnSchema),
  rows: z.array(z.record(z.string(), DataValueSchema)),
  lineage: DatasetLineageSchema.optional()
});
export type Dataset = z.infer<typeof DatasetSchema>;

export const VisualDataBindingSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.enum(["chart", "diagram", "table"]),
  slideId: z.string().trim().min(1),
  elementId: z.string().trim().min(1).optional(),
  datasetId: z.string().trim().min(1).optional(),
  claimIds: z.array(z.string().trim().min(1)).default([])
});
export type VisualDataBinding = z.infer<typeof VisualDataBindingSchema>;

export const EvidenceDomainSchema = z.object({
  sources: z.array(DeckDataSourceSchema),
  evidence: z.array(EvidenceRecordSchema),
  claims: z.array(ClaimRecordSchema),
  datasets: z.array(DatasetSchema),
  visualBindings: z.array(VisualDataBindingSchema)
});
export type EvidenceDomain = z.infer<typeof EvidenceDomainSchema>;

export type EvidenceDomainDiagnosticCode =
  | "duplicate-id"
  | "missing-source"
  | "missing-evidence"
  | "missing-dataset"
  | "missing-claim"
  | "illustrative-label-required"
  | "supported-claim-without-evidence";

export type EvidenceDomainDiagnostic = {
  code: EvidenceDomainDiagnosticCode;
  severity: "warning" | "error";
  recordId: string;
  message: string;
  recommendation: string;
};

function pushDuplicateDiagnostics<T extends { id: string }>(
  records: readonly T[],
  diagnostics: EvidenceDomainDiagnostic[]
): void {
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) {
      diagnostics.push({
        code: "duplicate-id",
        severity: "error",
        recordId: record.id,
        message: `ID bị trùng trong evidence domain: ${record.id}.`,
        recommendation: "Đổi sang stable ID duy nhất trước khi tích hợp dữ liệu."
      });
    }
    seen.add(record.id);
  }
}

export function validateEvidenceDomain(
  domain: EvidenceDomain
): { ok: boolean; diagnostics: EvidenceDomainDiagnostic[] } {
  const diagnostics: EvidenceDomainDiagnostic[] = [];
  pushDuplicateDiagnostics(domain.sources, diagnostics);
  pushDuplicateDiagnostics(domain.evidence, diagnostics);
  pushDuplicateDiagnostics(domain.claims, diagnostics);
  pushDuplicateDiagnostics(domain.datasets, diagnostics);
  pushDuplicateDiagnostics(domain.visualBindings, diagnostics);

  const sourceIds = new Set(domain.sources.map((source) => source.id));
  const evidenceIds = new Set(domain.evidence.map((record) => record.id));
  const claimIds = new Set(domain.claims.map((claim) => claim.id));
  const datasetIds = new Set(domain.datasets.map((dataset) => dataset.id));

  for (const source of domain.sources) {
    if (source.status === "illustrative" && !source.illustrativeLabel) {
      diagnostics.push({
        code: "illustrative-label-required",
        severity: "error",
        recordId: source.id,
        message: `Nguồn minh hoạ ${source.id} thiếu nhãn hiển thị.`,
        recommendation: "Thêm illustrativeLabel để Presenter và export không trình bày fixture như dữ liệu thật."
      });
    }
  }

  for (const record of domain.evidence) {
    if (!sourceIds.has(record.sourceId)) {
      diagnostics.push({
        code: "missing-source",
        severity: "error",
        recordId: record.id,
        message: `Evidence ${record.id} tham chiếu source không tồn tại: ${record.sourceId}.`,
        recommendation: "Khôi phục source hoặc cập nhật sourceId trước khi dùng evidence."
      });
    }
  }

  for (const claim of domain.claims) {
    for (const evidenceId of claim.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        diagnostics.push({
          code: "missing-evidence",
          severity: "error",
          recordId: claim.id,
          message: `Claim ${claim.id} tham chiếu evidence không tồn tại: ${evidenceId}.`,
          recommendation: "Liên kết claim tới evidence hợp lệ hoặc đổi status thành unsupported/illustrative."
        });
      }
    }
    if (
      (claim.status === "supported" || claim.status === "partially-supported") &&
      claim.evidenceIds.length === 0
    ) {
      diagnostics.push({
        code: "supported-claim-without-evidence",
        severity: "error",
        recordId: claim.id,
        message: `Claim ${claim.id} được đánh dấu ${claim.status} nhưng không có evidence.`,
        recommendation: "Bổ sung evidenceIds hoặc hạ evidence status đúng với dữ liệu hiện có."
      });
    }
  }

  for (const dataset of domain.datasets) {
    if (dataset.status === "illustrative" && !dataset.illustrativeLabel) {
      diagnostics.push({
        code: "illustrative-label-required",
        severity: "error",
        recordId: dataset.id,
        message: `Dataset minh hoạ ${dataset.id} thiếu nhãn hiển thị.`,
        recommendation: "Thêm illustrativeLabel để mọi visual dùng dataset giữ nhãn minh hoạ."
      });
    }
    for (const sourceId of dataset.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        diagnostics.push({
          code: "missing-source",
          severity: "error",
          recordId: dataset.id,
          message: `Dataset ${dataset.id} tham chiếu source không tồn tại: ${sourceId}.`,
          recommendation: "Khôi phục source hoặc cập nhật sourceIds của dataset."
        });
      }
    }
  }

  for (const binding of domain.visualBindings) {
    if (binding.datasetId && !datasetIds.has(binding.datasetId)) {
      diagnostics.push({
        code: "missing-dataset",
        severity: "error",
        recordId: binding.id,
        message: `Visual ${binding.id} tham chiếu dataset không tồn tại: ${binding.datasetId}.`,
        recommendation: "Bind visual tới dataset hợp lệ hoặc chuyển sang explicit manual data có nhãn."
      });
    }
    for (const claimId of binding.claimIds) {
      if (!claimIds.has(claimId)) {
        diagnostics.push({
          code: "missing-claim",
          severity: "error",
          recordId: binding.id,
          message: `Visual ${binding.id} tham chiếu claim không tồn tại: ${claimId}.`,
          recommendation: "Khôi phục claim hoặc xoá claimId khỏi visual binding."
        });
      }
    }
  }

  return { ok: diagnostics.length === 0, diagnostics };
}
