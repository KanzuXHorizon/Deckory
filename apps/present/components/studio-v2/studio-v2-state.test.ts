import { describe, expect, it } from "vitest";
import type { DeckDocumentV2 } from "@deckory/schema/v2";
import { commitStudioCommand, createStudioV2State, redoStudioCommand, undoStudioCommand } from "./studio-v2-state";

const deck: DeckDocumentV2 = {
  schemaVersion: 2,
  id: "studio-state",
  revision: 1,
  title: "Studio state",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  slides: [{
    id: "cover",
    name: "Cover",
    background: { layers: [] },
    elements: [{
      id: "title",
      name: "Title",
      kind: "text",
      frame: { x: 72, y: 64, width: 720, height: 140 },
      zIndex: 1,
      content: { text: "Deckory" },
      accessibility: { label: "Deckory" }
    }]
  }]
};

describe("Studio V2 history state", () => {
  it("commits one command as one history entry", () => {
    const initial = createStudioV2State(deck, "cover");
    const next = commitStudioCommand(initial, {
      type: "transform-elements",
      slideId: "cover",
      changes: [{ elementId: "title", frame: { x: 96, y: 64, width: 720, height: 140 } }]
    });

    expect(next.deck.slides[0]!.elements[0]!.frame.x).toBe(96);
    expect(next.history.past).toHaveLength(1);
    expect(next.history.future).toHaveLength(0);
  });

  it("undoes and redoes through inverse scene commands", () => {
    const committed = commitStudioCommand(createStudioV2State(deck, "cover"), {
      type: "patch-element",
      slideId: "cover",
      elementId: "title",
      patch: { name: "Primary title" }
    });
    const undone = undoStudioCommand(committed);
    const redone = redoStudioCommand(undone);

    expect(undone.deck.slides[0]!.elements[0]!.name).toBe("Title");
    expect(undone.history.future).toHaveLength(1);
    expect(redone.deck.slides[0]!.elements[0]!.name).toBe("Primary title");
    expect(redone.history.past).toHaveLength(1);
  });

  it("clears redo history after a new command", () => {
    const first = commitStudioCommand(createStudioV2State(deck, "cover"), {
      type: "patch-element",
      slideId: "cover",
      elementId: "title",
      patch: { name: "First" }
    });
    const undone = undoStudioCommand(first);
    const branched = commitStudioCommand(undone, {
      type: "patch-element",
      slideId: "cover",
      elementId: "title",
      patch: { name: "Second" }
    });

    expect(branched.history.future).toEqual([]);
    expect(branched.deck.slides[0]!.elements[0]!.name).toBe("Second");
  });
});
