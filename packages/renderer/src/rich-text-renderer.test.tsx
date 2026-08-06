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
});
