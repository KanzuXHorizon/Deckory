import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  BackgroundLayer,
  DeckAssetV2,
  SceneElement,
  SceneSlide
} from "@deckory/schema/v2";
import { ChartRenderer } from "../chart-renderer";
import { DiagramRenderer } from "../diagram-renderer";
import {
  resolveElementExportCapability,
  type ExportCapabilityRegistry
} from "../export-capabilities";
import { buildSceneTree, type SceneTreeNode } from "../scene-tree";
import {
  embedExportAssets,
  type EmbeddedExportAsset,
  type ExportAssetEmbedContext
} from "./asset-embed";

export type SvgExportContext = ExportAssetEmbedContext & {
  assets: readonly DeckAssetV2[];
  registry: ExportCapabilityRegistry;
  deckTitle: string;
};

function text(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function attribute(value: unknown): string {
  return text(value).replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function number(value: number): string {
  const rounded = Number(value.toFixed(4));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function safePaint(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const candidate = value.trim();
  if (/^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([^)]*\)|[a-z][a-z0-9-]*)$/i.test(candidate)) return candidate;
  return fallback;
}

function assetById(assets: readonly EmbeddedExportAsset[]): Map<string, EmbeddedExportAsset> {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

function motionFinalState(element: SceneElement): Record<string, number> {
  const state: Record<string, number> = {};
  for (const track of element.motion ?? []) {
    for (const [key, value] of Object.entries(track.finalState)) {
      if (typeof value === "number" && Number.isFinite(value)) state[key] = value;
    }
  }
  return state;
}

function transformFor(element: SceneElement): string {
  const motion = motionFinalState(element);
  const transforms = [
    `translate(${number(element.frame.x + (motion.translateX ?? 0))} ${number(element.frame.y + (motion.translateY ?? 0))})`
  ];
  const rotation = motion.rotation ?? element.transform?.rotation;
  const scale = motion.scale;
  const scaleX = motion.scaleX ?? element.transform?.scaleX ?? scale;
  const scaleY = motion.scaleY ?? element.transform?.scaleY ?? scale;
  const skewX = element.transform?.skewX;
  const skewY = element.transform?.skewY;
  if (rotation !== undefined && rotation !== 0) {
    const originX = element.transform?.originX ?? element.frame.width / 2;
    const originY = element.transform?.originY ?? element.frame.height / 2;
    transforms.push(`rotate(${number(rotation)} ${number(originX)} ${number(originY)})`);
  }
  if ((scaleX !== undefined && scaleX !== 1) || (scaleY !== undefined && scaleY !== 1)) {
    transforms.push(`scale(${number(scaleX ?? 1)} ${number(scaleY ?? 1)})`);
  }
  if (skewX !== undefined && skewX !== 0) transforms.push(`skewX(${number(skewX)})`);
  if (skewY !== undefined && skewY !== 0) transforms.push(`skewY(${number(skewY)})`);
  return transforms.join(" ");
}

function opacityFor(element: SceneElement): string | undefined {
  const motion = motionFinalState(element);
  const opacity = motion.opacity ?? element.opacity;
  return opacity === undefined ? undefined : number(Math.max(0, Math.min(1, opacity)));
}

function styleAttributes(element: SceneElement): string {
  const style = element.style;
  const values: string[] = [];
  const opacity = opacityFor(element);
  if (opacity !== undefined) values.push(`opacity="${opacity}"`);
  if (style?.color) values.push(`color="${attribute(safePaint(style.color, "#15171a"))}"`);
  if (element.hidden) values.push('display="none"');
  return values.length > 0 ? ` ${values.join(" ")}` : "";
}

function backgroundDefinitions(layers: readonly BackgroundLayer[]): string {
  const definitions: string[] = [];
  for (const layer of layers) {
    if (layer.type === "linear-gradient" || layer.type === "radial-gradient") {
      const colors = layer.colors ?? (layer.color ? [layer.color, layer.color] : ["#ffffff", "#ffffff"]);
      const stops = colors.map((color, index) => {
        const offset = colors.length === 1 ? 0 : index / (colors.length - 1);
        return `<stop offset="${number(offset * 100)}%" stop-color="${attribute(safePaint(color, "#ffffff"))}"/>`;
      }).join("");
      if (layer.type === "linear-gradient") {
        const angle = (layer.angle ?? 135) * Math.PI / 180;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        definitions.push(`<linearGradient id="bg-${attribute(layer.id)}" x1="${number(50 - x * 50)}%" y1="${number(50 - y * 50)}%" x2="${number(50 + x * 50)}%" y2="${number(50 + y * 50)}%">${stops}</linearGradient>`);
      } else {
        const position = layer.position ?? { x: 50, y: 50 };
        definitions.push(`<radialGradient id="bg-${attribute(layer.id)}" cx="${number(position.x)}%" cy="${number(position.y)}%" r="70%">${stops}</radialGradient>`);
      }
    }
  }
  return definitions.join("");
}

function backgroundLayerMarkup(layer: BackgroundLayer, assets: Map<string, EmbeddedExportAsset>): string {
  const opacity = number(layer.opacity);
  const common = ` data-background-layer="${attribute(layer.id)}" opacity="${opacity}"`;
  switch (layer.type) {
    case "solid":
    case "color-overlay":
      return `<rect${common} width="1280" height="720" fill="${attribute(safePaint(layer.color, "#ffffff"))}"/>`;
    case "linear-gradient":
    case "radial-gradient":
      return `<rect${common} width="1280" height="720" fill="url(#bg-${attribute(layer.id)})"/>`;
    case "image":
    case "svg": {
      if (!layer.assetId) return "";
      const asset = assets.get(layer.assetId);
      if (!asset) throw new Error(`Background asset không tồn tại: ${layer.assetId}.`);
      return `<image${common} width="1280" height="720" preserveAspectRatio="xMidYMid slice" href="${attribute(asset.src)}"/>`;
    }
    case "grid": {
      const size = typeof layer.data?.size === "number" ? layer.data.size : 32;
      const color = safePaint(layer.color, "#d8dad6");
      return `<g${common} stroke="${attribute(color)}" stroke-width="1"><path d="M0 0H1280M0 0V720" opacity="0"/><path d="${Array.from({ length: Math.ceil(1280 / size) + 1 }, (_, index) => `M${number(index * size)} 0V720`).join("")}${Array.from({ length: Math.ceil(720 / size) + 1 }, (_, index) => `M0 ${number(index * size)}H1280`).join("")}"/></g>`;
    }
    case "vignette":
      return `<rect${common} width="1280" height="720" fill="none" stroke="${attribute(safePaint(layer.color, "#000000"))}" stroke-width="80"/>`;
    default:
      return "";
  }
}

function extractSvg(markup: string, label: string): string {
  const match = markup.match(/<svg\b[\s\S]*?<\/svg>/i);
  if (!match) throw new Error(`${label} không tạo được SVG native ở export mode.`);
  return match[0];
}

function fallbackAssetId(element: SceneElement): string | undefined {
  if (element.kind === "web-block") {
    const value = element.content.manifest.staticFallback;
    if (value && typeof value === "object" && typeof (value as Record<string, unknown>).assetId === "string") {
      return (value as Record<string, unknown>).assetId as string;
    }
  }
  return element.exportPolicy?.fallbackAssetId;
}

function fallbackMarkup(
  element: SceneElement,
  assets: Map<string, EmbeddedExportAsset>
): string {
  const assetId = fallbackAssetId(element);
  if (!assetId) throw new Error(`Element ${element.id} cần fallback nhưng không khai báo fallback asset.`);
  const asset = assets.get(assetId);
  if (!asset) throw new Error(`Fallback asset không tồn tại: ${assetId}.`);
  const label = element.accessibility.label ?? element.accessibility.description ?? element.name;
  return `<g data-export-status="fallback" data-fallback-asset-id="${attribute(assetId)}"><title>${text(label)}</title><image width="${number(element.frame.width)}" height="${number(element.frame.height)}" preserveAspectRatio="xMidYMid meet" href="${attribute(asset.src)}"/></g>`;
}

function textLines(value: string): string[] {
  return value.normalize("NFC").split(/\r?\n/u);
}

function textMarkup(element: Extract<SceneElement, { kind: "text" }>): string {
  const fontSize = element.style?.fontSize ?? 24;
  const lineHeight = (element.style?.lineHeight ?? 1.2) * fontSize;
  const fill = safePaint(element.style?.color, "#15171a");
  const weight = element.style?.fontWeight ?? 500;
  const family = element.style?.fontFamily ? ` font-family="${attribute(element.style.fontFamily)}"` : "";
  const anchor = element.style?.textAlign === "center" ? "middle" : element.style?.textAlign === "right" ? "end" : "start";
  const x = anchor === "middle" ? element.frame.width / 2 : anchor === "end" ? element.frame.width : 0;
  const lines = textLines(element.content.text).map((line, index) =>
    `<tspan x="${number(x)}" dy="${index === 0 ? number(fontSize) : number(lineHeight)}">${text(line)}</tspan>`
  ).join("");
  return `<text x="${number(x)}" y="0" text-anchor="${anchor}" fill="${attribute(fill)}" font-size="${number(fontSize)}" font-weight="${number(weight)}"${family}>${lines}</text>`;
}

function richTextMarkup(element: Extract<SceneElement, { kind: "rich-text" }>): string {
  const content = element.content.plainText ?? element.accessibility.label ?? element.name;
  const surrogate: Extract<SceneElement, { kind: "text" }> = {
    ...element,
    kind: "text",
    content: { text: content }
  };
  return textMarkup(surrogate);
}

function shapeMarkup(element: Extract<SceneElement, { kind: "shape" }>): string {
  const fill = safePaint(element.style?.fill, "transparent");
  const stroke = safePaint(element.style?.stroke, "none");
  const strokeWidth = element.style?.strokeWidth ?? 0;
  const radius = Array.isArray(element.style?.borderRadius)
    ? element.style.borderRadius[0] ?? 0
    : element.style?.borderRadius ?? 0;
  const common = `fill="${attribute(fill)}" stroke="${attribute(stroke)}" stroke-width="${number(strokeWidth)}"`;
  switch (element.content.shape) {
    case "ellipse":
      return `<ellipse cx="${number(element.frame.width / 2)}" cy="${number(element.frame.height / 2)}" rx="${number(element.frame.width / 2)}" ry="${number(element.frame.height / 2)}" ${common}/>`;
    case "triangle":
      return `<polygon points="${number(element.frame.width / 2)},0 ${number(element.frame.width)},${number(element.frame.height)} 0,${number(element.frame.height)}" ${common}/>`;
    case "diamond":
      return `<polygon points="${number(element.frame.width / 2)},0 ${number(element.frame.width)},${number(element.frame.height / 2)} ${number(element.frame.width / 2)},${number(element.frame.height)} 0,${number(element.frame.height / 2)}" ${common}/>`;
    case "polygon":
    case "path":
      return element.content.path
        ? `<path d="${attribute(element.content.path)}" ${common}/>`
        : `<rect width="${number(element.frame.width)}" height="${number(element.frame.height)}" ${common}/>`;
    default:
      return `<rect width="${number(element.frame.width)}" height="${number(element.frame.height)}" rx="${number(radius)}" ry="${number(radius)}" ${common}/>`;
  }
}

function imageMarkup(
  element: Extract<SceneElement, { kind: "image" | "media" | "svg" }>,
  assets: Map<string, EmbeddedExportAsset>
): string {
  const assetId = element.content.assetId;
  if (!assetId) throw new Error(`Element ${element.id} thiếu assetId cho SVG export.`);
  const asset = assets.get(assetId);
  if (!asset) throw new Error(`Asset không tồn tại: ${assetId}.`);
  const label = element.accessibility.label ?? (element.kind === "image" ? element.content.alt : undefined) ?? element.name;
  return `<g><title>${text(label)}</title><image width="${number(element.frame.width)}" height="${number(element.frame.height)}" preserveAspectRatio="xMidYMid meet" href="${attribute(asset.src)}"/></g>`;
}

function tableMarkup(element: Extract<SceneElement, { kind: "table" }>): string {
  const columns = Math.max(1, element.content.columns.length);
  const rows = Math.max(1, element.content.rows.length + 1);
  const cellWidth = element.frame.width / columns;
  const cellHeight = element.frame.height / rows;
  const parts: string[] = [`<rect width="${number(element.frame.width)}" height="${number(element.frame.height)}" fill="#ffffff" stroke="#d8dad6"/>`];
  element.content.columns.forEach((column, index) => {
    parts.push(`<text x="${number(index * cellWidth + 8)}" y="${number(cellHeight * 0.68)}" font-size="12" font-weight="700" fill="#15171a">${text(column)}</text>`);
  });
  element.content.rows.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      parts.push(`<text x="${number(columnIndex * cellWidth + 8)}" y="${number((rowIndex + 1) * cellHeight + cellHeight * 0.68)}" font-size="11" fill="#454a51">${text(cell)}</text>`);
    });
  });
  for (let column = 1; column < columns; column += 1) parts.push(`<line x1="${number(column * cellWidth)}" y1="0" x2="${number(column * cellWidth)}" y2="${number(element.frame.height)}" stroke="#d8dad6"/>`);
  for (let row = 1; row < rows; row += 1) parts.push(`<line x1="0" y1="${number(row * cellHeight)}" x2="${number(element.frame.width)}" y2="${number(row * cellHeight)}" stroke="#d8dad6"/>`);
  return parts.join("");
}

