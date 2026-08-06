# Deckory V2 Design and Motion Core Manifest

## Execution identity

- Track: Design and Motion Core
- Accepted Scene Foundation base: `4425113417a1a064695525baef1af822b4be430b`
- Branch: `feat/v2-design-motion-core`
- Managed worktree: `C:\Users\KanzuWakazaki\.devspace\profiles\Deckory\session-1\worktrees\Deckory-1db310a3`
- Source checkout: `F:\Deckory`
- Source checkout state: dirty before dispatch and not modified by this track
- Worktree creation mode: native managed worktree from exact `baseRef`
- Push, merge, publish or tag: not performed

The native worktree metadata contained a Windows `F:/...` gitdir path that the WSL shell could not resolve. Git mutations were therefore executed with the existing managed worktree administrative directory through explicit `GIT_DIR` and `GIT_WORK_TREE`; Windows `cmd.exe` was used for pnpm verification. No repository metadata was rewritten and the worktree remained managed by DevSpace.

## Commit inventory

Production commits, in order:

1. `2f24fd577fff985cbabe0fd61c8a9fb79d8c8a75` — `feat(themes): add V2 visual worlds and token resolution`
2. `24eb4f4d03ed527aa45f1b7b0264c2ebc2b11e3d` — `feat(scene): add semantic rich text and bounded text fit`
3. `7ef0a358a0d484a4b2fadb811a829526900dff96` — `feat(scene): add typed motion tracks and semantic presets`
4. `1635a53bc89257cce24c5aa7dedd439e023184ff` — `feat(renderer): add deterministic design renderers`
5. `dbbbf31a93e05a8cc18645b761947c1ca7299357` — `feat(renderer): compile deterministic motion timelines`

Integration-request commit:

6. `abce07574ae1c26603d6ebd95efe1a226e61c79a` — `docs(v2): request design motion integration contracts`

This manifest is committed separately after the commits above so that it can record their exact SHAs. Its own SHA is reported by the final session handoff.

## Baseline evidence

Baseline was run on `4425113417a1a064695525baef1af822b4be430b` before production edits:

```text
pnpm --filter @deckory/schema test
36 passed, 0 failed

pnpm --filter @deckory/scene test
13 passed, 0 failed

pnpm --filter @deckory/renderer test
3 passed, 0 failed

pnpm --filter @deckory/present test -- components/slide-frame.test.tsx components/deck-thumbnail.test.tsx
30 test files, 134 passed, 0 failed

pnpm typecheck
all applicable workspace projects passed
```

Dependency installation used `pnpm install --frozen-lockfile`. When pnpm temporarily introduced an empty `packages/themes` importer after the new package was created, the lockfile change was restored and excluded from every commit, as required by the parallel execution protocol.

## Visual-world inventory

`@deckory/themes` ships exactly twelve coherent deck-level visual worlds:

| ID | Display name | Primary direction |
|---|---|---|
| `deckory-editorial-control-room` | Deckory Editorial Control Room | Editorial neutral workspace with controlled cobalt and teal emphasis |
| `swiss-precision` | Swiss Precision | Strict grid, black/red contrast and restrained geometry |
| `scientific-illustration` | Scientific Illustration | Paper-like light surface, biological green and explanatory softness |
| `technical-blueprint` | Technical Blueprint | Technical blue field, grid structure and mono-led typography |
| `data-journalism` | Data Journalism | Neutral newsroom surface, direct data labels and purposeful red highlight |
| `minimal-luxury` | Minimal Luxury | Wide whitespace, refined serif and restrained warm metallic accent |
| `cinematic-dark` | Cinematic Dark | Dark stage, cool highlights and bounded cinematic depth |
| `academic-defense` | Academic Defense | Navy academic authority and evidence-first stage legibility |
| `product-showcase` | Product Showcase | Clean bright surface, vivid cobalt and product-image priority |
| `geometric-modernism` | Geometric Modernism | Bold primary geometry and disciplined large-scale composition |
| `organic-systems` | Organic Systems | Earth palette, soft curves and approachable systems language |
| `risograph-editorial` | Risograph Editorial | Limited ink palette, local grain and expressive editorial composition |

