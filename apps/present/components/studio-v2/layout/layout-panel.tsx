"use client";

import styles from "./layout-panel.module.css";

export type StudioLayoutMode = "freeform" | "constraint" | "stack" | "grid";
export type StudioSizingMode = "fixed" | "hug" | "fill";

export type LayoutPanelValue = {
  mode: StudioLayoutMode;
  direction?: "horizontal" | "vertical";
  wrap?: boolean;
  columns?: number;
  gap: number;
  padding: { top: number; right: number; bottom: number; left: number };
  align: "start" | "center" | "end" | "stretch";
  justify: "start" | "center" | "end" | "space-between";
  childWidth: StudioSizingMode;
  childHeight: StudioSizingMode;
  horizontalConstraint: "left" | "right" | "center" | "stretch" | "scale";
  verticalConstraint: "top" | "bottom" | "center" | "stretch" | "scale";
};

export type LayoutPanelDiagnostic = {
  code: string;
  message: string;
  recommendation?: string;
};

export type LayoutPanelProps = {
  value: LayoutPanelValue;
  diagnostic?: LayoutPanelDiagnostic;
  onChange: (patch: Partial<LayoutPanelValue>) => void;
  onDetach: () => void;
};

const modes: Array<{ value: StudioLayoutMode; label: string; description: string }> = [
  { value: "freeform", label: "Tự do", description: "Giữ frame tuyệt đối và cho phép kéo độc lập." },
  { value: "constraint", label: "Constraints", description: "Neo thành phần khi khung cha thay đổi." },
  { value: "stack", label: "Stack", description: "Sắp xếp theo hàng hoặc cột với gap nhất quán." },
  { value: "grid", label: "Lưới", description: "Phân bổ thành phần theo hàng và cột rõ ràng." }
];

function NumberControl({
  label,
  value,
  min = 0,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function SizingSelect({ label, value, onChange }: { label: string; value: StudioSizingMode; onChange: (value: StudioSizingMode) => void }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value as StudioSizingMode)}>
        <option value="fixed">Cố định</option>
        <option value="hug">Ôm nội dung</option>
        <option value="fill">Lấp đầy khung</option>
      </select>
    </label>
  );
}

export function LayoutPanel({ value, diagnostic, onChange, onDetach }: LayoutPanelProps) {
  const patchPadding = (side: keyof LayoutPanelValue["padding"], nextValue: number) => {
    onChange({ padding: { ...value.padding, [side]: nextValue } });
  };

  return (
    <section className={styles.root} aria-labelledby="studio-v2-layout-title">
      <header>
        <h2 id="studio-v2-layout-title">Layout</h2>
        <p>Điều khiển cấu trúc mà không chỉnh JSON thô.</p>
      </header>

      {diagnostic ? (
        <div role="alert" className={styles.diagnostic} data-diagnostic-code={diagnostic.code}>
          <strong>Không thể áp dụng bố cục hiện tại</strong>
          <p>{diagnostic.message}</p>
          {diagnostic.recommendation ? <p>Khuyến nghị: {diagnostic.recommendation}</p> : null}
        </div>
      ) : null}

      <fieldset>
        <legend>Chế độ bố cục</legend>
        {modes.map((mode) => (
          <label key={mode.value}>
            <input
              type="radio"
              name="studio-layout-mode"
              value={mode.value}
              checked={value.mode === mode.value}
              onChange={() => onChange({ mode: mode.value })}
            />
            <span>{mode.label}</span>
            <small>{mode.description}</small>
          </label>
        ))}
      </fieldset>

      {value.mode === "stack" ? (
        <fieldset>
          <legend>Luồng stack</legend>
          <label>
            <span>Hướng sắp xếp</span>
            <select
              value={value.direction ?? "horizontal"}
              onChange={(event) => onChange({ direction: event.currentTarget.value as "horizontal" | "vertical" })}
            >
              <option value="horizontal">Ngang</option>
              <option value="vertical">Dọc</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={Boolean(value.wrap)}
              onChange={(event) => onChange({ wrap: event.currentTarget.checked })}
            />
            <span>Tự xuống dòng</span>
          </label>
        </fieldset>
      ) : null}

      {value.mode === "grid" ? (
        <fieldset>
          <legend>Cấu trúc lưới</legend>
          <NumberControl label="Số cột" value={value.columns ?? 2} min={1} onChange={(columns) => onChange({ columns })} />
        </fieldset>
      ) : null}

      <fieldset>
        <legend>Khoảng cách và padding</legend>
        <NumberControl label="Khoảng cách" value={value.gap} onChange={(gap) => onChange({ gap })} />
        <NumberControl label="Padding trên" value={value.padding.top} onChange={(next) => patchPadding("top", next)} />
        <NumberControl label="Padding phải" value={value.padding.right} onChange={(next) => patchPadding("right", next)} />
        <NumberControl label="Padding dưới" value={value.padding.bottom} onChange={(next) => patchPadding("bottom", next)} />
        <NumberControl label="Padding trái" value={value.padding.left} onChange={(next) => patchPadding("left", next)} />
      </fieldset>

      <fieldset>
        <legend>Căn chỉnh và phân bố</legend>
        <label>
          <span>Căn theo trục phụ</span>
          <select value={value.align} onChange={(event) => onChange({ align: event.currentTarget.value as LayoutPanelValue["align"] })}>
            <option value="start">Đầu</option>
            <option value="center">Giữa</option>
            <option value="end">Cuối</option>
            <option value="stretch">Kéo giãn</option>
          </select>
        </label>
        <label>
          <span>Phân bố theo trục chính</span>
          <select value={value.justify} onChange={(event) => onChange({ justify: event.currentTarget.value as LayoutPanelValue["justify"] })}>
            <option value="start">Đầu</option>
            <option value="center">Giữa</option>
            <option value="end">Cuối</option>
            <option value="space-between">Cách đều</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Kích thước thành phần con</legend>
        <SizingSelect label="Chiều rộng" value={value.childWidth} onChange={(childWidth) => onChange({ childWidth })} />
        <SizingSelect label="Chiều cao" value={value.childHeight} onChange={(childHeight) => onChange({ childHeight })} />
      </fieldset>

      <fieldset>
        <legend>Constraints khi resize khung cha</legend>
        <label>
          <span>Neo ngang</span>
          <select
            value={value.horizontalConstraint}
            onChange={(event) => onChange({ horizontalConstraint: event.currentTarget.value as LayoutPanelValue["horizontalConstraint"] })}
          >
            <option value="left">Trái</option>
            <option value="right">Phải</option>
            <option value="center">Giữa</option>
            <option value="stretch">Kéo giãn</option>
            <option value="scale">Tỷ lệ</option>
          </select>
        </label>
        <label>
          <span>Neo dọc</span>
          <select
            value={value.verticalConstraint}
            onChange={(event) => onChange({ verticalConstraint: event.currentTarget.value as LayoutPanelValue["verticalConstraint"] })}
          >
            <option value="top">Trên</option>
            <option value="bottom">Dưới</option>
            <option value="center">Giữa</option>
            <option value="stretch">Kéo giãn</option>
            <option value="scale">Tỷ lệ</option>
          </select>
        </label>
      </fieldset>

      <button
        type="button"
        onClick={onDetach}
        disabled={value.mode !== "stack" && value.mode !== "grid"}
        title={value.mode === "stack" || value.mode === "grid" ? "Giữ frame hiện tại và tách thành phần" : "Chỉ dùng khi thành phần đang ở auto layout"}
      >
        Tách khỏi auto layout
      </button>
    </section>
  );
}
