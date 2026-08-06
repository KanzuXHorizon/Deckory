import { z } from "zod";

export const StableIdSchema = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Expected a stable kebab-case ID"
);

const nonEmptyText = z.string().trim().min(1, "Expected non-empty text");
const finiteNumber = z.number().finite();
const opacity = finiteNumber.min(0).max(1);

export const CanvasSpecSchema = z.object({
  width: z.literal(1280),
  height: z.literal(720),
  unit: z.literal("px")
}).strict();

export const FrameSchema = z.object({
  x: finiteNumber,
  y: finiteNumber,
  width: finiteNumber.positive(),
  height: finiteNumber.positive()
}).strict();

export const Transform2DSchema = z.object({
  rotation: finiteNumber.optional(),
  scaleX: finiteNumber.positive().optional(),
  scaleY: finiteNumber.positive().optional(),
  skewX: finiteNumber.optional(),
  skewY: finiteNumber.optional(),
  originX: finiteNumber.optional(),
  originY: finiteNumber.optional()
}).strict();

export const ElementConstraintsSchema = z.object({
  horizontal: z.enum(["left", "right", "center", "stretch", "scale"]).optional(),
  vertical: z.enum(["top", "bottom", "center", "stretch", "scale"]).optional(),
  width: z.enum(["fixed", "hug", "fill"]).optional(),
  height: z.enum(["fixed", "hug", "fill"]).optional(),
  minWidth: finiteNumber.nonnegative().optional(),
  maxWidth: finiteNumber.positive().optional(),
  minHeight: finiteNumber.nonnegative().optional(),
  maxHeight: finiteNumber.positive().optional()
}).strict().superRefine((value, context) => {
  if (value.minWidth !== undefined && value.maxWidth !== undefined && value.minWidth > value.maxWidth) {
    context.addIssue({ code: "custom", path: ["minWidth"], message: "Expected minWidth to be less than or equal to maxWidth" });
  }
  if (value.minHeight !== undefined && value.maxHeight !== undefined && value.minHeight > value.maxHeight) {
    context.addIssue({ code: "custom", path: ["minHeight"], message: "Expected minHeight to be less than or equal to maxHeight" });
  }
});

export const BlendModeSchema = z.enum([
  "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge",
  "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue",
  "saturation", "color", "luminosity"
]);

export const ElementStyleSchema = z.object({
  fill: z.string().trim().min(1).optional(),
  stroke: z.string().trim().min(1).optional(),
  strokeWidth: finiteNumber.nonnegative().optional(),
  borderRadius: z.union([
    finiteNumber.nonnegative(),
    z.tuple([finiteNumber.nonnegative(), finiteNumber.nonnegative(), finiteNumber.nonnegative(), finiteNumber.nonnegative()])
  ]).optional(),
  color: z.string().trim().min(1).optional(),
  fontFamily: z.string().trim().min(1).optional(),
  fontSize: finiteNumber.positive().optional(),
  fontWeight: z.number().int().min(100).max(1000).optional(),
  lineHeight: finiteNumber.positive().optional(),
  letterSpacing: finiteNumber.optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  objectFit: z.enum(["contain", "cover", "fill", "none", "scale-down"]).optional(),
  focalPoint: z.object({ x: finiteNumber.min(0).max(1), y: finiteNumber.min(0).max(1) }).strict().optional(),
  shadow: z.object({
    x: finiteNumber,
    y: finiteNumber,
    blur: finiteNumber.nonnegative().max(128),
    spread: finiteNumber.max(64),
    color: nonEmptyText
  }).strict().optional()
}).strict();

export const BackgroundLayerTypeSchema = z.enum([
  "solid", "linear-gradient", "radial-gradient", "conic-gradient", "mesh-gradient",
  "image", "svg", "pattern", "grid", "noise", "glow", "vignette",
  "color-overlay", "blur-backdrop", "edge-mask"
]);

