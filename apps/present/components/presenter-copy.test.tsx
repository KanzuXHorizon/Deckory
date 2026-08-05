import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckDocument } from "@deckory/schema";
import { Presenter } from "./presenter";

const deck: DeckDocument = {
  id: "presenter-copy",
  version: 1,
  title: "Presenter Copy",
  locale: "vi-VN",
  themeId: "presenter-copy",
  slides: [{
    id: "cover",
    layout: "cover",
    notes: "Điểm cần nhấn mạnh.",
    components: [{ id: "heading", type: "heading", props: { title: "Một thông điệp rõ ràng" } }]
  }]
};

describe("Presenter professional copy", () => {
  it("uses audience-facing Vietnamese labels for the presenter workspace", () => {
    const html = renderToStaticMarkup(<Presenter deck={deck} editHref="/studio" />);

    expect(html).toContain("Bảng điều khiển trình chiếu");
    expect(html).toContain('aria-label="Về thư viện Deckory"');
    expect(html).toContain("Thư viện");
    expect(html).toContain('aria-label="Điều khiển trình chiếu"');
    expect(html).not.toContain("Presenter Console");
    expect(html).not.toContain("Điều khiển presentation");
  });
});
