import type { DeepPartial, ThemeDiagnostic, ThemeTokens, VisualWorld } from "./types";

export const requiredVisualWorldIds = [
  "deckory-editorial-control-room",
  "swiss-precision",
  "scientific-illustration",
  "technical-blueprint",
  "data-journalism",
  "minimal-luxury",
  "cinematic-dark",
  "academic-defense",
  "product-showcase",
  "geometric-modernism",
  "organic-systems",
  "risograph-editorial"
] as const;

export type VisualWorldId = (typeof requiredVisualWorldIds)[number];

const sans = "Inter Variable";
const serif = "Source Serif 4 Variable";
const mono = "JetBrains Mono Variable";
const sansFallbacks = ["Inter", "Segoe UI", "Arial", "sans-serif"] as const;
const serifFallbacks = ["Source Serif 4", "Georgia", "serif"] as const;
const monoFallbacks = ["JetBrains Mono", "Consolas", "monospace"] as const;

const baseTokens: ThemeTokens = {
  colors: {
    canvas: "#f2f2ed",
    surface: "#ffffff",
    surfaceElevated: "#f8f8f5",
    foreground: "#15171a",
    muted: "#5f6368",
    accent: "#5147e8",
    accentSecondary: "#0f8b8d",
    positive: "#177245",
    warning: "#9b5b00",
    critical: "#b42318",
    border: "#d9dad6",
    inverse: "#ffffff"
  },
  typography: {
    display: { family: sans, fallbacks: sansFallbacks, size: 72, minimumSize: 46, lineHeight: 0.98, weight: 760, tracking: -1.8, maximumLines: 3 },
    title: { family: sans, fallbacks: sansFallbacks, size: 48, minimumSize: 34, lineHeight: 1.04, weight: 720, tracking: -1.1, maximumLines: 3 },
    subtitle: { family: sans, fallbacks: sansFallbacks, size: 28, minimumSize: 22, lineHeight: 1.18, weight: 540, tracking: -0.2, maximumLines: 4 },
    body: { family: sans, fallbacks: sansFallbacks, size: 22, minimumSize: 18, lineHeight: 1.38, weight: 430, tracking: 0, maximumLines: 9 },
    caption: { family: sans, fallbacks: sansFallbacks, size: 15, minimumSize: 13, lineHeight: 1.35, weight: 520, tracking: 0.1, maximumLines: 4 },
    data: { family: sans, fallbacks: sansFallbacks, size: 30, minimumSize: 22, lineHeight: 1, weight: 720, tracking: -0.5, maximumLines: 2 },
    mono: { family: mono, fallbacks: monoFallbacks, size: 17, minimumSize: 14, lineHeight: 1.45, weight: 500, tracking: 0, maximumLines: 14 }
  },
  spacing: { hairline: 1, micro: 6, small: 12, medium: 20, large: 32, section: 52, canvasInset: 64 },
  radii: { small: 6, medium: 12, large: 20, pill: 999 },
  depth: {
    shadow: { x: 0, y: 14, blur: 32, spread: -10, opacity: 0.18 },
    glow: { blur: 32, opacity: 0.18 },
    borderWidth: 1
  },
  charts: {
    categorical: ["#5147e8", "#0f8b8d", "#c77700", "#3f6f9f", "#8c5f9e", "#6c7a38"],
    sequential: ["#e9e7ff", "#bcb7fa", "#8178ef", "#5147e8", "#2e258e"],
    positive: "#177245",
    negative: "#b42318",
    neutral: "#7a7f86",
    highlight: "#5147e8",
    grid: "#d9dad6",
    axis: "#5f6368",
    directLabel: "#15171a",
    strokeWidth: 2,
    cornerRadius: 6
  },
  diagrams: {
    nodeFill: "#ffffff",
    nodeText: "#15171a",
    nodeBorder: "#b9bbb5",
    edge: "#70757d",
    edgeEmphasis: "#5147e8",
    clusterFill: "#ececf7",
    strokeWidth: 2,
    cornerRadius: 12
  },
  imagery: {
    fit: "cover",
    saturation: 0.94,
    duotone: undefined,
    contrast: 1.04,
    overlay: { color: "#15171a", opacity: 0.08 },
    effects: { blur: 0, grain: 0.08, vignette: 0.08 }
  },
  backgrounds: {
    base: "#f2f2ed",
    elevated: "#ffffff",
    accentWash: "#eceaff",
    grid: "#d9dad6",
    defaultLayerOrder: ["base", "structure", "accent", "grain", "vignette"],
    grain: { enabled: true, opacity: 0.045, scale: 1 }
  },
  density: { content: "balanced", maximumColumns: 4, maximumPrimaryElements: 7, preferredLineLength: 54 },
  safeArea: { top: 52, right: 64, bottom: 52, left: 64 },
  motion: {
    durationFast: 0.18,
    durationStandard: 0.42,
    durationDeliberate: 0.72,
    stagger: 0.08,
    travel: 24,
    easing: "emphasized",
    reducedMotion: "final-state"
  }
};

