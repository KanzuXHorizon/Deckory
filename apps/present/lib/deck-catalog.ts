import { deckoryStory } from "@deckory/deckory-story";
import { myInterviewDefense } from "@deckory/myinterview-defense";
import { templateGalleryDeck } from "@deckory/template-gallery";
import {
  auditDeckV2,
  scoreDeckQuality,
  scoreDeckV2,
  type DeckQualityScorecard
} from "@deckory/audit";
import { defineDeck, SUPPORTED_COMPONENT_TYPES, type DeckDocument, type DeckDocumentV2, type Slide } from "@deckory/schema";
import type { AnyDeckDocument } from "./deck-version";

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
  quality: DeckQualityScorecard;
};

export const deckCatalog: DeckCatalogItem[] = [
  {
    deck: myInterviewDefense,
    description: "Deck bảo vệ dự án tốt nghiệp AI Technical Interviewer của nhóm NEXUS.",
    status: "ready",
    updatedLabel: "Summer 2026",
    tags: ["Academic defense", "MyInterview", "AI"],
    quality: scoreDeckQuality(myInterviewDefense)
  },
  {
    deck: deckoryStory,
    description: "Deck sản phẩm tham chiếu, trình bày thesis và kiến trúc của Deckory.",
    status: "ready",
    updatedLabel: "Bản tham chiếu",
    tags: ["Product story", "Architecture", "Pitch"],
    quality: scoreDeckQuality(deckoryStory)
  },
  {
    deck: visualLab,
    description: "Bộ fixture để kiểm tra chart, metric, insight và visual grammar.",
    status: "ready",
    updatedLabel: "Visual QA",
    tags: ["Charts", "Data story", "Component lab"],
    quality: scoreDeckQuality(visualLab)
  },
  {
    deck: templateGalleryDeck,
    description: "Deck được instantiate hoàn toàn từ style, recipe và blueprint của @deckory/templates.",
    status: "ready",
    updatedLabel: "Template system",
    tags: ["Templates", "Blueprints", "Agent authoring"],
    quality: scoreDeckQuality(templateGalleryDeck)
  }
];

