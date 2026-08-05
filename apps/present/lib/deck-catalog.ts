import { deckoryStory } from "@deckory/deckory-story";
import { templateGalleryDeck } from "@deckory/template-gallery";
import { defineDeck, type DeckDocument, type Slide } from "@deckory/schema";

const visualLab = defineDeck({
  id: "visual-lab",
  version: 1,
  title: "Visual Lab — thư viện kể chuyện bằng dữ liệu",
  locale: "vi-VN",
  themeId: "deckory-technical",
  theme: {
    preset: "technical-clean",
    accent: "teal",
    typography: "modern",
    density: "comfortable"
  },
  assets: [
    { id: "avatar-product", type: "image", src: "/team/avatar-product.svg", mediaType: "image/svg+xml", source: { label: "Deckory local fixture" } },
    { id: "avatar-design", type: "image", src: "/team/avatar-design.svg", mediaType: "image/svg+xml", source: { label: "Deckory local fixture" } },
    { id: "avatar-engineering", type: "image", src: "/team/avatar-engineering.svg", mediaType: "image/svg+xml", source: { label: "Deckory local fixture" } }
  ],
  slides: [
    {
      id: "cover",
      layout: "cover",
      variant: "technical",
      notes: "Dùng deck này để kiểm tra visual grammar và khả năng đọc của từng loại chart.",
      components: [
        {
          id: "heading",
          type: "heading",
          props: {
            eyebrow: "DECKORY VISUAL LAB",
            title: "Không cần thêm dữ liệu.",
            emphasis: "Cần chọn đúng hình thức.",
            description: "Một bộ fixture minh hoạ để kiểm tra chart, metric, insight và layout trước khi đưa dữ liệu thật vào deck."
          }
        },
        { id: "footer", type: "evidence-footer", props: { page: "01", source: "Dữ liệu minh hoạ / visual QA" } }
      ]
    },
    {
      id: "metrics",
      layout: "dashboard",
      variant: "spotlight",
      notes: "Metric chỉ nên xuất hiện khi mỗi con số trả lời một câu hỏi khác nhau.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "METRIC SYSTEM", title: "Ba tín hiệu. Ba vai trò khác nhau.", description: "Không dùng metric card như vật trang trí." } },
        { id: "metrics", type: "metric-grid", props: { metrics: [
          { value: "42", label: "deck đang hoạt động", note: "khối lượng cần quản lý", tone: "cobalt" },
          { value: "87%", label: "đã qua kiểm tra", note: "tín hiệu mức sẵn sàng", tone: "teal" },
          { value: "6", label: "cảnh báo cần xử lý", note: "ưu tiên trước khi present", tone: "amber" }
        ] }, sequence: 1 },
        { id: "insight", type: "insight", props: { label: "ĐIỂM CẦN NHỚ", title: "Tỷ lệ sẵn sàng quan trọng hơn tổng số deck.", description: "Metric tốt dẫn đến hành động, không chỉ tạo cảm giác hệ thống có nhiều dữ liệu.", metric: "87%", tone: "teal" }, sequence: 2 },
        { id: "footer", type: "evidence-footer", props: { page: "02", source: "Fixture minh hoạ" } }
      ]
    },
    {
      id: "bar-chart",
      layout: "data",
      notes: "Bar chart phù hợp khi mục tiêu là so sánh hạng mục.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "SO SÁNH", title: "Bar chart làm rõ khoảng cách giữa các hạng mục." } },
        { id: "chart", type: "chart", props: { title: "Điểm chất lượng theo tiêu chí", unit: "điểm / 100", variant: "bar", values: [
          { label: "Cấu trúc nội dung", value: 91 },
          { label: "Khả năng đọc", value: 84 },
          { label: "Visual hierarchy", value: 95, highlight: true },
          { label: "Khả năng tiếp cận", value: 88 }
        ] }, sequence: 1 },
        { id: "footer", type: "evidence-footer", props: { page: "03", source: "Fixture quality score" } }
      ]
    },
    {
      id: "line-chart",
      layout: "dashboard",
      variant: "quiet",
      notes: "Line chart chỉ dùng khi thứ tự trên trục thể hiện tiến trình hoặc thời gian.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "XU HƯỚNG", title: "Line chart cho thấy nhịp cải thiện qua từng vòng review." } },
        { id: "chart", type: "chart", props: { title: "Mức sẵn sàng sau mỗi vòng", unit: "điểm / 100", variant: "line", values: [
          { label: "Bản 1", value: 48 },
          { label: "Bản 2", value: 63 },
          { label: "Bản 3", value: 76 },
          { label: "Bản 4", value: 89, highlight: true }
        ] }, sequence: 1 },
        { id: "insight", type: "insight", props: { label: "KẾT LUẬN", title: "Hai vòng cuối tạo ra phần lớn mức tăng chất lượng.", description: "Đây là fixture minh hoạ cách đặt conclusion cạnh chart.", metric: "+41", tone: "cobalt" }, sequence: 2 },
        { id: "footer", type: "evidence-footer", props: { page: "04", source: "Fixture review cycle" } }
      ]
    },
    {
      id: "area-chart",
      layout: "data",
      variant: "technical",
      notes: "Area chart nhấn mạnh quy mô tích luỹ, không chỉ đường đi của dữ liệu.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "QUY MÔ", title: "Area chart nhấn vào phần khối lượng đã được bao phủ." } },
        { id: "chart", type: "chart", props: { title: "Slide đã được audit", unit: "slide", variant: "area", values: [
          { label: "09:00", value: 8 },
          { label: "10:00", value: 17 },
          { label: "11:00", value: 31 },
          { label: "12:00", value: 46, highlight: true }
        ] }, sequence: 1 },
        { id: "footer", type: "evidence-footer", props: { page: "05", source: "Fixture audit throughput" } }
      ]
    },
    {
      id: "donut-chart",
      layout: "dashboard",
      variant: "spotlight",
      notes: "Donut chart chỉ dùng cho thành phần của một tổng có ít nhóm.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "CƠ CẤU", title: "Donut chart chỉ hiệu quả khi tổng và thành phần đều rõ." } },
        { id: "chart", type: "chart", props: { title: "Cơ cấu slide theo mục đích", unit: "slide", variant: "donut", values: [
          { label: "Luận điểm", value: 9, highlight: true },
          { label: "Dữ liệu", value: 7 },
          { label: "Quy trình", value: 4 },
          { label: "Kết luận", value: 2 }
        ] }, sequence: 1 },
        { id: "footer", type: "evidence-footer", props: { page: "06", source: "Fixture content mix" } }
      ]
    },
    {
      id: "table-evidence",
      layout: "data",
      variant: "technical",
      notes: "Table phù hợp khi người xem cần đối chiếu chính xác nhiều thuộc tính cùng lúc.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "BẰNG CHỨNG CÓ CẤU TRÚC", title: "Table giữ độ chính xác khi chart không đủ chi tiết." } },
        { id: "table", type: "table", props: { title: "Phạm vi visual system", columns: ["Thành phần", "Trạng thái", "Mục đích"], rows: [
          { cells: ["Chart", "Hoàn thiện", "So sánh và xu hướng"], highlight: true },
          { cells: ["Table", "Hoàn thiện", "Đối chiếu chính xác"] },
          { cells: ["Code", "Hoàn thiện", "Bằng chứng kỹ thuật"] },
          { cells: ["Insight", "Hoàn thiện", "Kết luận hành động"] }
        ], note: "Fixture minh hoạ cho visual QA." }, sequence: 1 },
        { id: "footer", type: "evidence-footer", props: { page: "07", source: "Deckory component inventory" } }
      ]
    },
    {
      id: "code-evidence",
      layout: "architecture",
      variant: "technical",
      notes: "Code block dùng cho đoạn bằng chứng ngắn; không biến slide thành màn hình IDE.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "TECHNICAL PROOF", title: "Code block trình bày cơ chế có thể kiểm chứng." } },
        { id: "code", type: "code", props: { title: "Validation trước khi present", language: "typescript", code: "const result = validateDeck(draft);\nif (!result.ok) {\n  return showDiagnostics(result.diagnostics);\n}\nopenPreview(result.deck);", caption: "Chỉ document hợp lệ mới được coi là sẵn sàng preview.", showLineNumbers: true, highlightLines: [1, 2, 5] }, sequence: 1 },
        { id: "footer", type: "evidence-footer", props: { page: "08", source: "Deckory validation flow" } }
      ]
    },
    {
      id: "team-showcase",
      layout: "process",
      variant: "quiet",
      notes: "Team showcase cần làm rõ trách nhiệm và đóng góp, không chỉ đặt ảnh chân dung cạnh nhau.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "PEOPLE & OWNERSHIP", title: "Một đội ngũ chuyên nghiệp được hiểu qua trách nhiệm rõ ràng." } },
        { id: "team", type: "team-showcase", props: {
          project: "DECKORY PRODUCT TEAM",
          title: "Vai trò khác nhau. Một tiêu chuẩn chất lượng.",
          subtitle: "Fixture minh hoạ cách trình bày thành viên, năng lực và đóng góp trong cùng một visual grammar.",
          variant: "editorial",
          members: [
            { id: "narrative-lead", name: "Narrative Lead", role: "Product & Story", summary: "Chuyển dữ liệu thô thành mạch kể có kết luận rõ.", skills: ["Narrative", "UX Writing"], contributions: ["Định hình story arc", "Review chất lượng nội dung"], image: { assetId: "avatar-product", alt: "Chân dung minh hoạ Narrative Lead", position: "top" }, accent: "cobalt", featured: true },
            { id: "visual-lead", name: "Visual Lead", role: "Design System", summary: "Giữ hierarchy, typography và khả năng đọc nhất quán.", skills: ["Visual Design", "Accessibility"], contributions: ["Xây visual grammar", "Audit responsive"], image: { assetId: "avatar-design", alt: "Chân dung minh hoạ Visual Lead", position: "top" }, accent: "teal" },
            { id: "engine-lead", name: "Engine Lead", role: "Presentation Engineering", summary: "Đảm bảo schema, renderer và runtime cùng một source of truth.", skills: ["TypeScript", "Testing"], contributions: ["Typed renderer", "Validation và browser QA"], image: { assetId: "avatar-engineering", alt: "Chân dung minh hoạ Engine Lead", position: "top" }, accent: "amber" }
          ]
        }, sequence: 1 },
        { id: "footer", type: "evidence-footer", props: { page: "09", source: "Fixture team showcase" } }
      ]
    },
    {
      id: "growth-visualizer",
      layout: "data",
      variant: "spotlight",
      notes: "Visualizer dùng khi quan hệ giữa các nút là nội dung chính, không phải trang trí nền.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "RELATIONSHIP VISUAL", title: "Một visualizer tốt cho thấy điều gì dẫn đến điều gì." } },
        { id: "visualizer", type: "visualizer", props: {
          title: "Từ source of truth đến trải nghiệm",
          summary: "Cây tăng trưởng minh hoạ quan hệ cha–con giữa document model, quality engine và các bề mặt sản phẩm.",
          center: "Deckory AST",
          variant: "growth-tree",
          interaction: "inspect",
          animation: "grow",
          items: [
            { id: "schema", label: "Schema", value: "Typed", description: "Contract dữ liệu ổn định", icon: "seed", tone: "cobalt" },
            { id: "quality", label: "Quality engine", value: "Validated", description: "Chặn lỗi trước khi trình chiếu", icon: "sparkle", tone: "teal", parentId: "schema" },
            { id: "studio", label: "Studio", description: "Chỉnh nội dung có guardrail", icon: "system", tone: "amber", parentId: "quality" },
            { id: "presenter", label: "Presenter", description: "Trình chiếu ổn định và accessible", icon: "people", tone: "teal", parentId: "quality", featured: true }
          ]
        }, sequence: 1 },
        { id: "footer", type: "evidence-footer", props: { page: "10", source: "Fixture relationship visual" } }
      ]
    },
    {
      id: "closing",
      layout: "closing",
      notes: "Kết thúc visual lab bằng nguyên tắc chọn hình thức trước khi trang trí.",
      components: [
        { id: "heading", type: "heading", props: { eyebrow: "VISUAL GRAMMAR", title: "Chọn visual theo quan hệ cần giải thích.", emphasis: "Không theo hiệu ứng đang có.", description: "Deckory giữ chart, layout và narrative cùng trong một contract có thể kiểm tra." } },
        { id: "footer", type: "evidence-footer", props: { page: "11", source: "Deckory visual system" } }
      ]
    }
  ]
});

