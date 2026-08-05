import { z } from "zod";

export const SUPPORTED_COMPONENT_TYPES = [
  "heading",
  "statement",
  "metric-grid",
  "comparison",
  "process",
  "architecture",
  "chart",
  "table",
  "code",
  "insight",
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
  variant: z.enum(["bar", "line", "area", "donut"]).optional(),
  showValues: z.boolean().optional(),
  values: z.array(z.object({
    label: nonEmptyText,
    value: z.number().finite().nonnegative(),
    highlight: z.boolean().optional()
  }).strict()).min(1).max(8)
}).strict();
const TablePropsSchema = z.object({
  title: nonEmptyText.max(120),
  columns: z.array(nonEmptyText.max(48)).min(2).max(6),
  rows: z.array(z.object({
    cells: z.array(nonEmptyText.max(120)).min(2).max(6),
    highlight: z.boolean().optional()
  }).strict()).min(1).max(8),
  note: z.string().trim().min(1, "Expected non-empty text").max(320).optional()
}).strict().superRefine((table, context) => {
  table.rows.forEach((row, rowIndex) => {
    if (row.cells.length !== table.columns.length) {
      context.addIssue({
        code: "custom",
        path: ["rows", rowIndex, "cells"],
        message: `Expected exactly ${table.columns.length} cells to match the table columns`
      });
    }
  });
});
const CodePropsSchema = z.object({
  title: nonEmptyText.max(120),
  language: nonEmptyText.max(24),
  code: nonEmptyText.max(4_000),
  caption: z.string().trim().min(1, "Expected non-empty text").max(320).optional(),
  showLineNumbers: z.boolean().optional(),
  highlightLines: z.array(z.number().int().positive()).max(12).optional()
}).strict().superRefine((snippet, context) => {
  const lineCount = snippet.code.split(/\r?\n/).length;
  snippet.highlightLines?.forEach((line, lineIndex) => {
    if (line > lineCount) {
      context.addIssue({
        code: "custom",
        path: ["highlightLines", lineIndex],
        message: `Expected a highlighted line between 1 and ${lineCount}`
      });
    }
  });
});
const InsightPropsSchema = z.object({
  label: nonEmptyText,
  title: nonEmptyText,
  description: nonEmptyText,
  metric: optionalText,
  tone: z.enum(["cobalt", "teal", "amber", "neutral"]).optional()
}).strict();
const EvidenceFooterPropsSchema = z.object({ source: nonEmptyText, page: optionalText }).strict();

export const DeckThemeSchema = z.object({
  preset: z.enum(["editorial-light", "editorial-dark", "technical-clean"]),
  accent: z.enum(["cobalt", "teal", "amber"]).default("cobalt"),
  typography: z.enum(["editorial", "modern", "technical"]).default("editorial"),
  density: z.enum(["comfortable", "compact"]).default("comfortable")
}).strict();

export const SlideVariantSchema = z.enum(["default", "spotlight", "quiet", "technical"]);

export const MotionEasingSchema = z.enum(["standard", "emphasized", "linear"]);
export const SlideTransitionSchema = z.object({
  type: z.enum(["none", "fade", "slide", "push", "wipe", "zoom", "morph"]),
  duration: z.number().finite().min(0.1).max(1.2).optional(),
  easing: MotionEasingSchema.optional()
}).strict();
export const ElementEffectSchema = z.object({
  type: z.enum(["none", "fade", "rise", "scale", "wipe", "blur", "pop"]),
  duration: z.number().finite().min(0.1).max(1.2).optional(),
  delay: z.number().finite().min(0).max(1.5).optional(),
  easing: MotionEasingSchema.optional()
}).strict();

function componentSchema<T extends (typeof SUPPORTED_COMPONENT_TYPES)[number], S extends z.ZodTypeAny>(type: T, props: S) {
  return z.object({
    id: stableId,
    type: z.literal(type),
    props,
    sequence: z.number().int().positive().optional(),
    effect: ElementEffectSchema.optional(),
    morphId: stableId.optional()
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
  componentSchema("table", TablePropsSchema),
  componentSchema("code", CodePropsSchema),
  componentSchema("insight", InsightPropsSchema),
  componentSchema("evidence-footer", EvidenceFooterPropsSchema)
]);

export const SlideSchema = z.object({
  id: stableId,
  layout: z.enum(SUPPORTED_LAYOUTS),
  variant: SlideVariantSchema.optional(),
  transition: SlideTransitionSchema.optional(),
  notes: z.string().trim().min(1).max(6_000).optional(),
  components: z.array(SlideComponentSchema).min(1)
}).strict();

export const DeckDocumentSchema = z.object({
  id: stableId,
  version: z.literal(1),
  title: nonEmptyText.max(140),
  locale: z.literal("vi-VN"),
  themeId: stableId,
  theme: DeckThemeSchema.optional(),
  slides: z.array(SlideSchema).min(1)
}).strict();

export type DeckDocument = z.infer<typeof DeckDocumentSchema>;
export type DeckTheme = z.infer<typeof DeckThemeSchema>;
export type MotionEasing = z.infer<typeof MotionEasingSchema>;
export type SlideTransition = z.infer<typeof SlideTransitionSchema>;
export type ElementEffect = z.infer<typeof ElementEffectSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type SlideVariant = z.infer<typeof SlideVariantSchema>;
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
  comparison: new Set(["heading", "comparison", "table", "evidence-footer"]),
  process: new Set(["heading", "process", "evidence-footer"]),
  architecture: new Set(["heading", "architecture", "code", "insight", "evidence-footer"]),
  data: new Set(["heading", "chart", "table", "code", "metric-grid", "insight", "evidence-footer"]),
  split: new Set(["heading", "metric-grid", "code", "insight", "evidence-footer"]),
  dashboard: new Set(["heading", "metric-grid", "chart", "table", "insight", "evidence-footer"]),
  closing: new Set(["heading", "statement", "evidence-footer"])
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
