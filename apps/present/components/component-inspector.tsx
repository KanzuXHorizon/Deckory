import type { ReactNode } from "react";
import type { SlideComponent } from "@deckory/schema";

export function ComponentInspector({
  component,
  onChange
}: {
  component: SlideComponent;
  onChange: (component: SlideComponent) => void;
}) {
  const update = (props: Record<string, unknown>) => {
    onChange({ ...component, props: { ...component.props, ...props } } as SlideComponent);
  };

  switch (component.type) {
    case "heading":
      return (
        <InspectorSection title="Nội dung heading" description="Heading đặt kết luận của slide lên trước.">
          <TextField label="Kicker" value={component.props.eyebrow ?? ""} onChange={(value) => update({ eyebrow: optional(value) })} />
          <TextAreaField label="Tiêu đề" value={component.props.title} onChange={(value) => update({ title: value })} rows={3} />
          <TextField label="Phần nhấn" value={component.props.emphasis ?? ""} onChange={(value) => update({ emphasis: optional(value) })} />
          <TextAreaField label="Mô tả" value={component.props.description ?? ""} onChange={(value) => update({ description: optional(value) })} rows={3} />
        </InspectorSection>
      );
    case "statement":
      return (
        <InspectorSection title="Statement" description="Một luận điểm mạnh, ít chi tiết phụ.">
          <TextAreaField label="Trích dẫn" value={component.props.quote} onChange={(value) => update({ quote: value })} rows={5} />
          <TextField label="Nguồn hoặc byline" value={component.props.byline ?? ""} onChange={(value) => update({ byline: optional(value) })} />
        </InspectorSection>
      );
    case "metric-grid":
      return (
        <InspectorSection title="Metric grid" description="Mỗi metric cần trả lời một câu hỏi riêng.">
          {component.props.metrics.map((metric, index) => (
            <FieldGroup key={`${metric.label}-${index}`} label={`Metric ${index + 1}`}>
              <div className="inspector-field-grid inspector-field-grid--two">
                <TextField label="Giá trị" value={metric.value} onChange={(value) => updateMetric(component, index, { value }, onChange)} />
                <SelectField label="Tone" value={metric.tone ?? "cobalt"} options={["cobalt", "teal", "amber"]} onChange={(value) => updateMetric(component, index, { tone: value as "cobalt" | "teal" | "amber" }, onChange)} />
              </div>
              <TextField label="Nhãn" value={metric.label} onChange={(value) => updateMetric(component, index, { label: value }, onChange)} />
              <TextAreaField label="Ghi chú" value={metric.note} onChange={(value) => updateMetric(component, index, { note: value }, onChange)} rows={2} />
            </FieldGroup>
          ))}
        </InspectorSection>
      );
    case "chart":
      return (
        <InspectorSection title="Chart" description="Chọn chart theo quan hệ dữ liệu cần giải thích.">
          <div className="inspector-field-grid inspector-field-grid--two">
            <SelectField label="Kiểu chart" value={component.props.variant ?? "bar"} options={["bar", "line", "area", "donut"]} onChange={(value) => update({ variant: value })} />
            <SelectField label="Hiện giá trị" value={component.props.showValues === false ? "no" : "yes"} options={["yes", "no"]} labels={{ yes: "Có", no: "Không" }} onChange={(value) => update({ showValues: value === "yes" })} />
          </div>
          <TextField label="Tiêu đề chart" value={component.props.title} onChange={(value) => update({ title: value })} />
          <TextField label="Đơn vị" value={component.props.unit} onChange={(value) => update({ unit: value })} />
          {component.props.values.map((item, index) => (
            <FieldGroup key={`${item.label}-${index}`} label={`Điểm dữ liệu ${index + 1}`}>
              <TextField label="Nhãn" value={item.label} onChange={(value) => updateChartValue(component, index, { label: value }, onChange)} />
              <div className="inspector-field-grid inspector-field-grid--two">
                <NumberField label="Giá trị" value={item.value} onChange={(value) => updateChartValue(component, index, { value }, onChange)} />
                <SelectField label="Nhấn mạnh" value={item.highlight ? "yes" : "no"} options={["no", "yes"]} labels={{ yes: "Có", no: "Không" }} onChange={(value) => updateChartValue(component, index, { highlight: value === "yes" }, onChange)} />
              </div>
            </FieldGroup>
          ))}
        </InspectorSection>
      );
    case "table":
      return (
        <InspectorSection title="Table" description="Bảng dùng cho dữ liệu cần đối chiếu chính xác theo hàng và cột.">
          <TextField label="Tiêu đề" value={component.props.title} onChange={(value) => update({ title: value })} />
          <TextField label="Tên cột (phân cách bằng |)" value={component.props.columns.join(" | ")} onChange={(value) => update({ columns: splitCells(value) })} />
          {component.props.rows.map((row, index) => (
            <FieldGroup key={`${row.cells.join("-")}-${index}`} label={`Hàng ${index + 1}`}>
              <TextField label="Ô dữ liệu (phân cách bằng |)" value={row.cells.join(" | ")} onChange={(value) => updateTableRow(component, index, { cells: splitCells(value) }, onChange)} />
              <SelectField label="Nhấn mạnh" value={row.highlight ? "yes" : "no"} options={["no", "yes"]} labels={{ yes: "Có", no: "Không" }} onChange={(value) => updateTableRow(component, index, { highlight: value === "yes" }, onChange)} />
            </FieldGroup>
          ))}
          <TextAreaField label="Ghi chú" value={component.props.note ?? ""} onChange={(value) => update({ note: optional(value) })} rows={2} />
        </InspectorSection>
      );
    case "code":
      return (
        <InspectorSection title="Code" description="Code block dành cho bằng chứng kỹ thuật ngắn, có dòng cần chú ý.">
          <div className="inspector-field-grid inspector-field-grid--two">
            <TextField label="Tiêu đề" value={component.props.title} onChange={(value) => update({ title: value })} />
            <TextField label="Ngôn ngữ" value={component.props.language} onChange={(value) => update({ language: value })} />
          </div>
          <TextAreaField label="Mã nguồn" value={component.props.code} onChange={(value) => update({ code: value })} rows={9} />
          <TextField label="Dòng highlight (1, 2, 4)" value={(component.props.highlightLines ?? []).join(", ")} onChange={(value) => update({ highlightLines: parseLineNumbers(value) })} />
          <SelectField label="Hiện số dòng" value={component.props.showLineNumbers === false ? "no" : "yes"} options={["yes", "no"]} labels={{ yes: "Có", no: "Không" }} onChange={(value) => update({ showLineNumbers: value === "yes" })} />
          <TextAreaField label="Caption" value={component.props.caption ?? ""} onChange={(value) => update({ caption: optional(value) })} rows={2} />
        </InspectorSection>
      );
    case "comparison":
      return (
        <InspectorSection title="Comparison" description="Hai phía phải dùng cùng tiêu chí để so sánh công bằng.">
          {(["left", "right"] as const).map((side) => (
            <FieldGroup key={side} label={side === "left" ? "Vế trái" : "Vế phải"}>
              <TextField label="Kicker" value={component.props[side].eyebrow} onChange={(value) => updateComparison(component, side, { eyebrow: value }, onChange)} />
              <TextField label="Tiêu đề" value={component.props[side].title} onChange={(value) => updateComparison(component, side, { title: value }, onChange)} />
              {component.props[side].points.map((point, index) => (
                <TextField key={`${side}-${index}`} label={`Điểm ${index + 1}`} value={point} onChange={(value) => updateComparisonPoint(component, side, index, value, onChange)} />
              ))}
            </FieldGroup>
          ))}
        </InspectorSection>
      );
    case "process":
      return (
        <InspectorSection title="Process" description="Mỗi bước cần một hành động và kết quả rõ.">
          {component.props.steps.map((step, index) => (
            <FieldGroup key={`${step.title}-${index}`} label={`Bước ${index + 1}`}>
              <div className="inspector-field-grid inspector-field-grid--two">
                <TextField label="Tiêu đề" value={step.title} onChange={(value) => updateProcessStep(component, index, { title: value }, onChange)} />
                <SelectField label="Biểu tượng" value={step.icon} options={["data", "system", "people", "sparkle"]} onChange={(value) => updateProcessStep(component, index, { icon: value as typeof step.icon }, onChange)} />
              </div>
              <TextAreaField label="Mô tả" value={step.note} onChange={(value) => updateProcessStep(component, index, { note: value }, onChange)} rows={2} />
            </FieldGroup>
          ))}
        </InspectorSection>
      );
    case "architecture":
      return (
        <InspectorSection title="Architecture" description="Các layer đi từ input đến source of truth rồi output.">
          {component.props.layers.map((layer, index) => (
            <FieldGroup key={`${layer.label}-${index}`} label={`Layer ${index + 1}`}>
              <div className="inspector-field-grid inspector-field-grid--two">
                <TextField label="Nhãn" value={layer.label} onChange={(value) => updateArchitectureLayer(component, index, { label: value }, onChange)} />
                <SelectField label="Accent" value={layer.accent ? "yes" : "no"} options={["no", "yes"]} labels={{ yes: "Có", no: "Không" }} onChange={(value) => updateArchitectureLayer(component, index, { accent: value === "yes" }, onChange)} />
              </div>
              {layer.items.map((item, itemIndex) => (
                <TextField key={`${index}-${itemIndex}`} label={`Item ${itemIndex + 1}`} value={item} onChange={(value) => updateArchitectureItem(component, index, itemIndex, value, onChange)} />
              ))}
            </FieldGroup>
          ))}
        </InspectorSection>
      );
    case "insight":
      return (
        <InspectorSection title="Insight" description="Insight diễn giải kết luận mà chart hoặc metric cần dẫn tới.">
          <div className="inspector-field-grid inspector-field-grid--two">
            <TextField label="Nhãn" value={component.props.label} onChange={(value) => update({ label: value })} />
            <SelectField label="Tone" value={component.props.tone ?? "cobalt"} options={["cobalt", "teal", "amber", "neutral"]} onChange={(value) => update({ tone: value })} />
          </div>
          <TextField label="Metric" value={component.props.metric ?? ""} onChange={(value) => update({ metric: optional(value) })} />
          <TextAreaField label="Tiêu đề" value={component.props.title} onChange={(value) => update({ title: value })} rows={2} />
          <TextAreaField label="Diễn giải" value={component.props.description} onChange={(value) => update({ description: value })} rows={4} />
        </InspectorSection>
      );
    case "evidence-footer":
      return (
        <InspectorSection title="Evidence footer" description="Nguồn phải rõ hoặc ghi nhãn fixture minh hoạ.">
          <TextField label="Nguồn" value={component.props.source} onChange={(value) => update({ source: value })} />
          <TextField label="Số trang" value={component.props.page ?? ""} onChange={(value) => update({ page: optional(value) })} />
        </InspectorSection>
      );
  }
}

