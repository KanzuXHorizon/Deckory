/** @jsxImportSource @deckory/sdk */

import { describe, expect, it } from "vitest";
import type { ChartSpec, DiagramSpec } from "@deckory/visuals";
import { defineSceneSlide } from "./define-scene";
import { jsx } from "./jsx-runtime";
import {
  Chart,
  Component,
  Connector,
  Diagram,
  EvidenceFooter,
  Grid,
  Group,
  Icon,
  Image,
  Line,
  RichText,
  Shape,
  Slide,
  Stack,
  Svg,
  Table,
  Text,
  WebBlock
} from "./primitives";

const frame = { x: 0, y: 0, width: 100, height: 80 } as const;
const chart: ChartSpec = {
  question: "Tiêu chí nào dẫn đầu?",
  title: "Điểm chất lượng",
  accessibleSummary: "Layout đạt 88 điểm.",
  variant: "horizontal-bar",
  data: [{ id: "layout", category: "Layout", value: 88 }],
  encoding: { categoryField: "category", valueField: "value", zeroBaseline: true },
  unit: "điểm",
  numberFormat: { style: "decimal", maximumFractionDigits: 0 },
  labels: { mode: "direct", showValues: true, collisionPolicy: "diagnose" },
  highlights: [{ datumId: "layout", level: "primary" }],
  annotations: [],
  referenceLines: [],
  evidence: { status: "illustrative", sourceIds: [], label: "Dữ liệu minh hoạ" },
  missingValuePolicy: "gap",
  animation: { mode: "zero-to-value", durationMs: 500 }
};
const diagram: DiagramSpec = {
  question: "Dữ liệu đi đâu?",
  title: "Luồng dữ liệu",
  accessibleSummary: "Ứng dụng gửi dữ liệu đến API.",
  intent: "architecture",
  layout: "tree",
  direction: "left-to-right",
  nodes: [
    { id: "app", label: "Ứng dụng", kind: "service", ports: [{ id: "out", direction: "out", side: "right" }] },
    { id: "api", label: "API", kind: "service", ports: [{ id: "in", direction: "in", side: "left" }] }
  ],
  edges: [{ id: "app-api", source: { nodeId: "app", portId: "out" }, target: { nodeId: "api", portId: "in" }, kind: "request" }],
  generatedLayout: null,
  manualOverrides: [],
  accessibleTraversalOrder: ["app", "api"],
  edgeRouting: "orthogonal",
  evidence: { status: "illustrative", sourceIds: [], label: "Sơ đồ minh hoạ" }
};

describe("approved Scene JSX primitives", () => {
  it("compiles the complete approved primitive catalog through the V2 schema", () => {
    const slide = defineSceneSlide({ id: "primitive-gallery", name: "Primitive gallery" }, () => (
      <Slide background={{ layers: [] }}>
        <Group id="group" frame={frame} accessibleSummary="Group">
          <Text id="group-text" frame={frame}>Group text</Text>
        </Group>
        <Stack id="stack" frame={frame} direction="horizontal" accessibleSummary="Stack">
          <Shape id="stack-shape" frame={frame} shape="rectangle" decorative />
        </Stack>
        <Grid id="grid" frame={frame} columns={2} accessibleSummary="Grid">
          <Shape id="grid-shape" frame={frame} shape="ellipse" decorative />
        </Grid>
        <Text id="text" frame={frame}>Text</Text>
        <RichText id="rich-text" frame={frame} document={{ type: "doc" }} plainText="Rich text" />
        <Image id="image" frame={frame} assetId="hero-image" alt="Hero image" />
        <Icon id="icon" frame={frame} icon="sparkles" accessibleSummary="Sparkles" />
        <Shape id="shape" frame={frame} shape="diamond" decorative />
        <Line id="line" frame={frame} x2={100} y2={80} accessibleSummary="Line" />
        <Connector id="connector" frame={frame} from={{ elementId: "text" }} to={{ elementId: "image" }} accessibleSummary="Connector" />
        <Svg id="svg" frame={frame} markup="<svg viewBox='0 0 10 10'></svg>" accessibleSummary="SVG" />
        <Chart id="chart" frame={frame} chart={chart} />
        <Table id="table" frame={frame} columns={["A"]} rows={[[1]]} accessibleSummary="Table" />
        <Diagram id="diagram" frame={frame} diagram={diagram} />
        <Component
          id="component"
          frame={frame}
          componentId="score-ring"
          version="1.0.0"
          componentProps={{ value: 82 }}
          accessibleSummary="Điểm 82 trên 100"
          exportCapabilities={["html", "svg", "png", "pdf"]}
        />
        <WebBlock
          id="web-block"
          frame={frame}
          manifest={{
            id: "custom-radar",
            version: "1.0.0",
            entry: "index.tsx",
            framework: "react",
            accessibleSummary: "Custom radar",
            staticFallback: { type: "svg", assetId: "custom-radar-fallback" },
            allowedImports: ["react"],
            payloadBytes: 100,
            localAssetBytes: 0
          }}
          sourceId="custom-radar-source"
        />
        <EvidenceFooter id="evidence-footer" frame={frame} source="Fixture minh họa" />
      </Slide>
    ));

    expect(slide.elements.map((element) => element.kind)).toEqual([
      "group", "text", "stack", "shape", "grid", "shape", "text", "rich-text",
      "image", "icon", "shape", "line", "connector", "svg", "chart", "table",
      "diagram", "component-instance", "web-block", "evidence-footer"
    ]);
  });

  it("supports fragments without leaking fragment nodes into the scene", () => {
    const slide = defineSceneSlide({ id: "fragments", name: "Fragments" }, () => (
      <Slide background={{ layers: [] }}>
        <>
          <Text id="first" frame={frame}>First</Text>
          <Text id="second" frame={frame}>Second</Text>
        </>
      </Slide>
    ));
    expect(slide.elements.map((element) => element.id)).toEqual(["first", "second"]);
  });

  it("rejects arbitrary capitalized function components at runtime", () => {
    const UnsafeComponent = () => ({ nodeType: "text", value: "unsafe" } as const);
    expect(() => jsx(UnsafeComponent, {})).toThrow(/không phải primitive.*phê duyệt/i);
  });
});
