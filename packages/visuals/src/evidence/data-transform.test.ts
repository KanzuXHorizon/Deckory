import { describe, expect, it } from "vitest";

import {
  applyDataTransform,
  applyDataTransforms,
  type Dataset
} from "./data-transform";

function dataset(): Dataset {
  return {
    id: "interview-results",
    label: "Interview results",
    sourceIds: ["interview-evaluation"],
    status: "verified",
    columns: [
      { key: "candidate", label: "Candidate", type: "string" },
      { key: "round", label: "Round", type: "string" },
      { key: "score", label: "Score", type: "number" },
      { key: "weight", label: "Weight", type: "number" }
    ],
    rows: [
      { candidate: "An", round: "1", score: 62, weight: 1 },
      { candidate: "An", round: "2", score: 84, weight: 1.5 },
      { candidate: "Binh", round: "1", score: 70, weight: 1 },
      { candidate: "Binh", round: "2", score: 80, weight: 1.5 }
    ]
  };
}

describe("data transforms", () => {
  it("applies select, filter, sort and derive without mutating the source dataset", () => {
    const source = dataset();
    const result = applyDataTransforms(source, [
      {
        id: "select-core",
        version: 1,
        type: "select",
        fields: ["candidate", "round", "score", "weight"]
      },
      {
        id: "filter-round-two",
        version: 1,
        type: "filter",
        predicate: { field: "round", operator: "eq", value: "2" }
      },
      {
        id: "derive-weighted-score",
        version: 1,
        type: "derive",
        fields: [
          {
            output: "weightedScore",
            label: "Weighted score",
            expression: {
              operator: "multiply",
              left: { kind: "field", field: "score" },
              right: { kind: "field", field: "weight" }
            }
          }
        ]
      },
      {
        id: "sort-weighted-score",
        version: 1,
        type: "sort",
        by: [{ field: "weightedScore", direction: "desc" }]
      }
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.dataset.rows).toEqual([
      expect.objectContaining({ candidate: "An", weightedScore: 126 }),
      expect.objectContaining({ candidate: "Binh", weightedScore: 120 })
    ]);
    expect(source.rows[0]).toEqual({ candidate: "An", round: "1", score: 62, weight: 1 });
    expect(result.lineage.transforms.map((step) => step.transformId)).toEqual([
      "select-core",
      "filter-round-two",
      "derive-weighted-score",
      "sort-weighted-score"
    ]);
  });

  it("records an inspectable group-aggregate transform", () => {
    const result = applyDataTransform(dataset(), {
      id: "average-by-round",
      version: 1,
      type: "group-aggregate",
      groupBy: ["round"],
      measures: [
        { field: "score", operation: "mean", output: "averageScore", label: "Average score" },
        { field: "candidate", operation: "count", output: "candidateCount", label: "Candidates" }
      ]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.dataset.rows).toEqual([
      { round: "1", averageScore: 66, candidateCount: 2 },
      { round: "2", averageScore: 82, candidateCount: 2 }
    ]);
    expect(result.lineage.transforms[0]).toMatchObject({
      transformId: "average-by-round",
      type: "group-aggregate",
      inputRowCount: 4,
      outputRowCount: 2
    });
  });

  it("pivots categories deterministically with declared aggregation", () => {
    const result = applyDataTransform(dataset(), {
      id: "scores-by-candidate",
      version: 1,
      type: "pivot",
      index: ["candidate"],
      column: "round",
      value: "score",
      operation: "first"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message);
    expect(result.dataset.rows).toEqual([
      { candidate: "An", "1": 62, "2": 84 },
      { candidate: "Binh", "1": 70, "2": 80 }
    ]);
    expect(result.dataset.columns.map((column) => column.key)).toEqual([
      "candidate",
      "1",
      "2"
    ]);
  });

  it("rejects duplicate or colliding transform fields before changing data", () => {
    const duplicateSelect = applyDataTransform(dataset(), {
      id: "duplicate-select",
      version: 1,
      type: "select",
      fields: ["candidate", "candidate"]
    });
    const collidingAggregate = applyDataTransform(dataset(), {
      id: "colliding-aggregate",
      version: 1,
      type: "group-aggregate",
      groupBy: ["round"],
      measures: [
        { field: "score", operation: "mean", output: "round", label: "Invalid collision" }
      ]
    });
    const pivotSource = dataset();
    pivotSource.rows[0]!.round = "candidate";
    const collidingPivot = applyDataTransform(pivotSource, {
      id: "colliding-pivot",
      version: 1,
      type: "pivot",
      index: ["candidate"],
      column: "round",
      value: "score",
      operation: "first"
    });

    expect(duplicateSelect).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "duplicate-output-field" })]
    });
    expect(collidingAggregate).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "duplicate-output-field", field: "round" })]
    });
    expect(collidingPivot).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "invalid-pivot-key", field: "candidate" })]
    });
  });

  it("rejects duplicate transform IDs and invalid filter operand shapes", () => {
    const duplicateIds = applyDataTransforms(dataset(), [
      {
        id: "same-id",
        version: 1,
        type: "select",
        fields: ["candidate", "score"]
      },
      {
        id: "same-id",
        version: 1,
        type: "sort",
        by: [{ field: "score", direction: "desc" }]
      }
    ]);
    const invalidFilter = applyDataTransform(dataset(), {
      id: "bad-in-filter",
      version: 1,
      type: "filter",
      predicate: { field: "round", operator: "in", value: "1" }
    });

    expect(duplicateIds).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "duplicate-transform-id", transformId: "same-id" })]
    });
    expect(invalidFilter).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "invalid-operand", transformId: "bad-in-filter" })]
    });
  });

  it("rejects an invalid source dataset before applying a transform", () => {
    const invalid = dataset();
    invalid.columns.push({ key: "score", label: "Duplicate", type: "number" });

    const result = applyDataTransform(invalid, {
      id: "sort-invalid-source",
      version: 1,
      type: "sort",
      by: [{ field: "score", direction: "desc" }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "invalid-dataset" })]
    });
  });

  it("returns actionable diagnostics for invalid fields and non-finite derive results", () => {
    const missingField = applyDataTransform(dataset(), {
      id: "bad-filter",
      version: 1,
      type: "filter",
      predicate: { field: "missing", operator: "eq", value: "x" }
    });
    const divisionByZero = applyDataTransform(dataset(), {
      id: "divide-zero",
      version: 1,
      type: "derive",
      fields: [
        {
          output: "invalid",
          label: "Invalid",
          expression: {
            operator: "divide",
            left: { kind: "field", field: "score" },
            right: { kind: "literal", value: 0 }
          }
        }
      ]
    });

    expect(missingField).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "unknown-field", transformId: "bad-filter" })]
    });
    expect(divisionByZero).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "non-finite-result", transformId: "divide-zero" })]
    });
  });

  it("returns identical output and lineage across repeated runs", () => {
    const transform = {
      id: "sorted",
      version: 1 as const,
      type: "sort" as const,
      by: [
        { field: "round", direction: "asc" as const },
        { field: "candidate", direction: "asc" as const }
      ]
    };

    expect(JSON.stringify(applyDataTransform(dataset(), transform))).toBe(
      JSON.stringify(applyDataTransform(dataset(), transform))
    );
  });
});
