export type CompilerMotionProperty =
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

export type CompilerMotionState = Partial<Record<CompilerMotionProperty, number>>;
export type CompilerMotionTrigger = "on-enter" | "on-click" | "after-previous" | "with-previous";
export type CompilerMotionCueType = "entrance" | "emphasis" | "exit" | "path" | "stagger" | "morph" | "chart-progress" | "connector-progress" | "camera";

export type CompilerMotionCue = {
  id: string;
  type: CompilerMotionCueType;
  trigger: CompilerMotionTrigger;
  duration: number;
  delay?: number;
  easing: "standard" | "emphasized" | "linear";
  from: CompilerMotionState;
  to: CompilerMotionState;
  sourceOrder?: number;
  clickStep?: number;
  pathId?: string;
  groupId?: string;
};

export type CompilerMotionTrack = {
  id: string;
  elementId: string;
  cues: CompilerMotionCue[];
  finalState: CompilerMotionState;
};

export type CompiledMotionCue = CompilerMotionCue & {
  trackId: string;
  elementId: string;
  sourceOrder: number;
  start: number;
  end: number;
};

export type MotionCompilerDiagnostic = {
  code:
    | "motion-final-state-missing"
    | "motion-duration-invalid"
    | "motion-value-invalid"
    | "motion-path-id-missing"
    | "motion-group-id-missing"
    | "motion-click-step-invalid"
    | "motion-source-order-invalid";
  trackId: string;
  cueId?: string;
  property?: CompilerMotionProperty;
  message: string;
};

export type CompiledMotionTimeline = {
  cues: readonly CompiledMotionCue[];
  duration: number;
  finalStateByElement: Readonly<Record<string, CompilerMotionState>>;
  diagnostics: readonly MotionCompilerDiagnostic[];
};

export type MotionResolveMode = "live" | "reduced" | "thumbnail" | "export" | "final";

function cloneState(state: CompilerMotionState): CompilerMotionState {
  return { ...state };
}

function validateTrack(track: CompilerMotionTrack): MotionCompilerDiagnostic[] {
  const diagnostics: MotionCompilerDiagnostic[] = [];
  const properties = new Set<CompilerMotionProperty>();
  for (const cue of track.cues) {
    if (!Number.isFinite(cue.duration) || cue.duration < 0 || cue.duration > 30 ||
        (cue.delay !== undefined && (!Number.isFinite(cue.delay) || cue.delay < 0 || cue.delay > 30))) {
      diagnostics.push({
        code: "motion-duration-invalid",
        trackId: track.id,
        cueId: cue.id,
        message: `Cue ${cue.id} must use duration and delay between 0 and 30 seconds.`
      });
    }
    if (cue.sourceOrder !== undefined &&
        (!Number.isFinite(cue.sourceOrder) || !Number.isInteger(cue.sourceOrder) || cue.sourceOrder < 0)) {
      diagnostics.push({
        code: "motion-source-order-invalid",
        trackId: track.id,
        cueId: cue.id,
        message: `Cue ${cue.id} must use a finite non-negative integer sourceOrder.`
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
    for (const [property, value] of [...Object.entries(cue.from), ...Object.entries(cue.to)] as [CompilerMotionProperty, number][]) {
      properties.add(property);
      if (!Number.isFinite(value)) {
        diagnostics.push({
          code: "motion-value-invalid",
          trackId: track.id,
          cueId: cue.id,
          property,
          message: `Cue ${cue.id} uses a non-finite value for ${property}.`
        });
      }
    }
  }
  for (const property of properties) {
    const value = track.finalState[property];
    if (value === undefined) {
      diagnostics.push({
        code: "motion-final-state-missing",
        trackId: track.id,
        property,
        message: `Track ${track.id} requires a final value for ${property}.`
      });
    } else if (!Number.isFinite(value)) {
      diagnostics.push({
        code: "motion-value-invalid",
        trackId: track.id,
        property,
        message: `Track ${track.id} uses a non-finite final value for ${property}.`
      });
    }
  }
  return diagnostics;
}

export function compileMotionTimeline(tracks: readonly CompilerMotionTrack[]): CompiledMotionTimeline {
  const diagnostics = tracks.flatMap(validateTrack);
  const flattened = tracks.flatMap((track, trackOrder) =>
    track.cues.map((cue, cueOrder) => ({
      cue,
      track,
      trackOrder,
      sourceOrder: cue.sourceOrder ?? cueOrder
    }))
  ).sort((left, right) =>
    left.sourceOrder - right.sourceOrder || left.trackOrder - right.trackOrder || left.cue.id.localeCompare(right.cue.id)
  );

  const cues: CompiledMotionCue[] = [];
  let previousStart = 0;
  let previousEnd = 0;
  for (const item of flattened) {
    const delay = item.cue.delay ?? 0;
    const start = item.cue.trigger === "with-previous"
      ? previousStart + delay
      : item.cue.trigger === "after-previous"
        ? previousEnd + delay
        : item.cue.trigger === "on-click"
          ? previousEnd + delay
          : delay;
    const end = start + item.cue.duration;
    cues.push({
      ...item.cue,
      trackId: item.track.id,
      elementId: item.track.elementId,
      sourceOrder: item.sourceOrder,
      start,
      end
    });
    previousStart = start;
    previousEnd = Math.max(previousEnd, end);
  }

  const finalStateByElement: Record<string, CompilerMotionState> = {};
  for (const track of [...tracks].sort((left, right) =>
    left.elementId.localeCompare(right.elementId) || left.id.localeCompare(right.id)
  )) {
    finalStateByElement[track.elementId] = {
      ...finalStateByElement[track.elementId],
      ...cloneState(track.finalState)
    };
  }

  return {
    cues,
    duration: cues.reduce((maximum, cue) => Math.max(maximum, cue.end), 0),
    finalStateByElement,
    diagnostics
  };
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * Math.max(0, Math.min(1, progress));
}

export function resolveMotionState(
  track: CompilerMotionTrack,
  options: { mode: MotionResolveMode; time: number }
): CompilerMotionState {
  if (options.mode !== "live" || !Number.isFinite(options.time) || options.time === Infinity) {
    return cloneState(track.finalState);
  }

  const timeline = compileMotionTimeline([track]);
  if (options.time >= timeline.duration) return cloneState(track.finalState);

  const state: CompilerMotionState = {};
  for (const cue of timeline.cues) {
    for (const property of new Set([
      ...Object.keys(cue.from),
      ...Object.keys(cue.to)
    ] as CompilerMotionProperty[])) {
      if (state[property] === undefined) {
        state[property] = cue.from[property] ?? track.finalState[property] ?? cue.to[property] ?? 0;
      }
    }
    if (options.time < cue.start) continue;
    const progress = cue.duration === 0 ? 1 : (options.time - cue.start) / cue.duration;
    for (const property of new Set([
      ...Object.keys(cue.from),
      ...Object.keys(cue.to)
    ] as CompilerMotionProperty[])) {
      const from = cue.from[property] ?? cue.to[property] ?? track.finalState[property] ?? 0;
      const to = cue.to[property] ?? track.finalState[property] ?? from;
      state[property] = interpolate(from, to, progress);
    }
  }
  return state;
}
