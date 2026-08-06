import { defineDeck } from "@deckory/schema";
import { migrateDeckV1ToV2 } from "@deckory/templates";

const footer = (page: string, source: string) => ({
  id: "footer",
  type: "evidence-footer" as const,
  props: { page, source }
});

export const visualLabV1Fixture = defineDeck({
  id: "visual-lab",
  version: 1,
  title: "Visual Lab — thư viện kể chuyện bằng dữ liệu",
  locale: "vi-VN",
  themeId: "deckory-technical",
  theme: { preset: "technical-clean", accent: "teal", typography: "modern", density: "comfortable" },
  assets: [{
    id: "visual-lab-image",
    type: "image",
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpKQAAAAASUVORK5CYII=",
    mediaType: "image/png",
    width: 1,
    height: 1,
    source: { label: "Local visual fixture" }
  }],
  slides: [
    {
      id: "cover", layout: "cover", notes: "Giới thiệu Visual Lab như fixture minh hoạ.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "DECKORY VISUAL LAB", title: "Chọn đúng hình thức trước khi thêm hiệu ứng.", description: "Fixture kiểm tra migration V2 và visual vocabulary." } },
        footer("01", "Dữ liệu minh hoạ / visual QA")
      ]
    },
    {
      id: "metrics", layout: "dashboard", notes: "Mỗi metric phải dẫn đến một hành động khác nhau.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "METRIC SYSTEM", title: "Ba tín hiệu. Ba vai trò khác nhau." } },
        { id: "metrics", type: "metric-grid", props: { metrics: [
          { value: "42", label: "deck", note: "khối lượng", tone: "cobalt" },
          { value: "87%", label: "đã kiểm tra", note: "mức sẵn sàng", tone: "teal" },
          { value: "6", label: "cảnh báo", note: "ưu tiên", tone: "amber" }
        ] } },
        footer("02", "Fixture metric")
      ]
    },
    {
      id: "bar-chart", layout: "data", notes: "Bar chart dùng cho so sánh hạng mục.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "SO SÁNH", title: "Bar chart làm rõ khoảng cách giữa các tiêu chí." } },
        { id: "chart", type: "chart", props: { title: "Điểm chất lượng", unit: "điểm / 100", variant: "bar", values: [
          { label: "Cấu trúc", value: 91 }, { label: "Khả năng đọc", value: 84 }, { label: "Hierarchy", value: 95, highlight: true }
        ] } }, footer("03", "Fixture quality")
      ]
    },
    {
      id: "line-chart", layout: "dashboard", notes: "Line chart dùng cho tiến trình có thứ tự.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "XU HƯỚNG", title: "Mỗi vòng review phải tạo ra tiến bộ nhìn thấy được." } },
        { id: "chart", type: "chart", props: { title: "Mức sẵn sàng", unit: "điểm / 100", variant: "line", values: [
          { label: "Bản 1", value: 48 }, { label: "Bản 2", value: 63 }, { label: "Bản 3", value: 76 }, { label: "Bản 4", value: 89, highlight: true }
        ] } }, footer("04", "Fixture review cycle")
      ]
    },
    {
      id: "area-chart", layout: "data", notes: "Area chart nhấn mạnh quy mô tích luỹ.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "QUY MÔ", title: "Phạm vi audit tăng theo từng giờ." } },
        { id: "chart", type: "chart", props: { title: "Slide đã audit", unit: "slide", variant: "area", values: [
          { label: "09:00", value: 8 }, { label: "10:00", value: 17 }, { label: "11:00", value: 31 }, { label: "12:00", value: 46, highlight: true }
        ] } }, footer("05", "Fixture throughput")
      ]
    },
    {
      id: "donut-chart", layout: "dashboard", notes: "Donut chỉ dùng khi tổng và thành phần rõ.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "CƠ CẤU", title: "Part-to-whole chỉ cần ít nhóm." } },
        { id: "chart", type: "chart", props: { title: "Cơ cấu slide", unit: "slide", variant: "donut", values: [
          { label: "Luận điểm", value: 9, highlight: true }, { label: "Dữ liệu", value: 7 }, { label: "Quy trình", value: 4 }, { label: "Kết luận", value: 2 }
        ] } }, footer("06", "Fixture content mix")
      ]
    },
    {
      id: "table-evidence", layout: "data", notes: "Table giữ độ chính xác khi cần đối chiếu.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "BẰNG CHỨNG", title: "Table phù hợp cho đối chiếu chính xác." } },
        { id: "table", type: "table", props: { title: "Visual coverage", columns: ["Thành phần", "Trạng thái", "Mục đích"], rows: [
          { cells: ["Chart", "Hoàn thiện", "So sánh"] }, { cells: ["Table", "Hoàn thiện", "Đối chiếu"] }, { cells: ["Code", "Hoàn thiện", "Kỹ thuật"] }
        ] } }, footer("07", "Fixture inventory")
      ]
    },
    {
      id: "code-evidence", layout: "architecture", notes: "Code chỉ giữ đoạn đủ để giải thích.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "TECHNICAL PROOF", title: "Validation chặn document lỗi trước Preview." } },
        { id: "code", type: "code", props: { title: "Validation", language: "typescript", code: "const result = validateDeck(draft);\nif (!result.ok) return showDiagnostics(result.diagnostics);\nopenPreview(result.deck);", caption: "Chỉ deck hợp lệ được mở Preview.", showLineNumbers: true, highlightLines: [1, 2] } },
        footer("08", "Fixture validation")
      ]
    },
    {
      id: "team-showcase", layout: "process", notes: "Team visual phải làm rõ ownership.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "PEOPLE", title: "Vai trò khác nhau. Một chuẩn chất lượng." } },
        { id: "team", type: "team-showcase", props: { title: "Deckory team", variant: "editorial", members: [
          { id: "product", name: "Narrative Lead", role: "Product & Story", summary: "Giữ story arc và conclusion.", skills: ["Narrative"], contributions: ["Story review"], image: { assetId: "visual-lab-image", alt: "Narrative Lead" } },
          { id: "design", name: "Visual Lead", role: "Design System", summary: "Giữ hierarchy và accessibility.", skills: ["Visual Design"], contributions: ["Visual grammar"], image: { assetId: "visual-lab-image", alt: "Visual Lead" } },
          { id: "engine", name: "Engine Lead", role: "Presentation Engineering", summary: "Giữ schema và renderer đồng nhất.", skills: ["TypeScript"], contributions: ["Typed renderer"], image: { assetId: "visual-lab-image", alt: "Engine Lead" } }
        ] } }, footer("09", "Fixture team")
      ]
    },
    {
      id: "growth-visualizer", layout: "data", notes: "Visualizer dùng khi quan hệ là nội dung chính.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "RELATIONSHIP", title: "Source of truth dẫn đến trải nghiệm đáng tin cậy." } },
        { id: "visualizer", type: "visualizer", props: { title: "Từ schema đến Presenter", summary: "Quan hệ cha con giữa schema, audit và surface.", center: "Deckory AST", variant: "growth-tree", interaction: "inspect", animation: "grow", items: [
          { id: "schema", label: "Schema", description: "Typed contract", icon: "seed" },
          { id: "quality", label: "Quality", description: "Validation", icon: "sparkle", parentId: "schema" },
          { id: "studio", label: "Studio", description: "Editing", icon: "system", parentId: "quality" },
          { id: "presenter", label: "Presenter", description: "Delivery", icon: "people", parentId: "quality", featured: true }
        ] } }, footer("10", "Fixture relationship")
      ]
    },
    {
      id: "closing", layout: "closing", notes: "Kết bằng nguyên tắc chọn visual theo quan hệ.", components: [
        { id: "heading", type: "heading", props: { eyebrow: "VISUAL GRAMMAR", title: "Chọn visual theo quan hệ cần giải thích.", emphasis: "Không theo hiệu ứng đang có." } },
        footer("11", "Deckory visual system")
      ]
    }
  ]
});

const migration = migrateDeckV1ToV2(visualLabV1Fixture);
if (!migration.ok) throw new Error(`Visual Lab V2 migration failed: ${JSON.stringify(migration.diagnostics)}`);

export const visualLabV2 = migration.deck;
export const visualLabV2MigrationDiagnostics = migration.diagnostics;
