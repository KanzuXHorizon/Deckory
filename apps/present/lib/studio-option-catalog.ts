import {
  ArrowUp,
  Ban,
  BarChart3,
  Blend,
  Blocks,
  Check,
  Circle,
  Code2,
  Columns2,
  Database,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Focus,
  Gauge,
  GitCompare,
  Grid3X3,
  Heading1,
  Layers3,
  Lightbulb,
  ListOrdered,
  Maximize2,
  MoveRight,
  Network,
  PanelTopOpen,
  PieChart,
  Quote,
  ScanLine,
  Sparkles,
  Sun,
  Table2,
  TrendingUp,
  UsersRound,
  Wind,
  X,
  ZoomIn
} from "lucide-react";
import type { MotionEasing, Slide, SlideComponent } from "@deckory/schema";
import type { StudioChoiceOption } from "../components/studio-controls";

export const layoutOptions: readonly StudioChoiceOption<Slide["layout"]>[] = [
  { value: "cover", label: "Mở đầu", description: "Tiêu đề và định vị câu chuyện", icon: PanelTopOpen },
  { value: "statement", label: "Thông điệp", description: "Một luận điểm cần ghi nhớ", icon: Quote },
  { value: "split", label: "Chia đôi", description: "Hai vùng nội dung cân bằng", icon: Columns2 },
  { value: "dashboard", label: "Bảng tổng quan", description: "Tổng hợp chỉ số và tín hiệu chính", icon: Gauge },
  { value: "comparison", label: "So sánh", description: "Đối chiếu hai hướng hoặc trạng thái", icon: GitCompare },
  { value: "process", label: "Quy trình", description: "Chuỗi bước có thứ tự", icon: ListOrdered },
  { value: "architecture", label: "Kiến trúc", description: "Các lớp, hệ thống và mối quan hệ", icon: Network },
  { value: "data", label: "Dữ liệu", description: "Biểu đồ, bảng và bằng chứng", icon: BarChart3 },
  { value: "closing", label: "Kết thúc", description: "Thông điệp chốt và hành động tiếp theo", icon: Flag }
];

export const variantOptions: readonly StudioChoiceOption<NonNullable<Slide["variant"]>>[] = [
  { value: "default", label: "Chuẩn", description: "Cân bằng và trung tính", icon: Circle },
  { value: "spotlight", label: "Tiêu điểm", description: "Tăng độ tập trung", icon: Focus },
  { value: "quiet", label: "Tĩnh", description: "Giảm nhiễu thị giác", icon: Blend },
  { value: "technical", label: "Kỹ thuật", description: "Dành cho cấu trúc hệ thống và mã nguồn", icon: Code2 }
];

export const transitionOptions: readonly StudioChoiceOption<NonNullable<Slide["transition"]>["type"]>[] = [
  { value: "none", label: "Không chuyển cảnh", description: "Đổi slide ngay, không có chuyển động", icon: Ban },
  { value: "fade", label: "Mờ dần", description: "Chuyển nhẹ bằng độ trong suốt", icon: Blend },
  { value: "slide", label: "Trượt", description: "Trượt theo hướng điều hướng", icon: MoveRight },
  { value: "push", label: "Đẩy", description: "Slide mới đẩy slide hiện tại sang bên", icon: PanelTopOpen },
  { value: "wipe", label: "Quét mở", description: "Mở slide theo một vùng cắt có hướng", icon: ScanLine },
  { value: "zoom", label: "Phóng nhẹ", description: "Thu phóng tinh tế để tạo điểm nhấn", icon: ZoomIn },
  { value: "morph", label: "Chuyển tiếp liên tục", description: "Giữ sự liền mạch cho phần tử dùng chung", icon: Sparkles }
];

export const easingOptions: readonly StudioChoiceOption<MotionEasing>[] = [
  { value: "standard", label: "Mượt", description: "Nhanh ở đầu và dịu dần khi kết thúc", icon: Wind },
  { value: "emphasized", label: "Nhấn mạnh", description: "Tạo lực chuyển rõ hơn cho điểm quan trọng", icon: Sparkles },
  { value: "linear", label: "Tuyến tính", description: "Giữ tốc độ đều trong toàn bộ chuyển động", icon: MoveRight }
];

export const effectOptions: readonly StudioChoiceOption<NonNullable<SlideComponent["effect"]>["type"]>[] = [
  { value: "none", label: "Không hiệu ứng", description: "Hiển thị ngay, không có chuyển động", icon: Ban },
  { value: "fade", label: "Mờ hiện", description: "Xuất hiện nhẹ bằng độ trong suốt", icon: Blend },
  { value: "rise", label: "Nâng lên", description: "Di chuyển nhẹ từ dưới lên theo thứ bậc", icon: ArrowUp },
  { value: "scale", label: "Mở rộng", description: "Phóng nhẹ từ tâm phần tử", icon: Maximize2 },
  { value: "wipe", label: "Quét mở", description: "Mở phần tử theo một vùng cắt", icon: ScanLine },
  { value: "blur", label: "Lấy nét", description: "Chuyển từ mờ sang rõ có kiểm soát", icon: Wind },
  { value: "pop", label: "Bật nổi", description: "Xuất hiện nhanh với điểm nhấn vừa phải", icon: Sparkles }
];

