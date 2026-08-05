import { describe, expect, it } from "vitest";
import {
  getVisualizerMotion,
  resolveSemanticMotion,
  shouldPulseVisualizerNode
} from "./semantic-motion";

describe("semantic motion", () => {
  it("waits for the outer reveal before starting internal animation", () => {
    const inactive = resolveSemanticMotion({
      active: false,
      motionOff: false,
      hidden: { opacity: 0, y: 12 },
      shown: { opacity: 1, y: 0 },
      duration: 0.4,
      delay: 0.2
    });
    const active = resolveSemanticMotion({
      active: true,
      motionOff: false,
      hidden: { opacity: 0, y: 12 },
      shown: { opacity: 1, y: 0 },
      duration: 0.4,
      delay: 0.2
    });

    expect(inactive.animate).toEqual({ opacity: 0, y: 12 });
    expect(inactive.transition.delay).toBe(0);
    expect(inactive.transition.duration).toBeLessThan(active.transition.duration);
    expect(active.animate).toEqual({ opacity: 1, y: 0 });
    expect(active.transition).toMatchObject({ duration: 0.4, delay: 0.2 });
  });

  it("uses an immediate complete state when motion is disabled", () => {
    const motion = resolveSemanticMotion({
      active: false,
      motionOff: true,
      hidden: { opacity: 0, filter: "blur(5px)" },
      shown: { opacity: 1, filter: "blur(0px)" },
      duration: 0.5,
      delay: 0.4
    });

    expect(motion.initial).toBe(false);
    expect(motion.animate).toEqual({ opacity: 1, filter: "blur(0px)" });
    expect(motion.transition).toMatchObject({ duration: 0, delay: 0 });
  });

  it("gives grow, draw, orbit, pulse, and none distinct professional behavior", () => {
    const growPath = getVisualizerMotion("grow", "path", { active: true, motionOff: false, index: 0, trunk: true });
    const drawNode = getVisualizerMotion("draw", "node", { active: true, motionOff: false, index: 2 });
    const orbitPath = getVisualizerMotion("orbit", "path", { active: false, motionOff: false, index: 0 });
    const pulseNode = getVisualizerMotion("pulse", "node", { active: true, motionOff: false, index: 1 });
    const noneNode = getVisualizerMotion("none", "node", { active: false, motionOff: false, index: 1 });

    expect(growPath.initial).toMatchObject({ pathLength: 0, opacity: 0.2 });
    expect(drawNode.transition.delay).toBeGreaterThan(0.35);
    expect(orbitPath.animate).toMatchObject({ pathLength: 1, opacity: 0 });
    expect(pulseNode.transition.duration).toBeLessThan(drawNode.transition.duration);
    expect(noneNode.initial).toBe(false);
    expect(noneNode.animate).toMatchObject({ opacity: 1 });
    expect(noneNode.transition).toMatchObject({ duration: 0, delay: 0 });
  });

  it("only pulses the selected node while the visualizer is active", () => {
    expect(shouldPulseVisualizerNode("pulse", true, false, true)).toBe(true);
    expect(shouldPulseVisualizerNode("pulse", false, false, true)).toBe(false);
    expect(shouldPulseVisualizerNode("pulse", true, true, true)).toBe(false);
    expect(shouldPulseVisualizerNode("grow", true, false, true)).toBe(false);
    expect(shouldPulseVisualizerNode("pulse", true, false, false)).toBe(false);
  });
});
