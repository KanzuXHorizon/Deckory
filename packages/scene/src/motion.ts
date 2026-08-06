export type MotionCueType =
  | "entrance"
  | "emphasis"
  | "exit"
  | "path"
  | "stagger"
  | "morph"
  | "chart-progress"
  | "connector-progress"
  | "camera";

export type MotionTrigger = "on-enter" | "on-click" | "after-previous" | "with-previous";
export type MotionEasing = "standard" | "emphasized" | "linear";

export type MotionProperty =
  | "opacity"
  | "translateX"
  | "translateY"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "rotation"
  | "blur"
  | "progress"
  | "pathOffset"
  | "cameraX"
  | "cameraY"
  | "cameraZoom";

export type MotionState = Partial<Record<MotionProperty, number>>;

export type MotionCue = {
  id: string;
  type: MotionCueType;
  trigger: MotionTrigger;
  duration: number;
  delay?: number;
  easing: MotionEasing;
  from: MotionState;
  to: MotionState;
  sourceOrder?: number;
  clickStep?: number;
  pathId?: string;
  groupId?: string;
};

export type MotionTrack = {
  id: string;
  elementId: string;
  cues: MotionCue[];
  finalState: MotionState;
};

export type MotionDiagnosticCode =
  | "motion-cue-id-duplicate"
  | "motion-exit-before-entrance"
  | "motion-final-state-missing"
  | "motion-duration-invalid"
  | "motion-value-invalid"
  | "motion-path-id-missing"
  | "motion-group-id-missing"
  | "motion-click-step-invalid"
  | "motion-source-order-invalid";

export type MotionDiagnostic = {
  code: MotionDiagnosticCode;
  trackId: string;
  cueId?: string;
  property?: MotionProperty;
  message: string;
};

export type OrderedMotionCue = MotionCue & {
  sourceOrder: number;
};

const triggerRank: Readonly<Record<MotionTrigger, number>> = {
  "on-enter": 0,
  "with-previous": 1,
  "after-previous": 2,
  "on-click": 3
};

export function orderMotionCues(cues: readonly MotionCue[]): OrderedMotionCue[] {
  return cues
    .map((cue, index) => ({ ...cue, sourceOrder: cue.sourceOrder ?? index }))
    .sort((left, right) => {
      const order = left.sourceOrder - right.sourceOrder;
      if (order !== 0) return order;
      const trigger = triggerRank[left.trigger] - triggerRank[right.trigger];
      if (trigger !== 0) return trigger;
      return left.id.localeCompare(right.id);
    });
}

function animatedProperties(track: MotionTrack): Set<MotionProperty> {
  const properties = new Set<MotionProperty>();
  for (const cue of track.cues) {
    for (const property of Object.keys(cue.from) as MotionProperty[]) properties.add(property);
    for (const property of Object.keys(cue.to) as MotionProperty[]) properties.add(property);
  }
  return properties;
}