function mergeTokens(base: ThemeTokens, overrides: DeepPartial<ThemeTokens>): ThemeTokens {
  return {
    colors: { ...base.colors, ...overrides.colors },
    typography: {
      display: { ...base.typography.display, ...overrides.typography?.display },
      title: { ...base.typography.title, ...overrides.typography?.title },
      subtitle: { ...base.typography.subtitle, ...overrides.typography?.subtitle },
      body: { ...base.typography.body, ...overrides.typography?.body },
      caption: { ...base.typography.caption, ...overrides.typography?.caption },
      data: { ...base.typography.data, ...overrides.typography?.data },
      mono: { ...base.typography.mono, ...overrides.typography?.mono }
    },
    spacing: { ...base.spacing, ...overrides.spacing },
    radii: { ...base.radii, ...overrides.radii },
    depth: {
      shadow: { ...base.depth.shadow, ...overrides.depth?.shadow },
      glow: { ...base.depth.glow, ...overrides.depth?.glow },
      borderWidth: overrides.depth?.borderWidth ?? base.depth.borderWidth
    },
    charts: { ...base.charts, ...overrides.charts },
    diagrams: { ...base.diagrams, ...overrides.diagrams },
    imagery: {
      ...base.imagery,
      ...overrides.imagery,
      overlay: { ...base.imagery.overlay, ...overrides.imagery?.overlay },
      effects: { ...base.imagery.effects, ...overrides.imagery?.effects }
    },
    backgrounds: {
      ...base.backgrounds,
      ...overrides.backgrounds,
      grain: { ...base.backgrounds.grain, ...overrides.backgrounds?.grain }
    },
    density: { ...base.density, ...overrides.density },
    safeArea: { ...base.safeArea, ...overrides.safeArea },
    motion: { ...base.motion, ...overrides.motion }
  };
}

function world(
  id: VisualWorldId,
  name: string,
  description: string,
  overrides: DeepPartial<ThemeTokens>
): VisualWorld {
  return { id, name, description, ...mergeTokens(baseTokens, overrides) };
}

