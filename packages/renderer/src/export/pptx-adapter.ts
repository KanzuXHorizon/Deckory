import type { DeckDocumentV2, Frame, SceneElement, SceneSlide } from "@deckory/schema/v2";
import { absoluteFrames } from "@deckory/scene";
import {
  resolveElementExportCapability,
  type ExportCapabilityRegistry
} from "../export-capabilities.js";
import type {
  PptxElementResult,
  PptxExportPlan,
  PptxGeometry,
  PptxLineElement,
  PptxShapeStyle,
  PptxTextStyle
} from "./pptx-types.js";

const editableShapeKinds = new Set(["rectangle", "ellipse", "triangle", "diamond"] as const);

function geometry(frame: Frame, element: SceneElement): PptxGeometry {
  return {
    ...frame,
    ...(element.transform?.rotation !== undefined ? { rotation: element.transform.rotation } : {})
  };
}

function textStyle(element: SceneElement): PptxTextStyle {
  const style = element.style;
  return {
    ...(style?.color ? { color: style.color } : {}),
    ...(style?.fontFamily ? { fontFamily: style.fontFamily } : {}),
    ...(style?.fontSize !== undefined ? { fontSize: style.fontSize } : {}),
    ...(style?.fontWeight !== undefined ? { fontWeight: style.fontWeight } : {}),
    ...(style?.lineHeight !== undefined ? { lineHeight: style.lineHeight } : {}),
    ...(style?.letterSpacing !== undefined ? { letterSpacing: style.letterSpacing } : {}),
    ...(style?.textAlign ? { textAlign: style.textAlign } : {})
  };
}

function shapeStyle(element: SceneElement): PptxShapeStyle {
  const style = element.style;
  return {
    ...(style?.fill ? { fill: style.fill } : {}),
    ...(style?.stroke ? { stroke: style.stroke } : {}),
    ...(style?.strokeWidth !== undefined ? { strokeWidth: style.strokeWidth } : {}),
    ...(element.opacity !== undefined ? { opacity: element.opacity } : {}),
    ...(style?.borderRadius !== undefined ? { borderRadius: style.borderRadius } : {})
  };
}

function base(element: SceneElement, frame: Frame) {
  return {
    sourceId: element.id,
    sourceName: element.name,
    geometry: geometry(frame, element),
    zIndex: element.zIndex
  };
}

