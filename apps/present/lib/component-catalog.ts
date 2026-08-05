import type { Slide, SlideComponent } from "@deckory/schema";

const compatibleComponents: Record<Slide["layout"], SlideComponent["type"][]> = {
  cover: ["heading", "evidence-footer"],
  statement: ["statement", "heading", "visualizer", "evidence-footer"],
  split: ["heading", "metric-grid", "code", "insight", "team-showcase", "visualizer", "weight-simulator", "evidence-footer"],
  dashboard: ["heading", "metric-grid", "chart", "table", "insight", "team-showcase", "visualizer", "weight-simulator", "evidence-footer"],
  comparison: ["heading", "comparison", "table", "evidence-footer"],
  process: ["heading", "process", "team-showcase", "visualizer", "evidence-footer"],
  architecture: ["heading", "architecture", "code", "insight", "team-showcase", "visualizer", "evidence-footer"],
  data: ["heading", "chart", "table", "code", "metric-grid", "insight", "team-showcase", "visualizer", "weight-simulator", "evidence-footer"],
  closing: ["heading", "statement", "team-showcase", "visualizer", "evidence-footer"]
};

export function isCompatible(layout: Slide["layout"], type: SlideComponent["type"]): boolean {
  return compatibleComponents[layout].includes(type);
}

export function createComponent(type: SlideComponent["type"], id: string): SlideComponent {
  switch (type) {
    case "heading":
      return { id, type, props: { title: "Tiêu đề mới", description: "Mô tả ngắn cho slide." } };
    case "statement":
      return { id, type, props: { quote: "Luận điểm mới", byline: "Nguồn" } };
    case "metric-grid":
      return {
        id,
        type,
        props: {
          metrics: [
            { value: "82", label: "Chỉ số A", note: "Dữ liệu minh hoạ", tone: "cobalt" },
            { value: "74", label: "Chỉ số B", note: "Dữ liệu minh hoạ", tone: "teal" },
            { value: "61", label: "Chỉ số C", note: "Dữ liệu minh hoạ", tone: "amber" }
          ]
        }
      };
    case "comparison":
      return {
        id,
        type,
        props: {
          left: { eyebrow: "TRƯỚC", title: "Hiện tại", points: ["Điểm 1", "Điểm 2"] },
          right: { eyebrow: "SAU", title: "Đề xuất", points: ["Điểm 1", "Điểm 2"] }
        }
      };
    case "process":
      return {
        id,
        type,
        props: {
          steps: [
            { title: "Bước một", note: "Mô tả", icon: "data" },
            { title: "Bước hai", note: "Mô tả", icon: "system" },
            { title: "Bước ba", note: "Mô tả", icon: "sparkle" }
          ]
        }
      };
    case "architecture":
      return {
        id,
        type,
        props: {
          layers: [
            { label: "ĐẦU VÀO", items: ["Nguồn dữ liệu"] },
            { label: "LÕI", items: ["Nguồn dữ liệu chuẩn"], accent: true },
            { label: "ĐẦU RA", items: ["Kết quả"] }
          ]
        }
      };
    case "chart":
      return {
        id,
        type,
        props: {
          title: "Biểu đồ mới",
          unit: "điểm",
          variant: "bar",
          values: [
            { label: "A", value: 72, highlight: true },
            { label: "B", value: 58 },
            { label: "C", value: 64 }
          ]
        }
      };
    case "table":
      return {
        id,
        type,
        props: {
          title: "Bảng mới",
          columns: ["Tiêu chí", "Kết quả"],
          rows: [
            { cells: ["Mục A", "Đạt"], highlight: true },
            { cells: ["Mục B", "Đang cải thiện"] }
          ],
          note: "Thay dữ liệu minh hoạ bằng nguồn đã kiểm chứng."
        }
      };
    case "code":
      return {
        id,
        type,
        props: {
          title: "Đoạn mã mới",
          language: "typescript",
          code: "const insight = createStory(data);",
          caption: "Giải thích ngắn ý nghĩa của đoạn mã.",
          showLineNumbers: true
        }
      };
    case "insight":
      return {
        id,
        type,
        props: {
          label: "KẾT LUẬN",
          title: "Kết luận chính",
          description: "Diễn giải vì sao insight này quan trọng.",
          metric: "+12",
          tone: "cobalt"
        }
      };
    case "team-showcase":
      return {
        id,
        type,
        props: {
          title: "Đội ngũ thực hiện",
          subtitle: "Mỗi thành viên gắn với một trách nhiệm có thể kiểm chứng.",
          project: "Deckory",
          variant: "editorial",
          members: [
            {
              id: "member-one",
              name: "Thành viên 01",
              role: "Product & Presentation",
              summary: "Phụ trách mạch kể, chất lượng nội dung và trải nghiệm trình chiếu.",
              skills: ["Narrative", "UI/UX"],
              contributions: ["Thiết kế cấu trúc trình chiếu", "Đánh giá chất lượng hình ảnh"],
              accent: "cobalt",
              featured: true
            },
            {
              id: "member-two",
              name: "Thành viên 02",
              role: "Engineering",
              summary: "Phụ trách document model, renderer và các rào chắn validation.",
              skills: ["TypeScript", "Testing"],
              contributions: ["Xây dựng renderer", "Tự động hoá kiểm thử"],
              accent: "teal"
            }
          ]
        }
      };
    case "visualizer":
      return {
        id,
        type,
        props: {
          title: "Từ nền tảng đến kết quả",
          summary: "Một sơ đồ có cấu trúc giúp khán giả nhìn thấy quan hệ giữa các phần.",
          center: "Deckory",
          variant: "growth-tree",
          interaction: "inspect",
          animation: "grow",
          items: [
            { id: "foundation", label: "Nền tảng", description: "Mô hình tài liệu có kiểu dữ liệu", icon: "seed", tone: "cobalt" },
            { id: "system", label: "Hệ thống", description: "Bộ dựng và kiểm tra dữ liệu", icon: "system", tone: "teal", parentId: "foundation" },
            { id: "experience", label: "Trải nghiệm", description: "Thư viện, trình biên tập và chế độ trình chiếu", icon: "people", tone: "amber", parentId: "system", featured: true }
          ]
        }
      };
    case "weight-simulator":
      return {
        id,
        type,
        props: {
          title: "Mô phỏng trọng số đánh giá",
          description: "Điều chỉnh tỷ trọng để quan sát cách từng tiêu chí ảnh hưởng đến điểm tổng hợp.",
          dimensions: [
            { id: "evidence", label: "Minh chứng", score: 86, weight: 40, tone: "cobalt" },
            { id: "clarity", label: "Độ rõ ràng", score: 78, weight: 35, tone: "teal" },
            { id: "delivery", label: "Cách trình bày", score: 72, weight: 25, tone: "amber" }
          ],
          presets: [
            {
              id: "balanced",
              label: "Cân bằng",
              description: "Phân bổ tương đối đồng đều giữa minh chứng, độ rõ ràng và cách trình bày.",
              weights: { evidence: 40, clarity: 35, delivery: 25 }
            }
          ],
          disclaimer: "Kết quả chỉ mang tính minh hoạ; không dùng làm quyết định tự động."
        }
      };
    case "evidence-footer":
      return { id, type, props: { source: "Nguồn cần bổ sung" } };
  }
}
