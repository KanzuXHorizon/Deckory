import { z } from "zod";

export * from "@deckory/schema/v2";

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
  "team-showcase",
  "visualizer",
  "weight-simulator",
  "criterion-grid",
  "media-showcase",
  "diagram",
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
const localImageSource = z.string().trim().min(1).refine(
  (value) => /^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);/i.test(value)
    || (value.startsWith("/")
      && !value.startsWith("//")
      && !value.includes("\\")
      && !value.includes("..")
      && !/[?#]/.test(value)),
  "Expected a safe local path or inline image data"
);

export const DeckAssetSchema = z.object({
  id: stableId,
  type: z.literal("image"),
  src: localImageSource,
  mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]),
  width: z.number().int().positive().max(16_384).optional(),
  height: z.number().int().positive().max(16_384).optional(),
  source: z.object({
    label: nonEmptyText.max(180),
    url: z.string().trim().url().refine((value) => value.startsWith("https://"), "Expected an https source URL").optional()
  }).strict().optional()
}).strict().superRefine((asset, context) => {
  if ((asset.width === undefined) !== (asset.height === undefined)) {
    context.addIssue({
      code: "custom",
      path: [asset.width === undefined ? "width" : "height"],
      message: "Expected width and height to be provided together"
    });
  }
});

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
const CriterionGridPropsSchema = z.object({
  items: z.array(z.object({
    label: nonEmptyText.max(48),
    question: nonEmptyText.max(120),
    output: nonEmptyText.max(80),
    tone: z.enum(["cobalt", "teal", "amber", "neutral"]).optional(),
    featured: z.boolean().optional()
  }).strict()).min(3).max(6)
}).strict().superRefine((grid, context) => {
  if (grid.items.filter((item) => item.featured).length > 1) {
    context.addIssue({ code: "custom", path: ["items"], message: "Expected at most one featured criterion" });
  }
});

const MediaShowcasePropsSchema = z.object({
  title: optionalText,
  summary: z.string().trim().min(1).max(240).optional(),
  variant: z.enum(["single", "duo", "triptych"]).optional(),
  items: z.array(z.object({
    assetId: stableId,
    alt: nonEmptyText.max(180),
    eyebrow: z.string().trim().min(1).max(48).optional(),
    title: nonEmptyText.max(80),
    caption: z.string().trim().min(1).max(180).optional(),
    featured: z.boolean().optional()
  }).strict()).min(1).max(3)
}).strict().superRefine((showcase, context) => {
  const featuredCount = showcase.items.filter((item) => item.featured).length;
  if (featuredCount > 1) {
    context.addIssue({ code: "custom", path: ["items"], message: "Expected at most one featured media item" });
  }
  const expectedCount = showcase.variant === "single" ? 1 : showcase.variant === "duo" ? 2 : showcase.variant === "triptych" ? 3 : undefined;
  if (expectedCount !== undefined && showcase.items.length !== expectedCount) {
    context.addIssue({ code: "custom", path: ["items"], message: `Expected exactly ${expectedCount} media items for the ${showcase.variant} variant` });
  }
});

