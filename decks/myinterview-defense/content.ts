import type { DeckAssetV2 } from "@deckory/schema";

export type MyInterviewTone = "ink" | "cobalt" | "teal" | "amber" | "paper";

export type MyInterviewTeamMember = {
  id: string;
  name: string;
  studentId: string;
  role: string;
  summary: string;
  skills: readonly string[];
  contributions: readonly string[];
  tone: MyInterviewTone;
  assetId: string;
};

export type MyInterviewMediaItem = {
  assetId: string;
  eyebrow: string;
  title: string;
  caption: string;
  featured?: boolean;
};

export type MyInterviewPanel = {
  eyebrow: string;
  title: string;
  points: readonly string[];
  tone: MyInterviewTone;
};

export type MyInterviewLayer = {
  label: string;
  items: readonly string[];
  tone: MyInterviewTone;
};

export type MyInterviewCriterion = {
  label: string;
  question: string;
  output: string;
  tone: MyInterviewTone;
  featured?: boolean;
};

export type MyInterviewStatus = {
  value: string;
  label: string;
  note: string;
  tone: MyInterviewTone;
};

export type MyInterviewStep = {
  label: string;
  description: string;
  value?: string;
  tone: MyInterviewTone;
  featured?: boolean;
};

export type MyInterviewBaseSlide = {
  id: string;
  page: string;
  section: "opening" | "team" | "problem" | "solution" | "proof" | "decision" | "demo" | "appendix";
  eyebrow: string;
  title: string;
  description?: string;
  notes: string;
  source: string;
};

export type MyInterviewSlideSpec =
  | (MyInterviewBaseSlide & { kind: "cover"; statement: string })
  | (MyInterviewBaseSlide & { kind: "profile"; member: MyInterviewTeamMember })
  | (MyInterviewBaseSlide & { kind: "media"; items: readonly MyInterviewMediaItem[]; insight?: string })
  | (MyInterviewBaseSlide & { kind: "comparison"; left: MyInterviewPanel; right: MyInterviewPanel })
  | (MyInterviewBaseSlide & { kind: "architecture"; layers: readonly MyInterviewLayer[] })
  | (MyInterviewBaseSlide & { kind: "criteria"; criteria: readonly MyInterviewCriterion[] })
  | (MyInterviewBaseSlide & { kind: "status"; statuses: readonly MyInterviewStatus[] })
  | (MyInterviewBaseSlide & { kind: "table"; columns: readonly string[]; rows: readonly (readonly string[])[]; note: string })
  | (MyInterviewBaseSlide & { kind: "roadmap" | "process"; steps: readonly MyInterviewStep[] })
  | (MyInterviewBaseSlide & { kind: "closing"; statement: string; byline: string });

export const MYINTERVIEW_TEAM: readonly MyInterviewTeamMember[] = [
  {
    id: "hao",
    name: "Nguyễn Thái Hảo",
    studentId: "TB01328",
    role: "Trưởng nhóm · Kiến trúc · Tích hợp",
    summary: "Định hướng kỹ thuật, kết nối các module và điều phối luồng bảo vệ từ câu chuyện đến demo.",
    skills: ["Kiến trúc hệ thống", "Full-stack", "Tích hợp"],
    contributions: ["Thiết kế kiến trúc tổng thể", "Điều phối frontend–backend–AI", "Chuẩn bị demo và phản biện"],
    tone: "cobalt",
    assetId: "team-hao"
  },
  {
    id: "minh",
    name: "Phạm Nguyễn Bảo Minh",
    studentId: "TB01386",
    role: "Backend · Máy trạng thái · Độ tin cậy",
    summary: "Phụ trách vòng đời phiên phỏng vấn, kiểm soát chuyển trạng thái và phục hồi khi dịch vụ gián đoạn.",
    skills: ["Backend", "Máy trạng thái", "Độ tin cậy"],
    contributions: ["Thiết kế vòng đời phiên", "Kiểm soát chuyển trạng thái", "Xử lý giới hạn chờ và dự phòng"],
    tone: "ink",
    assetId: "team-minh"
  },
  {
    id: "quynh",
    name: "Phan Ngọc Diễm Quỳnh",
    studentId: "TB01432",
    role: "Nghiệp vụ · Sản phẩm · QA",
    summary: "Phân tích nhu cầu người học, phạm vi chức năng và chất lượng nghiệp vụ của hành trình luyện tập.",
    skills: ["Phân tích nghiệp vụ", "Kiểm thử", "UX writing"],
    contributions: ["Phân tích yêu cầu", "Kiểm thử nghiệp vụ", "Kiểm soát phạm vi sản phẩm"],
    tone: "teal",
    assetId: "team-quynh"
  },
  {
    id: "hoang",
    name: "Nhữ Mai Gia Hoàng",
    studentId: "TB01424",
    role: "Tài liệu · Kiểm thử · Bằng chứng",
    summary: "Xây dựng test case, quản lý tài liệu và đối chiếu mỗi luận điểm trình bày với đúng loại bằng chứng.",
    skills: ["Kiểm thử", "Tài liệu", "Bằng chứng"],
    contributions: ["Xây dựng test case", "Quản lý tài liệu", "Tập hợp bằng chứng bảo vệ"],
    tone: "teal",
    assetId: "team-hoang"
  },
  {
    id: "thu",
    name: "Nguyễn Ngọc Anh Thư",
    studentId: "TB01321",
    role: "UI/UX · Thuyết trình · Demo",
    summary: "Rà soát giao diện, định hình nhịp trình bày và chuẩn bị phương án demo chính lẫn dự phòng.",
    skills: ["UI/UX", "Thuyết trình", "Kiểm thử trực quan"],
    contributions: ["Rà soát giao diện", "Xây dựng kịch bản bảo vệ", "Điều phối demo chính và dự phòng"],
    tone: "amber",
    assetId: "team-thu"
  }
] as const;

