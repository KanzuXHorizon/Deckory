import {
  createDeckFromTemplate,
  type CreateDeckFromTemplateInput
} from "@deckory/templates";

const input = {
  id: "template-gallery",
  title: "Deckory Template Intelligence — từ mục tiêu đến deck có cấu trúc",
  blueprintId: "professional-presentation",
  styleId: "modern-professional",
  slides: [
    {
      stepId: "opening",
      slots: {
        heading: {
          eyebrow: "DECKORY / TEMPLATE INTELLIGENCE",
          title: "Một template tốt không đóng khung câu chuyện.",
          emphasis: "Nó bảo vệ chất lượng.",
          description: "Style, recipe và blueprint giúp agent tạo deck nhanh hơn mà vẫn giữ contract, bằng chứng và visual grammar."
        },
        evidence: { source: "Deckory template-system specification / 2026" }
      },
      notes: "Mở bằng luận điểm: template là guardrail có cấu trúc, không phải một screenshot để sao chép."
    },
    {
      stepId: "problem",
      slots: {
        heading: { title: "Không có template intelligence, mỗi agent phải tự dựng lại cấu trúc." },
        statement: {
          quote: "Renderer ổn định vẫn chưa đủ nếu authoring luôn bắt đầu từ một trang trắng.",
          byline: "Khoảng trống trước khi có @deckory/templates"
        },
        evidence: { source: "Deckory product analysis — nhận định kiến trúc" }
      },
      notes: "Phân biệt engine render với intelligence chọn cấu trúc và visual phù hợp."
    },
    {
      stepId: "message",
      slots: {
        heading: { title: "Ba lớp độc lập giúp tái sử dụng mà không làm mọi deck giống nhau." },
        statement: {
          quote: "Style định nghĩa visual world. Recipe giải quyết một communication job. Blueprint tổ chức toàn bộ narrative.",
          byline: "Deckory template mental model"
        },
        evidence: { source: "Deckory Template Intelligence — system model" }
      },
      notes: "Nói chậm ba khái niệm và nhấn rằng chúng có thể kết hợp độc lập."
    },
    {
      stepId: "evidence",
      id: "catalog-coverage",
      slots: {
        heading: {
          eyebrow: "CATALOG COVERAGE",
          title: "Catalog đủ rộng để chọn theo mục tiêu, không theo cảm tính."
        },
        chart: {
          title: "Độ phủ template intelligence",
          unit: "số mục đã kiểm chứng",
          variant: "bar",
          showValues: true,
          values: [
            { label: "Visual styles", value: 6 },
            { label: "Slide recipes", value: 44, highlight: true },
            { label: "Deck blueprints", value: 10 },
            { label: "Blueprint integration", value: 10 }
          ]
        },
        insight: {
          label: "KẾT LUẬN",
          title: "Lựa chọn được giải thích bằng metadata và test.",
          description: "Search và recommendation đều deterministic; mọi blueprint phải sinh được DeckDocument hợp lệ.",
          metric: "44 recipes",
          tone: "teal"
        },
        evidence: { source: "Dữ liệu fixture minh hoạ / Deckory template validation" }
      },
      notes: "Các con số là coverage của fixture trong repo tại thời điểm tạo deck, không phải benchmark thị trường."
    },
    {
      stepId: "evidence",
      id: "shared-contract",
      recipeId: "product-mechanism",
      slots: {
        heading: {
          eyebrow: "MỘT SOURCE OF TRUTH",
          title: "Mọi bề mặt vẫn đọc cùng một DeckDocument đã kiểm chứng."
        },
        architecture: [
          { label: "INTENT", items: ["Scenario", "Audience", "Evidence", "Duration"] },
          { label: "TEMPLATE INTELLIGENCE", items: ["Style", "Recipe", "Blueprint"], accent: true },
          { label: "CONTRACT", items: ["validateTemplateInput", "createDeckFromTemplate", "validateDeck"] },
          { label: "SURFACES", items: ["Hub", "Studio", "Preview", "Presenter"] }
        ],
        evidence: { source: "Deckory architecture / headless template package" }
      },
      notes: "Nhấn rằng template package không chứa JSX, CSS hoặc renderer riêng."
    },
    {
      stepId: "comparison",
      slots: {
        heading: { title: "Template tăng tốc; Original mode dành cho quan hệ nội dung thật sự khác." },
        comparison: {
          left: {
            eyebrow: "COPY MẪU",
            title: "Template tĩnh",
            points: ["Nội dung và style bị dính", "Dễ lặp composition", "Khó kiểm tra slot"]
          },
          right: {
            eyebrow: "STRUCTURED",
            title: "Deckory",
            points: ["Style × Recipe × Blueprint", "Slot có giới hạn rõ", "Có Adaptive và Original mode"]
          }
        },
        evidence: { source: "Deckory design decision — headless hybrid template intelligence" }
      },
      notes: "Không phủ nhận thiết kế nguyên bản; giải thích khi nào agent nên đóng góp recipe mới."
    },
    {
      stepId: "plan",
      slots: {
        heading: { title: "Một authoring flow duy nhất đưa mục tiêu đến browser evidence." },
        process: [
          { title: "Đọc intent", note: "Xác định audience, outcome, evidence và thời lượng.", icon: "people" },
          { title: "Chọn cấu trúc", note: "Recommend blueprint, style và recipe theo metadata.", icon: "system" },
          { title: "Instantiate", note: "Điền semantic slots và tạo DeckDocument ổn định.", icon: "data" },
          { title: "Pre-flight", note: "Validate, browser-review và chạy quality gates.", icon: "sparkle" }
        ],
        evidence: { source: "Deckory template-system agent workflow" }
      },
      notes: "Mỗi bước tạo ra một bằng chứng có thể review, không có bước model đoán tùy ý."
    },
    {
      stepId: "recommendation",
      slots: {
        heading: { title: "Dùng catalog khi nó nói đúng; tạo recipe mới khi quan hệ nội dung chưa có." },
        comparison: {
          left: {
            eyebrow: "ADAPT",
            title: "Dùng catalog",
            points: ["Communication job đã rõ", "Slot constraints phù hợp", "Visual grammar đã được kiểm chứng"]
          },
          right: {
            eyebrow: "CONTRIBUTE",
            title: "Tạo recipe mới",
            points: ["Quan hệ nội dung chưa có", "Có contract và use/avoid rõ", "Có test và gallery evidence"]
          }
        },
        evidence: { source: "Deckory template contribution policy" }
      },
      notes: "Đây là nguyên tắc ngăn template proliferation và arbitrary JSX quay trở lại."
    },
    {
      stepId: "action",
      slots: {
        heading: {
          eyebrow: "NEXT",
          title: "Chọn nhanh hơn. Kiểm chứng sớm hơn.",
          emphasis: "Vẫn kể một câu chuyện riêng."
        },
        statement: {
          quote: "Template là điểm khởi đầu có chất lượng — không phải giới hạn của thiết kế.",
          byline: "Deckory"
        },
        evidence: { source: "@deckory/templates / gallery fixture" }
      },
      notes: "Kết thúc bằng lời hứa cụ thể của hệ thống template và chuyển sang demo catalog hoặc Studio."
    }
  ]
} satisfies CreateDeckFromTemplateInput;

const result = createDeckFromTemplate(input);
if (!result.ok) {
  throw new Error(result.diagnostics.map((item) => `${item.code}: ${item.message}`).join("\n"));
}

export const templateGalleryDeck = result.value;
