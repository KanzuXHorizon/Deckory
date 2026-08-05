import type {
  TemplateAudience,
  TemplateScenario,
  TemplateTone,
  VisualStylePreset
} from "../types";

const sharedProhibitedPatterns = [
  "Generic AI-purple gradients or neon glow used as default decoration.",
  "Decorative charts that do not answer a visible question.",
  "Repeated equal-card grids regardless of content relationship.",
  "Random remote imagery or stock photos without narrative purpose.",
  "Low-contrast glass effects that weaken readability."
] as const;

function style(
  id: string,
  name: string,
  description: string,
  theme: VisualStylePreset["theme"],
  scenarios: readonly TemplateScenario[],
  audiences: readonly TemplateAudience[],
  tones: readonly TemplateTone[],
  dials: VisualStylePreset["dials"],
  compositionGuidance: readonly string[]
): VisualStylePreset {
  return {
    id,
    name,
    description,
    theme,
    scenarios,
    audiences,
    tones,
    dials,
    compositionGuidance,
    prohibitedPatterns: sharedProhibitedPatterns
  };
}

export const visualStyles = [
  style(
    "executive-editorial",
    "Executive Editorial",
    "Bố cục biên tập điềm tĩnh cho lãnh đạo, hội đồng và các quyết định cần độ tin cậy cao.",
    { preset: "editorial-light", accent: "cobalt", typography: "editorial", density: "comfortable" },
    ["executive", "case-study", "proposal", "general"],
    ["leadership", "customer", "general"],
    ["restrained", "professional"],
    { narrativeVariance: 6, motionIntensity: 3, visualDensity: 5, evidenceRigor: 9 },
    [
      "Mở bằng kết luận hoặc quyết định thay vì lịch sử dài.",
      "Luân phiên slide statement, evidence và comparison để giữ nhịp.",
      "Dùng cobalt cho một điểm nhấn quyết định, không phủ màu toàn deck.",
      "Ưu tiên khoảng trắng và heading ngắn cho phòng họp."
    ]
  ),
  style(
    "modern-professional",
    "Modern Professional",
    "Hệ visual linh hoạt, hiện đại và dễ dùng cho sản phẩm, proposal, workshop và deck chuyên nghiệp phổ thông.",
    { preset: "editorial-light", accent: "teal", typography: "modern", density: "comfortable" },
    ["general", "product", "training", "proposal", "case-study"],
    ["general", "customer", "team", "student"],
    ["professional", "analytical"],
    { narrativeVariance: 7, motionIntensity: 5, visualDensity: 5, evidenceRigor: 7 },
    [
      "Kết hợp split, process, comparison và data thay vì lặp card grid.",
      "Dùng teal để biểu thị tiến triển, readiness hoặc lựa chọn ưu tiên.",
      "Giữ typography sans rõ ràng với heading tối đa hai dòng.",
      "Motion chỉ giải thích thứ tự, chuyển trạng thái hoặc continuity."
    ]
  ),
  style(
    "technical-precision",
    "Technical Precision",
    "Visual language chính xác cho kiến trúc, code, reliability và review kỹ thuật.",
    { preset: "technical-clean", accent: "teal", typography: "technical", density: "compact" },
    ["technical", "product"],
    ["technical", "team", "leadership"],
    ["analytical", "restrained"],
    { narrativeVariance: 6, motionIntensity: 4, visualDensity: 7, evidenceRigor: 9 },
    [
      "Đặt boundary, flow và trade-off ở trung tâm thay vì logo công nghệ.",
      "Code chỉ hiển thị đoạn có thể giải thích trong một lượt nói.",
      "Dùng architecture và insight để tách hệ thống khỏi kết luận.",
      "Giữ nhãn, đơn vị, trạng thái và nguồn kỹ thuật rõ ràng."
    ]
  ),
  style(
    "data-briefing",
    "Data Briefing",
    "Bố cục cô đọng cho KPI, báo cáo quý, xu hướng và phân tích ra quyết định.",
    { preset: "technical-clean", accent: "cobalt", typography: "modern", density: "compact" },
    ["qbr", "executive", "case-study"],
    ["leadership", "team", "customer"],
    ["analytical", "professional"],
    { narrativeVariance: 6, motionIntensity: 3, visualDensity: 8, evidenceRigor: 10 },
    [
      "Mỗi chart trả lời một câu hỏi và có insight diễn giải ngay cạnh.",
      "Dùng direct labels, unit và khoảng thời gian thay vì legend rời.",
      "Chỉ highlight datum trực tiếp hỗ trợ kết luận.",
      "Luân phiên KPI overview, trend và decision slide để tránh density phẳng."
    ]
  ),
  style(
    "bold-keynote",
    "Bold Keynote",
    "Phong cách sân khấu mạnh, giàu nhịp kể cho launch, pitch và tầm nhìn, nhưng vẫn giữ cấu trúc có kiểm soát.",
    { preset: "editorial-dark", accent: "amber", typography: "modern", density: "comfortable" },
    ["pitch", "product", "general"],
    ["investor", "customer", "general"],
    ["bold", "professional"],
    { narrativeVariance: 9, motionIntensity: 7, visualDensity: 4, evidenceRigor: 7 },
    [
      "Dùng statement lớn và composition bất đối xứng cho khoảnh khắc chính.",
      "Giữ slide evidence sáng rõ, không hy sinh khả năng đọc vì kịch tính.",
      "Amber chỉ nhấn một từ, số hoặc lựa chọn trọng tâm.",
      "Tạo nhịp cinematic xen kẽ với slide proof cô đọng."
    ]
  ),
  style(
    "academic-defense",
    "Academic Defense",
    "Phong cách học thuật có hierarchy, bằng chứng và mạch lập luận rõ cho báo cáo nghiên cứu và bảo vệ tốt nghiệp.",
    { preset: "editorial-light", accent: "cobalt", typography: "editorial", density: "compact" },
    ["academic", "training"],
    ["academic", "student", "technical"],
    ["academic", "analytical", "restrained"],
    { narrativeVariance: 6, motionIntensity: 3, visualDensity: 7, evidenceRigor: 10 },
    [
      "Liên kết câu hỏi nghiên cứu, phương pháp, kết quả và kết luận bằng heading có luận điểm.",
      "Ghi nguồn, phạm vi mẫu, đơn vị và giới hạn ngay trên slide liên quan.",
      "Dùng chart hoặc table theo quan hệ dữ liệu, không vì trang trí.",
      "Giữ thuật ngữ nhất quán và speaker notes cho caveat quan trọng."
    ]
  )
] as const satisfies readonly VisualStylePreset[];
