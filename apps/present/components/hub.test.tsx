import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hub } from "./hub";

describe("Deckory Hub workspace hierarchy", () => {
  it("prioritizes the active deck, library, and reusable template entry points", () => {
    const html = renderToStaticMarkup(<Hub />);

    expect(html).toContain('class="hub-workspace-intro"');
    expect(html).toContain('aria-label="Tình trạng workspace"');
    expect(html).toContain('class="hub-health-strip"');
    expect(html).toContain("Mở deck");
    expect(html).toContain("Xem trước");
    expect(html).toContain("Trình chiếu");
    expect(html).toContain("Mở thư viện mẫu");
    expect(html).toContain('id="library"');
  });

  it("keeps every deck action explicitly named", () => {
    const html = renderToStaticMarkup(<Hub />);

    expect(html).toContain("Chỉnh sửa deck");
    expect(html).toContain("Xem trước deck");
    expect(html).toContain("Trình chiếu deck");
  });
});
