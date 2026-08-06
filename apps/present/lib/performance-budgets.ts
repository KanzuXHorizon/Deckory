export type RouteBundleStat = {
  route: string;
  firstLoadUncompressedJsBytes: number;
  firstLoadChunkPaths: string[];
};

export type RouteBundleDiagnostic = {
  route: string;
  code: "route-bundle-over-budget" | "forbidden-first-load-signature" | "missing-route-stat";
  message: string;
};

export const ROUTE_BUNDLE_BUDGETS = Object.freeze({
  "/": 1_350_000,
  "/preview": 1_250_000,
  "/present": 1_250_000,
  "/export": 1_200_000,
  "/studio": 1_500_000
} satisfies Readonly<Record<string, number>>);

export const ROUTE_FIRST_LOAD_DENYLIST: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "/": ["__ec_primitive__", "registerChartView", "react-moveable", "react-selecto", "esbuild-wasm"],
  "/preview": ["__ec_primitive__", "registerChartView", "react-moveable", "react-selecto", "esbuild-wasm"],
  "/present": ["__ec_primitive__", "registerChartView", "react-moveable", "react-selecto", "esbuild-wasm"],
  "/export": ["react-moveable", "react-selecto", "esbuild-wasm"]
});

export const INTERACTION_BUDGETS = Object.freeze({
  slideSwitchMs: 150,
  overviewOpenMs: 350
});

export function evaluateRouteBundles(
  stats: readonly RouteBundleStat[],
  chunkSources: Readonly<Record<string, string>>
): RouteBundleDiagnostic[] {
  const diagnostics: RouteBundleDiagnostic[] = [];
  const byRoute = new Map(stats.map((stat) => [stat.route, stat]));

  for (const [route, budget] of Object.entries(ROUTE_BUNDLE_BUDGETS)) {
    const stat = byRoute.get(route);
    if (!stat) {
      diagnostics.push({
        route,
        code: "missing-route-stat",
        message: `Không tìm thấy bundle stat cho route ${route}.`
      });
      continue;
    }
    if (stat.firstLoadUncompressedJsBytes > budget) {
      diagnostics.push({
        route,
        code: "route-bundle-over-budget",
        message: `${route} first-load ${stat.firstLoadUncompressedJsBytes} byte vượt budget ${budget} byte.`
      });
    }

    const denied = ROUTE_FIRST_LOAD_DENYLIST[route] ?? [];
    for (const chunkPath of stat.firstLoadChunkPaths) {
      const source = chunkSources[chunkPath] ?? "";
      for (const signature of denied) {
        if (source.includes(signature)) {
          diagnostics.push({
            route,
            code: "forbidden-first-load-signature",
            message: `${route} first-load chunk ${chunkPath} chứa forbidden signature ${signature}.`
          });
        }
      }
    }
  }

  return diagnostics;
}
