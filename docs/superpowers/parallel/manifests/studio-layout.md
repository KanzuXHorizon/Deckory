# Studio Layout Track Manifest

## Status

Track A core implementation is complete within its exclusive owned paths. Shared command integration, schema expansion, dependency installation, Studio-root wiring and browser QA remain coordinator-owned and are explicitly listed below. This manifest does not claim that the complete V2 Studio editing flow is integrated.

## Accepted base and workspace

- Accepted Scene Foundation commit: `4425113417a1a064695525baef1af822b4be430b`
- Source checkout at dispatch: `F:\Deckory`
- Source checkout branch/HEAD: `main` / `50effa1ee047330c7f580ee12f0c08dbd24c26af`
- Track branch: `feat/v2-studio-layout`
- Managed worktree: `C:\Users\KanzuWakazaki\.devspace\profiles\Deckory\session-1\worktrees\Deckory-f016b048`
- Worktree starting HEAD: `4425113417a1a064695525baef1af822b4be430b`
- Worktree starting status: clean, `## feat/v2-studio-layout`
- Worktree creation mode: Deckory managed worktree with `baseRef=4425113417a1a064695525baef1af822b4be430b`

The source checkout was already dirty and was not used as the implementation workspace. Its recorded paths at dispatch were:

```text
M  docs/superpowers/plans/2026-08-06-deckory-v2-06-export-release.md
M  docs/superpowers/plans/2026-08-06-deckory-v2-program-roadmap.md
?? apps/present/app/myinterview-defense-v2.css
?? decks/myinterview-defense-polished/
?? decks/myinterview-defense/deck-v2.ts
?? docs/superpowers/prompts/
```

No source-checkout path was reset, cleaned, staged, committed, merged or overwritten by this track.

### Worktrees recorded at track start

```text
F:/Deckory
  HEAD 50effa1ee047330c7f580ee12f0c08dbd24c26af
  branch refs/heads/main

C:/Users/KanzuWakazaki/.devspace/profiles/Deckory/session-1/worktrees/Deckory-1db310a3
  HEAD 4425113417a1a064695525baef1af822b4be430b
  detached

C:/Users/KanzuWakazaki/.devspace/profiles/Deckory/session-1/worktrees/Deckory-8e0d5fbf
  HEAD cb7db769409757da2282c2403bf3a5ba9176e386
  detached

C:/Users/KanzuWakazaki/.devspace/profiles/Deckory/session-1/worktrees/Deckory-b1874421
  HEAD 4425113417a1a064695525baef1af822b4be430b
  detached

C:/Users/KanzuWakazaki/.devspace/profiles/Deckory/session-1/worktrees/Deckory-db06f7db
  HEAD 4425113417a1a064695525baef1af822b4be430b
  detached

C:/Users/KanzuWakazaki/.devspace/profiles/Deckory/session-1/worktrees/Deckory-f016b048
  HEAD 4425113417a1a064695525baef1af822b4be430b
  branch refs/heads/feat/v2-studio-layout

C:/Users/KanzuWakazaki/.devspace/profiles/Deckory/session-1/worktrees/Deckory-f09faf8f
  HEAD 4425113417a1a064695525baef1af822b4be430b
  branch refs/heads/feat/deckory-v2-scene-foundation
```

## Starting baseline evidence

Executed on the clean managed worktree before writing tests or production code:

```bash
pnpm --filter @deckory/schema test
pnpm --filter @deckory/scene test
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/present test -- components/slide-frame.test.tsx components/deck-thumbnail.test.tsx
pnpm typecheck
```

Results:

- `@deckory/schema`: 3 files, 36 tests passed, 0 failed.
- `@deckory/scene`: 3 files, 13 tests passed, 0 failed.
- `@deckory/renderer`: 1 file, 3 tests passed, 0 failed.
- `@deckory/present`: the package script executed its complete suite, 30 files and 134 tests passed, 0 failed.
- Workspace typecheck: all participating packages/apps passed.
- Known accepted baseline failures: none.

## Commits

Apply in this order:

1. `e09ca6c1b00411ce9c0761fd5a06dfef691dae67` — `feat(scene): add deterministic constraints and auto layout`
2. `96d5f7e04f6998b1d373d31016919b4caf739e98` — `feat(scene): add hierarchy alignment and smart guides`
3. `912a995a7e1057fa310fe4fd8d01aea5e6a16f3f` — `feat(studio): add isolated canvas layers and layout modules`
4. `2480c03ca081e10a308db3429fece07275f59c85` — `style(studio): establish layout module visual baseline`
5. `bd0cab7f0780b62ada24eba172dc380818b60051` — `refactor(scene): clarify atomic layout command contract`
6. `248521954c29e7d3499049a198ff1742caeb3bcb` — `docs(parallel): record Studio layout integration manifest`
7. `1697d29b65d96b7cf3e3fb1e0dad13d7b0a5a6bc` — `fix(scene): harden layout and hierarchy edge cases`
8. `d5abacf903ea8dededeafe3984c054c099a45fc5` — `fix(studio): complete layout panel keyboard workflows`
9. `8a518f083af6fe3fab315e569bd363de68827d0d` — `fix(studio): prevent duplicate layer rename commits`
10. The final review-manifest commit is recorded in the final report after creation.

## Implemented behavior

### Deterministic constraints

- Horizontal: left, right, center, stretch and scale.
- Vertical: top, bottom, center, stretch and scale.
- Preserves original margins or center offsets according to mode.
- Enforces finite parent/child geometry and minimum/maximum sizes.
- Returns typed, actionable Vietnamese diagnostics when a resized parent cannot satisfy a child minimum; it never clips or silently shrinks below the declared minimum.

### Sizing policies

- `fixed`
- `hug-content`
- `fill-container`
- min/max bounded sizing
- aspect-ratio constrained coupled sizing with dependent-axis min/max validation
- persistence of aspect ratio is explicitly deferred through `studio-layout-aspect-ratio-contract.md`; the track does not claim document round-trip before that schema request is accepted
- deterministic intrinsic-size input independent of browser viewport geometry

### Stack and grid layout

- Horizontal and vertical stacks.
- Explicit grids with deterministic row/column placement.
- Independent padding at the pure-engine boundary.
- Gap, line gap, alignment and distribution.
- Stack wrapping into deterministic lines.
- Fair fill allocation with min/max caps.
- Typed does-not-fit diagnostics identifying affected elements and recovery options.

### Reversible layout conversion

- freeform → constraint
- freeform/constraint/group → horizontal stack
- freeform/constraint/group → vertical stack
- freeform/constraint/group → grid
- stack/grid → freeform or constraint through the same snapshot contract
- parent visual bounds are preserved
- before/after element snapshots generate one proposed atomic command and one inverse command

### Alignment, distribution and guides

- Align left, center, right, top, middle and bottom.
- Distribute horizontally and vertically while preserving the actual outer bounds, including cases where a wider middle element extends furthest.
- Reject distribution when selected element sizes exceed the available span.
- One toolbar action produces one `transform-elements` command.
- Canvas edge/center, safe area, custom, sibling edge/center, text baseline and auto-layout guide sources.
- Closest-guide snapping with zoom-normalized logical-pixel tolerance supplied by the caller.
- Equal-spacing measurements for temporary labels.

### Hierarchy

- Stable absolute-frame resolution through nested parents.
- Group, ungroup and reparent while preserving absolute visual positions.
- Reject selected parent/descendant mixtures and hierarchy cycles.
- Reject ungroup/reparent operations across rotated, scaled or skewed coordinate spaces until a transform-matrix integration is available, rather than silently changing visual geometry.
- Stable document-order hierarchy flattening with depth metadata.
- Grouping and reparenting produce one proposed atomic command plus one inverse command.

### Isolated Studio modules

Only focused files under owned Studio subdirectories were added; the Studio root was not modified.

- Pointer selection replace/additive toggle with stable document order.
- Marquee contain/intersect selection with deep-select mode.
- Hidden and locked elements excluded from marquee selection.
- Gesture transaction adapter converts viewport deltas to logical pixels.
- One completed multi-element gesture produces exactly one `transform-elements` command.
- Cancel produces no command; keyboard nudge uses the same command path.
- Canvas guide overlay and equal-spacing labels are outside artifact semantics.
- Layers tree model, search preserving ancestors, roving keyboard focus and patch-command generation.
- Accessible Vietnamese Layers panel with Arrow/Home/End navigation, Enter selection, Space additive selection, F2 inline rename, non-empty-name validation, selection, lock/hide status and clear empty search state.
- Controlled Vietnamese Layout panel for mode, direction, wrap, columns, gap, independent padding, alignment, distribution, fixed/hug/fill, constraints and detach.
- Layout fields use progressive disclosure: freeform hides unrelated controls, constraint shows anchoring only, and stack/grid show only their applicable auto-layout controls.
- Actionable fit diagnostics remain visible alongside controls.
- Local CSS modules establish the Deckory editorial control-room visual baseline, visible focus, usable targets and narrow-panel behavior without touching shared workspace CSS.

## Changed-file inventory

### Scene layout core

