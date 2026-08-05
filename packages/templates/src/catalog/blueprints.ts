import type { BlueprintStep, DeckBlueprint, TemplateAudience, TemplateScenario } from "../types.js";

function step(
  id: string,
  recipeId: string,
  role: string,
  required = true,
  repeats?: readonly [number, number]
): BlueprintStep {
  return {
    id,
    recipeId,
    role,
    required,
    ...(repeats ? { minRepeats: repeats[0], maxRepeats: repeats[1] } : {})
  };
}

function blueprint(
  id: string,
  name: string,
  description: string,
  scenario: TemplateScenario,
  audiences: readonly TemplateAudience[],
  durationMinutes: readonly [number, number],
  steps: readonly BlueprintStep[]
): DeckBlueprint {
  return { id, name, description, scenario, audiences, durationMinutes, steps };
}

export const deckBlueprints = [
  blueprint(
    "professional-presentation",
    "Professional Presentation",
    "Mạch kể đa dụng cho một đề xuất, cập nhật hoặc câu chuyện sản phẩm cần cân bằng luận điểm, bằng chứng và hành động.",
    "general",
    ["general", "customer", "team", "leadership"],
    [10, 25],
    [
      step("opening", "professional-cover", "Thiết lập luận điểm và bối cảnh."),
      step("problem", "problem-statement", "Nêu vấn đề trung tâm."),
      step("message", "key-message", "Chốt thông điệp cần ghi nhớ."),
      step("evidence", "data-with-insight", "Cung cấp bằng chứng chính.", false, [0, 2]),
      step("comparison", "before-after", "Làm rõ thay đổi hoặc khác biệt."),
      step("plan", "roadmap-phases", "Trình bày đường đi đến kết quả."),
      step("action", "closing-action", "Kết thúc bằng hành động tiếp theo.")
    ]
  ),
  blueprint(
    "executive-briefing",
    "Executive Briefing",
    "Briefing quyết định-led cho lãnh đạo: bắt đầu bằng kết luận, chỉ giữ tín hiệu và rủi ro ảnh hưởng lựa chọn.",
    "executive",
    ["leadership", "team"],
    [6, 15],
    [
      step("opening", "executive-opener", "Đưa quyết định lên trước."),
      step("summary", "executive-summary", "Tóm tắt trạng thái bằng tín hiệu chính."),
      step("drivers", "ranked-bar-analysis", "Xếp hạng động lực ảnh hưởng."),
      step("options", "two-option-decision", "So sánh hai lựa chọn khả thi."),
      step("risk", "tension-and-stakes", "Làm rõ rủi ro của trì hoãn hoặc lựa chọn sai."),
      step("recommendation", "recommendation", "Nêu phương án được đề xuất."),
      step("action", "closing-action", "Yêu cầu quyết định hoặc cam kết tiếp theo.")
    ]
  ),
  blueprint(
    "startup-pitch",
    "Startup Pitch",
    "Pitch tập trung vào vấn đề, cơ chế giải pháp, cơ hội, bằng chứng và lời đề nghị rõ ràng.",
    "pitch",
    ["investor", "customer", "general"],
    [8, 18],
    [
      step("opening", "professional-cover", "Đặt tầm nhìn và luận điểm."),
      step("problem", "user-problem", "Nêu nỗi đau người dùng."),
      step("stakes", "tension-and-stakes", "Cho thấy quy mô và mức khẩn cấp."),
      step("solution", "solution-overview", "Giải thích giải pháp ở mức hệ thống."),
      step("mechanism", "product-mechanism", "Cho thấy sản phẩm tạo giá trị như thế nào."),
      step("market", "opportunity-landscape", "Trình bày cơ hội có bằng chứng."),
      step("proof", "feature-proof", "Chứng minh cải thiện trải nghiệm."),
      step("metrics", "kpi-overview", "Tóm tắt traction hoặc quality signal.", false, [0, 2]),
      step("ask", "closing-action", "Nêu lời đề nghị và bước tiếp theo.")
    ]
  ),
  blueprint(
    "product-strategy",
    "Product Strategy",
    "Mạch chiến lược sản phẩm từ vấn đề người dùng, insight, lựa chọn đến roadmap và thước đo.",
    "product",
    ["leadership", "team", "customer"],
    [12, 30],
    [
      step("opening", "professional-cover", "Định nghĩa lựa chọn chiến lược."),
      step("user-problem", "user-problem", "Đặt vấn đề người dùng."),
      step("evidence", "data-with-insight", "Chứng minh vấn đề bằng dữ liệu."),
      step("position", "competitive-position", "Làm rõ khác biệt chiến lược."),
      step("pillars", "strategy-pillars", "Trình bày các trụ cột ưu tiên."),
      step("mechanism", "product-mechanism", "Giải thích cơ chế sản phẩm."),
      step("roadmap", "roadmap-phases", "Chuyển chiến lược thành giai đoạn."),
      step("measures", "release-readiness", "Định nghĩa thước đo sẵn sàng."),
      step("action", "closing-action", "Chốt lựa chọn và trách nhiệm tiếp theo.")
    ]
  ),
  blueprint(
    "quarterly-business-review",
    "Quarterly Business Review",
    "Review theo quý với outcome, xu hướng, nguyên nhân, rủi ro và hành động ưu tiên.",
    "qbr",
    ["leadership", "team", "customer"],
    [15, 35],
    [
      step("opening", "executive-opener", "Tóm tắt kết luận của quý."),
      step("kpis", "kpi-overview", "Đưa các outcome chính."),
      step("trend", "trend-over-time", "Cho thấy xu hướng theo thời gian."),
      step("drivers", "ranked-bar-analysis", "Xếp hạng yếu tố ảnh hưởng."),
      step("details", "exact-comparison-table", "Cung cấp số liệu chính xác khi cần.", false, [0, 2]),
      step("risk", "tension-and-stakes", "Nêu rủi ro và khoảng cách."),
      step("plan", "phased-plan", "Chuyển phát hiện thành hành động quý tới."),
      step("action", "closing-action", "Chốt owner và quyết định.")
    ]
  ),
  blueprint(
    "technical-architecture-review",
    "Technical Architecture Review",
    "Review kỹ thuật từ mục tiêu, constraint và boundary đến flow, trade-off, proof và readiness.",
    "technical",
    ["technical", "team", "leadership"],
    [15, 40],
    [
      step("opening", "professional-cover", "Đặt mục tiêu và phạm vi review."),
      step("constraints", "tension-and-stakes", "Nêu constraint và failure mode."),
      step("architecture", "system-architecture", "Mô tả boundary và trách nhiệm."),
      step("flow", "data-flow", "Giải thích dữ liệu đi qua hệ thống."),
      step("tradeoffs", "trade-off-matrix", "Đánh giá lựa chọn theo tiêu chí."),
      step("proof", "implementation-proof", "Chứng minh contract hoặc quality gate.", false, [0, 2]),
      step("reliability", "reliability-model", "Tóm tắt tín hiệu sẵn sàng."),
      step("recommendation", "recommendation", "Chốt phương án kỹ thuật."),
      step("action", "closing-action", "Nêu quyết định và bước triển khai.")
    ]
  ),
  blueprint(
    "academic-defense",
    "Academic Defense",
    "Mạch bảo vệ học thuật từ động cơ, câu hỏi, phương pháp đến phát hiện, thảo luận, giới hạn và đóng góp.",
    "academic",
    ["academic", "student", "technical"],
    [15, 35],
    [
      step("opening", "professional-cover", "Giới thiệu đề tài và luận điểm."),
      step("motivation", "problem-statement", "Nêu động cơ và khoảng trống."),
      step("question", "research-question", "Đặt câu hỏi nghiên cứu."),
      step("method", "methodology", "Trình bày phương pháp và phạm vi."),
      step("findings", "findings", "Cung cấp phát hiện có nguồn.", true, [1, 3]),
      step("discussion", "discussion", "Diễn giải ý nghĩa của phát hiện."),
      step("recommendation", "recommendation", "Đưa khuyến nghị có căn cứ."),
      step("conclusion", "defense-conclusion", "Chốt đóng góp, giới hạn và hướng tiếp theo.")
    ]
  ),
  blueprint(
    "training-workshop",
    "Training Workshop",
    "Mạch đào tạo từ mục tiêu, khái niệm, ví dụ đến quy trình áp dụng và recap.",
    "training",
    ["student", "team", "general"],
    [20, 60],
    [
      step("opening", "professional-cover", "Thiết lập mục tiêu học tập."),
      step("question", "key-message", "Nêu khái niệm trung tâm."),
      step("example", "before-after", "Minh hoạ khác biệt trước và sau."),
      step("workflow", "workflow-steps", "Giải thích cách áp dụng."),
      step("practice", "code-walkthrough", "Cho ví dụ kỹ thuật khi phù hợp.", false, [0, 2]),
      step("evidence", "data-with-insight", "Củng cố bằng dữ liệu hoặc ví dụ.", false, [0, 2]),
      step("recap", "key-message", "Tóm tắt điều cần ghi nhớ."),
      step("action", "closing-action", "Đưa bài tập hoặc bước tiếp theo.")
    ]
  ),
  blueprint(
    "case-study",
    "Case Study",
    "Câu chuyện tình huống từ bối cảnh, thách thức và can thiệp đến bằng chứng, tác động và bài học.",
    "case-study",
    ["customer", "leadership", "general"],
    [10, 25],
    [
      step("opening", "professional-cover", "Đặt bối cảnh và kết quả cần hiểu."),
      step("challenge", "problem-statement", "Nêu thách thức ban đầu."),
      step("stakes", "tension-and-stakes", "Làm rõ tác động kinh doanh hoặc trải nghiệm."),
      step("intervention", "solution-overview", "Giải thích cách can thiệp."),
      step("journey", "customer-journey", "Trình bày trải nghiệm thay đổi."),
      step("evidence", "data-with-insight", "Chứng minh kết quả."),
      step("learning", "key-message", "Rút ra bài học có thể tái sử dụng."),
      step("action", "closing-action", "Kết nối bài học với bước tiếp theo.")
    ]
  ),
  blueprint(
    "project-proposal",
    "Project Proposal",
    "Proposal có cấu trúc từ nhu cầu, phương án và phạm vi đến kế hoạch, rủi ro và yêu cầu phê duyệt.",
    "proposal",
    ["leadership", "customer", "team"],
    [10, 30],
    [
      step("opening", "executive-opener", "Nêu đề xuất và giá trị chính."),
      step("need", "problem-statement", "Định nghĩa nhu cầu cần giải quyết."),
      step("opportunity", "opportunity-landscape", "Chứng minh cơ hội hoặc quy mô."),
      step("solution", "solution-overview", "Trình bày phương án."),
      step("value", "value-proposition", "Làm rõ lợi ích so với hiện trạng."),
      step("scope", "workflow-steps", "Mô tả phạm vi và luồng thực hiện."),
      step("plan", "phased-plan", "Đưa timeline và milestone."),
      step("risk", "trade-off-matrix", "Nêu trade-off và biện pháp kiểm soát."),
      step("approval", "closing-action", "Yêu cầu phê duyệt và bước khởi động.")
    ]
  )
] as const satisfies readonly DeckBlueprint[];
