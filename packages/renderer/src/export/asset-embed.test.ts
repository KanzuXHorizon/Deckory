import { describe, expect, it } from "vitest";
import type { DeckAssetV2 } from "@deckory/schema/v2";
import { embedExportAssets } from "./asset-embed";

const assets: DeckAssetV2[] = [
  { id: "logo", type: "svg", src: "/assets/logo.svg", mediaType: "image/svg+xml" },
  { id: "inline", type: "image", src: "data:image/png;base64,AA==", mediaType: "image/png" }
];

describe("embedExportAssets", () => {
  it("embeds local assets and preserves existing data URIs", async () => {
    const result = await embedExportAssets(assets, {
      readLocalAsset: async (asset) => asset.id === "logo" ? "<svg><rect width='10' height='10'/></svg>" : new Uint8Array()
    });

    expect(result.byId.logo?.src).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(result.byId.inline?.src).toBe("data:image/png;base64,AA==");
    expect(result.warnings).toEqual([]);
  });

  it("rejects remote asset references instead of copying them into artifacts", async () => {
    await expect(embedExportAssets([
      { id: "remote", type: "image", src: "https://example.com/remote.png", mediaType: "image/png" }
    ], { readLocalAsset: async () => new Uint8Array() })).rejects.toThrow(/remote.*remote|không.*remote/i);
  });

  it("requires an explicit reader for repository-local paths", async () => {
    await expect(embedExportAssets(assets)).rejects.toThrow(/readLocalAsset|reader/i);
  });
});
