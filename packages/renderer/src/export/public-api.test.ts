import { describe, expect, it } from "vitest";
import {
  embedExportAssets,
  exportDeckToStandaloneHtml,
  exportSlideToSvg
} from "@deckory/renderer/export";

describe("@deckory/renderer/export public API", () => {
  it("exposes server-only static exporters through a dedicated subpath", () => {
    expect(embedExportAssets).toBeTypeOf("function");
    expect(exportDeckToStandaloneHtml).toBeTypeOf("function");
    expect(exportSlideToSvg).toBeTypeOf("function");
  });
});
