import type { DeckExportReport, ExportCapabilityState } from "@deckory/renderer";
import {
  exportCapabilityStateLabels,
  exportTargetFields
} from "./inspector/field-registry";
import styles from "./export-capability-panel.module.css";

function countLabel(count: number, state: ExportCapabilityState): string {
  if (state === "native-editable") return `${count} editable`;
  if (state === "unsupported") return `${count} không hỗ trợ`;
  return `${count} ${state}`;
}

export function ExportCapabilityPanel({
  report,
  selectedElementId
}: {
  report: DeckExportReport;
  selectedElementId?: string;
}) {
  const selected = selectedElementId
    ? report.elements.find((element) => element.elementId === selectedElementId)
    : undefined;

  return (
    <section className={styles.root} data-export-capability-panel="true" aria-labelledby="studio-v2-export-title">
      <header className={styles.header}>
        <div>
          <span className="studio-panel-label">Export</span>
          <h2 id="studio-v2-export-title">Khả năng xuất</h2>
        </div>
        <p>{report.elementCount} thành phần · revision {report.revision}</p>
      </header>

      <dl className={styles.summary}>
        {exportTargetFields.map(({ id, label }) => {
          const counts = report.targets[id];
          const visible = [
            ["native", counts.native] as const,
            ["native-editable", counts.nativeEditable] as const,
            ["fallback", counts.fallback] as const,
            ["unsupported", counts.unsupported] as const
          ].filter((entry) => entry[1] > 0);
          return (
            <div key={id}>
              <dt>{label}</dt>
              <dd>
                {visible.length > 0
                  ? visible.map(([state, count]) => <span data-state={state} key={state}>{countLabel(count, state)}</span>)
                  : <span>0 thành phần</span>}
              </dd>
            </div>
          );
        })}
      </dl>

      {selected ? (
        <div className={styles.detail}>
          <header>
            <h3>{selected.elementName}</h3>
            <small>
              {selected.responsible.id}{selected.responsible.version ? `@${selected.responsible.version}` : ""}
            </small>
          </header>
          <div className={styles.detailGrid}>
            {exportTargetFields.map(({ id, label }) => (
              <div key={id}>
                <strong>{label}</strong>
                <span className={styles.state} data-state={selected[id]}>{exportCapabilityStateLabels[selected[id]]}</span>
                <p>{selected.reasons[id] ?? "Không có mô tả capability."}</p>
              </div>
            ))}
          </div>
          {selected.fallback ? (
            <div className={styles.fallback}>
              Fallback {selected.fallback.type.toUpperCase()} · asset {selected.fallback.assetId}
            </div>
          ) : null}
        </div>
      ) : (
        <p className={styles.empty}>Chọn một thành phần để xem chi tiết theo định dạng.</p>
      )}

      <p className={styles.disclosure}>Fallback và unsupported luôn được công bố trước khi xuất; không được trình bày như native hoặc editable.</p>
    </section>
  );
}
