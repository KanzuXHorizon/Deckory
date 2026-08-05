import { defineDeck } from "@deckory/schema";

export const deckoryStory = defineDeck({
  id: "deckory-story",
  version: 1,
  title: "Deckory — biến dữ liệu thành một câu chuyện rõ",
  locale: "vi-VN",
  themeId: "deckory-editorial",
  theme: {
    preset: "editorial-light",
    accent: "cobalt",
    typography: "editorial",
    density: "comfortable"
  },
  slides: [
    {
      id: "cover",
      layout: "cover",
      variant: "spotlight",
      transition: { type: "fade", duration: 0.34 },
      notes: "Mở đầu bằng vấn đề: slide không nên là nơi cất chữ; nó phải giúp khán giả nhìn thấy cấu trúc.",
      components: [
        {
          id: "heading",
          type: "heading",
          morphId: "story-focus",
          effect: { type: "fade", duration: 0.42 },
          props: {
            eyebrow: "DECKORY / ENGINE + PRESENT",
            title: "Mọi bài thuyết trình tốt đều bắt đầu bằng một",
            emphasis: "cấu trúc rõ ràng.",
            description: "Deckory là presentation engine code-native để người viết, designer và coding agent cùng tạo một câu chuyện có thể kiểm chứng."
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "01", source: "Deckory product narrative / 2026" }
        }
      ]
    },
    {
      id: "problem",
      layout: "statement",
      variant: "quiet",
      transition: { type: "morph", duration: 0.58, easing: "emphasized" },
      notes: "Phân biệt việc đưa dữ liệu lên slide với việc biến dữ liệu thành một quyết định dễ hiểu.",
      components: [
        {
          id: "statement",
          type: "statement",
          morphId: "story-focus",
          effect: { type: "blur", duration: 0.4 },
          props: {
            quote: "Dữ liệu thô không thuyết phục. Mạch kể, ngữ cảnh và một điểm nhấn đúng lúc mới thuyết phục.",
            byline: "Nguyên tắc thiết kế Deckory"
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "02", source: "Narrative-first visual grammar" }
        }
      ]
    },
    {
      id: "signal",
      layout: "dashboard",
      transition: { type: "zoom", duration: 0.42 },
      notes: "Ba con số dưới đây là dữ liệu minh hoạ để chứng minh cách metric composition kể chuyện tốt hơn bảng thô.",
      components: [
        {
          id: "heading",
          type: "heading",
          effect: { type: "rise", duration: 0.34 },
          props: {
            eyebrow: "TỪ TÍN HIỆU THÔ",
            title: "Chỉ giữ lại điều giúp khán giả",
            emphasis: "ra quyết định."
          }
        },
        {
          id: "metrics",
          type: "metric-grid",
          sequence: 1,
          effect: { type: "pop", duration: 0.38 },
          props: {
            metrics: [
              { value: "68%", label: "ít thời gian xử lý dữ liệu hơn", note: "khi visual grammar đã có cấu trúc", tone: "cobalt" },
              { value: "3×", label: "nhanh hơn để nhận ra mạch kể", note: "nhờ hierarchy và annotation rõ", tone: "teal" },
              { value: "0", label: "lỗi overflow được chấp nhận", note: "audit phải chặn trước khi trình chiếu", tone: "amber" }
            ]
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "03", source: "Số liệu fixture minh hoạ — không phải benchmark sản phẩm" }
        }
      ]
    },
    {
      id: "data-story",
      layout: "data",
      variant: "spotlight",
      transition: { type: "wipe", duration: 0.5 },
      notes: "Đọc kết luận trước, sau đó dùng biểu đồ để chứng minh. Điểm số chỉ là fixture minh hoạ.",
      components: [
        {
          id: "heading",
          type: "heading",
          props: {
            eyebrow: "VISUAL HOÁ CÓ MỤC ĐÍCH",
            title: "Từ bảng hoạt động sang",
            emphasis: "tín hiệu dễ nhớ."
          }
        },
        {
          id: "chart",
          type: "chart",
          sequence: 1,
          effect: { type: "wipe", duration: 0.52 },
          props: {
            title: "Mức độ sẵn sàng của một deck",
            unit: "điểm chất lượng / 100",
            values: [
              { label: "Nội dung có cấu trúc", value: 92, highlight: true },
              { label: "Khả năng đọc", value: 88 },
              { label: "Khả năng tiếp cận", value: 96, highlight: true },
              { label: "Fidelity khi xuất", value: 84 }
            ]
          }
        },
        {
          id: "insight",
          type: "insight",
          sequence: 2,
          effect: { type: "pop", duration: 0.34 },
          props: {
            label: "KẾT LUẬN",
            metric: "96/100",
            title: "Khả năng tiếp cận đang dẫn đầu.",
            description: "Visual chỉ được xem là hoàn thiện khi keyboard, contrast và reduced motion cùng hoạt động.",
            tone: "teal"
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "04", source: "Fixture quality score — dữ liệu minh hoạ" }
        }
      ]
    },
    {
      id: "difference",
      layout: "comparison",
      transition: { type: "slide", duration: 0.4 },
      notes: "So sánh trực tiếp hai mô hình tạo deck mà không biến slide thành bảng dài.",
      components: [
        {
          id: "heading",
          type: "heading",
          props: {
            eyebrow: "KHÁC BIỆT CỐT LÕI",
            title: "Không phải thêm AI vào PowerPoint.",
            description: "Deckory cung cấp một document model chung cho người, code và các renderer."
          }
        },
        {
          id: "comparison",
          type: "comparison",
          sequence: 1,
          effect: { type: "wipe", duration: 0.44 },
          props: {
            left: {
              eyebrow: "FILE-BASED",
              title: "Slide truyền thống",
              points: ["Sao chép thủ công", "Khó review theo cấu trúc", "Lỗi thường chỉ phát hiện bằng mắt"]
            },
            right: {
              eyebrow: "STRUCTURED",
              title: "Deckory",
              points: ["Component tái sử dụng", "Validation trước khi present", "Agent và UI cùng dùng một AST"]
            }
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "05", source: "Deckory product thesis" }
        }
      ]
    },
    {
      id: "flow",
      layout: "process",
      transition: { type: "push", duration: 0.48 },
      notes: "Mỗi bước là một quality gate; coding agent không được bỏ qua validation hoặc visual audit.",
      components: [
        {
          id: "heading",
          type: "heading",
          props: {
            eyebrow: "MỘT FLOW NHẤT QUÁN",
            title: "Dữ liệu vào, mạch kể rõ,",
            emphasis: "trình chiếu tự tin."
          }
        },
        {
          id: "process",
          type: "process",
          sequence: 1,
          effect: { type: "rise", duration: 0.42 },
          props: {
            steps: [
              { title: "Khai báo", note: "Viết nội dung bằng DSL có type.", icon: "data" },
              { title: "Cấu trúc", note: "Layout áp dụng visual grammar phù hợp.", icon: "system" },
              { title: "Kiểm tra", note: "Audit density, contrast và overflow.", icon: "sparkle" },
              { title: "Trình chiếu", note: "Present ổn định bằng keyboard và fullscreen.", icon: "people" }
            ]
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "06", source: "Deckory authoring pipeline" }
        }
      ]
    },
    {
      id: "architecture",
      layout: "architecture",
      variant: "technical",
      transition: { type: "slide", duration: 0.42 },
      notes: "AST nằm ở trung tâm để editor, collaboration và exporter sau này không phải đoán mã JSX tùy ý.",
      components: [
        {
          id: "heading",
          type: "heading",
          props: {
            eyebrow: "ENGINE CÓ THỂ PHÁT TRIỂN",
            title: "Một AST. Nhiều trải nghiệm.",
            description: "Browser renderer là consumer đầu tiên, không phải nơi chứa business rule của deck."
          }
        },
        {
          id: "architecture",
          type: "architecture",
          sequence: 1,
          effect: { type: "wipe", duration: 0.46 },
          props: {
            layers: [
              { label: "AUTHORING", items: ["TypeScript DSL", "Structured Studio"] },
              { label: "SOURCE OF TRUTH", items: ["Versioned Slide AST"], accent: true },
              { label: "OUTPUT", items: ["Browser Present", "Audit", "Future Export"] }
            ]
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "07", source: "Core architecture / current MVP boundary" }
        }
      ]
    },
    {
      id: "quality",
      layout: "split",
      transition: { type: "fade", duration: 0.3 },
      notes: "Nhấn rằng visual polish không thay thế được quality gate kỹ thuật.",
      components: [
        {
          id: "heading",
          type: "heading",
          morphId: "closing-title",
          effect: { type: "rise", duration: 0.34 },
          props: {
            eyebrow: "QUALITY ENGINE",
            title: "Đẹp là điều kiện cần. Không lỗi mới là điều kiện đủ.",
            description: "Deckory kiểm tra trước khi bạn đứng trước khán giả."
          }
        },
        {
          id: "metrics",
          type: "metric-grid",
          sequence: 1,
          effect: { type: "pop", duration: 0.36 },
          props: {
            metrics: [
              { value: "AA", label: "contrast target", note: "màu và text được kiểm soát", tone: "teal" },
              { value: "16:9", label: "safe canvas", note: "không reflow phá bố cục", tone: "cobalt" },
              { value: "⌨", label: "keyboard-first", note: "trình chiếu không phụ thuộc chuột", tone: "amber" }
            ]
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "08", source: "Automated structural and browser audit" }
        }
      ]
    },
    {
      id: "closing",
      layout: "closing",
      variant: "spotlight",
      transition: { type: "morph", duration: 0.62, easing: "emphasized" },
      notes: "Kết thúc bằng lời hứa sản phẩm cụ thể, không dùng slogan mơ hồ.",
      components: [
        {
          id: "heading",
          type: "heading",
          morphId: "closing-title",
          effect: { type: "scale", duration: 0.4 },
          props: {
            eyebrow: "NEXT",
            title: "Kể một câu chuyện có cấu trúc.",
            emphasis: "Không chỉ xếp slide.",
            description: "Engine + Present là nền tảng; editor, collaboration và export sẽ tiếp tục dùng chung document model đã được kiểm chứng."
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "09", source: "deckory / engine & present" }
        }
      ]
    }
  ]
});
