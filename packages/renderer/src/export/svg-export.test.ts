import { describe, expect, it } from "vitest";
import type { DeckAssetV2, SceneSlide } from "@deckory/schema/v2";
import type { ChartSpec, DiagramSpec } from "@deckory/visuals";
import { exportSlideToSvg } from "./svg-export";

const registry = { resolveComponent: () => undefined };

function nativeSlide(): SceneSlide {
  return {
    id: "proof",
    name: "Native SVG proof",
    background: { layers: [{ id: "paper", type: "solid", color: "#f7f7f4", opacity: 1 }] },
    elements: [
      {
        id: "panel",
        name: "Panel",
        kind: "shape",
        frame: { x: 80, y: 260, width: 520, height: 260 },
        zIndex: 1,
        content: { shape: "rectangle" },
        style: { fill: "#ffffff", stroke: "#d8dad6", strokeWidth: 1, borderRadius: 20 },
        accessibility: { decorative: true }
      },
      {
        id: "title",
        name: "Title",
        kind: "text",
        frame: { x: 80, y: 84, width: 1000, height: 120 },
        zIndex: 2,
        content: { text: "Deckory V2 xuất SVG deterministic." },
        style: { color: "#17191c", fontSize: 52, fontWeight: 760 },
        accessibility: { label: "Deckory V2 xuất SVG deterministic.", readingOrder: 1 }
      },
      {
        id: "footer",
        name: "Evidence footer",
        kind: "evidence-footer",
        frame: { x: 80, y: 660, width: 1120, height: 28 },
        zIndex: 3,
        content: { source: "Fixture SVG local", page: "01" },
        accessibility: { label: "Nguồn: Fixture SVG local", readingOrder: 2 }
      }
    ]
  };
}

const fallbackAssets: DeckAssetV2[] = [
  {
    id: "custom-radar-fallback",
    type: "image",
    src: "data:image/png;base64,AA==",
    mediaType: "image/png",
    width: 400,
    height: 300
  }
];

const chart: ChartSpec = {
  question: "Tiêu chí nào dẫn đầu?",
  title: "Điểm chất lượng",
  accessibleSummary: "Visual hierarchy dẫn đầu với 95 điểm.",
  variant: "horizontal-bar",
  data: [
    { id: "layout", category: "Layout", value: 88 },
    { id: "visual", category: "Visual hierarchy", value: 95 }
  ],
  encoding: { categoryField: "category", valueField: "value", zeroBaseline: true },
  unit: "điểm / 100",
  numberFormat: { style: "decimal", maximumFractionDigits: 0 },
  labels: { mode: "direct", showValues: true, collisionPolicy: "diagnose" },
  highlights: [{ datumId: "visual", level: "primary" }],
  annotations: [],
  referenceLines: [],
  evidence: { status: "illustrative", sourceIds: [], label: "Dữ liệu minh hoạ" },
  missingValuePolicy: "gap",
  animation: { mode: "zero-to-value", durationMs: 600 }
};

const diagram: DiagramSpec = {
  question: "Dữ liệu đi qua hệ thống như thế nào?",
  title: "Luồng dữ liệu",
  accessibleSummary: "Ứng dụng gửi yêu cầu đến API rồi lưu vào cơ sở dữ liệu.",
  intent: "architecture",
  layout: "tree",
  direction: "left-to-right",
  nodes: [
    { id: "app", label: "Ứng dụng", kind: "service", ports: [{ id: "out", direction: "out", side: "right" }] },
    { id: "api", label: "API", kind: "service", ports: [{ id: "in", direction: "in", side: "left" }, { id: "out", direction: "out", side: "right" }] },
    { id: "db", label: "Cơ sở dữ liệu", kind: "database", ports: [{ id: "in", direction: "in", side: "left" }] }
  ],
  edges: [
    { id: "app-api", source: { nodeId: "app", portId: "out" }, target: { nodeId: "api", portId: "in" }, kind: "request" },
    { id: "api-db", source: { nodeId: "api", portId: "out" }, target: { nodeId: "db", portId: "in" }, kind: "data-flow" }
  ],
  generatedLayout: null,
  manualOverrides: [],
  accessibleTraversalOrder: ["app", "api", "db"],
  edgeRouting: "orthogonal",
  evidence: { status: "illustrative", sourceIds: [], label: "Sơ đồ minh hoạ" }
};

