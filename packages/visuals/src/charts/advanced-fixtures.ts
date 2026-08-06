import {
  ChartSpecSchema,
  advancedChartVariants,
  type ChartSpec,
  type ChartVariant
} from "./chart-spec";

const base = {
  question: "Visual này trả lời câu hỏi nào?",
  title: "Advanced chart fixture",
  accessibleSummary: "Dữ liệu minh hoạ cho advanced chart adapter.",
  encoding: {},
  unit: "đơn vị",
  numberFormat: { style: "decimal" as const, maximumFractionDigits: 1 },
  labels: { mode: "direct" as const, showValues: true, collisionPolicy: "diagnose" as const },
  highlights: [],
  annotations: [],
  referenceLines: [],
  evidence: { status: "illustrative" as const, sourceIds: [], label: "Dữ liệu minh hoạ" },
  missingValuePolicy: "gap" as const,
  animation: { mode: "fade" as const, durationMs: 500 }
};

export const localGeoFixture = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "north",
      properties: { name: "North" },
      geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]
      }
    },
    {
      type: "Feature",
      id: "south",
      properties: { name: "South" },
      geometry: {
        type: "Polygon",
        coordinates: [[[0, -5], [4, -5], [4, -1], [0, -1], [0, -5]]]
      }
    }
  ]
} as const;

export function createAdvancedChartFixture(variant: ChartVariant): ChartSpec {
  let input: ChartSpec;
  switch (variant) {
    case "scatter":
      input = { ...base, variant, data: [{ id: "p1", x: 2, y: 4 }, { id: "p2", x: 6, y: 8 }], encoding: { xField: "x", yField: "y" } };
      break;
    case "bubble":
      input = { ...base, variant, data: [{ id: "p1", x: 2, y: 4, size: 12 }, { id: "p2", x: 6, y: 8, size: 22 }], encoding: { xField: "x", yField: "y", sizeField: "size" } };
      break;
    case "histogram":
      input = { ...base, variant, data: [1, 2, 2.5, 3, 4, 4.5, 5, 7].map((value, index) => ({ id: `v${index}`, value })), encoding: { valueField: "value" } };
      break;
    case "box-plot":
      input = { ...base, variant, data: [
        { id: "a", category: "A", low: 1, high: 8 },
        { id: "b", category: "B", low: 3, high: 10 }
      ], encoding: { categoryField: "category" } };
      break;
    case "heatmap":
      input = { ...base, variant, data: [
        { id: "a", x: "Mon", y: 1, value: 12 },
        { id: "b", x: "Tue", y: 1, value: 18 },
        { id: "c", x: "Mon", y: 2, value: 8 }
      ], encoding: { xField: "x", yField: "y", valueField: "value" } };
      break;
    case "calendar-heatmap":
      input = { ...base, variant, data: [
        { id: "d1", date: "2026-08-01", value: 12 },
        { id: "d2", date: "2026-08-02", value: 18 }
      ], encoding: { dateField: "date", valueField: "value" } };
      break;
    case "donut":
    case "waffle":
    case "funnel":
    case "radar":
    case "gauge":
      input = { ...base, variant, data: [
        { id: "a", category: "A", value: 42 },
        { id: "b", category: "B", value: 31 },
        { id: "c", category: "C", value: 27 }
      ], encoding: { categoryField: "category", valueField: "value" } };
      break;
    case "treemap":
      input = { ...base, variant, data: [
        { id: "root-a", category: "A", value: 60 },
        { id: "root-b", category: "B", value: 40 }
      ], encoding: { categoryField: "category", valueField: "value" } };
      break;
    case "sunburst":
      input = { ...base, variant, data: [
        { id: "root", category: "Root", value: 100 },
        { id: "child-a", category: "A", value: 60, parentId: "root" },
        { id: "child-b", category: "B", value: 40, parentId: "root" }
      ], encoding: { categoryField: "category", valueField: "value" } };
      break;
    case "sankey":
      input = { ...base, variant, data: [
        { id: "a-b", source: "A", targetNode: "B", value: 18 },
        { id: "b-c", source: "B", targetNode: "C", value: 12 }
      ], encoding: { sourceField: "source", targetNodeField: "targetNode", valueField: "value" } };
      break;
    case "gantt":
      input = { ...base, variant, data: [
        { id: "research", category: "Research", start: "2026-08-01", end: "2026-08-04" },
        { id: "build", category: "Build", start: "2026-08-04", end: "2026-08-09" }
      ], encoding: { categoryField: "category", startField: "start", endField: "end" } };
      break;
    case "timeline":
      input = { ...base, variant, data: [
        { id: "kickoff", category: "Kickoff", start: "2026-08-01" },
        { id: "release", category: "Release", start: "2026-08-09" }
      ], encoding: { categoryField: "category", startField: "start" } };
      break;
    case "small-multiples":
      input = { ...base, variant, data: [
        { id: "a1", category: "Q1", series: "A", value: 12 },
        { id: "a2", category: "Q2", series: "A", value: 18 },
        { id: "b1", category: "Q1", series: "B", value: 9 },
        { id: "b2", category: "Q2", series: "B", value: 14 }
      ], encoding: { categoryField: "category", seriesField: "series", valueField: "value" } };
      break;
    case "choropleth":
      input = { ...base, variant, data: [
        { id: "north", geographyKey: "North", value: 20 },
        { id: "south", geographyKey: "South", value: 12 }
      ], encoding: { geographyField: "geographyKey", valueField: "value" }, localGeoAssetId: "local-geo" };
      break;
    case "proportional-symbol-map":
      input = { ...base, variant, data: [
        { id: "north", geographyKey: "North", x: 2, y: 2, value: 20, size: 20 },
        { id: "south", geographyKey: "South", x: 2, y: -3, value: 12, size: 12 }
      ], encoding: { geographyField: "geographyKey", xField: "x", yField: "y", valueField: "value", sizeField: "size" }, localGeoAssetId: "local-geo" };
      break;
    default:
      throw new Error(`No advanced fixture for ${variant}.`);
  }
  return ChartSpecSchema.parse(input);
}

export const advancedChartFixtures = Object.freeze(Object.fromEntries(
  advancedChartVariants.map((variant) => [variant, createAdvancedChartFixture(variant)])
) as Record<(typeof advancedChartVariants)[number], ChartSpec>);
