import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createPptxPackage } from "./pptx-image-deck.mjs";

const EMU_PER_PIXEL = 9525;
const POINTS_PER_PIXEL = 0.75;

export function writePptxV2({ plan, outputPath, resolveAsset, createdAt = new Date().toISOString() }) {
  const unsupported = plan.slides.flatMap((slide) => slide.elements.filter((element) => element.capability === "unsupported"));
  if (unsupported.length > 0) {
    throw new Error(`PPTX V2 còn ${unsupported.length} thành phần unsupported: ${unsupported.map((element) => element.sourceId).join(", ")}.`);
  }

  const assetIds = [...new Set(plan.slides.flatMap((slide) => slide.elements.flatMap((element) =>
    element.operation === "addImage" || element.operation === "addFallbackImage" ? [element.assetId] : []
  )))];
  const media = new Map();
  const mediaByAssetId = new Map();
  assetIds.forEach((assetId, index) => {
    const resolved = resolveAsset(assetId);
    if (!resolved?.data) throw new Error(`Không thể resolve PPTX asset ${assetId}.`);
    const extension = normalizeExtension(resolved.extension ?? extensionForMediaType(resolved.mediaType));
    if (!extension) throw new Error(`PPTX asset ${assetId} có media type không được hỗ trợ: ${resolved.mediaType ?? "unknown"}.`);
    const mediaName = `media${index + 1}.${extension}`;
    media.set(mediaName, Buffer.isBuffer(resolved.data) ? resolved.data : Buffer.from(resolved.data));
    mediaByAssetId.set(assetId, mediaName);
  });

  const slides = plan.slides.map((slide) => {
    const relationships = new Map();
    let nextRelationshipId = 2;
    for (const element of slide.elements) {
      if (element.operation !== "addImage" && element.operation !== "addFallbackImage") continue;
      if (relationships.has(element.assetId)) continue;
      const mediaName = mediaByAssetId.get(element.assetId);
      if (!mediaName) throw new Error(`Thiếu media mapping cho ${element.assetId}.`);
      relationships.set(element.assetId, { id: `rId${nextRelationshipId}`, mediaName });
      nextRelationshipId += 1;
    }
    return {
      xml: slideXml(slide, relationships),
      relationshipsXml: slideRelationshipsXml(relationships)
    };
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, createPptxPackage({ title: plan.title, slides, media, createdAt }));
}

function slideXml(slide, relationships) {
  const byId = new Map(slide.elements.map((element) => [element.sourceId, element]));
  const childIds = new Set(slide.elements.flatMap((element) => element.operation === "addGroup" ? element.childIds : []));
  let nextShapeId = 2;
  const render = (element) => {
    const shapeId = nextShapeId;
    nextShapeId += 1;
    if (element.operation === "addGroup") {
      const children = element.childIds.map((id) => byId.get(id)).filter(Boolean);
      return groupXml(element, shapeId, children.map(render).join(""));
    }
    if (element.operation === "addText") return textXml(element, shapeId);
    if (element.operation === "addShape") return shapeXml(element, shapeId);
    if (element.operation === "addLine") return lineXml(element, shapeId);
    if (element.operation === "addImage" || element.operation === "addFallbackImage") {
      const relationship = relationships.get(element.assetId);
      if (!relationship) throw new Error(`Thiếu slide relationship cho ${element.assetId}.`);
      return imageXml(element, shapeId, relationship.id);
    }
    return "";
  };
  const elements = slide.elements.filter((element) => !childIds.has(element.sourceId)).map(render).join("");
  return xml(`<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld name="${escapeXml(slide.name)}"><p:spTree>${rootGroupXml()}${elements}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`);
}

function rootGroupXml() {
  return `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`;
}

function textXml(element, id) {
  const g = element.geometry;
  const style = element.style;
  const color = colorXml(style.color ?? "#17191c");
  const size = Math.max(100, Math.round((style.fontSize ?? 18) * POINTS_PER_PIXEL * 100));
  const bold = (style.fontWeight ?? 400) >= 600 ? ' b="1"' : "";
  const align = { left: "l", center: "ctr", right: "r", justify: "just" }[style.textAlign ?? "left"];
  const typeface = escapeXml(style.fontFamily ?? "Aptos");
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${escapeXml(element.sourceName)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmXml(g)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" anchor="t"/><a:lstStyle/><a:p><a:pPr algn="${align}"/><a:r><a:rPr lang="vi-VN" sz="${size}"${bold}><a:solidFill>${color}</a:solidFill><a:latin typeface="${typeface}"/></a:rPr><a:t>${escapeXml(element.text)}</a:t></a:r><a:endParaRPr lang="vi-VN" sz="${size}"/></a:p></p:txBody></p:sp>`;
}

function shapeXml(element, id) {
  const preset = { rectangle: "rect", ellipse: "ellipse", triangle: "triangle", diamond: "diamond" }[element.shape];
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${escapeXml(element.sourceName)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrmXml(element.geometry)}<a:prstGeom prst="${preset}"><a:avLst/></a:prstGeom>${fillXml(element.style.fill, element.style.opacity)}${lineStyleXml(element.style)}</p:spPr></p:sp>`;
}

function lineXml(element, id) {
  const x = Math.min(element.x, element.x2);
  const y = Math.min(element.y, element.y2);
  const width = Math.max(1, Math.abs(element.x2 - element.x));
  const height = Math.max(1, Math.abs(element.y2 - element.y));
  const flipH = element.x2 < element.x ? ' flipH="1"' : "";
  const flipV = element.y2 < element.y ? ' flipV="1"' : "";
  const geometry = { x, y, width, height };
  const markerStart = element.markerStart ? `<a:headEnd type="${markerType(element.markerStart)}"/>` : "";
  const markerEnd = element.markerEnd ? `<a:tailEnd type="${markerType(element.markerEnd)}"/>` : "";
  return `<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${id}" name="${escapeXml(element.sourceName)}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr><a:xfrm${flipH}${flipV}>${offExtXml(geometry)}</a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom>${lineStyleXml(element.style, markerStart + markerEnd)}</p:spPr></p:cxnSp>`;
}

function imageXml(element, id, relationshipId) {
  const alt = escapeXml(element.alt ?? element.sourceName);
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${escapeXml(element.sourceName)}" descr="${alt}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrmXml(element.geometry)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

function groupXml(element, id, children) {
  const g = element.geometry;
  const xfrm = `<a:xfrm>${offExtXml(g)}<a:chOff x="${px(g.x)}" y="${px(g.y)}"/><a:chExt cx="${px(g.width)}" cy="${px(g.height)}"/></a:xfrm>`;
  return `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${id}" name="${escapeXml(element.sourceName)}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr>${xfrm}</p:grpSpPr>${children}</p:grpSp>`;
}

function slideRelationshipsXml(relationships) {
  const media = [...relationships.values()].map((relationship) => `<Relationship Id="${relationship.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${escapeXml(relationship.mediaName)}"/>`).join("");
  return xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>${media}</Relationships>`);
}

function xfrmXml(geometry) {
  const rotation = geometry.rotation === undefined ? "" : ` rot="${Math.round(geometry.rotation * 60000)}"`;
  return `<a:xfrm${rotation}>${offExtXml(geometry)}</a:xfrm>`;
}

function offExtXml(geometry) {
  return `<a:off x="${px(geometry.x)}" y="${px(geometry.y)}"/><a:ext cx="${px(geometry.width)}" cy="${px(geometry.height)}"/>`;
}

function fillXml(color, opacity = 1) {
  if (!color || color === "transparent") return "<a:noFill/>";
  return `<a:solidFill>${colorXml(color, opacity)}</a:solidFill>`;
}

function lineStyleXml(style, children = "") {
  if (!style.stroke || style.stroke === "transparent" || style.strokeWidth === 0) return "<a:ln><a:noFill/></a:ln>";
  const width = Math.max(1, Math.round((style.strokeWidth ?? 1) * EMU_PER_PIXEL));
  return `<a:ln w="${width}"><a:solidFill>${colorXml(style.stroke, style.opacity)}</a:solidFill>${children}</a:ln>`;
}

function colorXml(value, opacity = 1) {
  const hex = normalizeHex(value);
  const alpha = Math.max(0, Math.min(100000, Math.round((opacity ?? 1) * 100000)));
  return `<a:srgbClr val="${hex}">${alpha < 100000 ? `<a:alpha val="${alpha}"/>` : ""}</a:srgbClr>`;
}

function normalizeHex(value) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value).trim());
  if (!match) return "17191C";
  const raw = match[1];
  return (raw.length === 3 ? raw.split("").map((character) => character + character).join("") : raw).toUpperCase();
}

