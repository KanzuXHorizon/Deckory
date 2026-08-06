import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayoutPanel, parseLayoutNumber } from "./layout-panel";

describe("LayoutPanel", () => {
  it("allows temporary empty numeric drafts without emitting NaN or invalid values", () => {
    expect(parseLayoutNumber("", 0)).toBeUndefined();
    expect(parseLayoutNumber("-1", 0)).toBeUndefined();
    expect(parseLayoutNumber("12.5", 0)).toBe(12.5);
    expect(parseLayoutNumber("abc", 0)).toBeUndefined();
  });

  it("renders keyboard-accessible layout, sizing and constraint controls in Vietnamese", () => {
    const html = renderToStaticMarkup(<LayoutPanel
      value={{
        mode: "stack",
        direction: "horizontal",
        wrap: true,
        gap: 16,
        padding: { top: 20, right: 24, bottom: 20, left: 24 },
        align: "center",
        justify: "space-between",
        childWidth: "fill",
        childHeight: "hug",
        horizontalConstraint: "left",
        verticalConstraint: "top"
      }}
      onChange={() => undefined}
      onDetach={() => undefined}
    />);

    expect(html).toContain("Chế độ bố cục");
    expect(html).toContain("Tự do");
    expect(html).toContain("Constraints");
    expect(html).toContain("Stack");
    expect(html).toContain("Lưới");
    expect(html).toContain("Tự xuống dòng");
    expect(html).toContain("Khoảng cách");
    expect(html).toContain("Padding trên");
    expect(html).toContain("Ôm nội dung");
    expect(html).toContain("Lấp đầy khung");
    expect(html).toContain("Tách khỏi auto layout");
    expect(html).not.toContain("{&quot;mode&quot;");
  });

  it("uses progressive disclosure for freeform and constraint modes", () => {
    const freeform = renderToStaticMarkup(<LayoutPanel
      value={{
        mode: "freeform",
        gap: 16,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        align: "start",
        justify: "start",
        childWidth: "fixed",
        childHeight: "fixed",
        horizontalConstraint: "left",
        verticalConstraint: "top"
      }}
      onChange={() => undefined}
      onDetach={() => undefined}
    />);
    const constraint = renderToStaticMarkup(<LayoutPanel
      value={{
        mode: "constraint",
        gap: 16,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        align: "start",
        justify: "start",
        childWidth: "fixed",
        childHeight: "fixed",
        horizontalConstraint: "right",
        verticalConstraint: "bottom"
      }}
      onChange={() => undefined}
      onDetach={() => undefined}
    />);

    expect(freeform).not.toContain("Khoảng cách và padding");
    expect(freeform).not.toContain("Constraints khi resize khung cha");
    expect(constraint).toContain("Constraints khi resize khung cha");
    expect(constraint).not.toContain("Khoảng cách và padding");
    expect(constraint).not.toContain("Kích thước thành phần con");
  });

  it("shows an actionable fit diagnostic without hiding the controls", () => {
    const html = renderToStaticMarkup(<LayoutPanel
      value={{
        mode: "grid",
        columns: 3,
        gap: 20,
        padding: { top: 24, right: 24, bottom: 24, left: 24 },
        align: "stretch",
        justify: "start",
        childWidth: "fixed",
        childHeight: "fixed",
        horizontalConstraint: "left",
        verticalConstraint: "top"
      }}
      diagnostic={{
        code: "auto-layout-does-not-fit",
        message: "Ba cột không đủ chỗ cho kích thước tối thiểu.",
        recommendation: "Giảm số cột hoặc tăng chiều rộng nhóm."
      }}
      onChange={() => undefined}
      onDetach={() => undefined}
    />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("Không thể áp dụng bố cục hiện tại");
    expect(html).toContain("Giảm số cột hoặc tăng chiều rộng nhóm");
    expect(html).toContain("Số cột");
  });
});
