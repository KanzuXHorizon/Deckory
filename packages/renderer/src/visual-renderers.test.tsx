import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ChartSpec, DiagramSpec } from "@deckory/visuals";
import { ChartRenderer } from "./chart-renderer";
import { DiagramRenderer } from "./diagram-renderer";

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
    { id: "app-api", source: { nodeId: "app", portId: "out" }, target: { nodeId: "api", portId: "in" }, kind: "request", label: "HTTPS" },
    { id: "api-db", source: { nodeId: "api", portId: "out" }, target: { nodeId: "db", portId: "in" }, kind: "data-flow" }
  ],
  generatedLayout: null,
  manualOverrides: [],
  accessibleTraversalOrder: ["app", "api", "db"],
  edgeRouting: "orthogonal",
  evidence: { status: "illustrative", sourceIds: [], label: "Sơ đồ minh hoạ" }
};

describe("native visual renderers", () => {
  it("renders editorial geometry with direct labels, highlight and visible evidence", () => {
    const html = renderToStaticMarkup(<ChartRenderer spec={chart} width={560} height={420} mode="final" />);
    expect(html).toContain('data-chart-status="ready"');
    expect(html).toContain('data-chart-variant="horizontal-bar"');
    expect(html).toContain('data-chart-datum-id="visual"');
    expect(html).toContain('data-primary-highlight="true"');
    expect(html).toContain("Visual hierarchy");
    expect(html).toContain("95");
    expect(html).toContain("Dữ liệu minh hoạ");
    expect(html).toContain('aria-label="Visual hierarchy dẫn đầu với 95 điểm."');
  });

  it("disables authored chart motion in thumbnail and export modes", () => {
    for (const mode of ["thumbnail", "export"] as const) {
      const html = renderToStaticMarkup(<ChartRenderer spec={chart} width={560} height={420} mode={mode} />);
      expect(html).toContain('data-chart-motion="final"');
    }
  });

  it("defers advanced charts behind the reviewed lazy ECharts boundary", () => {
    const advanced: ChartSpec = {
      ...chart,
      variant: "scatter",
      data: [{ id: "point", x: 10, y: 20 }],
      encoding: { xField: "x", yField: "y" },
      highlights: [],
      animation: { mode: "none", durationMs: 0 }
    };
    const html = renderToStaticMarkup(<ChartRenderer spec={advanced} width={560} height={420} mode="final" />);
    expect(html).toContain('data-chart-status="adapter-loading"');
    expect(html).toContain('data-chart-adapter="echarts-svg"');
    expect(html).toContain('data-chart-variant="scatter"');
    expect(html).toContain("Đang tải bộ dựng biểu đồ nâng cao");
  });

  it("lays out and renders deterministic diagram nodes and routed edges", () => {
    const html = renderToStaticMarkup(<DiagramRenderer spec={diagram} width={720} height={380} />);
    expect(html).toContain('data-diagram-status="ready"');
    expect(html).toContain('data-diagram-node-id="app"');
    expect(html).toContain('data-diagram-node-id="api"');
    expect(html).toContain('data-diagram-edge-id="app-api"');
    expect(html).toContain("Cơ sở dữ liệu");
    expect(html).toContain("Sơ đồ minh hoạ");
    expect(html).toContain('aria-label="Ứng dụng gửi yêu cầu đến API rồi lưu vào cơ sở dữ liệu."');
  });

  it("reports ELK adapter requirements without clipping or guessing", () => {
    const elk: DiagramSpec = { ...diagram, layout: "elk-layered" };
    const html = renderToStaticMarkup(<DiagramRenderer spec={elk} width={720} height={380} />);
    expect(html).toContain('data-diagram-status="adapter-required"');
    expect(html).toContain("ELK adapter");
  });
});
