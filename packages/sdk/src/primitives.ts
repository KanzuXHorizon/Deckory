import type {
  BackgroundStack,
  ElementConstraints,
  ElementStyle,
  Frame,
  SceneElement,
  Transform2D
} from "@deckory/schema/v2";
import type { ChartSpec, DiagramSpec } from "@deckory/visuals";
import { defineWebBlockManifest, type WebBlockManifest } from "./web-block";
import {
  normalizeSceneChildren,
  type SceneElementDescription,
  type SceneNodeDescription,
  type SceneSlideDescription
} from "./jsx-runtime";
import { createScenePrimitive } from "./scene-node-internals";

type Accessibility = SceneElement["accessibility"];
type ExportPolicy = NonNullable<SceneElement["exportPolicy"]>;
type MotionTrack = NonNullable<SceneElement["motion"]>[number];
type Interaction = NonNullable<SceneElement["interaction"]>;
type SemanticMetadata = NonNullable<SceneElement["semantic"]>;

export type ExportCapability = "html" | "svg" | "png" | "pdf" | "pptx";

export interface CommonElementProps {
  id: string;
  name?: string;
  frame: Frame;
  zIndex?: number;
  transform?: Transform2D;
  constraints?: ElementConstraints;
  locked?: boolean;
  hidden?: boolean;
  opacity?: number;
  blendMode?: SceneElement["blendMode"];
  style?: ElementStyle;
  motion?: readonly MotionTrack[];
  interaction?: Interaction;
  semantic?: SemanticMetadata;
  accessibility?: Accessibility;
  accessibleSummary?: string;
  decorative?: boolean;
  exportCapabilities?: readonly ExportCapability[];
  children?: unknown;
}

export interface SlideProps {
  background: BackgroundStack;
  purpose?: string;
  conclusion?: string;
  masterId?: string;
  guides?: readonly unknown[];
  transition?: unknown;
  notes?: string;
  evidence?: unknown;
  children?: unknown;
}

function nonTextChildren(children: unknown, primitiveName: string): readonly SceneNodeDescription[] {
  const normalized = normalizeSceneChildren(children);
  const textNode = normalized.find((child) => child.nodeType === "text");
  if (textNode?.nodeType === "text") {
    throw new TypeError(`${primitiveName} không chấp nhận text thô; hãy dùng primitive Text.`);
  }
  const slideNode = normalized.find((child) => child.nodeType === "slide");
  if (slideNode) {
    throw new TypeError(`${primitiveName} không thể chứa Slide lồng nhau.`);
  }
  return normalized;
}

function textFromChildren(children: unknown, primitiveName: string): string {
  const normalized = normalizeSceneChildren(children);
  for (const child of normalized) {
    if (child.nodeType !== "text") {
      throw new TypeError(`${primitiveName} chỉ chấp nhận chuỗi hoặc số làm nội dung.`);
    }
  }
  return normalized.map((child) => child.nodeType === "text" ? child.value : "").join("");
}

function exportPolicyFromCapabilities(
  capabilities: readonly ExportCapability[] | undefined,
  fallbackAssetId?: string
): ExportPolicy | undefined {
  if (!capabilities && !fallbackAssetId) return undefined;
  const supported = new Set(capabilities ?? []);
  return {
    html: supported.has("html") ? "native" : fallbackAssetId ? "fallback" : "unsupported",
    svg: supported.has("svg") ? "native" : fallbackAssetId ? "fallback" : "unsupported",
    png: supported.has("png") ? "native" : fallbackAssetId ? "fallback" : "unsupported",
    pdf: supported.has("pdf") ? "native" : fallbackAssetId ? "fallback" : "unsupported",
    pptx: supported.has("pptx") ? "native" : fallbackAssetId ? "fallback" : "unsupported",
    ...(fallbackAssetId ? { fallbackAssetId } : {})
  };
}

function accessibilityFor(
  props: CommonElementProps,
  defaultLabel?: string
): Accessibility {
  if (props.decorative) return { decorative: true };
  if (props.accessibility) return props.accessibility;
  const label = props.accessibleSummary?.trim() || defaultLabel?.trim();
  return label ? { label } : {};
}