export const MYINTERVIEW_ASSETS: readonly DeckAssetV2[] = [
  {
    id: "fpt-polytechnic-logo",
    type: "image",
    src: "/brand/fpt-polytechnic.svg",
    mediaType: "image/svg+xml",
    width: 760,
    height: 180,
    source: { label: "FPT Polytechnic logo · nguồn người dùng cung cấp" }
  },
  ...MYINTERVIEW_TEAM.map((member) => ({
    id: member.assetId,
    type: "image" as const,
    src: `/myinterview/team/${member.id}.svg`,
    mediaType: "image/svg+xml",
    width: 180,
    height: 240,
    source: { label: `Ảnh thành viên ${member.name} · bộ tài liệu bảo vệ MyInterview` }
  })),
  {
    id: "product-dashboard",
    type: "image",
    src: "/myinterview/product/dashboard.svg",
    mediaType: "image/svg+xml",
    width: 560,
    height: 420,
    source: { label: "MyInterview dashboard · ảnh giao diện local đã kiểm tra" }
  },
  {
    id: "product-setup",
    type: "image",
    src: "/myinterview/product/setup.svg",
    mediaType: "image/svg+xml",
    width: 480,
    height: 360,
    source: { label: "MyInterview interview setup · ảnh giao diện local đã kiểm tra" }
  },
  {
    id: "product-interview",
    type: "image",
    src: "/myinterview/product/interview.svg",
    mediaType: "image/svg+xml",
    width: 420,
    height: 315,
    source: { label: "MyInterview text interview · ảnh giao diện local đã kiểm tra" }
  },
  {
    id: "product-feedback",
    type: "image",
    src: "/myinterview/product/feedback.svg",
    mediaType: "image/svg+xml",
    width: 420,
    height: 315,
    source: { label: "MyInterview feedback · ảnh giao diện local đã kiểm tra" }
  }
] as const;

const profileSlides = MYINTERVIEW_TEAM.map((member, index): MyInterviewSlideSpec => ({
  id: `member-${member.id}`,
  page: `02${String.fromCharCode(65 + index)}`,
  section: "team",
  kind: "profile",
  eyebrow: `THÀNH VIÊN ${String(index + 1).padStart(2, "0")} / 05`,
  title: member.name,
  description: member.role,
  notes: `${member.name} tự giới thiệu trong 8–10 giây: tên, MSSV, vai trò và một đóng góp tiêu biểu. Không đọc toàn bộ nội dung trên slide.`,
  source: "Ảnh và phân vai nhóm NEXUS · bộ tài liệu bảo vệ MyInterview",
  member
}));

