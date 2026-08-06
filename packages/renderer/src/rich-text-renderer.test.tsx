import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RichTextRenderer } from "./rich-text-renderer";

describe("RichTextRenderer", () => {
  it("renders semantic paragraphs, lists and normalized marks without arbitrary HTML", () => {
    const html = renderToStaticMarkup(<RichTextRenderer document={{
      verticalAlign: "center",
      readingOrder: ["claim", "evidence"],
      plainText: "Luận điểm\nBằng chứng",
      paragraphs: [
        { id: "claim", runs: [{ text: "<script>không chạy</script>", marks: { bold: true } }] },
        { id: "evidence", list: { kind: "bullet", level: 0 }, runs: [{ text: "Bằng chứng", marks: { emphasis: "positive" } }] }
      ]
    }} />);

    expect(html).toContain("&lt;script&gt;không chạy&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain('data-paragraph-id="claim"');
    expect(html).toContain("<ul");
    expect(html).toContain("<strong");
    expect(html).toContain('data-emphasis="positive"');
  });

  it("exposes the complete plain-text equivalent", () => {
    const html = renderToStaticMarkup(<RichTextRenderer document={{
      verticalAlign: "top",
      readingOrder: ["vi"],
      plainText: "Phản hồi có bằng chứng.",
      paragraphs: [{ id: "vi", runs: [{ text: "Phản hồi có bằng chứng." }] }]
    }} />);

    expect(html).toContain('aria-label="Phản hồi có bằng chứng."');
  });

  it("groups consecutive list paragraphs into one semantic list", () => {
    const html = renderToStaticMarkup(<RichTextRenderer document={{
      verticalAlign: "top",
      readingOrder: ["first", "second"],
      plainText: "• Một\n• Hai",
      paragraphs: [
        { id: "first", list: { kind: "bullet", level: 0 }, runs: [{ text: "Một" }] },
        { id: "second", list: { kind: "bullet", level: 0 }, runs: [{ text: "Hai" }] }
      ]
    }} />);

    expect(html.match(/<ul/g)).toHaveLength(1);
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html).toContain('data-paragraph-id="first"');
    expect(html).toContain('data-paragraph-id="second"');
  });

  it("rejects protocol-relative links at the renderer boundary", () => {
    const html = renderToStaticMarkup(<RichTextRenderer document={{
      verticalAlign: "top",
      readingOrder: ["link"],
      plainText: "Mở liên kết",
      paragraphs: [{
        id: "link",
        runs: [{ text: "Mở liên kết", marks: { link: { href: "//example.com" } } }]
      }]
    }} />);

    expect(html).toContain('data-rich-text-error="unsafe-link"');
    expect(html).not.toContain('href="//example.com"');
  });

  it("rejects unsafe color values at the renderer boundary", () => {
    const html = renderToStaticMarkup(<RichTextRenderer document={{
      verticalAlign: "top",
      readingOrder: ["color"],
      plainText: "Màu",
      paragraphs: [{
        id: "color",
        runs: [{ text: "Màu", marks: { color: "red);background:url(https://example.com/x)" } }]
      }]
    }} />);

    expect(html).toContain('data-rich-text-error="unsafe-color"');
    expect(html).not.toContain("https://example.com");
  });
});