function visualSlide(): SceneSlide {
  return {
    id: "visuals",
    name: "Typed visuals",
    background: { layers: [] },
    elements: [
      {
        id: "quality-chart",
        name: "Quality chart",
        kind: "chart",
        frame: { x: 60, y: 90, width: 520, height: 480 },
        zIndex: 1,
        content: { chart },
        accessibility: { label: chart.accessibleSummary }
      },
      {
        id: "architecture-diagram",
        name: "Architecture diagram",
        kind: "diagram",
        frame: { x: 640, y: 90, width: 580, height: 480 },
        zIndex: 2,
        content: { diagram },
        accessibility: { label: diagram.accessibleSummary }
      }
    ]
  };
}

function webBlockSlide(): SceneSlide {
  return {
    id: "web-block",
    name: "Web Block fallback",
    background: { layers: [] },
    elements: [{
      id: "custom-radar",
      name: "Custom radar",
      kind: "web-block",
      frame: { x: 120, y: 120, width: 640, height: 420 },
      zIndex: 1,
      content: {
        manifest: {
          id: "custom-radar",
          version: "1.0.0",
          entry: "index.tsx",
          framework: "react",
          accessibleSummary: "Radar tùy chỉnh dùng fallback",
          staticFallback: { type: "png", assetId: "custom-radar-fallback" },
          allowedImports: ["react"],
          payloadBytes: 128,
          localAssetBytes: 0
        }
      },
      accessibility: { label: "Radar tùy chỉnh dùng fallback" }
    }]
  };
}

describe("exportSlideToSvg", () => {
  it("serializes native text and shapes with the fixed 1280 by 720 viewBox", async () => {
    const svg = await exportSlideToSvg(nativeSlide(), {
      assets: [],
      registry,
      deckTitle: "Deckory V2"
    });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"');
    expect(svg).toContain("Deckory V2 xuất SVG deterministic.");
    expect(svg).toContain("<rect");
    expect(svg).toContain("Fixture SVG local");
    expect(svg).toContain('<title id="slide-title-proof">Native SVG proof</title>');
    expect(svg).toContain('<desc id="slide-desc-proof">');
    expect(svg).not.toMatch(/(?:href|src)="https?:/i);
  });

  it("uses the declared Web Block fallback and exposes its source asset ID", async () => {
    const svg = await exportSlideToSvg(webBlockSlide(), {
      assets: fallbackAssets,
      registry,
      deckTitle: "Fallback proof"
    });

    expect(svg).toContain('data-fallback-asset-id="custom-radar-fallback"');
    expect(svg).toContain("data:image/png;base64,AA==");
    expect(svg).toContain("Radar tùy chỉnh dùng fallback");
  });

  it("preserves typed chart and diagram readiness markers", async () => {
    const svg = await exportSlideToSvg(visualSlide(), {
      assets: [],
      registry,
      deckTitle: "Typed visuals"
    });

    expect(svg).toContain('data-chart-status="ready"');
    expect(svg).toContain('data-chart-variant="horizontal-bar"');
    expect(svg).toContain('data-diagram-status="ready"');
    expect(svg).toContain('data-diagram-strategy="tree"');
    expect(svg).toContain("Visual hierarchy");
    expect(svg).toContain("Cơ sở dữ liệu");
  });

  it("returns byte-for-byte deterministic output for the same input", async () => {
    const context = { assets: [] as DeckAssetV2[], registry, deckTitle: "Deckory V2" };
    const first = await exportSlideToSvg(nativeSlide(), context);
    const second = await exportSlideToSvg(nativeSlide(), context);
    expect(second).toBe(first);
  });

  it("rejects a fallback that is not present in the embedded asset set", async () => {
    await expect(exportSlideToSvg(webBlockSlide(), {
      assets: [],
      registry,
      deckTitle: "Missing fallback"
    })).rejects.toThrow(/custom-radar-fallback|fallback asset/i);
  });
});
