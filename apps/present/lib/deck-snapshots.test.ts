import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import {
  MAX_DECK_SNAPSHOTS,
  createDeckSnapshot,
  parseDeckSnapshots,
  restoreDeckSnapshot,
  type DeckSnapshot
} from "./deck-snapshots";

function deck(title = "Snapshot deck"): DeckDocument {
  return {
    id: "snapshot-deck",
    version: 1,
    title,
    locale: "vi-VN",
    themeId: "snapshot-deck",
    slides: [{
      id: "cover",
      layout: "cover",
      components: [{ id: "heading", type: "heading", props: { title } }]
    }]
  };
}

describe("deck snapshots", () => {
  it("creates a stable checkpoint, handles timestamp collisions and keeps the newest twenty", () => {
    let snapshots: DeckSnapshot[] = [];
    for (let index = 0; index < MAX_DECK_SNAPSHOTS + 2; index += 1) {
      snapshots = createDeckSnapshot(
        deck(`Version ${index + 1}`),
        `  Phiên bản ${index + 1}  `,
        new Date(1_700_000_000_000 + index),
        snapshots
      );
    }

    expect(snapshots).toHaveLength(MAX_DECK_SNAPSHOTS);
    expect(snapshots[0]).toMatchObject({ label: `Phiên bản ${MAX_DECK_SNAPSHOTS + 2}`, deckId: "snapshot-deck" });
    expect(snapshots.at(-1)?.label).toBe("Phiên bản 3");

    const collision = createDeckSnapshot(deck("Collision"), "Collision", new Date(1_700_000_000_021), snapshots);
    expect(collision[0]?.id).toMatch(/^snapshot-1700000000021(?:-\d+)?$/);
    expect(new Set(collision.map((snapshot) => snapshot.id)).size).toBe(collision.length);
  });

  it("drops malformed, invalid and cross-deck snapshots while sorting valid entries", () => {
    const current = createDeckSnapshot(deck("Current"), "Current", new Date("2026-08-05T12:00:00.000Z"), []);
    const older = createDeckSnapshot(deck("Older"), "Older", new Date("2026-08-05T10:00:00.000Z"), [])[0]!;
    const invalidDeck = { ...deck("Invalid"), id: "Invalid ID" };

    const parsed = parseDeckSnapshots([
      older,
      { ...current[0], deckId: "another-deck" },
      { ...current[0], id: "duplicate-but-newer", createdAt: "invalid-date" },
      { ...current[0], id: "invalid-deck", deck: invalidDeck },
      current[0],
      null
    ], "snapshot-deck");

    expect(parsed.map((snapshot) => snapshot.label)).toEqual(["Current", "Older"]);
  });

  it("restores a detached clone so later edits cannot mutate snapshot history", () => {
    const snapshot = createDeckSnapshot(deck("Saved"), "Saved", new Date(0), [])[0]!;
    const restored = restoreDeckSnapshot(snapshot);
    restored.title = "Edited after restore";
    restored.slides[0]!.components[0]!.props = { title: "Changed" };

    expect(snapshot.deck.title).toBe("Saved");
    expect(snapshot.deck.slides[0]!.components[0]!.props).toEqual({ title: "Saved" });
  });

  it("generates a readable fallback label for an empty name", () => {
    const snapshot = createDeckSnapshot(deck(), "   ", new Date("2026-08-05T10:11:12.000Z"), [])[0]!;
    expect(snapshot.label).toBe("Phiên bản 2026-08-05 10:11");
  });
});
