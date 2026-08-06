import type { EChartsCoreOption } from "echarts/core";
import {
  advancedChartVariants,
  ChartSpecSchema,
  type ChartDatum,
  type ChartSpec,
  type ChartVariant
} from "./chart-spec";

const echartsVariantSet = new Set<ChartVariant>(advancedChartVariants);

export function isEChartsVariant(variant: ChartVariant): boolean {
  return echartsVariantSet.has(variant);
}

export type EChartsRenderMode = "final" | "studio" | "thumbnail" | "export";

export type DeckoryChartTheme = {
  palette: readonly string[];
  textColor: string;
  mutedTextColor: string;
  axisColor: string;
  gridColor: string;
  backgroundColor: string;
  highlightColor: string;
};

export type EChartsTranslationContext = {
  mode?: EChartsRenderMode;
  reducedMotion?: boolean;
  mapName?: string;
};

export const defaultDeckoryChartTheme: DeckoryChartTheme = Object.freeze({
  palette: ["#5147e8", "#0f8b8d", "#c77700", "#667085", "#8b5cf6", "#1570ef"],
  textColor: "#25282d",
  mutedTextColor: "#667085",
  axisColor: "#aeb4bd",
  gridColor: "#e4e7ec",
  backgroundColor: "transparent",
  highlightColor: "#5147e8"
});

export type EChartsRenderConfig = {
  renderer: "svg";
  animation: boolean;
  animationDuration: number;
};

export function resolveEChartsRenderConfig(
  mode: EChartsRenderMode,
  reducedMotion: boolean,
  durationMs = 500
): EChartsRenderConfig {
  const animation = !reducedMotion && mode !== "thumbnail" && mode !== "export" && durationMs > 0;
  return {
    renderer: "svg",
    animation,
    animationDuration: animation ? Math.min(5000, Math.max(0, durationMs)) : 0
  };
}

function formatValue(spec: ChartSpec, value: unknown): string {
  if (value === null || value === undefined || typeof value !== "number" || !Number.isFinite(value)) {
    return spec.numberFormat.missingLabel ?? "—";
  }
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: spec.numberFormat.style === "compact" ? "decimal" : spec.numberFormat.style,
    notation: spec.numberFormat.style === "compact" ? "compact" : "standard",
    ...(spec.numberFormat.currency ? { currency: spec.numberFormat.currency } : {}),
    ...(spec.numberFormat.minimumFractionDigits === undefined ? {} : { minimumFractionDigits: spec.numberFormat.minimumFractionDigits }),
    maximumFractionDigits: spec.numberFormat.maximumFractionDigits
  });
  return `${spec.numberFormat.prefix ?? ""}${formatter.format(value)}${spec.numberFormat.suffix ?? ""}`;
}

function directLabel(spec: ChartSpec) {
  return {
    show: spec.labels.mode === "direct",
    color: defaultDeckoryChartTheme.textColor,
    formatter: (params: { name?: string; value?: unknown }) => {
      if (!spec.labels.showValues) return String(params.name ?? "");
      const rawValue = Array.isArray(params.value) ? params.value.at(-1) : params.value;
      return `${String(params.name ?? "")} ${formatValue(spec, rawValue)}`.trim();
    }
  };
}

function highlightColor(spec: ChartSpec, datum: ChartDatum, theme: DeckoryChartTheme, index: number): string {
  return spec.highlights.some((highlight) => highlight.datumId === datum.id && highlight.level === "primary")
    ? theme.highlightColor
    : theme.palette[index % theme.palette.length] ?? theme.textColor;
}

function baseOption(spec: ChartSpec, theme: DeckoryChartTheme, context: EChartsTranslationContext): EChartsCoreOption {
  const render = resolveEChartsRenderConfig(context.mode ?? "final", context.reducedMotion ?? false, spec.animation.durationMs);
  return {
    animation: render.animation,
    animationDuration: render.animationDuration,
    backgroundColor: theme.backgroundColor,
    color: [...theme.palette],
    textStyle: { color: theme.textColor, fontFamily: "Inter, Arial, sans-serif" },
    aria: {
      enabled: true,
      decal: { show: false },
      description: spec.accessibleSummary
    },
    tooltip: {
      show: (context.mode ?? "final") !== "thumbnail" && (context.mode ?? "final") !== "export",
      trigger: "item",
      confine: true,
      appendToBody: false
    }
  };
}

