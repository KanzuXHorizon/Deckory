import { describe, expect, it } from "vitest";

import {
  draftSpeakerNotes,
  removeTechnicalFiller,
  rewriteConclusionHeading,
  shortenCopy,
  splitDenseCopy
} from "./copy-transform";

describe("constrained copy transforms", () => {
  it("turns a topic heading into a conclusion without changing the claim", () => {
    const result = rewriteConclusionHeading({
      heading: "Kết quả đánh giá",
      evidenceText: "Điểm tăng từ 62 lên 84 sau ba vòng luyện tập."
    });

    expect(result).toMatchObject({
      ok: true,
      text: "Ba vòng luyện tập nâng điểm đánh giá từ 62 lên 84.",
      report: {
        introducedClaims: [],
        numericChanges: [],
        preserved: true
      }
    });
  });

  it("refuses to invent a result when evidence is missing", () => {
    const result = rewriteConclusionHeading({
      heading: "Hiệu quả hệ thống",
      evidenceText: ""
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("evidence-required");
      expect(result.message).toMatch(/bằng chứng/i);
    }
  });

  it("rejects a proposed rewrite that changes a numeric claim", () => {
    const result = rewriteConclusionHeading({
      heading: "Kết quả đánh giá",
      evidenceText: "Điểm tăng từ 62 lên 84 sau ba vòng luyện tập.",
      proposedText: "Ba vòng luyện tập nâng điểm đánh giá từ 62 lên 90."
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("claim-preservation-failed");
      expect(result.report.numericChanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ introducedValue: "90" }),
          expect.objectContaining({ removedValue: "84" })
        ])
      );
    }
  });

  it("rejects a proposed rewrite that reverses semantic polarity", () => {
    const result = rewriteConclusionHeading({
      heading: "Phản hồi người dùng",
      evidenceText: "Người dùng thích giao diện mới.",
      proposedText: "Người dùng ghét giao diện mới."
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("claim-preservation-failed");
      expect(result.report.polarityChanges).toContainEqual(
        expect.objectContaining({ kind: "polarity" })
      );
    }
  });

  it("removes technical filler while preserving explicit values and limitations", () => {
    const result = removeTechnicalFiller(
      "Theo như implementation hiện tại, hệ thống đạt 84 điểm nhưng chưa kiểm thử trên thiết bị cũ."
    );

    expect(result.text).toBe("Hệ thống đạt 84 điểm nhưng chưa kiểm thử trên thiết bị cũ.");
    expect(result.report.preserved).toBe(true);
    expect(result.report.numericChanges).toEqual([]);
    expect(result.report.limitationChanges).toEqual([]);
  });

  it("shortens and splits dense copy without adding claims", () => {
    const shortened = shortenCopy(
      "Về cơ bản, hệ thống hiện tại thực sự hỗ trợ quy trình kiểm tra dữ liệu có cấu trúc."
    );
    const split = splitDenseCopy(
      "Deckory kiểm tra schema trước khi render. Deckory giữ nguồn dữ liệu cục bộ. Deckory xuất bản deck ngoại tuyến.",
      { maxSentencesPerBlock: 1 }
    );

    expect(shortened.ok).toBe(true);
    if (!shortened.ok) throw new Error(shortened.message);
    expect(shortened.text).toBe(
      "Hệ thống hiện tại hỗ trợ quy trình kiểm tra dữ liệu có cấu trúc."
    );
    expect(shortened.report.introducedClaims).toEqual([]);
    expect(split.blocks).toHaveLength(3);
    expect(split.report.preserved).toBe(true);
  });

  it("does not remove a temporal qualifier while shortening copy", () => {
    const result = shortenCopy("Hiện tại, hệ thống hỗ trợ 3 định dạng xuất.");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.text).toContain("Hiện tại");
    expect(result.report.preserved).toBe(true);
  });

  it("drafts speaker notes only from supplied claims", () => {
    const result = draftSpeakerNotes([
      "Schema validation passed.",
      "The export remains offline."
    ]);

    expect(result.text).toContain("Schema validation passed.");
    expect(result.text).toContain("The export remains offline.");
    expect(result.report.introducedClaims).toEqual([]);
  });
});
