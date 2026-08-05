export type PresenterState = {
  slideIndex: number;
  sequenceStep: number;
  sequenceCounts: readonly number[];
};

export type PresenterCommand =
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "HOME" }
  | { type: "END" }
  | { type: "GOTO"; slideIndex: number };

export function initialPresenterState(sequenceCounts: readonly number[]): PresenterState {
  if (sequenceCounts.length === 0) {
    throw new Error("Một presentation cần ít nhất một slide.");
  }
  return { slideIndex: 0, sequenceStep: 0, sequenceCounts };
}

export function present(state: PresenterState, command: PresenterCommand): PresenterState {
  const currentSequenceCount = state.sequenceCounts[state.slideIndex] ?? 0;
  switch (command.type) {
    case "NEXT":
      if (state.sequenceStep < currentSequenceCount) {
        return { ...state, sequenceStep: state.sequenceStep + 1 };
      }
      return state.slideIndex === state.sequenceCounts.length - 1
        ? state
        : { ...state, slideIndex: state.slideIndex + 1, sequenceStep: 0 };
    case "PREVIOUS":
      if (state.sequenceStep > 0) {
        return { ...state, sequenceStep: state.sequenceStep - 1 };
      }
      return state.slideIndex === 0
        ? state
        : { ...state, slideIndex: state.slideIndex - 1, sequenceStep: state.sequenceCounts[state.slideIndex - 1] ?? 0 };
    case "HOME":
      return { ...state, slideIndex: 0, sequenceStep: 0 };
    case "END": {
      const slideIndex = state.sequenceCounts.length - 1;
      return { ...state, slideIndex, sequenceStep: state.sequenceCounts[slideIndex] ?? 0 };
    }
    case "GOTO":
      return command.slideIndex < 0 || command.slideIndex >= state.sequenceCounts.length
        ? state
        : { ...state, slideIndex: command.slideIndex, sequenceStep: 0 };
  }
}
