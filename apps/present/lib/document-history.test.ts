import { describe, expect, it } from "vitest";
import {
  canRedoDocumentHistory,
  canUndoDocumentHistory,
  createDocumentHistory,
  pushDocumentHistory,
  redoDocumentHistory,
  resetDocumentHistory,
  undoDocumentHistory
} from "./document-history";

describe("document history", () => {
  it("undoes and redoes document states", () => {
    const initial = createDocumentHistory({ title: "A" });
    const changed = pushDocumentHistory(initial, { title: "B" });
    const undone = undoDocumentHistory(changed);

    expect(undone.present.title).toBe("A");
    expect(canUndoDocumentHistory(undone)).toBe(false);
    expect(canRedoDocumentHistory(undone)).toBe(true);
    expect(redoDocumentHistory(undone).present.title).toBe("B");
  });

  it("invalidates the redo branch after a new mutation", () => {
    const changed = pushDocumentHistory(createDocumentHistory(1), 2);
    const branched = pushDocumentHistory(undoDocumentHistory(changed), 3);

    expect(branched.future).toEqual([]);
    expect(branched.present).toBe(3);
    expect(canUndoDocumentHistory(branched)).toBe(true);
  });

  it("caps stored history", () => {
    let history = createDocumentHistory(0);
    for (let value = 1; value <= 105; value += 1) {
      history = pushDocumentHistory(history, value, 100);
    }

    expect(history.past).toHaveLength(100);
    expect(history.past[0]).toBe(5);
  });

  it("resets history around a restored document", () => {
    const changed = pushDocumentHistory(createDocumentHistory("source"), "draft");
    const reset = resetDocumentHistory("snapshot");

    expect(changed.past).toEqual(["source"]);
    expect(reset).toEqual({ past: [], present: "snapshot", future: [] });
  });
});
