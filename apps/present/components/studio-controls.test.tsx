import { renderToStaticMarkup } from "react-dom/server";
import { BarChart3, Check, LayoutDashboard, X } from "lucide-react";
import { describe, expect, it } from "vitest";
import { BooleanChoice, CommandGrid, IconChoiceGroup } from "./studio-controls";

describe("Studio interaction controls", () => {
  it("renders an accessible icon choice group with selected and disabled states", () => {
    const html = renderToStaticMarkup(
      <IconChoiceGroup
        label="Layout"
        value="dashboard"
        options={[
          { value: "dashboard", label: "Dashboard", description: "Tổng hợp chỉ số", icon: LayoutDashboard },
          { value: "data", label: "Dữ liệu", description: "Biểu đồ và bằng chứng", icon: BarChart3, disabled: true, disabledReason: "Không tương thích" }
        ]}
        onChange={() => undefined}
      />
    );

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Layout"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("Dashboard");
    expect(html).toContain("Tổng hợp chỉ số");
    expect(html).toContain("Không tương thích");
    expect(html).toContain("disabled");
  });

  it("renders a clear boolean choice without a select", () => {
    const html = renderToStaticMarkup(
      <BooleanChoice
        label="Hiện giá trị"
        value
        onChange={() => undefined}
        trueLabel="Hiện"
        falseLabel="Ẩn"
        trueIcon={Check}
        falseIcon={X}
      />
    );

    expect(html).toContain('aria-label="Hiện giá trị"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Hiện");
    expect(html).toContain("Ẩn");
    expect(html).not.toContain("<select");
  });

  it("renders command options with labels, descriptions, and disabled explanations", () => {
    const html = renderToStaticMarkup(
      <CommandGrid
        label="Thêm component"
        options={[
          { value: "chart", label: "Biểu đồ", description: "So sánh dữ liệu", icon: BarChart3 },
          { value: "dashboard", label: "Dashboard", description: "Không dùng được", icon: LayoutDashboard, disabled: true, disabledReason: "Layout hiện tại không hỗ trợ" }
        ]}
        onSelect={() => undefined}
      />
    );

    expect(html).toContain('aria-label="Thêm component"');
    expect(html).toContain("Biểu đồ");
    expect(html).toContain("So sánh dữ liệu");
    expect(html).toContain("Layout hiện tại không hỗ trợ");
    expect(html).toContain("disabled");
  });
});