export function validateMotionTrack(track: MotionTrack): MotionDiagnostic[] {
  const diagnostics: MotionDiagnostic[] = [];
  const cueIds = new Set<string>();
  let entranceSeen = false;

  for (const cue of orderMotionCues(track.cues)) {
    if (cueIds.has(cue.id)) {
      diagnostics.push({
        code: "motion-cue-id-duplicate",
        trackId: track.id,
        cueId: cue.id,
        message: `Duplicate motion cue ID: ${cue.id}`
      });
    }
    cueIds.add(cue.id);

    if (!Number.isFinite(cue.duration) || cue.duration < 0 || cue.duration > 30 ||
        (cue.delay !== undefined && (!Number.isFinite(cue.delay) || cue.delay < 0 || cue.delay > 30))) {
      diagnostics.push({
        code: "motion-duration-invalid",
        trackId: track.id,
        cueId: cue.id,
        message: `Motion cue ${cue.id} must use duration and delay values between 0 and 30 seconds.`
      });
    }
    if (cue.sourceOrder !== undefined &&
        (!Number.isFinite(cue.sourceOrder) || !Number.isInteger(cue.sourceOrder) || cue.sourceOrder < 0)) {
      diagnostics.push({
        code: "motion-source-order-invalid",
        trackId: track.id,
        cueId: cue.id,
        message: `Motion cue ${cue.id} must use a finite non-negative integer sourceOrder.`
      });
    }
    if (cue.type === "path" && !cue.pathId?.trim()) {
      diagnostics.push({
        code: "motion-path-id-missing",
        trackId: track.id,
        cueId: cue.id,
        message: `Path cue ${cue.id} requires a pathId.`
      });
    }
    if (cue.type === "stagger" && !cue.groupId?.trim()) {
      diagnostics.push({
        code: "motion-group-id-missing",
        trackId: track.id,
        cueId: cue.id,
        message: `Stagger cue ${cue.id} requires a groupId.`
      });
    }
    if (cue.trigger === "on-click" &&
        (cue.clickStep === undefined || !Number.isInteger(cue.clickStep) || cue.clickStep < 1)) {
      diagnostics.push({
        code: "motion-click-step-invalid",
        trackId: track.id,
        cueId: cue.id,
        message: `On-click cue ${cue.id} requires a positive integer clickStep.`
      });
    }

    for (const [property, value] of [...Object.entries(cue.from), ...Object.entries(cue.to)] as [MotionProperty, number][]) {
      if (!Number.isFinite(value)) {
        diagnostics.push({
          code: "motion-value-invalid",
          trackId: track.id,
          cueId: cue.id,
          property,
          message: `Motion property ${property} in cue ${cue.id} must be finite.`
        });
      }
    }

    if (cue.type === "exit" && !entranceSeen) {
      diagnostics.push({
        code: "motion-exit-before-entrance",
        trackId: track.id,
        cueId: cue.id,
        message: `Exit cue ${cue.id} appears before an entrance cue for ${track.elementId}.`
      });
    }
    if (cue.type === "entrance") entranceSeen = true;
  }

  for (const property of animatedProperties(track)) {
    if (track.finalState[property] === undefined) {
      diagnostics.push({
        code: "motion-final-state-missing",
        trackId: track.id,
        property,
        message: `Final state for animated property ${property} is required.`
      });
    } else if (!Number.isFinite(track.finalState[property])) {
      diagnostics.push({
        code: "motion-value-invalid",
        trackId: track.id,
        property,
        message: `Final state for ${property} must be finite.`
      });
    }
  }

  return diagnostics;
}

export type SemanticMotionPresetId =
  | "reveal-argument"
  | "compare-states"
  | "trace-process"
  | "spotlight-evidence"
  | "overview-to-detail"
  | "problem-to-solution-morph"
  | "chart-and-conclusion"
  | "architecture-walkthrough";

export type SemanticMotionPreset = {
  id: SemanticMotionPresetId;
  label: string;
  purpose: string;
  cues: readonly {
    role: string;
    type: MotionCueType;
    trigger: MotionTrigger;
    duration: number;
    easing: MotionEasing;
  }[];
  finalStatePolicy: "complete";
  reducedMotionPolicy: "remove-travel-and-blur" | "final-state-only";
};