```text
packages/scene/src/alignment.test.ts
packages/scene/src/alignment.ts
packages/scene/src/guides.test.ts
packages/scene/src/guides.ts
packages/scene/src/hierarchy.test.ts
packages/scene/src/hierarchy.ts
packages/scene/src/layout/auto-layout.test.ts
packages/scene/src/layout/auto-layout.ts
packages/scene/src/layout/constraints.test.ts
packages/scene/src/layout/constraints.ts
packages/scene/src/layout/conversion.test.ts
packages/scene/src/layout/conversion.ts
packages/scene/src/layout/sizing.test.ts
packages/scene/src/layout/sizing.ts
packages/scene/src/layout/types.ts
```

### Studio canvas

```text
apps/present/components/studio-v2/canvas/canvas-guides.module.css
apps/present/components/studio-v2/canvas/canvas-guides.test.tsx
apps/present/components/studio-v2/canvas/canvas-guides.tsx
apps/present/components/studio-v2/canvas/gesture-transaction.test.ts
apps/present/components/studio-v2/canvas/gesture-transaction.ts
apps/present/components/studio-v2/canvas/selection-controller.test.ts
apps/present/components/studio-v2/canvas/selection-controller.ts
```

### Studio Layers

```text
apps/present/components/studio-v2/layers/layers-model.test.ts
apps/present/components/studio-v2/layers/layers-model.ts
apps/present/components/studio-v2/layers/layers-panel.module.css
apps/present/components/studio-v2/layers/layers-panel.test.tsx
apps/present/components/studio-v2/layers/layers-panel.tsx
```

### Studio Layout

```text
apps/present/components/studio-v2/layout/layout-panel.module.css
apps/present/components/studio-v2/layout/layout-panel.test.tsx
apps/present/components/studio-v2/layout/layout-panel.tsx
```

### Coordination documents

```text
docs/superpowers/parallel/manifests/studio-layout.md
docs/superpowers/parallel/requests/studio-layout-aspect-ratio-contract.md
docs/superpowers/parallel/requests/studio-layout-atomic-scene-command.md
docs/superpowers/parallel/requests/studio-layout-grid-contract.md
docs/superpowers/parallel/requests/studio-layout-public-wiring.md
docs/superpowers/parallel/requests/studio-layout-renderer-hierarchy.md
```

No schema, shared barrel, root manifest, lockfile, route, shared renderer root, shared Studio root or another track's production path was modified.

## RED/GREEN evidence

### Constraints, sizing, stack/grid and conversion

RED command:

```bash
pnpm --filter @deckory/scene test -- src/layout/constraints.test.ts src/layout/sizing.test.ts src/layout/auto-layout.test.ts src/layout/conversion.test.ts
```

Observed RED:

- 4 suites failed.
- Each failed because its production module did not exist: `./constraints`, `./sizing`, `./auto-layout`, `./conversion`.
- Existing Scene Foundation suites remained green.

GREEN command:

```bash
pnpm --filter @deckory/scene test -- src/layout/constraints.test.ts src/layout/sizing.test.ts src/layout/auto-layout.test.ts src/layout/conversion.test.ts
pnpm --filter @deckory/scene typecheck
```

Observed GREEN:

- 7 files passed.
- 27 tests passed, 0 failed.
- TypeScript exited 0.

During GREEN, two focused failures were investigated rather than patched by guesswork:

1. Non-wrapping stack cross alignment incorrectly used the tallest-child line height instead of the complete content area. The line cross size was corrected for non-wrapping stacks.
2. A minimum-size diagnostic exposed recovery only in a separate field while the test required the visible message to be actionable. The user-facing message now names the recovery directly and retains the structured recommendation.

### Alignment, guides and hierarchy

RED command:

```bash
pnpm --filter @deckory/scene test -- src/alignment.test.ts src/guides.test.ts src/hierarchy.test.ts
```

Observed RED:

- 3 suites failed.
- Each failed because its production module did not exist.

GREEN command:

```bash
pnpm --filter @deckory/scene test -- src/alignment.test.ts src/guides.test.ts src/hierarchy.test.ts
pnpm --filter @deckory/scene typecheck
```

Observed GREEN:

- 10 files passed.
- 40 tests passed, 0 failed.
- TypeScript exited 0.

One hierarchy test initially returned the generic “not a container” diagnostic before detecting that the requested target was a descendant. Root cause was guard order. Cycle detection now runs before container-capability validation so the actionable cycle diagnostic is preserved.

### Isolated Studio modules

RED command:

```bash
pnpm --filter @deckory/present test -- components/studio-v2/canvas components/studio-v2/layers components/studio-v2/layout
```

Observed RED:

- 6 new suites failed.
- Each failed because its production module did not exist.
- Existing Present suites remained green.

