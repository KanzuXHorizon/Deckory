import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import { Studio } from "./studio";

const deck: DeckDocument = {
  id: "responsive-studio",
  version: 1,
  title: "Responsive Studio",
  locale: "vi-VN",
  themeId: "responsive-studio",
  slides: [{
    id: "cover",
    layout: "cover",
    components: [{ id: "heading", type: "heading", props: { title: "Canvas responsive" } }]
  }]
};

describe("Studio responsive inspector", () => {
  it("exposes an accessible drawer trigger and close control without removing the inspector", () => {
    const html = renderToStaticMarkup(<Studio sourceDeck={deck} />);

    expect(html).toContain("scaled-slide-preview studio-slide-canvas");
    expect(html).toContain('class="icon-action studio-inspector-toggle"');
    expect(html).toContain('aria-controls="studio-inspector"');
    expect(html).toContain('id="studio-inspector"');
    expect(html).toContain('class="icon-action inspector-close"');
    expect(html).toContain('aria-label="Đóng Inspector"');
  });

  it("uses progressive inspector tabs and audience-facing Vietnamese copy", () => {
    const html = renderToStaticMarkup(<Studio sourceDeck={deck} />);

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Khu vực Inspector"');
    expect(html).toContain("Nội dung");
    expect(html).toContain("Slide");
    expect(html).toContain("Chuyển động");
    expect(html).toContain("Kiểm tra");
    expect(html).toContain("Xem trước");
    expect(html).toContain("Trình chiếu");
    expect(html).toContain("Thành phần");
    expect(html).not.toContain(">Preview<");
    expect(html).not.toContain(">Present<");
    expect(html).not.toContain(">COMPONENTS<");
  });

  it("shows an explicit save state and a manual save action while supporting autosave", () => {
    const html = renderToStaticMarkup(<Studio sourceDeck={deck} />);

    expect(html).toContain('class="studio-save-state"');
    expect(html).toContain("Chưa có thay đổi");
    expect(html).toContain("Lưu ngay");
    expect(html).toContain('aria-label="Phiên bản"');
    expect(html).toContain('aria-label="Lưu ngay"');
    expect(html).toContain('aria-label="Xem trước"');
    expect(html).toContain('aria-label="Xuất deck"');
    expect(html).toContain('aria-label="Trình chiếu"');
    expect(html).toContain('href="/preview?deck=responsive-studio&amp;slide=cover"');
    expect(html).toContain('href="/export?deck=responsive-studio"');
    expect(html).toContain('href="/present?deck=responsive-studio&amp;slide=cover"');
    expect(html).toContain('aria-live="polite"');
  });
});
