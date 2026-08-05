import { validateDeck, type DeckDocument } from "@deckory/schema";

export const MAX_DECK_SNAPSHOTS = 20;

export type DeckSnapshot = {
  id: string;
  deckId: string;
  label: string;
  createdAt: string;
  deck: DeckDocument;
};

export function createDeckSnapshot(
  deck: DeckDocument,
  label: string,
  now: Date,
  existing: readonly DeckSnapshot[]
): DeckSnapshot[] {
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) throw new Error("Snapshot time must be valid.");

  const baseId = `snapshot-${timestamp}`;
  const existingIds = new Set(existing.map((snapshot) => snapshot.id));
  let id = baseId;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const trimmedLabel = label.trim();
  const snapshot: DeckSnapshot = {
    id,
    deckId: deck.id,
    label: trimmedLabel || fallbackLabel(now),
    createdAt: now.toISOString(),
    deck: cloneDeck(deck)
  };

  return [snapshot, ...existing]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, MAX_DECK_SNAPSHOTS);
}

export function parseDeckSnapshots(input: unknown, deckId: string): DeckSnapshot[] {
  if (!Array.isArray(input)) return [];

  const candidates: DeckSnapshot[] = [];
  for (const value of input) {
    if (!value || typeof value !== "object") continue;
    const snapshot = value as Partial<DeckSnapshot>;
    if (typeof snapshot.id !== "string" || !snapshot.id.trim()) continue;
    if (snapshot.deckId !== deckId) continue;
    if (typeof snapshot.label !== "string" || !snapshot.label.trim()) continue;
    if (typeof snapshot.createdAt !== "string" || !Number.isFinite(Date.parse(snapshot.createdAt))) continue;

    const validation = validateDeck(snapshot.deck);
    if (!validation.ok || validation.deck.id !== deckId) continue;
    candidates.push({
      id: snapshot.id,
      deckId,
      label: snapshot.label.trim(),
      createdAt: new Date(snapshot.createdAt).toISOString(),
      deck: cloneDeck(validation.deck)
    });
  }

  const seen = new Set<string>();
  return candidates
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .filter((snapshot) => {
      if (seen.has(snapshot.id)) return false;
      seen.add(snapshot.id);
      return true;
    })
    .slice(0, MAX_DECK_SNAPSHOTS);
}

export function restoreDeckSnapshot(snapshot: DeckSnapshot): DeckDocument {
  return cloneDeck(snapshot.deck);
}

function fallbackLabel(now: Date): string {
  return `Phiên bản ${now.toISOString().slice(0, 16).replace("T", " ")}`;
}

function cloneDeck(deck: DeckDocument): DeckDocument {
  return JSON.parse(JSON.stringify(deck)) as DeckDocument;
}
