import type { DeckDocumentV2 } from "@deckory/schema/v2";
import { applySceneCommand, type SceneCommand } from "@deckory/scene";

export type StudioHistoryEntry = {
  command: SceneCommand;
  inverse: SceneCommand;
};

export type StudioV2State = {
  deck: DeckDocumentV2;
  activeSlideId: string;
  history: {
    past: StudioHistoryEntry[];
    future: StudioHistoryEntry[];
  };
};

export function createStudioV2State(deck: DeckDocumentV2, initialSlideId?: string): StudioV2State {
  const activeSlideId = deck.slides.some((slide) => slide.id === initialSlideId)
    ? initialSlideId!
    : deck.slides[0]!.id;
  return {
    deck: structuredClone(deck),
    activeSlideId,
    history: { past: [], future: [] }
  };
}

export function commitStudioCommand(state: StudioV2State, command: SceneCommand): StudioV2State {
  const transaction = applySceneCommand(state.deck, command);
  return {
    ...state,
    deck: transaction.deck,
    history: {
      past: [...state.history.past, { command, inverse: transaction.inverse }],
      future: []
    }
  };
}

export function undoStudioCommand(state: StudioV2State): StudioV2State {
  const entry = state.history.past.at(-1);
  if (!entry) return state;
  const transaction = applySceneCommand(state.deck, entry.inverse);
  return {
    ...state,
    deck: transaction.deck,
    history: {
      past: state.history.past.slice(0, -1),
      future: [entry, ...state.history.future]
    }
  };
}

export function redoStudioCommand(state: StudioV2State): StudioV2State {
  const entry = state.history.future[0];
  if (!entry) return state;
  const transaction = applySceneCommand(state.deck, entry.command);
  return {
    ...state,
    deck: transaction.deck,
    history: {
      past: [...state.history.past, { command: entry.command, inverse: transaction.inverse }],
      future: state.history.future.slice(1)
    }
  };
}

export function setStudioActiveSlide(state: StudioV2State, slideId: string): StudioV2State {
  if (!state.deck.slides.some((slide) => slide.id === slideId)) {
    throw new Error(`Slide không tồn tại: ${slideId}`);
  }
  return { ...state, activeSlideId: slideId };
}
