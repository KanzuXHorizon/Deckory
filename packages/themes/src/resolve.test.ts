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
});
