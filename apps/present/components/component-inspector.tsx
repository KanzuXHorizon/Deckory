import type { ReactNode } from "react";
import type { SlideComponent } from "@deckory/schema";
import {
  booleanIcons,
  chartVariantOptions,
  insightToneOptions,
  metricToneOptions,
  processIconOptions,
  teamVariantOptions,
  visualizerAnimationOptions,
  visualizerIconOptions,
  visualizerInteractionOptions,
  visualizerVariantOptions
} from "../lib/studio-option-catalog";
import { BooleanChoice, IconChoiceGroup } from "./studio-controls";

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
              <TextField label="Giá trị" value={metric.value} onChange={(value) => updateMetric(component, index, { value }, onChange)} />
              <IconChoiceGroup label="Màu nhấn" value={metric.tone ?? "cobalt"} options={metricToneOptions} compact onChange={(tone) => updateMetric(component, index, { tone }, onChange)} />
              <TextField label="Nhãn" value={metric.label} onChange={(value) => updateMetric(component, index, { label: value }, onChange)} />
              <TextAreaField label="Ghi chú" value={metric.note} onChange={(value) => updateMetric(component, index, { note: value }, onChange)} rows={2} />
            </FieldGroup>
          ))}
        </InspectorSection>
      );
    case "chart":
      return (
        <InspectorSection title="Chart" description="Chọn chart theo quan hệ dữ liệu cần giải thích.">
          <IconChoiceGroup label="Kiểu biểu đồ" value={component.props.variant ?? "bar"} options={chartVariantOptions} compact onChange={(variant) => update({ variant })} />
          <BooleanChoice label="Hiện giá trị" value={component.props.showValues !== false} onChange={(showValues) => update({ showValues })} trueLabel="Hiện" falseLabel="Ẩn" trueIcon={booleanIcons.true} falseIcon={booleanIcons.false} />
          <TextField label="Tiêu đề chart" value={component.props.title} onChange={(value) => update({ title: value })} />
          <TextField label="Đơn vị" value={component.props.unit} onChange={(value) => update({ unit: value })} />
          {component.props.values.map((item, index) => (
            <FieldGroup key={`${item.label}-${index}`} label={`Điểm dữ liệu ${index + 1}`}>
              <TextField label="Nhãn" value={item.label} onChange={(value) => updateChartValue(component, index, { label: value }, onChange)} />
              <NumberField label="Giá trị" value={item.value} onChange={(value) => updateChartValue(component, index, { value }, onChange)} />
              <BooleanChoice label="Nhấn mạnh" value={item.highlight === true} onChange={(highlight) => updateChartValue(component, index, { highlight }, onChange)} trueLabel="Nhấn" falseLabel="Thường" trueIcon={booleanIcons.yes} falseIcon={booleanIcons.no} />
            </FieldGroup>
          ))}
        </InspectorSection>
      );
    case "table":
      return (
        <InspectorSection title="Data table" description="Bảng dùng cho dữ liệu cần đối chiếu chính xác theo hàng và cột.">
          <TextField label="Tiêu đề" value={component.props.title} onChange={(value) => update({ title: value })} />
          <div className="inspector-field-grid inspector-field-grid--two">
            {component.props.columns.map((column, index) => (
              <TextField key={`${column}-${index}`} label={`Cột ${index + 1}`} value={column} onChange={(value) => updateTableColumn(component, index, value, onChange)} />
            ))}
          </div>
          {component.props.rows.map((row, index) => (
            <FieldGroup key={`${row.cells.join("-")}-${index}`} label={`Hàng ${index + 1}`}>
              <TextField label="Ô dữ liệu (phân cách bằng |)" value={row.cells.join(" | ")} onChange={(value) => updateTableRow(component, index, { cells: splitCells(value) }, onChange)} />
              <BooleanChoice label="Nhấn mạnh" value={row.highlight === true} onChange={(highlight) => updateTableRow(component, index, { highlight }, onChange)} trueLabel="Nhấn" falseLabel="Thường" trueIcon={booleanIcons.yes} falseIcon={booleanIcons.no} />
            </FieldGroup>
          ))}
          <TextAreaField label="Ghi chú" value={component.props.note ?? ""} onChange={(value) => update({ note: optional(value) })} rows={2} />
        </InspectorSection>
      );
    case "code":
      return (
        <InspectorSection title="Code snippet" description="Code block dành cho bằng chứng kỹ thuật ngắn, có dòng cần chú ý.">
          <div className="inspector-field-grid inspector-field-grid--two">
            <TextField label="Tiêu đề" value={component.props.title} onChange={(value) => update({ title: value })} />
            <TextField label="Ngôn ngữ" value={component.props.language} onChange={(value) => update({ language: value })} />
          </div>
          <TextAreaField label="Mã nguồn" value={component.props.code} onChange={(value) => update({ code: value })} rows={9} />
          <TextField label="Dòng nhấn mạnh (1, 2, 4)" value={(component.props.highlightLines ?? []).join(", ")} onChange={(value) => update({ highlightLines: parseLineNumbers(value) })} />
          <BooleanChoice label="Số dòng" value={component.props.showLineNumbers !== false} onChange={(showLineNumbers) => update({ showLineNumbers })} trueLabel="Hiện" falseLabel="Ẩn" trueIcon={booleanIcons.true} falseIcon={booleanIcons.false} />
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
              <TextField label="Tiêu đề" value={step.title} onChange={(value) => updateProcessStep(component, index, { title: value }, onChange)} />
              <IconChoiceGroup label="Biểu tượng" value={step.icon} options={processIconOptions} compact onChange={(icon) => updateProcessStep(component, index, { icon }, onChange)} />
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
              <TextField label="Nhãn" value={layer.label} onChange={(value) => updateArchitectureLayer(component, index, { label: value }, onChange)} />
              <BooleanChoice label="Điểm nhấn" value={layer.accent === true} onChange={(accent) => updateArchitectureLayer(component, index, { accent }, onChange)} trueLabel="Nhấn" falseLabel="Thường" trueIcon={booleanIcons.yes} falseIcon={booleanIcons.no} />
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
          <TextField label="Nhãn" value={component.props.label} onChange={(value) => update({ label: value })} />
          <IconChoiceGroup label="Màu nhấn" value={component.props.tone ?? "cobalt"} options={insightToneOptions} compact onChange={(tone) => update({ tone })} />
          <TextField label="Metric" value={component.props.metric ?? ""} onChange={(value) => update({ metric: optional(value) })} />
          <TextAreaField label="Tiêu đề" value={component.props.title} onChange={(value) => update({ title: value })} rows={2} />
          <TextAreaField label="Diễn giải" value={component.props.description} onChange={(value) => update({ description: value })} rows={4} />
        </InspectorSection>
      );
    case "team-showcase":
      return (
        <InspectorSection title="Đội ngũ" description="Làm rõ vai trò, năng lực và đóng góp của từng thành viên.">
          <TextField label="Tiêu đề" value={component.props.title ?? ""} onChange={(value) => update({ title: optional(value) })} />
          <TextAreaField label="Mô tả" value={component.props.subtitle ?? ""} onChange={(value) => update({ subtitle: optional(value) })} rows={2} />
          <TextField label="Tên dự án" value={component.props.project ?? ""} onChange={(value) => update({ project: optional(value) })} />
          <IconChoiceGroup label="Bố cục đội ngũ" value={component.props.variant ?? "editorial"} options={teamVariantOptions} compact onChange={(variant) => update({ variant })} />
          {component.props.members.map((member, index) => (
            <FieldGroup key={member.id} label={`Thành viên ${index + 1}`}>
              <div className="inspector-field-grid inspector-field-grid--two">
                <TextField label="Họ tên" value={member.name} onChange={(name) => updateTeamMember(component, index, { name }, onChange)} />
                <TextField label="Vai trò" value={member.role ?? ""} onChange={(role) => updateTeamMember(component, index, { role: optional(role) }, onChange)} />
              </div>
              <TextField label="Mã sinh viên" value={member.studentId ?? ""} onChange={(studentId) => updateTeamMember(component, index, { studentId: optional(studentId) }, onChange)} />
              <FieldGroup label="Ảnh thành viên (không bắt buộc)">
                <TextField label="Đường dẫn ảnh cục bộ" value={member.image?.src ?? ""} onChange={(src) => updateTeamImage(component, index, { src }, onChange)} />
                <TextField label="Mô tả ảnh" value={member.image?.alt ?? ""} onChange={(alt) => updateTeamImage(component, index, { alt }, onChange)} />
                <SelectField label="Vị trí ảnh" value={member.image?.position ?? "center"} options={["center", "top", "bottom"]} labels={{ center: "Chính giữa", top: "Ưu tiên phía trên", bottom: "Ưu tiên phía dưới" }} onChange={(position) => updateTeamImage(component, index, { position: position as "center" | "top" | "bottom" }, onChange)} />
              </FieldGroup>
              <TextAreaField label="Tóm tắt" value={member.summary ?? ""} onChange={(summary) => updateTeamMember(component, index, { summary: optional(summary) }, onChange)} rows={3} />
              <TextField label="Kỹ năng (phân cách bằng |)" value={(member.skills ?? []).join(" | ")} onChange={(value) => updateTeamMember(component, index, { skills: splitOptionalList(value) }, onChange)} />
              <TextAreaField label="Đóng góp (mỗi dòng một mục)" value={(member.contributions ?? []).join("\n")} onChange={(value) => updateTeamMember(component, index, { contributions: splitOptionalLines(value) }, onChange)} rows={3} />
              <IconChoiceGroup label="Màu nhấn" value={member.accent ?? "neutral"} options={insightToneOptions} compact onChange={(accent) => updateTeamMember(component, index, { accent }, onChange)} />
              <BooleanChoice label="Thành viên tiêu điểm" value={member.featured === true} onChange={(featured) => updateTeamFeatured(component, index, featured, onChange)} trueLabel="Tiêu điểm" falseLabel="Thường" trueIcon={booleanIcons.yes} falseIcon={booleanIcons.no} />
            </FieldGroup>
          ))}
        </InspectorSection>
      );
    case "visualizer":
      return (
        <InspectorSection title="Visualizer" description="Biến quan hệ phức tạp thành một cấu trúc có thể khám phá.">
          <TextField label="Tiêu đề" value={component.props.title ?? ""} onChange={(value) => update({ title: optional(value) })} />
          <TextAreaField label="Tóm tắt" value={component.props.summary ?? ""} onChange={(value) => update({ summary: optional(value) })} rows={2} />
          <TextField label="Nhãn trung tâm" value={component.props.center ?? ""} onChange={(value) => update({ center: optional(value) })} />
          <IconChoiceGroup label="Kiểu visual" value={component.props.variant} options={visualizerVariantOptions} compact onChange={(variant) => update({ variant })} />
          <IconChoiceGroup label="Tương tác" value={component.props.interaction ?? "inspect"} options={visualizerInteractionOptions} compact onChange={(interaction) => update({ interaction })} />
          <IconChoiceGroup label="Animation" value={component.props.animation ?? "none"} options={visualizerAnimationOptions} compact onChange={(animation) => update({ animation })} />
          {component.props.items.map((item, index) => (
            <FieldGroup key={item.id} label={`Nút ${index + 1}`}>
              <TextField label="Nhãn" value={item.label} onChange={(label) => updateVisualizerItem(component, index, { label }, onChange)} />
              <TextAreaField label="Diễn giải" value={item.description ?? ""} onChange={(description) => updateVisualizerItem(component, index, { description: optional(description) }, onChange)} rows={2} />
              <div className="inspector-field-grid inspector-field-grid--two">
                <TextField label="Giá trị" value={item.value ?? ""} onChange={(value) => updateVisualizerItem(component, index, { value: optional(value) }, onChange)} />
                <TextField label="Parent ID" value={item.parentId ?? ""} onChange={(parentId) => updateVisualizerItem(component, index, { parentId: optional(parentId) }, onChange)} />
              </div>
              <IconChoiceGroup label="Biểu tượng" value={item.icon ?? "data"} options={visualizerIconOptions} compact onChange={(icon) => updateVisualizerItem(component, index, { icon }, onChange)} />
              <IconChoiceGroup label="Màu nhấn" value={item.tone ?? "neutral"} options={insightToneOptions} compact onChange={(tone) => updateVisualizerItem(component, index, { tone }, onChange)} />
              <BooleanChoice label="Nút tiêu điểm" value={item.featured === true} onChange={(featured) => updateVisualizerFeatured(component, index, featured, onChange)} trueLabel="Tiêu điểm" falseLabel="Thường" trueIcon={booleanIcons.yes} falseIcon={booleanIcons.no} />
            </FieldGroup>
          ))}
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

function splitOptionalList(value: string): string[] | undefined {
  const items = value.split("|").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function splitOptionalLines(value: string): string[] | undefined {
  const items = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
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

function SelectField({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
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

function updateTableColumn(component: Extract<SlideComponent, { type: "table" }>, index: number, value: string, onChange: (component: SlideComponent) => void) {
  const columns = component.props.columns.map((column, columnIndex) => columnIndex === index ? value : column);
  onChange({ ...component, props: { ...component.props, columns } });
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

function updateTeamMember(component: Extract<SlideComponent, { type: "team-showcase" }>, index: number, patch: Partial<(typeof component.props.members)[number]>, onChange: (component: SlideComponent) => void) {
  const members = component.props.members.map((member, memberIndex) => memberIndex === index ? { ...member, ...patch } : member);
  onChange({ ...component, props: { ...component.props, members } });
}

function updateTeamFeatured(component: Extract<SlideComponent, { type: "team-showcase" }>, index: number, featured: boolean, onChange: (component: SlideComponent) => void) {
  const members = component.props.members.map((member, memberIndex) => ({
    ...member,
    featured: featured ? memberIndex === index : memberIndex === index ? false : member.featured
  }));
  onChange({ ...component, props: { ...component.props, members } });
}

function updateTeamImage(component: Extract<SlideComponent, { type: "team-showcase" }>, index: number, patch: { src?: string; alt?: string; position?: "center" | "top" | "bottom" }, onChange: (component: SlideComponent) => void) {
  const member = component.props.members[index]!;
  const nextSrc = patch.src === undefined ? member.image?.src : optional(patch.src);
  if (!nextSrc) {
    updateTeamMember(component, index, { image: undefined }, onChange);
    return;
  }

  updateTeamMember(component, index, {
    image: {
      src: nextSrc,
      alt: patch.alt === undefined ? member.image?.alt ?? `Chân dung ${member.name}` : optional(patch.alt) ?? `Chân dung ${member.name}`,
      position: patch.position ?? member.image?.position ?? "center"
    }
  }, onChange);
}

function updateVisualizerItem(component: Extract<SlideComponent, { type: "visualizer" }>, index: number, patch: Partial<(typeof component.props.items)[number]>, onChange: (component: SlideComponent) => void) {
  const items = component.props.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
  onChange({ ...component, props: { ...component.props, items } });
}

function updateVisualizerFeatured(component: Extract<SlideComponent, { type: "visualizer" }>, index: number, featured: boolean, onChange: (component: SlideComponent) => void) {
  const items = component.props.items.map((item, itemIndex) => ({
    ...item,
    featured: featured ? itemIndex === index : itemIndex === index ? false : item.featured
  }));
  onChange({ ...component, props: { ...component.props, items } });
}
