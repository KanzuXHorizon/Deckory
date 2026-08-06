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
});
