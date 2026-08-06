# Contract Change Request

- Track: Design and Motion Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Persist strict visual-world overrides, semantic rich text, bounded professional styling and typed motion tracks in `DeckDocumentV2`.
- Existing contract: `DeckThemeV2Schema.tokens`, rich-text `document`, background `data`, chart/diagram specs and Web Block manifests accept `unknown`; `ElementStyleSchema` lacks gradient, dash, glow, blur, crop, mask, duotone and overlay contracts; `ElementMotionTrackSchema` models one loose cue with `finalState: Record<string, unknown>`.
- Files the coordinator would change: `packages/schema/src/v2.ts`, `packages/schema/src/v2.test.ts`, optionally `packages/schema/src/index.ts` only if root exports are approved.
- Failing test that motivates the change: Track tests import focused structural contracts directly because editing the frozen schema was forbidden. Integration tests must prove `DeckDocumentV2Schema` accepts the public interfaces below and rejects unknown keys, remote assets, incomplete final states and unbounded effects.
- Compatibility impact: Additive for V1. V2 documents using current loose records remain migratable, but strict parsing requires a one-time adapter for pre-integration fixtures.
- Can the track continue without it: yes; renderer and scene cores are complete but cannot be wired as canonical document data until accepted.

## Proposed exact public contract

Schema should own serializable document shapes. `@deckory/themes` remains responsible for complete visual-world definitions and token resolution.

```ts
export type ThemeTokenReference = `$${string}`;

export type ThemeTokenOverridesV2 = {
  colors?: Partial<Record<
    | "canvas" | "surface" | "surfaceElevated" | "foreground" | "muted"
    | "accent" | "accentSecondary" | "positive" | "warning" | "critical"
    | "border" | "inverse",
    string
  >>;
  typography?: Partial<Record<
    "display" | "title" | "subtitle" | "body" | "caption" | "data" | "mono",
    Partial<{
      family: string;
      fallbacks: string[];
      size: number;
      minimumSize: number;
      lineHeight: number;
      weight: number;
      tracking: number;
      maximumLines: number;
    }>
  >>;
  spacing?: Partial<Record<"hairline" | "micro" | "small" | "medium" | "large" | "section" | "canvasInset", number>>;
  radii?: Partial<Record<"small" | "medium" | "large" | "pill", number>>;
  depth?: {
    shadow?: Partial<{ x: number; y: number; blur: number; spread: number; opacity: number }>;
    glow?: Partial<{ blur: number; opacity: number }>;
    borderWidth?: number;
  };
  charts?: Partial<{
    categorical: string[];
    sequential: string[];
    positive: string;
    negative: string;
    neutral: string;
    highlight: string;
    grid: string;
    axis: string;
    directLabel: string;
    strokeWidth: number;
    cornerRadius: number;
  }>;
  diagrams?: Partial<{
    nodeFill: string;
    nodeText: string;
    nodeBorder: string;
    edge: string;
    edgeEmphasis: string;
    clusterFill: string;
    strokeWidth: number;
    cornerRadius: number;
  }>;
  imagery?: Partial<{
    fit: "cover" | "contain";
    saturation: number;
    contrast: number;
    duotone: [string, string];
    overlay: { color: string; opacity: number };
    effects: { blur: number; grain: number; vignette: number };
  }>;
  backgrounds?: Partial<{
    base: string;
    elevated: string;
    accentWash: string;
    grid: string;
    defaultLayerOrder: string[];
    grain: { enabled: boolean; opacity: number; scale: number };
  }>;
  density?: Partial<{
    content: "spacious" | "balanced" | "compact";
    maximumColumns: number;
    maximumPrimaryElements: number;
    preferredLineLength: number;
  }>;
  safeArea?: Partial<{ top: number; right: number; bottom: number; left: number }>;
  motion?: Partial<{
    durationFast: number;
    durationStandard: number;
    durationDeliberate: number;
    stagger: number;
    travel: number;
    easing: "standard" | "emphasized" | "linear";
    reducedMotion: "final-state";
  }>;
};

export type DeckThemeV2 = {
  id:
    | "deckory-editorial-control-room"
    | "swiss-precision"
    | "scientific-illustration"
    | "technical-blueprint"
    | "data-journalism"
    | "minimal-luxury"
    | "cinematic-dark"
    | "academic-defense"
    | "product-showcase"
    | "geometric-modernism"
    | "organic-systems"
    | "risograph-editorial";
  tokens: ThemeTokenOverridesV2;
};
```

Every color/string leaf may additionally accept `ThemeTokenReference`. Unknown references remain schema-valid authoring input but must produce a `theme-token-unknown` resolution diagnostic.

## Semantic rich text

Replace `richTextContent.document: unknown` with:

```ts
export type RichTextMarksV2 = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  emphasis?: "primary" | "secondary" | "positive" | "warning" | "critical";
  link?: { href: string; label?: string };
};

export type RichTextParagraphV2 = {
  id: StableId;
  runs: { text: string; marks?: RichTextMarksV2 }[];
  list?: { kind: "bullet" | "number"; level: number; ordinal?: number };
  style?: {
    role?: "display" | "title" | "subtitle" | "body" | "caption" | "data" | "mono";
    align?: "left" | "center" | "right" | "justify";
    lineHeight?: number;
    tracking?: number;
    spacingBefore?: number;
    spacingAfter?: number;
  };
};

export type RichTextDocumentV2 = {
  paragraphs: RichTextParagraphV2[];
  verticalAlign?: "top" | "center" | "bottom";
};
```