export const componentOptions: readonly StudioChoiceOption<SlideComponent["type"]>[] = [
  { value: "heading", label: "Tiêu đề", description: "Kết luận và mô tả slide", icon: Heading1 },
  { value: "statement", label: "Thông điệp", description: "Một câu trích dẫn hoặc luận điểm", icon: Quote },
  { value: "metric-grid", label: "Chỉ số", description: "Nhóm chỉ số có thứ bậc rõ ràng", icon: Grid3X3 },
  { value: "comparison", label: "So sánh", description: "Hai phía cùng tiêu chí", icon: GitCompare },
  { value: "process", label: "Quy trình", description: "Chuỗi bước và kết quả", icon: ListOrdered },
  { value: "architecture", label: "Kiến trúc", description: "Các lớp và quan hệ trong hệ thống", icon: Network },
  { value: "chart", label: "Biểu đồ", description: "Quan hệ và xu hướng dữ liệu", icon: BarChart3 },
  { value: "table", label: "Bảng dữ liệu", description: "Đối chiếu chính xác theo hàng cột", icon: Table2 },
  { value: "code", label: "Đoạn mã", description: "Bằng chứng kỹ thuật có đánh dấu dòng", icon: Code2 },
  { value: "insight", label: "Kết luận", description: "Tín hiệu quan trọng cần nhớ", icon: Lightbulb },
  { value: "team-showcase", label: "Đội ngũ", description: "Vai trò, năng lực và đóng góp", icon: UsersRound },
  { value: "visualizer", label: "Sơ đồ tương tác", description: "Cây tăng trưởng, lộ trình, quỹ đạo hoặc mạng lưới", icon: Network },
  { value: "weight-simulator", label: "Mô phỏng trọng số", description: "Điều chỉnh tỷ trọng và quan sát điểm tổng hợp", icon: Gauge },
  { value: "evidence-footer", label: "Nguồn", description: "Trang, nguồn và bằng chứng", icon: FileText }
];

export const chartVariantOptions = [
  { value: "bar", label: "Cột", description: "So sánh độ lớn", icon: BarChart3 },
  { value: "line", label: "Đường", description: "Thể hiện xu hướng", icon: TrendingUp },
  { value: "area", label: "Vùng", description: "Nhấn mạnh tổng lượng", icon: Blocks },
  { value: "donut", label: "Vành khuyên", description: "Cơ cấu trong tổng thể", icon: PieChart }
] as const;

export const metricToneOptions = [
  { value: "cobalt", label: "Cobalt", icon: Circle },
  { value: "teal", label: "Teal", icon: Check },
  { value: "amber", label: "Amber", icon: Sun }
] as const;

export const insightToneOptions = [
  ...metricToneOptions,
  { value: "neutral", label: "Trung tính", icon: Blend }
] as const;

export const processIconOptions = [
  { value: "data", label: "Dữ liệu", icon: Database },
  { value: "system", label: "Hệ thống", icon: Layers3 },
  { value: "people", label: "Con người", icon: UsersRound },
  { value: "sparkle", label: "Điểm nhấn", icon: Sparkles }
] as const;

export const teamVariantOptions = [
  { value: "editorial", label: "Biên tập", description: "Nhấn mạnh vai trò và câu chuyện", icon: FileText },
  { value: "cards", label: "Thẻ", description: "So sánh thành viên đồng đều", icon: Grid3X3 },
  { value: "constellation", label: "Mạng lưới", description: "Nhấn mạnh quan hệ đội ngũ", icon: Network },
  { value: "spotlight", label: "Tiêu điểm", description: "Một thành viên dẫn dắt", icon: Focus },
  { value: "profile", label: "Hồ sơ riêng", description: "Một thành viên trên một slide riêng", icon: UsersRound }
] as const;

export const visualizerVariantOptions = [
  { value: "growth-tree", label: "Cây tăng trưởng", description: "Quan hệ cha–con và tiến triển", icon: TrendingUp },
  { value: "timeline-path", label: "Lộ trình", description: "Các mốc theo thứ tự", icon: ListOrdered },
  { value: "orbit", label: "Quỹ đạo", description: "Các yếu tố quanh một trung tâm", icon: Circle },
  { value: "network", label: "Mạng lưới", description: "Quan hệ nhiều chiều", icon: Network }
] as const;

export const visualizerInteractionOptions = [
  { value: "inspect", label: "Khám phá", description: "Chọn từng nút để đọc", icon: Eye },
  { value: "step", label: "Theo bước", description: "Đi qua từng mốc", icon: ListOrdered },
  { value: "none", label: "Tĩnh", description: "Không có tương tác", icon: Ban }
] as const;

export const visualizerAnimationOptions = [
  { value: "grow", label: "Phát triển", icon: TrendingUp },
  { value: "draw", label: "Vẽ đường", icon: ScanLine },
  { value: "orbit", label: "Quỹ đạo", icon: Circle },
  { value: "pulse", label: "Nhịp sáng", icon: Sparkles },
  { value: "none", label: "Không", icon: Ban }
] as const;

export const visualizerIconOptions = [
  { value: "seed", label: "Hạt giống", icon: Circle },
  { value: "leaf", label: "Phát triển", icon: TrendingUp },
  { value: "data", label: "Dữ liệu", icon: Database },
  { value: "system", label: "Hệ thống", icon: Layers3 },
  { value: "people", label: "Con người", icon: UsersRound },
  { value: "sparkle", label: "Điểm nhấn", icon: Sparkles },
  { value: "code", label: "Mã nguồn", icon: Code2 }
] as const;

export const booleanIcons = {
  true: Eye,
  false: EyeOff,
  yes: Check,
  no: X
} as const;

export function layoutLabel(layout: Slide["layout"]): string {
  return layoutOptions.find((option) => option.value === layout)?.label ?? layout;
}

export function componentLabel(type: SlideComponent["type"]): string {
  return componentOptions.find((option) => option.value === type)?.label ?? type;
}
