import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import { ExportDeck } from "./export-deck";

const deck: DeckDocument = {
  id: "export-contract",
  version: 1,
  title: "Export contract",
  locale: "vi-VN",
  themeId: "export-contract",
  slides: [
    {
      id: "cover",
      layout: "cover",
      notes: "Ghi chú riêng tư không được xuất.",
      components: [
        { id: "heading", type: "heading", props: { title: "Xuất cùng renderer đã kiểm chứng" } }
      ]
    },
    {
      id: "evidence",
      layout: "data",
      notes: "Giải thích chart khi thuyết trình.",
      components: [
        { id: "heading", type: "heading", props: { title: "Mọi reveal được xuất ở trạng thái hoàn chỉnh" } },
        {
          id: "chart",
          type: "chart",
          sequence: 2,
          props: {
            title: "Độ phủ",
            unit: "điểm",
            values: [{ label: "Export", value: 100, highlight: true }]
          }
        },
        { id: "footer", type: "evidence-footer", props: { source: "Fixture minh hoạ" } }
      ]
    }
  ]
};

describe("ExportDeck", () => {
  it("renders every slide at a stable export boundary without speaker notes", () => {
    const html = renderToStaticMarkup(<ExportDeck deck={deck} />);

    expect(html).toContain('data-export-ready="true"');
    expect(html).toContain('data-export-deck-id="export-contract"');
    expect(html).toContain('data-export-slide-id="cover"');
    expect(html).toContain('data-export-slide-id="evidence"');
    expect(html).toContain('data-visible="true"');
    expect(html).toContain("In / Lưu PDF");
    expect(html).toContain("PNG");
    expect(html).toContain("JPG");
    expect(html).toContain("PPTX");
    expect(html).toContain("PDF + PNG + JPG + PPTX");
    expect(html).toContain("Sao chép lệnh");
    expect(html).toContain("mở terminal tại thư mục Deckory");
    expect(html).not.toContain("Ghi chú riêng tư không được xuất.");
    expect(html).not.toContain("Giải thích chart khi thuyết trình.");
    expect(html).not.toContain("speaker-note-copy");
  });
});