export const BackgroundLayerSchema = z.object({
  id: StableIdSchema,
  type: BackgroundLayerTypeSchema,
  color: z.string().trim().min(1).optional(),
  colors: z.array(z.string().trim().min(1)).min(2).max(12).optional(),
  angle: finiteNumber.optional(),
  opacity: opacity.default(1),
  blendMode: BlendModeSchema.optional(),
  assetId: StableIdSchema.optional(),
  seed: z.number().int().nonnegative().optional(),
  blur: finiteNumber.nonnegative().max(128).optional(),
  scale: finiteNumber.positive().optional(),
  position: z.object({ x: finiteNumber, y: finiteNumber }).strict().optional(),
  size: z.object({ width: finiteNumber.positive(), height: finiteNumber.positive() }).strict().optional(),
  data: z.record(z.string(), z.unknown()).optional()
}).strict();

export const BackgroundStackSchema = z.object({
  layers: z.array(BackgroundLayerSchema).max(32)
}).strict().superRefine((stack, context) => {
  const ids = new Set<string>();
  stack.layers.forEach((layer, index) => {
    if (ids.has(layer.id)) {
      context.addIssue({
        code: "custom",
        path: ["layers", index, "id"],
        message: `Duplicate background layer ID: ${layer.id}`
      });
    }
    ids.add(layer.id);
  });
});

export const ElementAccessibilitySchema = z.object({
  label: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().min(1).max(2_000).optional(),
  role: z.string().trim().min(1).max(80).optional(),
  decorative: z.boolean().optional(),
  readingOrder: z.number().int().nonnegative().optional()
}).strict().superRefine((value, context) => {
  if (value.decorative && (value.label || value.description)) {
    context.addIssue({ code: "custom", path: ["decorative"], message: "A decorative element cannot also expose an accessible label or description" });
  }
});

export const ElementExportPolicySchema = z.object({
  html: z.enum(["native", "fallback", "unsupported"]).optional(),
  svg: z.enum(["native", "fallback", "unsupported"]).optional(),
  png: z.enum(["native", "fallback", "unsupported"]).optional(),
  pdf: z.enum(["native", "fallback", "unsupported"]).optional(),
  pptx: z.enum(["native-editable", "native", "fallback", "unsupported"]).optional(),
  fallbackAssetId: StableIdSchema.optional()
}).strict();

export const ElementSemanticMetadataSchema = z.object({
  purpose: z.string().trim().min(1).max(120).optional(),
  claimIds: z.array(StableIdSchema).max(64).optional(),
  evidenceIds: z.array(StableIdSchema).max(64).optional(),
  sourceElementIds: z.array(StableIdSchema).max(64).optional()
}).strict();

export const ElementMotionTrackSchema = z.object({
  id: StableIdSchema,
  type: z.enum(["entrance", "emphasis", "exit", "path", "stagger", "morph", "chart-progress", "connector-progress", "camera"]),
  trigger: z.enum(["on-enter", "on-click", "after-previous", "with-previous"]),
  duration: finiteNumber.nonnegative().max(30),
  delay: finiteNumber.nonnegative().max(30).optional(),
  easing: z.enum(["standard", "emphasized", "linear"]).optional(),
  finalState: z.record(z.string(), z.unknown())
}).strict();

export const ElementInteractionSchema = z.object({
  type: z.enum(["none", "inspect", "step", "link", "toggle"]),
  target: z.string().trim().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).optional()
}).strict();

export const SceneElementKindSchema = z.enum([
  "group", "stack", "grid", "text", "rich-text", "image", "icon",
  "shape", "line", "connector", "svg", "chart", "table", "diagram",
  "media", "component-instance", "web-block", "evidence-footer"
]);

