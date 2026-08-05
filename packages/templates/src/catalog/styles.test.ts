import { describe, expect, it } from "vitest";
import { visualStyles } from "./styles.js";

const stableId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("visual style catalog", () => {
  it("publishes unique, stable presets with complete guidance", () => {
    const ids = visualStyles.map((style) => style.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(visualStyles.length).toBeGreaterThanOrEqual(5);

    for (const style of visualStyles) {
      expect(style.id).toMatch(stableId);
      expect(style.name.trim()).not.toBe("");
      expect(style.description.trim()).not.toBe("");
      expect(style.scenarios.length).toBeGreaterThan(0);
      expect(style.audiences.length).toBeGreaterThan(0);
      expect(style.tones.length).toBeGreaterThan(0);
      expect(style.compositionGuidance.length).toBeGreaterThanOrEqual(3);
      expect(style.prohibitedPatterns.length).toBeGreaterThanOrEqual(3);

      for (const value of Object.values(style.dials)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(10);
      }
    }
  });

  it("covers the primary professional presentation scenarios", () => {
    const scenarios = new Set(visualStyles.flatMap((style) => [...style.scenarios]));

    expect([...scenarios]).toEqual(expect.arrayContaining([
      "executive",
      "pitch",
      "product",
      "technical",
      "academic"
    ]));
  });
});