export const sceneFoundationDeck: DeckDocumentV2 = {
  schemaVersion: 2,
  id: "scene-foundation",
  revision: 1,
  title: "Deckory V2 Scene Foundation",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  visualIntelligence: {
    narrative: {
      audience: { role: "Đội ngũ xây dựng Deckory", knowledgeLevel: "expert", needs: ["Contract rõ", "Bằng chứng chạy thật"] },
      decisionOrOutcome: "Chấp thuận Scene V2 làm nền tảng cho Studio và visual intelligence.",
      timeBudgetMinutes: 4,
      thesis: "Một document có type, evidence và renderer dùng chung tạo ra slide vừa tuỳ biến vừa kiểm chứng được.",
      sections: [{
        id: "foundation-proof",
        role: "proof",
        objective: "Chứng minh scene, chart, diagram và evidence dùng chung một contract.",
        slideIds: ["cover", "visual-proof", "assistant-proof"]
      }],
      unresolvedQuestions: []
    },
    evidence: {
      sources: [{ id: "scene-fixture-source", kind: "manual", label: "Deckory V2 local integration fixture", status: "verified" }],
      evidence: [{ id: "quality-score-evidence", sourceId: "scene-fixture-source", label: "Kết quả fixture visual renderer", unit: "điểm / 100" }],
      claims: [{
        id: "visual-hierarchy-claim",
        text: "Visual hierarchy dẫn đầu fixture với 95 điểm.",
        slideId: "visual-proof",
        elementId: "quality-chart",
        evidenceIds: ["quality-score-evidence"],
        status: "supported"
      }],
      datasets: [{
        id: "quality-score-data",
        label: "Điểm chất lượng fixture",
        sourceIds: ["scene-fixture-source"],
        status: "verified",
        columns: [
          { key: "category", label: "Tiêu chí", type: "string" },
          { key: "value", label: "Điểm", type: "number" }
        ],
        rows: [
          { category: "Layout", value: 88 },
          { category: "Visual hierarchy", value: 95 },
          { category: "Accessibility", value: 91 }
        ]
      }],
      visualBindings: [{
        id: "quality-chart-binding",
        kind: "chart",
        slideId: "visual-proof",
        elementId: "quality-chart",
        datasetId: "quality-score-data",
        claimIds: ["visual-hierarchy-claim"]
      }]
    }
  },
  slides: [{
    id: "cover",
    name: "Scene Foundation",
    purpose: "technical-proof",
    conclusion: "Một scene graph dùng chung cho mọi bề mặt.",
    notes: "Chuyển từ V1 sang luận điểm nền tảng: mọi bề mặt phải đọc cùng một document. Nhấn mạnh đây là fixture tích hợp cục bộ, không phải benchmark hiệu năng. Kết bằng câu hỏi: contract này có giữ được chart, diagram và evidence không?",
    background: { layers: [{ id: "paper", type: "solid", color: "#f7f7f4", opacity: 1 }] },
    evidence: { source: "Deckory V2 Scene Foundation fixture", status: "illustrative" },
    elements: [
      {
        id: "eyebrow",
        name: "Eyebrow",
        kind: "text",
        frame: { x: 76, y: 72, width: 600, height: 36 },
        zIndex: 1,
        content: { text: "DECKORY V2 · SCENE FOUNDATION" },
        style: { color: "#4f46e5", fontSize: 18, fontWeight: 700, letterSpacing: 1.4 },
        accessibility: { label: "Deckory V2 Scene Foundation", readingOrder: 1 }
      },
      {
        id: "title",
        name: "Title",
        kind: "text",
        frame: { x: 76, y: 132, width: 850, height: 180 },
        zIndex: 2,
        content: { text: "Một scene graph dùng chung cho mọi bề mặt." },
        style: { color: "#17191c", fontSize: 62, fontWeight: 750, lineHeight: 1.05 },
        accessibility: { label: "Một scene graph dùng chung cho mọi bề mặt.", readingOrder: 2 }
      },
      {
        id: "proof",
        name: "Proof",
        kind: "shape",
        frame: { x: 76, y: 388, width: 1128, height: 176 },
        zIndex: 1,
        content: { shape: "rectangle" },
        style: { fill: "#ffffff", stroke: "#d8dad6", strokeWidth: 1, borderRadius: 20 },
        accessibility: { decorative: true }
      },
      {
        id: "summary",
        name: "Summary",
        kind: "text",
        frame: { x: 112, y: 426, width: 1048, height: 96 },
        zIndex: 3,
        content: { text: "V1 vẫn hoạt động. V2 có tọa độ rõ ràng, validation, migration và renderer dùng chung cho Preview, Presenter, Studio và Export." },
        style: { color: "#454a51", fontSize: 28, fontWeight: 550, lineHeight: 1.35 },
        accessibility: { label: "V1 vẫn hoạt động. V2 có tọa độ rõ ràng, validation, migration và renderer dùng chung.", readingOrder: 3 }
      },
      {
        id: "footer",
        name: "Evidence footer",
        kind: "evidence-footer",
        frame: { x: 76, y: 664, width: 1128, height: 28 },
        zIndex: 4,
        content: { source: "Deckory V2 Scene Foundation fixture", page: "01" },
        accessibility: { label: "Nguồn: Deckory V2 Scene Foundation fixture", readingOrder: 4 }
      }
    ]
  }, {
    id: "visual-proof",
    name: "Visual Intelligence Proof",
    purpose: "evidence-and-architecture",
    conclusion: "Typed chart, diagram và evidence cùng đi qua shared renderer.",
    notes: "Đọc kết luận trước, sau đó chỉ vào chart và diagram như hai proof khác nhau của cùng contract. Nêu rõ điểm số là fixture local có source và dataset lineage, không phải claim thị trường. Chuyển sang slide sau bằng vấn đề còn lại: biến text thô thành visual mà không làm mất nguồn gốc.",
    background: {
      layers: [
        { id: "visual-paper", type: "solid", color: "#f7f7f4", opacity: 1 },
        { id: "visual-grid", type: "grid", color: "#d9ddd8", opacity: 0.22, data: { size: 32, lineWidth: 1 } }
      ]
    },
    evidence: { source: "Deckory V2 local integration fixture", status: "verified", sourceIds: ["scene-fixture-source"] },
    elements: [
      {
        id: "visual-title",
        name: "Visual title",
        kind: "text",
        frame: { x: 68, y: 48, width: 1120, height: 72 },
        zIndex: 3,
        content: { text: "Typed visuals giữ cả kết luận, dữ liệu và quan hệ." },
        style: { color: "#17191c", fontSize: 38, fontWeight: 760, lineHeight: 1.08 },
        accessibility: { label: "Typed visuals giữ cả kết luận, dữ liệu và quan hệ.", readingOrder: 1 }
      },
      {
        id: "quality-chart",
        name: "Quality chart",
        kind: "chart",
        frame: { x: 68, y: 148, width: 548, height: 460 },
        zIndex: 2,
        content: {
          chart: {
            question: "Tiêu chí nào đang dẫn đầu?",
            title: "Điểm chất lượng fixture",
            accessibleSummary: "Visual hierarchy dẫn đầu với 95 điểm, tiếp theo là accessibility 91 và layout 88.",
            variant: "horizontal-bar",
            data: [
              { id: "layout", category: "Layout", value: 88 },
              { id: "visual-hierarchy", category: "Visual hierarchy", value: 95 },
              { id: "accessibility", category: "Accessibility", value: 91 }
            ],
            encoding: { categoryField: "category", valueField: "value", zeroBaseline: true },
            unit: "điểm / 100",
            numberFormat: { style: "decimal", maximumFractionDigits: 0 },
            labels: { mode: "direct", showValues: true, collisionPolicy: "diagnose" },
            highlights: [{ datumId: "visual-hierarchy", level: "primary", label: "Dẫn đầu" }],
            annotations: [],
            referenceLines: [],
            evidence: { status: "verified", sourceIds: ["scene-fixture-source"], period: "Integration fixture" },
            missingValuePolicy: "gap",
            animation: { mode: "zero-to-value", durationMs: 620 }
          }
        },
        style: { color: "#243b73" },
        accessibility: { label: "Visual hierarchy dẫn đầu với 95 điểm.", readingOrder: 2 }
      },
      {
        id: "architecture-diagram",
        name: "Architecture diagram",
        kind: "diagram",
        frame: { x: 656, y: 148, width: 556, height: 460 },
        zIndex: 2,
        content: {
          diagram: {
            question: "Scene V2 đi qua các bề mặt như thế nào?",
            title: "Một contract, nhiều bề mặt",
            accessibleSummary: "DeckDocument V2 được validation rồi dùng chung cho Studio, Presenter và Export.",
            intent: "architecture",
            layout: "tree",
            direction: "left-to-right",
            nodes: [
              {
                id: "document",
                label: "DeckDocument V2",
                kind: "entity",
                ports: [{ id: "out", direction: "out", side: "right" }]
              },
              {
                id: "validation",
                label: "Validation",
                kind: "service",
                ports: [
                  { id: "in", direction: "in", side: "left" },
                  { id: "out", direction: "out", side: "right" }
                ]
              },
              {
                id: "studio",
                label: "Studio",
                kind: "service",
                ports: [{ id: "in", direction: "in", side: "left" }]
              },
              {
                id: "presenter",
                label: "Presenter",
                kind: "service",
                ports: [{ id: "in", direction: "in", side: "left" }]
              },
              {
                id: "export",
                label: "Export",
                kind: "service",
                ports: [{ id: "in", direction: "in", side: "left" }]
              }
            ],
            edges: [
              {
                id: "document-validation",
                source: { nodeId: "document", portId: "out" },
                target: { nodeId: "validation", portId: "in" },
                kind: "data-flow"
              },
              {
                id: "validation-studio",
                source: { nodeId: "validation", portId: "out" },
                target: { nodeId: "studio", portId: "in" },
                kind: "dependency"
              },
              {
                id: "validation-presenter",
                source: { nodeId: "validation", portId: "out" },
                target: { nodeId: "presenter", portId: "in" },
                kind: "dependency"
              },
              {
                id: "validation-export",
                source: { nodeId: "validation", portId: "out" },
                target: { nodeId: "export", portId: "in" },
                kind: "dependency"
              }
            ],
            generatedLayout: {
              strategy: "tree",
              nodes: [
                { nodeId: "document", x: 20, y: 190, width: 138, height: 68 },
                { nodeId: "validation", x: 205, y: 190, width: 130, height: 68 },
                { nodeId: "studio", x: 385, y: 82, width: 128, height: 62 },
                { nodeId: "presenter", x: 385, y: 190, width: 128, height: 62 },
                { nodeId: "export", x: 385, y: 298, width: 128, height: 62 }
              ],
              edges: [
                { edgeId: "document-validation", points: [{ x: 158, y: 224 }, { x: 205, y: 224 }] },
                { edgeId: "validation-studio", points: [{ x: 335, y: 224 }, { x: 360, y: 224 }, { x: 360, y: 113 }, { x: 385, y: 113 }] },
                { edgeId: "validation-presenter", points: [{ x: 335, y: 224 }, { x: 385, y: 221 }] },
                { edgeId: "validation-export", points: [{ x: 335, y: 224 }, { x: 360, y: 224 }, { x: 360, y: 329 }, { x: 385, y: 329 }] }
              ]
            },
            manualOverrides: [],
            accessibleTraversalOrder: ["document", "validation", "studio", "presenter", "export"],
            edgeRouting: "orthogonal",
            evidence: { status: "verified", sourceIds: ["scene-fixture-source"] }
          }
        },
        style: { color: "#136f63" },
        accessibility: { label: "DeckDocument V2 được validation rồi dùng chung cho Studio, Presenter và Export.", readingOrder: 3 }
      },
      {
        id: "visual-footer",
        name: "Visual evidence footer",
        kind: "evidence-footer",
        frame: { x: 68, y: 664, width: 1144, height: 28 },
        zIndex: 4,
        content: { source: "Deckory V2 local integration fixture", page: "02" },
        accessibility: { label: "Nguồn: Deckory V2 local integration fixture", readingOrder: 4 }
      }
    ]
  }, {
    id: "assistant-proof",
    name: "Text to Visual Proof",
    purpose: "transform-raw-content",
    conclusion: "Text có thứ tự được chuyển thành native editable process mà không mất source.",
    notes: "Mở bằng đoạn text bốn bước và thực hiện Visualize trong Studio. Chứng minh visual mới là native diagram, source text được giữ dưới dạng layer có liên kết và một lần Undo khôi phục trạng thái trước. Nhắc lại dữ liệu chỉ là fixture minh hoạ; kết bằng tiêu chí chấp thuận: transformation phải editable, reversible và traceable.",
    background: {
      layers: [
        { id: "assistant-paper", type: "solid", color: "#f5f2ea", opacity: 1 },
        { id: "assistant-glow", type: "glow", color: "#7c6cff", opacity: 0.16, position: { x: 82, y: 18 }, blur: 30 }
      ]
    },
    evidence: { source: "Deckory V2 text-to-visual local fixture", status: "illustrative" },
    elements: [
      {
        id: "assistant-title",
        name: "Assistant title",
        kind: "text",
        frame: { x: 76, y: 66, width: 1120, height: 72 },
        zIndex: 2,
        content: { text: "Một đoạn text nhàm chán vẫn phải giữ nguyên claim khi được trực quan hoá." },
        style: { color: "#1d1b22", fontSize: 36, fontWeight: 760, lineHeight: 1.1 },
        accessibility: { label: "Một đoạn text nhàm chán vẫn phải giữ nguyên claim khi được trực quan hoá.", readingOrder: 1 }
      },
      {
        id: "workflow-source",
        name: "Workflow source text",
        kind: "text",
        frame: { x: 120, y: 194, width: 1040, height: 330 },
        zIndex: 2,
        content: { text: "Thiết lập hồ sơ. Tạo phiên phỏng vấn. Thực hành câu hỏi. Nhận phản hồi chi tiết." },
        style: { color: "#343039", fontSize: 40, fontWeight: 560, lineHeight: 1.35, textAlign: "center" },
        accessibility: { label: "Quy trình gồm thiết lập hồ sơ, tạo phiên, thực hành và nhận phản hồi.", readingOrder: 2 },
        semantic: { purpose: "visual-source-text" }
      },
      {
        id: "assistant-footer",
        name: "Assistant evidence footer",
        kind: "evidence-footer",
        frame: { x: 76, y: 664, width: 1128, height: 28 },
        zIndex: 4,
        content: { source: "Deckory V2 text-to-visual local fixture", page: "03" },
        accessibility: { label: "Nguồn: Deckory V2 text-to-visual local fixture", readingOrder: 3 }
      }
    ]
  }]
};