GREEN command:

```bash
pnpm --filter @deckory/present test -- components/studio-v2/canvas components/studio-v2/layers components/studio-v2/layout
pnpm --filter @deckory/present typecheck
```

Observed GREEN:

- The package script executed 36 files.
- 151 tests passed, 0 failed.
- Present typecheck exited 0.

After CSS module integration, the same 151 tests and Present typecheck passed again.

### Review hardening pass

A final code review identified layout and accessibility edge cases that the initial suites did not cover.

Scene RED command:

```bash
pnpm --filter @deckory/scene test -- src/alignment.test.ts src/layout/auto-layout.test.ts src/layout/sizing.test.ts src/hierarchy.test.ts
```

Observed RED before the fixes:

- 6 tests failed for the intended missing behavior.
- Distribution used the last item by position instead of the actual furthest outer edge.
- Stack fill allocation replaced the precise does-not-fit diagnostic with a generic fallback.
- Grid accepted duplicate child IDs and overwrote one frame entry.
- Aspect-ratio resolution did not re-check dependent-axis minimums.
- Reparent accepted a parent and descendant in one transaction.
- Ungroup accepted a transformed container even though local-frame addition cannot preserve rotated/scaled/skewed geometry.

Scene GREEN:

- 10 Scene test files passed.
- 47 tests passed, 0 failed.
- Scene typecheck exited 0.

Studio RED command:

```bash
pnpm --filter @deckory/present test -- components/studio-v2/layers/layers-model.test.ts components/studio-v2/layers/layers-panel.test.tsx components/studio-v2/layout/layout-panel.test.tsx
```

Observed RED before the fixes:

- 3 tests failed for missing keyboard action resolution, missing fallback tab stop and missing progressive disclosure.

Studio GREEN:

- The Present package script executed 36 test files.
- 155 tests passed, 0 failed.
- Present typecheck exited 0.

Two additional defensive cases—empty layer names and reparenting across transformed coordinate spaces—were added before their production guards but after the first grouped RED capture. They are included in the final GREEN suite; no separate isolated RED transcript is claimed for those two assertions.

### Mechanical UI scan

Executed:

```bash
node C:\Users\KanzuWakazaki\.agents\skills\impeccable\scripts\detect.mjs --json --scope layout \
  apps\present\components\studio-v2\canvas \
  apps\present\components\studio-v2\layers \
  apps\present\components\studio-v2\layout
```

Result: `[]`.

## Fresh track-wide verification

