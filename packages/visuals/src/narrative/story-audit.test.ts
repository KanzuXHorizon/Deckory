import { describe, expect, it } from "vitest";

import { auditNarrative } from "./story-audit";
import type { DeckNarrative, NarrativeSlide } from "./narrative-model";

function narrative(sections: DeckNarrative["sections"]): DeckNarrative {
  return {
    audience: { role: "graduation-committee", needs: [] },
    decisionOrOutcome: "Approve the product for graduation defense",
    thesis: "Deckory turns structured evidence into a defensible presentation.",
    unresolvedQuestions: [],
    sections
  };
}

describe("auditNarrative", () => {
  it("detects a solution introduced before problem evidence", () => {
    const slides: NarrativeSlide[] = [
      {
        id: "solution",
        heading: "Deckory automates the workflow",
        purpose: "introduce-solution",
        conclusion: "The new workflow removes manual assembly.",
        evidenceStatus: "unsupported",
        sectionId: "solution"
      },
      {
        id: "problem-evidence",
        heading: "Manual assembly creates inconsistent decks",
        purpose: "show-evidence",
        conclusion: "Repeated manual steps cause visible inconsistency.",
        evidenceStatus: "supported",
        interpretation: "The current workflow does not scale.",
        sectionId: "evidence"
      }
    ];
    const result = auditNarrative({
      narrative: narrative([
        { id: "solution", role: "solution", objective: "Show solution", slideIds: ["solution"] },
        { id: "evidence", role: "evidence", objective: "Prove problem", slideIds: ["problem-evidence"] }
      ]),
      slides
    });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "solution-before-evidence", slideId: "solution" })
    );
  });

  it("detects evidence without interpretation and weak topic headings", () => {
    const slides: NarrativeSlide[] = [
      {
        id: "results",
        heading: "Kết quả đánh giá",
        purpose: "show-evidence",
        conclusion: "",
        evidenceStatus: "supported",
        sectionId: "evidence"
      }
    ];
    const result = auditNarrative({
      narrative: narrative([
        { id: "evidence", role: "evidence", objective: "Show results", slideIds: ["results"] },
        { id: "closing", role: "closing", objective: "Close", slideIds: [] }
      ]),
      slides
    });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "evidence-without-interpretation", slideId: "results" })
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "weak-conclusion-heading", slideId: "results" })
    );
  });

  it("detects a missing closing and repeated audience-facing conclusions", () => {
    const slides: NarrativeSlide[] = [
      {
        id: "evidence-a",
        heading: "Automation removes manual handoffs",
        purpose: "show-evidence",
        conclusion: "Automation removes manual handoffs.",
        evidenceStatus: "supported",
        interpretation: "The workflow becomes easier to audit.",
        sectionId: "evidence"
      },
      {
        id: "proof-a",
        heading: "Automation removes manual handoffs",
        purpose: "show-proof",
        conclusion: "Automation removes manual handoffs!",
        evidenceStatus: "supported",
        interpretation: "The same conclusion is repeated without a new question.",
        sectionId: "proof",
        transitionFromPrevious: "The proof confirms the earlier evidence."
      }
    ];

    const result = auditNarrative({
      narrative: narrative([
        { id: "evidence", role: "evidence", objective: "Show evidence", slideIds: ["evidence-a"] },
        { id: "proof", role: "proof", objective: "Show proof", slideIds: ["proof-a"] }
      ]),
      slides
    });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "repeated-conclusion", slideId: "proof-a" })
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "weak-closing" })
    );
  });

  it("detects a section transition that has no narrative bridge", () => {
    const slides: NarrativeSlide[] = [
      {
        id: "context-a",
        heading: "The current workflow has four handoffs",
        purpose: "context",
        conclusion: "Four handoffs increase review effort.",
        evidenceStatus: "supported",
        sectionId: "context"
      },
      {
        id: "tension-a",
        heading: "Review effort grows with every handoff",
        purpose: "tension",
        conclusion: "The workflow becomes harder to defend.",
        evidenceStatus: "supported",
        sectionId: "tension"
      }
    ];

    const result = auditNarrative({
      narrative: narrative([
        { id: "context", role: "context", objective: "Explain context", slideIds: ["context-a"] },
        { id: "tension", role: "tension", objective: "Create tension", slideIds: ["tension-a"] },
        { id: "closing", role: "closing", objective: "Close", slideIds: [] }
      ]),
      slides
    });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "abrupt-transition", slideId: "tension-a" })
    );
  });

  it("detects abrupt transitions, duplicate slides and a closing without action", () => {
    const slides: NarrativeSlide[] = [
      {
        id: "context",
        heading: "The current workflow",
        purpose: "context",
        conclusion: "The workflow has four manual handoffs.",
        evidenceStatus: "supported",
        sectionId: "context",
        semanticSignature: "manual-workflow"
      },
      {
        id: "duplicate-context",
        heading: "Current workflow overview",
        purpose: "context",
        conclusion: "The workflow has four manual handoffs.",
        evidenceStatus: "supported",
        sectionId: "context",
        semanticSignature: "manual-workflow"
      },
      {
        id: "decision",
        heading: "Choose Deckory",
        purpose: "decision",
        conclusion: "Adopt Deckory.",
        evidenceStatus: "supported",
        sectionId: "decision"
      },
      {
        id: "closing",
        heading: "Thank you",
        purpose: "closing",
        conclusion: "The presentation is complete.",
        evidenceStatus: "supported",
        sectionId: "closing"
      }
    ];
    const result = auditNarrative({
      narrative: narrative([
        { id: "context", role: "context", objective: "Explain", slideIds: ["context", "duplicate-context"] },
        { id: "decision", role: "decision", objective: "Decide", slideIds: ["decision"] },
        { id: "closing", role: "closing", objective: "Close", slideIds: ["closing"] }
      ]),
      slides
    });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "duplicate-slide", slideId: "duplicate-context" })
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "abrupt-transition", slideId: "decision" })
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "weak-closing", slideId: "closing" })
    );
  });
});