function optional(value: string): string | undefined {
  return value.trim() ? value : undefined;
}

function splitCells(value: string): string[] {
  return value.split("|").map((cell) => cell.trim());
}

function parseLineNumbers(value: string): number[] {
  return value.split(",").map((item) => Number.parseInt(item.trim(), 10)).filter((item) => Number.isInteger(item) && item > 0);
}

function InspectorSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="inspector-section"><header><h3>{title}</h3><p>{description}</p></header>{children}</section>;
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return <fieldset className="inspector-group"><legend>{label}</legend>{children}</fieldset>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="inspector-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="inspector-field"><span>{label}</span><input type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} /></label>;
}

function TextAreaField({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return <label className="inspector-field"><span>{label}</span><textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({
  label,
  value,
  options,
  labels,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return <label className="inspector-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}</select></label>;
}

function updateMetric(component: Extract<SlideComponent, { type: "metric-grid" }>, index: number, patch: Partial<(typeof component.props.metrics)[number]>, onChange: (component: SlideComponent) => void) {
  const metrics = component.props.metrics.map((metric, metricIndex) => metricIndex === index ? { ...metric, ...patch } : metric);
  onChange({ ...component, props: { metrics } });
}

function updateChartValue(component: Extract<SlideComponent, { type: "chart" }>, index: number, patch: Partial<(typeof component.props.values)[number]>, onChange: (component: SlideComponent) => void) {
  const values = component.props.values.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
  onChange({ ...component, props: { ...component.props, values } });
}

function updateTableRow(component: Extract<SlideComponent, { type: "table" }>, index: number, patch: Partial<(typeof component.props.rows)[number]>, onChange: (component: SlideComponent) => void) {
  const rows = component.props.rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row);
  onChange({ ...component, props: { ...component.props, rows } });
}

function updateComparison(component: Extract<SlideComponent, { type: "comparison" }>, side: "left" | "right", patch: Partial<typeof component.props.left>, onChange: (component: SlideComponent) => void) {
  onChange({ ...component, props: { ...component.props, [side]: { ...component.props[side], ...patch } } });
}

function updateComparisonPoint(component: Extract<SlideComponent, { type: "comparison" }>, side: "left" | "right", index: number, value: string, onChange: (component: SlideComponent) => void) {
  const points = component.props[side].points.map((point, pointIndex) => pointIndex === index ? value : point);
  updateComparison(component, side, { points }, onChange);
}

function updateProcessStep(component: Extract<SlideComponent, { type: "process" }>, index: number, patch: Partial<(typeof component.props.steps)[number]>, onChange: (component: SlideComponent) => void) {
  const steps = component.props.steps.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step);
  onChange({ ...component, props: { steps } });
}

function updateArchitectureLayer(component: Extract<SlideComponent, { type: "architecture" }>, index: number, patch: Partial<(typeof component.props.layers)[number]>, onChange: (component: SlideComponent) => void) {
  const layers = component.props.layers.map((layer, layerIndex) => layerIndex === index ? { ...layer, ...patch } : layer);
  onChange({ ...component, props: { layers } });
}

function updateArchitectureItem(component: Extract<SlideComponent, { type: "architecture" }>, layerIndex: number, itemIndex: number, value: string, onChange: (component: SlideComponent) => void) {
  const layer = component.props.layers[layerIndex]!;
  const items = layer.items.map((item, index) => index === itemIndex ? value : item);
  updateArchitectureLayer(component, layerIndex, { items }, onChange);
}