function markerType(value) {
  return /arrow|triangle/i.test(value) ? "triangle" : /diamond/i.test(value) ? "diamond" : "none";
}

function px(value) {
  return Math.round(value * EMU_PER_PIXEL);
}

function extensionForMediaType(mediaType = "") {
  if (/png/i.test(mediaType)) return "png";
  if (/jpe?g/i.test(mediaType)) return "jpg";
  if (/svg/i.test(mediaType)) return "svg";
  return undefined;
}

function normalizeExtension(value) {
  const extension = String(value ?? "").replace(/^\./, "").toLowerCase();
  return ["png", "jpg", "jpeg", "svg"].includes(extension) ? extension : undefined;
}

const xml = (body) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${body}`;
const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

async function runCli() {
  await import("./register-typescript-loader.mjs");
  const args = process.argv.slice(2).filter((argument) => argument !== "--");
  const option = (name, fallback) => {
    const inline = args.find((argument) => argument.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : fallback;
  };
  const deckId = option("deck", "pptx-v2-proof");
  const outputPath = resolve(option("output", `output/exports/${deckId}.pptx`));
  const [{ resolveAnyDeck }, { isDeckDocumentV2 }, { exportDeckToPptxPlan }] = await Promise.all([
    import("../apps/present/lib/deck-catalog.ts"),
    import("../apps/present/lib/deck-version.ts"),
    import("../packages/renderer/src/export/pptx-adapter.ts")
  ]);
  const deck = resolveAnyDeck(deckId);
  if (!isDeckDocumentV2(deck)) throw new Error(`Deck ${deckId} không phải DeckDocument V2.`);
  const plan = exportDeckToPptxPlan(deck, { resolveComponent: () => undefined });
  writePptxV2({
    plan,
    outputPath,
    resolveAsset(assetId) {
      const asset = deck.assets.find((candidate) => candidate.id === assetId);
      if (!asset) return undefined;
      if (/^data:/i.test(asset.src)) {
        const match = /^data:([^;,]+);base64,(.*)$/i.exec(asset.src);
        if (!match) return undefined;
        return { data: Buffer.from(match[2], "base64"), mediaType: match[1], extension: extensionForMediaType(match[1]) };
      }
      if (/^(?:https?:|\/\/)/i.test(asset.src)) throw new Error(`Remote PPTX asset bị từ chối: ${asset.src}`);
      const path = resolve(process.cwd(), asset.src.replace(/^\//, ""));
      return { data: readFileSync(path), mediaType: asset.mediaType, extension: extname(path) };
    }
  });
  console.log(`[deckory:pptx-v2] ${plan.slides.length} slide · ${outputPath}`);
  if (plan.warnings.length > 0) plan.warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCli();
}