export const exportV2ProofDeck: DeckDocumentV2 = {
  schemaVersion: 2,
  id: "export-v2-proof",
  revision: 1,
  title: "Deckory V2 Export Proof",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [{
    id: "custom-radar-fallback",
    type: "image",
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpKQAAAAASUVORK5CYII=",
    mediaType: "image/png",
    width: 1,
    height: 1,
    source: { label: "Local fallback fixture" }
  }],
  slides: [{
    id: "fallback-proof",
    name: "Fallback Proof",
    purpose: "export-fallback-proof",
    conclusion: "Web Block luôn xuất bằng fallback đã công bố, không giả native-editable.",
    notes: "Nêu rõ đây là fixture nội bộ để kiểm tra export, không phải visual sản phẩm. Chỉ vào capability report trước, sau đó xác nhận fallback PNG local xuất hiện trong artifact. Kết bằng nguyên tắc: unsupported hoặc fallback phải được công bố trước khi người dùng chạy export.",
    background: { layers: [{ id: "paper", type: "solid", color: "#f7f7f4", opacity: 1 }] },
    evidence: { source: "Deckory local export fixture", status: "illustrative" },
    elements: [
      {
        id: "title",
        name: "Title",
        kind: "text",
        frame: { x: 72, y: 60, width: 1136, height: 96 },
        zIndex: 2,
        content: { text: "Fallback phải được công bố trước khi xuất." },
        style: { color: "#17191c", fontSize: 42, fontWeight: 760, lineHeight: 1.08 },
        accessibility: { label: "Fallback phải được công bố trước khi xuất.", readingOrder: 1 }
      },
      {
        id: "custom-radar",
        name: "Custom radar",
        kind: "web-block",
        frame: { x: 160, y: 190, width: 960, height: 390 },
        zIndex: 1,
        content: {
          sourceId: "custom-radar-source",
          manifest: {
            id: "custom-radar",
            version: "1.0.0",
            entry: "index.html",
            framework: "html",
            accessibleSummary: "Radar minh hoạ dùng fallback PNG local.",
            staticFallback: { type: "png", assetId: "custom-radar-fallback" },
            allowedImports: [],
            payloadBytes: 64,
            localAssetBytes: 0
          }
        },
        style: { fill: "#ffffff", stroke: "#d8dad6", strokeWidth: 1, borderRadius: 18 },
        accessibility: { label: "Radar minh hoạ dùng fallback PNG local.", readingOrder: 2 },
        exportPolicy: {
          html: "fallback",
          svg: "fallback",
          png: "fallback",
          pdf: "fallback",
          pptx: "unsupported",
          fallbackAssetId: "custom-radar-fallback"
        }
      },
      {
        id: "footer",
        name: "Evidence footer",
        kind: "evidence-footer",
        frame: { x: 72, y: 664, width: 1136, height: 28 },
        zIndex: 3,
        content: { source: "Deckory local export fixture · illustrative", page: "01" },
        accessibility: { label: "Nguồn: Deckory local export fixture, illustrative.", readingOrder: 3 }
      }
    ]
  }]
};

const sceneFoundationStructuralAudit = auditDeckV2(sceneFoundationDeck);
export const sceneFoundationAudit = {
  ...sceneFoundationStructuralAudit,
  scorecard: scoreDeckV2(sceneFoundationDeck)
};

export const defaultDeck = deckCatalog[0]!.deck;

export function resolveDeck(deckId?: string | null): DeckDocument {
  return deckCatalog.find((item) => item.deck.id === deckId)?.deck ?? defaultDeck;
}

export function resolveAnyDeck(deckId?: string | null): AnyDeckDocument {
  if (deckId === sceneFoundationDeck.id) return sceneFoundationDeck;
  if (deckId === exportV2ProofDeck.id) return exportV2ProofDeck;
  return resolveDeck(deckId);
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
  { label: "Components", value: String(SUPPORTED_COMPONENT_TYPES.length), note: "semantic và typed" },
  { label: "Charts", value: "4", note: "bar, line, area, donut" },
  { label: "Themes", value: "3", note: "editorial và technical" }
] as const;
