import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import { Presenter } from "./presenter";

const deck: DeckDocument = {
  id: "presenter-header-a11y",
  version: 1,
  title: "Presenter header accessibility",
  locale: "vi-VN",
  themeId: "presenter-header-a11y",
  slides: [
    {
      id: "opening",
      layout: "cover",
      components: [
        {
          id: "heading",
          type: "heading",
          props: { title: "Mọi thao tác vẫn có tên khi nhãn trực quan bị ẩn." }
        }
      ]
    }
  ]
};

describe("Presenter header", () => {
  it("keeps compact toolbar actions accessible when their visible labels are hidden", () => {
    const html = renderToStaticMarkup(
      <Presenter deck={deck} returnHref="/" editHref="/studio?deck=presenter-header-a11y" />
    );

    expect(html).toContain('aria-label="Về thư viện Deckory"');
    expect(html).toContain('aria-label="Chỉnh sửa deck"');
    expect(html).toContain('aria-label="Mở tổng quan slide"');
    expect(html).toContain('class="toolbar-button toolbar-button--overview"');
  });
});
