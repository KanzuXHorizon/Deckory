import { describe, expect, it } from "vitest";
import { searchSlideRecipes } from "./search.js";

describe("searchSlideRecipes", () => {
  it("normalizes Vietnamese text and ranks the most relevant semantic recipe first", () => {
    expect(searchSlideRecipes("kiến trúc hệ thống")[0]?.id).toBe("system-architecture");
    expect(searchSlideRecipes("kpi dữ liệu").map((item) => item.id)).toContain("kpi-overview");
  });

  it("boosts exact IDs and keeps deterministic ID ordering for ties", () => {
    expect(searchSlideRecipes("professional-cover")[0]?.id).toBe("professional-cover");
    expect(searchSlideRecipes("decision").map((item) => item.id)).toEqual(
      [...searchSlideRecipes("decision")].map((item) => item.id)
    );
  });

  it("returns no result for an empty query", () => {
    expect(searchSlideRecipes("   ")).toEqual([]);
  });
});
