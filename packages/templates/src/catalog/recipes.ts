import type {
  RecipeComponentSpec,
  SlideRecipe,
  SlideRecipeCategory,
  TemplateSlot
} from "../types";

type RecipeSeed = {
  id: string;
  name: string;
  category: SlideRecipeCategory;
  purpose: string;
  layout: SlideRecipe["layout"];
  variant?: SlideRecipe["variant"];
  transition?: SlideRecipe["transition"];
  core: RecipeComponentSpec;
  coreSlot: TemplateSlot;
  evidence?: SlideRecipe["evidence"];
  tags: readonly string[];
  useWhen?: readonly string[];
  avoidWhen?: readonly string[];
  insight?: boolean;
};

const headingSlot: TemplateSlot = {
  id: "heading",
  label: "Heading kết luận",
  kind: "heading",
  required: true,
  maxLength: 220
};

const evidenceSlot: TemplateSlot = {
  id: "evidence",
  label: "Nguồn hoặc trạng thái dữ liệu",
  kind: "evidence",
  required: true,
  maxLength: 260
};

const insightSlot: TemplateSlot = {
  id: "insight",
  label: "Kết luận diễn giải",
  kind: "insight",
  required: true,
  maxLength: 420
};

function recipe(seed: RecipeSeed): SlideRecipe {
  const evidence = seed.evidence ?? "recommended";
  const components: RecipeComponentSpec[] = [
    { id: "heading", type: "heading", slotId: "heading" },
    { ...seed.core, sequence: seed.core.sequence ?? 1 }
  ];
  const slots: TemplateSlot[] = [headingSlot, seed.coreSlot];

  if (seed.insight) {
    components.push({ id: "insight", type: "insight", slotId: "insight", sequence: 2, effect: { type: "rise", duration: 0.38 } });
    slots.push(insightSlot);
  }

  if (evidence !== "none") {
    components.push({ id: "evidence", type: "evidence-footer", slotId: "evidence" });
    slots.push({ ...evidenceSlot, required: evidence === "required" });
  }

  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    purpose: seed.purpose,
    layout: seed.layout,
    ...(seed.variant ? { variant: seed.variant } : {}),
    transition: seed.transition ?? transitionFor(seed.layout),
    components,
    slots,
    tags: seed.tags,
    evidence,
    useWhen: seed.useWhen ?? [`Khi cần ${seed.purpose.toLocaleLowerCase("vi-VN")}.`],
    avoidWhen: seed.avoidWhen ?? ["Khi quan hệ nội dung cần một visual grammar khác hoặc chưa có đủ bằng chứng."]
  };
}

function transitionFor(layout: SlideRecipe["layout"]): NonNullable<SlideRecipe["transition"]> {
  if (layout === "cover" || layout === "closing") return { type: "fade", duration: 0.42, easing: "emphasized" };
  if (layout === "comparison" || layout === "process" || layout === "architecture") return { type: "slide", duration: 0.44, easing: "emphasized" };
  if (layout === "data" || layout === "dashboard" || layout === "split") return { type: "wipe", duration: 0.4, easing: "standard" };
  return { type: "fade", duration: 0.36, easing: "standard" };
}

function slot(id: string, label: string, kind: TemplateSlot["kind"], maxItems?: number, maxLength?: number): TemplateSlot {
  return {
    id,
    label,
    kind,
    required: true,
    ...(maxItems ? { maxItems } : {}),
    ...(maxLength ? { maxLength } : {})
  };
}

function statementRecipe(id: string, name: string, category: SlideRecipeCategory, purpose: string, tags: readonly string[], layout: "statement" | "closing" = "statement"): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout,
    variant: layout === "closing" ? "spotlight" : "quiet",
    core: { id: "statement", type: "statement", slotId: "statement", effect: { type: "rise", duration: 0.42 } },
    coreSlot: slot("statement", "Thông điệp chính", "statement", undefined, 360),
    evidence: "recommended",
    tags
  });
}

function metricRecipe(id: string, name: string, category: SlideRecipeCategory, purpose: string, tags: readonly string[], evidence: SlideRecipe["evidence"] = "required"): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout: "dashboard",
    core: { id: "metrics", type: "metric-grid", slotId: "metrics", effect: { type: "rise", duration: 0.42 } },
    coreSlot: slot("metrics", "Hai đến bốn chỉ số", "metrics", 4),
    evidence,
    tags,
    insight: true
  });
}