function categoryAxes(spec: ChartSpec, theme: DeckoryChartTheme, horizontal = false) {
  const categories = [...new Set(spec.data.map((datum) => datum.category ?? String(datum.x ?? datum.id)))];
  const category = {
    type: "category",
    data: categories,
    axisLabel: { color: theme.mutedTextColor, hideOverlap: true },
    axisLine: { lineStyle: { color: theme.axisColor } },
    axisTick: { show: false }
  };
  const value = {
    type: "value",
    min: spec.encoding.zeroBaseline ? 0 : undefined,
    axisLabel: { color: theme.mutedTextColor },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: theme.gridColor } }
  };
  return horizontal ? { xAxis: value, yAxis: category } : { xAxis: category, yAxis: value };
}

function histogramBins(values: number[]): { label: string; value: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const count = Math.max(3, Math.min(12, Math.ceil(Math.sqrt(values.length))));
  const width = max === min ? 1 : (max - min) / count;
  const bins = Array.from({ length: count }, (_, index) => ({
    start: min + index * width,
    end: index === count - 1 ? max : min + (index + 1) * width,
    value: 0
  }));
  for (const value of values) {
    const index = width === 0 ? 0 : Math.min(count - 1, Math.max(0, Math.floor((value - min) / width)));
    bins[index]!.value += 1;
  }
  return bins.map((bin) => ({ label: `${bin.start.toFixed(1)}–${bin.end.toFixed(1)}`, value: bin.value }));
}

function hierarchyData(spec: ChartSpec) {
  const byParent = new Map<string | undefined, ChartDatum[]>();
  for (const datum of spec.data) {
    const items = byParent.get(datum.parentId) ?? [];
    items.push(datum);
    byParent.set(datum.parentId, items);
  }
  const build = (datum: ChartDatum): Record<string, unknown> => ({
    name: datum.category ?? datum.id,
    value: datum.value ?? 0,
    itemStyle: { color: highlightColor(spec, datum, defaultDeckoryChartTheme, spec.data.indexOf(datum)) },
    ...((byParent.get(datum.id)?.length ?? 0) > 0 ? { children: byParent.get(datum.id)!.map(build) } : {})
  });
  const roots = spec.data.filter((datum) => !datum.parentId || !spec.data.some((candidate) => candidate.id === datum.parentId));
  return roots.map(build);
}

function dateValue(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return 0;
}

function rangeRenderItem(params: { dataIndex: number }, api: { value: (index: number) => number; coord: (value: [number, number]) => [number, number]; size: (value: [number, number]) => [number, number] }) {
  const category = api.value(0);
  const low = api.value(1);
  const high = api.value(2);
  const lowPoint = api.coord([low, category]);
  const highPoint = api.coord([high, category]);
  const height = Math.max(8, api.size([0, 1])[1] * 0.38);
  return {
    type: "group",
    children: [
      { type: "line", shape: { x1: lowPoint[0], y1: lowPoint[1], x2: highPoint[0], y2: highPoint[1] }, style: { stroke: "#5147e8", lineWidth: 3 } },
      { type: "line", shape: { x1: lowPoint[0], y1: lowPoint[1] - height / 2, x2: lowPoint[0], y2: lowPoint[1] + height / 2 }, style: { stroke: "#5147e8", lineWidth: 2 } },
      { type: "line", shape: { x1: highPoint[0], y1: highPoint[1] - height / 2, x2: highPoint[0], y2: highPoint[1] + height / 2 }, style: { stroke: "#5147e8", lineWidth: 2 } }
    ]
  };
}

function ganttRenderItem(params: { dataIndex: number }, api: { value: (index: number) => number; coord: (value: [number, number]) => [number, number]; size: (value: [number, number]) => [number, number] }) {
  const category = api.value(0);
  const start = api.coord([api.value(1), category]);
  const end = api.coord([api.value(2), category]);
  const height = Math.max(10, api.size([0, 1])[1] * 0.55);
  return {
    type: "rect",
    shape: { x: start[0], y: start[1] - height / 2, width: Math.max(1, end[0] - start[0]), height, r: 4 },
    style: { fill: "#5147e8" }
  };
}