const WeightSimulatorPropsSchema = z.object({
  title: nonEmptyText,
  description: nonEmptyText,
  dimensions: z.array(z.object({
    id: stableId,
    label: nonEmptyText,
    score: z.number().finite().min(0).max(100),
    weight: z.number().finite().min(0).max(100),
    tone: z.enum(["cobalt", "teal", "amber", "neutral"]).optional()
  }).strict()).min(2).max(8),
  presets: z.array(z.object({
    id: stableId,
    label: nonEmptyText,
    description: nonEmptyText,
    weights: z.record(stableId, z.number().finite().min(0).max(100))
  }).strict()).min(1).max(5),
  disclaimer: nonEmptyText
}).strict().superRefine((simulator, context) => {
  const dimensionIds = new Set(simulator.dimensions.map((dimension) => dimension.id));
  const baseTotal = simulator.dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
  if (Math.abs(baseTotal - 100) > 0.01) {
    context.addIssue({ code: "custom", path: ["dimensions"], message: "Expected base weights to total 100" });
  }
  simulator.presets.forEach((preset, presetIndex) => {
    const entries = Object.entries(preset.weights);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    if (Math.abs(total - 100) > 0.01) {
      context.addIssue({ code: "custom", path: ["presets", presetIndex, "weights"], message: "Expected preset weights to total 100" });
    }
    entries.forEach(([id], weightIndex) => {
      if (!dimensionIds.has(id)) {
        context.addIssue({ code: "custom", path: ["presets", presetIndex, "weights", weightIndex], message: "Expected preset weight key to reference a dimension" });
      }
    });
  });
});
export const TeamImageSchema = z.object({
  src: localImageSource.optional(),
  assetId: stableId.optional(),
  alt: nonEmptyText.max(180),
  position: z.enum(["center", "top", "bottom"]).optional()
}).strict().superRefine((image, context) => {
  const referenceCount = Number(image.src !== undefined) + Number(image.assetId !== undefined);
  if (referenceCount !== 1) {
    context.addIssue({
      code: "custom",
      path: [],
      message: "Expected exactly one of src or assetId"
    });
  }
});

const TeamMemberSchema = z.object({
  id: stableId,
  name: nonEmptyText.max(80),
  role: optionalText,
  studentId: optionalText,
  summary: z.string().trim().min(1).max(360).optional(),
  skills: z.array(nonEmptyText.max(48)).max(6).optional(),
  contributions: z.array(nonEmptyText.max(140)).max(5).optional(),
  links: z.array(z.object({
    label: nonEmptyText.max(40),
    href: z.string().trim().regex(/^(?:https?:\/\/|mailto:)/, "Expected an https or mailto link")
  }).strict()).max(4).optional(),
  image: TeamImageSchema.optional(),
  accent: z.enum(["cobalt", "teal", "amber", "neutral"]).optional(),
  featured: z.boolean().optional()
}).strict();

const TeamShowcasePropsSchema = z.object({
  title: optionalText,
  subtitle: optionalText,
  project: optionalText,
  variant: z.enum(["editorial", "cards", "constellation", "spotlight", "profile"]).optional(),
  members: z.array(TeamMemberSchema).min(1).max(6)
}).strict().superRefine((team, context) => {
  const memberIds = new Set<string>();
  let featuredCount = 0;
  team.members.forEach((member, index) => {
    if (memberIds.has(member.id)) {
      context.addIssue({ code: "custom", path: ["members", index, "id"], message: "Expected a unique team member ID" });
    }
    memberIds.add(member.id);
    if (member.featured) featuredCount += 1;
  });
  if (featuredCount > 1) {
    context.addIssue({ code: "custom", path: ["members"], message: "Expected at most one featured team member" });
  }
  if (team.variant === "profile" && team.members.length !== 1) {
    context.addIssue({ code: "custom", path: ["members"], message: "Expected exactly one member for the profile variant" });
  }
  if (team.variant === "profile" && team.members.length === 1) {
    const member = team.members[0]!;
    if ((member.summary?.length ?? 0) > 220) {
      context.addIssue({ code: "custom", path: ["members", 0, "summary"], message: "Expected a profile summary of at most 220 characters" });
    }
    if ((member.contributions?.length ?? 0) > 4) {
      context.addIssue({ code: "custom", path: ["members", 0, "contributions"], message: "Expected at most four profile contributions" });
    }
    if ((member.links?.length ?? 0) > 3) {
      context.addIssue({ code: "custom", path: ["members", 0, "links"], message: "Expected at most three profile links" });
    }
  }
});

