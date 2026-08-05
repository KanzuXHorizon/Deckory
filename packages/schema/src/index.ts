import { z } from "zod";

export const SUPPORTED_COMPONENT_TYPES = [
  "heading",
  "statement",
  "metric-grid",
  "comparison",
  "process",
  "architecture",
  "chart",
  "evidence-footer"
] as const;

export const SUPPORTED_LAYOUTS = [
  "cover",
  "statement",
  "split",
  "dashboard",
  "comparison",
  "process",
  "architecture",
  "data",
  "closing"
] as const;

const stableId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a stable kebab-case ID");
const nonEmptyText = z.string().trim().min(1, "Expected non-empty text");
const optionalText = z.string().trim().min(1, "Expected non-empty text").optional();

const HeadingPropsSchema = z.object({
  eyebrow: optionalText,
  title: nonEmptyText,
  description: optionalText,
  emphasis: optionalText
}).strict();

const StatementPropsSchema = z.object({ quote: nonEmptyText, byline: optionalText }).strict();
const MetricGridPropsSchema = z.object({
  metrics: z.array(z.object({
    value: nonEmptyText,
    label: nonEmptyText,
    note: nonEmptyText,
    tone: z.enum(["cobalt", "teal", "amber"]).optional()
  }).strict()).min(1).max(4)
}).strict();
const ComparisonPropsSchema = z.object({
  left: z.object({ eyebrow: nonEmptyText, title: nonEmptyText, points: z.array(nonEmptyText).min(1).max(5) }).strict(),
  right: z.object({ eyebrow: nonEmptyText, title: nonEmptyText, points: z.array(nonEmptyText).min(1).max(5) }).strict()
}).strict();
const ProcessPropsSchema = z.object({
  steps: z.array(z.object({
    title: nonEmptyText,
    note: nonEmptyText,
    icon: z.enum(["data", "system", "people", "sparkle"])
  }).strict()).min(2).max(5)
}).strict();
const ArchitecturePropsSchema = z.object({
  layers: z.array(z.object({
    label: nonEmptyText,
    items: z.array(nonEmptyText).min(1).max(5),
    accent: z.boolean().optional()
  }).strict()).min(2).max(5)
}).strict();
const ChartPropsSchema = z.object({
  title: nonEmptyText,
  unit: nonEmptyText,
  values: z.array(z.object({
    label: nonEmptyText,
    value: z.number().finite().nonnegative(),
    highlight: z.boolean().optional()
  }).strict()).min(1).max(8)
}).strict();
const EvidenceFooterPropsSchema = z.object({ source: nonEmptyText, page: optionalText }).strict();

function componentSchema<T extends (typeof SUPPORTED_COMPONENT_TYPES)[number], S extends z.ZodTypeAny>(type: T, props: S) {
  return z.object({
    id: stableId,
    type: z.literal(type),
    props,
    sequence: z.number().int().positive().optional()
  }).strict();
}

export const SlideComponentSchema = z.discriminatedUnion("type", [
  componentSchema("heading", HeadingPropsSchema),
  componentSchema("statement", StatementPropsSchema),
  componentSchema("metric-grid", MetricGridPropsSchema),
  componentSchema("comparison", ComparisonPropsSchema),
  componentSchema("process", ProcessPropsSchema),
  componentSchema("architecture", ArchitecturePropsSchema),
  componentSchema("chart", ChartPropsSchema),
  componentSchema("evidence-footer", EvidenceFooterPropsSchema)
]);

export const SlideSchema = z.object({
  id: stableId,
  layout: z.enum(SUPPORTED_LAYOUTS),
  notes: z.string().trim().min(1).max(6_000).optional(),
  components: z.array(SlideComponentSchema).min(1)
}).strict();

export const DeckDocumentSchema = z.object({
  id: stableId,
  version: z.literal(1),
  title: nonEmptyText.max(140),
  locale: z.literal("vi-VN"),
  themeId: stableId,
  slides: z.array(SlideSchema).min(1)
}).strict();

export type DeckDocument = z.infer<typeof DeckDocumentSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type SlideComponent = z.infer<typeof SlideComponentSchema>;

export type DeckDiagnostic = {
  documentId: string;
  slideId?: string;
  componentId?: string;
  propertyPath: string;
  severity: "error" | "warning";
  message: string;
  remediation: string;
  expected?: string;
  received?: string;
};

export type DeckValidationResult =
  | { ok: true; deck: DeckDocument; diagnostics: DeckDiagnostic[] }
  | { ok: false; diagnostics: DeckDiagnostic[] };

export function defineDeck(deck: DeckDocument): DeckDocument {
  return deck;
}