const worlds: readonly VisualWorld[] = [
  world("deckory-editorial-control-room", "Deckory Editorial Control Room", "Biên tập chính xác, accent cobalt–teal và nhịp độ kiểm soát.", {}),
  world("swiss-precision", "Swiss Precision", "Lưới nghiêm ngặt, tương phản đen–đỏ và hình học tiết chế.", {
    colors: { canvas: "#f7f7f4", surface: "#ffffff", foreground: "#111111", muted: "#565656", accent: "#d71920", accentSecondary: "#1d4ed8", border: "#cfcfc9" },
    typography: { display: { family: sans, fallbacks: sansFallbacks, size: 76, minimumSize: 48, lineHeight: 0.94, weight: 820, tracking: -2.1, maximumLines: 3 }, title: { family: sans, fallbacks: sansFallbacks, size: 50, minimumSize: 34, lineHeight: 1, weight: 780, tracking: -1.4, maximumLines: 3 } },
    spacing: { ...baseTokens.spacing, section: 60, canvasInset: 72 },
    radii: { small: 0, medium: 0, large: 0, pill: 999 },
    charts: { ...baseTokens.charts, categorical: ["#d71920", "#111111", "#1d4ed8", "#6b7280"], highlight: "#d71920", cornerRadius: 0 },
    diagrams: { ...baseTokens.diagrams, edgeEmphasis: "#d71920", cornerRadius: 0 },
    backgrounds: { ...baseTokens.backgrounds, base: "#f7f7f4", elevated: "#ffffff", accentWash: "#fff0f0", grid: "#d8d8d2" },
    density: { content: "compact", maximumColumns: 6, maximumPrimaryElements: 8, preferredLineLength: 48 }
  }),
  world("scientific-illustration", "Scientific Illustration", "Nền giấy sáng, xanh sinh học và cấu trúc giải thích mềm mại.", {
    colors: { canvas: "#f5f3ea", surface: "#fbfaf5", foreground: "#17302a", muted: "#5b6c67", accent: "#1f7a63", accentSecondary: "#315c9b", positive: "#2f7d32", warning: "#916400", critical: "#a53c2f", border: "#c9d0c6", inverse: "#ffffff", surfaceElevated: "#ffffff" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, family: serif, fallbacks: serifFallbacks, weight: 680, tracking: -1 }, title: { ...baseTokens.typography.title, family: serif, fallbacks: serifFallbacks, weight: 650, tracking: -0.5 } },
    charts: { ...baseTokens.charts, categorical: ["#1f7a63", "#315c9b", "#b06b2c", "#6d4c7d", "#6b7d3c"], highlight: "#1f7a63", grid: "#c9d0c6", axis: "#5b6c67", directLabel: "#17302a" },
    diagrams: { ...baseTokens.diagrams, nodeFill: "#fbfaf5", nodeText: "#17302a", nodeBorder: "#9fb1a8", edge: "#70867d", edgeEmphasis: "#1f7a63", clusterFill: "#e8eee8", cornerRadius: 18 },
    imagery: { ...baseTokens.imagery, saturation: 0.82, contrast: 1.02, overlay: { color: "#17302a", opacity: 0.04 }, effects: { blur: 0, grain: 0.12, vignette: 0.04 } },
    backgrounds: { ...baseTokens.backgrounds, base: "#f5f3ea", elevated: "#fbfaf5", accentWash: "#e5efe9", grid: "#c9d0c6" }
  }),
  world("technical-blueprint", "Technical Blueprint", "Nền xanh kỹ thuật, đường lưới và nhịp mono rõ ràng.", {
    colors: { canvas: "#0b2a46", surface: "#103653", surfaceElevated: "#154261", foreground: "#f3fbff", muted: "#b8cedc", accent: "#68d7ff", accentSecondary: "#ffd166", positive: "#7ee2a8", warning: "#ffd166", critical: "#ff8f85", border: "#3a6280", inverse: "#071b2d" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, family: mono, fallbacks: monoFallbacks, size: 64, minimumSize: 42, weight: 700, tracking: -1 }, title: { ...baseTokens.typography.title, family: mono, fallbacks: monoFallbacks, size: 42, minimumSize: 30, weight: 650, tracking: -0.6 }, body: { ...baseTokens.typography.body, family: mono, fallbacks: monoFallbacks, size: 19, minimumSize: 16, lineHeight: 1.45 } },
    radii: { small: 2, medium: 4, large: 6, pill: 999 },
    depth: { shadow: { x: 0, y: 10, blur: 24, spread: -8, opacity: 0.25 }, glow: { blur: 28, opacity: 0.22 }, borderWidth: 1 },
    charts: { ...baseTokens.charts, categorical: ["#68d7ff", "#ffd166", "#7ee2a8", "#d7a8ff"], highlight: "#68d7ff", grid: "#3a6280", axis: "#b8cedc", directLabel: "#f3fbff" },
    diagrams: { ...baseTokens.diagrams, nodeFill: "#103653", nodeText: "#f3fbff", nodeBorder: "#68d7ff", edge: "#86a9bd", edgeEmphasis: "#ffd166", clusterFill: "#123b59", cornerRadius: 4 },
    backgrounds: { ...baseTokens.backgrounds, base: "#0b2a46", elevated: "#103653", accentWash: "#123d5f", grid: "#27516f" },
    imagery: { ...baseTokens.imagery, saturation: 0.75, contrast: 1.12, duotone: ["#0b2a46", "#68d7ff"], overlay: { color: "#0b2a46", opacity: 0.2 } }
  }),
  world("data-journalism", "Data Journalism", "Nền báo chí trung tính, dữ liệu trực tiếp và accent đỏ có chủ đích.", {
    colors: { canvas: "#f7f4ee", surface: "#ffffff", surfaceElevated: "#fbfaf7", foreground: "#191919", muted: "#626262", accent: "#b72c2c", accentSecondary: "#235b8e", positive: "#2f6f47", warning: "#8a5a00", critical: "#b72c2c", border: "#d4d0c8", inverse: "#ffffff" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, family: serif, fallbacks: serifFallbacks, size: 68, minimumSize: 44, weight: 720, tracking: -1.4 }, title: { ...baseTokens.typography.title, family: serif, fallbacks: serifFallbacks, weight: 690, tracking: -0.8 }, body: { ...baseTokens.typography.body, size: 21, lineHeight: 1.42 } },
    charts: { ...baseTokens.charts, categorical: ["#235b8e", "#b72c2c", "#3f7a58", "#9a6b2f", "#72568a"], highlight: "#b72c2c", grid: "#d4d0c8", axis: "#626262", directLabel: "#191919", cornerRadius: 2 },
    diagrams: { ...baseTokens.diagrams, edgeEmphasis: "#b72c2c", cornerRadius: 6 },
    backgrounds: { ...baseTokens.backgrounds, base: "#f7f4ee", elevated: "#ffffff", accentWash: "#f5e4e1", grid: "#d4d0c8" },
    density: { content: "compact", maximumColumns: 5, maximumPrimaryElements: 8, preferredLineLength: 58 }
  }),
  world("minimal-luxury", "Minimal Luxury", "Khoảng trắng rộng, serif tinh tế và kim loại ấm được tiết chế.", {
    colors: { canvas: "#f4f0e8", surface: "#fbf9f4", surfaceElevated: "#ffffff", foreground: "#1f1b17", muted: "#6c6259", accent: "#7b5b32", accentSecondary: "#556b67", positive: "#456a53", warning: "#8a6222", critical: "#8f332b", border: "#d8cec0", inverse: "#ffffff" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, family: serif, fallbacks: serifFallbacks, size: 78, minimumSize: 50, weight: 560, tracking: -1.2 }, title: { ...baseTokens.typography.title, family: serif, fallbacks: serifFallbacks, size: 52, minimumSize: 36, weight: 580, tracking: -0.7 }, subtitle: { ...baseTokens.typography.subtitle, weight: 430 }, body: { ...baseTokens.typography.body, size: 21, weight: 400 } },
    spacing: { ...baseTokens.spacing, medium: 24, large: 40, section: 68, canvasInset: 84 },
    radii: { small: 2, medium: 4, large: 8, pill: 999 },
    depth: { shadow: { x: 0, y: 18, blur: 40, spread: -14, opacity: 0.14 }, glow: { blur: 24, opacity: 0.08 }, borderWidth: 1 },
    charts: { ...baseTokens.charts, categorical: ["#7b5b32", "#556b67", "#9b7b63", "#4b596d"], highlight: "#7b5b32", grid: "#d8cec0", axis: "#6c6259", directLabel: "#1f1b17", cornerRadius: 1 },
    backgrounds: { ...baseTokens.backgrounds, base: "#f4f0e8", elevated: "#fbf9f4", accentWash: "#ece2d3", grid: "#d8cec0", grain: { enabled: true, opacity: 0.025, scale: 1.4 } },
    density: { content: "spacious", maximumColumns: 3, maximumPrimaryElements: 5, preferredLineLength: 48 }
  }),
  world("cinematic-dark", "Cinematic Dark", "Sân khấu tối, highlight lạnh và chiều sâu điện ảnh có ngân sách.", {
    colors: { canvas: "#0d0f14", surface: "#151923", surfaceElevated: "#1c2230", foreground: "#f5f7fb", muted: "#a7afbd", accent: "#7c6cff", accentSecondary: "#38d6c6", positive: "#5ed39a", warning: "#f4c56a", critical: "#ff8178", border: "#333a48", inverse: "#090b10" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, size: 80, minimumSize: 48, weight: 760, tracking: -2.2 }, title: { ...baseTokens.typography.title, size: 52, minimumSize: 34, weight: 700 } },
    depth: { shadow: { x: 0, y: 20, blur: 44, spread: -12, opacity: 0.34 }, glow: { blur: 48, opacity: 0.32 }, borderWidth: 1 },
    charts: { ...baseTokens.charts, categorical: ["#7c6cff", "#38d6c6", "#f4c56a", "#ff8178", "#9eb7ff"], sequential: ["#252338", "#413b75", "#5b50b2", "#7c6cff", "#b7b0ff"], highlight: "#7c6cff", grid: "#333a48", axis: "#a7afbd", directLabel: "#f5f7fb" },
    diagrams: { ...baseTokens.diagrams, nodeFill: "#151923", nodeText: "#f5f7fb", nodeBorder: "#4a5263", edge: "#6e7788", edgeEmphasis: "#38d6c6", clusterFill: "#1c2230" },
    imagery: { ...baseTokens.imagery, saturation: 0.88, contrast: 1.12, overlay: { color: "#0d0f14", opacity: 0.22 }, effects: { blur: 0, grain: 0.12, vignette: 0.22 } },
    backgrounds: { ...baseTokens.backgrounds, base: "#0d0f14", elevated: "#151923", accentWash: "#221f3c", grid: "#2a303d", grain: { enabled: true, opacity: 0.06, scale: 1.2 } }
  }),
  world("academic-defense", "Academic Defense", "Uy tín học thuật, xanh navy và bằng chứng dễ đọc trên sân khấu.", {
    colors: { canvas: "#f6f7f8", surface: "#ffffff", surfaceElevated: "#f0f3f6", foreground: "#16243a", muted: "#5a6879", accent: "#1f4f82", accentSecondary: "#9a5b22", positive: "#2d6b4d", warning: "#8b5d0a", critical: "#a1332b", border: "#cfd6de", inverse: "#ffffff" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, family: serif, fallbacks: serifFallbacks, size: 68, minimumSize: 44, weight: 700, tracking: -1 }, title: { ...baseTokens.typography.title, family: serif, fallbacks: serifFallbacks, size: 46, minimumSize: 32, weight: 680, tracking: -0.5 }, body: { ...baseTokens.typography.body, size: 21, lineHeight: 1.42 } },
    charts: { ...baseTokens.charts, categorical: ["#1f4f82", "#9a5b22", "#2d6b4d", "#745a8e", "#65758a"], highlight: "#1f4f82", grid: "#cfd6de", axis: "#5a6879", directLabel: "#16243a", cornerRadius: 4 },
    diagrams: { ...baseTokens.diagrams, nodeText: "#16243a", nodeBorder: "#9aa8b8", edge: "#6b7b8d", edgeEmphasis: "#1f4f82", clusterFill: "#e8edf3", cornerRadius: 8 },
    backgrounds: { ...baseTokens.backgrounds, base: "#f6f7f8", elevated: "#ffffff", accentWash: "#e6edf5", grid: "#cfd6de" },
    density: { content: "balanced", maximumColumns: 4, maximumPrimaryElements: 7, preferredLineLength: 60 }
  }),
  world("product-showcase", "Product Showcase", "Nền sáng sạch, cobalt sống động và hình ảnh sản phẩm ưu tiên.", {
    colors: { canvas: "#f4f7fb", surface: "#ffffff", surfaceElevated: "#edf3ff", foreground: "#121826", muted: "#596579", accent: "#2855e8", accentSecondary: "#00a7a0", positive: "#157a55", warning: "#a96300", critical: "#c1322f", border: "#d6deea", inverse: "#ffffff" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, size: 82, minimumSize: 48, weight: 800, tracking: -2.3 }, title: { ...baseTokens.typography.title, size: 50, weight: 760 } },
    radii: { small: 10, medium: 18, large: 28, pill: 999 },
    depth: { shadow: { x: 0, y: 18, blur: 38, spread: -12, opacity: 0.2 }, glow: { blur: 36, opacity: 0.2 }, borderWidth: 1 },
    charts: { ...baseTokens.charts, categorical: ["#2855e8", "#00a7a0", "#ff9f43", "#7b61ff", "#4d7c70"], highlight: "#2855e8", grid: "#d6deea", axis: "#596579", directLabel: "#121826", cornerRadius: 10 },
    diagrams: { ...baseTokens.diagrams, nodeText: "#121826", nodeBorder: "#b8c6da", edge: "#73839a", edgeEmphasis: "#2855e8", clusterFill: "#edf3ff", cornerRadius: 18 },
    imagery: { ...baseTokens.imagery, saturation: 1.03, contrast: 1.06, overlay: { color: "#121826", opacity: 0.03 }, effects: { blur: 0, grain: 0.02, vignette: 0.05 } },
    backgrounds: { ...baseTokens.backgrounds, base: "#f4f7fb", elevated: "#ffffff", accentWash: "#e7edff", grid: "#d6deea" }
  }),
  world("geometric-modernism", "Geometric Modernism", "Khối hình táo bạo, màu nguyên bản và tỷ lệ lớn có kỷ luật.", {
    colors: { canvas: "#f3efe5", surface: "#fffdf7", surfaceElevated: "#fff7df", foreground: "#151515", muted: "#5e5a52", accent: "#e43b2f", accentSecondary: "#1557b0", positive: "#2e7650", warning: "#9a6500", critical: "#b62626", border: "#cfc7b8", inverse: "#ffffff" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, size: 86, minimumSize: 50, weight: 860, tracking: -2.6 }, title: { ...baseTokens.typography.title, size: 54, minimumSize: 36, weight: 820, tracking: -1.6 } },
    spacing: { ...baseTokens.spacing, section: 58, canvasInset: 56 },
    radii: { small: 0, medium: 2, large: 4, pill: 999 },
    charts: { ...baseTokens.charts, categorical: ["#e43b2f", "#1557b0", "#f2b705", "#2e7650", "#7c4d9e"], highlight: "#e43b2f", grid: "#cfc7b8", axis: "#5e5a52", directLabel: "#151515", cornerRadius: 0 },
    diagrams: { ...baseTokens.diagrams, nodeText: "#151515", nodeBorder: "#151515", edge: "#5e5a52", edgeEmphasis: "#1557b0", clusterFill: "#fff0c8", cornerRadius: 0 },
    backgrounds: { ...baseTokens.backgrounds, base: "#f3efe5", elevated: "#fffdf7", accentWash: "#ffe0d8", grid: "#cfc7b8", grain: { enabled: false, opacity: 0, scale: 1 } },
    density: { content: "balanced", maximumColumns: 5, maximumPrimaryElements: 6, preferredLineLength: 44 }
  }),
  world("organic-systems", "Organic Systems", "Màu đất, đường cong mềm và cấu trúc hệ thống gần gũi.", {
    colors: { canvas: "#eef1e8", surface: "#fafbf6", surfaceElevated: "#ffffff", foreground: "#243128", muted: "#617066", accent: "#3f7d5a", accentSecondary: "#9a6743", positive: "#39744f", warning: "#8b6418", critical: "#a14336", border: "#cbd3c8", inverse: "#ffffff" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, family: serif, fallbacks: serifFallbacks, size: 72, minimumSize: 46, weight: 640, tracking: -1 }, title: { ...baseTokens.typography.title, family: serif, fallbacks: serifFallbacks, weight: 620, tracking: -0.5 } },
    radii: { small: 12, medium: 22, large: 36, pill: 999 },
    charts: { ...baseTokens.charts, categorical: ["#3f7d5a", "#9a6743", "#5e6f9e", "#a9822d", "#745b7c"], highlight: "#3f7d5a", grid: "#cbd3c8", axis: "#617066", directLabel: "#243128", cornerRadius: 14 },
    diagrams: { ...baseTokens.diagrams, nodeFill: "#fafbf6", nodeText: "#243128", nodeBorder: "#9eb0a1", edge: "#728379", edgeEmphasis: "#3f7d5a", clusterFill: "#e2e9df", cornerRadius: 24 },
    imagery: { ...baseTokens.imagery, saturation: 0.88, contrast: 1.01, overlay: { color: "#243128", opacity: 0.04 }, effects: { blur: 0, grain: 0.1, vignette: 0.06 } },
    backgrounds: { ...baseTokens.backgrounds, base: "#eef1e8", elevated: "#fafbf6", accentWash: "#dce8df", grid: "#cbd3c8", grain: { enabled: true, opacity: 0.05, scale: 1.5 } }
  }),
  world("risograph-editorial", "Risograph Editorial", "Mực in giới hạn, texture hạt và bố cục biên tập giàu cá tính.", {
    colors: { canvas: "#f3ecd9", surface: "#fff8e8", surfaceElevated: "#fffdf6", foreground: "#23201d", muted: "#665f57", accent: "#d83b54", accentSecondary: "#216b7a", positive: "#39704f", warning: "#91620c", critical: "#b82d3f", border: "#cfc3aa", inverse: "#ffffff" },
    typography: { ...baseTokens.typography, display: { ...baseTokens.typography.display, family: serif, fallbacks: serifFallbacks, size: 76, minimumSize: 46, weight: 760, tracking: -1.4 }, title: { ...baseTokens.typography.title, family: serif, fallbacks: serifFallbacks, weight: 720, tracking: -0.8 } },
    radii: { small: 0, medium: 4, large: 8, pill: 999 },
    depth: { shadow: { x: 5, y: 7, blur: 0, spread: 0, opacity: 0.18 }, glow: { blur: 0, opacity: 0 }, borderWidth: 2 },
    charts: { ...baseTokens.charts, categorical: ["#d83b54", "#216b7a", "#e0a325", "#4f6f3f"], sequential: ["#f4d5dc", "#e99aaa", "#df6278", "#d83b54", "#8f1f34"], highlight: "#d83b54", grid: "#cfc3aa", axis: "#665f57", directLabel: "#23201d", strokeWidth: 3, cornerRadius: 0 },
    diagrams: { ...baseTokens.diagrams, nodeFill: "#fff8e8", nodeText: "#23201d", nodeBorder: "#23201d", edge: "#665f57", edgeEmphasis: "#216b7a", clusterFill: "#f6d9c8", strokeWidth: 3, cornerRadius: 4 },
    imagery: { ...baseTokens.imagery, saturation: 0.9, contrast: 1.08, duotone: ["#216b7a", "#d83b54"], overlay: { color: "#d83b54", opacity: 0.08 }, effects: { blur: 0, grain: 0.2, vignette: 0.04 } },
    backgrounds: { ...baseTokens.backgrounds, base: "#f3ecd9", elevated: "#fff8e8", accentWash: "#f7d0d5", grid: "#cfc3aa", grain: { enabled: true, opacity: 0.11, scale: 1.8 } },
    motion: { ...baseTokens.motion, durationFast: 0.16, durationStandard: 0.34, durationDeliberate: 0.58, travel: 16 }
  })
];

