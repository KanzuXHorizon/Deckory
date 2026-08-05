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
      id: "team-showcase",
      layout: "data",
      transition: { type: "wipe", duration: 0.5, easing: "emphasized" },
      notes: "Chuyển từ quy trình sang con người vận hành quy trình. Nhấn rằng tên là trường bắt buộc duy nhất; ảnh, vai trò, MSSV, kỹ năng và đóng góp xuất hiện khi có dữ liệu thật. Hồ sơ trên slide là dữ liệu minh hoạ, không phải danh sách thành viên thực tế.",
      components: [
        {
          id: "heading",
          type: "heading",
          props: {
            eyebrow: "CON NGƯỜI TẠO NÊN CHẤT LƯỢNG",
            title: "Mỗi thành viên có một vai trò rõ ràng.",
            description: "Một component thích ứng với hồ sơ đầy đủ, dữ liệu tối giản hoặc đội ngũ có quy mô khác nhau."
          }
        },
        {
          id: "team",
          type: "team-showcase",
          sequence: 1,
          effect: { type: "rise", duration: 0.46 },
          props: {
            project: "HỒ SƠ ĐỘI NGŨ MINH HOẠ",
            subtitle: "Chọn từng thành viên để xem trách nhiệm, kỹ năng và đóng góp khi trình chiếu.",
            variant: "editorial",
            members: [
              {
                id: "product-lead",
                name: "Nguyễn Thái Vân",
                role: "Product & Presentation Lead",
                summary: "Định hướng sản phẩm, mạch kể và tiêu chuẩn chất lượng cho toàn bộ trải nghiệm Deckory.",
                skills: ["Product", "Storytelling", "UX Direction"],
                contributions: ["Xác lập product thesis", "Review narrative và visual quality"],
                image: { src: "/team/avatar-product.svg", alt: "Chân dung minh hoạ trưởng nhóm sản phẩm", position: "top" },
                accent: "cobalt",
                featured: true
              },
              {
                id: "visual-designer",
                name: "Thành viên 02",
                role: "Visual Systems Designer",
                studentId: "PS00002 · minh hoạ",
                summary: "Chuẩn hoá composition, motion grammar và cách dữ liệu trở thành visual có ý nghĩa.",
                skills: ["Visual Design", "Motion"],
                image: { src: "/team/avatar-design.svg", alt: "Chân dung minh hoạ thành viên thiết kế", position: "center" },
                accent: "teal"
              },
              {
                id: "frontend-engineer",
                name: "Thành viên 03",
                role: "Frontend Engineer",
                contributions: ["Renderer dùng chung", "Keyboard và reduced motion", "Automated quality gates"],
                image: { src: "/team/avatar-engineering.svg", alt: "Chân dung minh hoạ thành viên kỹ thuật", position: "top" },
                accent: "amber"
              },
              {
                id: "research-member",
                name: "Thành viên 04",
                skills: ["Research", "Evidence"],
                accent: "neutral"
              }
            ]
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "07", source: "Dữ liệu thành viên và chân dung minh hoạ; thay bằng hồ sơ dự án thực tế" }
        }
      ]
    },
    {
      id: "team-member-profile",
      layout: "data",
      transition: { type: "morph", duration: 0.52, easing: "emphasized" },
      notes: "Đây là ví dụ cho chế độ mỗi thành viên một slide. Ảnh và hồ sơ đều là dữ liệu minh hoạ; layout vẫn hoạt động khi bỏ ảnh, MSSV, kỹ năng hoặc liên kết.",
      components: [
        {
          id: "heading",
          type: "heading",
          morphId: "team-member-title",
          props: {
            eyebrow: "HỒ SƠ THÀNH VIÊN MINH HOẠ",
            title: "Thành viên 02",
            description: "Visual Systems Designer"
          }
        },
        {
          id: "profile",
          type: "team-showcase",
          sequence: 1,
          effect: { type: "wipe", duration: 0.44 },
          props: {
            project: "DECKORY / TEAM PROFILE",
            variant: "profile",
            members: [{
              id: "visual-designer-profile",
              name: "Thành viên 02",
              role: "Visual Systems Designer",
              studentId: "PS00002 · minh hoạ",
              summary: "Chuyển dữ liệu thô thành bố cục có hierarchy, xây motion grammar có mục đích và bảo đảm visual giữ được ý nghĩa ở cả full slide lẫn thumbnail.",
              skills: ["Visual Design", "Motion", "Data Storytelling", "Design QA"],
              contributions: [
                "Thiết kế composition system",
                "Chuẩn hoá motion và reduced motion",
                "Review overflow, contrast và typography",
                "Xây visual preset tái sử dụng"
              ],
              links: [
                { label: "Portfolio minh hoạ", href: "https://example.com/portfolio" }
              ],
              image: { src: "/team/avatar-design.svg", alt: "Chân dung minh hoạ thành viên thiết kế", position: "center" },
              accent: "teal"
            }]
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "08", source: "Hồ sơ và liên kết minh hoạ; thay bằng dữ liệu thành viên thực tế" }
        }
      ]
    },
    {
      id: "semantic-growth",
      layout: "process",
      transition: { type: "morph", duration: 0.58, easing: "emphasized" },
      notes: "Cây không chỉ trang trí: đường thân thể hiện tính liên tục, nhánh thể hiện quan hệ phụ thuộc và từng nút mở phần giải thích. Thử click hoặc dùng bàn phím; với reduced motion, cây xuất hiện ngay ở trạng thái hoàn chỉnh.",
      components: [
        {
          id: "heading",
          type: "heading",
          props: {
            eyebrow: "MOTION CÓ NGỮ NGHĨA",
            title: "Sản phẩm trưởng thành từ những lớp năng lực nối tiếp.",
            description: "SVG path drawing giải thích tiến trình; tương tác cho phép khán giả khám phá từng cột mốc mà không rời slide."
          }
        },
        {
          id: "growth-tree",
          type: "visualizer",
          sequence: 1,
          effect: { type: "wipe", duration: 0.48 },
          props: {
            center: "Sẵn sàng trình bày",
            variant: "growth-tree",
            interaction: "inspect",
            animation: "grow",
            items: [
              { id: "idea", label: "Ý tưởng", description: "Xác định vấn đề, khán giả và kết quả cần tạo ra.", value: "01", icon: "seed", tone: "amber" },
              { id: "structure", label: "Cấu trúc", description: "Biến nội dung thành document model có type và có thể kiểm tra.", value: "02", icon: "data", parentId: "idea", tone: "cobalt" },
              { id: "visual-system", label: "Visual system", description: "Dùng layout, component và motion grammar nhất quán.", value: "03", icon: "sparkle", parentId: "structure", tone: "cobalt" },
              { id: "interaction", label: "Tương tác", description: "Cho phép inspect, step và focus bằng bàn phím ngay trong slide.", value: "04", icon: "people", parentId: "visual-system", tone: "teal" },
              { id: "quality-gates", label: "Quality gates", description: "Validation, reduced motion, screenshot review và build bảo vệ đầu ra.", value: "05", icon: "system", parentId: "interaction", tone: "teal", featured: true }
            ]
          }
        },
        {
          id: "footer",
          type: "evidence-footer",
          props: { page: "09", source: "Mô hình phát triển minh hoạ / Deckory semantic visualizer" }
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
          props: { page: "10", source: "Core architecture / current MVP boundary" }
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
          props: { page: "11", source: "Automated structural and browser audit" }
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
          props: { page: "12", source: "deckory / engine & present" }
        }
      ]
    }
  ]
});
