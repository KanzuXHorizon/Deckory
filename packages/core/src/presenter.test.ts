import { describe, expect, it } from "vitest";
import { initialPresenterState, present } from "./index.js";

describe("presenter state machine", () => {
  it("keeps navigation in bounds and reveals sequences before moving slide", () => {
    const state = initialPresenterState([2, 0, 1]);
    const revealed = present(state, { type: "NEXT" });
    const moved = present(revealed, { type: "NEXT" });

    expect(revealed).toMatchObject({ slideIndex: 0, sequenceStep: 1 });
    expect(moved).toMatchObject({ slideIndex: 0, sequenceStep: 2 });
    expect(present(moved, { type: "NEXT" })).toMatchObject({ slideIndex: 1, sequenceStep: 0 });
    expect(present(state, { type: "PREVIOUS" })).toBe(state);
  });

  it("supports direct slide selection and Home/End semantics", () => {
    const state = initialPresenterState([0, 1, 0]);
    expect(present(state, { type: "END" })).toMatchObject({ slideIndex: 2 });
    expect(present(present(state, { type: "END" }), { type: "HOME" })).toMatchObject({ slideIndex: 0, sequenceStep: 0 });
    expect(present(state, { type: "GOTO", slideIndex: 1 })).toMatchObject({ slideIndex: 1 });
  });
});
