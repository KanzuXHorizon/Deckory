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
import type { Slide, SlideComponent } from "@deckory/schema";
import type { StudioChoiceOption } from "../components/studio-controls";

export const layoutOptions: readonly StudioChoiceOption<Slide["layout"]>[] = [
  { value: "cover", label: "Mở đầu", description: "Tiêu đề và định vị câu chuyện", icon: PanelTopOpen },
  { value: "statement", label: "Thông điệp", description: "Một luận điểm cần ghi nhớ", icon: Quote },
  { value: "split", label: "Chia đôi", description: "Hai vùng nội dung cân bằng", icon: Columns2 },
  { value: "dashboard", label: "Dashboard", description: "Tổng hợp chỉ số và tín hiệu", icon: Gauge },
  { value: "comparison", label: "So sánh", description: "Đối chiếu hai hướng hoặc trạng thái", icon: GitCompare },
  { value: "process", label: "Quy trình", description: "Chuỗi bước có thứ tự", icon: ListOrdered },
  { value: "architecture", label: "Kiến trúc", description: "Layer, hệ thống và quan hệ", icon: Network },
  { value: "data", label: "Dữ liệu", description: "Biểu đồ, bảng và bằng chứng", icon: BarChart3 },
  { value: "closing", label: "Kết thúc", description: "Thông điệp chốt và hành động tiếp theo", icon: Flag }
];

export const variantOptions: readonly StudioChoiceOption<NonNullable<Slide["variant"]>>[] = [
  { value: "default", label: "Chuẩn", description: "Cân bằng và trung tính", icon: Circle },
  { value: "spotlight", label: "Tiêu điểm", description: "Tăng độ tập trung", icon: Focus },
  { value: "quiet", label: "Tĩnh", description: "Giảm nhiễu thị giác", icon: Blend },
  { value: "technical", label: "Kỹ thuật", description: "Dành cho cấu trúc và code", icon: Code2 }
];

export const transitionOptions: readonly StudioChoiceOption<NonNullable<Slide["transition"]>["type"]>[] = [
  { value: "none", label: "Không", description: "Chuyển ngay lập tức", icon: Ban },
  { value: "fade", label: "Fade", description: "Chuyển nhẹ bằng opacity", icon: Blend },
  { value: "slide", label: "Slide", description: "Di chuyển theo hướng điều hướng", icon: MoveRight },
  { value: "push", label: "Push", description: "Slide mới đẩy slide cũ", icon: PanelTopOpen },
  { value: "wipe", label: "Wipe", description: "Mở nội dung theo mặt nạ", icon: ScanLine },
  { value: "zoom", label: "Zoom", description: "Nhấn mạnh một khoảnh khắc", icon: ZoomIn },
  { value: "morph", label: "Morph", description: "Giữ liên tục giữa đối tượng", icon: Sparkles }
];

export const easingOptions: readonly StudioChoiceOption<NonNullable<NonNullable<SlideComponent["effect"]>["easing"]>>[] = [
  { value: "standard", label: "Chuẩn", description: "Nhịp chuyển cân bằng", icon: MoveRight },
  { value: "emphasized", label: "Nhấn mạnh", description: "Tăng độ dứt khoát ở điểm kết", icon: Sparkles },
  { value: "linear", label: "Tuyến tính", description: "Tốc độ đều cho dữ liệu hoặc kỹ thuật", icon: ScanLine }
];

export const effectOptions: readonly StudioChoiceOption<NonNullable<SlideComponent["effect"]>["type"]>[] = [
  { value: "none", label: "Không", description: "Hiển thị ngay", icon: Ban },
  { value: "fade", label: "Fade", description: "Xuất hiện nhẹ", icon: Blend },
  { value: "rise", label: "Rise", description: "Đi lên theo hierarchy", icon: ArrowUp },
  { value: "scale", label: "Scale", description: "Mở rộng từ tâm", icon: Maximize2 },
  { value: "wipe", label: "Wipe", description: "Reveal theo mặt nạ", icon: ScanLine },
  { value: "blur", label: "Blur", description: "Lấy nét có kiểm soát", icon: Wind },
  { value: "pop", label: "Pop", description: "Phản hồi nhanh, có điểm nhấn", icon: Sparkles }
];

export const componentOptions: readonly StudioChoiceOption<SlideComponent["type"]>[] = [
  { value: "heading", label: "Tiêu đề", description: "Kết luận và mô tả slide", icon: Heading1 },
  { value: "statement", label: "Thông điệp", description: "Một câu trích dẫn hoặc luận điểm", icon: Quote },
  { value: "metric-grid", label: "Chỉ số", description: "Nhóm metric có hierarchy", icon: Grid3X3 },
  { value: "comparison", label: "So sánh", description: "Hai phía cùng tiêu chí", icon: GitCompare },
  { value: "process", label: "Quy trình", description: "Chuỗi bước và kết quả", icon: ListOrdered },
  { value: "architecture", label: "Kiến trúc", description: "Layer và quan hệ hệ thống", icon: Network },
  { value: "chart", label: "Biểu đồ", description: "Quan hệ và xu hướng dữ liệu", icon: BarChart3 },
  { value: "table", label: "Bảng dữ liệu", description: "Đối chiếu chính xác theo hàng cột", icon: Table2 },
  { value: "code", label: "Đoạn mã", description: "Bằng chứng kỹ thuật có đánh dấu dòng", icon: Code2 },
  { value: "insight", label: "Kết luận", description: "Tín hiệu quan trọng cần nhớ", icon: Lightbulb },
  { value: "team-showcase", label: "Đội ngũ", description: "Vai trò, năng lực và đóng góp", icon: UsersRound },
  { value: "visualizer", label: "Visualizer", description: "Cây tăng trưởng, timeline, orbit hoặc network", icon: Network },
  { value: "evidence-footer", label: "Nguồn", description: "Trang, nguồn và bằng chứng", icon: FileText }
];

export const chartVariantOptions = [
  { value: "bar", label: "Cột", description: "So sánh độ lớn", icon: BarChart3 },
  { value: "line", label: "Đường", description: "Thể hiện xu hướng", icon: TrendingUp },
  { value: "area", label: "Vùng", description: "Nhấn mạnh tổng lượng", icon: Blocks },
  { value: "donut", label: "Donut", description: "Cơ cấu trong tổng thể", icon: PieChart }
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
  { value: "editorial", label: "Editorial", description: "Vai trò và câu chuyện rõ", icon: FileText },
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
  { value: "code", label: "Code", icon: Code2 }
] as const;

export const booleanIcons = {
  true: Eye,
  false: EyeOff,
  yes: Check,
  no: X
} as const;

export function componentLabel(type: SlideComponent["type"]): string {
  return componentOptions.find((option) => option.value === type)?.label ?? type;
}
