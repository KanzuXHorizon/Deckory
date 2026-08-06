import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hub } from "./hub";

describe("Deckory Hub workspace hierarchy", () => {
  it("prioritizes the active deck, library, and reusable template entry points", () => {
    const html = renderToStaticMarkup(<Hub />);

    expect(html).toContain('class="hub-workspace-intro"');
    expect(html).toContain('aria-label="Tình trạng không gian làm việc"');
    expect(html).toContain('class="hub-health-strip"');
    expect(html).toContain("Mở deck");
    expect(html).toContain("Xem trước");
    expect(html).toContain("Trình chiếu");
    expect(html).toContain("Mở thư viện mẫu");
    expect(html).toContain('id="library"');
    expect(html).toContain("Quality score");
    expect(html).toContain("15 tiêu chí");
    expect(html).toContain('data-v2-quality-summary="true"');
    expect(html).toContain("Quality gate V2 · 20 tiêu chí");
    expect(html).toContain("Chờ bằng chứng runtime/manual");
    expect(html).toContain("Mở Studio V2");
  });

  it("keeps every deck action explicitly named", () => {
    const html = renderToStaticMarkup(<Hub />);

    expect(html).toContain("Chỉnh sửa deck");
    expect(html).toContain("Xem trước deck");
    expect(html).toContain("Trình chiếu deck");
  });
});
