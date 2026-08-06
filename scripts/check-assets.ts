import { existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import type { DeckAsset, DeckAssetV2, DeckDocument, DeckDocumentV2 } from "@deckory/schema";
import { deckCatalog, v2DeckCatalog } from "../apps/present/lib/deck-catalog.ts";
import { isDeckDocumentV2 } from "../apps/present/lib/deck-version.ts";

const publicRoot = resolve(process.cwd(), "apps", "present", "public");
const asJson = process.argv.includes("--json");
const reports = [
  ...deckCatalog.map((item) => inspectDeckAssets(item.deck)),
  ...v2DeckCatalog.map((item) => inspectDeckAssets(item.deck))
];
const errorCount = reports.reduce((total, report) => total + report.errors.length, 0);
const warningCount = reports.reduce((total, report) => total + report.warnings.length, 0);
const assetCount = reports.reduce((total, report) => total + report.assetCount, 0);

if (asJson) {
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: { deckCount: reports.length, assetCount, errorCount, warningCount },
    reports
  }, null, 2));
} else {
  console.log(`Deckory asset check\n${reports.length} deck · ${assetCount} asset · ${errorCount} error · ${warningCount} warning`);
  for (const report of reports) {
    const state = report.errors.length === 0 && report.warnings.length === 0 ? "PASS" : "REVIEW";
    console.log(`\n${state} ${report.title} (${report.assetCount} asset)`);
    for (const message of report.errors) console.log(`- ERROR ${message}`);
    for (const message of report.warnings) console.log(`- WARNING ${message}`);
  }
}

process.exitCode = errorCount > 0 || warningCount > 0 ? 1 : 0;

function inspectDeckAssets(deck: DeckDocument | DeckDocumentV2) {
  const assets = deck.assets ?? [];
  const references = isDeckDocumentV2(deck) ? collectV2AssetReferences(deck) : collectAssetReferences(deck);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const asset of assets) {
    if (!references.has(asset.id)) {
      warnings.push(`${asset.id}: asset chưa được component nào tham chiếu.`);
    }

    if (asset.src.startsWith("data:image/")) continue;
    const filepath = resolveLocalAssetPath(asset);
    if (!filepath) {
      errors.push(`${asset.id}: đường dẫn “${asset.src}” nằm ngoài public root.`);
      continue;
    }
    if (!existsSync(filepath) || !statSync(filepath).isFile()) {
      errors.push(`${asset.id}: không tìm thấy file ${asset.src}.`);
      continue;
    }

    const expectedMediaType = mediaTypeForExtension(extname(filepath).toLowerCase());
    if (!expectedMediaType) {
      errors.push(`${asset.id}: extension “${extname(filepath)}” chưa được asset pipeline hỗ trợ.`);
    } else if (expectedMediaType !== asset.mediaType) {
      errors.push(`${asset.id}: mediaType ${asset.mediaType} không khớp ${expectedMediaType} của file ${asset.src}.`);
    }
  }

  for (const reference of references) {
    if (!assets.some((asset) => asset.id === reference)) {
      errors.push(`${reference}: component tham chiếu asset không tồn tại trong manifest.`);
    }
  }

  return {
    deckId: deck.id,
    title: deck.title,
    assetCount: assets.length,
    referenceCount: references.size,
    errors,
    warnings
  };
}

function collectAssetReferences(deck: DeckDocument): Set<string> {
  const references = new Set<string>();
  for (const slide of deck.slides) {
    for (const component of slide.components) {
      if (component.type === "team-showcase") {
        for (const member of component.props.members) {
          if (member.image?.assetId) references.add(member.image.assetId);
        }
      }
      if (component.type === "media-showcase") {
        for (const item of component.props.items) references.add(item.assetId);
      }
      if (component.type === "evidence-footer" && component.props.logoAssetId) {
        references.add(component.props.logoAssetId);
      }
    }
  }
  return references;
}

function collectV2AssetReferences(deck: DeckDocumentV2): Set<string> {
  const references = new Set<string>();
  for (const slide of deck.slides) {
    for (const layer of slide.background.layers) {
      const assetId = typeof layer.assetId === "string" ? layer.assetId : undefined;
      if (assetId) references.add(assetId);
    }
    for (const element of slide.elements) {
      if (element.kind === "image") references.add(element.content.assetId);
      if (element.kind === "web-block") {
        const fallback = element.content.manifest.staticFallback;
        if (fallback && typeof fallback === "object") {
          const assetId = (fallback as Record<string, unknown>).assetId;
          if (typeof assetId === "string") references.add(assetId);
        }
      }
      if (element.exportPolicy?.fallbackAssetId) references.add(element.exportPolicy.fallbackAssetId);
      if (element.kind === "evidence-footer") {
        const logoAssetId = element.content.logoAssetId;
        if (typeof logoAssetId === "string") references.add(logoAssetId);
      }
    }
  }
  return references;
}

function resolveLocalAssetPath(asset: DeckAsset | DeckAssetV2): string | undefined {
  const candidate = resolve(publicRoot, `.${asset.src}`);
  const rootPrefix = publicRoot.endsWith(sep) ? publicRoot : `${publicRoot}${sep}`;
  return candidate.startsWith(rootPrefix) ? candidate : undefined;
}

function mediaTypeForExtension(extension: string): DeckAsset["mediaType"] | DeckAssetV2["mediaType"] | undefined {
  switch (extension) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    case ".svg": return "image/svg+xml";
    default: return undefined;
  }
}
