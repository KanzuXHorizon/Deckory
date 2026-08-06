export type SemanticColorTokens = {
  canvas: string;
  surface: string;
  surfaceElevated: string;
  foreground: string;
  muted: string;
  accent: string;
  accentSecondary: string;
  positive: string;
  warning: string;
  critical: string;
  border: string;
  inverse: string;
};

export type TypographyRole = {
  family: string;
  fallbacks: readonly string[];
  size: number;
  minimumSize: number;
  lineHeight: number;
  weight: number;
  tracking: number;
  maximumLines?: number;
};

export type TypographyTokens = {
  display: TypographyRole;
  title: TypographyRole;
  subtitle: TypographyRole;
  body: TypographyRole;
  caption: TypographyRole;
  data: TypographyRole;
  mono: TypographyRole;
};

export type SpacingTokens = {
  hairline: number;
  micro: number;
  small: number;
  medium: number;
  large: number;
  section: number;
  canvasInset: number;
};

export type RadiusTokens = {
  small: number;
  medium: number;
  large: number;
  pill: number;
};

export type DepthTokens = {
  shadow: { x: number; y: number; blur: number; spread: number; opacity: number };
  glow: { blur: number; opacity: number };
  borderWidth: number;
};

export type ChartTokens = {
  categorical: readonly string[];
  sequential: readonly string[];
  positive: string;
  negative: string;
  neutral: string;
  highlight: string;
  grid: string;
  axis: string;
  directLabel: string;
  strokeWidth: number;
  cornerRadius: number;
};

export type DiagramTokens = {
  nodeFill: string;
  nodeText: string;
  nodeBorder: string;
  edge: string;
  edgeEmphasis: string;
  clusterFill: string;
  strokeWidth: number;
  cornerRadius: number;
};

export type ImageryTokens = {
  fit: "cover" | "contain";
  saturation: number;
  contrast: number;
  duotone?: readonly [string, string];
  overlay: { color: string; opacity: number };
  effects: { blur: number; grain: number; vignette: number };
};

export type BackgroundTokens = {
  base: string;
  elevated: string;
  accentWash: string;
  grid: string;
  defaultLayerOrder: readonly string[];
  grain: { enabled: boolean; opacity: number; scale: number };
};

export type DensityTokens = {
  content: "spacious" | "balanced" | "compact";
  maximumColumns: number;
  maximumPrimaryElements: number;
  preferredLineLength: number;
};

export type SafeAreaTokens = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type MotionTokens = {
  durationFast: number;
  durationStandard: number;
  durationDeliberate: number;
  stagger: number;
  travel: number;
  easing: "standard" | "emphasized" | "linear";
  reducedMotion: "final-state";
};

export type ThemeTokens = {
  colors: SemanticColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: RadiusTokens;
  depth: DepthTokens;
  charts: ChartTokens;
  diagrams: DiagramTokens;
  imagery: ImageryTokens;
  backgrounds: BackgroundTokens;
  density: DensityTokens;
  safeArea: SafeAreaTokens;
  motion: MotionTokens;
};

export type VisualWorld = ThemeTokens & {
  id: string;
  name: string;
  description: string;
};

type Atomic = string | number | boolean | null | undefined;
export type DeepPartial<T> = T extends Atomic
  ? T
  : T extends readonly unknown[]
    ? { [Key in keyof T]: DeepPartial<T[Key]> }
    : { [Key in keyof T]?: DeepPartial<T[Key]> };

export type ThemeTokenOverrides = DeepPartial<ThemeTokens>;

export type ThemeDiagnosticCode =
  | "theme-token-unknown"
  | "theme-value-out-of-bounds"
  | "theme-contrast-insufficient"
  | "theme-value-invalid";

export type ThemeDiagnostic = {
  code: ThemeDiagnosticCode;
  path: string;
  message: string;
  reference?: string;
  value?: unknown;
};

export type ThemeResolution = {
  tokens: ThemeTokens;
  diagnostics: readonly ThemeDiagnostic[];
};
