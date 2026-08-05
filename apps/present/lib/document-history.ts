export type DocumentHistory<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function createDocumentHistory<T>(present: T): DocumentHistory<T> {
  return { past: [], present, future: [] };
}

export function pushDocumentHistory<T>(
  history: DocumentHistory<T>,
  next: T,
  limit = 100
): DocumentHistory<T> {
  if (Object.is(history.present, next)) return history;

  const safeLimit = Math.max(1, Math.floor(limit));
  const past = [...history.past, history.present];

  return {
    past: past.slice(Math.max(0, past.length - safeLimit)),
    present: next,
    future: []
  };
}

export function undoDocumentHistory<T>(history: DocumentHistory<T>): DocumentHistory<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future]
  };
}

export function redoDocumentHistory<T>(history: DocumentHistory<T>): DocumentHistory<T> {
  const next = history.future[0];
  if (next === undefined) return history;

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1)
  };
}

export function resetDocumentHistory<T>(present: T): DocumentHistory<T> {
  return createDocumentHistory(present);
}

export function canUndoDocumentHistory<T>(history: DocumentHistory<T>): boolean {
  return history.past.length > 0;
}

export function canRedoDocumentHistory<T>(history: DocumentHistory<T>): boolean {
  return history.future.length > 0;
}
