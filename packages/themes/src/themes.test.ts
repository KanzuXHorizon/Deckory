import { describe, expect, it } from "vitest";
import {
  requiredVisualWorldIds,
  validateVisualWorld,
  visualWorlds
} from "./themes";
import type { VisualWorld } from "./types";

describe("visual worlds", () => {
  it("ships all twelve required visual worlds with complete token groups", () => {
    expect(requiredVisualWorldIds).toHaveLength(12);
    expect(visualWorlds.size).toBe(12);

    for (const id of requiredVisualWorldIds) {
      const world = visualWorlds.get(id);
      expect(world).toBeDefined();
      expect(world).toMatchObject({
        id,
        colors: expect.any(Object),
        typography: expect.any(Object),
        spacing: expect.any(Object),
        radii: expect.any(Object),
        depth: expect.any(Object),
        charts: expect.any(Object),
        diagrams: expect.any(Object),
        imagery: expect.any(Object),
        backgrounds: expect.any(Object),
        density: expect.any(Object),
        safeArea: expect.any(Object),
        motion: expect.any(Object)
      });
      expect(validateVisualWorld(world!)).toEqual([]);
    }
  });

  it("reports inaccessible chart highlight contrast", () => {
    const base = visualWorlds.get("deckory-editorial-control-room")!;
    const invalid: VisualWorld = {
      ...base,
      colors: { ...base.colors, canvas: "#ffffff" },
      charts: { ...base.charts, highlight: "#fefefe" }
    };

    expect(validateVisualWorld(invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "theme-contrast-insufficient", path: "charts.highlight" })
      ])
    );
  });

  it("keeps effect budgets professionally bounded", () => {
    for (const world of visualWorlds.values()) {
      expect(world.depth.shadow.blur).toBeLessThanOrEqual(48);
      expect(world.depth.glow.blur).toBeLessThanOrEqual(56);
      expect(world.depth.glow.opacity).toBeLessThanOrEqual(0.4);
      expect(world.imagery.effects.blur).toBeLessThanOrEqual(16);
    }
  });
});