export const visualWorlds: ReadonlyMap<VisualWorldId, VisualWorld> = new Map(
  worlds.map((entry) => [entry.id as VisualWorldId, entry])
);

function hexChannel(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
}

function luminance(color: string): number | undefined {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return undefined;
  const source = match[1]!;
  const channels = [hexChannel(source, 0), hexChannel(source, 2), hexChannel(source, 4)].map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

export function contrastRatio(foreground: string, background: string): number | undefined {
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === undefined || second === undefined) return undefined;
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function validateBoundedNumber(
  diagnostics: ThemeDiagnostic[],
  path: string,
  value: number,
  minimum: number,
  maximum: number
): void {
  if (!Number.isFinite(value)) {
    diagnostics.push({
      code: "theme-value-invalid",
      path,
      value,
      message: `Token ${path} phải là số hữu hạn.`
    });
  } else if (value < minimum || value > maximum) {
    diagnostics.push({
      code: "theme-value-out-of-bounds",
      path,
      value,
      message: `Token ${path} phải nằm trong [${minimum}, ${maximum}].`
    });
  }
}

export function validateVisualWorld(world: VisualWorld): ThemeDiagnostic[] {
  const diagnostics: ThemeDiagnostic[] = [];
  const checks = [
    { path: "colors.foreground", foreground: world.colors.foreground, background: world.colors.canvas, minimum: 4.5 },
    { path: "colors.muted", foreground: world.colors.muted, background: world.colors.canvas, minimum: 4.5 },
    { path: "charts.highlight", foreground: world.charts.highlight, background: world.colors.canvas, minimum: 3 },
    { path: "diagrams.nodeText", foreground: world.diagrams.nodeText, background: world.diagrams.nodeFill, minimum: 4.5 }
  ] as const;

  for (const check of checks) {
    const ratio = contrastRatio(check.foreground, check.background);
    if (ratio === undefined) {
      diagnostics.push({
        code: "theme-value-invalid",
        path: check.path,
        value: check.foreground,
        message: `Token ${check.path} phải là màu hex 6 ký tự để kiểm tra tương phản.`
      });
    } else if (ratio < check.minimum) {
      diagnostics.push({
        code: "theme-contrast-insufficient",
        path: check.path,
        value: ratio,
        message: `Tương phản tại ${check.path} là ${ratio.toFixed(2)}:1, thấp hơn ngưỡng ${check.minimum}:1.`
      });
    }
  }

  for (const [role, token] of Object.entries(world.typography)) {
    validateBoundedNumber(diagnostics, `typography.${role}.size`, token.size, 1, 240);
    validateBoundedNumber(diagnostics, `typography.${role}.minimumSize`, token.minimumSize, 1, 240);
    validateBoundedNumber(diagnostics, `typography.${role}.lineHeight`, token.lineHeight, 0.5, 4);
    validateBoundedNumber(diagnostics, `typography.${role}.weight`, token.weight, 100, 1000);
    validateBoundedNumber(diagnostics, `typography.${role}.tracking`, token.tracking, -20, 100);
    if (token.minimumSize > token.size) {
      diagnostics.push({
        code: "theme-value-invalid",
        path: `typography.${role}.minimumSize`,
        value: token.minimumSize,
        message: `Typography minimumSize của ${role} không được lớn hơn preferred size.`
      });
    }
    if (token.maximumLines !== undefined && (!Number.isInteger(token.maximumLines) || token.maximumLines < 1 || token.maximumLines > 100)) {
      diagnostics.push({
        code: "theme-value-invalid",
        path: `typography.${role}.maximumLines`,
        value: token.maximumLines,
        message: `Typography maximumLines của ${role} phải là số nguyên trong [1, 100].`
      });
    }
  }

  const bounded = [
    ["depth.shadow.blur", world.depth.shadow.blur, 0, 48],
    ["depth.shadow.spread", world.depth.shadow.spread, -32, 32],
    ["depth.shadow.opacity", world.depth.shadow.opacity, 0, 0.4],
    ["depth.glow.blur", world.depth.glow.blur, 0, 56],
    ["depth.glow.opacity", world.depth.glow.opacity, 0, 0.4],
    ["imagery.saturation", world.imagery.saturation, 0, 2],
    ["imagery.contrast", world.imagery.contrast, 0.5, 2],
    ["imagery.overlay.opacity", world.imagery.overlay.opacity, 0, 0.65],
    ["imagery.effects.blur", world.imagery.effects.blur, 0, 16],
    ["imagery.effects.grain", world.imagery.effects.grain, 0, 0.3],
    ["imagery.effects.vignette", world.imagery.effects.vignette, 0, 0.4],
    ["backgrounds.grain.opacity", world.backgrounds.grain.opacity, 0, 0.2],
    ["backgrounds.grain.scale", world.backgrounds.grain.scale, 0.1, 8],
    ["motion.durationFast", world.motion.durationFast, 0, 2],
    ["motion.durationStandard", world.motion.durationStandard, 0, 3],
    ["motion.durationDeliberate", world.motion.durationDeliberate, 0, 5],
    ["motion.stagger", world.motion.stagger, 0, 1],
    ["motion.travel", world.motion.travel, 0, 160]
  ] as const;
  for (const [path, value, minimum, maximum] of bounded) {
    validateBoundedNumber(diagnostics, path, value, minimum, maximum);
  }

  if (world.imagery.duotone && world.imagery.duotone.some((color) => luminance(color) === undefined)) {
    diagnostics.push({
      code: "theme-value-invalid",
      path: "imagery.duotone",
      value: world.imagery.duotone,
      message: "Imagery duotone phải dùng đúng hai màu hex 6 ký tự."
    });
  }

  for (const [edge, value] of Object.entries(world.safeArea)) {
    validateBoundedNumber(diagnostics, `safeArea.${edge}`, value, 0, 360);
  }
  if (world.safeArea.left + world.safeArea.right >= 1280) {
    diagnostics.push({
      code: "theme-value-invalid",
      path: "safeArea",
      value: world.safeArea,
      message: "Safe area ngang phải chừa lại vùng nội dung dương trên canvas 1280px."
    });
  }
  if (world.safeArea.top + world.safeArea.bottom >= 720) {
    diagnostics.push({
      code: "theme-value-invalid",
      path: "safeArea",
      value: world.safeArea,
      message: "Safe area dọc phải chừa lại vùng nội dung dương trên canvas 720px."
    });
  }

  return diagnostics;
}