export function toEChartsOption(
  input: ChartSpec,
  theme: DeckoryChartTheme = defaultDeckoryChartTheme,
  context: EChartsTranslationContext = {}
): EChartsCoreOption {
  const spec = ChartSpecSchema.parse(input);
  const option = baseOption(spec, theme, context);
  const labels = directLabel(spec);

  switch (spec.variant) {
    case "scatter":
    case "bubble":
      Object.assign(option, {
        grid: { left: 56, right: 28, top: 24, bottom: 48, outerBoundsMode: "same" },
        xAxis: { type: typeof spec.data[0]?.x === "string" ? "category" : "value", axisLabel: { color: theme.mutedTextColor }, splitLine: { lineStyle: { color: theme.gridColor } } },
        yAxis: { type: "value", axisLabel: { color: theme.mutedTextColor }, splitLine: { lineStyle: { color: theme.gridColor } } },
        series: [{
          type: "scatter",
          data: spec.data.map((datum, index) => ({
            name: datum.category ?? datum.id,
            value: [datum.x, datum.y, datum.size ?? 8],
            itemStyle: { color: highlightColor(spec, datum, theme, index) }
          })),
          symbolSize: spec.variant === "bubble" ? (value: unknown[]) => Math.max(8, Number(value[2] ?? 8)) : 10,
          label: labels
        }]
      });
      break;
    case "histogram": {
      const bins = histogramBins(spec.data.flatMap((datum) => typeof datum.value === "number" ? [datum.value] : []));
      Object.assign(option, {
        grid: { left: 56, right: 24, top: 24, bottom: 56, outerBoundsMode: "same" },
        xAxis: { type: "category", data: bins.map((bin) => bin.label), axisLabel: { color: theme.mutedTextColor, rotate: bins.length > 8 ? 25 : 0 } },
        yAxis: { type: "value", min: 0, axisLabel: { color: theme.mutedTextColor }, splitLine: { lineStyle: { color: theme.gridColor } } },
        series: [{ type: "bar", data: bins.map((bin) => bin.value), barCategoryGap: "4%", itemStyle: { color: theme.palette[0] } }]
      });
      break;
    }
    case "box-plot":
      Object.assign(option, {
        grid: { left: 56, right: 24, top: 24, bottom: 48, outerBoundsMode: "same" },
        xAxis: { type: "value", axisLabel: { color: theme.mutedTextColor }, splitLine: { lineStyle: { color: theme.gridColor } } },
        yAxis: { type: "category", data: spec.data.map((datum) => datum.category ?? datum.id), axisLabel: { color: theme.mutedTextColor } },
        series: [{
          type: "custom",
          renderItem: rangeRenderItem,
          encode: { x: [1, 2], y: 0 },
          data: spec.data.map((datum, index) => [index, datum.low, datum.high])
        }]
      });
      break;
    case "heatmap": {
      const xValues = [...new Set(spec.data.map((datum) => String(datum.x)))];
      const yValues = [...new Set(spec.data.map((datum) => String(datum.y)))];
      const values = spec.data.flatMap((datum) => typeof datum.value === "number" ? [datum.value] : []);
      Object.assign(option, {
        grid: { left: 58, right: 32, top: 24, bottom: 54, outerBoundsMode: "same" },
        xAxis: { type: "category", data: xValues, axisLabel: { color: theme.mutedTextColor } },
        yAxis: { type: "category", data: yValues, axisLabel: { color: theme.mutedTextColor } },
        visualMap: { min: Math.min(...values), max: Math.max(...values), calculable: false, orient: "horizontal", left: "center", bottom: 0, inRange: { color: ["#eef2ff", theme.highlightColor] } },
        series: [{ type: "heatmap", data: spec.data.map((datum) => [xValues.indexOf(String(datum.x)), yValues.indexOf(String(datum.y)), datum.value]), label: labels }]
      });
      break;
    }
    case "calendar-heatmap": {
      const values = spec.data.flatMap((datum) => typeof datum.value === "number" ? [datum.value] : []);
      const year = spec.data[0]?.date?.slice(0, 4) ?? String(new Date().getUTCFullYear());
      Object.assign(option, {
        visualMap: { min: Math.min(...values), max: Math.max(...values), show: false, inRange: { color: ["#eef2ff", theme.highlightColor] } },
        calendar: { range: year, cellSize: ["auto", 18], itemStyle: { borderWidth: 2, borderColor: theme.backgroundColor }, dayLabel: { color: theme.mutedTextColor }, monthLabel: { color: theme.textColor }, yearLabel: { show: false } },
        series: [{ type: "heatmap", coordinateSystem: "calendar", data: spec.data.map((datum) => [datum.date, datum.value]) }]
      });
      break;
    }
    case "donut":
      Object.assign(option, {
        series: [{
          type: "pie",
          radius: ["46%", "72%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: theme.backgroundColor === "transparent" ? "#ffffff" : theme.backgroundColor, borderWidth: 2 },
          label: labels,
          data: spec.data.map((datum, index) => ({ name: datum.category ?? datum.id, value: datum.value ?? 0, itemStyle: { color: highlightColor(spec, datum, theme, index) } }))
        }]
      });
      break;
    case "waffle": {
      const total = spec.data.reduce((sum, datum) => sum + Math.max(0, datum.value ?? 0), 0) || 1;
      const cells: Array<[number, number, number]> = [];
      let cursor = 0;
      spec.data.forEach((datum, seriesIndex) => {
        const count = Math.round(((datum.value ?? 0) / total) * 100);
        for (let index = 0; index < count && cursor < 100; index += 1, cursor += 1) cells.push([cursor % 10, 9 - Math.floor(cursor / 10), seriesIndex]);
      });
      while (cursor < 100) { cells.push([cursor % 10, 9 - Math.floor(cursor / 10), spec.data.length]); cursor += 1; }
      Object.assign(option, {
        grid: { left: "center", top: "middle", width: "70%", height: "76%" },
        xAxis: { type: "value", min: -0.5, max: 9.5, show: false },
        yAxis: { type: "value", min: -0.5, max: 9.5, show: false },
        series: [{ type: "scatter", symbol: "roundRect", symbolSize: 18, data: cells.map((cell) => ({ value: cell.slice(0, 2), itemStyle: { color: theme.palette[cell[2]] ?? "#e4e7ec" } })) }]
      });
      break;
    }
    case "treemap":
      Object.assign(option, { series: [{ type: "treemap", roam: false, nodeClick: false, breadcrumb: { show: false }, label: labels, data: hierarchyData(spec) }] });
      break;
    case "sunburst":
      Object.assign(option, { series: [{ type: "sunburst", radius: ["12%", "90%"], nodeClick: false, label: labels, data: hierarchyData(spec) }] });
      break;
    case "funnel":
      Object.assign(option, { series: [{ type: "funnel", left: "12%", right: "12%", top: 24, bottom: 24, sort: "descending", gap: 4, label: labels, data: spec.data.map((datum) => ({ name: datum.category ?? datum.id, value: datum.value ?? 0 })) }] });
      break;
    case "sankey": {
      const nodeNames = [...new Set(spec.data.flatMap((datum) => [datum.source, datum.targetNode]).filter((value): value is string => Boolean(value)))];
      Object.assign(option, {
        series: [{
          type: "sankey",
          left: 16,
          right: 16,
          top: 20,
          bottom: 20,
          nodeAlign: "justify",
          emphasis: { focus: "adjacency" },
          label: { color: theme.textColor },
          data: nodeNames.map((name) => ({ name })),
          links: spec.data.map((datum) => ({ source: datum.source, target: datum.targetNode, value: datum.value ?? 0 }))
        }]
      });
      break;
    }
    case "radar": {
      const max = Math.max(...spec.data.map((datum) => datum.value ?? 0), 1);
      Object.assign(option, {
        radar: { indicator: spec.data.map((datum) => ({ name: datum.category ?? datum.id, max: max * 1.15 })), axisName: { color: theme.textColor }, splitLine: { lineStyle: { color: theme.gridColor } }, splitArea: { show: false } },
        series: [{ type: "radar", data: [{ name: spec.title, value: spec.data.map((datum) => datum.value ?? 0), areaStyle: { opacity: 0.18 }, lineStyle: { width: 2 } }] }]
      });
      break;
    }
    case "gauge": {
      const datum = spec.data[0]!;
      const max = Math.max(100, ...(spec.data.map((item) => item.value ?? 0)));
      Object.assign(option, {
        series: [{
          type: "gauge",
          min: 0,
          max,
          progress: { show: true, width: 14 },
          axisLine: { lineStyle: { width: 14, color: [[1, theme.gridColor]] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: theme.mutedTextColor },
          pointer: { show: false },
          anchor: { show: false },
          detail: { formatter: (value: number) => formatValue(spec, value), color: theme.textColor, fontSize: 28 },
          data: [{ name: datum.category ?? datum.id, value: datum.value ?? 0 }]
        }]
      });
      break;
    }
    case "gantt": {
      const categories = spec.data.map((datum) => datum.category ?? datum.id);
      Object.assign(option, {
        grid: { left: 96, right: 28, top: 24, bottom: 48, outerBoundsMode: "same" },
        xAxis: { type: "time", axisLabel: { color: theme.mutedTextColor }, splitLine: { lineStyle: { color: theme.gridColor } } },
        yAxis: { type: "category", data: categories, axisLabel: { color: theme.mutedTextColor } },
        series: [{ type: "custom", renderItem: ganttRenderItem, encode: { x: [1, 2], y: 0 }, data: spec.data.map((datum, index) => [index, dateValue(datum.start), dateValue(datum.end)]) }]
      });
      break;
    }
    case "timeline":
      Object.assign(option, {
        grid: { left: 54, right: 30, top: 24, bottom: 48, outerBoundsMode: "same" },
        xAxis: { type: "time", axisLabel: { color: theme.mutedTextColor }, splitLine: { show: false } },
        yAxis: { type: "value", show: false, min: -1, max: 1 },
        series: [{ type: "line", symbolSize: 12, lineStyle: { width: 3 }, label: { show: true, formatter: (params: { name?: string }) => params.name ?? "", position: "top" }, data: spec.data.map((datum) => ({ name: datum.category ?? datum.id, value: [dateValue(datum.start), 0] })) }]
      });
      break;
    case "small-multiples": {
      const seriesNames = [...new Set(spec.data.map((datum) => datum.series).filter((value): value is string => Boolean(value)))];
      const columns = Math.min(3, seriesNames.length);
      const rows = Math.ceil(seriesNames.length / columns);
      const grid = seriesNames.map((_, index) => ({ left: `${(index % columns) * (100 / columns) + 4}%`, top: `${Math.floor(index / columns) * (100 / rows) + 8}%`, width: `${100 / columns - 8}%`, height: `${100 / rows - 16}%`, outerBoundsMode: "same" }));
      Object.assign(option, {
        grid,
        xAxis: seriesNames.map((_, index) => ({ type: "category", gridIndex: index, data: [...new Set(spec.data.filter((datum) => datum.series === seriesNames[index]).map((datum) => datum.category))], axisLabel: { color: theme.mutedTextColor } })),
        yAxis: seriesNames.map((_, index) => ({ type: "value", gridIndex: index, min: spec.encoding.zeroBaseline ? 0 : undefined, axisLabel: { color: theme.mutedTextColor }, splitLine: { lineStyle: { color: theme.gridColor } } })),
        title: seriesNames.map((name, index) => ({ text: name, left: grid[index]?.left, top: `${Math.floor(index / columns) * (100 / rows) + 1}%`, textStyle: { color: theme.textColor, fontSize: 12 } })),
        series: seriesNames.map((name, index) => ({ type: "line", xAxisIndex: index, yAxisIndex: index, showSymbol: true, data: spec.data.filter((datum) => datum.series === name).map((datum) => datum.value ?? 0) }))
      });
      break;
    }
    case "choropleth": {
      if (!context.mapName) throw new Error("choropleth requires a registered local map name.");
      const values = spec.data.flatMap((datum) => typeof datum.value === "number" ? [datum.value] : []);
      Object.assign(option, {
        visualMap: { min: Math.min(...values), max: Math.max(...values), show: false, inRange: { color: ["#eef2ff", theme.highlightColor] } },
        series: [{ type: "map", map: context.mapName, roam: false, label: labels, data: spec.data.map((datum) => ({ name: datum.geographyKey, value: datum.value ?? 0 })) }]
      });
      break;
    }
    case "proportional-symbol-map":
      if (!context.mapName) throw new Error("proportional-symbol-map requires a registered local map name.");
      Object.assign(option, {
        geo: { map: context.mapName, roam: false, itemStyle: { areaColor: "#f2f4f7", borderColor: theme.axisColor }, emphasis: { disabled: true } },
        series: [{ type: "scatter", coordinateSystem: "geo", data: spec.data.map((datum, index) => ({ name: datum.geographyKey, value: [datum.x, datum.y, datum.value], symbolSize: Math.max(8, datum.size ?? Number(datum.value ?? 8)), itemStyle: { color: highlightColor(spec, datum, theme, index) } })), label: labels }]
      });
      break;
    default:
      throw new Error(`${spec.variant} belongs to the native editorial renderer, not ECharts.`);
  }

  assertNoRemoteReferences(option);
  return option;
}

export function assertNoRemoteReferences(value: unknown, path = "option", seen = new Set<object>()): void {
  if (typeof value === "string" && /^(?:https?:|\/\/|file:|blob:)/i.test(value.trim())) {
    throw new Error(`Remote ECharts reference denied at ${path}.`);
  }
  if (!value || typeof value !== "object" || typeof value === "function") return;
  if (seen.has(value as object)) return;
  seen.add(value as object);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoRemoteReferences(item, `${path}[${index}]`, seen));
  } else {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => assertNoRemoteReferences(child, `${path}.${key}`, seen));
  }
}