function createElement(
  kind: SceneElement["kind"],
  props: CommonElementProps,
  content: Record<string, unknown>,
  children: readonly SceneNodeDescription[] = [],
  defaultLabel?: string,
  fallbackAssetId?: string
): SceneElementDescription {
  const exportPolicy = exportPolicyFromCapabilities(props.exportCapabilities, fallbackAssetId);
  const element: Record<string, unknown> = {
    id: props.id,
    name: props.name ?? props.id,
    kind,
    frame: props.frame,
    zIndex: props.zIndex ?? 0,
    content,
    accessibility: accessibilityFor(props, defaultLabel),
    ...(props.transform ? { transform: props.transform } : {}),
    ...(props.constraints ? { constraints: props.constraints } : {}),
    ...(props.locked !== undefined ? { locked: props.locked } : {}),
    ...(props.hidden !== undefined ? { hidden: props.hidden } : {}),
    ...(props.opacity !== undefined ? { opacity: props.opacity } : {}),
    ...(props.blendMode ? { blendMode: props.blendMode } : {}),
    ...(props.style ? { style: props.style } : {}),
    ...(props.motion ? { motion: [...props.motion] } : {}),
    ...(props.interaction ? { interaction: props.interaction } : {}),
    ...(props.semantic ? { semantic: props.semantic } : {}),
    ...(exportPolicy ? { exportPolicy } : {})
  };
  return { nodeType: "element", element, children };
}

export const Slide = createScenePrimitive<SlideProps>("Slide", (props): SceneSlideDescription => ({
  nodeType: "slide",
  slide: {
    background: props.background,
    ...(props.purpose ? { purpose: props.purpose } : {}),
    ...(props.conclusion ? { conclusion: props.conclusion } : {}),
    ...(props.masterId ? { masterId: props.masterId } : {}),
    ...(props.guides ? { guides: [...props.guides] } : {}),
    ...(props.transition ? { transition: props.transition } : {}),
    ...(props.notes ? { notes: props.notes } : {}),
    ...(props.evidence ? { evidence: props.evidence } : {})
  },
  children: nonTextChildren(props.children, "Slide")
}));

export const Group = createScenePrimitive<CommonElementProps>("Group", (props) => {
  const children = nonTextChildren(props.children, "Group");
  const childIds = children.flatMap((child) => child.nodeType === "element" && typeof child.element.id === "string" ? [child.element.id] : []);
  return createElement("group", props, { children: childIds }, children, props.accessibleSummary);
});

export interface StackProps extends CommonElementProps {
  direction: "horizontal" | "vertical";
  gap?: number;
  padding?: number | readonly [number, number, number, number];
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between";
  wrap?: boolean;
}

export const Stack = createScenePrimitive<StackProps>("Stack", (props) => createElement(
  "stack",
  props,
  {
    direction: props.direction,
    gap: props.gap ?? 0,
    padding: props.padding ?? 0,
    align: props.align ?? "start",
    justify: props.justify ?? "start",
    wrap: props.wrap ?? false
  },
  nonTextChildren(props.children, "Stack"),
  props.accessibleSummary
));

export interface GridProps extends CommonElementProps {
  columns: number;
  rows?: number;
  columnGap?: number;
  rowGap?: number;
  padding?: number;
}

export const Grid = createScenePrimitive<GridProps>("Grid", (props) => createElement(
  "grid",
  props,
  {
    columns: props.columns,
    ...(props.rows !== undefined ? { rows: props.rows } : {}),
    columnGap: props.columnGap ?? 0,
    rowGap: props.rowGap ?? 0,
    padding: props.padding ?? 0
  },
  nonTextChildren(props.children, "Grid"),
  props.accessibleSummary
));

export const Text = createScenePrimitive<CommonElementProps>("Text", (props) => {
  const text = textFromChildren(props.children, "Text");
  return createElement("text", props, { text }, [], text);
});

export interface RichTextProps extends CommonElementProps {
  document: unknown;
  plainText?: string;
}

export const RichText = createScenePrimitive<RichTextProps>("RichText", (props) => createElement(
  "rich-text",
  props,
  { document: props.document, ...(props.plainText !== undefined ? { plainText: props.plainText } : {}) },
  [],
  props.accessibleSummary ?? props.plainText
));

export interface ImageProps extends CommonElementProps {
  assetId: string;
  alt: string;
}
export const Image = createScenePrimitive<ImageProps>("Image", (props) => createElement("image", props, { assetId: props.assetId, alt: props.alt }, [], props.alt));

