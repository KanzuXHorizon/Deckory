import { describe, expect, it } from "vitest";
import {
  matchRuntimeEvidence,
  summarizeRuntimeEvidence,
  type RuntimeEvidenceRecord
} from "./runtime-evidence";

function record(overrides: Partial<RuntimeEvidenceRecord> = {}): RuntimeEvidenceRecord {
  return {
    id: "evidence-browser-ui",
    kind: "browser-ui",
    revision: "abc123",
    documentRevision: 7,
    viewport: { width: 1440, height: 900, zoom: 1 },
    mode: "studio",
    capturedAt: "2026-08-06T12:00:00.000Z",
    artifact: "output/playwright/screenshots/abc123/studio.png",
    passed: true,
    ...overrides
  };
}

describe("runtime evidence", () => {
  it("accepts only passed evidence from the exact code and document revision", () => {
    const records = [
      record(),
      record({ id: "wrong-code", revision: "def456" }),
      record({ id: "wrong-document", documentRevision: 6 }),
      record({ id: "failed", passed: false })
    ];

    expect(matchRuntimeEvidence(records, { revision: "abc123", documentRevision: 7 }))
      .toEqual([records[0]]);
  });

  it("rejects records without viewport, mode, timestamp or artifact evidence", () => {
    const records = [
      record({ id: "missing-artifact", artifact: "" }),
      record({ id: "invalid-timestamp", capturedAt: "yesterday" }),
      record({ id: "invalid-viewport", viewport: { width: 0, height: 900, zoom: 1 } }),
      record({ id: "invalid-mode", mode: "unknown" as RuntimeEvidenceRecord["mode"] })
    ];

    expect(matchRuntimeEvidence(records, { revision: "abc123", documentRevision: 7 })).toEqual([]);
  });

  it("summarizes matched evidence by runtime quality gate", () => {
    const records: RuntimeEvidenceRecord[] = [
      record(),
      record({ id: "performance", kind: "performance", mode: "presenter", artifact: "output/performance.json" }),
      record({ id: "export", kind: "export-comparison", mode: "export", artifact: "output/export.png" })
    ];

    expect(summarizeRuntimeEvidence(records, { revision: "abc123", documentRevision: 7 })).toMatchObject({
      browserUi: true,
      performance: true,
      exportComparison: true,
      matchedRecordIds: ["evidence-browser-ui", "performance", "export"]
    });
  });
});
