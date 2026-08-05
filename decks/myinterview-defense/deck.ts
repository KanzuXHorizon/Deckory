import { defineDeck } from "@deckory/schema";

const footer = (page: string, source: string) => ({
  id: `footer-${page.toLowerCase()}`,
  type: "evidence-footer" as const,
  props: {
    page,
    source,
    logoAssetId: "fpt-polytechnic-logo",
    brandLabel: "FPT Polytechnic Đồng Nai – Cơ sở 2"
  }
});

export const myInterviewDefense = defineDeck({
  id: "myinterview-defense",
  version: 1,
  title: "MyInterview — AI Technical Interviewer",
  locale: "vi-VN",
  themeId: "myinterview-academic-defense",
  theme: {
    preset: "editorial-light",
    accent: "teal",
    typography: "modern",
    density: "comfortable"
  },
  assets: [
    {
      id: "fpt-polytechnic-logo",
      type: "image",
      src: "/brand/fpt-polytechnic.svg",
      mediaType: "image/svg+xml",
      width: 760,
      height: 180,
      source: {
        label: "FPT Polytechnic logo — đối chiếu từ nguồn người dùng cung cấp"
      }
    }
  ],
  slides: [
    {
      id: "cover",
      layout: "architecture",
      variant: "spotlight",
      background: "spotlight",
      transition: { type: "fade", duration: 0.45 },
      notes: "Nguyễn Thái Hảo mở đầu. Giới thiệu đúng tên đề tài trong quyết định: AI Technical Interviewer. Sau đó dùng tên sản phẩm MyInterview để kể câu chuyện sản phẩm.",
      components: [
        {
          id: "cover-heading",
          type: "heading",
          effect: { type: "rise", duration: 0.42 },
          props: {
            eyebrow: "FPT POLYTECHNIC • PRO2192.01 • DỰ ÁN TỐT NGHIỆP",
            title: "AI Technical Interviewer",
            emphasis: "MyInterview",
            description: "Nền tảng luyện phỏng vấn kỹ thuật bằng AI, giúp sinh viên chuẩn bị theo đúng hồ sơ, vị trí mục tiêu và bằng chứng trong từng câu trả lời."
          }
        },
        {
          id: "cover-brand",
          type: "team-showcase",
          sequence: 1,
          effect: { type: "pop", duration: 0.34 },
          props: {
            project: "NEXUS",
            variant: "profile",
            members: [
              {
                id: "institution",
                name: "FPT Polytechnic Đồng Nai – Cơ sở 2",
                role: "Dự án tốt nghiệp • PRO2192.01",
                summary: "Chuyên ngành Phát triển phần mềm • GVHD: Thầy Hồ Hoàng Chương",
                image: { assetId: "fpt-polytechnic-logo", alt: "Logo FPT Polytechnic", position: "center" },
                accent: "amber"
              }
            ]
          }
        },
        footer("01", "Thông tin học vụ do nhóm cung cấp / 2026")
      ]
    },
    {
      id: "team",
      layout: "process",
      variant: "quiet",
      transition: { type: "slide", duration: 0.38 },
      notes: "Không đọc dài phần phân vai. Chỉ giới thiệu nhanh tên, MSSV và đầu mối chuyên môn. Chi tiết trách nhiệm để trong notes và dùng khi Q&A.",
      components: [
        {
          id: "team-heading",
          type: "heading",
          props: {
            eyebrow: "NHÓM NEXUS",
            title: "Năm thành viên, một mạch triển khai xuyên suốt từ sản phẩm đến kiểm chứng.",
            description: "Phân vai rõ để mỗi phần thuyết trình có người sở hữu và có người hỗ trợ khi phản biện."
          }
        },
        {
          id: "team-members",
          type: "team-showcase",
          props: {
            title: "Nhóm thực hiện",
            subtitle: "Vai trò hiển thị ngắn gọn; phạm vi chi tiết nằm trong speaker notes.",
            project: "MyInterview",
            variant: "constellation",
            members: [
              { id: "nguyen-thai-hao", name: "Nguyễn Thái Hảo", studentId: "TB01328", role: "Trưởng nhóm • Kiến trúc • Tích hợp", accent: "cobalt", featured: true },
              { id: "phan-ngoc-diem-quynh", name: "Phan Ngọc Diễm Quỳnh", studentId: "TB01432", role: "Sản phẩm • Nghiệp vụ • QA", accent: "teal" },
              { id: "nguyen-ngoc-anh-thu", name: "Nguyễn Ngọc Anh Thư", studentId: "TB01321", role: "Thuyết trình • Demo • UI/UX", accent: "amber" },
              { id: "nhu-mai-gia-hoang", name: "Nhữ Mai Gia Hoàng", studentId: "TB01424", role: "Tài liệu • Kiểm thử • Bằng chứng", accent: "teal" },
              { id: "pham-nguyen-bao-minh", name: "Phạm Nguyễn Bảo Minh", studentId: "TB01386", role: "Hệ thống • State machine • Kỹ thuật", accent: "neutral" }
            ]
          }
        },
        footer("02", "Cẩm nang huấn luyện cá nhân của 5 thành viên / 2026")
      ]
    },
    {
      id: "agenda",
      layout: "process",
      transition: { type: "wipe", duration: 0.42 },
      notes: "Nêu tổng quan trong khoảng 25 giây. Demo đặt ở cuối, sau khi đã giải thích đầy đủ bài toán, thiết kế, triển khai và kiểm thử.",
      components: [
        { id: "agenda-heading", type: "heading", props: { eyebrow: "NỘI DUNG", title: "Bài bảo vệ đi từ vấn đề thật đến bằng chứng và demo cuối cùng." } },
        {
          id: "agenda-flow",
          type: "process",
          props: {
            steps: [
              { title: "Giới thiệu đề tài", note: "Bối cảnh, bài toán và mục tiêu", icon: "people" },
              { title: "Khảo sát & phân tích", note: "Hiện trạng, khoảng trống và phạm vi", icon: "data" },
              { title: "Thiết kế", note: "Workflow, kiến trúc, dữ liệu và AI", icon: "system" },
              { title: "Thực hiện", note: "Công nghệ, kiểm thử và mức sẵn sàng", icon: "sparkle" },
              { title: "Demo & tổng kết", note: "Luồng chính, thuận lợi, khó khăn và định hướng", icon: "people" }
            ]
          }
        },
        footer("03", "Outline bảo vệ PRO2192 — nhóm NEXUS")
      ]
    },
    {
      id: "problem",
      layout: "statement",
      variant: "spotlight",
      transition: { type: "morph", duration: 0.5, easing: "emphasized" },
      notes: "Phan Ngọc Diễm Quỳnh trình bày. Không dùng số liệu khảo sát chưa có nguồn. Tập trung vào vấn đề quan sát được trong hành trình chuẩn bị phỏng vấn của sinh viên.",
      components: [
        {
          id: "problem-statement",
          type: "statement",
          effect: { type: "blur", duration: 0.35 },
          props: {
            quote: "Ứng viên có thể luyện nhiều lần, nhưng vẫn khó biết câu trả lời nào thiếu bằng chứng, lệch vị trí mục tiêu hoặc chưa đủ chiều sâu kỹ thuật.",
            byline: "Khoảng trống mà MyInterview tập trung giải quyết"
          }
        },
        footer("04", "Phân tích nghiệp vụ MyInterview; chưa phải khảo sát định lượng")
      ]
    },
    {
      id: "objectives",
      layout: "dashboard",
      transition: { type: "zoom", duration: 0.4 },
      notes: "Chốt ba mục tiêu sản phẩm. Tránh nói hệ thống thay thế nhà tuyển dụng hoặc đảm bảo kết quả tuyển dụng.",
      components: [
        { id: "objectives-heading", type: "heading", props: { eyebrow: "MỤC TIÊU", title: "MyInterview biến luyện tập rời rạc thành một vòng lặp cải thiện có ngữ cảnh." } },
        {
          id: "objectives-metrics",
          type: "metric-grid",
          props: {
            metrics: [
              { value: "01", label: "Cá nhân hóa", note: "Dùng hồ sơ, CV, JD và mục tiêu nghề nghiệp", tone: "cobalt" },
              { value: "02", label: "Phản hồi có cấu trúc", note: "Điểm, bằng chứng, điểm mạnh, điểm yếu và bước tiếp theo", tone: "teal" },
              { value: "03", label: "Luyện lại có định hướng", note: "Lịch sử, coaching và so sánh tiến bộ", tone: "amber" }
            ]
          }
        },
        footer("05", "CURRENT_PRODUCT_STATE_2026-08-05.md")
      ]
    },
    {
      id: "scope",
      layout: "comparison",
      transition: { type: "slide", duration: 0.4 },
      notes: "Giải thích ranh giới để hội đồng hiểu nhóm chủ động giới hạn sản phẩm, không phải thiếu định hướng.",
      components: [
        { id: "scope-heading", type: "heading", props: { eyebrow: "PHẠM VI", title: "Luồng luyện tập là lõi; quyết định tuyển dụng nằm ngoài ranh giới sản phẩm." } },
        {
          id: "scope-comparison",
          type: "comparison",
          props: {
            left: {
              eyebrow: "TRỌNG TÂM",
              title: "Graduation core",
              points: ["Hồ sơ, CV và JD", "Phỏng vấn văn bản có cấu trúc", "Đánh giá và feedback có bằng chứng", "Coaching, lịch sử và quyền dữ liệu"]
            },
            right: {
              eyebrow: "KHÔNG TUYÊN BỐ",
              title: "Ngoài phạm vi",
              points: ["Tự động đỗ hoặc trượt", "Xếp hạng ứng viên", "Phân tích khuôn mặt hoặc cảm xúc", "Chứng nhận pháp lý hoặc fairness tuyệt đối"]
            }
          }
        },
        footer("06", "MyInterview product boundary / 2026")
      ]
    },
    {
      id: "journey",
      layout: "process",
      transition: { type: "wipe", duration: 0.44 },
      notes: "Diễm Quỳnh trình bày luồng người dùng. Chỉ cần nói năm chặng lớn, không đọc mọi màn hình.",
      components: [
        { id: "journey-heading", type: "heading", props: { eyebrow: "HÀNH TRÌNH NGƯỜI DÙNG", title: "Mỗi bước bổ sung ngữ cảnh để câu hỏi và phản hồi ngày càng sát mục tiêu." } },
        {
          id: "journey-process",
          type: "process",
          props: {
            steps: [
              { title: "Chuẩn bị", note: "Tài khoản, consent, hồ sơ và mục tiêu", icon: "people" },
              { title: "Định vị", note: "Tải CV, tạo JD và chọn ngữ cảnh", icon: "data" },
              { title: "Phỏng vấn", note: "Một câu mỗi lượt, quản lý trạng thái rõ", icon: "system" },
              { title: "Đánh giá", note: "Rubric, bằng chứng và action plan", icon: "sparkle" },
              { title: "Cải thiện", note: "Lịch sử, coaching, retry và so sánh", icon: "people" }
            ]
          }
        },
        footer("07", "Luồng nghiệp vụ cốt lõi trong playbook nhóm")
      ]
    },
    {
      id: "solution",
      layout: "architecture",
      variant: "spotlight",
      transition: { type: "morph", duration: 0.5 },
      notes: "Chốt cơ chế tạo giá trị: context → interview → evidence → action. Đây là thông điệp chính của sản phẩm.",
      components: [
        { id: "solution-heading", type: "heading", props: { eyebrow: "GIẢI PHÁP", title: "MyInterview không chỉ hỏi; hệ thống giữ ngữ cảnh, bằng chứng và hành động trong cùng một vòng lặp." } },
        {
          id: "solution-architecture",
          type: "architecture",
          props: {
            layers: [
              { label: "CONTEXT", items: ["Profile", "CV", "JD", "Mục tiêu nghề nghiệp"] },
              { label: "INTERVIEW", items: ["Question plan", "Turn state", "Follow-up", "Transcript"], accent: true },
              { label: "ASSESSMENT", items: ["Rubric", "Evidence", "Score authority", "Feedback"] },
              { label: "COACHING", items: ["Action plan", "Suggested answer", "Retry", "History"], accent: true }
            ]
          }
        },
        footer("08", "MyInterview graduation journey")
      ]
    },
    {
      id: "architecture",
      layout: "architecture",
      variant: "technical",
      transition: { type: "slide", duration: 0.42 },
      notes: "Nguyễn Thái Hảo trình bày. Đi từ trên xuống dưới và nhấn backend kiểm soát quyền, schema và lifecycle.",
      components: [
        { id: "architecture-heading", type: "heading", props: { eyebrow: "THIẾT KẾ HỆ THỐNG", title: "Frontend tập trung trải nghiệm; backend giữ quyền quyết định trạng thái và tính toàn vẹn dữ liệu." } },
        {
          id: "architecture-layers",
          type: "architecture",
          props: {
            layers: [
              { label: "CLIENT", items: ["Next.js 16", "React 19", "TypeScript 6", "UI state"] },
              { label: "API & REALTIME", items: ["FastAPI", "REST", "WebSocket", "Authentication"], accent: true },
              { label: "BUSINESS SERVICES", items: ["Validation", "Permissions", "Interview lifecycle", "AI orchestration"] },
              { label: "DATA & JOBS", items: ["PostgreSQL / Neon", "pgvector", "Redis", "Background jobs"], accent: true },
              { label: "AI PROVIDERS", items: ["Google Gen AI", "Speechmatics", "Deepgram fallback", "Structured output"] }
            ]
          }
        },
        footer("09", "Repository architecture and runtime manifests / 2026-08-05")
      ]
    },
    {
      id: "state-machine",
      layout: "process",
      variant: "technical",
      transition: { type: "wipe", duration: 0.45 },
      notes: "Phạm Nguyễn Bảo Minh trình bày. Giải thích theo ngôn ngữ người dùng: hệ thống khóa hồ sơ, CV, JD và mục tiêu trước; tạo kế hoạch câu hỏi; mỗi lượt chỉ phát hành một câu chính hoặc một câu hỏi đào sâu; backend kiểm soát trạng thái để callback muộn hoặc lỗi provider không làm sai phiên.",
      components: [
        { id: "state-heading", type: "heading", props: { eyebrow: "CÁCH TẠO CÂU HỎI", title: "Câu hỏi được tạo từ bối cảnh đã khóa, không sinh ngẫu nhiên theo từng lượt." } },
        {
          id: "state-process",
          type: "process",
          props: {
            steps: [
              { title: "Khóa bối cảnh", note: "Hồ sơ, CV, JD và mục tiêu luyện tập", icon: "data" },
              { title: "Lập kế hoạch", note: "Chọn năng lực cần kiểm tra và độ khó phù hợp", icon: "system" },
              { title: "Phát hành câu chính", note: "Mỗi lượt chỉ có một câu hỏi chuẩn", icon: "people" },
              { title: "Đào sâu có giới hạn", note: "Chỉ hỏi follow-up khi câu trả lời cần làm rõ", icon: "sparkle" },
              { title: "Khóa lượt", note: "Backend xác nhận trạng thái rồi mới chuyển câu tiếp", icon: "system" }
            ]
          }
        },
        footer("10", "Interview and scoring state contracts")
      ]
    },
    {
      id: "scoring",
      layout: "data",
      variant: "technical",
      transition: { type: "zoom", duration: 0.4 },
      notes: "Giải thích đây là rubric coaching, không phải quyết định tuyển dụng. Chỉ công bố điểm khi đủ bằng chứng và coverage.",
      components: [
        { id: "scoring-heading", type: "heading", props: { eyebrow: "AI & CHẤM ĐIỂM", title: "Điểm chỉ có ý nghĩa khi truy ngược được về câu trả lời và tiêu chí cụ thể." } },
        {
          id: "scoring-table",
          type: "table",
          props: {
            title: "Sáu tiêu chí cốt lõi",
            columns: ["Tiêu chí", "Hệ thống xem xét", "Đầu ra cho người học"],
            rows: [
              { cells: ["Mức liên quan", "Có trả lời đúng câu hỏi?", "Điểm lệch trọng tâm"] },
              { cells: ["Độ rõ ràng", "Có dễ hiểu và súc tích?", "Gợi ý diễn đạt"] },
              { cells: ["Cấu trúc", "Lập luận có trình tự?", "Khung trả lời"] },
              { cells: ["Chiều sâu kỹ thuật", "Có quyết định và trade-off?", "Khoảng thiếu kiến thức"], highlight: true },
              { cells: ["Bằng chứng", "Có ví dụ, hành động, kết quả?", "Evidence gap"] },
              { cells: ["Phù hợp JD", "Có liên hệ vị trí mục tiêu?", "Mức độ liên kết"] }
            ],
            note: "Điểm tổng dùng thang 0–100; tiêu chí ngữ cảnh chỉ áp dụng khi phù hợp với loại câu hỏi."
          }
        },
        footer("11", "Scorer contract and rubric v2.0")
      ]
    },
    {
      id: "scoring-simulator",
      layout: "data",
      variant: "spotlight",
      background: "grid",
      transition: { type: "zoom", duration: 0.4, easing: "emphasized" },
      notes: "Cho hội đồng thử thay đổi trọng số để thấy điểm tổng hợp thay đổi. Nhấn mạnh đây là mô phỏng minh hoạ rubric coaching, không phải công thức quyết định tuyển dụng và không đại diện dữ liệu production.",
      components: [
        {
          id: "scoring-simulator-heading",
          type: "heading",
          props: {
            eyebrow: "MÔ PHỎNG RUBRIC",
            title: "Trọng số thay đổi kết quả, vì vậy mọi điểm số phải công khai tiêu chí và giới hạn sử dụng.",
            description: "Điều chỉnh trọng số để quan sát độ nhạy của điểm tổng hợp trên cùng một bộ điểm tiêu chí minh hoạ."
          }
        },
        {
          id: "simulator",
          type: "weight-simulator",
          sequence: 1,
          effect: { type: "rise", duration: 0.42, easing: "emphasized" },
          props: {
            title: "Điểm coaching minh hoạ",
            description: "Thử các ưu tiên khác nhau mà không thay đổi điểm thành phần.",
            dimensions: [
              { id: "relevance", label: "Đúng trọng tâm", score: 82, weight: 25, tone: "cobalt" },
              { id: "clarity", label: "Độ rõ ràng", score: 78, weight: 20, tone: "teal" },
              { id: "structure", label: "Cấu trúc", score: 80, weight: 15, tone: "neutral" },
              { id: "technical-depth", label: "Chiều sâu kỹ thuật", score: 74, weight: 20, tone: "amber" },
              { id: "evidence", label: "Bằng chứng", score: 68, weight: 20, tone: "teal" }
            ],
            presets: [
              {
                id: "balanced",
                label: "Cân bằng",
                description: "Giữ tương quan giữa trọng tâm, diễn đạt, kỹ thuật và bằng chứng.",
                weights: { relevance: 25, clarity: 20, structure: 15, "technical-depth": 20, evidence: 20 }
              },
              {
                id: "evidence-first",
                label: "Nhấn mạnh bằng chứng",
                description: "Tăng vai trò của ví dụ, hành động và kết quả có thể kiểm chứng.",
                weights: { relevance: 20, clarity: 15, structure: 10, "technical-depth": 20, evidence: 35 }
              },
              {
                id: "technical-first",
                label: "Nhấn mạnh kỹ thuật",
                description: "Tăng vai trò của quyết định kỹ thuật và phân tích trade-off.",
                weights: { relevance: 20, clarity: 15, structure: 10, "technical-depth": 40, evidence: 15 }
              }
            ],
            disclaimer: "Dữ liệu và công thức chỉ dùng minh hoạ cơ chế coaching; không dùng để tự động đỗ, trượt hoặc xếp hạng ứng viên."
          }
        },
        {
          id: "scoring-simulator-insight",
          type: "insight",
          sequence: 2,
          effect: { type: "rise", duration: 0.36 },
          props: {
            label: "ĐIỂM CẦN BẢO VỆ",
            title: "Một điểm tổng không được che khuất cách nó được hình thành.",
            description: "Feedback phải truy ngược về tiêu chí, bằng chứng và điều kiện công bố; trọng số chỉ là một phần của contract.",
            metric: "100%",
            tone: "cobalt"
          }
        },
        footer("12", "Mô phỏng rubric minh hoạ; không phải dữ liệu hoặc quyết định tuyển dụng production")
      ]
    },
    {
      id: "scoring-flow",
      layout: "process",
      variant: "technical",
      transition: { type: "slide", duration: 0.42 },
      notes: "Trình bày chậm theo năm bước. Điểm không xuất hiện trực tiếp từ mô hình; hệ thống phải xác định bằng chứng, đối chiếu rubric, kiểm tra điều kiện công bố rồi mới tạo feedback.",
      components: [
        { id: "scoring-flow-heading", type: "heading", props: { eyebrow: "CÁCH HÌNH THÀNH ĐIỂM", title: "Từ câu trả lời đến điểm số phải đi qua bằng chứng, rubric và điều kiện công bố." } },
        {
          id: "scoring-flow-process",
          type: "process",
          props: {
            steps: [
              { title: "Đọc câu trả lời", note: "Giữ đúng câu hỏi và transcript của lượt", icon: "people" },
              { title: "Trích bằng chứng", note: "Tìm ví dụ, quyết định, hành động và kết quả", icon: "data" },
              { title: "Đối chiếu rubric", note: "Chấm từng tiêu chí theo thang điểm đã định nghĩa", icon: "system" },
              { title: "Kiểm tra độ tin cậy", note: "Coverage, số câu hợp lệ và trạng thái provider", icon: "sparkle" },
              { title: "Tạo feedback", note: "Điểm, lý do, điểm mạnh, điểm yếu và bước tiếp theo", icon: "people" }
            ]
          }
        },
        footer("13", "Assessment pipeline and score-authority contracts")
      ]
    },
    {
      id: "responsible-ai",
      layout: "comparison",
      transition: { type: "slide", duration: 0.42 },
      notes: "Diễm Quỳnh trình bày. Nhấn consent, data rights và giới hạn quyết định AI.",
      components: [
        { id: "responsible-heading", type: "heading", props: { eyebrow: "DỮ LIỆU & AI CÓ TRÁCH NHIỆM", title: "Giá trị coaching chỉ bền vững khi quyền dữ liệu và ranh giới quyết định được giữ rõ." } },
        {
          id: "responsible-comparison",
          type: "comparison",
          props: {
            left: { eyebrow: "BẢO VỆ NGƯỜI DÙNG", title: "Thiết kế có kiểm soát", points: ["Consent trước khi xử lý", "Ownership cho từng tài nguyên", "Export và xóa dữ liệu", "Structured context thay vì gửi dữ liệu thô không cần thiết"] },
            right: { eyebrow: "RANH GIỚI", title: "AI không được vượt quyền", points: ["Không tự động đỗ hoặc trượt", "Không xếp hạng tuyển dụng", "Không phân tích khuôn mặt hoặc cảm xúc", "Không gọi local proof là production proof"] }
          }
        },
        footer("14", "Privacy, retention and responsible AI documents")
      ]
    },
    {
      id: "implementation",
      layout: "dashboard",
      transition: { type: "zoom", duration: 0.4 },
      notes: "Bảo Minh trình bày mức độ hoàn thiện theo bằng chứng, không theo số lượng file hoặc cảm nhận.",
      components: [
        { id: "implementation-heading", type: "heading", props: { eyebrow: "THỰC HIỆN", title: "Nhóm ưu tiên hoàn thiện luồng văn bản trước, sau đó mới mở rộng các capability phụ thuộc hạ tầng." } },
        {
          id: "implementation-metrics",
          type: "metric-grid",
          props: {
            metrics: [
              { value: "CORE", label: "Đường demo chính", note: "CV/JD → text interview → scoring → feedback", tone: "teal" },
              { value: "GATED", label: "Voice interview", note: "Có implementation nhưng phụ thuộc provider và evidence runtime", tone: "amber" },
              { value: "CONTROLLED", label: "B2B / recruiter", note: "Phần mở rộng có kiểm soát, không phải luận điểm lõi", tone: "cobalt" },
              { value: "EXCLUDED", label: "Automated hiring", note: "Không nằm trong product boundary", tone: "amber" }
            ]
          }
        },
        footer("15", "CURRENT_PRODUCT_STATE_2026-08-05.md")
      ]
    },
    {
      id: "testing",
      layout: "process",
      transition: { type: "wipe", duration: 0.44 },
      notes: "Nhữ Mai Gia Hoàng trình bày. Phân biệt test case, kết quả chạy và tuyên bố có thể đưa lên slide.",
      components: [
        { id: "testing-heading", type: "heading", props: { eyebrow: "KIỂM THỬ & BẰNG CHỨNG", title: "Mỗi tuyên bố trong bài bảo vệ phải đi kèm một loại bằng chứng phù hợp." } },
        {
          id: "testing-process",
          type: "process",
          props: {
            steps: [
              { title: "Xác định claim", note: "Nói rõ điều cần chứng minh", icon: "data" },
              { title: "Viết test case", note: "Precondition, steps và expected", icon: "system" },
              { title: "Chạy baseline", note: "Ghi build, môi trường và role", icon: "people" },
              { title: "Thu thập evidence", note: "Ảnh, video, log hoặc test report", icon: "sparkle" },
              { title: "Gắn qualifier", note: "Local, controlled hay production", icon: "data" }
            ]
          }
        },
        footer("16", "Claim-to-evidence workflow in team playbook")
      ]
    },
    {
      id: "advantages-challenges",
      layout: "comparison",
      variant: "spotlight",
      transition: { type: "morph", duration: 0.5 },
      notes: "Nguyễn Thái Hảo trình bày. Đây là phần thuận lợi và khó khăn theo đúng outline. Nói ngắn, gắn mỗi khó khăn với cách xử lý thực tế.",
      components: [
        { id: "advantages-heading", type: "heading", props: { eyebrow: "THUẬN LỢI & KHÓ KHĂN", title: "Nhóm có nền tảng kỹ thuật tốt, nhưng chất lượng AI và realtime buộc phải được kiểm soát bằng contract." } },
        {
          id: "advantages-comparison",
          type: "comparison",
          props: {
            left: {
              eyebrow: "THUẬN LỢI",
              title: "Nền tảng để tiến nhanh",
              points: ["Phân vai theo chuyên môn rõ", "Kiến trúc module hóa", "Luồng văn bản ổn định để bảo vệ", "Có playbook, test evidence và fallback demo"]
            },
            right: {
              eyebrow: "KHÓ KHĂN",
              title: "Các điểm cần kiểm soát",
              points: ["Đầu ra AI không hoàn toàn xác định", "Realtime phụ thuộc provider và mạng", "Dữ liệu CV/JD nhạy cảm", "Không được nhầm code presence với production readiness"]
            }
          }
        },
        footer("17", "Tổng hợp từ architecture, risk register và defense playbook")
      ]
    },
    {
      id: "response-strategy",
      layout: "process",
      transition: { type: "slide", duration: 0.42 },
      notes: "Chuyển trực tiếp từ khó khăn sang cách xử lý để tránh tạo cảm giác dự án còn quá nhiều vấn đề chưa kiểm soát.",
      components: [
        { id: "response-heading", type: "heading", props: { eyebrow: "CÁCH XỬ LÝ", title: "Nhóm giảm rủi ro bằng validation, state machine, fallback và giới hạn tuyên bố." } },
        {
          id: "response-process",
          type: "process",
          props: {
            steps: [
              { title: "Structured output", note: "Schema validation trước khi lưu hoặc hiển thị", icon: "data" },
              { title: "State authority", note: "Backend kiểm soát transition và ownership", icon: "system" },
              { title: "Failure recovery", note: "Timeout, retry, fallback và error state", icon: "sparkle" },
              { title: "Privacy boundary", note: "Consent, data rights và tối thiểu hóa context", icon: "people" },
              { title: "Defense fallback", note: "Ảnh xác thực và phiên hoàn tất dự phòng", icon: "data" }
            ]
          }
        },
        footer("18", "Implementation and defense risk controls")
      ]
    },
    {
      id: "demo",
      layout: "process",
      variant: "spotlight",
      background: "bands",
      transition: { type: "zoom", duration: 0.48 },
      notes: "Nguyễn Ngọc Anh Thư điều phối demo cuối. Dùng tài khoản và dữ liệu mẫu. Chỉ chuyển khỏi slide một lần. Nếu lỗi quá 15 giây, chuyển ngay sang ảnh xác thực.",
      components: [
        { id: "demo-heading", type: "heading", props: { eyebrow: "DEMO TRỰC TIẾP", title: "Một luồng liền mạch từ ngữ cảnh nghề nghiệp đến feedback có bằng chứng." } },
        {
          id: "demo-process",
          type: "process",
          props: {
            steps: [
              { title: "Chọn CV & JD", note: "Khóa đúng bối cảnh ứng viên", icon: "data" },
              { title: "Thiết lập phiên", note: "Chọn chế độ và mục tiêu luyện tập", icon: "system" },
              { title: "Trả lời", note: "Một câu mỗi lượt, trạng thái rõ", icon: "people" },
              { title: "Chấm điểm", note: "Điểm liên kết với evidence", icon: "sparkle" },
              { title: "Hành động tiếp", note: "Feedback, action plan và retry", icon: "people" }
            ]
          }
        },
        footer("19", "Kịch bản demo chính — text interview")
      ]
    },
    {
      id: "conclusion",
      layout: "closing",
      variant: "spotlight",
      background: "spotlight",
      transition: { type: "fade", duration: 0.5 },
      notes: "Nguyễn Thái Hảo kết luận. Chốt bằng ba từ: bối cảnh, bằng chứng, hành động. Sau đó cảm ơn hội đồng và mời đặt câu hỏi.",
      components: [
        {
          id: "conclusion-heading",
          type: "heading",
          props: {
            eyebrow: "KẾT LUẬN",
            title: "MyInterview giúp người học biết mình cần cải thiện điều gì — và vì sao.",
            emphasis: "Bối cảnh. Bằng chứng. Hành động.",
            description: "Nhóm NEXUS tập trung hoàn thiện một luồng luyện phỏng vấn có thể giải thích, kiểm chứng và tiếp tục mở rộng an toàn."
          }
        },
        {
          id: "conclusion-statement",
          type: "statement",
          sequence: 1,
          props: {
            quote: "Xin cảm ơn Hội đồng và Giảng viên hướng dẫn.",
            byline: "Nhóm NEXUS • MyInterview"
          }
        },
        footer("20", "Tổng kết dự án tốt nghiệp PRO2192")
      ]
    },
    {
      id: "appendix-backend",
      layout: "architecture",
      variant: "technical",
      notes: "Dùng khi hội đồng hỏi dependency direction hoặc nơi business logic được đặt.",
      components: [
        { id: "appendix-backend-heading", type: "heading", props: { eyebrow: "PHỤ LỤC A", title: "Dependency direction giữ business logic độc lập với transport." } },
        { id: "appendix-backend-layers", type: "architecture", props: { layers: [
          { label: "api", items: ["Routers", "Authentication dependencies", "Request/response mapping"], accent: true },
          { label: "services", items: ["Business logic", "Transactions", "Provider orchestration"] },
          { label: "models", items: ["SQLAlchemy ORM", "Ownership", "Constraints"], accent: true },
          { label: "schemas", items: ["Pydantic contracts", "JSONB validation", "OpenAPI types"] }
        ] } },
        footer("A1", "Repository invariant: api → services → models")
      ]
    },
    {
      id: "appendix-score-authority",
      layout: "comparison",
      variant: "technical",
      notes: "Dùng khi hội đồng hỏi tại sao có điểm nhưng chưa chắc là điểm cuối cùng.",
      components: [
        { id: "appendix-score-heading", type: "heading", props: { eyebrow: "PHỤ LỤC B", title: "Điểm chỉ trở thành FINAL khi đủ độ phủ, bằng chứng và điều kiện authority." } },
        { id: "appendix-score-comparison", type: "comparison", props: {
          left: { eyebrow: "FINAL", title: "Đủ điều kiện công bố", points: ["Đủ competency coverage", "Đủ số câu trả lời hợp lệ", "Không có trợ giúp bị cấm", "Transcript/provider không degraded", "Rubric đang active"] },
          right: { eyebrow: "PROVISIONAL / HIDDEN", title: "Giữ giới hạn rõ", points: ["Thiếu coverage", "Quá ít câu hợp lệ", "Evidence chưa đạt threshold", "Có provider degradation", "Cần luyện thêm hoặc review"] }
        } },
        footer("A2", "Assessment authority contracts")
      ]
    },
    {
      id: "appendix-release",
      layout: "data",
      variant: "technical",
      notes: "Dùng khi hội đồng hỏi vì sao có code nhưng nhóm vẫn nói capability đang gated hoặc controlled.",
      components: [
        { id: "appendix-release-heading", type: "heading", props: { eyebrow: "PHỤ LỤC C", title: "Code presence, repository verification và production approval là ba mức khác nhau." } },
        { id: "appendix-release-table", type: "table", props: {
          title: "Cách đọc trạng thái capability",
          columns: ["Trạng thái", "Ý nghĩa", "Cách trình bày"],
          rows: [
            { cells: ["Supported core", "Nằm trong graduation journey", "Có thể demo theo revision"] },
            { cells: ["Evidence-gated", "Có implementation nhưng thiếu evidence bên ngoài", "Không tuyên bố public-ready"], highlight: true },
            { cells: ["Controlled", "Chỉ bật trong phạm vi hoặc cấu hình nhất định", "Nêu rõ điều kiện"] },
            { cells: ["Excluded", "Ngoài product boundary", "Không triển khai"] }
          ],
          note: "Mọi tuyên bố production phải có bằng chứng đúng môi trường và revision."
        } },
        footer("A3", "CURRENT_PRODUCT_STATE_2026-08-05.md")
      ]
    }
  ]
});
