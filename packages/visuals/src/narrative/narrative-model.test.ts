import { describe, expect, it } from "vitest";

import {
  DeckNarrativeSchema,
  buildNarrativeIndex,
  type NarrativeSlide
} from "./narrative-model";

describe("DeckNarrative", () => {
  it("requires one primary outcome and thesis for a production narrative", () => {
    expect(() =>
      DeckNarrativeSchema.parse({
        audience: { role: "graduation-committee" },
        sections: [],
        unresolvedQuestions: []
      })
    ).toThrow(/thesis|outcome/i);
  });

  it("strictly rejects unknown narrative contract fields", () => {
    expect(() =>
      DeckNarrativeSchema.parse({
        audience: { role: "executive", vendorProfile: "forbidden" },
        decisionOrOutcome: "Choose an option",
        thesis: "Option A is the safest path.",
        unresolvedQuestions: [],
        sections: [],
        rawModelPayload: { prompt: "forbidden" }
      })
    ).toThrow();
  });

  it("keeps appendix slides outside the main argument", () => {
    const narrative = DeckNarrativeSchema.parse({
      audience: { role: "graduation-committee" },
      decisionOrOutcome: "Approve the graduation project",
      thesis: "The product is reliable enough for a live defense.",
      unresolvedQuestions: [],
      sections: [
        {
          id: "proof",
          role: "proof",
          objective: "Prove release readiness",
          slideIds: ["results"]
        },
        {
          id: "appendix",
          role: "appendix",
          objective: "Retain technical detail",
          slideIds: ["appendix-api"]
        }
      ]
    });
    const slides: NarrativeSlide[] = [
      {
        id: "results",
        heading: "All release gates pass",
        purpose: "prove",
        conclusion: "The release is ready.",
        evidenceStatus: "supported",
        sectionId: "proof"
      },
      {
        id: "appendix-api",
        heading: "API details",
        purpose: "reference",
        conclusion: "Endpoint contracts are documented.",
        evidenceStatus: "supported",
        sectionId: "appendix"
      }
    ];

    const result = buildNarrativeIndex(narrative, slides);

    expect(result.mainSlideIds).toEqual(["results"]);
    expect(result.appendixSlideIds).toEqual(["appendix-api"]);
  });

  it("rejects duplicate slide assignment across sections", () => {
    expect(() =>
      DeckNarrativeSchema.parse({
        audience: { role: "executive" },
        decisionOrOutcome: "Choose an option",
        thesis: "Option A is the safest path.",
        unresolvedQuestions: [],
        sections: [
          { id: "evidence", role: "evidence", objective: "Compare", slideIds: ["choice"] },
          { id: "decision", role: "decision", objective: "Decide", slideIds: ["choice"] }
        ]
      })
    ).toThrow(/duplicate|assigned/i);
  });
});
