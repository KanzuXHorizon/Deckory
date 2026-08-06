import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SelectionStatus, selectionStatusMessage } from "./selection-status";

describe("SelectionStatus", () => {
  it("describes empty, single and multi-selection states in Vietnamese", () => {
    expect(selectionStatusMessage([])).toBe("Chưa chọn thành phần nào");
    expect(selectionStatusMessage(["title"], "Tiêu đề")).toBe("Đã chọn Tiêu đề");
    expect(selectionStatusMessage(["title", "hero", "footer"])).toBe("Đã chọn 3 thành phần");
  });

  it("renders a polite atomic live region outside artifact semantics", () => {
    const html = renderToStaticMarkup(<SelectionStatus selectedIds={["title", "hero"]} />);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
    expect(html).toContain("Đã chọn 2 thành phần");
    expect(html).toContain('data-studio-overlay="selection-status"');
  });
});
