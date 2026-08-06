export function selectionStatusMessage(selectedIds: readonly string[], primaryName?: string): string {
  if (selectedIds.length === 0) return "Chưa chọn thành phần nào";
  if (selectedIds.length === 1) return primaryName ? `Đã chọn ${primaryName}` : "Đã chọn 1 thành phần";
  return `Đã chọn ${selectedIds.length} thành phần`;
}

export function SelectionStatus({
  selectedIds,
  primaryName
}: {
  selectedIds: readonly string[];
  primaryName?: string;
}) {
  return (
    <output
      aria-live="polite"
      aria-atomic="true"
      data-studio-overlay="selection-status"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0
      }}
    >
      {selectionStatusMessage(selectedIds, primaryName)}
    </output>
  );
}
