import {
  advancedChartVariants,
  type ChartSpec,
  type ChartVariant
} from "./chart-spec";

export type AdvancedChartVariant = (typeof advancedChartVariants)[number];
export type ChartRenderMode = "final" | "thumbnail" | "studio" | "export";

export type EChartsRenderConfig = {
  renderer: "svg";
  animation: boolean;
};

export type EChartsRenderRequest = {
  spec: ChartSpec;
  renderer: "svg";
  animation: boolean;
  mode: ChartRenderMode;
  reducedMotion: boolean;
  themeTokenIds: string[];
  localGeoAssetId?: string;
};

export type EChartsSvgResult = {
  svg: string;
  accessibleSummary: string;
  warnings: string[];
};

export interface EChartsAdapter {
  readonly id: string;
  readonly version: string;
  readonly supportedVariants: readonly AdvancedChartVariant[];
  renderSvg(request: EChartsRenderRequest): Promise<EChartsSvgResult>;
}

export function isEChartsVariant(
  variant: ChartVariant
): variant is AdvancedChartVariant {
  return (advancedChartVariants as readonly ChartVariant[]).includes(variant);
}

export function resolveEChartsRenderConfig(
  mode: ChartRenderMode,
  reducedMotion: boolean
): EChartsRenderConfig {
  return {
    renderer: "svg",
    animation: mode !== "thumbnail" && !reducedMotion
  };
}

function cloneSpec(spec: ChartSpec): ChartSpec {
  return {
    ...spec,
    data: spec.data.map((datum) => ({ ...datum })),
    encoding: { ...spec.encoding },
    numberFormat: { ...spec.numberFormat },
    labels: { ...spec.labels },
    highlights: spec.highlights.map((highlight) => ({ ...highlight })),
    annotations: spec.annotations.map((annotation) => ({ ...annotation })),
    referenceLines: spec.referenceLines.map((line) => ({ ...line })),
    evidence: {
      ...spec.evidence,
      sourceIds: [...spec.evidence.sourceIds]
    },
    animation: { ...spec.animation }
  };
}

export function createEChartsRenderRequest(
  spec: ChartSpec,
  options: {
    mode: ChartRenderMode;
    reducedMotion: boolean;
    themeTokenIds: readonly string[];
  }
): EChartsRenderRequest {
  if (!isEChartsVariant(spec.variant)) {
    throw new Error(
      `Variant ${spec.variant} thuộc Deckory editorial renderer, không thuộc ECharts adapter.`
    );
  }

  const config = resolveEChartsRenderConfig(options.mode, options.reducedMotion);
  return {
    spec: cloneSpec(spec),
    renderer: config.renderer,
    animation: config.animation,
    mode: options.mode,
    reducedMotion: options.reducedMotion,
    themeTokenIds: [...new Set(options.themeTokenIds)].sort((left, right) =>
      left.localeCompare(right, "en")
    ),
    ...(spec.localGeoAssetId ? { localGeoAssetId: spec.localGeoAssetId } : {})
  };
}