Every world defines the same typed groups:

- semantic color roles;
- display, title, subtitle, body, caption, data and mono typography;
- spacing scale;
- radii;
- border, shadow and glow depth budgets;
- chart palette, highlight and direct-label semantics;
- diagram node, edge and cluster semantics;
- imagery fit, saturation, contrast, overlay, duotone and effect defaults;
- layered-background defaults and local grain policy;
- density and line-length guidance;
- slide safe areas;
- motion duration, stagger, travel, easing and reduced-motion policy.

One visual world is resolved for a deck. Slide and element variation comes from typed overrides, composition, scale, imagery and density; no per-slide random theme generation is present.

## Public interface inventory

### `@deckory/themes`

Package exports already defined in the track package:

```ts
export * from "./types";
export * from "./themes";
export * from "./resolve";
```

Primary public types and values:

```ts
VisualWorld
VisualWorldId
ThemeTokens
ThemeTokenOverrides
ThemeDiagnostic
ThemeResolution
requiredVisualWorldIds
visualWorlds
validateVisualWorld(world: VisualWorld): ThemeDiagnostic[]
contrastRatio(foreground: string, background: string): number | undefined
resolveThemeTokens(
  world: VisualWorld,
  deckOverrides?: ThemeTokenOverrides,
  slideOverrides?: ThemeTokenOverrides
): ThemeResolution
resolveElementTokens(
  resolvedTheme: ThemeTokens,
  elementOverrides?: ThemeTokenOverrides
): ThemeResolution
```

Resolution order is deterministic `visual world → deck → slide → element`, never mutates input values and returns diagnostics for unknown references, invalid values and bounded-effect violations instead of silently accepting them.

### `@deckory/scene` focused rich-text interface

Implemented in `packages/scene/src/rich-text.ts`:

```ts
RichTextMarks
RichTextRun
RichTextList
RichTextParagraphStyle
RichTextParagraph
RichTextDocumentInput
NormalizedRichTextDocument
normalizeRichText(document: RichTextDocumentInput): NormalizedRichTextDocument
richTextToPlainText(document): string
```

Behavior:

- semantic paragraphs and runs only;
- normalized marks;
- adjacent identical runs merged;
- Unicode NFC normalization;
- Vietnamese diacritics and punctuation preserved;
- stable list/plain-text extraction;
- stable reading order;
- duplicate paragraph IDs rejected;
- no arbitrary HTML document field.

### `@deckory/scene` focused text-fit interface

Implemented in `packages/scene/src/text-fit.ts`:

```ts
TextMeasurementRequest
TextMeasurement
TextMeasurer
TextFitPolicy
TextFitSuccess
TextFitFailure
TextFitResult
buildTextMeasurementCacheKey(input): string
measureRichText(document, request, measurer?): TextMeasurement
fitTextToFrame(document, frame, policy, measurer?): TextFitResult
```

Behavior:

- local deterministic measurement contract;
- cache key uses font family, weight, size, width and normalized text hash;
- Vietnamese-aware character advance model;
- explicit preferred and minimum sizes;
- maximum-line and frame-height checks;
- 0.5 px bounded search;
- never returns a size below `minimumSize`;
- emits `text-does-not-fit` with measured lines, height, overflowing paragraph and split/rewrite/frame recommendation.

### `@deckory/scene` focused motion interface

Implemented in `packages/scene/src/motion.ts`:

```ts
MotionCueType
MotionTrigger
MotionEasing
MotionProperty
MotionState
MotionCue
MotionTrack
MotionDiagnostic
orderMotionCues(cues): OrderedMotionCue[]
validateMotionTrack(track): MotionDiagnostic[]
SemanticMotionPresetId
SemanticMotionPreset
semanticMotionPresets
```

