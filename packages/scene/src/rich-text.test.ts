import { describe, expect, it } from "vitest";
import { normalizeRichText, richTextToPlainText } from "./rich-text";

describe("semantic rich text", () => {
  it("merges adjacent runs with identical normalized marks", () => {
    const result = normalizeRichText({
      paragraphs: [{
        id: "claim",
        runs: [
          { text: "Phản hồi ", marks: { bold: true, color: "accent" } },
          { text: "có bằng chứng.", marks: { color: "accent", bold: true } }
        ]
      }]
    });

    expect(result.paragraphs[0]!.runs).toEqual([
      { text: "Phản hồi có bằng chứng.", marks: { bold: true, color: "accent" } }
    ]);
  });

  it("normalizes decomposed Vietnamese diacritics without changing punctuation", () => {
    const result = normalizeRichText({
      paragraphs: [{ id: "vi", runs: [{ text: "Phản hồi có bằng chứng—rõ ràng." }] }]
    });

    expect(result.plainText).toBe("Phản hồi có bằng chứng—rõ ràng.");
    expect(result.plainText).toBe(result.plainText.normalize("NFC"));
  });

  it("preserves semantic list order and exposes stable plain text", () => {
    const document = normalizeRichText({
      paragraphs: [
        { id: "first", list: { kind: "number", level: 0, ordinal: 1 }, runs: [{ text: "Luận điểm" }] },
        { id: "second", list: { kind: "bullet", level: 1 }, runs: [{ text: "Bằng chứng" }] }
      ]
    });

    expect(richTextToPlainText(document)).toBe("1. Luận điểm\n  • Bằng chứng");
    expect(document.readingOrder).toEqual(["first", "second"]);
  });

  it("rejects duplicate paragraph IDs instead of producing ambiguous reading order", () => {
    expect(() => normalizeRichText({
      paragraphs: [
        { id: "duplicate", runs: [{ text: "A" }] },
        { id: "duplicate", runs: [{ text: "B" }] }
      ]
    })).toThrow(/paragraph ID/i);
  });

  it("rejects executable link schemes before they enter the document", () => {
    expect(() => normalizeRichText({
      paragraphs: [{
        id: "unsafe-link",
        runs: [{ text: "Mở", marks: { link: { href: "javascript:alert(1)" } } }]
      }]
    })).toThrow(/link/i);
  });

  it("rejects rich-text colors that could escape into raw CSS", () => {
    expect(() => normalizeRichText({
      paragraphs: [{
        id: "unsafe-color",
        runs: [{ text: "Màu", marks: { color: "red);background:url(https://example.com/x)" } }]
      }]
    })).toThrow(/color/i);
  });

  it("rejects non-finite list and paragraph metrics", () => {
    expect(() => normalizeRichText({
      paragraphs: [{
        id: "invalid-list",
        list: { kind: "bullet", level: Number.NaN },
        runs: [{ text: "Không hợp lệ" }]
      }]
    })).toThrow(/list level/i);

    expect(() => normalizeRichText({
      paragraphs: [{
        id: "too-deep",
        list: { kind: "bullet", level: 9 },
        runs: [{ text: "Quá sâu" }]
      }]
    })).toThrow(/list level/i);

    expect(() => normalizeRichText({
      paragraphs: [{
        id: "invalid-style",
        style: { lineHeight: Number.POSITIVE_INFINITY },
        runs: [{ text: "Không hợp lệ" }]
      }]
    })).toThrow(/lineHeight/i);
  });
});
