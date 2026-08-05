import { describe, expect, it } from "vitest";
import {
  getElementMotion,
  getMorphLayoutId,
  getSlideMotion
} from "./motion-system";

describe("slide motion registry", () => {
  it("moves slide transitions in the navigation direction", () => {
    const forward = getSlideMotion({ type: "slide" }, 1, false);
    const backward = getSlideMotion({ type: "slide" }, -1, false);

    expect(forward.initial).toMatchObject({ opacity: 0, x: 56 });
    expect(forward.exit).toMatchObject({ opacity: 0, x: -32 });
    expect(backward.initial).toMatchObject({ opacity: 0, x: -56 });
    expect(backward.exit).toMatchObject({ opacity: 0, x: 32 });
  });

  it("coordinates push, wipe, zoom, and none presets", () => {
    expect(getSlideMotion({ type: "push" }, 1, false)).toMatchObject({
      initial: { opacity: 1, x: "100%" },
      animate: { opacity: 1, x: "0%" },
      exit: { opacity: 1, x: "-28%" }
    });
    expect(getSlideMotion({ type: "wipe" }, 1, false).initial).toMatchObject({
      opacity: 0.92,
      clipPath: "inset(0 100% 0 0)"
    });
    expect(getSlideMotion({ type: "zoom" }, 1, false).initial).toMatchObject({
      opacity: 0,
      scale: 0.965
    });
    expect(getSlideMotion({ type: "none" }, 1, false).transition).toMatchObject({ duration: 0 });
  });

  it("keeps every transition preset distinct and composited", () => {
    const types = ["none", "fade", "slide", "push", "wipe", "zoom", "morph"] as const;
    const motions = types.map((type) => getSlideMotion({ type }, 1, false));
    const signatures = motions.map((motion) => JSON.stringify(motion));
    const layoutProperties = new Set(["width", "height", "top", "right", "bottom", "left", "margin", "padding"]);

    expect(new Set(signatures).size).toBe(types.length);
    for (const motion of motions) {
      expect(motion.transition.duration).toBeGreaterThanOrEqual(0);
      expect(motion.transition.duration).toBeLessThanOrEqual(0.8);
      for (const state of [motion.initial, motion.animate, motion.exit]) {
        expect(Object.keys(state).some((property) => layoutProperties.has(property))).toBe(false);
      }
    }
  });

  it("removes spatial, blur, wipe, and morph movement for reduced motion", () => {
    const slide = getSlideMotion({ type: "morph", duration: 0.9 }, 1, true);
    const element = getElementMotion({ type: "blur", delay: 0.4 }, true, true);

    expect(slide).toMatchObject({
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0 }
    });
    expect(element).toMatchObject({
      animate: { opacity: 1 },
      transition: { duration: 0, delay: 0 }
    });
  });
});

describe("element motion registry", () => {
  it("uses rise as the default reveal and hides unrevealed elements safely", () => {
    expect(getElementMotion(undefined, false, false)).toMatchObject({
      animate: { opacity: 0, y: 12 },
      transition: { duration: 0.195 }
    });
    expect(getElementMotion({ type: "rise", duration: 0.44, delay: 0.2 }, true, false)).toMatchObject({
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.44, delay: 0.2 }
    });
  });

  it("uses a faster interruption-safe exit without carrying the entrance delay", () => {
    const entrance = getElementMotion({ type: "blur", duration: 0.6, delay: 0.3 }, true, false);
    const exit = getElementMotion({ type: "blur", duration: 0.6, delay: 0.3 }, false, false);

    expect(exit.transition.delay).toBe(0);
    expect(exit.transition.duration).toBeLessThan(entrance.transition.duration);
    expect(exit.transition.duration).toBe(0.2);
  });

  it("shows the none preset immediately even when stale timing metadata exists", () => {
    expect(getElementMotion({ type: "none", duration: 1.2, delay: 1.5 }, true, false)).toMatchObject({
      animate: { opacity: 1 },
      transition: { duration: 0, delay: 0 }
    });
  });

  it("keeps every element preset distinct and within the interaction budget", () => {
    const types = ["none", "fade", "rise", "scale", "wipe", "blur", "pop"] as const;
    const motions = types.map((type) => getElementMotion({ type }, true, false));
    const signatures = motions.map((motion) => JSON.stringify(motion));
    const layoutProperties = new Set(["width", "height", "top", "right", "bottom", "left", "margin", "padding"]);

    expect(new Set(signatures).size).toBe(types.length);
    for (const motion of motions) {
      expect(motion.transition.duration).toBeGreaterThanOrEqual(0);
      expect(motion.transition.duration).toBeLessThanOrEqual(0.5);
      expect(Object.keys(motion.animate).some((property) => layoutProperties.has(property))).toBe(false);
    }
  });

  it("namespaces shared-element IDs by deck", () => {
    expect(getMorphLayoutId("deckory-story", "story-title")).toBe("deckory-story--story-title");
    expect(getMorphLayoutId("deckory-story", undefined)).toBeUndefined();
  });
});