Supported cue types:

- entrance;
- emphasis;
- exit;
- path;
- stagger;
- morph;
- chart progress;
- connector progress;
- camera.

Supported triggers:

- on enter;
- on click;
- after previous;
- with previous.

Validation requires finite bounded timing, deterministic source order and a final value for every animated property. No executable callback or arbitrary Motion object exists in this domain.

Semantic preset data:

1. `reveal-argument`
2. `compare-states`
3. `trace-process`
4. `spotlight-evidence`
5. `overview-to-detail`
6. `problem-to-solution-morph`
7. `chart-and-conclusion`
8. `architecture-walkthrough`

### `@deckory/renderer` focused interfaces

These files are intentionally direct-import only until coordinator barrel integration:

```ts
BackgroundRenderer({ stack, assets })
RichTextRenderer({ document })
ShapeRenderer({ spec })
ImageRenderer({ spec })
compileMotionTimeline(tracks): CompiledMotionTimeline
resolveMotionState(track, { mode, time }): CompilerMotionState
```

`BackgroundRenderer` supports:

- solid;
- linear, radial and conic gradients;
- deterministic SVG mesh gradient;
- local image and SVG assets;
- pattern and grid;
- seeded SVG grain/noise;
- glow;
- vignette;
- color overlay;
- backdrop blur;
- edge mask;
- stable source layer order;
- missing-asset, remote-asset and effect-budget diagnostics.

`RichTextRenderer` provides semantic paragraphs, lists, links and inline marks. React escaping prevents arbitrary supplied text from executing as HTML. Complete plain text is exposed as the accessible equivalent.

`ShapeRenderer` supports solid/gradient fills, strokes, dash patterns, independent corner radii, reviewed blend modes, clip/mask, opacity and bounded shadow/glow/blur.

`ImageRenderer` supports local-only sources, contain/cover/fill modes, crop, focal point, independent radii, mask, duotone, controlled overlay and bounded blur/saturation/contrast.

`motion-compiler.ts` compiles structural typed tracks into deterministic cue start/end times and a final-state map without depending on a runtime animation library or accepting arbitrary animation objects.

## Determinism and safety constraints

### Token resolution

- Input worlds and override objects are cloned and never mutated.
- Repeated resolution returns structurally equal output.
- Semantic references resolve from the root token tree.
- Unknown references preserve the accepted base token and emit `theme-token-unknown`.
- Out-of-budget literals preserve the accepted base token and emit `theme-value-out-of-bounds`.

### Local assets

Background and image renderers reject `http://` and `https://` sources. Accepted source forms are repository/local paths, `data:` and `file:` references. Static scan of owned production files found no literal remote asset URL.

### Effect budgets

Runtime guards and theme-resolution guards enforce:

- shape/image blur: maximum `16`;
- shadow blur: maximum `48`;
- glow blur: maximum `56`;
- glow/shadow opacity: maximum `0.4`;
- background blur: maximum `64`;
- image overlay opacity: maximum `0.65`;
- grain and vignette remain bounded;
- image crop must stay within normalized source bounds.

Unsafe values render an explicit diagnostic node rather than an unbounded CSS effect.

### Background determinism

- mesh IDs derive from stable hashes of layer ID, seed and colors;
- mesh geometry uses a seeded local linear-congruential generator;
- grain/noise filter IDs and seeds are stable;
- repeated static renders are byte-identical in focused tests;
- document layer order is preserved exactly.

### Text determinism

- Unicode is normalized to NFC before hashing and measuring;
- composed and decomposed Vietnamese text produces the same cache key;
- measurement has no browser/network/font-loading side effect;
- repeated measurement is structurally equal.

### Motion determinism