const VisualizerItemSchema = z.object({
  id: stableId,
  label: nonEmptyText.max(80),
  description: z.string().trim().min(1).max(260).optional(),
  value: z.string().trim().min(1).max(48).optional(),
  icon: z.enum(["seed", "leaf", "data", "system", "people", "sparkle", "code"]).optional(),
  tone: z.enum(["cobalt", "teal", "amber", "neutral"]).optional(),
  parentId: stableId.optional(),
  featured: z.boolean().optional()
}).strict();

const VisualizerPropsSchema = z.object({
  title: optionalText,
  summary: optionalText,
  center: optionalText,
  variant: z.enum(["growth-tree", "timeline-path", "orbit", "network"]),
  interaction: z.enum(["inspect", "step", "none"]).optional(),
  animation: z.enum(["grow", "draw", "orbit", "pulse", "none"]).optional(),
  items: z.array(VisualizerItemSchema).min(2).max(8)
}).strict().superRefine((visualizer, context) => {
  const ids = new Set(visualizer.items.map((item) => item.id));
  visualizer.items.forEach((item, index) => {
    if (item.parentId && !ids.has(item.parentId)) {
      context.addIssue({ code: "custom", path: ["items", index, "parentId"], message: "Expected parentId to reference another visualizer item" });
    }
    if (item.parentId === item.id) {
      context.addIssue({ code: "custom", path: ["items", index, "parentId"], message: "Expected parentId to reference a different item" });
    }
  });
});

const QUADRANT_POSITIONS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

const DiagramItemSchema = z.object({
  id: stableId,
  label: nonEmptyText.max(80),
  description: z.string().trim().min(1).max(220).optional(),
  value: z.string().trim().min(1).max(48).optional(),
  tone: z.enum(["cobalt", "teal", "amber", "neutral"]).optional(),
  featured: z.boolean().optional(),
  position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).optional()
}).strict();

const DiagramPropsSchema = z.object({
  title: nonEmptyText.max(140),
  summary: nonEmptyText.max(360),
  variant: z.enum(["timeline", "funnel", "pyramid", "cycle", "quadrant", "roadmap"]),
  center: z.string().trim().min(1).max(80).optional(),
  xLabel: z.string().trim().min(1).max(60).optional(),
  yLabel: z.string().trim().min(1).max(60).optional(),
  items: z.array(DiagramItemSchema).min(2).max(8)
}).strict().superRefine((diagram, context) => {
  const ids = new Set<string>();
  diagram.items.forEach((item, index) => {
    if (ids.has(item.id)) {
      context.addIssue({ code: "custom", path: ["items", index, "id"], message: "Expected a unique diagram item ID" });
    }
    ids.add(item.id);
  });
  if (["cycle", "funnel", "pyramid"].includes(diagram.variant) && diagram.items.length < 3) {
    context.addIssue({ code: "custom", path: ["items"], message: `Expected at least three items for ${diagram.variant}` });
  }
  if (diagram.variant === "quadrant") {
    if (diagram.items.length !== 4) {
      context.addIssue({ code: "custom", path: ["items"], message: "Expected exactly four items for quadrant" });
    }

    const positions = new Set<string>();
    diagram.items.forEach((item, index) => {
      const position = item.position ?? QUADRANT_POSITIONS[index];
      if (!position) return;
      if (positions.has(position)) {
        context.addIssue({ code: "custom", path: ["items", index, "position"], message: "Expected a unique quadrant position" });
      }
      positions.add(position);
    });
  }
});

const EvidenceFooterPropsSchema = z.object({
  source: nonEmptyText,
  page: optionalText,
  logoAssetId: stableId.optional(),
  brandLabel: optionalText
}).strict();

export const DeckThemeSchema = z.object({
  preset: z.enum(["editorial-light", "editorial-dark", "technical-clean"]),
  accent: z.enum(["cobalt", "teal", "amber"]).default("cobalt"),
  typography: z.enum(["editorial", "modern", "technical"]).default("editorial"),
  density: z.enum(["comfortable", "compact"]).default("comfortable")
}).strict();