function chartRecipe(id: string, name: string, category: SlideRecipeCategory, purpose: string, tags: readonly string[]): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout: "data",
    core: { id: "chart", type: "chart", slotId: "chart", effect: { type: "wipe", duration: 0.46 } },
    coreSlot: slot("chart", "Biểu đồ có câu hỏi, đơn vị và dữ liệu", "chart", 8),
    evidence: "required",
    tags,
    insight: true
  });
}

function comparisonRecipe(id: string, name: string, category: SlideRecipeCategory, purpose: string, tags: readonly string[]): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout: "comparison",
    core: { id: "comparison", type: "comparison", slotId: "comparison", effect: { type: "wipe", duration: 0.42 } },
    coreSlot: slot("comparison", "Hai phía so sánh", "comparison", 10),
    evidence: "recommended",
    tags
  });
}

function processRecipe(id: string, name: string, category: SlideRecipeCategory, purpose: string, tags: readonly string[]): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout: "process",
    core: { id: "process", type: "process", slotId: "process", effect: { type: "rise", duration: 0.42 } },
    coreSlot: slot("process", "Hai đến năm bước", "process-steps", 5),
    evidence: "recommended",
    tags
  });
}

function architectureRecipe(id: string, name: string, category: SlideRecipeCategory, purpose: string, tags: readonly string[], insight = true): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout: "architecture",
    variant: "technical",
    core: { id: "architecture", type: "architecture", slotId: "architecture", effect: { type: "wipe", duration: 0.45 } },
    coreSlot: slot("architecture", "Hai đến năm lớp hệ thống", "architecture-layers", 5),
    evidence: "recommended",
    tags,
    insight
  });
}

function codeRecipe(id: string, name: string, category: SlideRecipeCategory, purpose: string, tags: readonly string[]): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout: "architecture",
    variant: "technical",
    core: { id: "code", type: "code", slotId: "code", effect: { type: "wipe", duration: 0.4 } },
    coreSlot: slot("code", "Đoạn code có thể giải thích", "code", undefined, 4000),
    evidence: "recommended",
    tags,
    insight: true
  });
}

function tableRecipe(id: string, name: string, category: SlideRecipeCategory, purpose: string, tags: readonly string[]): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout: "comparison",
    variant: "technical",
    core: { id: "table", type: "table", slotId: "table", effect: { type: "wipe", duration: 0.4 } },
    coreSlot: slot("table", "Bảng so sánh chính xác", "table", 8),
    evidence: "required",
    tags
  });
}

function diagramRecipe({
  id,
  name,
  category,
  purpose,
  layout,
  variant,
  tags,
  evidence = "recommended"
}: {
  id: string;
  name: string;
  category: SlideRecipeCategory;
  purpose: string;
  layout: "process" | "data" | "comparison" | "architecture";
  variant: NonNullable<SlideRecipe["variant"]>;
  tags: readonly string[];
  evidence?: SlideRecipe["evidence"];
}): SlideRecipe {
  return recipe({
    id,
    name,
    category,
    purpose,
    layout,
    variant,
    core: { id: "diagram", type: "diagram", slotId: "diagram", effect: { type: "wipe", duration: 0.48 } },
    coreSlot: slot("diagram", "Sơ đồ semantic có tóm tắt accessible", "diagram", 8, 1800),
    evidence,
    tags,
    useWhen: [`Khi ${purpose.toLocaleLowerCase("vi-VN")} và quan hệ cần được đọc trong vài giây.`],
    avoidWhen: ["Khi dữ liệu cần đối chiếu giá trị chính xác bằng chart hoặc table, hoặc khi chưa có quan hệ thật để sơ đồ hoá."]
  });
}