- cue order uses declared `sourceOrder`, stable track order and cue ID tie-breaking;
- after-previous and with-previous timing is deterministic;
- final state is a required typed numeric map;
- incomplete final state produces diagnostics rather than hidden or partial output.

## RED/GREEN evidence

### Visual worlds and token resolution

RED:

```text
pnpm --filter @deckory/themes test
2 failed suites
Cannot find module './themes'
Cannot find module './resolve'
```

A later GREEN run exposed one real resolver defect: `$colors.positive` was looked up from the nested `colors` object rather than the token root. The implementation was corrected at the lookup boundary; the test was not weakened.

GREEN:

```text
2 test files passed
6 tests passed
pnpm --filter @deckory/themes typecheck: exit 0
```

### Rich text, text fit and motion domain

RED:

```text
pnpm --filter @deckory/scene test -- src/rich-text.test.ts src/text-fit.test.ts src/motion.test.ts
3 failed suites
Cannot find module './rich-text'
Cannot find module './motion'
```

GREEN:

```text
6 scene test files passed
25 scene tests passed
pnpm --filter @deckory/scene typecheck: exit 0
```

### Focused renderers and motion compiler

RED:

```text
pnpm --filter @deckory/renderer test -- focused design/motion tests
5 failed suites
Cannot find module './background-renderer'
Cannot find module './rich-text-renderer'
Cannot find module './shape-renderer'
Cannot find module './image-renderer'
Cannot find module './motion-compiler'
```

During GREEN, TypeScript identified readonly corner-radius tuples that were not narrowed by `Array.isArray` under `exactOptionalPropertyTypes`. The implementation was corrected with explicit number/tuple branches.

GREEN:

```text
6 renderer test files passed
15 renderer tests passed
pnpm --filter @deckory/renderer typecheck: exit 0
```

## Fresh verification evidence

Fresh package and workspace verification after all production commits:

```text
pnpm --filter @deckory/themes test
2 files, 6 tests passed, 0 failed

pnpm --filter @deckory/themes typecheck
exit 0

pnpm --filter @deckory/scene test
6 files, 25 tests passed, 0 failed

pnpm --filter @deckory/scene typecheck
exit 0

pnpm --filter @deckory/renderer test
6 files, 15 tests passed, 0 failed

pnpm --filter @deckory/renderer typecheck
exit 0

pnpm typecheck
all 11 applicable workspace projects passed
```

Fresh full regression run:

```text
pnpm test
266 tests passed
0 failed
```

The full total consists of 262 Vitest tests across workspace packages/apps/decks and 4 Node script tests.

## Reduced-motion and final-state equivalence evidence

Focused test:

```ts
const reduced = resolveMotionState(track, { mode: "reduced", time: 0 });
const thumbnail = resolveMotionState(track, { mode: "thumbnail", time: 0 });
const exported = resolveMotionState(track, { mode: "export", time: 0 });

expect(reduced).toEqual(track.finalState);
expect(thumbnail).toEqual(reduced);
expect(exported).toEqual(reduced);
```

Result:

```text
packages/renderer/src/motion-compiler.test.ts
passed
```

`resolveMotionState` returns a clone of the complete declared final state for every non-live mode:

- reduced;
- thumbnail;
- export;
- final.

The compiler separately reports `motion-final-state-missing` for every animated property absent from a track's final state. Tests cover missing `translateY` and `blur` values. This proves core state equivalence; shared Presenter/thumbnail/export rendering integration remains coordinator work and is not claimed by this track.

## Changed-file inventory

### Theme package

- `packages/themes/package.json`
- `packages/themes/tsconfig.json`
- `packages/themes/src/index.ts`
- `packages/themes/src/types.ts`
- `packages/themes/src/themes.ts`
- `packages/themes/src/themes.test.ts`
- `packages/themes/src/resolve.ts`
- `packages/themes/src/resolve.test.ts`

### Scene focused files