export const semanticMotionPresets: Readonly<Record<SemanticMotionPresetId, SemanticMotionPreset>> = {
  "reveal-argument": {
    id: "reveal-argument",
    label: "Reveal argument",
    purpose: "Reveal claim, evidence and decision in speaking order.",
    cues: [
      { role: "claim", type: "entrance", trigger: "on-enter", duration: 0.38, easing: "emphasized" },
      { role: "evidence", type: "entrance", trigger: "after-previous", duration: 0.34, easing: "standard" },
      { role: "decision", type: "emphasis", trigger: "after-previous", duration: 0.28, easing: "emphasized" }
    ],
    finalStatePolicy: "complete",
    reducedMotionPolicy: "remove-travel-and-blur"
  },
  "compare-states": {
    id: "compare-states",
    label: "Compare states",
    purpose: "Introduce both states together, then emphasize the meaningful difference.",
    cues: [
      { role: "before", type: "entrance", trigger: "on-enter", duration: 0.32, easing: "standard" },
      { role: "after", type: "entrance", trigger: "with-previous", duration: 0.32, easing: "standard" },
      { role: "difference", type: "emphasis", trigger: "after-previous", duration: 0.3, easing: "emphasized" }
    ],
    finalStatePolicy: "complete",
    reducedMotionPolicy: "final-state-only"
  },
  "trace-process": {
    id: "trace-process",
    label: "Trace process",
    purpose: "Trace ordered process nodes and connectors without decorative looping.",
    cues: [
      { role: "first-node", type: "entrance", trigger: "on-enter", duration: 0.28, easing: "standard" },
      { role: "connector", type: "connector-progress", trigger: "after-previous", duration: 0.36, easing: "linear" },
      { role: "next-node", type: "entrance", trigger: "after-previous", duration: 0.28, easing: "standard" }
    ],
    finalStatePolicy: "complete",
    reducedMotionPolicy: "final-state-only"
  },
  "spotlight-evidence": {
    id: "spotlight-evidence",
    label: "Spotlight evidence",
    purpose: "Keep the claim stable while emphasizing one evidence region.",
    cues: [
      { role: "evidence", type: "emphasis", trigger: "on-click", duration: 0.3, easing: "emphasized" }
    ],
    finalStatePolicy: "complete",
    reducedMotionPolicy: "final-state-only"
  },
  "overview-to-detail": {
    id: "overview-to-detail",
    label: "Overview to detail",
    purpose: "Move from a complete overview to one inspectable detail.",
    cues: [
      { role: "overview", type: "entrance", trigger: "on-enter", duration: 0.36, easing: "standard" },
      { role: "camera", type: "camera", trigger: "on-click", duration: 0.62, easing: "emphasized" }
    ],
    finalStatePolicy: "complete",
    reducedMotionPolicy: "final-state-only"
  },
  "problem-to-solution-morph": {
    id: "problem-to-solution-morph",
    label: "Problem to solution morph",
    purpose: "Morph shared geometry only when object identity is preserved.",
    cues: [
      { role: "problem", type: "entrance", trigger: "on-enter", duration: 0.3, easing: "standard" },
      { role: "shared-element", type: "morph", trigger: "on-click", duration: 0.58, easing: "emphasized" }
    ],
    finalStatePolicy: "complete",
    reducedMotionPolicy: "final-state-only"
  },
  "chart-and-conclusion": {
    id: "chart-and-conclusion",
    label: "Chart and conclusion",
    purpose: "Draw truthful chart progress, then reveal its conclusion.",
    cues: [
      { role: "chart", type: "chart-progress", trigger: "on-enter", duration: 0.7, easing: "emphasized" },
      { role: "conclusion", type: "entrance", trigger: "after-previous", duration: 0.28, easing: "standard" }
    ],
    finalStatePolicy: "complete",
    reducedMotionPolicy: "final-state-only"
  },
  "architecture-walkthrough": {
    id: "architecture-walkthrough",
    label: "Architecture walkthrough",
    purpose: "Reveal architecture layers and connector paths in dependency order.",
    cues: [
      { role: "context", type: "entrance", trigger: "on-enter", duration: 0.28, easing: "standard" },
      { role: "connector", type: "connector-progress", trigger: "after-previous", duration: 0.34, easing: "linear" },
      { role: "component", type: "entrance", trigger: "after-previous", duration: 0.28, easing: "standard" }
    ],
    finalStatePolicy: "complete",
    reducedMotionPolicy: "final-state-only"
  }
};
