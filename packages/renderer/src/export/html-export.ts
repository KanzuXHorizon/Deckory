import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DeckDocumentV2 } from "@deckory/schema/v2";
import {
  resolveDeckExportReport,
  type ExportCapabilityRegistry
} from "../export-capabilities";
import type { SceneRendererExtensions } from "../renderer-extensions";
import { SceneRenderer } from "../scene-renderer";
import {
  embedExportAssets,
  type ExportAssetEmbedContext,
  type EmbeddedExportAssetSet
} from "./asset-embed";

export type StandaloneHtmlExportContext = ExportAssetEmbedContext & {
  registry: ExportCapabilityRegistry;
  extensions?: SceneRendererExtensions;
};

function htmlText(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function htmlAttribute(value: unknown): string {
  return htmlText(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029")
    .replace(/<\/script/gi, "<\\/script");
}

function fallbackAssetId(manifest: Record<string, unknown>): string | undefined {
  const value = manifest.staticFallback;
  if (!value || typeof value !== "object") return undefined;
  const assetId = (value as Record<string, unknown>).assetId;
  return typeof assetId === "string" && assetId.trim() ? assetId : undefined;
}

function exportExtensions(
  source: SceneRendererExtensions | undefined,
  embedded: EmbeddedExportAssetSet
): SceneRendererExtensions {
  return {
    ...(source?.components ? { components: source.components } : {}),
    webBlocks: {
      resolve(input) {
        const resolved = source?.webBlocks?.resolve(input);
        const assetId = fallbackAssetId(input.manifest);
        const fallbackSrc = resolved?.fallbackSrc ?? (assetId ? embedded.byId[assetId]?.src : undefined);
        return {
          ...(resolved?.bundle ? { bundle: resolved.bundle } : {}),
          ...(fallbackSrc ? { fallbackSrc } : {})
        };
      }
    },
    exportTarget: "html"
  };
}

const standaloneCss = `
:root{color-scheme:light;--deckory-canvas:#111318;--deckory-paper:#fff;--deckory-ink:#15171a;font-family:Inter,"Be Vietnam Pro",system-ui,sans-serif}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--deckory-canvas);color:var(--deckory-ink)}
body{padding:24px}
.deckory-standalone{display:grid;gap:24px;justify-content:center}
.deckory-standalone__slide{width:1280px;height:720px;overflow:hidden;background:var(--deckory-paper);box-shadow:0 24px 72px rgba(0,0,0,.28)}
.scene-element img,.scene-element svg,.scene-element figure,.scene-element table{max-width:100%;max-height:100%}
.scene-element table{width:100%;height:100%;border-collapse:collapse}
.scene-element th,.scene-element td{padding:6px 8px;border:1px solid #d8dad6;text-align:left}
.scene-evidence-footer{display:flex;align-items:center;justify-content:space-between;width:100%;height:100%;font-size:11px}
.scene-component-fallback,.scene-web-block-fallback,[data-component-status="export-unsupported"]{display:grid;place-content:center;width:100%;height:100%;padding:16px;border:1px dashed #c77700;background:#fff7e8;color:#704600;text-align:center}
@media print{body{padding:0;background:#fff}.deckory-standalone{gap:0}.deckory-standalone__slide{box-shadow:none;break-after:page;page-break-after:always}}
@media(max-width:1328px){body{padding:12px}.deckory-standalone__slide{transform-origin:top left}}
`;

export async function exportDeckToStandaloneHtml(
  deck: DeckDocumentV2,
  context: StandaloneHtmlExportContext
): Promise<string> {
  const embedded = await embedExportAssets(deck.assets, context);
  const report = resolveDeckExportReport(deck, context.registry);
  const extensions = exportExtensions(context.extensions, embedded);
  const slides = deck.slides.map((slide) => {
    const markup = renderToStaticMarkup(createElement(SceneRenderer, {
      slide,
      assets: embedded.assets,
      mode: "export",
      extensions
    }));
    return `<section class="deckory-standalone__slide" data-standalone-slide-id="${htmlAttribute(slide.id)}" aria-label="${htmlAttribute(slide.name)}">${markup}</section>`;
  }).join("");
  const reportJson = safeJson(report);

  return `<!doctype html>
<html lang="${htmlAttribute(deck.locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'none'; object-src 'none'; frame-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>${htmlText(deck.title)}</title>
<style>${standaloneCss}</style>
</head>
<body>
<main class="deckory-standalone" data-standalone-deck-id="${htmlAttribute(deck.id)}" data-document-revision="${deck.revision}">${slides}</main>
<script type="application/json" id="deckory-export-report" data-json="${htmlAttribute(reportJson)}">${reportJson}</script>
</body>
</html>`;
}