- `packages/scene/src/rich-text.ts`
- `packages/scene/src/rich-text.test.ts`
- `packages/scene/src/text-fit.ts`
- `packages/scene/src/text-fit.test.ts`
- `packages/scene/src/motion.ts`
- `packages/scene/src/motion.test.ts`

### Renderer focused files

- `packages/renderer/src/background-renderer.tsx`
- `packages/renderer/src/background-renderer.test.tsx`
- `packages/renderer/src/rich-text-renderer.tsx`
- `packages/renderer/src/rich-text-renderer.test.tsx`
- `packages/renderer/src/shape-renderer.tsx`
- `packages/renderer/src/shape-renderer.test.tsx`
- `packages/renderer/src/image-renderer.tsx`
- `packages/renderer/src/image-renderer.test.tsx`
- `packages/renderer/src/motion-compiler.ts`
- `packages/renderer/src/motion-compiler.test.ts`

### Integration artifacts

- `docs/superpowers/parallel/requests/design-motion-schema-contracts.md`
- `docs/superpowers/parallel/requests/design-motion-renderer-integration.md`
- `docs/superpowers/parallel/requests/design-motion-dependencies-and-exports.md`
- `docs/superpowers/parallel/requests/design-motion-studio-integration.md`
- `docs/superpowers/parallel/manifests/design-motion.md`

## Ownership check

No track commit modifies:

- `packages/schema/**`;
- `packages/sdk/**`;
- `packages/visuals/**`;
- `apps/present/**`;
- `packages/audit/**`;
- `packages/templates/**`;
- `pnpm-lock.yaml`;
- root `package.json`;
- `packages/scene/src/index.ts`;
- `packages/renderer/src/index.ts`;
- existing shared renderer roots;
- route entrypoints;
- files owned by Studio Layout, Component SDK or Visual Intelligence sessions.

## Integration requests

### Schema

See `docs/superpowers/parallel/requests/design-motion-schema-contracts.md`.

It requests exact strict contracts for:

- twelve visual-world IDs and typed theme overrides;
- semantic rich text;
- discriminated fills/background layers;
- bounded style/image effects;
- typed motion cues/tracks and complete final-state validation.

### Renderer and shared barrels

See `docs/superpowers/parallel/requests/design-motion-renderer-integration.md`.

It requests:

- focused renderer exports;
- replacing the limited shared background loop;
- rich-text/shape/image dispatch adapters;
- typed motion-state mapping;
- complete final-state policy for reduced, thumbnail, export and final modes;
- shared V1 compatibility and V2 integration tests.

### Dependencies and package exports

See `docs/superpowers/parallel/requests/design-motion-dependencies-and-exports.md`.

It requests:

- scene and renderer subpath exports;
- renderer workspace links to scene/themes;
- one coordinator-owned lockfile update;
- no new third-party dependency.

### Studio

See `docs/superpowers/parallel/requests/design-motion-studio-integration.md`.

It requests exact props and behavior for:

- visual-world selector;
- Background Composer;
- semantic rich-text toolbar;
- text-fit diagnostic actions;
- shape/image style panels;
- semantic motion preset adapter and advanced timeline;
- browser, keyboard, Vietnamese IME, zoom and reduced-motion QA.

## Remaining integration and QA

Not claimed by this isolated track:

- canonical schema persistence of the new contracts;
- root package/barrel exports;
- shared SceneRenderer and ElementRenderer wiring;
- Studio selector, composers, inspectors and timeline;
- Presenter runtime animation playback;
- browser screenshot inspection;
- full-size versus thumbnail visual review;
- accessibility review at 200% zoom;
- export pixel comparison;
- combined parallel-branch integration tests;
- gallery deck and audit-rule integration;
- production build after coordinator wiring.

The coordinator must apply the requests in the parallel integration worktree, run one reviewed lockfile update, wire shared surfaces and execute combined unit, type, lint, build, browser and export verification before any production-ready claim.
