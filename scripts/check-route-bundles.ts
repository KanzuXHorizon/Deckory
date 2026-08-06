import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  evaluateRouteBundles,
  ROUTE_BUNDLE_BUDGETS,
  type RouteBundleStat
} from "../apps/present/lib/performance-budgets.ts";

const presentRoot = resolve(process.cwd(), "apps", "present");
const statsPath = resolve(presentRoot, ".next", "diagnostics", "route-bundle-stats.json");

if (!existsSync(statsPath)) {
  console.error("Deckory bundle check cần production build trước: pnpm build.");
  process.exitCode = 1;
} else {
  const stats = JSON.parse(readFileSync(statsPath, "utf8")) as RouteBundleStat[];
  const sources: Record<string, string> = {};
  for (const stat of stats) {
    for (const chunkPath of stat.firstLoadChunkPaths) {
      if (sources[chunkPath] !== undefined) continue;
      const absolutePath = resolve(presentRoot, chunkPath.replaceAll("\\", "/"));
      sources[chunkPath] = existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
    }
  }

  const diagnostics = evaluateRouteBundles(stats, sources);
  console.log("Deckory route bundle budgets");
  for (const [route, budget] of Object.entries(ROUTE_BUNDLE_BUDGETS)) {
    const stat = stats.find((candidate) => candidate.route === route);
    const actual = stat?.firstLoadUncompressedJsBytes;
    console.log(`- ${route}: ${actual ?? "missing"} / ${budget} byte`);
  }

  if (diagnostics.length > 0) {
    for (const diagnostic of diagnostics) console.error(`- ${diagnostic.code}: ${diagnostic.message}`);
    process.exitCode = 1;
  } else {
    console.log("PASS: first-load budgets và denylist đều sạch.");
  }
}