export const slideRecipes = [
  recipe({ id: "professional-cover", name: "Professional Cover", category: "opening", purpose: "mở câu chuyện bằng một luận điểm chuyên nghiệp và có bối cảnh", layout: "cover", variant: "spotlight", core: { id: "evidence", type: "evidence-footer", slotId: "evidence" }, coreSlot: evidenceSlot, evidence: "none", tags: ["cover", "opening", "professional"] }),
  recipe({ id: "executive-opener", name: "Executive Opener", category: "opening", purpose: "đặt quyết định hoặc kết luận dành cho lãnh đạo ngay từ đầu", layout: "cover", core: { id: "evidence", type: "evidence-footer", slotId: "evidence" }, coreSlot: evidenceSlot, evidence: "none", tags: ["executive", "leadership", "decision"] }),
  statementRecipe("section-transition", "Section Transition", "opening", "chuyển chương bằng một ý dẫn ngắn và có nhịp", ["section", "transition", "chapter"]),

  statementRecipe("problem-statement", "Problem Statement", "narrative", "nêu vấn đề trung tâm bằng ngôn ngữ khán giả", ["problem", "tension", "context"]),
  statementRecipe("tension-and-stakes", "Tension and Stakes", "narrative", "làm rõ hậu quả nếu vấn đề không được giải quyết", ["stakes", "risk", "urgency"]),
  statementRecipe("key-message", "Key Message", "narrative", "đóng đinh một thông điệp duy nhất cần được ghi nhớ", ["message", "thesis", "takeaway"]),
  statementRecipe("attributed-quote", "Attributed Quote", "narrative", "dùng một trích dẫn có nguồn để tạo góc nhìn hoặc chuyển mạch", ["quote", "source", "voice"]),
  statementRecipe("closing-action", "Closing Action", "narrative", "kết thúc bằng hành động hoặc quyết định tiếp theo", ["closing", "action", "decision"], "closing"),

  metricRecipe("executive-summary", "Executive Summary", "business", "tóm tắt tình hình, kết luận và tín hiệu quyết định cho lãnh đạo", ["summary", "executive", "metrics"]),
  chartRecipe("opportunity-landscape", "Opportunity Landscape", "business", "cho thấy quy mô hoặc phân bố của cơ hội ưu tiên", ["opportunity", "market", "landscape"]),
  architectureRecipe("solution-overview", "Solution Overview", "business", "giải thích các phần chính của giải pháp và cách chúng phối hợp", ["solution", "overview", "system"], false),
  comparisonRecipe("value-proposition", "Value Proposition", "business", "so sánh trạng thái hiện tại với giá trị mà giải pháp tạo ra", ["value", "benefit", "before-after"]),
  metricRecipe("strategy-pillars", "Strategy Pillars", "business", "trình bày các trụ cột chiến lược bằng chỉ số hoặc cam kết có thể kiểm chứng", ["strategy", "pillars", "priorities"], "recommended"),
  processRecipe("roadmap-phases", "Roadmap Phases", "business", "trình bày lộ trình theo giai đoạn và mục tiêu từng chặng", ["roadmap", "phases", "plan"]),

  metricRecipe("kpi-overview", "KPI Overview", "data", "tóm tắt hai đến bốn KPI quan trọng cùng ý nghĩa quyết định", ["kpi", "dashboard", "metrics"]),
  chartRecipe("ranked-bar-analysis", "Ranked Bar Analysis", "data", "xếp hạng các hạng mục để thấy ưu tiên hoặc chênh lệch", ["bar", "ranking", "comparison"]),
  chartRecipe("trend-over-time", "Trend Over Time", "data", "cho thấy thay đổi theo một trục thời gian có thứ tự", ["trend", "line", "time"]),
  chartRecipe("part-to-whole", "Part to Whole", "data", "giải thích cơ cấu của một tổng thể nhỏ và rõ", ["donut", "share", "distribution"]),
  chartRecipe("data-with-insight", "Data with Insight", "data", "đặt biểu đồ và kết luận diễn giải cạnh nhau", ["data", "insight", "evidence"]),
  tableRecipe("exact-comparison-table", "Exact Comparison Table", "data", "so sánh chính xác nhiều trường dữ liệu theo hàng", ["table", "exact", "comparison"]),
  diagramRecipe({ id: "semantic-timeline", name: "Semantic Timeline", category: "process", purpose: "trình bày các mốc theo thời gian và ý nghĩa của từng chuyển tiếp", layout: "process", variant: "editorial", tags: ["timeline", "milestone", "sequence"] }),
  diagramRecipe({ id: "semantic-roadmap", name: "Semantic Roadmap", category: "process", purpose: "chia lộ trình thành giai đoạn, đầu ra và thứ tự triển khai", layout: "process", variant: "asymmetric", tags: ["roadmap", "phase", "delivery"] }),
  diagramRecipe({ id: "semantic-funnel", name: "Semantic Funnel", category: "data", purpose: "giải thích cách một tập hợp thu hẹp qua từng điều kiện hoặc giai đoạn", layout: "data", variant: "evidence", tags: ["funnel", "conversion", "filter"], evidence: "required" }),
  diagramRecipe({ id: "semantic-pyramid", name: "Semantic Pyramid", category: "narrative", purpose: "thể hiện các tầng nền tảng, ưu tiên hoặc mức độ trưởng thành", layout: "data", variant: "editorial", tags: ["pyramid", "hierarchy", "maturity"] }),
  diagramRecipe({ id: "semantic-cycle", name: "Semantic Cycle", category: "process", purpose: "giải thích một vòng lặp liên tục với đầu ra quay lại làm đầu vào", layout: "process", variant: "cinematic", tags: ["cycle", "loop", "continuous"] }),
  diagramRecipe({ id: "semantic-quadrant", name: "Semantic Quadrant", category: "comparison", purpose: "định vị bốn nhóm theo hai trục có ý nghĩa", layout: "comparison", variant: "evidence", tags: ["quadrant", "matrix", "positioning"], evidence: "required" }),

  comparisonRecipe("before-after", "Before and After", "comparison", "đối chiếu trạng thái trước và sau một thay đổi", ["before", "after", "change"]),
  comparisonRecipe("two-option-decision", "Two Option Decision", "comparison", "đánh giá hai lựa chọn để hỗ trợ một quyết định", ["options", "decision", "trade-off"]),
  comparisonRecipe("competitive-position", "Competitive Position", "comparison", "làm rõ khác biệt có ý nghĩa giữa hai cách tiếp cận", ["competitive", "position", "differentiation"]),
  tableRecipe("trade-off-matrix", "Trade-off Matrix", "comparison", "trình bày trade-off chính xác theo tiêu chí", ["trade-off", "matrix", "criteria"]),

  processRecipe("workflow-steps", "Workflow Steps", "process", "giải thích một luồng công việc tuần tự từ đầu vào đến kết quả", ["workflow", "steps", "flow"]),
  processRecipe("customer-journey", "Customer Journey", "process", "mô tả hành trình trải nghiệm theo các điểm chạm chính", ["journey", "customer", "experience"]),
  processRecipe("phased-plan", "Phased Plan", "process", "chia kế hoạch thành các giai đoạn có đầu ra rõ", ["plan", "phases", "delivery"]),
  processRecipe("operating-model", "Operating Model", "process", "mô tả cách vai trò và hoạt động phối hợp để vận hành", ["operating", "model", "roles"]),

  architectureRecipe("system-architecture", "System Architecture", "technical", "giải thích boundary, lớp và luồng trách nhiệm của hệ thống", ["architecture", "system", "boundary"]),
  architectureRecipe("data-flow", "Data Flow", "technical", "trình bày dữ liệu đi qua các lớp và điểm kiểm soát", ["data", "flow", "pipeline"]),
  codeRecipe("implementation-proof", "Implementation Proof", "technical", "chứng minh một contract hoặc quality gate bằng đoạn code ngắn", ["implementation", "proof", "contract"]),
  codeRecipe("code-walkthrough", "Code Walkthrough", "technical", "giải thích một đoạn code nhỏ theo thứ tự nói", ["code", "walkthrough", "teaching"]),
  metricRecipe("reliability-model", "Reliability Model", "technical", "tóm tắt các quality signal và ngưỡng sẵn sàng", ["reliability", "quality", "readiness"]),

  statementRecipe("research-question", "Research Question", "academic", "nêu câu hỏi nghiên cứu và phạm vi cần trả lời", ["research", "question", "scope"]),
  processRecipe("methodology", "Methodology", "academic", "giải thích phương pháp, mẫu và trình tự nghiên cứu", ["method", "methodology", "sample"]),
  chartRecipe("findings", "Findings", "academic", "trình bày phát hiện chính bằng bằng chứng định lượng", ["findings", "results", "evidence"]),
  chartRecipe("discussion", "Discussion", "academic", "đặt phát hiện trong bối cảnh và diễn giải ý nghĩa", ["discussion", "interpretation", "context"]),
  comparisonRecipe("recommendation", "Recommendation", "academic", "so sánh lựa chọn và chỉ ra khuyến nghị có căn cứ", ["recommendation", "decision", "evidence"]),
  statementRecipe("defense-conclusion", "Defense Conclusion", "academic", "kết luận luận điểm, giới hạn và đóng góp của nghiên cứu", ["defense", "conclusion", "contribution"], "closing"),

  statementRecipe("user-problem", "User Problem", "product", "nêu khó khăn người dùng bằng ngôn ngữ trải nghiệm", ["user", "problem", "need"]),
  architectureRecipe("product-mechanism", "Product Mechanism", "product", "giải thích cơ chế tạo giá trị của sản phẩm", ["product", "mechanism", "system"], false),
  comparisonRecipe("feature-proof", "Feature Proof", "product", "đối chiếu hành vi cũ và trải nghiệm sau khi có tính năng", ["feature", "proof", "experience"]),
  processRecipe("experience-flow", "Experience Flow", "product", "trình bày hành trình sử dụng từ ý định đến kết quả", ["experience", "flow", "ux"]),
  metricRecipe("release-readiness", "Release Readiness", "product", "tóm tắt tín hiệu chất lượng trước khi phát hành", ["release", "readiness", "quality"])
] as const satisfies readonly SlideRecipe[];
