import type { SlideComponent } from "@deckory/schema";
import type { MotionState, MotionTiming } from "./motion-system";

type VisualizerProps = Extract<SlideComponent, { type: "visualizer" }>["props"];
export type VisualizerAnimation = NonNullable<VisualizerProps["animation"]>;
export type VisualizerMotionPart = "path" | "center" | "node" | "detail";

type SemanticMotionInput = {
  active: boolean;
  motionOff: boolean;
  hidden: MotionState;
  shown: MotionState;
  duration: number;
  delay?: number;
};

type VisualizerMotionOptions = {
  active: boolean;
  motionOff: boolean;
  index?: number;
  trunk?: boolean;
};

export type ResolvedSemanticMotion = {
  initial: false | MotionState;
  animate: MotionState;
  transition: MotionTiming;
};

const EMPHASIZED_EASE = [0.16, 1, 0.3, 1] as const;

export function resolveSemanticMotion({
  active,
  motionOff,
  hidden,
  shown,
  duration,
  delay = 0
}: SemanticMotionInput): ResolvedSemanticMotion {
  if (motionOff) {
    return {
      initial: false,
      animate: shown,
      transition: { duration: 0, delay: 0 }
    };
  }

  return {
    initial: hidden,
    animate: active ? shown : hidden,
    transition: {
      duration: active ? duration : Math.min(duration * 0.65, 0.2),
      delay: active ? delay : 0,
      ease: EMPHASIZED_EASE
    }
  };
}

export function getVisualizerMotion(
  animation: VisualizerAnimation,
  part: VisualizerMotionPart,
  { active, motionOff, index = 0, trunk = false }: VisualizerMotionOptions
): ResolvedSemanticMotion {
  const preset = visualizerPreset(animation, part, index, trunk);
  return resolveSemanticMotion({
    active,
    motionOff: motionOff || animation === "none",
    ...preset
  });
}

export function shouldPulseVisualizerNode(
  animation: VisualizerAnimation,
  active: boolean,
  motionOff: boolean,
  selected: boolean
): boolean {
  return animation === "pulse" && active && !motionOff && selected;
}

function visualizerPreset(
  animation: VisualizerAnimation,
  part: VisualizerMotionPart,
  index: number,
  trunk: boolean
): Omit<SemanticMotionInput, "active" | "motionOff"> {
  if (animation === "none") {
    return {
      hidden: shownState(part),
      shown: shownState(part),
      duration: 0,
      delay: 0
    };
  }

  if (part === "path") {
    if (animation === "grow") {
      return {
        hidden: { pathLength: 0, opacity: trunk ? 0.2 : 0 },
        shown: { pathLength: 1, opacity: 1 },
        duration: trunk ? 0.9 : 0.55,
        delay: trunk ? 0 : Math.min(index * 0.08 + 0.12, 0.6)
      };
    }
    if (animation === "draw") {
      return {
        hidden: { pathLength: 0, opacity: 0 },
        shown: { pathLength: 1, opacity: 1 },
        duration: trunk ? 0.72 : 0.5,
        delay: trunk ? 0 : Math.min(index * 0.06 + 0.08, 0.48)
      };
    }
    return {
      hidden: { pathLength: 1, opacity: 0 },
      shown: { pathLength: 1, opacity: 1 },
      duration: animation === "pulse" ? 0.18 : 0.28,
      delay: Math.min(index * 0.04, 0.24)
    };
  }

  if (part === "node") {
    if (animation === "grow") {
      return {
        hidden: { opacity: 0, filter: "blur(5px)" },
        shown: { opacity: 1, filter: "blur(0px)" },
        duration: 0.4,
        delay: Math.min(index * 0.08 + 0.18, 0.72)
      };
    }
    if (animation === "draw") {
      return {
        hidden: { opacity: 0 },
        shown: { opacity: 1 },
        duration: 0.24,
        delay: Math.min(index * 0.05 + 0.4, 0.72)
      };
    }
    if (animation === "orbit") {
      return {
        hidden: { opacity: 0, filter: "blur(3px)" },
        shown: { opacity: 1, filter: "blur(0px)" },
        duration: 0.32,
        delay: Math.min(index * 0.06 + 0.12, 0.54)
      };
    }
    return {
      hidden: { opacity: 0 },
      shown: { opacity: 1 },
      duration: 0.18,
      delay: Math.min(index * 0.025 + 0.06, 0.22)
    };
  }

  if (part === "center") {
    return {
      hidden: animation === "grow" || animation === "orbit"
        ? { opacity: 0, filter: "blur(5px)" }
        : { opacity: 0 },
      shown: animation === "grow" || animation === "orbit"
        ? { opacity: 1, filter: "blur(0px)" }
        : { opacity: 1 },
      duration: animation === "pulse" ? 0.18 : 0.3,
      delay: animation === "draw" ? 0.1 : 0
    };
  }

  return {
    hidden: animation === "draw"
      ? { opacity: 0, clipPath: "inset(0 0 0 12%)" }
      : { opacity: 0, x: 12, filter: "blur(4px)" },
    shown: animation === "draw"
      ? { opacity: 1, clipPath: "inset(0 0 0 0%)" }
      : { opacity: 1, x: 0, filter: "blur(0px)" },
    duration: animation === "pulse" ? 0.22 : 0.3,
    delay: animation === "draw" ? 0.28 : 0.12
  };
}

function shownState(part: VisualizerMotionPart): MotionState {
  if (part === "path") return { pathLength: 1, opacity: 1 };
  if (part === "detail") return { opacity: 1, x: 0, filter: "blur(0px)", clipPath: "inset(0 0 0 0%)" };
  return { opacity: 1, filter: "blur(0px)" };
}