function renderElementBody(
  element: SceneElement,
  assets: Map<string, EmbeddedExportAsset>,
  registry: ExportCapabilityRegistry
): string {
  const capability = resolveElementExportCapability(element, registry);
  if (capability.svg === "fallback") return fallbackMarkup(element, assets);
  if (capability.svg === "unsupported") throw new Error(`Element ${element.id} không hỗ trợ SVG export: ${capability.reasons.svg ?? "không có renderer"}`);

  switch (element.kind) {
    case "group":
    case "stack":
    case "grid":
      return "";
    case "text":
      return textMarkup(element);
    case "rich-text":
      return richTextMarkup(element);
    case "image":
    case "media":
      return imageMarkup(element, assets);
    case "svg":
      if (element.content.assetId) return imageMarkup(element, assets);
      throw new Error(`Inline SVG markup không được nhúng trực tiếp khi chưa qua sanitizer: ${element.id}.`);
    case "icon":
      return `<text x="${number(element.frame.width / 2)}" y="${number(element.frame.height / 2)}" text-anchor="middle" dominant-baseline="middle" font-size="${number(Math.min(element.frame.width, element.frame.height) * 0.4)}" fill="currentColor">${text(element.content.name)}</text>`;
    case "shape":
      return shapeMarkup(element);
    case "line":
      return `<line x1="0" y1="0" x2="${number(element.content.x2)}" y2="${number(element.content.y2)}" stroke="${attribute(safePaint(element.style?.stroke ?? element.style?.color, "#15171a"))}" stroke-width="${number(element.style?.strokeWidth ?? 2)}"/>`;
    case "connector":
      return `<path d="M0 0 L${number(element.frame.width)} ${number(element.frame.height)}" fill="none" stroke="${attribute(safePaint(element.style?.stroke ?? element.style?.color, "#15171a"))}" stroke-width="${number(element.style?.strokeWidth ?? 2)}"/>`;
    case "chart": {
      const markup = renderToStaticMarkup(createElement(ChartRenderer, {
        spec: element.content.chart,
        width: element.frame.width,
        height: element.frame.height,
        mode: "export"
      }));
      const svg = extractSvg(markup, `Chart ${element.id}`);
      const evidence = element.content.chart.evidence.label ?? element.content.chart.evidence.sourceIds.join(", ");
      return `<g data-chart-status="ready" data-chart-variant="${attribute(element.content.chart.variant)}"><title>${text(element.content.chart.title)}</title><desc>${text(element.content.chart.accessibleSummary)}</desc>${svg}<text x="4" y="18" font-size="14" font-weight="700" fill="currentColor">${text(element.content.chart.title)}</text>${evidence ? `<text x="4" y="${number(element.frame.height - 6)}" font-size="10" fill="currentColor" opacity="0.72">${text(evidence)}</text>` : ""}</g>`;
    }
    case "diagram": {
      const markup = renderToStaticMarkup(createElement(DiagramRenderer, {
        spec: element.content.diagram,
        width: element.frame.width,
        height: element.frame.height
      }));
      const svg = extractSvg(markup, `Diagram ${element.id}`);
      const evidence = element.content.diagram.evidence.label ?? element.content.diagram.evidence.sourceIds.join(", ");
      return `<g data-diagram-status="ready" data-diagram-strategy="${attribute(element.content.diagram.layout)}"><title>${text(element.content.diagram.title)}</title><desc>${text(element.content.diagram.accessibleSummary)}</desc>${svg}<text x="4" y="18" font-size="14" font-weight="700" fill="currentColor">${text(element.content.diagram.title)}</text>${evidence ? `<text x="4" y="${number(element.frame.height - 6)}" font-size="10" fill="currentColor" opacity="0.72">${text(evidence)}</text>` : ""}</g>`;
    }
    case "table":
      return tableMarkup(element);
    case "component-instance":
    case "web-block":
      return fallbackMarkup(element, assets);
    case "evidence-footer":
      return `<g><text x="0" y="18" font-size="11" fill="currentColor">${text(element.content.source)}</text>${element.content.page ? `<text x="${number(element.frame.width)}" y="18" text-anchor="end" font-size="11" font-weight="700" fill="currentColor">${text(element.content.page)}</text>` : ""}</g>`;
  }
}

