import { describe, expect, it } from "vitest";
import { resolveElementTokens, resolveThemeTokens } from "./resolve";
import { visualWorlds } from "./themes";

describe("theme token resolution", () => {
  it("resolves deck, slide and element overrides in deterministic order without mutation", () => {
    const world = visualWorlds.get("swiss-precision")!;
    const deck = { colors: { accent: "#0057ff" }, spacing: { section: 72 } };
    const slide = { colors: { accent: "$colors.positive" }, density: { content: "compact" as const } };
    const element = { colors: { foreground: "$colors.accent" }, radii: { medium: 10 } };
    const snapshot = structuredClone({ world, deck, slide, element });

    const first = resolveThemeTokens(world, deck, slide);
    const second = resolveThemeTokens(world, deck, slide);
    const resolvedElement = resolveElementTokens(first.tokens, element);

    expect(first).toEqual(second);
    expect(first.tokens.colors.accent).toBe(first.tokens.colors.positive);
    expect(resolvedElement.tokens.colors.foreground).toBe(first.tokens.colors.accent);
    expect(resolvedElement.tokens.radii.medium).toBe(10);
    expect({ world, deck, slide, element }).toEqual(snapshot);
  });

  it("returns an actionable diagnostic for unknown semantic token references", () => {
    const world = visualWorlds.get("academic-defense")!;
    const result = resolveThemeTokens(world, {
      colors: { accent: "$colors.not-a-token" }
    });

    expect(result.tokens.colors.accent).toBe(world.colors.accent);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "theme-token-unknown",
        path: "colors.accent",
        reference: "$colors.not-a-token"
      })
    ]);
  });

  it("rejects unbounded literal effect overrides", () => {
    const world = visualWorlds.get("cinematic-dark")!;
    const result = resolveThemeTokens(world, {
      depth: { glow: { blur: 400, opacity: 0.9 } }
    });

    expect(result.tokens.depth.glow).toEqual(world.depth.glow);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain("theme-value-out-of-bounds");
  });

  it("preserves a valid deck override when a later slide override is invalid", () => {
    const world = visualWorlds.get("deckory-editorial-control-room")!;
    const result = resolveThemeTokens(
      world,
      { depth: { glow: { blur: 24 } } },
      { depth: { glow: { blur: 400 } } }
    );

    expect(result.tokens.depth.glow.blur).toBe(24);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: "theme-value-out-of-bounds",
      path: "depth.glow.blur"
    }));
  });

  it("rejects semantic references whose resolved type does not match the target token", () => {
    const world = visualWorlds.get("data-journalism")!;
    const result = resolveThemeTokens(world, {
      colors: { accent: "$charts.categorical" }
    });

    expect(result.tokens.colors.accent).toBe(world.colors.accent);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: "theme-value-invalid",
      path: "colors.accent",
      reference: "$charts.categorical"
    }));
  });

  it("allows a typed optional imagery duotone override", () => {
    const world = visualWorlds.get("product-showcase")!;
    const result = resolveThemeTokens(world, {
      imagery: { duotone: ["#121826", "#2855e8"] }
    });

    expect(result.tokens.imagery.duotone).toEqual(["#121826", "#2855e8"]);
    expect(result.diagnostics).toEqual([]);
  });

  it("resolves same-layer references independently of object key order", () => {
    const world = visualWorlds.get("academic-defense")!;
    const referenceFirst = resolveThemeTokens(world, {
      colors: { accent: "$charts.highlight" },
      charts: { highlight: "#0057ff" }
    });
    const literalFirst = resolveThemeTokens(world, {
      charts: { highlight: "#0057ff" },
      colors: { accent: "$charts.highlight" }
    });

    expect(referenceFirst.tokens.colors.accent).toBe("#0057ff");
    expect(referenceFirst).toEqual(literalFirst);
  });

  it("resolves chained semantic references without depending on key order", () => {
    const world = visualWorlds.get("academic-defense")!;
    const result = resolveThemeTokens(world, {
      colors: {
        accent: "$colors.accentSecondary",
        accentSecondary: "$colors.positive",
        positive: "#176b45"
      }
    });

    expect(result.tokens.colors.accent).toBe("#176b45");
    expect(result.tokens.colors.accentSecondary).toBe("#176b45");
  });

  it("reports contrast diagnostics introduced by resolved overrides", () => {
    const world = visualWorlds.get("swiss-precision")!;
    const result = resolveThemeTokens(world, {
      colors: { foreground: "#ffffff", canvas: "#ffffff" }
    });

    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: "theme-contrast-insufficient",
      path: "colors.foreground"
    }));
  });

  it("rejects semantic reference cycles without changing prior-layer values", () => {
    const world = visualWorlds.get("academic-defense")!;
    const result = resolveThemeTokens(world, {
      colors: {
        accent: "$colors.accentSecondary",
        accentSecondary: "$colors.accent"
      }
    });

    expect(result.tokens.colors.accent).toBe(world.colors.accent);
    expect(result.tokens.colors.accentSecondary).toBe(world.colors.accentSecondary);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "theme-reference-cycle", path: "colors.accent" }),
      expect.objectContaining({ code: "theme-reference-cycle", path: "colors.accentSecondary" })
    ]));
  });
});
