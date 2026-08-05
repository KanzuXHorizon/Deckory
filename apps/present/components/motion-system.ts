import type { ElementEffect, MotionEasing, SlideTransition } from "@deckory/schema";

export type NavigationDirection = -1 | 1;
export type MotionState = Record<string, string | number>;
export type MotionEase = "linear" | readonly [number, number, number, number];
export type MotionTiming = {
  duration: number;
  delay?: number;
  ease?: MotionEase;
};

export type SlideMotion = {
  initial: MotionState;
  animate: MotionState;
  exit: MotionState;
  transition: MotionTiming;
};

export type ElementMotion = {
  animate: MotionState;
  transition: MotionTiming;
};

const EASINGS: Record<MotionEasing, MotionEase> = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
  linear: "linear"
};

export function getSlideMotion(
  transition: SlideTransition | undefined,
  direction: NavigationDirection,
  reducedMotion: boolean
): SlideMotion {
  if (reducedMotion) return staticSlideMotion();

  const type = transition?.type ?? "fade";
  const timing: MotionTiming = {
    duration: type === "none" ? 0 : transition?.duration ?? defaultSlideDuration(type),
    ease: EASINGS[transition?.easing ?? "emphasized"]
  };

  switch (type) {
    case "none":
      return staticSlideMotion();
    case "fade":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: timing
      };
    case "slide":
      return {
        initial: { opacity: 0, x: 56 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -32 * direction },
        transition: timing
      };
    case "push":
      return {
        initial: { opacity: 1, x: `${100 * direction}%` },
        animate: { opacity: 1, x: "0%" },
        exit: { opacity: 1, x: `${-28 * direction}%` },
        transition: timing
      };
    case "wipe":
      return {
        initial: {
          opacity: 0.92,
          clipPath: direction === 1 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)"
        },
        animate: { opacity: 1, clipPath: "inset(0 0 0 0)" },
        exit: {
          opacity: 0.72,
          clipPath: direction === 1 ? "inset(0 0 0 12%)" : "inset(0 12% 0 0)"
        },
        transition: timing
      };
    case "zoom":
      return {
        initial: { opacity: 0, scale: 0.965 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.018 },
        transition: timing
      };
    case "morph":
      return {
        initial: { opacity: 0, scale: 0.985 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.012 },
        transition: timing
      };
  }
}

export function getElementMotion(
  effect: ElementEffect | undefined,
  visible: boolean,
  reducedMotion: boolean
): ElementMotion {
  if (reducedMotion) {
    return {
      animate: { opacity: visible ? 1 : 0 },
      transition: { duration: 0, delay: 0 }
    };
  }

  const type = effect?.type ?? "rise";
  const shown = elementState(type, true);
  const hidden = elementState(type, false);
  const entranceDuration = type === "none" ? 0 : effect?.duration ?? defaultElementDuration(type);
  const exitDuration = type === "none" ? 0 : Math.min(entranceDuration * 0.65, 0.2);

  return {
    animate: visible ? shown : hidden,
    transition: {
      duration: visible ? entranceDuration : exitDuration,
      delay: type === "none" ? 0 : visible ? effect?.delay ?? 0 : 0,
      ease: EASINGS[effect?.easing ?? "standard"]
    }
  };
}

export function getMorphLayoutId(deckId: string | undefined, morphId: string | undefined) {
  return deckId && morphId ? `${deckId}--${morphId}` : undefined;
}

function staticSlideMotion(): SlideMotion {
  return {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 }
  };
}

function defaultSlideDuration(type: SlideTransition["type"]): number {
  switch (type) {
    case "none": return 0;
    case "fade": return 0.28;
    case "slide": return 0.38;
    case "push": return 0.46;
    case "wipe": return 0.48;
    case "zoom": return 0.42;
    case "morph": return 0.52;
  }
}

function defaultElementDuration(type: ElementEffect["type"]): number {
  switch (type) {
    case "none": return 0;
    case "fade": return 0.22;
    case "rise": return 0.3;
    case "scale": return 0.3;
    case "wipe": return 0.38;
    case "blur": return 0.34;
    case "pop": return 0.32;
  }
}

function elementState(type: ElementEffect["type"], visible: boolean): MotionState {
  switch (type) {
    case "none":
    case "fade":
      return { opacity: visible ? 1 : 0 };
    case "rise":
      return { opacity: visible ? 1 : 0, y: visible ? 0 : 12 };
    case "scale":
      return { opacity: visible ? 1 : 0, scale: visible ? 1 : 0.96 };
    case "wipe":
      return {
        opacity: visible ? 1 : 0.92,
        clipPath: visible ? "inset(0 0 0 0)" : "inset(0 0 100% 0)"
      };
    case "blur":
      return { opacity: visible ? 1 : 0, filter: visible ? "blur(0px)" : "blur(6px)" };
    case "pop":
      return {
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.9,
        y: visible ? 0 : 4
      };
  }
}