function center(frame: Frame): { x: number; y: number } {
  return { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
}

function unsupported(element: SceneElement, frame: Frame, reason: string): PptxElementResult {
  return {
    ...base(element, frame),
    operation: "unsupported",
    capability: "unsupported",
    reason
  };
}

function fallback(
  element: SceneElement,
  frame: Frame,
  fallbackAsset: { type: "png" | "svg"; assetId: string },
  reason: string
): PptxElementResult {
  return {
    ...base(element, frame),
    operation: "addFallbackImage",
    capability: "fallback",
    assetId: fallbackAsset.assetId,
    fallbackType: fallbackAsset.type,
    reason
  };
}

function nativeElement(
  deck: DeckDocumentV2,
  slide: SceneSlide,
  element: SceneElement,
  frame: Frame,
  frames: Readonly<Record<string, Frame>>
): PptxElementResult {
  switch (element.kind) {
    case "text":
      return {
        ...base(element, frame),
        operation: "addText",
        capability: "native-editable",
        text: element.content.text,
        style: textStyle(element)
      };
    case "shape": {
      if (!editableShapeKinds.has(element.content.shape as "rectangle" | "ellipse" | "triangle" | "diamond")) {
        return unsupported(element, frame, `Shape ${element.content.shape} chưa có native PPTX adapter.`);
      }
      return {
        ...base(element, frame),
        operation: "addShape",
        capability: "native-editable",
        shape: element.content.shape as "rectangle" | "ellipse" | "triangle" | "diamond",
        style: shapeStyle(element)
      };
    }
    case "line": {
      const line: PptxLineElement = {
        ...base(element, frame),
        operation: "addLine",
        capability: "native-editable",
        x: frame.x,
        y: frame.y,
        x2: frame.x + element.content.x2,
        y2: frame.y + element.content.y2,
        style: {
          ...(element.style?.stroke ? { stroke: element.style.stroke } : {}),
          ...(element.style?.strokeWidth !== undefined ? { strokeWidth: element.style.strokeWidth } : {}),
          ...(element.opacity !== undefined ? { opacity: element.opacity } : {})
        },
        ...(element.content.markerStart ? { markerStart: element.content.markerStart } : {}),
        ...(element.content.markerEnd ? { markerEnd: element.content.markerEnd } : {})
      };
      return line;
    }
    case "connector": {
      const from = frames[element.content.from.elementId];
      const to = frames[element.content.to.elementId];
      if (!from || !to) return unsupported(element, frame, "Connector tham chiếu endpoint không tồn tại.");
      const start = center(from);
      const end = center(to);
      return {
        ...base(element, frame),
        operation: "addLine",
        capability: "native-editable",
        x: start.x,
        y: start.y,
        x2: end.x,
        y2: end.y,
        markerEnd: "arrow",
        style: {
          ...(element.style?.stroke ? { stroke: element.style.stroke } : {}),
          ...(element.style?.strokeWidth !== undefined ? { strokeWidth: element.style.strokeWidth } : {}),
          ...(element.opacity !== undefined ? { opacity: element.opacity } : {})
        }
      };
    }
    case "image": {
      const asset = deck.assets.find((candidate) => candidate.id === element.content.assetId);
      if (!asset) return unsupported(element, frame, `Không tìm thấy image asset ${element.content.assetId}.`);
      return {
        ...base(element, frame),
        operation: "addImage",
        capability: "native-editable",
        assetId: asset.id,
        alt: element.content.alt ?? element.accessibility.label ?? element.name,
        ...(element.style?.objectFit ? { objectFit: element.style.objectFit } : {})
      };
    }
    case "group":
    case "stack":
    case "grid": {
      const declaredChildren = element.kind === "group" ? element.content.children ?? [] : [];
      const parentChildren = slide.elements.filter((candidate) => candidate.parentId === element.id).map((candidate) => candidate.id);
      return {
        ...base(element, frame),
        operation: "addGroup",
        capability: "native-editable",
        childIds: [...new Set([...declaredChildren, ...parentChildren])]
      };
    }
    default:
      return unsupported(element, frame, `${element.name} (${element.kind}) chưa có native PPTX adapter.`);
  }
}

export function exportDeckToPptxPlan(
  deck: DeckDocumentV2,
  registry: ExportCapabilityRegistry
): PptxExportPlan {
  const warnings: string[] = [];
  const slides = deck.slides.map((slide) => {
    const frames = absoluteFrames(slide);
    const slideWarnings: string[] = [];
    const elements = slide.elements
      .filter((element) => !element.hidden)
      .sort((left, right) => left.zIndex - right.zIndex)
      .map((element) => {
        const frame = frames[element.id] ?? element.frame;
        const resolution = resolveElementExportCapability(element, registry);
        if (resolution.pptx === "fallback" && resolution.fallback) {
          return fallback(
            element,
            frame,
            resolution.fallback,
            resolution.reasons.pptx ?? `${element.name} dùng fallback cho PPTX.`
          );
        }
        if (resolution.pptx === "unsupported") {
          return unsupported(
            element,
            frame,
            resolution.reasons.pptx ?? `${element.name} không hỗ trợ PPTX.`
          );
        }
        return nativeElement(deck, slide, element, frame, frames);
      });

    for (const result of elements) {
      if (result.capability === "unsupported") {
        slideWarnings.push(`${result.sourceName} (${result.sourceId}) không hỗ trợ PPTX: ${result.reason}`);
      } else if (result.capability === "fallback") {
        slideWarnings.push(`${result.sourceName} (${result.sourceId}) dùng fallback ${result.assetId}: ${result.reason}`);
      }
    }
    warnings.push(...slideWarnings);
    return {
      sourceId: slide.id,
      name: slide.name,
      elements,
      warnings: slideWarnings
    };
  });

  return {
    version: 1,
    deckId: deck.id,
    revision: deck.revision,
    title: deck.title,
    canvas: { width: deck.canvas.width, height: deck.canvas.height, unit: "px" },
    slides,
    warnings: [...new Set(warnings)]
  };
}
