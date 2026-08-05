import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudioConfirmDialog } from "./studio-confirm-dialog";

describe("StudioConfirmDialog", () => {
  it("renders an explicitly labelled modal with safe and destructive actions", () => {
    const html = renderToStaticMarkup(
      <StudioConfirmDialog
        title="Xoá slide này?"
        description="Slide và nội dung bên trong sẽ bị xoá khỏi bản nháp."
        confirmLabel="Xoá slide"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Xoá slide này?");
    expect(html).toContain("Hủy");
    expect(html).toContain("Xoá slide");
    expect(html).toContain('aria-label="Đóng xác nhận"');
  });
});