export interface IconProps extends CommonElementProps {
  icon: string;
  library?: string;
}
export const Icon = createScenePrimitive<IconProps>("Icon", (props) => createElement("icon", props, { name: props.icon, ...(props.library ? { library: props.library } : {}) }, [], props.accessibleSummary));

export interface ShapeProps extends CommonElementProps {
  shape: "rectangle" | "ellipse" | "triangle" | "diamond" | "polygon" | "path";
  path?: string;
  data?: unknown;
}
export const Shape = createScenePrimitive<ShapeProps>("Shape", (props) => createElement("shape", props, { shape: props.shape, ...(props.path ? { path: props.path } : {}) }, [], props.accessibleSummary));

export interface LineProps extends CommonElementProps {
  x2: number;
  y2: number;
  markerStart?: string;
  markerEnd?: string;
}
export const Line = createScenePrimitive<LineProps>("Line", (props) => createElement("line", props, {
  x2: props.x2,
  y2: props.y2,
  ...(props.markerStart ? { markerStart: props.markerStart } : {}),
  ...(props.markerEnd ? { markerEnd: props.markerEnd } : {})
}, [], props.accessibleSummary));

export interface ConnectorProps extends CommonElementProps {
  from: { elementId: string; portId?: string };
  to: { elementId: string; portId?: string };
  routing?: "straight" | "orthogonal" | "curve";
}
export const Connector = createScenePrimitive<ConnectorProps>("Connector", (props) => createElement("connector", props, {
  from: props.from,
  to: props.to,
  routing: props.routing ?? "straight"
}, [], props.accessibleSummary));

export type SvgProps = CommonElementProps & ({ assetId: string; markup?: never } | { assetId?: never; markup: string });
export const Svg = createScenePrimitive<SvgProps>("Svg", (props) => createElement("svg", props, "assetId" in props && props.assetId ? { assetId: props.assetId } : { markup: props.markup }, [], props.accessibleSummary));

export interface ChartProps extends CommonElementProps { chart: ChartSpec; }
export const Chart = createScenePrimitive<ChartProps>("Chart", (props) => createElement("chart", props, { chart: props.chart }, [], props.accessibleSummary ?? props.chart.accessibleSummary));

export interface TableProps extends CommonElementProps { columns: readonly string[]; rows: readonly (readonly unknown[])[]; }
export const Table = createScenePrimitive<TableProps>("Table", (props) => createElement("table", props, { columns: [...props.columns], rows: props.rows.map((row) => [...row]) }, [], props.accessibleSummary));

export interface DiagramProps extends CommonElementProps { diagram: DiagramSpec; }
export const Diagram = createScenePrimitive<DiagramProps>("Diagram", (props) => createElement("diagram", props, { diagram: props.diagram }, [], props.accessibleSummary ?? props.diagram.accessibleSummary));

export interface ComponentProps extends CommonElementProps {
  componentId: string;
  version: string;
  componentProps: Record<string, unknown>;
  accessibleSummary: string;
  exportCapabilities: readonly ExportCapability[];
}
export const Component = createScenePrimitive<ComponentProps>("Component", (props) => createElement("component-instance", props, {
  componentId: props.componentId,
  version: props.version,
  props: props.componentProps
}, [], props.accessibleSummary));

export interface WebBlockProps extends CommonElementProps {
  manifest: WebBlockManifest;
  sourceId?: string;
}
export const WebBlock = createScenePrimitive<WebBlockProps>("WebBlock", (props) => {
  const manifest = defineWebBlockManifest(props.manifest);
  return createElement("web-block", {
    ...props,
    accessibleSummary: manifest.accessibleSummary,
    exportCapabilities: []
  }, {
    manifest,
    ...(props.sourceId ? { sourceId: props.sourceId } : {})
  }, [], manifest.accessibleSummary, manifest.staticFallback.assetId);
});

export interface EvidenceFooterProps extends CommonElementProps {
  source: string;
  page?: string;
  brandLabel?: string;
}
export const EvidenceFooter = createScenePrimitive<EvidenceFooterProps>("EvidenceFooter", (props) => createElement("evidence-footer", props, {
  source: props.source,
  ...(props.page ? { page: props.page } : {}),
  ...(props.brandLabel ? { brandLabel: props.brandLabel } : {})
}, [], props.accessibleSummary ?? props.source));
