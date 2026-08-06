import { describe, expect, it } from "vitest";
import type { DeckDocumentV2, SceneElement } from "@deckory/schema/v2";
import {
  resolveDeckExportReport,
  resolveElementExportCapability,
  type ExportCapabilityRegistry
} from "./export-capabilities";

const shape: Extract<SceneElement, { kind: "shape" }> = {
  id: "panel",
  name: "Panel",
  kind: "shape",
  frame: { x: 80, y: 80, width: 480, height: 240 },
  zIndex: 1,
  content: { shape: "rectangle" },
  style: { fill: "#ffffff" },
  accessibility: { decorative: true }
};

const webBlock: Extract<SceneElement, { kind: "web-block" }> = {
  id: "custom-radar",
  name: "Custom radar",
  kind: "web-block",
  frame: { x: 600, y: 80, width: 520, height: 420 },
  zIndex: 2,
  content: {
    manifest: {
      id: "custom-radar",
      version: "1.0.0",
      entry: "index.tsx",
      framework: "react",
      accessibleSummary: "Radar tùy chỉnh",
      staticFallback: { type: "png", assetId: "custom-radar-fallback" },
      allowedImports: ["react"],
      payloadBytes: 128,
      localAssetBytes: 0
    }
  },
  accessibility: { label: "Radar tùy chỉnh" }
};

const component: Extract<SceneElement, { kind: "component-instance" }> = {
  id: "score-ring",
  name: "Score ring",
  kind: "component-instance",
  frame: { x: 80, y: 360, width: 240, height: 240 },
  zIndex: 3,
  content: { componentId: "score-ring", version: "1.0.0", props: { value: 88 } },
  accessibility: { label: "Điểm 88 trên 100" }
};

const registry: ExportCapabilityRegistry = {
  resolveComponent({ componentId, version }) {
    return componentId === "score-ring" && version === "1.0.0"
      ? { componentId, version, exportCapabilities: ["html", "svg", "png", "pdf"] }
      : undefined;
  }
};

function deck(elements: SceneElement[]): DeckDocumentV2 {
  return {
    schemaVersion: 2,
    id: "export-capability-fixture",
    revision: 1,
    title: "Export capability fixture",
    locale: "vi-VN",
    canvas: { width: 1280, height: 720, unit: "px" },
    theme: { id: "deckory-editorial", tokens: {} },
    assets: [{ id: "custom-radar-fallback", type: "image", src: "/fixture.png", mediaType: "image/png" }],
    slides: [{
      id: "proof",
      name: "Proof",
      background: { layers: [] },
      elements
    }]
  };
}

describe("export capability resolution", () => {
  it("reports native HTML, SVG, PNG and PDF plus editable PPTX for a supported shape", () => {
    expect(resolveElementExportCapability(shape, registry)).toMatchObject({
      elementId: "panel",
      html: "native",
      svg: "native",
      png: "native",
      pdf: "native",
      pptx: "native-editable"
    });
  });

  it("reports the declared snapshot fallback for a Web Block", () => {
    expect(resolveElementExportCapability(webBlock, registry)).toMatchObject({
      svg: "fallback",
      fallback: { type: "png", assetId: "custom-radar-fallback" }
    });
  });

  it("never labels a fallback as editable or lets document policy elevate a Web Block", () => {
    const result = resolveElementExportCapability({
      ...webBlock,
      exportPolicy: { svg: "native", pptx: "native-editable" }
    }, registry);
    expect(result.svg).toBe("fallback");
    expect(result.pptx).toBe("fallback");
    expect(result.pptx).not.toBe("native-editable");
    expect(result.warnings.join(" ")).toMatch(/không thể nâng|không được nâng/i);
  });

  it("uses registered component capabilities and reports missing definitions", () => {
    expect(resolveElementExportCapability(component, registry)).toMatchObject({
      html: "native",
      svg: "native",
      png: "native",
      pdf: "native",
      pptx: "unsupported",
      responsible: { type: "component", id: "score-ring", version: "1.0.0" }
    });

    const editable = resolveElementExportCapability(component, {
      resolveComponent: ({ componentId, version }) => ({
        componentId,
        version,
        exportCapabilities: ["pptx"],
        editableExportCapabilities: ["pptx"]
      })
    });
    expect(editable.pptx).toBe("native-editable");

    const missing = resolveElementExportCapability({
      ...component,
      exportPolicy: { html: "native", pptx: "native-editable" }
    }, { resolveComponent: () => undefined });
    expect(missing.html).toBe("unsupported");
    expect(missing.pptx).toBe("unsupported");
    expect(missing.warnings.join(" ")).toMatch(/không tìm thấy component|không thể nâng/i);
  });

  it("summarizes native, editable, fallback and unsupported counts for every target", () => {
    const report = resolveDeckExportReport(deck([shape, webBlock, component]), registry);

    expect(report.targets.svg).toEqual({ native: 2, nativeEditable: 0, fallback: 1, unsupported: 0 });
    expect(report.targets.pptx).toEqual({ native: 0, nativeEditable: 1, fallback: 1, unsupported: 1 });
    expect(report.elements).toHaveLength(3);
    expect(report.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/score-ring.*pptx/i)]));
  });

  it("honors an explicit unsupported policy without silently using native support", () => {
    const denied: SceneElement = {
      ...shape,
      exportPolicy: { svg: "unsupported" }
    };
    expect(resolveElementExportCapability(denied, registry).svg).toBe("unsupported");
  });
});
