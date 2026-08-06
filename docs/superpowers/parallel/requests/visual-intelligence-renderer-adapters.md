# Contract Change Request

- Track: Visual Intelligence Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Render advanced chart variants and graph layouts through reviewed adapter implementations while keeping raw ECharts/ELK objects outside Deckory document contracts.
- Existing contract: `@deckory/visuals` exposes pure `EChartsAdapter`, `ElkLayoutAdapter`, `createEChartsRenderRequest`, `createElkLayoutRequest`, editorial geometry and deterministic diagram layouts. No vendor package is installed or wired in this track.
- Proposed exact type/signature:

```ts
const echartsAdapter: EChartsAdapter = {
  id: "deckory-echarts-svg",
  version: "6.1.0",
  supportedVariants: advancedChartVariants,
  async renderSvg(request: EChartsRenderRequest): Promise<EChartsSvgResult> {
    // Translate request.spec inside the private adapter only.
    // Register only declared chart/component modules plus SVGRenderer.
    // No raw option crosses this boundary.
  }
};

const elkAdapter: ElkLayoutAdapter = {
  id: "deckory-elk-layout",
  version: "0.12.0",
  supportedStrategies: ["elk-layered", "elk-force"],
  async layout(request: ElkLayoutRequest): Promise<ElkLayoutResult> {
    // Translate measured nodes/typed edges to ELK inside this adapter only.
    // Return Deckory node positions and edge points only.
  }
};
```

Renderer integration should accept only:

```ts
type VisualRendererDependencies = {
  echarts?: EChartsAdapter;
  elk?: ElkLayoutAdapter;
};
```

- Files the coordinator would change:
  - `packages/visuals/package.json` or a new isolated adapter package manifest
  - `packages/renderer/**` focused chart/diagram renderer files and tests
  - coordinator-owned package manifests and `pnpm-lock.yaml`
  - shared renderer barrels only after review
- Failing test that motivates the change: Integrated renderer tests must prove SVG mode, reduced-motion/thumbnail final-state behavior, local-only map assets, direct accessible summaries, no remote data/map fetch, long-label measured layouts and rejection of unsupported variants/strategies.
- Compatibility impact: Additive optional adapter dependencies. Editorial charts and deterministic diagram layouts remain vendor-free. Presenter bundles should tree-shake advanced adapters and must not load Studio-only dependencies.
- Can the track continue without it: yes; advanced rendering and ELK execution remain intentionally unresolved.

## Dependency request

Registry versions verified during this session:

| Package | Requested exact version | Required import surface | Reason | Bundle/worker impact |
|---|---:|---|---|---|
| `echarts` | `6.1.0` | selected chart modules, selected components, `SVGRenderer`, core init/dispose APIs | Advanced chart variants only | Tree-shaken modules; SVG renderer only; exclude full-bundle import |
| `elkjs` | `0.12.0` | bundled/worker-capable ELK layout API | `elk-layered` and `elk-force` only | Prefer worker boundary; warn after 2 seconds; never persist ELK response objects |

The coordinator must install both once in the integration worktree. This track intentionally did not change `pnpm-lock.yaml`.

## Renderer requirements

- Editorial variants use `buildEditorialChartGeometry`; do not route them through ECharts.
- ECharts rendering is always SVG. Animation is disabled for thumbnail, reduced-motion and deterministic export modes.
- Geographic visuals accept only `localGeoAssetId` resolved through the typed asset manifest.
- ELK receives measured node dimensions from the same renderer font metrics after integration; current deterministic estimator is a safe core fallback, not final browser measurement evidence.
- Edge/node accessible summaries and source/evidence labels remain outside generated SVG markup as Deckory-owned metadata.
