import { describe, expect, it } from "vitest";
import { validateDeck, type SlideComponent } from "@deckory/schema";
import { createComponent, isCompatible } from "./component-catalog";

describe("Studio component catalog", () => {
  it("creates valid table and code defaults that can enter a data slide", () => {
    const table = createComponent("table", "comparison-table");
    const code = createComponent("code", "validation-code");
    const result = validateDeck({
      id: "component-catalog",
      version: 1,
      title: "Component catalog",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{ id: "technical-proof", layout: "data", components: [table, code] }]
    });

    expect(table).toMatchObject({ type: "table", props: { columns: expect.any(Array), rows: expect.any(Array) } });
    expect(code).toMatchObject({ type: "code", props: { language: "typescript", showLineNumbers: true } });
    expect(result).toMatchObject({ ok: true });
  });

  it("creates valid team and visualizer defaults that can enter supported slides", () => {
    const team = createComponent("team-showcase", "delivery-team");
    const visualizer = createComponent("visualizer", "growth-map");
    const result = validateDeck({
      id: "people-and-relationships",
      version: 1,
      title: "People and relationships",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [
        { id: "team", layout: "process", components: [team] },
        { id: "growth", layout: "data", components: [visualizer] }
      ]
    });

    expect(team).toMatchObject({ type: "team-showcase", props: { members: expect.any(Array) } });
    expect(visualizer).toMatchObject({ type: "visualizer", props: { variant: "growth-tree", items: expect.any(Array) } });
    expect(result).toMatchObject({ ok: true });
  });

  it("exposes table and code only on layouts that can present them clearly", () => {
    const cases: Array<[string, SlideComponent["type"], boolean]> = [
      ["data", "table", true],
      ["dashboard", "table", true],
      ["comparison", "table", true],
      ["cover", "table", false],
      ["data", "code", true],
      ["split", "code", true],
      ["architecture", "code", true],
      ["statement", "code", false],
      ["process", "team-showcase", true],
      ["data", "visualizer", true],
      ["cover", "team-showcase", true],
      ["comparison", "visualizer", false]
    ];

    for (const [layout, type, expected] of cases) {
      expect(isCompatible(layout as Parameters<typeof isCompatible>[0], type)).toBe(expected);
    }
  });

  it("creates a valid weight simulator and exposes every supported layout", () => {
    const simulator = createComponent("weight-simulator", "assessment-weighting");
    const result = validateDeck({
      id: "weight-simulator-catalog",
      version: 1,
      title: "Weight simulator catalog",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [{ id: "weighting", layout: "split", components: [simulator] }]
    });

    expect(simulator).toMatchObject({
      type: "weight-simulator",
      props: {
        dimensions: expect.arrayContaining([expect.objectContaining({ weight: expect.any(Number) })]),
        presets: expect.any(Array),
        disclaimer: expect.any(String)
      }
    });
    expect(isCompatible("split", "weight-simulator")).toBe(true);
    expect(isCompatible("dashboard", "weight-simulator")).toBe(true);
    expect(isCompatible("data", "weight-simulator")).toBe(true);
    expect(result).toMatchObject({ ok: true });
  });

  it("creates complete valid defaults for team showcases and semantic visualizers", () => {
    const team = createComponent("team-showcase", "project-team");
    const visualizer = createComponent("visualizer", "growth-visual");
    const result = validateDeck({
      id: "visual-component-catalog",
      version: 1,
      title: "Visual component catalog",
      locale: "vi-VN",
      themeId: "deckory-editorial",
      slides: [
        { id: "team", layout: "split", components: [team] },
        { id: "growth", layout: "process", components: [visualizer] }
      ]
    });

    expect(team).toMatchObject({
      type: "team-showcase",
      props: { variant: "editorial", members: expect.arrayContaining([expect.objectContaining({ id: expect.any(String), name: expect.any(String) })]) }
    });
    expect(visualizer).toMatchObject({
      type: "visualizer",
      props: { variant: "growth-tree", interaction: "inspect", items: expect.any(Array) }
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("exposes semantic visuals only on layouts with enough narrative space", () => {
    const cases: Array<[string, SlideComponent["type"], boolean]> = [
      ["split", "team-showcase", true],
      ["data", "team-showcase", true],
      ["closing", "team-showcase", true],
      ["cover", "team-showcase", true],
      ["statement", "visualizer", true],
      ["architecture", "visualizer", true],
      ["cover", "visualizer", false],
      ["comparison", "visualizer", false]
    ];

    for (const [layout, type, expected] of cases) {
      expect(isCompatible(layout as Parameters<typeof isCompatible>[0], type)).toBe(expected);
    }
  });

});