Validation requirements:

- duplicate paragraph IDs rejected;
- `list.level` integer `0..8`;
- links limited to `https:`, `http:`, `mailto:`, local `/...` and `#...` metadata;
- no HTML field, executable handler or arbitrary object accepted;
- Unicode text preserved and normalized by `@deckory/scene`, not rewritten by schema.

## Bounded style and media contracts

Add strict discriminated fill schemas:

```ts
export type FillV2 =
  | { type: "solid"; color: string }
  | { type: "linear-gradient"; angle: number; stops: { offset: number; color: string }[] }
  | { type: "radial-gradient"; position?: { x: number; y: number }; stops: { offset: number; color: string }[] };

export type ElementStyleV2 = {
  fill?: FillV2;
  stroke?: { color: string; width: number; dash?: number[] };
  cornerRadii?: number | [number, number, number, number];
  shadow?: { x: number; y: number; blur: number; spread: number; color: string; opacity: number };
  glow?: { color: string; blur: number; opacity: number };
  blur?: number;
  clipPath?: string;
  mask?: { type: "linear" | "radial"; value: string };
  opacity?: number;
  blendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "soft-light" | "difference";
  image?: {
    fit: "cover" | "contain" | "fill" | "none" | "scale-down";
    focalPoint?: { x: number; y: number };
    crop?: { x: number; y: number; width: number; height: number };
    duotone?: [string, string];
    overlay?: { color: string; opacity: number; blendMode?: "normal" | "multiply" | "screen" | "overlay" | "soft-light" };
    effects?: { blur: number; saturation: number; contrast: number };
  };
};
```

Hard budgets:

- shape/image blur `0..16`;
- shadow blur `0..48`, opacity `0..0.4`, spread `-32..32`;
- glow blur `0..56`, opacity `0..0.4`;
- image overlay opacity `0..0.65`;
- saturation `0..2`, contrast `0.5..2`;
- crop values finite, within `0..1`, and `x + width <= 1`, `y + height <= 1`;
- dash entries finite and positive, maximum 16 entries;
- gradient stops `2..12`, offsets `0..1`, sorted at normalization.

## Background discriminated union

Replace loose `BackgroundLayerSchema.data` usage with type-specific fields while preserving the existing layer IDs/types:

```ts
export type BackgroundLayerV2 =
  | Common & { type: "solid" | "color-overlay"; color: string }
  | Common & { type: "linear-gradient" | "radial-gradient" | "conic-gradient"; colors: string[]; angle?: number; position?: { x: number; y: number } }
  | Common & { type: "mesh-gradient"; colors: string[]; seed: number }
  | Common & { type: "image" | "svg"; assetId: StableId; fit?: "cover" | "contain"; position?: { x: number; y: number } }
  | Common & { type: "pattern"; color: string; angle?: number; size: number; lineWidth: number }
  | Common & { type: "grid"; color: string; size: number }
  | Common & { type: "noise"; seed: number; scale: number }
  | Common & { type: "glow"; color: string; position?: { x: number; y: number }; blur: number }
  | Common & { type: "vignette"; color: string }
  | Common & { type: "blur-backdrop"; blur: number }
  | Common & { type: "edge-mask"; color: string; edge: number };
```

`Common` remains `{ id, opacity, blendMode? }`. Enforce background blur `0..64`, glow opacity `0..0.4`, maximum 32 layers and local asset references only.

## Typed motion track

Replace the current per-cue `ElementMotionTrackSchema` with:

```ts
export type MotionPropertyV2 =
  | "opacity" | "translateX" | "translateY" | "scale" | "scaleX" | "scaleY"
  | "rotation" | "blur" | "progress" | "pathOffset" | "cameraX" | "cameraY" | "cameraZoom";

export type MotionStateV2 = Partial<Record<MotionPropertyV2, number>>;

export type MotionCueV2 = {
  id: StableId;
  type: "entrance" | "emphasis" | "exit" | "path" | "stagger" | "morph" | "chart-progress" | "connector-progress" | "camera";
  trigger: "on-enter" | "on-click" | "after-previous" | "with-previous";
  duration: number;
  delay?: number;
  easing: "standard" | "emphasized" | "linear";
  from: MotionStateV2;
  to: MotionStateV2;
  sourceOrder?: number;
  clickStep?: number;
  pathId?: StableId;
  groupId?: StableId;
};

export type ElementMotionTrackV2 = {
  id: StableId;
  elementId: StableId;
  cues: MotionCueV2[];
  finalState: MotionStateV2;
};
```

Validation requirements:

- duplicate cue IDs rejected;
- duration/delay `0..30` and finite;
- every animated property in `from` or `to` exists in `finalState`;
- every state value finite;
- exit before entrance rejected when the same track contains an entrance;
- arbitrary Motion/Framer objects, callbacks and CSS strings rejected.
