import type { Frame } from "@deckory/schema/v2";

export type PptxCapability = "native-editable" | "fallback" | "unsupported";

export type PptxGeometry = Frame & {
  rotation?: number;
};

export type PptxTextStyle = {
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify";
};

export type PptxShapeStyle = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  borderRadius?: number | [number, number, number, number];
};

type PptxElementBase = {
  sourceId: string;
  sourceName: string;
  geometry: PptxGeometry;
  zIndex: number;
  capability: PptxCapability;
};

export type PptxTextElement = PptxElementBase & {
  operation: "addText";
  capability: "native-editable";
  text: string;
  style: PptxTextStyle;
};

export type PptxShapeElement = PptxElementBase & {
  operation: "addShape";
  capability: "native-editable";
  shape: "rectangle" | "ellipse" | "triangle" | "diamond";
  style: PptxShapeStyle;
};

export type PptxLineElement = PptxElementBase & {
  operation: "addLine";
  capability: "native-editable";
  x: number;
  y: number;
  x2: number;
  y2: number;
  markerStart?: string;
  markerEnd?: string;
  style: Pick<PptxShapeStyle, "stroke" | "strokeWidth" | "opacity">;
};

export type PptxImageElement = PptxElementBase & {
  operation: "addImage";
  capability: "native-editable";
  assetId: string;
  alt: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
};

export type PptxGroupElement = PptxElementBase & {
  operation: "addGroup";
  capability: "native-editable";
  childIds: string[];
};

export type PptxFallbackElement = PptxElementBase & {
  operation: "addFallbackImage";
  capability: "fallback";
  assetId: string;
  fallbackType: "png" | "svg";
  reason: string;
};

export type PptxUnsupportedElement = PptxElementBase & {
  operation: "unsupported";
  capability: "unsupported";
  reason: string;
};

export type PptxElementResult =
  | PptxTextElement
  | PptxShapeElement
  | PptxLineElement
  | PptxImageElement
  | PptxGroupElement
  | PptxFallbackElement
  | PptxUnsupportedElement;

export type PptxSlidePlan = {
  sourceId: string;
  name: string;
  elements: PptxElementResult[];
  warnings: string[];
};

export type PptxExportPlan = {
  version: 1;
  deckId: string;
  revision: number;
  title: string;
  canvas: { width: number; height: number; unit: "px" };
  slides: PptxSlidePlan[];
  warnings: string[];
};

export type PptxExportAdapter = {
  write(plan: PptxExportPlan, outputPath: string): Promise<void> | void;
};
