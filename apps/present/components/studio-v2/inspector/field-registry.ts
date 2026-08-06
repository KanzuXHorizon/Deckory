import type { ExportCapabilityState, ExportTarget } from "@deckory/renderer";

export type InspectorFieldGroup = {
  id: "content" | "layout" | "visual-intelligence" | "export" | "quality";
  label: string;
  description: string;
};

export const inspectorFieldRegistry: readonly InspectorFieldGroup[] = [
  { id: "content", label: "Nội dung", description: "Copy, dữ liệu và semantic metadata của thành phần." },
  { id: "layout", label: "Layout", description: "Frame, constraints và auto-layout." },
  { id: "visual-intelligence", label: "Visual Intelligence", description: "Recommendation và evidence lineage." },
  { id: "export", label: "Khả năng xuất", description: "Native, editable, fallback và unsupported theo định dạng." },
  { id: "quality", label: "Quality gate", description: "Scorecard cấu trúc và runtime evidence." }
] as const;

export const exportTargetFields: readonly { id: ExportTarget; label: string }[] = [
  { id: "html", label: "HTML" },
  { id: "svg", label: "SVG" },
  { id: "png", label: "PNG" },
  { id: "pdf", label: "PDF" },
  { id: "pptx", label: "PPTX" }
] as const;

export const exportCapabilityStateLabels: Record<ExportCapabilityState, string> = {
  native: "Native",
  "native-editable": "Editable",
  fallback: "Fallback",
  unsupported: "Không hỗ trợ"
};
