import { describe, expect, it } from "vitest";
import {
  MAX_WEB_BLOCK_ASSET_BYTES,
  MAX_WEB_BLOCK_SOURCE_BYTES,
  WebBlockManifestSchema,
  defineWebBlockManifest,
  validateWebBlockManifest,
  validateWebBlockSource
} from "./web-block";

const validManifest = {
  id: "custom-radar",
  version: "1.0.0",
  entry: "index.tsx",
  framework: "react" as const,
  accessibleSummary: "Biểu đồ radar tùy chỉnh",
  staticFallback: { type: "svg" as const, assetId: "custom-radar-fallback" },
  allowedImports: ["react", "react/jsx-runtime", "react-dom/client"],
  payloadBytes: 120,
  localAssetBytes: 0
};

describe("Web Block source and manifest contracts", () => {
  it("requires an accessible summary and static SVG or PNG fallback", () => {
    expect(() => WebBlockManifestSchema.parse({
      id: "custom-radar",
      version: "1.0.0",
      entry: "index.tsx",
      framework: "react",
      allowedImports: [],
      payloadBytes: 10,
      localAssetBytes: 0
    })).toThrow();
  });

  it("enforces the source and local-asset payload budgets", () => {
    expect(MAX_WEB_BLOCK_SOURCE_BYTES).toBe(1024 * 1024);
    expect(MAX_WEB_BLOCK_ASSET_BYTES).toBe(4 * 1024 * 1024);
    expect(() => defineWebBlockManifest({
      ...validManifest,
      payloadBytes: MAX_WEB_BLOCK_SOURCE_BYTES + 1
    })).toThrow(/payloadBytes/i);
    expect(() => defineWebBlockManifest({
      ...validManifest,
      localAssetBytes: MAX_WEB_BLOCK_ASSET_BYTES + 1
    })).toThrow(/localAssetBytes/i);
  });

  it("allows only reviewed runtime imports in a manifest", () => {
    expect(validateWebBlockManifest(validManifest).allowedImports).toEqual(validManifest.allowedImports);
    expect(() => defineWebBlockManifest({
      ...validManifest,
      allowedImports: ["react", "lodash"]
    })).toThrow(/lodash.*không nằm trong allowlist/i);
  });

  it("accepts a bounded local React source tree", () => {
    const source = {
      entry: "index.tsx",
      files: {
        "index.tsx": "import React from 'react'; import { createRoot } from 'react-dom/client'; export const id = 'custom-radar';",
        "styles.css": ".root { display: grid; }"
      }
    };
    expect(validateWebBlockSource(source, { ...validManifest, payloadBytes: 140 })).toMatchObject({ ok: true, diagnostics: [] });
  });

  it("rejects a manifest that understates its actual source payload", () => {
    const result = validateWebBlockSource({
      entry: "index.tsx",
      files: { "index.tsx": "export const value = 'payload';" }
    }, { ...validManifest, payloadBytes: 1 });
    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "manifest-payload-understated" })]
    });
  });

  it("rejects remote imports and imports outside the declared allowlist", () => {
    const remote = validateWebBlockSource({
      entry: "index.tsx",
      files: { "index.tsx": "import x from 'https://example.com/x.js';" }
    }, validManifest);
    expect(remote).toMatchObject({ ok: false, diagnostics: [expect.objectContaining({ code: "remote-import-denied" })] });

    const packageImport = validateWebBlockSource({
      entry: "index.tsx",
      files: { "index.tsx": "import lodash from 'lodash';" }
    }, validManifest);
    expect(packageImport).toMatchObject({ ok: false, diagnostics: [expect.objectContaining({ code: "import-not-allowed" })] });
  });

  it("rejects path traversal, missing entries and executable constructors", () => {
    expect(validateWebBlockSource({
      entry: "../index.tsx",
      files: { "../index.tsx": "export {};" }
    }, validManifest).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "unsafe-path" })]));

    expect(validateWebBlockSource({
      entry: "src/index.tsx",
      files: {
        "src/index.tsx": "import '../../outside';",
        "outside.ts": "export {};"
      }
    }, { ...validManifest, entry: "src/index.tsx", payloadBytes: 100 }).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "local-import-escapes-root" })])
    );

    expect(validateWebBlockSource({
      entry: "missing.tsx",
      files: { "index.tsx": "export {};" }
    }, validManifest).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "entry-not-found" })]));

    expect(validateWebBlockSource({
      entry: "index.tsx",
      files: { "index.tsx": "const run = new Function('return 1'); run();" }
    }, validManifest).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "executable-constructor-denied" })]));
  });

  it("denies CommonJS and dynamic import execution paths", () => {
    expect(validateWebBlockSource({
      entry: "index.tsx",
      files: { "index.tsx": "const fs = require('fs');" }
    }, validManifest).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "commonjs-require-denied" })]));

    expect(validateWebBlockSource({
      entry: "index.tsx",
      files: { "index.tsx": "const moduleName = './feature'; import(moduleName);" }
    }, validManifest).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "dynamic-import-denied" })]));
  });
});