const LAYOUT_COMPONENTS: Partial<Record<Slide["layout"], ReadonlySet<SlideComponent["type"]>>> = {
  cover: new Set(["heading", "evidence-footer"]),
  statement: new Set(["statement", "heading", "evidence-footer"]),
  comparison: new Set(["heading", "comparison", "evidence-footer"]),
  process: new Set(["heading", "process", "evidence-footer"]),
  architecture: new Set(["heading", "architecture", "evidence-footer"]),
  data: new Set(["heading", "chart", "metric-grid", "evidence-footer"])
};

export function validateDeck(input: unknown): DeckValidationResult {
  const parsed = DeckDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, diagnostics: parsed.error.issues.map((issue) => invalidValueDiagnostic(input, issue)) };
  }

  const diagnostics: DeckDiagnostic[] = [];
  const slideIds = new Set<string>();

  for (const [slideIndex, slide] of parsed.data.slides.entries()) {
    if (slideIds.has(slide.id)) {
      diagnostics.push(diagnostic(parsed.data.id, slide.id, undefined, `slides.${slideIndex}.id`, "Slide ID bị trùng.", "Đặt một ID slide duy nhất.", "unique stable kebab-case ID", slide.id));
    }
    slideIds.add(slide.id);

    const componentIds = new Set<string>();
    let lastSequence = 0;
    for (const [componentIndex, component] of slide.components.entries()) {
      if (componentIds.has(component.id)) {
        diagnostics.push(diagnostic(parsed.data.id, slide.id, component.id, `slides.${slideIndex}.components.${componentIndex}.id`, "Component ID bị trùng trong slide.", "Đặt ID component duy nhất trong slide này.", "unique stable kebab-case ID", component.id));
      }
      componentIds.add(component.id);

      const allowed = LAYOUT_COMPONENTS[slide.layout];
      if (allowed && !allowed.has(component.type)) {
        diagnostics.push(diagnostic(parsed.data.id, slide.id, component.id, `slides.${slideIndex}.components.${componentIndex}.type`, "Component không tương thích với layout đã chọn.", "Chọn component được layout hỗ trợ hoặc đổi sang layout phù hợp.", `component supported by ${slide.layout}: ${[...allowed].join(", ")}`, component.type));
      }

      if (component.sequence !== undefined) {
        if (component.sequence <= lastSequence) {
          diagnostics.push(diagnostic(parsed.data.id, slide.id, component.id, `slides.${slideIndex}.components.${componentIndex}.sequence`, "Thứ tự reveal phải tăng dần.", "Đặt sequence tăng dần theo thứ tự hiển thị.", `integer greater than ${lastSequence}`, String(component.sequence)));
        }
        lastSequence = component.sequence;
      }
    }
  }

  return diagnostics.length === 0 ? { ok: true, deck: parsed.data, diagnostics } : { ok: false, diagnostics };
}

function getDocumentId(input: unknown): string {
  return typeof input === "object" && input !== null && "id" in input && typeof input.id === "string" ? input.id : "unknown-document";
}

function diagnostic(documentId: string, slideId: string | undefined, componentId: string | undefined, propertyPath: string, message: string, remediation: string, expected?: string, received?: string): DeckDiagnostic {
  return { documentId, ...(slideId ? { slideId } : {}), ...(componentId ? { componentId } : {}), propertyPath, severity: "error", message, remediation, ...(expected ? { expected } : {}), ...(received ? { received } : {}) };
}

function invalidValueDiagnostic(input: unknown, issue: z.core.$ZodIssue): DeckDiagnostic {
  const path = issue.path;
  const source = input as { slides?: Array<{ id?: string; components?: Array<{ id?: string }> }> };
  const slideMarker = path.indexOf("slides");
  const componentMarker = path.indexOf("components");
  const slideIndex = slideMarker >= 0 && typeof path[slideMarker + 1] === "number" ? path[slideMarker + 1] as number : undefined;
  const componentIndex = componentMarker >= 0 && typeof path[componentMarker + 1] === "number" ? path[componentMarker + 1] as number : undefined;
  const slideId = slideIndex === undefined ? undefined : source.slides?.[slideIndex]?.id;
  const componentId = slideIndex === undefined || componentIndex === undefined ? undefined : source.slides?.[slideIndex]?.components?.[componentIndex]?.id;
  const message = issue.message.replace(/^Expected /, "");
  const expected = issue.message.includes("stable kebab-case") ? "stable kebab-case ID" : issue.message.includes("non-empty text") ? "non-empty text" : issue.message;

  return diagnostic(
    getDocumentId(input),
    slideId,
    componentId,
    path.map(String).join(".") || "document",
    `Giá trị không hợp lệ: ${message}`,
    "Sửa giá trị để khớp contract Deckory v1.",
    expected
  );
}