function renderTreeNode(
  node: SceneTreeNode,
  assets: Map<string, EmbeddedExportAsset>,
  registry: ExportCapabilityRegistry
): string {
  const label = node.element.accessibility.label ?? node.element.accessibility.description ?? node.element.name;
  const body = renderElementBody(node.element, assets, registry);
  const children = node.children.map((child) => renderTreeNode(child, assets, registry)).join("");
  return `<g id="element-${attribute(node.element.id)}" data-element-id="${attribute(node.element.id)}" data-element-kind="${attribute(node.element.kind)}" transform="${attribute(transformFor(node.element))}"${styleAttributes(node.element)}><title>${text(label)}</title>${body}${children}</g>`;
}

export async function exportSlideToSvg(
  slide: SceneSlide,
  context: SvgExportContext
): Promise<string> {
  const embedded = await embedExportAssets(context.assets, context);
  const assets = assetById(embedded.assets);
  const tree = buildSceneTree(slide.elements);
  if (tree.diagnostics.length > 0) {
    throw new Error(`Scene hierarchy không hợp lệ: ${tree.diagnostics.map((item) => item.message).join("; ")}`);
  }
  const definitions = backgroundDefinitions(slide.background.layers);
  const backgrounds = slide.background.layers.map((layer) => backgroundLayerMarkup(layer, assets)).join("");
  const elements = tree.roots.map((node) => renderTreeNode(node, assets, context.registry)).join("");
  const description = slide.conclusion ?? slide.purpose ?? `${context.deckTitle} — ${slide.name}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" role="img" aria-labelledby="slide-title-${attribute(slide.id)} slide-desc-${attribute(slide.id)}" data-export-slide-id="${attribute(slide.id)}" data-render-mode="export"><title id="slide-title-${attribute(slide.id)}">${text(slide.name)}</title><desc id="slide-desc-${attribute(slide.id)}">${text(description)}</desc>${definitions ? `<defs>${definitions}</defs>` : ""}<g data-slide-background="true">${backgrounds}</g><g data-slide-elements="true">${elements}</g></svg>`;
}