const groupContent = z.object({ children: z.array(StableIdSchema).optional() }).strict();
const stackContent = z.object({
  direction: z.enum(["horizontal", "vertical"]),
  gap: finiteNumber.nonnegative().default(0),
  padding: z.union([
    finiteNumber.nonnegative(),
    z.tuple([finiteNumber.nonnegative(), finiteNumber.nonnegative(), finiteNumber.nonnegative(), finiteNumber.nonnegative()])
  ]).default(0),
  align: z.enum(["start", "center", "end", "stretch"]).default("start"),
  justify: z.enum(["start", "center", "end", "space-between"]).default("start"),
  wrap: z.boolean().default(false)
}).strict();
const gridContent = z.object({
  columns: z.number().int().positive().max(24),
  rows: z.number().int().positive().max(24).optional(),
  columnGap: finiteNumber.nonnegative().default(0),
  rowGap: finiteNumber.nonnegative().default(0),
  padding: finiteNumber.nonnegative().default(0)
}).strict();
const textContent = z.object({ text: z.string() }).strict();
const richTextContent = z.object({ document: z.unknown(), plainText: z.string().optional() }).strict();
const imageContent = z.object({ assetId: StableIdSchema, alt: z.string().trim().min(1).optional() }).strict();
const iconContent = z.object({ name: nonEmptyText, library: z.string().trim().min(1).optional() }).strict();
const shapeContent = z.object({ shape: z.enum(["rectangle", "ellipse", "triangle", "diamond", "polygon", "path"]), path: z.string().optional() }).strict();
const lineContent = z.object({ x2: finiteNumber, y2: finiteNumber, markerStart: z.string().optional(), markerEnd: z.string().optional() }).strict();
const connectorContent = z.object({
  from: z.object({ elementId: StableIdSchema, portId: StableIdSchema.optional() }).strict(),
  to: z.object({ elementId: StableIdSchema, portId: StableIdSchema.optional() }).strict(),
  routing: z.enum(["straight", "orthogonal", "curve"]).default("straight")
}).strict();
const svgContent = z.object({ assetId: StableIdSchema.optional(), markup: z.string().trim().min(1).optional() }).strict().refine(
  (value) => Number(value.assetId !== undefined) + Number(value.markup !== undefined) === 1,
  "Expected exactly one of assetId or markup"
);
const chartContent = z.object({ spec: z.record(z.string(), z.unknown()) }).strict();
const tableContent = z.object({ columns: z.array(z.string()), rows: z.array(z.array(z.unknown())) }).strict();
const diagramContent = z.object({ spec: z.record(z.string(), z.unknown()) }).strict();
const mediaContent = z.object({ assetId: StableIdSchema, mediaType: nonEmptyText }).strict();
const componentContent = z.object({ componentId: StableIdSchema, version: nonEmptyText, props: z.record(z.string(), z.unknown()) }).strict();
const webBlockContent = z.object({ manifest: z.record(z.string(), z.unknown()), sourceId: StableIdSchema.optional() }).strict();
const evidenceFooterContent = z.object({ source: nonEmptyText, page: z.string().trim().min(1).optional(), brandLabel: z.string().trim().min(1).optional() }).strict();