export type DeckCatalogItem = {
  deck: DeckDocument;
  description: string;
  status: "ready" | "draft";
  updatedLabel: string;
  tags: string[];
};

export const deckCatalog: DeckCatalogItem[] = [
  {
    deck: deckoryStory,
    description: "Deck sản phẩm tham chiếu, trình bày thesis và kiến trúc của Deckory.",
    status: "ready",
    updatedLabel: "Bản tham chiếu",
    tags: ["Product story", "Architecture", "Pitch"]
  },
  {
    deck: visualLab,
    description: "Bộ fixture để kiểm tra chart, metric, insight và visual grammar.",
    status: "ready",
    updatedLabel: "Visual QA",
    tags: ["Charts", "Data story", "Component lab"]
  },
  {
    deck: templateGalleryDeck,
    description: "Deck được instantiate hoàn toàn từ style, recipe và blueprint của @deckory/templates.",
    status: "ready",
    updatedLabel: "Template system",
    tags: ["Templates", "Blueprints", "Agent authoring"]
  }
];

export const defaultDeck = deckCatalog[0]!.deck;

export function resolveDeck(deckId?: string | null): DeckDocument {
  return deckCatalog.find((item) => item.deck.id === deckId)?.deck ?? defaultDeck;
}

export function resolveCatalogItem(deckId?: string | null): DeckCatalogItem {
  return deckCatalog.find((item) => item.deck.id === deckId) ?? deckCatalog[0]!;
}

export function cloneDeck(deck: DeckDocument): DeckDocument {
  return JSON.parse(JSON.stringify(deck)) as DeckDocument;
}

export function slideTitle(slide: Slide): string {
  const heading = slide.components.find((component) => component.type === "heading");
  if (heading?.type === "heading") return heading.props.title;
  const statement = slide.components.find((component) => component.type === "statement");
  if (statement?.type === "statement") return statement.props.quote;
  return slide.id;
}

export const visualCoverage = [
  { label: "Layouts", value: "9", note: "cover đến closing" },
  { label: "Components", value: "13", note: "semantic và typed" },
  { label: "Charts", value: "4", note: "bar, line, area, donut" },
  { label: "Themes", value: "3", note: "editorial và technical" }
] as const;
