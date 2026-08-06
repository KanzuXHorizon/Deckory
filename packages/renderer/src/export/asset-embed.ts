import type { DeckAssetV2 } from "@deckory/schema/v2";

export type EmbeddedExportAsset = DeckAssetV2 & {
  src: string;
};

export type EmbeddedExportAssetSet = {
  assets: EmbeddedExportAsset[];
  byId: Readonly<Record<string, EmbeddedExportAsset>>;
  warnings: string[];
};

export type ExportAssetEmbedContext = {
  readLocalAsset?: (asset: DeckAssetV2) => Promise<Uint8Array | string>;
};

function isRemoteSource(source: string): boolean {
  return /^(?:https?:)?\/\//i.test(source.trim());
}

function isDataSource(source: string): boolean {
  return /^data:/i.test(source.trim());
}

function isLocalSource(source: string): boolean {
  const value = source.trim();
  return value.startsWith("/") || value.startsWith("./") || value.startsWith("../") || /^file:/i.test(value);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize));
    binary += String.fromCharCode(...chunk);
  }
  if (typeof btoa !== "function") {
    throw new Error("Runtime không hỗ trợ base64 encoder cần thiết cho standalone export.");
  }
  return btoa(binary);
}

function toBytes(value: Uint8Array | string): Uint8Array {
  return typeof value === "string" ? new TextEncoder().encode(value) : value;
}

function encodeDataUri(mediaType: string, value: Uint8Array | string): string {
  return `data:${mediaType};base64,${bytesToBase64(toBytes(value))}`;
}

export async function embedExportAssets(
  assets: readonly DeckAssetV2[],
  context: ExportAssetEmbedContext = {}
): Promise<EmbeddedExportAssetSet> {
  const embedded: EmbeddedExportAsset[] = [];
  const byId: Record<string, EmbeddedExportAsset> = {};
  const warnings: string[] = [];

  for (const asset of assets) {
    const source = asset.src.trim();
    if (isRemoteSource(source)) {
      throw new Error(`Remote asset không được phép trong standalone export: ${asset.id} (${source}).`);
    }
    let src: string;
    if (isDataSource(source)) {
      src = source;
    } else if (isLocalSource(source)) {
      if (!context.readLocalAsset) {
        throw new Error(`Standalone export cần readLocalAsset reader để nhúng asset ${asset.id}.`);
      }
      const contents = await context.readLocalAsset(asset);
      src = encodeDataUri(asset.mediaType, contents);
    } else {
      throw new Error(`Asset source không thuộc local/data contract: ${asset.id} (${source}).`);
    }
    const next: EmbeddedExportAsset = { ...asset, src };
    embedded.push(next);
    byId[next.id] = next;
  }

  return {
    assets: embedded,
    byId: Object.freeze({ ...byId }),
    warnings
  };
}
