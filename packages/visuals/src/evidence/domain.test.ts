import { describe, expect, it } from "vitest";

import {
  EvidenceDomainSchema,
  validateEvidenceDomain,
  type EvidenceDomain
} from "./domain";
import { traceSourceDependents } from "./lineage";

function validDomain(): EvidenceDomain {
  return EvidenceDomainSchema.parse({
    sources: [
      {
        id: "interview-evaluation",
        kind: "table",
        label: "Interview evaluation rounds",
        status: "verified",
        sourceDate: "2026-08-01"
      }
    ],
    evidence: [
      {
        id: "evidence-score-improvement",
        sourceId: "interview-evaluation",
        label: "Scores by practice round",
        unit: "points",
        period: "Rounds 1-3"
      }
    ],
    claims: [
      {
        id: "claim-score-improvement",
        text: "Điểm tăng từ 62 lên 84 sau ba vòng luyện tập.",
        slideId: "results",
        evidenceIds: ["evidence-score-improvement"],
        status: "supported"
      }
    ],
    datasets: [
      {
        id: "quality-scores",
        label: "Quality scores",
        sourceIds: ["interview-evaluation"],
        status: "verified",
        columns: [
          { key: "round", label: "Round", type: "string" },
          { key: "score", label: "Score", type: "number" }
        ],
        rows: [
          { round: "1", score: 62 },
          { round: "2", score: 73 },
          { round: "3", score: 84 }
        ]
      }
    ],
    visualBindings: [
      {
        id: "results-chart",
        kind: "chart",
        slideId: "results",
        datasetId: "quality-scores",
        claimIds: ["claim-score-improvement"]
      },
      {
        id: "appendix-table",
        kind: "table",
        slideId: "appendix-data",
        datasetId: "quality-scores",
        claimIds: []
      }
    ]
  });
}

describe("evidence domain", () => {
  it("rejects a claim that references missing evidence", () => {
    const domain = validDomain();
    domain.claims[0]!.evidenceIds = ["missing-evidence"];

    const result = validateEvidenceDomain(domain);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "missing-evidence", recordId: "claim-score-improvement" })
    );
  });

  it("requires illustrative sources and datasets to keep a visible label", () => {
    const domain = validDomain();
    domain.sources[0]!.status = "illustrative";
    domain.datasets[0]!.status = "illustrative";

    const result = validateEvidenceDomain(domain);

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "illustrative-label-required", recordId: "interview-evaluation" }),
        expect.objectContaining({ code: "illustrative-label-required", recordId: "quality-scores" })
      ])
    );
  });

  it("treats URL references as offline metadata and never as fetch instructions", () => {
    const parsed = EvidenceDomainSchema.parse({
      sources: [
        {
          id: "research-link",
          kind: "url-reference",
          label: "Research landing page",
          referenceUrl: "https://example.com/research",
          status: "unverified"
        }
      ],
      evidence: [],
      claims: [],
      datasets: [],
      visualBindings: []
    });

    expect(parsed.sources[0]).toMatchObject({
      kind: "url-reference",
      referenceUrl: "https://example.com/research"
    });
    expect(JSON.stringify(parsed.sources[0])).not.toContain("fetch");
    expect(JSON.stringify(parsed.sources[0])).not.toContain("requestInit");
  });

  it("rejects unknown contract fields and malformed dataset rows", () => {
    const unknownFieldDomain = validDomain() as EvidenceDomain & {
      vendorPayload?: { option: string };
    };
    unknownFieldDomain.vendorPayload = { option: "raw" };

    expect(() => EvidenceDomainSchema.parse(unknownFieldDomain)).toThrow();

    const duplicateColumns = validDomain();
    duplicateColumns.datasets[0]!.columns.push({
      key: "score",
      label: "Duplicate score",
      type: "number"
    });
    expect(() => EvidenceDomainSchema.parse(duplicateColumns)).toThrow(/duplicate dataset column/i);

    const wrongRowType = validDomain();
    wrongRowType.datasets[0]!.rows[0]!.score = "sixty-two";
    expect(() => EvidenceDomainSchema.parse(wrongRowType)).toThrow(/row value.*score/i);

    const unknownRowField = validDomain();
    unknownRowField.datasets[0]!.rows[0]!.vendorOption = "forbidden";
    expect(() => EvidenceDomainSchema.parse(unknownRowField)).toThrow(/unknown row field/i);
  });

  it("lists every dependent claim, dataset and visual before source deletion", () => {
    const dependents = traceSourceDependents(validDomain(), "interview-evaluation");

    expect(dependents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "claim", id: "claim-score-improvement" }),
        expect.objectContaining({ kind: "dataset", id: "quality-scores" }),
        expect.objectContaining({ kind: "chart", id: "results-chart", slideId: "results" }),
        expect.objectContaining({ kind: "table", id: "appendix-table", slideId: "appendix-data" })
      ])
    );
  });

  it("reports duplicate IDs and missing dataset bindings deterministically", () => {
    const domain = validDomain();
    domain.sources.push({ ...domain.sources[0]! });
    domain.visualBindings[0]!.datasetId = "missing-dataset";

    const first = validateEvidenceDomain(domain);
    const second = validateEvidenceDomain(domain);

    expect(first).toEqual(second);
    expect(first.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate-id", recordId: "interview-evaluation" }),
        expect.objectContaining({ code: "missing-dataset", recordId: "results-chart" })
      ])
    );
  });
});
