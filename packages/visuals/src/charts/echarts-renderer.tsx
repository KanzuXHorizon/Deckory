import { init, registerMap } from "echarts/core";
import type { ReactElement } from "react";
import { assertNoRemoteReferences, defaultDeckoryChartTheme, resolveEChartsRenderConfig, toEChartsOption, type DeckoryChartTheme, type EChartsRenderMode } from "./echarts-adapter";
import { advancedChartVariants, type ChartSpec } from "./chart-spec";
import { registerDeckoryEChartsModules } from "./echarts-modules";

export type EChartsLocalGeoAsset = {
  id: string;
  data: unknown;
};

export type RenderEChartsSvgInput = {
  spec: ChartSpec;
  width: number;
  height: number;
  mode: EChartsRenderMode;
  reducedMotion?: boolean;
  theme?: DeckoryChartTheme;
  localGeoAsset?: EChartsLocalGeoAsset;
};

export function renderEChartsSvg({
  spec,
  width,
  height,
  mode,
  reducedMotion = false,
  theme = defaultDeckoryChartTheme,
  localGeoAsset
}: RenderEChartsSvgInput): string {
  if (!advancedChartVariants.includes(spec.variant as (typeof advancedChartVariants)[number])) {
    throw new Error(`${spec.variant} không thuộc advanced ECharts adapter.`);
  }
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error("ECharts SVG bounds phải hữu hạn và có kích thước dương.");
  }

  registerDeckoryEChartsModules();
  let mapName: string | undefined;
  if (spec.variant === "choropleth" || spec.variant === "proportional-symbol-map") {
    if (!localGeoAsset || localGeoAsset.id !== spec.localGeoAssetId) {
      throw new Error(`${spec.variant} thiếu local geographic asset ${spec.localGeoAssetId ?? "unknown"}.`);
    }
    assertNoRemoteReferences(localGeoAsset.data, `geoAsset.${localGeoAsset.id}`);
    mapName = `deckory-${stableHash(`${localGeoAsset.id}:${stableSerialize(localGeoAsset.data)}`)}`;
    registerMap(mapName, localGeoAsset.data as never);
  }

  const renderConfig = resolveEChartsRenderConfig(mode, reducedMotion, spec.animation.durationMs);
  const chart = init(null, undefined, {
    renderer: renderConfig.renderer,
    ssr: true,
    width,
    height
  });
  try {
    chart.setOption(toEChartsOption(spec, theme, { mode, reducedMotion, ...(mapName ? { mapName } : {}) }), {
      notMerge: true,
      lazyUpdate: false,
      silent: true
    });
    const svg = chart.renderToSVGString();
    return normalizeEChartsSvg(svg, `deckory-chart-${stableHash(`${spec.variant}:${spec.title}:${width}:${height}`)}`);
  } finally {
    chart.dispose();
  }
}

export function EChartsSvgRenderer(props: RenderEChartsSvgInput): ReactElement {
  try {
    const svg = renderEChartsSvg(props);
    return (
      <figure
        data-chart-status="ready"
        data-chart-adapter="echarts-svg"
        data-chart-variant={props.spec.variant}
        data-chart-motion={props.mode === "thumbnail" || props.mode === "export" || props.reducedMotion ? "final" : "authored-final"}
        role="img"
        aria-label={props.spec.accessibleSummary}
        style={{ margin: 0, width: "100%", height: "100%", position: "relative" }}
      >
        <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
        <figcaption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {props.spec.accessibleSummary}
        </figcaption>
      </figure>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể render ECharts SVG.";
    return (
      <section
        data-chart-status="adapter-error"
        data-chart-adapter="echarts-svg"
        data-chart-variant={props.spec.variant}
        role="img"
        aria-label={props.spec.accessibleSummary}
      >
        <strong>{props.spec.title}</strong>
        <p>{message}</p>
      </section>
    );
  }
}

export function normalizeEChartsSvg(svg: string, stablePrefix: string): string {
  const withoutRuntimeMetadata = svg
    .replace(/\secmeta_[^=\s]+="[^"]*"/g, "")
    .replace(/\sdata-zr-dom-id="[^"]*"/g, "")
    .replace(/zr\d+/g, stablePrefix);
  const classPattern = new RegExp(`${escapeRegExp(stablePrefix)}-cls-(\\d+)`, "g");
  const classIds = new Map<string, number>();
  let nextClassId = 0;
  return withoutRuntimeMetadata
    .replace(classPattern, (match, sourceId: string) => {
      if (!classIds.has(sourceId)) {
        classIds.set(sourceId, nextClassId);
        nextClassId += 1;
      }
      return `${stablePrefix}-cls-${classIds.get(sourceId)}`;
    })
    .replace(/>\s+</g, "><")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableSerialize(child)}`)
    .join(",")}}`;
}