export const SlideVariantSchema = z.enum([
  "default",
  "spotlight",
  "quiet",
  "technical",
  "cinematic",
  "asymmetric",
  "editorial",
  "evidence",
  "gallery"
]);
export const SlideBackgroundSchema = z.enum(["plain", "editorial", "grid", "spotlight", "bands"]);

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
  componentSchema("team-showcase", TeamShowcasePropsSchema),
  componentSchema("visualizer", VisualizerPropsSchema),
  componentSchema("weight-simulator", WeightSimulatorPropsSchema),
  componentSchema("criterion-grid", CriterionGridPropsSchema),
  componentSchema("media-showcase", MediaShowcasePropsSchema),
  componentSchema("diagram", DiagramPropsSchema),
  componentSchema("evidence-footer", EvidenceFooterPropsSchema)
]);

export const SlideSchema = z.object({
  id: stableId,
  masterId: stableId.optional(),
  layout: z.enum(SUPPORTED_LAYOUTS),
  variant: SlideVariantSchema.optional(),
  background: SlideBackgroundSchema.optional(),
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
  assets: z.array(DeckAssetSchema).max(128).optional(),
  slides: z.array(SlideSchema).min(1)
}).strict();

export type DeckDocument = z.infer<typeof DeckDocumentSchema>;
export type DeckTheme = z.infer<typeof DeckThemeSchema>;
export type DeckAsset = z.infer<typeof DeckAssetSchema>;
export type TeamImage = z.infer<typeof TeamImageSchema>;
export type MotionEasing = z.infer<typeof MotionEasingSchema>;
export type SlideTransition = z.infer<typeof SlideTransitionSchema>;
export type ElementEffect = z.infer<typeof ElementEffectSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type SlideVariant = z.infer<typeof SlideVariantSchema>;
export type SlideBackground = z.infer<typeof SlideBackgroundSchema>;
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

export function resolveDeckAsset(
  assets: readonly DeckAsset[] | undefined,
  assetId: string | undefined
): DeckAsset | undefined {
  return assetId ? assets?.find((asset) => asset.id === assetId) : undefined;
}

export function resolveTeamImageSource(
  assets: readonly DeckAsset[] | undefined,
  image: TeamImage | undefined
): string | undefined {
  if (!image) return undefined;
  return image.src ?? resolveDeckAsset(assets, image.assetId)?.src;
}

const LAYOUT_COMPONENTS: Partial<Record<Slide["layout"], ReadonlySet<SlideComponent["type"]>>> = {
  cover: new Set(["heading", "team-showcase", "media-showcase", "evidence-footer"]),
  statement: new Set(["statement", "heading", "visualizer", "media-showcase", "diagram", "evidence-footer"]),
  comparison: new Set(["heading", "comparison", "table", "media-showcase", "diagram", "evidence-footer"]),
  process: new Set(["heading", "process", "team-showcase", "visualizer", "media-showcase", "diagram", "evidence-footer"]),
  architecture: new Set(["heading", "architecture", "code", "insight", "team-showcase", "visualizer", "media-showcase", "diagram", "evidence-footer"]),
  data: new Set(["heading", "chart", "table", "code", "metric-grid", "insight", "team-showcase", "visualizer", "weight-simulator", "criterion-grid", "media-showcase", "diagram", "evidence-footer"]),
  split: new Set(["heading", "metric-grid", "code", "insight", "team-showcase", "visualizer", "weight-simulator", "criterion-grid", "media-showcase", "diagram", "evidence-footer"]),
  dashboard: new Set(["heading", "metric-grid", "chart", "table", "insight", "team-showcase", "visualizer", "weight-simulator", "criterion-grid", "media-showcase", "diagram", "evidence-footer"]),
  closing: new Set(["heading", "statement", "team-showcase", "visualizer", "media-showcase", "diagram", "evidence-footer"])
};

