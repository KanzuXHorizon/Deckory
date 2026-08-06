import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BackgroundRenderer } from "./background-renderer";

describe("BackgroundRenderer", () => {
  it("renders layers in stable document order with deterministic grain", () => {
    const stack = {
      layers: [
        { id: "paper", type: "solid" as const, color: "#f4f0e8", opacity: 1 },
        { id: "mesh", type: "mesh-gradient" as const, colors: ["#5147e8", "#0f8b8d"], opacity: 0.35, seed: 7 },
        { id: "grain", type: "noise" as const, opacity: 0.06, seed: 42, scale: 1.2 }
      ]
    };

    const first = renderToStaticMarkup(<BackgroundRenderer stack={stack} assets={[]} />);
    const second = renderToStaticMarkup(<BackgroundRenderer stack={stack} assets={[]} />);

    expect(first).toBe(second);
    expect(first.indexOf('data-background-layer="paper"')).toBeLessThan(first.indexOf('data-background-layer="mesh"'));
    expect(first.indexOf('data-background-layer="mesh"')).toBeLessThan(first.indexOf('data-background-layer="grain"'));
    expect(first).toContain("deckory-noise-grain-");
  });

  it("returns an explicit diagnostic for missing or remote assets", () => {
    const missing = renderToStaticMarkup(<BackgroundRenderer
      stack={{ layers: [{ id: "hero", type: "image", assetId: "hero-image", opacity: 1 }] }}
      assets={[]}
    />);
    const remote = renderToStaticMarkup(<BackgroundRenderer
      stack={{ layers: [{ id: "hero", type: "image", assetId: "hero-image", opacity: 1 }] }}
      assets={[{ id: "hero-image", type: "image", src: "https://example.com/hero.png", mediaType: "image/png" }]}
    />);

    expect(missing).toContain('data-background-error="asset-missing"');
    expect(remote).toContain('data-background-error="remote-asset-rejected"');
  });

  it("does not render an unbounded blur or glow", () => {
    const html = renderToStaticMarkup(<BackgroundRenderer
      stack={{ layers: [{ id: "unsafe-glow", type: "glow", color: "#5147e8", opacity: 0.8, blur: 200 }] }}
      assets={[]}
    />);

    expect(html).toContain('data-background-error="effect-budget-exceeded"');
    expect(html).not.toContain("blur(200px)");
  });
});
