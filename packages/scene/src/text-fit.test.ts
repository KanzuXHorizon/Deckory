import { describe, expect, it } from "vitest";
import { normalizeRichText } from "./rich-text";
import {
  buildTextMeasurementCacheKey,
  fitTextToFrame,
  measureRichText
} from "./text-fit";

const heading = normalizeRichText({
  paragraphs: [{ id: "heading", runs: [{ text: "Phản hồi chỉ có giá trị khi dẫn đến hành động." }] }]
});

describe("Vietnamese-safe text measurement and fitting", () => {
  it("builds cache keys from font, size, width and normalized text hash", () => {
    const composed = buildTextMeasurementCacheKey({
      fontFamily: "Inter Variable",
      fontWeight: 700,
      fontSize: 48,
      width: 640,
      text: "Phản hồi"
    });
    const decomposed = buildTextMeasurementCacheKey({
      fontFamily: "Inter Variable",
      fontWeight: 700,
      fontSize: 48,
      width: 640,
      text: "Phản hồi"
    });

    expect(composed).toBe(decomposed);
    expect(composed).toMatch(/^Inter Variable\|700\|48\|640\|[a-f0-9]{8}$/);
  });

  it("measures repeated Vietnamese input deterministically", () => {
    const request = {
      fontFamily: "Inter Variable",
      fontWeight: 700,
      fontSize: 48,
      lineHeight: 1.05,
      letterSpacing: -0.5,
      width: 560
    } as const;

    expect(measureRichText(heading, request)).toEqual(measureRichText(heading, request));
  });

  it("accounts for semantic list markers during measurement", () => {
    const request = {
      fontFamily: "Inter Variable",
      fontWeight: 500,
      fontSize: 20,
      lineHeight: 1.2,
      letterSpacing: 0,
      width: 400
    } as const;
    const plain = normalizeRichText({
      paragraphs: [{ id: "plain", runs: [{ text: "Bằng chứng" }] }]
    });
    const listed = normalizeRichText({
      paragraphs: [{ id: "listed", list: { kind: "bullet", level: 1 }, runs: [{ text: "Bằng chứng" }] }]
    });

    expect(measureRichText(listed, request).maximumLineWidth).toBeGreaterThan(
      measureRichText(plain, request).maximumLineWidth
    );
  });

  it("never shrinks below the declared minimum", () => {
    const result = fitTextToFrame(heading, { width: 520, height: 122 }, {
      fontFamily: "Inter Variable",
      fontWeight: 700,
      preferredSize: 64,
      minimumSize: 40,
      lineHeight: 1.02,
      letterSpacing: -0.8,
      maximumLines: 2
    });

    expect(result.fontSize).toBeGreaterThanOrEqual(40);
  });

  it("returns an actionable failure when minimum size still does not fit", () => {
    const result = fitTextToFrame(heading, { width: 160, height: 54 }, {
      fontFamily: "Inter Variable",
      fontWeight: 700,
      preferredSize: 52,
      minimumSize: 40,
      lineHeight: 1,
      letterSpacing: 0,
      maximumLines: 1
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("text-does-not-fit");
      expect(result.fontSize).toBe(40);
      expect(result.measuredLines).toBeGreaterThan(1);
      expect(result.recommendation).toMatch(/split|rewrite|frame/i);
    }
  });

  it("includes line height and tracking in measurement cache identity", () => {
    const base = {
      fontFamily: "Inter Variable",
      fontWeight: 700,
      fontSize: 48,
      width: 640,
      text: "Phản hồi",
      lineHeight: 1.05,
      letterSpacing: -0.5
    };

    expect(buildTextMeasurementCacheKey(base)).not.toBe(
      buildTextMeasurementCacheKey({ ...base, lineHeight: 1.2 })
    );
    expect(buildTextMeasurementCacheKey(base)).not.toBe(
      buildTextMeasurementCacheKey({ ...base, letterSpacing: 0 })
    );
  });

  it("reports the paragraph where cumulative line overflow begins", () => {
    const document = normalizeRichText({
      paragraphs: [
        { id: "first", runs: [{ text: "Dòng đầu" }] },
        { id: "second", runs: [{ text: "Dòng sau" }] }
      ]
    });
    const result = fitTextToFrame(document, { width: 400, height: 100 }, {
      fontFamily: "Inter Variable",
      fontWeight: 500,
      preferredSize: 20,
      minimumSize: 20,
      lineHeight: 1,
      letterSpacing: 0,
      maximumLines: 3
    }, {
      measure: () => ({
        lineCount: 4,
        height: 80,
        maximumLineWidth: 300,
        paragraphLines: [2, 2]
      })
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.overflowingParagraph).toBe(1);
  });

  it("always evaluates the exact declared minimum size", () => {
    const result = fitTextToFrame(heading, { width: 400, height: 100 }, {
      fontFamily: "Inter Variable",
      fontWeight: 700,
      preferredSize: 40.3,
      minimumSize: 40,
      lineHeight: 1,
      letterSpacing: 0,
      maximumLines: 2
    }, {
      measure: (_document, request) => ({
        lineCount: request.fontSize <= 40 ? 2 : 3,
        height: request.fontSize <= 40 ? 80 : 120,
        maximumLineWidth: 390,
        paragraphLines: [request.fontSize <= 40 ? 2 : 3]
      })
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.fontSize).toBe(40);
  });

  it("includes paragraph spacing and local line-height overrides in measured height", () => {
    const document = normalizeRichText({
      paragraphs: [{
        id: "spaced",
        style: { lineHeight: 2, spacingBefore: 10, spacingAfter: 5 },
        runs: [{ text: "Một dòng" }]
      }]
    });
    const measurement = measureRichText(document, {
      fontFamily: "Inter Variable",
      fontWeight: 500,
      fontSize: 20,
      lineHeight: 1,
      letterSpacing: 0,
      width: 400
    });

    expect(measurement.height).toBe(55);
  });
});
