import type { DeckAuditReportV2 } from "@deckory/audit";
import styles from "./quality-summary-v2.module.css";

const readinessLabels: Record<DeckAuditReportV2["scorecard"]["readiness"], string> = {
  draft: "Chưa sẵn sàng",
  review: "Cần review",
  "demo-ready": "Sẵn sàng demo",
  "production-ready": "Sẵn sàng production"
};

export function QualitySummaryV2({
  report,
  compact = false
}: {
  report: DeckAuditReportV2;
  compact?: boolean;
}) {
  const pendingDimensions = report.scorecard.dimensions.filter(
    (dimension) => dimension.confidence === "manual-review-required"
  );
  const evidencePending = pendingDimensions.length > 0;
  const state = report.summary.errorCount > 0
    ? "blocked"
    : evidencePending
      ? "evidence-pending"
      : report.scorecard.readiness;
  const stateLabel = evidencePending
    ? "Chờ bằng chứng runtime/manual"
    : readinessLabels[report.scorecard.readiness];
  const visibleReadinessLabel = evidencePending && report.scorecard.readiness === "production-ready"
    ? "Chưa thể xác nhận production"
    : readinessLabels[report.scorecard.readiness];
  const topIssues = report.issues.slice(0, 3);

  return (
    <section
      className={styles.root}
      data-v2-quality-summary="true"
      data-quality-density={compact ? "compact" : "comfortable"}
      data-quality-state={state}
      aria-label={`Chất lượng Deckory V2: ${report.scorecard.overallScore} trên 10`}
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <span>Quality gate V2 · 20 tiêu chí</span>
          <h2>{report.title}</h2>
        </div>
        <div className={styles.score}>
          <span>Điểm hiện tại</span>
          <b>{report.scorecard.overallScore}<small>/10</small></b>
        </div>
      </header>

      <div className={styles.state} role="status">
        <span>{stateLabel}</span>
        <small>Readiness: {visibleReadinessLabel}</small>
      </div>

      {pendingDimensions.length > 0 ? (
        <div className={styles.pending}>
          <strong>Category còn chờ evidence</strong>
          <ul>
            {pendingDimensions.map((dimension) => <li key={dimension.id}>{dimension.label}</li>)}
          </ul>
        </div>
      ) : null}

      <div className={styles.issues}>
        <strong>Ưu tiên tiếp theo</strong>
        {topIssues.length > 0 ? (
          <ul>{topIssues.map((item, index) => <li key={`${item.code}-${item.slideId ?? "deck"}-${index}`}>{item.message}</li>)}</ul>
        ) : (
          <p className={styles.clean}>Không có lỗi cấu trúc đang mở.</p>
        )}
      </div>
    </section>
  );
}