export function validateDeck(input: unknown): DeckValidationResult {
  const parsed = DeckDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, diagnostics: parsed.error.issues.map((issue) => invalidValueDiagnostic(input, issue)) };
  }

  const diagnostics: DeckDiagnostic[] = [];
  const slideIds = new Set<string>();
  const assetIds = new Set<string>();

  for (const [assetIndex, asset] of (parsed.data.assets ?? []).entries()) {
    if (assetIds.has(asset.id)) {
      diagnostics.push(diagnostic(
        parsed.data.id,
        undefined,
        undefined,
        `assets.${assetIndex}.id`,
        "Asset ID bị trùng.",
        "Đặt một ID asset duy nhất trong deck manifest.",
        "unique stable kebab-case ID",
        asset.id
      ));
    }
    assetIds.add(asset.id);
  }

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

      if (component.type === "team-showcase") {
        component.props.members.forEach((member, memberIndex) => {
          const assetId = member.image?.assetId;
          if (assetId && !assetIds.has(assetId)) {
            diagnostics.push(diagnostic(
              parsed.data.id,
              slide.id,
              component.id,
              `slides.${slideIndex}.components.${componentIndex}.props.members.${memberIndex}.image.assetId`,
              "Asset tham chiếu không tồn tại trong deck manifest.",
              "Thêm asset vào deck.assets hoặc đổi sang một assetId hợp lệ.",
              "asset ID declared in deck.assets",
              assetId
            ));
          }
        });
      }

      if (component.type === "media-showcase") {
        component.props.items.forEach((item, itemIndex) => {
          if (!assetIds.has(item.assetId)) {
            diagnostics.push(diagnostic(
              parsed.data.id,
              slide.id,
              component.id,
              `slides.${slideIndex}.components.${componentIndex}.props.items.${itemIndex}.assetId`,
              "Asset hình ảnh không tồn tại trong deck manifest.",
              "Thêm asset vào deck.assets hoặc đổi sang một assetId hợp lệ.",
              "asset ID declared in deck.assets",
              item.assetId
            ));
          }
        });
      }

      if (component.type === "evidence-footer") {
        const assetId = component.props.logoAssetId;
        if (assetId && !assetIds.has(assetId)) {
          diagnostics.push(diagnostic(
            parsed.data.id,
            slide.id,
            component.id,
            `slides.${slideIndex}.components.${componentIndex}.props.logoAssetId`,
            "Logo footer tham chiếu asset không tồn tại trong deck manifest.",
            "Thêm logo vào deck.assets hoặc đổi sang một logoAssetId hợp lệ.",
            "asset ID declared in deck.assets",
            assetId
          ));
        }
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

const VALIDATION_MESSAGE_COPY: Record<string, { message: string; remediation: string; expected?: string }> = {
  "Expected a stable kebab-case ID": {
    message: "ID chỉ được dùng chữ thường, chữ số và dấu gạch nối.",
    remediation: "Đổi ID sang dạng kebab-case ổn định, ví dụ: tong-quan-du-an.",
    expected: "ID dạng kebab-case"
  },
  "Expected non-empty text": {
    message: "Nội dung bắt buộc đang để trống.",
    remediation: "Nhập nội dung có ý nghĩa trước khi tiếp tục.",
    expected: "Văn bản không trống"
  },
  "Expected width and height to be provided together": {
    message: "Chiều rộng và chiều cao phải được khai báo cùng nhau.",
    remediation: "Bổ sung cả chiều rộng lẫn chiều cao, hoặc bỏ cả hai giá trị."
  },
  "Expected base weights to total 100": {
    message: "Tổng trọng số mặc định phải bằng 100%.",
    remediation: "Điều chỉnh các trọng số để tổng cuối cùng bằng 100%."
  },
  "Expected preset weights to total 100": {
    message: "Tổng trọng số của cấu hình mẫu phải bằng 100%.",
    remediation: "Điều chỉnh các trọng số trong cấu hình mẫu để tổng bằng 100%."
  },
  "Expected preset weight key to reference a dimension": {
    message: "Trọng số trong cấu hình mẫu đang tham chiếu một tiêu chí không tồn tại.",
    remediation: "Dùng đúng ID của một tiêu chí đã khai báo trong bộ mô phỏng."
  },
  "Expected exactly one of src or assetId": {
    message: "Ảnh chỉ được dùng đường dẫn cục bộ hoặc mã tài nguyên, không dùng đồng thời cả hai.",
    remediation: "Giữ lại một nguồn ảnh duy nhất."
  },
  "Expected a unique team member ID": {
    message: "ID thành viên đang bị trùng.",
    remediation: "Đặt một ID riêng cho từng thành viên."
  },
  "Expected at most one featured team member": {
    message: "Chỉ được chọn tối đa một thành viên tiêu điểm.",
    remediation: "Bỏ trạng thái tiêu điểm ở các thành viên còn lại."
  },
  "Expected at most one featured media item": {
    message: "Chỉ được chọn tối đa một hình ảnh tiêu điểm.",
    remediation: "Bỏ trạng thái tiêu điểm ở các hình ảnh còn lại."
  },
  "Expected exactly one member for the profile variant": {
    message: "Bố cục hồ sơ riêng chỉ hỗ trợ đúng một thành viên.",
    remediation: "Giữ lại một thành viên hoặc đổi sang bố cục đội ngũ."
  },
  "Expected a profile summary of at most 220 characters": {
    message: "Phần tóm tắt hồ sơ vượt quá 220 ký tự.",
    remediation: "Rút gọn phần tóm tắt để giữ khả năng đọc trên trang chiếu."
  },
  "Expected at most four profile contributions": {
    message: "Hồ sơ chỉ nên có tối đa bốn đóng góp chính.",
    remediation: "Giữ lại các đóng góp quan trọng và có thể kiểm chứng nhất."
  },
  "Expected at most three profile links": {
    message: "Hồ sơ chỉ hỗ trợ tối đa ba liên kết.",
    remediation: "Giữ lại các liên kết cần thiết nhất."
  },
  "Expected parentId to reference another visualizer item": {
    message: "Nút cha phải tham chiếu đến một nút khác đang tồn tại.",
    remediation: "Chọn ID của một nút đã có trong cùng sơ đồ."
  },
  "Expected parentId to reference a different item": {
    message: "Nút không thể tham chiếu chính nó làm nút cha.",
    remediation: "Chọn một nút khác làm nút cha hoặc bỏ liên kết cha."
  }
};

function invalidValueDiagnostic(input: unknown, issue: z.core.$ZodIssue): DeckDiagnostic {
  const path = issue.path;
  const source = input as { slides?: Array<{ id?: string; components?: Array<{ id?: string }> }> };
  const slideMarker = path.indexOf("slides");
  const componentMarker = path.indexOf("components");
  const slideIndex = slideMarker >= 0 && typeof path[slideMarker + 1] === "number" ? path[slideMarker + 1] as number : undefined;
  const componentIndex = componentMarker >= 0 && typeof path[componentMarker + 1] === "number" ? path[componentMarker + 1] as number : undefined;
  const slideId = slideIndex === undefined ? undefined : source.slides?.[slideIndex]?.id;
  const componentId = slideIndex === undefined || componentIndex === undefined ? undefined : source.slides?.[slideIndex]?.components?.[componentIndex]?.id;
  const localized = VALIDATION_MESSAGE_COPY[issue.message];
  const fallbackMessage = issue.message.replace(/^Expected /, "");

  return diagnostic(
    getDocumentId(input),
    slideId,
    componentId,
    path.map(String).join(".") || "document",
    localized?.message ?? `Giá trị chưa hợp lệ: ${fallbackMessage}`,
    localized?.remediation ?? "Điều chỉnh giá trị theo yêu cầu hiển thị của thành phần.",
    localized?.expected ?? issue.message
  );
}