Executed after all production commits:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm audit:decks -- --strict
pnpm assets:check
pnpm build
```

Results:

- 291 tests passed, 0 failed across package, app and script suites.
  - schema: 36
  - audit: 9
  - core: 2
  - renderer: 3
  - scene: 47
  - templates: 29
  - MyInterview deck: 6
  - Present: 155
  - export/PPTX script contracts: 4
- Workspace typecheck: passed.
- Workspace lint: passed.
- Strict deck audit: 4 deck passed, 0 error, 0 warning.
- Asset check: 13 assets checked, 0 error, 0 warning.
- Next.js production build: passed.
- Compiled routes: `/`, `/export`, `/present`, `/preview`, `/studio`.

The final report also records the post-manifest verification and final clean status.

## Contract and dependency requests

1. `docs/superpowers/parallel/requests/studio-layout-aspect-ratio-contract.md`
   - Persist positive width/height ratios and the authoritative axis so coupled sizing survives Studio save/reload.
2. `docs/superpowers/parallel/requests/studio-layout-atomic-scene-command.md`
   - Add official `replace-scene-elements` SceneCommand support with one inverse transaction and complete document validation.
3. `docs/superpowers/parallel/requests/studio-layout-grid-contract.md`
   - Extend V2 grid content to persist independent padding and alignment without breaking existing numeric padding.
4. `docs/superpowers/parallel/requests/studio-layout-public-wiring.md`
   - Add shared Scene exports.
   - Add `@deckory/scene` to Present.
   - Install `react-moveable@0.56.0` and `react-selecto@1.26.3` once in the integration worktree.
   - Keep editor libraries out of Preview, Presenter, thumbnail and export bundles.
5. `docs/superpowers/parallel/requests/studio-layout-renderer-hierarchy.md`
   - Correct the accepted V2 renderer so parent-local frames and container transforms render as a hierarchy instead of as flat slide-local siblings.
   - This request is required before browser claims for grouping, nested selection or layout containers.

No dependency or lockfile was changed in this track.

## Exact integration instructions

1. Start from the coordinator's accepted integration worktree based on `4425113417a1a064695525baef1af822b4be430b`.
2. Cherry-pick the Track A commits in the exact order listed above, ending with the manifest/requests commit.
3. Inspect the combined diff and reject integration if Track A touches anything outside its owned files and coordination documents.
4. Apply `studio-layout-aspect-ratio-contract.md`; map the persisted ratio into the authoritative sizing policy and add schema/conversion/reload tests.
5. Apply `studio-layout-atomic-scene-command.md` as a coordinator-owned command-contract commit. Run the official command regression test, Scene package tests and Scene typecheck.
6. Review and apply `studio-layout-grid-contract.md`. Update `convertGroupLayoutMode` to store tuple padding and `align`; add the requested round-trip test.
7. Add the requested exports to `packages/scene/src/index.ts` in the coordinator's shared-barrel batch.
8. Apply `studio-layout-renderer-hierarchy.md` before wiring group/reparent UI or claiming browser geometry; verify nested parent-local rendering and transformed containers in `@deckory/renderer`.
9. Add `@deckory/scene`, `react-moveable@0.56.0` and `react-selecto@1.26.3` to `apps/present/package.json`; resolve `pnpm-lock.yaml` once after all parallel-track dependency requests are reviewed.
10. Wire the Studio root without moving persistent logic into third-party adapters:
   - use `selection-controller.ts` for pointer and marquee results;
   - confine Selecto events to a thin overlay that translates rectangles into logical canvas coordinates;
   - use `gesture-transaction.ts` to begin from immutable frames, preview transiently and dispatch only its final one-command result;
   - confine Moveable events to transient CSS/frame previews; never store its event object in the deck;
   - dispatch `createAlignmentCommand` for align/distribute actions;
   - dispatch the accepted atomic command for group, ungroup, reparent and layout conversion;
   - render `CanvasGuides` outside the artifact DOM;
   - mount `LayersPanel` and `LayoutPanel` as controlled modules;
   - preserve selection when Inspector/Layout values change;
   - keep zoom and panel state outside document history.
11. Verify one gesture maps to one `SceneCommand` and one undo step for pointer drag, resize, rotate, keyboard nudge, align, distribute, group, reparent and layout conversion.
12. Confirm Presenter, Preview, thumbnails and export do not import `react-moveable` or `react-selecto` by inspecting the production bundle/module graph.
13. Run the combined unit, typecheck, lint and build gates, then perform the browser QA below on the integrated revision.

## Browser QA still required after root integration

No browser evidence is claimed from this track because the Studio root, dependencies and E2E path are intentionally frozen for parallel safety. The coordinator must run and inspect at least:

- select from canvas and Layers;
- shift/additive selection and removal;
- marquee contain/intersect and deep select;
- drag, resize and rotate with one undo transaction each;
- Escape/pointer cancellation with no history entry;
- Arrow nudge by 1 logical pixel and Shift+Arrow by 10;
- align and distribute, including disabled/actionable states for insufficient selection;
- group, ungroup and reparent while preserving absolute positions;
- convert freeform/constraint/stack/grid, edit gap/padding/alignment and undo the complete conversion;
- resize constrained parents and verify left/right/center/stretch/scale behavior;
- detach a child from auto layout while preserving its visual frame;
- Layers search, rename, lock, hide, keyboard navigation and reveal-primary behavior;
- long Vietnamese names and labels;
- narrow Inspector/Layers drawers;
- 320, 375, 768, 1024 and 1440 CSS-pixel viewports;
- 200% browser zoom;
- reduced motion;
- overlay alignment at non-100% canvas zoom;
- no clipping, silent shrink, stale selection, duplicate history entry, console error or page error;
- Presenter/Preview bundle exclusion for editor-only dependencies.

Expected evidence location after integration:

```text
output/playwright/screenshots/<run-id>/studio-v2-*
```

## Residual risks

- Structural actions return the proposed atomic command but cannot enter official history until the frozen `SceneCommand` union is extended.
- The accepted Scene Foundation renderer currently flattens nested V2 elements and ignores `parentId` when positioning. Browser geometry for group/reparent/layout containers is blocked until `studio-layout-renderer-hierarchy.md` is applied.
- Aspect-ratio sizing cannot be persisted until its schema request is accepted; the pure engine is implemented and bounded, but Studio round-trip is intentionally not claimed.
- Independent grid padding/alignment cannot be fully serialized until the schema request is accepted; the track rejects unsupported persistence rather than losing data.
- Pointer-library adapters and visual handles are not included because dependencies and the lockfile are coordinator-owned.
- CSS modules have static/unit/type verification but no integrated screenshot evidence yet.
- Track tests prove isolated behavior, not the final combined Studio experience.
