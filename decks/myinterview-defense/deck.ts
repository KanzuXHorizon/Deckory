import { defineDeck, type Slide } from "@deckory/schema";
import { getSlideMaster } from "@deckory/templates";

const revision = "8f460b77";

const footer = (page: string, source: string) => ({
  id: `footer-${page.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  type: "evidence-footer" as const,
  props: {
    page,
    source,
    logoAssetId: "fpt-polytechnic-logo",
    brandLabel: "FPT Polytechnic Đồng Nai – Cơ sở 2"
  }
});

const team = [
  {
    id: "hao",
    name: "Nguyễn Thái Hảo",
    studentId: "TB01328",
    role: "Trưởng nhóm • Kiến trúc • Tích hợp",
    summary: "Định hướng kỹ thuật, tích hợp các module và điều phối luồng bảo vệ.",
    skills: ["Kiến trúc hệ thống", "Full-stack", "Tích hợp"],
    contributions: ["Thiết kế kiến trúc tổng thể", "Điều phối frontend–backend–AI", "Chuẩn bị demo và phản biện"],
    accent: "cobalt" as const,
    assetId: "team-hao"
  },
  {
    id: "minh",
    name: "Phạm Nguyễn Bảo Minh",
    studentId: "TB01386",
    role: "Backend • Máy trạng thái • Độ tin cậy",
    summary: "Phụ trách vòng đời phiên phỏng vấn, chuyển trạng thái và phục hồi lỗi dịch vụ.",
    skills: ["Backend", "Máy trạng thái", "Độ tin cậy"],
    contributions: ["Thiết kế vòng đời phiên", "Kiểm soát chuyển trạng thái", "Xử lý giới hạn chờ và dự phòng"],
    accent: "neutral" as const,
    assetId: "team-minh"
  },
  {
    id: "quynh",
    name: "Phan Ngọc Diễm Quỳnh",
    studentId: "TB01432",
    role: "Nghiệp vụ • Sản phẩm • QA",
    summary: "Phân tích bài toán người dùng, phạm vi chức năng và chất lượng nghiệp vụ.",
    skills: ["Phân tích nghiệp vụ", "Kiểm thử", "UX writing"],
    contributions: ["Phân tích yêu cầu", "Kiểm thử nghiệp vụ", "Kiểm soát phạm vi sản phẩm"],
    accent: "teal" as const,
    assetId: "team-quynh"
  },
  {
    id: "hoang",
    name: "Nhữ Mai Gia Hoàng",
    studentId: "TB01424",
    role: "Tài liệu • Kiểm thử • Bằng chứng",
    summary: "Xây dựng test case, quản lý tài liệu và đối chiếu luận điểm với bằng chứng.",
    skills: ["Kiểm thử", "Tài liệu", "Bằng chứng"],
    contributions: ["Xây dựng test case", "Quản lý tài liệu", "Tập hợp bằng chứng bảo vệ"],
    accent: "teal" as const,
    assetId: "team-hoang"
  },
  {
    id: "thu",
    name: "Nguyễn Ngọc Anh Thư",
    studentId: "TB01321",
    role: "UI/UX • Thuyết trình • Demo",
    summary: "Rà soát giao diện, xây dựng mạch trình bày và phương án demo dự phòng.",
    skills: ["UI/UX", "Thuyết trình", "Kiểm thử trực quan"],
    contributions: ["Rà soát giao diện", "Xây dựng kịch bản bảo vệ", "Điều phối demo chính và dự phòng"],
    accent: "amber" as const,
    assetId: "team-thu"
  }
] as const;

const memberLayouts = ["architecture", "process", "architecture", "data", "process"] as const;
const memberBackgrounds = ["bands", "plain", "grid", "spotlight", "bands"] as const;

function memberSlide(member: (typeof team)[number], index: number): Slide {
  return {
    id: `member-${member.id}`,
    layout: memberLayouts[index]!,
    variant: index % 2 === 0 ? "spotlight" : "quiet",
    background: memberBackgrounds[index]!,
    transition: { type: index % 2 === 0 ? "morph" : "slide", duration: 0.4 },
    notes: `${member.name} tự giới thiệu trong 8–10 giây: tên, MSSV, vai trò và một đóng góp tiêu biểu. Không đọc toàn bộ nội dung trên thẻ.`,
    components: [
      {
        id: `member-heading-${member.id}`,
        type: "heading",
        effect: { type: "rise", duration: 0.34 },
        props: {
          eyebrow: `THÀNH VIÊN ${String(index + 1).padStart(2, "0")} / 05`,
          title: member.name,
          description: member.role
        }
      },
      {
        id: `member-profile-${member.id}`,
        type: "team-showcase",
        sequence: 1,
        effect: { type: index % 2 === 0 ? "wipe" : "rise", duration: 0.42 },
        props: {
          project: "NEXUS",
          variant: "profile",
          members: [{
            id: `${member.id}-profile`,
            name: member.name,
            studentId: member.studentId,
            role: member.role,
            summary: member.summary,
            skills: [...member.skills],
            contributions: [...member.contributions],
            image: {
              assetId: member.assetId,
              alt: `Ảnh thành viên ${member.name}`,
              position: "top"
            },
            accent: member.accent
          }]
        }
      },
      footer(`02${String.fromCharCode(65 + index)}`, `Ảnh và phân vai nhóm NEXUS • docs/presentation/slides/assets/team • revision ${revision}`)
    ]
  };
}

const rawSlides: Slide[] = [
  {
    id: "cover",
    layout: "cover",
    variant: "spotlight",
    background: "spotlight",
    transition: { type: "fade", duration: 0.45 },
    notes: "Nguyễn Thái Hảo mở đầu trong 20–25 giây. Dùng tên đề tài chính thức AI Technical Interviewer; MyInterview là tên sản phẩm. Chuyển thẳng sang năm thành viên.",
    components: [
      {
        id: "cover-heading",
        type: "heading",
        effect: { type: "rise", duration: 0.42 },
        props: {
          eyebrow: "FPT POLYTECHNIC • PRO2192.01 • DỰ ÁN TỐT NGHIỆP",
          title: "AI Technical Interviewer",
          emphasis: "MyInterview",
          description: "Nền tảng luyện phỏng vấn kỹ thuật bằng AI, kết nối CV, JD, câu trả lời và bằng chứng cải thiện trong một vòng luyện tập có cấu trúc."
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
          members: [{
            id: "institution",
            name: "FPT Polytechnic",
            role: "Đồng Nai – Cơ sở 2",
            studentId: "PRO2192.01",
            summary: "Dự án tốt nghiệp ngành Phát triển phần mềm • GVHD: Thầy Hồ Hoàng Chương",
            image: { assetId: "fpt-polytechnic-logo", alt: "Logo FPT Polytechnic", position: "center" },
            accent: "amber"
          }]
        }
      },
      footer("01", "Thông tin học vụ do nhóm NEXUS cung cấp • 2026")
    ]
  },
  ...team.map(memberSlide),
  {
    id: "topic",
    layout: "data",
    variant: "spotlight",
    background: "bands",
    transition: { type: "morph", duration: 0.46 },
    notes: "Phan Ngọc Diễm Quỳnh trình bày trong 35 giây. Chốt bài toán bằng một câu: người học không thiếu câu hỏi, họ thiếu phản hồi có ngữ cảnh và có thể hành động.",
    components: [
      {
        id: "topic-heading",
        type: "heading",
        props: {
          eyebrow: "BÀI TOÁN",
          title: "Luyện nhiều chưa chắc tiến bộ nếu phản hồi không chỉ ra câu trả lời còn thiếu gì.",
          description: "MyInterview tập trung vào ba khoảng trống: bám sát vị trí mục tiêu, chiều sâu kỹ thuật và bằng chứng trong câu trả lời."
        }
      },
      {
        id: "topic-media",
        type: "media-showcase",
        sequence: 1,
        effect: { type: "rise", duration: 0.42 },
        props: {
          title: "Bối cảnh nghề nghiệp được giữ xuyên suốt",
          summary: "Ảnh từ bộ bằng chứng giao diện đã xác thực của dự án.",
          variant: "single",
          items: [{
            assetId: "product-dashboard",
            alt: "Bảng điều khiển MyInterview hiển thị hồ sơ và hành trình luyện phỏng vấn",
            eyebrow: "ĐẦU VÀO",
            title: "Hồ sơ, CV, JD và mục tiêu cùng nằm trong một hành trình",
            caption: "Người học chuẩn bị ngữ cảnh trước khi bắt đầu phiên phỏng vấn.",
            featured: true
          }]
        }
      },
      footer("03", `Product brief và ảnh xác thực • docs/presentation/slides/assets/demo/auth-dashboard.png • revision ${revision}`)
    ]
  },
  {
    id: "current-state-gap",
    layout: "comparison",
    variant: "quiet",
    transition: { type: "slide", duration: 0.4 },
    notes: "Không gọi đây là kết quả khảo sát định lượng. Đây là đối chiếu định tính từ phạm vi sản phẩm, luồng hiện tại và mục tiêu coaching của dự án.",
    components: [
      {
        id: "gap-heading",
        type: "heading",
        props: {
          eyebrow: "PHÂN TÍCH HIỆN TRẠNG",
          title: "Khoảng trống nằm giữa việc trả lời một câu hỏi và biết cách trả lời tốt hơn."
        }
      },
      {
        id: "gap-comparison",
        type: "comparison",
        sequence: 1,
        effect: { type: "wipe", duration: 0.46 },
        props: {
          left: {
            eyebrow: "LUYỆN TẬP RỜI RẠC",
            title: "Người học phải tự nối dữ liệu",
            points: ["Câu hỏi tách khỏi CV và JD", "Nhận xét chung chung", "Khó truy ngược về câu trả lời", "Không có kế hoạch luyện lại"]
          },
          right: {
            eyebrow: "VÒNG COACHING",
            title: "MyInterview nối ngữ cảnh với hành động",
            points: ["Khóa CV, JD và mục tiêu", "Đánh giá theo tiêu chí", "Gắn phản hồi với bằng chứng", "Lưu lịch sử và luyện lại"]
          }
        }
      },
      footer("04", `Phân tích định tính từ docs/00-overview/CURRENT_PRODUCT_STATE_2026-08-05.md • revision ${revision}`)
    ]
  },
  {
    id: "solution",
    layout: "data",
    variant: "spotlight",
    transition: { type: "morph", duration: 0.48 },
    notes: "Nguyễn Ngọc Anh Thư trình bày trong 45 giây. Đi từ ảnh thiết lập phiên sang ảnh phản hồi; nhấn rằng đầu ra không chỉ là một điểm tổng.",
    components: [
      {
        id: "solution-heading",
        type: "heading",
        props: {
          eyebrow: "GIẢI PHÁP",
          title: "Một vòng luyện tập hoàn chỉnh đi từ ngữ cảnh nghề nghiệp đến phản hồi có bằng chứng.",
          description: "Hệ thống giữ liên kết giữa đầu vào, câu hỏi, câu trả lời, tiêu chí đánh giá và hành động tiếp theo."
        }
      },
      {
        id: "solution-media",
        type: "media-showcase",
        sequence: 1,
        effect: { type: "rise", duration: 0.44 },
        props: {
          variant: "duo",
          items: [
            {
              assetId: "product-setup",
              alt: "Màn hình thiết lập phiên phỏng vấn MyInterview",
              eyebrow: "01 • KHÓA BỐI CẢNH",
              title: "Thiết lập phiên theo CV, JD và mục tiêu",
              caption: "Ngữ cảnh được chọn trước khi hệ thống lập kế hoạch câu hỏi."
            },
            {
              assetId: "product-feedback",
              alt: "Màn hình phản hồi và đánh giá MyInterview",
              eyebrow: "02 • TẠO HÀNH ĐỘNG",
              title: "Phản hồi giải thích điểm mạnh, điểm thiếu và bước tiếp theo",
              caption: "Điểm số đi cùng lý do và bằng chứng thay vì đứng độc lập.",
              featured: true
            }
          ]
        }
      },
      footer("05", `Ảnh xác thực setup và feedback • docs/presentation/slides/assets/demo • revision ${revision}`)
    ]
  },
  {
    id: "architecture",
    layout: "architecture",
    variant: "technical",
    transition: { type: "slide", duration: 0.42 },
    notes: "Nguyễn Thái Hảo trình bày trong 55 giây. Đi từ giao diện xuống dữ liệu và dịch vụ AI. Nhấn backend giữ quyền quyết định trạng thái và quyền truy cập.",
    components: [
      {
        id: "architecture-heading",
        type: "heading",
        props: {
          eyebrow: "KIẾN TRÚC HỆ THỐNG",
          title: "Giao diện tối ưu trải nghiệm; backend giữ trạng thái, phân quyền và tính toàn vẹn dữ liệu."
        }
      },
      {
        id: "architecture-layers",
        type: "architecture",
        sequence: 1,
        effect: { type: "wipe", duration: 0.5 },
        props: {
          layers: [
            { label: "GIAO DIỆN", items: ["Next.js 16.2.11", "React 19.2.7", "TypeScript 6.0.3", "Trạng thái giao diện"] },
            { label: "API & THỜI GIAN THỰC", items: ["FastAPI 0.139.0", "REST", "WebSocket", "Xác thực"], accent: true },
            { label: "NGHIỆP VỤ", items: ["Kiểm tra dữ liệu", "Phân quyền", "Vòng đời phỏng vấn", "Điều phối AI"] },
            { label: "DỮ LIỆU & TÁC VỤ", items: ["PostgreSQL / Neon", "SQLAlchemy bất đồng bộ", "pgvector", "Redis"], accent: true },
            { label: "DỊCH VỤ AI", items: ["Google Gen AI", "Speechmatics chính", "Deepgram dự phòng", "Đầu ra có cấu trúc"] }
          ]
        }
      },
      footer("06", `frontend/package.json và backend/pyproject.toml • revision ${revision}`)
    ]
  },
  {
    id: "ai-scoring",
    layout: "dashboard",
    variant: "spotlight",
    background: "grid",
    transition: { type: "zoom", duration: 0.42 },
    notes: "Phạm Nguyễn Bảo Minh trình bày trong 55 giây. Nhấn chiều sâu kỹ thuật và bằng chứng. Đây là rubric coaching, không phải quyết định tuyển dụng.",
    components: [
      {
        id: "scoring-heading",
        type: "heading",
        props: {
          eyebrow: "AI & ĐÁNH GIÁ",
          title: "Sáu tiêu chí giải thích câu trả lời cần cải thiện ở đâu — không chỉ đưa ra một điểm tổng."
        }
      },
      {
        id: "scoring-criteria",
        type: "criterion-grid",
        sequence: 1,
        effect: { type: "scale", duration: 0.44 },
        props: {
          items: [
            { label: "Đúng trọng tâm", question: "Có trả lời đúng vấn đề không?", output: "Mức lệch trọng tâm", tone: "cobalt" },
            { label: "Rõ ràng", question: "Có dễ hiểu và súc tích không?", output: "Gợi ý diễn đạt", tone: "teal" },
            { label: "Cấu trúc", question: "Lập luận có trình tự không?", output: "Khung trả lời", tone: "neutral" },
            { label: "Chiều sâu kỹ thuật", question: "Có quyết định, lý do và đánh đổi kỹ thuật không?", output: "Khoảng thiếu kiến thức", tone: "amber", featured: true },
            { label: "Bằng chứng", question: "Có ví dụ, hành động và kết quả không?", output: "Khoảng thiếu bằng chứng", tone: "teal" },
            { label: "Phù hợp JD", question: "Có liên hệ đúng vị trí mục tiêu không?", output: "Mức độ liên kết", tone: "cobalt" }
          ]
        }
      },
      footer("07", `Rubric và assessment contracts • docs/02-architecture-and-design • revision ${revision}`)
    ]
  },
  {
    id: "data-responsible-ai",
    layout: "comparison",
    transition: { type: "slide", duration: 0.42 },
    notes: "Phan Ngọc Diễm Quỳnh trình bày trong 45 giây. Nói theo hai vế: quyền dữ liệu và giới hạn quyền quyết định của AI.",
    components: [
      {
        id: "responsible-heading",
        type: "heading",
        props: {
          eyebrow: "DỮ LIỆU & AI CÓ TRÁCH NHIỆM",
          title: "Người dùng giữ quyền với dữ liệu; AI không thay quyết định tuyển dụng."
        }
      },
      {
        id: "responsible-comparison",
        type: "comparison",
        sequence: 1,
        effect: { type: "wipe", duration: 0.46 },
        props: {
          left: {
            eyebrow: "QUYỀN DỮ LIỆU",
            title: "Người dùng kiểm soát",
            points: ["Đồng ý trước khi xử lý", "Mỗi tài nguyên có chủ sở hữu", "Có thể xuất và xóa dữ liệu", "Chỉ gửi ngữ cảnh cần thiết"]
          },
          right: {
            eyebrow: "GIỚI HẠN AI",
            title: "Không vượt quyền",
            points: ["Không tự động đỗ hoặc trượt", "Không xếp hạng ứng viên", "Không phân tích khuôn mặt hoặc cảm xúc", "Không gọi bằng chứng cục bộ là bằng chứng phát hành"]
          }
        }
      },
      footer("08", `Privacy, retention và responsible-AI documents • revision ${revision}`)
    ]
  },
  {
    id: "implementation",
    layout: "dashboard",
    variant: "quiet",
    transition: { type: "zoom", duration: 0.42 },
    notes: "Nguyễn Thái Hảo trình bày trong 45 giây. Phân biệt rõ phần hỗ trợ tốt nghiệp, phần cần bằng chứng bên ngoài và trạng thái phát hành công khai.",
    components: [
      {
        id: "implementation-heading",
        type: "heading",
        props: {
          eyebrow: "MỨC ĐỘ THỰC HIỆN",
          title: "Luồng văn bản là lõi đã được hỗ trợ; giọng nói và phát hành công khai vẫn phụ thuộc bằng chứng."
        }
      },
      {
        id: "implementation-metrics",
        type: "metric-grid",
        sequence: 1,
        effect: { type: "rise", duration: 0.42 },
        props: {
          metrics: [
            { value: "SUPPORTED", label: "Luồng tốt nghiệp", note: "Hồ sơ → CV/JD → phỏng vấn văn bản → đánh giá → phản hồi", tone: "teal" },
            { value: "GATED", label: "Phỏng vấn giọng nói", note: "Có triển khai nhưng cần kiểm chứng dịch vụ và luồng chạy thật", tone: "amber" },
            { value: "CONTROLLED", label: "Doanh nghiệp / tuyển dụng", note: "Phần mở rộng có điều kiện, không phải luận điểm chính", tone: "cobalt" },
            { value: "BLOCKED", label: "Phát hành công khai", note: "Chưa được phê duyệt khi chưa đủ bằng chứng vận hành", tone: "amber" }
          ]
        }
      },
      footer("09", `docs/00-overview/CURRENT_PRODUCT_STATE_2026-08-05.md • revision ${revision}`)
    ]
  },
  {
    id: "testing-evidence",
    layout: "data",
    variant: "technical",
    transition: { type: "wipe", duration: 0.44 },
    notes: "Nhữ Mai Gia Hoàng trình bày trong 50 giây. Không đọc từng dòng; giải thích rằng mỗi loại claim cần đúng loại evidence và đúng revision.",
    components: [
      {
        id: "testing-heading",
        type: "heading",
        props: {
          eyebrow: "KIỂM THỬ & BẰNG CHỨNG",
          title: "Một tuyên bố chỉ được đưa lên slide khi có bằng chứng đúng môi trường và đúng revision."
        }
      },
      {
        id: "testing-table",
        type: "table",
        sequence: 1,
        effect: { type: "rise", duration: 0.42 },
        props: {
          title: "Cách nhóm phân loại bằng chứng",
          columns: ["Luận điểm", "Bằng chứng phù hợp", "Giới hạn trình bày"],
          rows: [
            { cells: ["Luồng nghiệp vụ", "E2E, ảnh giao diện, dữ liệu đã lưu", "Nêu revision và vai trò"] },
            { cells: ["API và quyền truy cập", "Test contract, ownership, status code", "Không suy rộng từ unit test"] },
            { cells: ["AI và đánh giá", "Schema, fixture, kết quả nhà cung cấp", "Nêu model và điều kiện"] },
            { cells: ["Giọng nói", "Phiên hoàn chỉnh với dịch vụ thật", "Giữ trạng thái gated nếu thiếu"], highlight: true },
            { cells: ["Phát hành", "Môi trường, tải, giám sát và phục hồi", "Không suy từ máy cục bộ"] }
          ],
          note: "Bằng chứng từ revision khác không được dùng để chứng minh trạng thái hiện tại."
        }
      },
      footer("10", `Defense playbook và evidence matrix • docs/06-operations-and-testing • revision ${revision}`)
    ]
  },
  {
    id: "limitations-roadmap",
    layout: "process",
    variant: "spotlight",
    transition: { type: "morph", duration: 0.46 },
    notes: "Nguyễn Thái Hảo trình bày trong 45 giây. Trình bày giới hạn như ranh giới có kiểm soát, không phải danh sách lỗi chưa xử lý.",
    components: [
      {
        id: "roadmap-heading",
        type: "heading",
        props: {
          eyebrow: "GIỚI HẠN & HƯỚNG PHÁT TRIỂN",
          title: "Bước tiếp theo không phải thêm nhiều tính năng — mà là nâng mức bằng chứng và độ tin cậy."
        }
      },
      {
        id: "roadmap-diagram",
        type: "diagram",
        sequence: 1,
        effect: { type: "wipe", duration: 0.46 },
        props: {
          title: "Mở rộng capability theo bốn evidence gate",
          summary: "Roadmap bắt đầu từ luồng văn bản đã hỗ trợ, sau đó kiểm chứng giọng nói, củng cố vận hành và chỉ mở rộng công khai khi đủ bằng chứng.",
          variant: "roadmap",
          items: [
            { id: "protect-core", label: "Giữ lõi đã chứng minh", description: "Dùng phỏng vấn văn bản làm demo chính; voice và B2B không che khuất graduation core.", value: "HIỆN TẠI", tone: "teal" },
            { id: "prove-runtime", label: "Chứng minh runtime thật", description: "Hoàn tất phiên voice nhiều lượt, reconnect, fallback và mở lại kết quả đã lưu.", value: "GATE 01", tone: "amber", featured: true },
            { id: "harden-operations", label: "Củng cố vận hành", description: "Đo tải, timeout, observability, migration, backup và phục hồi trên môi trường triển khai.", value: "GATE 02", tone: "cobalt" },
            { id: "expand-safely", label: "Mở rộng có kiểm soát", description: "Chỉ mở public release hoặc capability B2B khi evidence đúng revision đã vượt quality gate.", value: "SAU GATE", tone: "neutral" }
          ]
        }
      },
      footer("11", `Release blockers và roadmap • CURRENT_PRODUCT_STATE_2026-08-05.md • revision ${revision}`)
    ]
  },
  {
    id: "conclusion",
    layout: "closing",
    variant: "spotlight",
    background: "spotlight",
    transition: { type: "fade", duration: 0.5 },
    notes: "Nguyễn Thái Hảo kết luận trong 30 giây. Chốt ba từ: bối cảnh, bằng chứng, hành động. Sau đó chuyển sang demo cuối cùng.",
    components: [
      {
        id: "conclusion-heading",
        type: "heading",
        props: {
          eyebrow: "KẾT LUẬN",
          title: "MyInterview giúp người học biết cần cải thiện điều gì — và vì sao.",
          emphasis: "Bối cảnh. Bằng chứng. Hành động.",
          description: "Giá trị cốt lõi không nằm ở việc hỏi nhiều hơn, mà ở việc nối câu trả lời với tiêu chí, bằng chứng và một bước luyện tiếp theo."
        }
      },
      {
        id: "conclusion-statement",
        type: "statement",
        sequence: 1,
        effect: { type: "fade", duration: 0.34 },
        props: {
          quote: "Một vòng luyện tập tốt phải giải thích được kết quả và dẫn tới hành động tiếp theo.",
          byline: "Nhóm NEXUS • MyInterview"
        }
      },
      footer("12", `Tổng kết phạm vi graduation journey • revision ${revision}`)
    ]
  },
  {
    id: "demo",
    layout: "data",
    variant: "spotlight",
    background: "bands",
    transition: { type: "zoom", duration: 0.48 },
    notes: "Nguyễn Ngọc Anh Thư điều phối demo trong 6–7 phút: thiết lập phiên, trả lời một câu và mở feedback. Nếu lỗi quá 15 giây, dùng ba ảnh xác thực trên slide và phiên hoàn tất dự phòng.",
    components: [
      {
        id: "demo-heading",
        type: "heading",
        props: {
          eyebrow: "DEMO TRỰC TIẾP",
          title: "Từ CV và JD đến một phản hồi có thể truy ngược về câu trả lời."
        }
      },
      {
        id: "demo-media",
        type: "media-showcase",
        sequence: 1,
        effect: { type: "rise", duration: 0.44 },
        props: {
          variant: "triptych",
          items: [
            { assetId: "product-setup", alt: "Thiết lập phiên phỏng vấn MyInterview", eyebrow: "01", title: "Khóa bối cảnh", caption: "Chọn CV, JD và mục tiêu luyện tập." },
            { assetId: "product-interview", alt: "Phiên phỏng vấn văn bản MyInterview", eyebrow: "02", title: "Trả lời theo lượt", caption: "Một câu chính, trạng thái rõ và câu hỏi đào sâu có giới hạn.", featured: true },
            { assetId: "product-feedback", alt: "Phản hồi sau phỏng vấn MyInterview", eyebrow: "03", title: "Biến đánh giá thành hành động", caption: "Điểm, bằng chứng, điểm thiếu và bước luyện tiếp theo." }
          ]
        }
      },
      footer("13", `Ảnh demo đã xác thực • docs/presentation/slides/assets/demo • revision ${revision}`)
    ]
  },
  {
    id: "appendix-backend",
    layout: "architecture",
    variant: "technical",
    notes: "Dùng khi hội đồng hỏi dependency direction hoặc nơi business logic được đặt. Đi từ API xuống schema; không đọc mọi item.",
    components: [
      { id: "backend-heading", type: "heading", props: { eyebrow: "PHỤ LỤC A", title: "Business logic được tách khỏi transport để dễ kiểm thử và thay đổi nhà cung cấp." } },
      { id: "backend-layers", type: "architecture", props: { layers: [
        { label: "API", items: ["Router", "Authentication dependency", "Request / response mapping"], accent: true },
        { label: "SERVICES", items: ["Business logic", "Transaction", "Provider orchestration"] },
        { label: "MODELS", items: ["SQLAlchemy ORM", "Ownership", "Constraints"], accent: true },
        { label: "SCHEMAS", items: ["Pydantic contracts", "JSONB validation", "OpenAPI types"] }
      ] } },
      footer("A1", `Backend architecture documents • revision ${revision}`)
    ]
  },
  {
    id: "appendix-state-machines",
    layout: "process",
    variant: "technical",
    notes: "Dùng khi hội đồng hỏi callback muộn, retry hoặc vì sao không sinh câu hỏi ngẫu nhiên từng lượt. Giải thích backend là nguồn trạng thái chuẩn.",
    components: [
      { id: "state-heading", type: "heading", props: { eyebrow: "PHỤ LỤC B", title: "Máy trạng thái giữ mỗi lượt phỏng vấn nhất quán trước lỗi mạng và callback muộn." } },
      { id: "state-process", type: "process", props: { steps: [
        { title: "Khóa bối cảnh", note: "Hồ sơ, CV, JD và mục tiêu", icon: "data" },
        { title: "Lập kế hoạch", note: "Năng lực và độ khó cần kiểm tra", icon: "system" },
        { title: "Phát hành câu hỏi", note: "Mỗi lượt chỉ có một câu chính", icon: "people" },
        { title: "Đánh giá trạng thái", note: "Kiểm tra callback, lỗi và độ phủ", icon: "sparkle" },
        { title: "Chuyển lượt", note: "Backend xác nhận rồi mới tiếp tục", icon: "system" }
      ] } },
      footer("A2", `Interview and scoring state contracts • revision ${revision}`)
    ]
  },
  {
    id: "appendix-rubric",
    layout: "data",
    variant: "technical",
    notes: "Dùng khi hội đồng hỏi cách đọc điểm. Nhấn điểm tổng không được che khuất tiêu chí và bằng chứng thành phần.",
    components: [
      { id: "rubric-heading", type: "heading", props: { eyebrow: "PHỤ LỤC C", title: "Rubric biến nhận xét AI thành sáu câu hỏi có thể giải thích và kiểm tra." } },
      { id: "rubric-table", type: "table", props: {
        title: "Đầu vào và đầu ra của rubric coaching",
        columns: ["Tiêu chí", "Hệ thống xem xét", "Đầu ra"],
        rows: [
          { cells: ["Đúng trọng tâm", "Có trả lời đúng câu hỏi?", "Mức lệch"] },
          { cells: ["Rõ ràng", "Có dễ hiểu và súc tích?", "Gợi ý diễn đạt"] },
          { cells: ["Cấu trúc", "Lập luận có trình tự?", "Khung trả lời"] },
          { cells: ["Chiều sâu kỹ thuật", "Có quyết định và đánh đổi?", "Khoảng thiếu"], highlight: true },
          { cells: ["Bằng chứng", "Có ví dụ, hành động, kết quả?", "Khoảng thiếu bằng chứng"] },
          { cells: ["Phù hợp JD", "Có liên hệ vị trí mục tiêu?", "Mức liên kết"] }
        ],
        note: "Rubric phục vụ luyện tập; không dùng để tự động đỗ, trượt hoặc xếp hạng ứng viên."
      } },
      footer("A3", `Assessment rubric and scorer contracts • revision ${revision}`)
    ]
  },
  {
    id: "appendix-auth-data",
    layout: "comparison",
    variant: "technical",
    notes: "Dùng khi hội đồng hỏi IDOR, ownership hoặc quyền xóa dữ liệu. Nói theo hai lớp: xác thực và quyền trên từng tài nguyên.",
    components: [
      { id: "auth-heading", type: "heading", props: { eyebrow: "PHỤ LỤC D", title: "Đăng nhập xác định người dùng; ownership quyết định họ được phép chạm vào dữ liệu nào." } },
      { id: "auth-comparison", type: "comparison", props: {
        left: { eyebrow: "XÁC THỰC", title: "Ai đang gửi yêu cầu?", points: ["Phiên đăng nhập hợp lệ", "Token hết hạn hoặc bị thu hồi", "Vai trò người dùng", "Giới hạn tần suất"] },
        right: { eyebrow: "PHÂN QUYỀN DỮ LIỆU", title: "Họ sở hữu tài nguyên nào?", points: ["CV, JD và phiên phỏng vấn", "Assessment và feedback", "Tổ chức / tenant", "Xuất và xóa dữ liệu"] }
      } },
      footer("A4", `Authentication, ownership và privacy contracts • revision ${revision}`)
    ]
  },
  {
    id: "appendix-voice",
    layout: "comparison",
    variant: "technical",
    notes: "Dùng khi hội đồng hỏi vì sao có voice nhưng không dùng làm luận điểm chính. Nêu rõ điều kiện để capability được nâng trạng thái.",
    components: [
      { id: "voice-heading", type: "heading", props: { eyebrow: "PHỤ LỤC E", title: "Voice chỉ được mở rộng khi toàn bộ vòng đời âm thanh có bằng chứng chạy thật." } },
      { id: "voice-comparison", type: "comparison", props: {
        left: { eyebrow: "ĐÃ CÓ TRONG MÃ NGUỒN", title: "Năng lực kỹ thuật", points: ["WebSocket và audio pipeline", "Speechmatics là dịch vụ chính", "Deepgram là phương án dự phòng", "Transcript và scoring lifecycle"] },
        right: { eyebrow: "CẦN CHỨNG MINH", title: "Điều kiện nâng trạng thái", points: ["Ba lượt âm thanh hoàn chỉnh", "Reconnect và mất mạng", "Giới hạn chờ và fallback", "Kết quả được lưu và mở lại"] }
      } },
      footer("A5", `Voice reliability requirements • revision ${revision}`)
    ]
  },
  {
    id: "appendix-deployment-stack",
    layout: "architecture",
    variant: "technical",
    notes: "Dùng khi hội đồng hỏi công nghệ hoặc triển khai. Nhắc lại trạng thái: stack đã được định nghĩa nhưng phát hành công khai còn bị chặn bởi evidence gate.",
    components: [
      { id: "deployment-heading", type: "heading", props: { eyebrow: "PHỤ LỤC F", title: "Stack triển khai tách giao diện, API, dữ liệu, hàng đợi và dịch vụ AI theo ranh giới rõ." } },
      { id: "deployment-layers", type: "architecture", props: { layers: [
        { label: "WEB", items: ["Next.js 16.2.11", "React 19.2.7", "TypeScript 6.0.3"] },
        { label: "API", items: ["FastAPI 0.139.0", "REST", "WebSocket"], accent: true },
        { label: "DATA", items: ["PostgreSQL / Neon", "pgvector", "Redis"] },
        { label: "AI", items: ["Google Gen AI", "Speechmatics", "Deepgram dự phòng"], accent: true },
        { label: "RELEASE GATE", items: ["Migration", "Observability", "Load", "Recovery"] }
      ] } },
      footer("A6", `Runtime manifests và release gates • revision ${revision}`)
    ]
  }
];

const masterBySlideId: Readonly<Record<string, string>> = {
  cover: "cover-cinematic",
  "member-hao": "architecture-editorial",
  "member-minh": "process-roadmap",
  "member-quynh": "architecture-system",
  "member-hoang": "data-gallery",
  "member-thu": "process-journey",
  topic: "data-gallery",
  "current-state-gap": "comparison-decision",
  solution: "data-gallery",
  architecture: "architecture-system",
  "ai-scoring": "dashboard-briefing",
  "data-responsible-ai": "comparison-decision",
  implementation: "dashboard-control-room",
  "testing-evidence": "data-analysis",
  "limitations-roadmap": "process-roadmap",
  conclusion: "closing-cinematic",
  demo: "data-gallery",
  "appendix-backend": "architecture-system",
  "appendix-state-machines": "process-journey",
  "appendix-rubric": "data-analysis",
  "appendix-auth-data": "comparison-evidence",
  "appendix-voice": "comparison-decision",
  "appendix-deployment-stack": "architecture-system"
};

function applyAuthoredMaster(slide: Slide): Slide {
  const masterId = masterBySlideId[slide.id];
  if (!masterId) throw new Error(`Missing slide master assignment for ${slide.id}.`);
  const master = getSlideMaster(masterId);
  if (!master) throw new Error(`Unknown slide master ${masterId}.`);
  if (master.layout !== slide.layout) {
    throw new Error(`Slide ${slide.id} uses layout ${slide.layout}, incompatible with master ${master.id} (${master.layout}).`);
  }

  return {
    ...slide,
    masterId: master.id,
    variant: master.variant,
    background: master.background,
    transition: { ...master.transition }
  };
}

const slides = rawSlides.map(applyAuthoredMaster);

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
      source: { label: "FPT Polytechnic logo — nguồn người dùng cung cấp" }
    },
    ...team.map((member) => ({
      id: member.assetId,
      type: "image" as const,
      src: `/myinterview/team/${member.id}.svg`,
      mediaType: "image/svg+xml" as const,
      width: 180,
      height: 240,
      source: { label: `MyInterview docs/presentation/slides/assets/team/${member.id}.jpg • revision ${revision}` }
    })),
    {
      id: "product-dashboard",
      type: "image",
      src: "/myinterview/product/dashboard.svg",
      mediaType: "image/svg+xml",
      width: 560,
      height: 420,
      source: { label: `MyInterview docs/presentation/slides/assets/demo/auth-dashboard.png • revision ${revision}` }
    },
    {
      id: "product-setup",
      type: "image",
      src: "/myinterview/product/setup.svg",
      mediaType: "image/svg+xml",
      width: 480,
      height: 360,
      source: { label: `MyInterview docs/presentation/slides/assets/demo/auth-setup.png • revision ${revision}` }
    },
    {
      id: "product-interview",
      type: "image",
      src: "/myinterview/product/interview.svg",
      mediaType: "image/svg+xml",
      width: 420,
      height: 315,
      source: { label: `MyInterview docs/presentation/slides/assets/demo/auth-interview.png • revision ${revision}` }
    },
    {
      id: "product-feedback",
      type: "image",
      src: "/myinterview/product/feedback.svg",
      mediaType: "image/svg+xml",
      width: 420,
      height: 315,
      source: { label: `MyInterview docs/presentation/slides/assets/demo/auth-feedback.png • revision ${revision}` }
    }
  ],
  slides
});
