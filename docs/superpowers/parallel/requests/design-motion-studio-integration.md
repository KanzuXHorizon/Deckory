# Contract Change Request

- Track: Design and Motion Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Expose visual worlds, layered backgrounds, semantic typography, bounded media styling and semantic motion authoring in Studio without modifying another session's UI files.
- Existing contract: Plan 01 provides only the feature-gated V2 Studio foundation. This track owns no Studio root, inspector registry, toolbar, timeline or application CSS.
- Proposed exact type/signature: components and command boundaries below.
- Files the coordinator would change: new focused files under `apps/present/components/studio-v2/design/**` and `motion/**`, `apps/present/lib/*-presets-v2.ts`, then a separate reviewed wiring commit for `studio-v2.tsx`, inspector registry and workspace CSS.
- Failing test that motivates the change: core modules are fully testable but currently have no UI consumer. Browser evidence is deferred by parallel policy.
- Compatibility impact: V2 feature-gated only. V1 Studio remains unchanged.
- Can the track continue without it: yes; this is integration/UI work.

## Visual-world selector

Create:

```ts
export type VisualWorldSelectorProps = {
  selectedId: VisualWorldId;
  onSelect(id: VisualWorldId): void;
  diagnostics: readonly ThemeDiagnostic[];
};
```

Requirements:

- list exactly the twelve shipped worlds;
- preview semantic palette, typography pair, chart highlight, shape language and density—not a random slide thumbnail;
- changing world commits one `patch-element`/document theme command and preserves slide/element overrides;
- no per-slide random theme action;
- warn before replacing explicit deck-level overrides;
- keyboard roving focus, visible selected state and accessible descriptions.

## Background Composer

Create `apps/present/components/studio-v2/design/background-composer.tsx` with pure command helpers:

```ts
export type BackgroundComposerProps = {
  stack: BackgroundStackV2;
  assets: readonly DeckAssetV2[];
  diagnostics: readonly BackgroundDiagnostic[];
  onCommit(next: BackgroundStackV2): void;
};

export function reorderBackgroundLayers(
  stack: BackgroundStackV2,
  orderedIds: readonly string[]
): BackgroundStackV2;
```

Controls:

- add/remove/duplicate/reorder/visibility/opacity/blend mode;
- solid, linear/radial/conic/mesh, image/SVG, pattern/grid, noise, glow, vignette, overlay, blur backdrop and edge mask fields;
- local asset picker only;
- deterministic seed visible and editable for mesh/noise;
- contrast/safe-area warning overlay;
- effect controls hard-clamped to schema budgets, with no raw CSS input;
- reset to selected visual-world default;
- one immutable slide patch per completed interaction, not per pointer frame.

## Rich-text toolbar and auto-fit diagnostics

Create:

```ts
export type RichTextToolbarProps = {
  document: RichTextDocumentV2;
  selection: RichTextSelection;
  mixedState: RichTextMixedState;
  onCommit(document: RichTextDocumentV2): void;
};

export type TextFitInspectorProps = {
  result: TextFitResult;
  onIncreaseFrame(): void;
  onSplitText(): void;
  onRewriteRequest(): void;
};
```

Requirements:

- semantic role, bold/italic/underline/strike, emphasis color, safe link, list/numbering, alignment, vertical alignment, line height, tracking and paragraph spacing;
- Vietnamese IME/composition events must not commit partial text;
- every action commits one normalized rich-text document;
- never expose arbitrary HTML;
- auto-fit shows preferred/current/minimum size and maximum lines;
- when `text-does-not-fit`, never offer a button that shrinks below minimum; offer frame increase, split or constrained rewrite.

## Shape and image style panels

Create focused panels using the accepted schema:

```ts
export type ShapeStylePanelProps = {
  style: ElementStyleV2;
  onCommit(style: ElementStyleV2): void;
};

export type ImageStylePanelProps = {
  style: ElementStyleV2["image"];
  asset: DeckAssetV2;
  onCommit(style: NonNullable<ElementStyleV2["image"]>): void;
};
```

Sections:

- fill/gradient;
- stroke/dash;
- independent corners;
- shadow/glow/blur budgets;
- clip/mask;
- opacity/reviewed blend modes;
- image fit, crop mode, focal point, duotone and overlay.

Crop/focal controls must show the actual image frame. All values remain bounded and serializable. Remote URLs and raw filter strings are unavailable.

## Motion preset library and timeline

Create `apps/present/lib/motion-presets-v2.ts` as an adapter over `semanticMotionPresets`, not a duplicate preset definition.

```ts
export function applyMotionPreset(
  slide: SceneSlide,
  presetId: SemanticMotionPresetId,
  roleElementIds: Readonly<Record<string, string | readonly string[]>>
): SceneSlide;

export type MotionTimelineProps = {
  tracks: readonly MotionTrack[];
  compiled: CompiledMotionTimeline;
  mode: "live" | "reduced" | "thumbnail" | "export" | "final";
  onCommit(tracks: readonly MotionTrack[]): void;
};
```

Timeline requirements:

- hidden until Advanced Motion is enabled;
- select cue, change type/trigger/duration/delay/easing, reorder source order, scrub, replay and remove;
- one authored motion idea per slide by default; a second primary idea requires an explicit reason field during later schema/audit integration;
- reduced preview always exposes complete final content and removes travel/blur/counting;
- thumbnail/export previews are read-only final state;
- no continuous decorative loop control;
- no arbitrary Motion object editor;
- keyboard operation and visible focus at 200% zoom.

## Integration tests and browser QA

Coordinator-owned tests must cover:

- one command per background/style/text/motion action;
- mixed rich-text selection state;
- Vietnamese IME and diacritics;
- minimum font floor and actionable overflow diagnostic;
- crop/focal point persistence;
- budget controls cannot exceed schema limits by typing, dragging or paste;
- preset order deterministic after reload;
- reduced motion, thumbnail and export show complete equivalent state;
- 320, 375, 768, 1024 and 1440 widths plus 200% zoom;
- no overflow, hidden essential control, console error or network asset request.