export const MYINTERVIEW_SLIDES: readonly MyInterviewSlideSpec[] = [
  {
    id: "cover",
    page: "01",
    section: "opening",
    kind: "cover",
    eyebrow: "FPT POLYTECHNIC · PRO2192.01 · DỰ ÁN TỐT NGHIỆP",
    title: "AI Technical Interviewer",
    description: "MyInterview kết nối CV, JD, câu trả lời và bằng chứng cải thiện trong một vòng luyện tập có cấu trúc.",
    statement: "Bối cảnh nghề nghiệp đi vào từng câu hỏi. Phản hồi phải dẫn tới hành động tiếp theo.",
    notes: "Nguyễn Thái Hảo mở đầu trong 20–25 giây. Dùng AI Technical Interviewer là tên đề tài; MyInterview là tên sản phẩm. Chuyển thẳng sang đội ngũ và hành trình người học.",
    source: "Thông tin học vụ và product brief do nhóm NEXUS cung cấp"
  },
  ...profileSlides,
  {
    id: "topic",
    page: "03",
    section: "problem",
    kind: "media",
    eyebrow: "BÀI TOÁN",
    title: "Luyện nhiều chưa chắc tiến bộ nếu phản hồi không chỉ ra câu trả lời còn thiếu gì.",
    description: "Khoảng trống nằm ở việc bám sát vị trí mục tiêu, chiều sâu kỹ thuật và bằng chứng trong câu trả lời.",
    notes: "Phan Ngọc Diễm Quỳnh trình bày trong 35 giây. Chốt bằng một câu: người học không thiếu câu hỏi; họ thiếu phản hồi có ngữ cảnh và có thể hành động.",
    source: "Product brief và ảnh dashboard MyInterview local",
    insight: "Ngữ cảnh nghề nghiệp phải được khóa trước khi hệ thống đặt câu hỏi.",
    items: [{
      assetId: "product-dashboard",
      eyebrow: "ĐẦU VÀO",
      title: "Hồ sơ, CV, JD và mục tiêu cùng nằm trong một hành trình",
      caption: "Người học chuẩn bị ngữ cảnh trước khi bắt đầu phiên phỏng vấn.",
      featured: true
    }]
  },
  {
    id: "current-state-gap",
    page: "04",
    section: "problem",
    kind: "comparison",
    eyebrow: "PHÂN TÍCH HIỆN TRẠNG",
    title: "Khoảng trống nằm giữa việc trả lời một câu hỏi và biết cách trả lời tốt hơn.",
    notes: "Đây là đối chiếu định tính từ phạm vi sản phẩm và mục tiêu coaching, không phải kết quả khảo sát định lượng.",
    source: "Phân tích định tính từ current product state và graduation journey",
    left: {
      eyebrow: "LUYỆN TẬP RỜI RẠC",
      title: "Người học phải tự nối dữ liệu",
      points: ["Câu hỏi tách khỏi CV và JD", "Nhận xét chung chung", "Khó truy ngược về câu trả lời", "Không có kế hoạch luyện lại"],
      tone: "ink"
    },
    right: {
      eyebrow: "VÒNG COACHING",
      title: "MyInterview nối ngữ cảnh với hành động",
      points: ["Khóa CV, JD và mục tiêu", "Đánh giá theo tiêu chí", "Gắn phản hồi với bằng chứng", "Lưu lịch sử và luyện lại"],
      tone: "teal"
    }
  },
  {
    id: "solution",
    page: "05",
    section: "solution",
    kind: "media",
    eyebrow: "GIẢI PHÁP",
    title: "Một vòng luyện tập hoàn chỉnh đi từ ngữ cảnh nghề nghiệp đến phản hồi có bằng chứng.",
    description: "Đầu vào, câu hỏi, câu trả lời, tiêu chí đánh giá và bước luyện tiếp theo giữ cùng một mạch.",
    notes: "Nguyễn Ngọc Anh Thư trình bày trong 45 giây. Đi từ ảnh thiết lập phiên sang ảnh phản hồi; nhấn rằng đầu ra không chỉ là một điểm tổng.",
    source: "Ảnh setup và feedback MyInterview local",
    items: [
      {
        assetId: "product-setup",
        eyebrow: "01 · KHÓA BỐI CẢNH",
        title: "Thiết lập phiên theo CV, JD và mục tiêu",
        caption: "Ngữ cảnh được chọn trước khi hệ thống lập kế hoạch câu hỏi."
      },
      {
        assetId: "product-feedback",
        eyebrow: "02 · TẠO HÀNH ĐỘNG",
        title: "Phản hồi giải thích điểm mạnh, điểm thiếu và bước tiếp theo",
        caption: "Điểm số đi cùng lý do và bằng chứng thay vì đứng độc lập.",
        featured: true
      }
    ]
  },
  {
    id: "architecture",
    page: "06",
    section: "proof",
    kind: "architecture",
    eyebrow: "KIẾN TRÚC HỆ THỐNG",
    title: "Giao diện tối ưu trải nghiệm; backend giữ trạng thái, phân quyền và tính toàn vẹn dữ liệu.",
    notes: "Nguyễn Thái Hảo trình bày trong 55 giây. Đi từ giao diện xuống dữ liệu và dịch vụ AI; nhấn backend là nguồn trạng thái chuẩn.",
    source: "Frontend package manifest và backend architecture documents",
    layers: [
      { label: "GIAO DIỆN", items: ["Next.js 16.2.11", "React 19.2.7", "TypeScript 6.0.3"], tone: "paper" },
      { label: "API & THỜI GIAN THỰC", items: ["FastAPI 0.139.0", "REST", "WebSocket", "Xác thực"], tone: "cobalt" },
      { label: "NGHIỆP VỤ", items: ["Kiểm tra dữ liệu", "Phân quyền", "Vòng đời phỏng vấn", "Điều phối AI"], tone: "ink" },
      { label: "DỮ LIỆU & TÁC VỤ", items: ["PostgreSQL / Neon", "SQLAlchemy async", "pgvector", "Redis"], tone: "teal" },
      { label: "DỊCH VỤ AI", items: ["Google Gen AI", "Speechmatics chính", "Deepgram dự phòng"], tone: "amber" }
    ]
  },
  {
    id: "ai-scoring",
    page: "07",
    section: "proof",
    kind: "criteria",
    eyebrow: "AI & ĐÁNH GIÁ",
    title: "Sáu tiêu chí giải thích câu trả lời cần cải thiện ở đâu — không chỉ đưa ra một điểm tổng.",
    notes: "Phạm Nguyễn Bảo Minh trình bày trong 55 giây. Nhấn chiều sâu kỹ thuật và bằng chứng. Đây là rubric coaching, không phải quyết định tuyển dụng.",
    source: "Assessment rubric và scorer contracts",
    criteria: [
      { label: "Đúng trọng tâm", question: "Có trả lời đúng vấn đề?", output: "Mức lệch trọng tâm", tone: "cobalt" },
      { label: "Rõ ràng", question: "Có dễ hiểu và súc tích?", output: "Gợi ý diễn đạt", tone: "teal" },
      { label: "Cấu trúc", question: "Lập luận có trình tự?", output: "Khung trả lời", tone: "ink" },
      { label: "Chiều sâu kỹ thuật", question: "Có quyết định, lý do và đánh đổi?", output: "Khoảng thiếu kiến thức", tone: "amber", featured: true },
      { label: "Bằng chứng", question: "Có ví dụ, hành động và kết quả?", output: "Khoảng thiếu bằng chứng", tone: "teal" },
      { label: "Phù hợp JD", question: "Có liên hệ vị trí mục tiêu?", output: "Mức độ liên kết", tone: "cobalt" }
    ]
  },
  {
    id: "data-responsible-ai",
    page: "08",
    section: "proof",
    kind: "comparison",
    eyebrow: "DỮ LIỆU & AI CÓ TRÁCH NHIỆM",
    title: "Người dùng giữ quyền với dữ liệu; AI không thay quyết định tuyển dụng.",
    notes: "Phan Ngọc Diễm Quỳnh trình bày trong 45 giây theo hai vế: quyền dữ liệu và giới hạn quyền quyết định của AI.",
    source: "Privacy, retention và responsible-AI documents",
    left: {
      eyebrow: "QUYỀN DỮ LIỆU",
      title: "Người dùng kiểm soát",
      points: ["Đồng ý trước khi xử lý", "Mỗi tài nguyên có chủ sở hữu", "Có thể xuất và xóa dữ liệu", "Chỉ gửi ngữ cảnh cần thiết"],
      tone: "teal"
    },
    right: {
      eyebrow: "GIỚI HẠN AI",
      title: "Không vượt quyền",
      points: ["Không tự động đỗ hoặc trượt", "Không xếp hạng ứng viên", "Không phân tích khuôn mặt hoặc cảm xúc", "Không gọi fixture là bằng chứng phát hành"],
      tone: "amber"
    }
  },
  {
    id: "implementation",
    page: "09",
    section: "proof",
    kind: "status",
    eyebrow: "MỨC ĐỘ THỰC HIỆN",
    title: "Luồng văn bản là lõi đã được hỗ trợ; giọng nói và phát hành công khai vẫn phụ thuộc bằng chứng.",
    notes: "Nguyễn Thái Hảo trình bày trong 45 giây. Phân biệt phần hỗ trợ tốt nghiệp, phần cần bằng chứng bên ngoài và trạng thái phát hành.",
    source: "Current product state và graduation scope",
    statuses: [
      { value: "SUPPORTED", label: "Luồng tốt nghiệp", note: "Hồ sơ → CV/JD → phỏng vấn văn bản → đánh giá → phản hồi", tone: "teal" },
      { value: "GATED", label: "Phỏng vấn giọng nói", note: "Có triển khai nhưng cần kiểm chứng dịch vụ và luồng chạy thật", tone: "amber" },
      { value: "CONTROLLED", label: "Doanh nghiệp / tuyển dụng", note: "Phần mở rộng có điều kiện, không phải luận điểm chính", tone: "cobalt" },
      { value: "BLOCKED", label: "Phát hành công khai", note: "Chưa được phê duyệt khi chưa đủ bằng chứng vận hành", tone: "ink" }
    ]
  },
  {
    id: "testing-evidence",
    page: "10",
    section: "proof",
    kind: "table",
    eyebrow: "KIỂM THỬ & BẰNG CHỨNG",
    title: "Một tuyên bố chỉ được đưa lên slide khi có bằng chứng đúng môi trường và đúng revision.",
    notes: "Nhữ Mai Gia Hoàng trình bày trong 50 giây. Không đọc từng dòng; giải thích mỗi loại claim cần đúng loại evidence.",
    source: "Defense playbook và evidence matrix",
    columns: ["Luận điểm", "Bằng chứng phù hợp", "Giới hạn trình bày"],
    rows: [
      ["Luồng nghiệp vụ", "E2E, ảnh giao diện, dữ liệu đã lưu", "Nêu revision và vai trò"],
      ["API và quyền truy cập", "Test contract, ownership, status code", "Không suy rộng từ unit test"],
      ["AI và đánh giá", "Schema, fixture, kết quả nhà cung cấp", "Nêu model và điều kiện"],
      ["Giọng nói", "Phiên hoàn chỉnh với dịch vụ thật", "Giữ trạng thái gated nếu thiếu"],
      ["Phát hành", "Môi trường, tải, giám sát và phục hồi", "Không suy từ máy cục bộ"]
    ],
    note: "Bằng chứng từ revision khác không được dùng để chứng minh trạng thái hiện tại."
  },
  {
    id: "limitations-roadmap",
    page: "11",
    section: "decision",
    kind: "roadmap",
    eyebrow: "GIỚI HẠN & HƯỚNG PHÁT TRIỂN",
    title: "Bước tiếp theo không phải thêm nhiều tính năng — mà là nâng mức bằng chứng và độ tin cậy.",
    notes: "Nguyễn Thái Hảo trình bày trong 45 giây. Trình bày giới hạn như ranh giới có kiểm soát, không phải danh sách lỗi.",
    source: "Release blockers và capability roadmap",
    steps: [
      { label: "Giữ lõi đã chứng minh", description: "Dùng phỏng vấn văn bản làm demo chính; voice và B2B không che khuất graduation core.", value: "HIỆN TẠI", tone: "teal" },
      { label: "Chứng minh runtime thật", description: "Hoàn tất phiên voice nhiều lượt, reconnect, fallback và mở lại kết quả đã lưu.", value: "GATE 01", tone: "amber", featured: true },
      { label: "Củng cố vận hành", description: "Đo tải, timeout, observability, migration, backup và phục hồi.", value: "GATE 02", tone: "cobalt" },
      { label: "Mở rộng có kiểm soát", description: "Chỉ mở public release hoặc B2B khi evidence đúng revision vượt quality gate.", value: "SAU GATE", tone: "ink" }
    ]
  },
  {
    id: "conclusion",
    page: "12",
    section: "decision",
    kind: "closing",
    eyebrow: "KẾT LUẬN",
    title: "MyInterview giúp người học biết cần cải thiện điều gì — và vì sao.",
    description: "Giá trị cốt lõi nằm ở việc nối câu trả lời với tiêu chí, bằng chứng và một bước luyện tiếp theo.",
    statement: "Bối cảnh. Bằng chứng. Hành động.",
    byline: "Nhóm NEXUS · MyInterview",
    notes: "Nguyễn Thái Hảo kết luận trong 30 giây. Chốt ba từ: bối cảnh, bằng chứng, hành động; sau đó chuyển sang demo.",
    source: "Tổng kết graduation journey"
  },
  {
    id: "demo",
    page: "13",
    section: "demo",
    kind: "media",
    eyebrow: "DEMO TRỰC TIẾP",
    title: "Từ CV và JD đến một phản hồi có thể truy ngược về câu trả lời.",
    notes: "Nguyễn Ngọc Anh Thư điều phối demo trong 6–7 phút. Nếu lỗi quá 15 giây, dùng ba ảnh xác thực và phiên hoàn tất dự phòng.",
    source: "Ảnh demo MyInterview local đã kiểm tra",
    items: [
      { assetId: "product-setup", eyebrow: "01", title: "Khóa bối cảnh", caption: "Chọn CV, JD và mục tiêu luyện tập." },
      { assetId: "product-interview", eyebrow: "02", title: "Trả lời theo lượt", caption: "Một câu chính, trạng thái rõ và câu hỏi đào sâu có giới hạn.", featured: true },
      { assetId: "product-feedback", eyebrow: "03", title: "Biến đánh giá thành hành động", caption: "Điểm, bằng chứng, điểm thiếu và bước luyện tiếp theo." }
    ]
  },
  {
    id: "appendix-backend",
    page: "A1",
    section: "appendix",
    kind: "architecture",
    eyebrow: "PHỤ LỤC A",
    title: "Business logic được tách khỏi transport để dễ kiểm thử và thay đổi nhà cung cấp.",
    notes: "Dùng khi hội đồng hỏi dependency direction hoặc nơi business logic được đặt. Đi từ API xuống schema.",
    source: "Backend architecture documents",
    layers: [
      { label: "API", items: ["Router", "Authentication dependency", "Request / response mapping"], tone: "cobalt" },
      { label: "SERVICES", items: ["Business logic", "Transaction", "Provider orchestration"], tone: "teal" },
      { label: "MODELS", items: ["SQLAlchemy ORM", "Ownership", "Constraints"], tone: "ink" },
      { label: "SCHEMAS", items: ["Pydantic contracts", "JSONB validation", "OpenAPI types"], tone: "amber" }
    ]
  },
  {
    id: "appendix-state-machines",
    page: "A2",
    section: "appendix",
    kind: "process",
    eyebrow: "PHỤ LỤC B",
    title: "Máy trạng thái giữ mỗi lượt phỏng vấn nhất quán trước lỗi mạng và callback muộn.",
    notes: "Dùng khi hội đồng hỏi callback muộn, retry hoặc vì sao không sinh câu hỏi ngẫu nhiên từng lượt.",
    source: "Interview and scoring state contracts",
    steps: [
      { label: "Khóa bối cảnh", description: "Hồ sơ, CV, JD và mục tiêu", tone: "cobalt" },
      { label: "Lập kế hoạch", description: "Năng lực và độ khó cần kiểm tra", tone: "teal" },
      { label: "Phát hành câu hỏi", description: "Mỗi lượt chỉ có một câu chính", tone: "amber" },
      { label: "Đánh giá trạng thái", description: "Kiểm tra callback, lỗi và độ phủ", tone: "cobalt" },
      { label: "Chuyển lượt", description: "Backend xác nhận rồi mới tiếp tục", tone: "teal" }
    ]
  },
  {
    id: "appendix-rubric",
    page: "A3",
    section: "appendix",
    kind: "table",
    eyebrow: "PHỤ LỤC C",
    title: "Rubric biến nhận xét AI thành sáu câu hỏi có thể giải thích và kiểm tra.",
    notes: "Dùng khi hội đồng hỏi cách đọc điểm. Điểm tổng không được che khuất tiêu chí và bằng chứng thành phần.",
    source: "Assessment rubric and scorer contracts",
    columns: ["Tiêu chí", "Hệ thống xem xét", "Đầu ra"],
    rows: [
      ["Đúng trọng tâm", "Có trả lời đúng câu hỏi?", "Mức lệch"],
      ["Rõ ràng", "Có dễ hiểu và súc tích?", "Gợi ý diễn đạt"],
      ["Cấu trúc", "Lập luận có trình tự?", "Khung trả lời"],
      ["Chiều sâu kỹ thuật", "Có quyết định và đánh đổi?", "Khoảng thiếu"],
      ["Bằng chứng", "Có ví dụ, hành động, kết quả?", "Khoảng thiếu bằng chứng"],
      ["Phù hợp JD", "Có liên hệ vị trí mục tiêu?", "Mức liên kết"]
    ],
    note: "Rubric phục vụ luyện tập; không dùng để tự động đỗ, trượt hoặc xếp hạng ứng viên."
  },
  {
    id: "appendix-auth-data",
    page: "A4",
    section: "appendix",
    kind: "comparison",
    eyebrow: "PHỤ LỤC D",
    title: "Đăng nhập xác định người dùng; ownership quyết định họ được phép chạm vào dữ liệu nào.",
    notes: "Dùng khi hội đồng hỏi IDOR, ownership hoặc quyền xóa dữ liệu. Nói theo hai lớp: xác thực và quyền trên tài nguyên.",
    source: "Authentication, ownership và privacy contracts",
    left: { eyebrow: "XÁC THỰC", title: "Ai đang gửi yêu cầu?", points: ["Phiên đăng nhập hợp lệ", "Token hết hạn hoặc bị thu hồi", "Vai trò người dùng", "Giới hạn tần suất"], tone: "cobalt" },
    right: { eyebrow: "PHÂN QUYỀN DỮ LIỆU", title: "Họ sở hữu tài nguyên nào?", points: ["CV, JD và phiên phỏng vấn", "Assessment và feedback", "Tổ chức / tenant", "Xuất và xóa dữ liệu"], tone: "teal" }
  },
  {
    id: "appendix-voice",
    page: "A5",
    section: "appendix",
    kind: "comparison",
    eyebrow: "PHỤ LỤC E",
    title: "Voice chỉ được mở rộng khi toàn bộ vòng đời âm thanh có bằng chứng chạy thật.",
    notes: "Dùng khi hội đồng hỏi vì sao có voice nhưng không dùng làm luận điểm chính. Nêu rõ điều kiện nâng capability.",
    source: "Voice reliability requirements",
    left: { eyebrow: "ĐÃ CÓ TRONG MÃ NGUỒN", title: "Năng lực kỹ thuật", points: ["WebSocket và audio pipeline", "Speechmatics là dịch vụ chính", "Deepgram là phương án dự phòng", "Transcript và scoring lifecycle"], tone: "cobalt" },
    right: { eyebrow: "CẦN CHỨNG MINH", title: "Điều kiện nâng trạng thái", points: ["Ba lượt âm thanh hoàn chỉnh", "Reconnect và mất mạng", "Giới hạn chờ và fallback", "Kết quả được lưu và mở lại"], tone: "amber" }
  },
  {
    id: "appendix-deployment-stack",
    page: "A6",
    section: "appendix",
    kind: "architecture",
    eyebrow: "PHỤ LỤC F",
    title: "Stack triển khai tách giao diện, API, dữ liệu, hàng đợi và dịch vụ AI theo ranh giới rõ.",
    notes: "Dùng khi hội đồng hỏi công nghệ hoặc triển khai. Nhắc lại public release còn bị chặn bởi evidence gate.",
    source: "Runtime manifests và release gates",
    layers: [
      { label: "WEB", items: ["Next.js 16.2.11", "React 19.2.7", "TypeScript 6.0.3"], tone: "paper" },
      { label: "API", items: ["FastAPI 0.139.0", "REST", "WebSocket"], tone: "cobalt" },
      { label: "DATA", items: ["PostgreSQL / Neon", "pgvector", "Redis"], tone: "teal" },
      { label: "AI", items: ["Google Gen AI", "Speechmatics", "Deepgram dự phòng"], tone: "amber" },
      { label: "RELEASE GATE", items: ["Migration", "Observability", "Load", "Recovery"], tone: "ink" }
    ]
  }
] as const;

export const MYINTERVIEW_SLIDE_ORDER = MYINTERVIEW_SLIDES.map((slide) => slide.id);
