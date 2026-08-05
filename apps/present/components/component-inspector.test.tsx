import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SlideComponent } from "@deckory/schema";
import { ComponentInspector } from "./component-inspector";

describe("ComponentInspector", () => {
  it("renders editable table fields for columns, rows, highlights, and notes", () => {
    const component: Extract<SlideComponent, { type: "table" }> = {
      id: "comparison-table",
      type: "table",
      props: {
        title: "So sánh contract",
        columns: ["Tiêu chí", "Trước", "Sau"],
        rows: [{ cells: ["Schema", "Tự do", "Có type"], highlight: true }],
        note: "Dữ liệu minh hoạ"
      }
    };

    const html = renderToStaticMarkup(<ComponentInspector component={component} onChange={() => undefined} />);

    expect(html).toContain("Bảng dữ liệu");
    expect(html).toContain("Cột 1");
    expect(html).toContain("Hàng 1");
    expect(html).toContain("Nhấn mạnh");
    expect(html).toContain("Dữ liệu minh hoạ");
  });

  it("renders editable code fields including language, line numbers, highlights, and source", () => {
    const component: Extract<SlideComponent, { type: "code" }> = {
      id: "validation-code",
      type: "code",
      props: {
        title: "Chặn document lỗi",
        language: "typescript",
        code: "const result = validateDeck(deck);",
        caption: "Validation trước Presenter.",
        showLineNumbers: true,
        highlightLines: [1]
      }
    };

    const html = renderToStaticMarkup(<ComponentInspector component={component} onChange={() => undefined} />);

    expect(html).toContain("Đoạn mã");
    expect(html).toContain("Ngôn ngữ");
    expect(html).toContain("Số dòng");
    expect(html).toContain("Dòng nhấn mạnh (1, 2, 4)");
    expect(html).toContain("const result = validateDeck(deck);");
  });

  it("renders optional team identity and local image controls without requiring every field", () => {
    const component: Extract<SlideComponent, { type: "team-showcase" }> = {
      id: "project-team",
      type: "team-showcase",
      props: {
        variant: "editorial",
        members: [
          { id: "lead", name: "Nguyễn Thái Vân", role: "Project Lead", studentId: "PS00001", image: { src: "/team/lead.webp", alt: "Chân dung trưởng nhóm", position: "top" }, featured: true },
          { id: "member", name: "Thành viên 02" }
        ]
      }
    };

    const html = renderToStaticMarkup(<ComponentInspector component={component} onChange={() => undefined} />);

    expect(html).toContain("Đội ngũ");
    expect(html).toContain("Hồ sơ riêng");
    expect(html).toContain("Mã sinh viên");
    expect(html).toContain("Ảnh thành viên (không bắt buộc)");
    expect(html).toContain("Đường dẫn ảnh cục bộ");
    expect(html).toContain("Mô tả ảnh");
    expect(html).toContain("Vị trí ảnh");
    expect(html).toContain("/team/lead.webp");
  });

  it("renders visualizer structure, interaction and animation controls", () => {
    const component: Extract<SlideComponent, { type: "visualizer" }> = {
      id: "growth-tree",
      type: "visualizer",
      props: {
        variant: "growth-tree",
        interaction: "inspect",
        animation: "grow",
        items: [
          { id: "seed", label: "Ý tưởng", description: "Khởi đầu" },
          { id: "product", label: "Sản phẩm", parentId: "seed", featured: true }
        ]
      }
    };

    const html = renderToStaticMarkup(<ComponentInspector component={component} onChange={() => undefined} />);

    expect(html).toContain("Sơ đồ tương tác");
    expect(html).toContain("Kiểu sơ đồ");
    expect(html).toContain("Tương tác");
    expect(html).toContain("Chuyển động");
    expect(html).toContain("ID nút cha");
    expect(html).toContain("Nút tiêu điểm");
  });

  it("renders every editable field required by the weight simulator contract", () => {
    const component: Extract<SlideComponent, { type: "weight-simulator" }> = {
      id: "quality-weighting",
      type: "weight-simulator",
      props: {
        title: "Mô phỏng trọng số",
        description: "Thử nhiều ưu tiên đánh giá.",
        dimensions: [
          { id: "quality", label: "Chất lượng", score: 86, weight: 60, tone: "teal" },
          { id: "speed", label: "Tốc độ", score: 72, weight: 40, tone: "cobalt" }
        ],
        presets: [{ id: "balanced", label: "Cân bằng", description: "Ưu tiên đồng đều", weights: { quality: 50, speed: 50 } }],
        disclaimer: "Dữ liệu minh hoạ."
      }
    };

    const html = renderToStaticMarkup(<ComponentInspector component={component} onChange={() => undefined} />);

    expect(html).toContain("Mô phỏng trọng số");
    expect(html).toContain("Tiêu chí 1");
    expect(html).toContain("Điểm");
    expect(html).toContain("Trọng số (%)");
    expect(html).toContain("Cấu hình 1");
    expect(html).toContain("Trọng số · Chất lượng");
    expect(html).toContain("Lưu ý sử dụng");
  });
});
