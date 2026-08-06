import { describe, expect, it } from "vitest";
import {
  evaluateRouteBundles,
  ROUTE_BUNDLE_BUDGETS,
  type RouteBundleStat
} from "./performance-budgets";

function passingStats(): RouteBundleStat[] {
  return Object.entries(ROUTE_BUNDLE_BUDGETS).map(([route, budget], index) => ({
    route,
    firstLoadUncompressedJsBytes: budget - 10_000,
    firstLoadChunkPaths: [`.next/static/chunks/route-${index}.js`]
  }));
}

describe("route performance budgets", () => {
  it("accepts first-load bundles below the declared limits", () => {
    const stats = passingStats();
    const sources = Object.fromEntries(stats.flatMap((stat) => stat.firstLoadChunkPaths.map((path) => [path, "safe route code"])));
    expect(evaluateRouteBundles(stats, sources)).toEqual([]);
  });

  it("reports an exact route bundle overage", () => {
    const stats = passingStats().map((stat) => stat.route === "/present"
      ? { ...stat, firstLoadUncompressedJsBytes: ROUTE_BUNDLE_BUDGETS["/present"] + 1 }
      : stat);
    const diagnostics = evaluateRouteBundles(stats, {});
    expect(diagnostics).toContainEqual(expect.objectContaining({
      route: "/present",
      code: "route-bundle-over-budget"
    }));
  });

  it("keeps heavy chart and editor runtimes out of Presenter first-load", () => {
    const stats = passingStats();
    const presenter = stats.find((stat) => stat.route === "/present")!;
    const diagnostics = evaluateRouteBundles(stats, {
      [presenter.firstLoadChunkPaths[0]!]: "registerChartView and __ec_primitive__"
    });
    expect(diagnostics.filter((item) => item.route === "/present")).toEqual([
      expect.objectContaining({ code: "forbidden-first-load-signature" }),
      expect.objectContaining({ code: "forbidden-first-load-signature" })
    ]);
  });

  it("does not inspect async chunks that are absent from first-load stats", () => {
    const stats = passingStats();
    expect(evaluateRouteBundles(stats, {
      ".next/static/chunks/advanced-chart-async.js": "registerChartView and __ec_primitive__"
    })).toEqual([]);
  });
});