const commonElementFields = {
  id: StableIdSchema,
  name: nonEmptyText.max(120),
  parentId: StableIdSchema.optional(),
  frame: FrameSchema,
  transform: Transform2DSchema.optional(),
  constraints: ElementConstraintsSchema.optional(),
  zIndex: z.number().int(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  opacity: opacity.optional(),
  blendMode: BlendModeSchema.optional(),
  style: ElementStyleSchema.optional(),
  motion: z.array(ElementMotionTrackSchema).max(64).optional(),
  interaction: ElementInteractionSchema.optional(),
  accessibility: ElementAccessibilitySchema,
  exportPolicy: ElementExportPolicySchema.optional(),
  semantic: ElementSemanticMetadataSchema.optional()
};

function sceneElementSchema<K extends z.ZodLiteral<string>, C extends z.ZodTypeAny>(kind: K, content: C) {
  return z.object({ ...commonElementFields, kind, content }).strict();
}

export const SceneElementSchema = z.discriminatedUnion("kind", [
  sceneElementSchema(z.literal("group"), groupContent),
  sceneElementSchema(z.literal("stack"), stackContent),
  sceneElementSchema(z.literal("grid"), gridContent),
  sceneElementSchema(z.literal("text"), textContent),
  sceneElementSchema(z.literal("rich-text"), richTextContent),
  sceneElementSchema(z.literal("image"), imageContent),
  sceneElementSchema(z.literal("icon"), iconContent),
  sceneElementSchema(z.literal("shape"), shapeContent),
  sceneElementSchema(z.literal("line"), lineContent),
  sceneElementSchema(z.literal("connector"), connectorContent),
  sceneElementSchema(z.literal("svg"), svgContent),
  sceneElementSchema(z.literal("chart"), chartContent),
  sceneElementSchema(z.literal("table"), tableContent),
  sceneElementSchema(z.literal("diagram"), diagramContent),
  sceneElementSchema(z.literal("media"), mediaContent),
  sceneElementSchema(z.literal("component-instance"), componentContent),
  sceneElementSchema(z.literal("web-block"), webBlockContent),
  sceneElementSchema(z.literal("evidence-footer"), evidenceFooterContent)
]);

export const GuideSchema = z.object({
  id: StableIdSchema,
  axis: z.enum(["x", "y"]),
  position: finiteNumber,
  locked: z.boolean().optional()
}).strict();

export const SlideTransitionV2Schema = z.object({
  type: z.enum(["none", "fade", "slide", "push", "wipe", "zoom", "morph"]),
  duration: finiteNumber.min(0).max(5).optional(),
  easing: z.enum(["standard", "emphasized", "linear"]).optional()
}).strict();

export const SlideEvidenceSchema = z.object({
  source: nonEmptyText,
  status: z.enum(["verified", "unverified", "illustrative", "stale"]).default("unverified"),
  sourceIds: z.array(StableIdSchema).max(64).optional()
}).strict();

export const SceneSlideSchema = z.object({
  id: StableIdSchema,
  name: nonEmptyText.max(140),
  purpose: z.string().trim().min(1).max(120).optional(),
  conclusion: z.string().trim().min(1).max(500).optional(),
  masterId: StableIdSchema.optional(),
  background: BackgroundStackSchema,
  guides: z.array(GuideSchema).max(128).optional(),
  transition: SlideTransitionV2Schema.optional(),
  notes: z.string().trim().min(1).max(20_000).optional(),
  evidence: SlideEvidenceSchema.optional(),
  elements: z.array(SceneElementSchema).max(2_000)
}).strict().superRefine((slide, context) => {
  const ids = new Set<string>();
  slide.elements.forEach((element, index) => {
    if (ids.has(element.id)) {
      context.addIssue({ code: "custom", path: ["elements", index, "id"], message: `Duplicate element ID: ${element.id}` });
    }
    ids.add(element.id);
  });

  slide.elements.forEach((element, index) => {
    if (element.parentId && !ids.has(element.parentId)) {
      context.addIssue({ code: "custom", path: ["elements", index, "parentId"], message: `parentId does not reference an element in this slide: ${element.parentId}` });
    }
    if (element.parentId === element.id) {
      context.addIssue({ code: "custom", path: ["elements", index, "parentId"], message: "parentId cannot reference the element itself" });
    }
  });

  const byId = new Map(slide.elements.map((element) => [element.id, element]));
  slide.elements.forEach((element, index) => {
    const visited = new Set<string>([element.id]);
    let parentId = element.parentId;
    while (parentId) {
      if (visited.has(parentId)) {
        context.addIssue({ code: "custom", path: ["elements", index, "parentId"], message: "Element hierarchy contains a cycle" });
        break;
      }
      visited.add(parentId);
      parentId = byId.get(parentId)?.parentId;
    }
  });
});

export const DeckAssetV2Schema = z.object({
  id: StableIdSchema,
  type: z.enum(["image", "font", "video", "audio", "svg", "data"]),
  src: z.string().trim().min(1),
  mediaType: z.string().trim().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  source: z.object({ label: nonEmptyText.max(300), url: z.string().url().optional() }).strict().optional()
}).strict();

export const DeckThemeV2Schema = z.object({
  id: StableIdSchema,
  tokens: z.record(z.string(), z.unknown())
}).strict();

export const DeckDataSourceSchema = z.object({
  id: StableIdSchema,
  label: nonEmptyText.max(300),
  kind: z.enum(["document", "dataset", "api", "manual", "fixture"]),
  status: z.enum(["verified", "unverified", "illustrative", "stale"]),
  url: z.string().url().optional(),
  retrievedAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).strict();

export const SlideMasterV2Schema = z.object({
  id: StableIdSchema,
  name: nonEmptyText,
  safeArea: z.object({ top: finiteNumber.nonnegative(), right: finiteNumber.nonnegative(), bottom: finiteNumber.nonnegative(), left: finiteNumber.nonnegative() }).strict(),
  background: BackgroundStackSchema.optional(),
  elements: z.array(SceneElementSchema).max(256).optional()
}).strict();

export const ComponentPackageReferenceSchema = z.object({
  id: StableIdSchema,
  version: nonEmptyText,
  integrity: z.string().trim().min(1).optional()
}).strict();

export const DeckDocumentV2Schema = z.object({
  schemaVersion: z.literal(2),
  id: StableIdSchema,
  revision: z.number().int().nonnegative(),
  title: nonEmptyText.max(200),
  locale: z.enum(["vi-VN", "en-US"]),
  canvas: CanvasSpecSchema,
  theme: DeckThemeV2Schema,
  assets: z.array(DeckAssetV2Schema).max(1_024),
  dataSources: z.array(DeckDataSourceSchema).max(1_024).optional(),
  masters: z.array(SlideMasterV2Schema).max(128).optional(),
  componentPackages: z.array(ComponentPackageReferenceSchema).max(128).optional(),
  slides: z.array(SceneSlideSchema).min(1).max(1_000)
}).strict().superRefine((deck, context) => {
  const unique = (values: readonly { id: string }[], path: string, label: string) => {
    const ids = new Set<string>();
    values.forEach((value, index) => {
      if (ids.has(value.id)) {
        context.addIssue({ code: "custom", path: [path, index, "id"], message: `Duplicate ${label} ID: ${value.id}` });
      }
      ids.add(value.id);
    });
  };
  unique(deck.slides, "slides", "slide");
  unique(deck.assets, "assets", "asset");
  unique(deck.dataSources ?? [], "dataSources", "data source");
  unique(deck.masters ?? [], "masters", "master");
});

export type CanvasSpec = z.infer<typeof CanvasSpecSchema>;
export type Frame = z.infer<typeof FrameSchema>;
export type Transform2D = z.infer<typeof Transform2DSchema>;
export type ElementConstraints = z.infer<typeof ElementConstraintsSchema>;
export type ElementStyle = z.infer<typeof ElementStyleSchema>;
export type BackgroundLayer = z.infer<typeof BackgroundLayerSchema>;
export type BackgroundStack = z.infer<typeof BackgroundStackSchema>;
export type SceneElementKind = z.infer<typeof SceneElementKindSchema>;
export type SceneElement = z.infer<typeof SceneElementSchema>;
export type SceneSlide = z.infer<typeof SceneSlideSchema>;
export type DeckAssetV2 = z.infer<typeof DeckAssetV2Schema>;
export type DeckThemeV2 = z.infer<typeof DeckThemeV2Schema>;
export type DeckDataSource = z.infer<typeof DeckDataSourceSchema>;
export type SlideMasterV2 = z.infer<typeof SlideMasterV2Schema>;
export type DeckDocumentV2 = z.infer<typeof DeckDocumentV2Schema>;
