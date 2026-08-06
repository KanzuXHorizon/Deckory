# Deckory V2 Design System and Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add professional visual-world tokens, layered backgrounds, advanced typography, media styling and a purposeful motion timeline so V2 decks can achieve high compositional variety without visual inconsistency or inaccessible effects.

**Architecture:** Design choices remain typed document data. `@deckory/themes` owns visual-world tokens and compatibility. `@deckory/renderer` resolves tokens to CSS/SVG. Studio offers focused composers for background, typography, media and motion. Motion is stored as tracks and compiled to the existing Motion runtime with a deterministic final state.

**Tech Stack:** TypeScript 5.9, Zod 4, React 19, Motion 13, CSS custom properties, SVG filters/masks, Vitest, Playwright.

## Global Constraints

- Plans 01–04 must pass before this plan starts.
- One deck uses one coherent visual world; slide variance comes from composition, scale, imagery, density and motion.
- No remote fonts, images, shaders or assets.
- Reduced motion must preserve all content and state.
- Thumbnail and export modes render the final motion state.
- Auto-fit may reduce type only to declared minimum sizes; below that it emits a split/rewrite diagnostic.
- Background decoration cannot reduce contrast or consume safe content areas.
- Do not commit, push or publish without separate authorization.

---

### Task 1: Create the V2 theme and visual-world package

**Files:**
- Create: `packages/themes/package.json`
- Create: `packages/themes/tsconfig.json`
- Create: `packages/themes/src/index.ts`
- Create: `packages/themes/src/types.ts`
- Create: `packages/themes/src/themes.ts`
- Create: `packages/themes/src/themes.test.ts`
- Create: `packages/themes/src/resolve.ts`
- Create: `packages/themes/src/resolve.test.ts`
- Modify: `packages/schema/src/v2.ts`

**Interfaces:**
- Produces: `DeckThemeV2`, `VisualWorld`, `visualWorlds`, `resolveThemeTokens`, `resolveElementTokens`.
- Initial visual worlds: Deckory Editorial Control Room, Swiss Precision, Scientific Illustration, Technical Blueprint, Data Journalism, Minimal Luxury, Cinematic Dark, Academic Defense, Product Showcase, Geometric Modernism, Organic Systems and Risograph Editorial.

- [ ] **Step 1: Add the package manifest and strict theme types**

Theme tokens cover:

- colors and semantic roles;
- typography roles;
- spacing scale;
- radii;
- border and depth;
- chart palette and highlight semantics;
- diagram node/edge styling;
- imagery treatment;
- background defaults;
- motion defaults;
- density and safe area.

- [ ] **Step 2: Write failing theme integrity tests**

```ts
it("ships every required visual world with complete token groups", () => {
  for (const id of requiredVisualWorldIds) {
    expect(visualWorlds.get(id)).toMatchObject({
      typography: expect.any(Object),
      colors: expect.any(Object),
      charts: expect.any(Object),
      diagrams: expect.any(Object),
      motion: expect.any(Object),
      safeArea: expect.any(Object)
    });
  }
});

it("rejects a chart palette without an accessible highlight contrast", () => {
  expect(() => validateVisualWorld(invalidLowContrastWorld)).toThrow(/contrast/i);
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm --filter @deckory/themes test`

Expected: FAIL because the package does not exist.

- [ ] **Step 4: Implement token resolution**

Resolve deck → slide → element overrides without mutating source tokens. Overrides may reference semantic tokens or bounded literal values. Unknown tokens produce diagnostics rather than silent fallback.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @deckory/themes test
pnpm --filter @deckory/themes typecheck
pnpm --filter @deckory/schema test
git add packages/themes packages/schema/src/v2.ts pnpm-lock.yaml
git commit -m "feat(themes): add V2 visual worlds and tokens"
```

---

### Task 2: Build the layered Background Composer

**Files:**
- Create: `packages/renderer/src/background-renderer.tsx`
- Create: `packages/renderer/src/background-renderer.test.tsx`
- Create: `apps/present/components/studio-v2/background-composer.tsx`
- Create: `apps/present/components/studio-v2/background-composer.test.tsx`
- Create: `apps/present/lib/background-presets.ts`
- Create: `apps/present/lib/background-presets.test.ts`
- Modify: `packages/schema/src/v2.ts`
- Modify: `apps/present/components/studio-v2/inspector/field-registry.ts`

**Interfaces:**
- Produces rendering and editing for solid, linear/radial/conic/mesh gradient, image, SVG, pattern, grid, noise, glow, vignette, overlay, blur and edge-mask layers.

- [ ] **Step 1: Write failing background renderer tests**

```tsx
it("renders layers in stable document order", () => {
  const html = renderToStaticMarkup(<BackgroundRenderer stack={backgroundStack} assets={assets} />);
  expect(indexOfLayer(html, "paper")).toBeLessThan(indexOfLayer(html, "grain"));
});

it("does not render a missing asset as an empty background", () => {
  const html = renderToStaticMarkup(<BackgroundRenderer stack={missingImageStack} assets={[]} />);
  expect(html).toContain('data-background-error="asset-missing"');
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/renderer test -- src/background-renderer.test.tsx`

Expected: FAIL because the renderer does not exist.

- [ ] **Step 3: Implement deterministic background rendering**

Use CSS for simple layers and SVG for mesh, mask and vector pattern layers. Noise is a local deterministic texture seeded by layer ID; it must not change between renders.

- [ ] **Step 4: Write failing composer tests**

```tsx
it("reorders layers and commits one slide patch", () => {
  const result = reorderBackgroundLayers(stack, ["base", "glow", "grain"]);
  expect(result.layers.map((layer) => layer.id)).toEqual(["base", "glow", "grain"]);
});
```

- [ ] **Step 5: Build the Composer**

Required controls:

- add/remove/duplicate layer;
- reorder;
- visibility;
- opacity;
- blend mode;
- type-specific parameters;
- local asset selection;
- preset application;
- contrast warning overlay;
- reset to visual-world default.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @deckory/renderer test -- src/background-renderer.test.tsx
pnpm --filter @deckory/present test -- components/studio-v2/background-composer.test.tsx lib/background-presets.test.ts
pnpm --filter @deckory/present typecheck
git add packages/renderer/src/background-renderer.tsx packages/renderer/src/background-renderer.test.tsx apps/present/components/studio-v2/background-composer.tsx apps/present/components/studio-v2/background-composer.test.tsx apps/present/lib/background-presets.ts apps/present/lib/background-presets.test.ts packages/schema/src/v2.ts apps/present/components/studio-v2/inspector/field-registry.ts
git commit -m "feat(studio): compose layered slide backgrounds"
```

---

### Task 3: Add rich text, typography measurement and safe auto-fit

**Files:**
- Create: `packages/scene/src/rich-text.ts`
- Create: `packages/scene/src/rich-text.test.ts`
- Create: `packages/scene/src/text-fit.ts`
- Create: `packages/scene/src/text-fit.test.ts`
- Create: `packages/renderer/src/rich-text-renderer.tsx`
- Create: `packages/renderer/src/rich-text-renderer.test.tsx`
- Create: `apps/present/components/studio-v2/rich-text-toolbar.tsx`
- Create: `apps/present/components/studio-v2/rich-text-toolbar.test.tsx`
- Modify: `packages/schema/src/v2.ts`
- Modify: `packages/renderer/src/element-renderer.tsx`

**Interfaces:**
- Produces: `RichTextDocument`, `normalizeRichText`, `measureRichText`, `fitTextToFrame`, `RichTextRenderer`.

- [ ] **Step 1: Write failing rich-text normalization tests**

```ts
it("merges adjacent runs with identical marks", () => {
  expect(normalizeRichText(documentWithDuplicateRuns).paragraphs[0]!.runs).toHaveLength(1);
});

it("preserves Vietnamese diacritics and punctuation", () => {
  expect(normalizeRichText(vietnameseDocument).plainText).toBe("Phản hồi có bằng chứng.");
});
```

- [ ] **Step 2: Write failing auto-fit tests**

```ts
it("reduces font size only to the declared minimum", () => {
  const result = fitTextToFrame(longHeading, frame, {
    preferredSize: 64,
    minimumSize: 40,
    maximumLines: 2
  });
  expect(result.fontSize).toBeGreaterThanOrEqual(40);
});

it("returns a split diagnostic when text cannot fit", () => {
  const result = fitTextToFrame(overlongHeading, tinyFrame, fitPolicy);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.code).toBe("text-does-not-fit");
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm --filter @deckory/scene test -- src/rich-text.test.ts src/text-fit.test.ts`

Expected: FAIL because modules do not exist.

- [ ] **Step 4: Implement semantic rich text**

Support paragraph styles, inline marks, links, lists, number lists, alignment, vertical alignment, line height, tracking, paragraph spacing and reading order. Do not store arbitrary HTML.

- [ ] **Step 5: Implement measurement and fit policy**

Use local font metrics. Cache by font token, size, width and text hash. Diagnostics include the overflowing paragraph, measured lines and recommended frame/text change.

- [ ] **Step 6: Build renderer and toolbar**

Toolbar supports the declared rich-text features and communicates mixed selection state. It commits one normalized document patch per action.

- [ ] **Step 7: Verify and commit**

```bash
pnpm --filter @deckory/scene test -- src/rich-text.test.ts src/text-fit.test.ts
pnpm --filter @deckory/renderer test -- src/rich-text-renderer.test.tsx
pnpm --filter @deckory/present test -- components/studio-v2/rich-text-toolbar.test.tsx
pnpm typecheck
git add packages/scene/src/rich-text.ts packages/scene/src/rich-text.test.ts packages/scene/src/text-fit.ts packages/scene/src/text-fit.test.ts packages/renderer/src/rich-text-renderer.tsx packages/renderer/src/rich-text-renderer.test.tsx packages/renderer/src/element-renderer.tsx apps/present/components/studio-v2/rich-text-toolbar.tsx apps/present/components/studio-v2/rich-text-toolbar.test.tsx packages/schema/src/v2.ts
git commit -m "feat(text): add rich typography and safe auto-fit"
```

---

### Task 4: Add professional shape, image and media styling

**Files:**
- Create: `packages/renderer/src/shape-renderer.tsx`
- Create: `packages/renderer/src/shape-renderer.test.tsx`
- Create: `packages/renderer/src/image-renderer.tsx`
- Create: `packages/renderer/src/image-renderer.test.tsx`
- Create: `apps/present/components/studio-v2/style/shape-style-panel.tsx`
- Create: `apps/present/components/studio-v2/style/image-style-panel.tsx`
- Create: `apps/present/components/studio-v2/style/style-panels.test.tsx`
- Modify: `packages/schema/src/v2.ts`
- Modify: `packages/renderer/src/element-renderer.tsx`

**Interfaces:**
- Adds fills, gradients, strokes, dash, independent radii, shadow, controlled glow, blur, clip path, mask, opacity, blend mode, image fit/crop/focal point, duotone and overlay.

- [ ] **Step 1: Write failing renderer tests**

```tsx
it("renders an image focal point without changing the source asset", () => {
  const html = renderToStaticMarkup(<ImageRenderer element={focalImage} asset={asset} />);
  expect(html).toContain("object-position:72% 28%");
});

it("renders independent corner radii", () => {
  const html = renderToStaticMarkup(<ShapeRenderer element={roundedShape} />);
  expect(html).toContain("12px 28px 4px 18px");
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/renderer test -- src/shape-renderer.test.tsx src/image-renderer.test.tsx`

Expected: FAIL because dedicated renderers do not exist.

- [ ] **Step 3: Implement bounded style schemas and renderers**

Literal blur, glow and shadow values have maximum budgets. Unsupported blend modes fail schema validation. All image effects render offline from the local source.

- [ ] **Step 4: Build focused style panels**

Use collapsible sections and previews. Do not expose raw CSS strings.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @deckory/renderer test -- src/shape-renderer.test.tsx src/image-renderer.test.tsx
pnpm --filter @deckory/present test -- components/studio-v2/style/style-panels.test.tsx
pnpm typecheck
git add packages/renderer/src/shape-renderer.tsx packages/renderer/src/shape-renderer.test.tsx packages/renderer/src/image-renderer.tsx packages/renderer/src/image-renderer.test.tsx packages/renderer/src/element-renderer.tsx apps/present/components/studio-v2/style packages/schema/src/v2.ts
git commit -m "feat(style): add professional shape and media controls"
```

---

### Task 5: Define the V2 motion track model and compiler

**Files:**
- Create: `packages/scene/src/motion.ts`
- Create: `packages/scene/src/motion.test.ts`
- Create: `packages/renderer/src/motion-compiler.ts`
- Create: `packages/renderer/src/motion-compiler.test.ts`
- Modify: `packages/schema/src/v2.ts`
- Modify: `packages/renderer/src/scene-renderer.tsx`
- Modify: `packages/renderer/src/element-renderer.tsx`

**Interfaces:**
- Produces: `MotionTrack`, `MotionCue`, `compileMotionTimeline`, `resolveMotionState`.

- [ ] **Step 1: Write failing motion schema tests**

```ts
it("rejects an exit cue before its entrance cue", () => {
  expect(() => MotionTrackSchema.parse(invalidExitFirstTrack)).toThrow(/entrance/i);
});

it("requires a final state for every animated property", () => {
  expect(() => MotionTrackSchema.parse(trackWithoutFinalOpacity)).toThrow(/final/i);
});
```

- [ ] **Step 2: Write failing compiler tests**

```ts
it("resolves the same final state for reduced motion and export", () => {
  expect(resolveMotionState(track, { mode: "reduced", time: Infinity }))
    .toEqual(resolveMotionState(track, { mode: "export", time: Infinity }));
});

it("orders after-previous cues deterministically", () => {
  expect(compileMotionTimeline(slide).cues.map((cue) => cue.id))
    .toEqual(["title-in", "chart-draw", "insight-in"]);
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm --filter @deckory/scene test -- src/motion.test.ts && pnpm --filter @deckory/renderer test -- src/motion-compiler.test.ts`

Expected: FAIL because the motion model/compiler does not exist.

- [ ] **Step 4: Implement motion tracks**

Supported cue types:

- entrance;
- emphasis;
- exit;
- path;
- stagger;
- morph;
- chart-progress;
- connector-progress;
- camera.

Triggers:

- on-enter;
- on-click;
- after-previous;
- with-previous.

- [ ] **Step 5: Compile to Motion runtime**

The compiler maps typed cues to Motion props but renderer consumers cannot supply arbitrary animation objects. Motion-disabled, thumbnail, export and reduced modes render final state.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @deckory/scene test -- src/motion.test.ts
pnpm --filter @deckory/renderer test -- src/motion-compiler.test.ts
pnpm typecheck
git add packages/scene/src/motion.ts packages/scene/src/motion.test.ts packages/renderer/src/motion-compiler.ts packages/renderer/src/motion-compiler.test.ts packages/renderer/src/scene-renderer.tsx packages/renderer/src/element-renderer.tsx packages/schema/src/v2.ts
git commit -m "feat(motion): add typed V2 motion timelines"
```

---

### Task 6: Build the Studio motion timeline and semantic presets

**Files:**
- Create: `apps/present/components/studio-v2/motion/motion-timeline.tsx`
- Create: `apps/present/components/studio-v2/motion/motion-timeline.test.tsx`
- Create: `apps/present/components/studio-v2/motion/motion-inspector.tsx`
- Create: `apps/present/components/studio-v2/motion/motion-inspector.test.tsx`
- Create: `apps/present/lib/motion-presets-v2.ts`
- Create: `apps/present/lib/motion-presets-v2.test.ts`
- Modify: `apps/present/components/studio-v2/studio-v2.tsx`
- Modify: `apps/present/app/workspace.css`

**Interfaces:**
- Produces motion tracks through presets or timeline editing; reuses Presenter reveal controls.

- [ ] **Step 1: Write failing preset tests**

```ts
it("applies one reveal-argument preset with deterministic cue order", () => {
  const result = applyMotionPreset(slide, "reveal-argument", ["claim", "evidence", "decision"]);
  expect(result.elements.flatMap((element) => element.motion ?? []).map((cue) => cue.trigger))
    .toEqual(["on-enter", "after-previous", "after-previous"]);
});
```

- [ ] **Step 2: Write failing timeline interaction tests**

```tsx
it("moves a cue and commits one slide patch", () => {
  const result = dragTimelineCue(timeline, "chart-draw", 1.2);
  expect(result.commands).toHaveLength(1);
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm --filter @deckory/present test -- components/studio-v2/motion lib/motion-presets-v2.test.ts`

Expected: FAIL because the timeline does not exist.

- [ ] **Step 4: Implement semantic presets**

Initial presets:

- reveal argument;
- compare states;
- trace process;
- spotlight evidence;
- overview to detail;
- problem to solution morph;
- chart and conclusion;
- architecture walkthrough.

- [ ] **Step 5: Implement timeline editing**

Timeline supports:

- enable/disable advanced motion;
- select cue;
- change trigger, duration, delay and easing;
- reorder after-previous sequence;
- scrub preview;
- replay;
- remove motion;
- inspect reduced-motion fallback.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @deckory/present test -- components/studio-v2/motion lib/motion-presets-v2.test.ts
pnpm --filter @deckory/present typecheck
git add apps/present/components/studio-v2/motion apps/present/lib/motion-presets-v2.ts apps/present/lib/motion-presets-v2.test.ts apps/present/components/studio-v2/studio-v2.tsx apps/present/app/workspace.css
git commit -m "feat(studio): author and scrub semantic motion"
```

---

### Task 7: Create visual-world and motion proof decks

**Files:**
- Create: `decks/design-world-gallery/package.json`
- Create: `decks/design-world-gallery/tsconfig.json`
- Create: `decks/design-world-gallery/deck.tsx`
- Create: `decks/design-world-gallery/deck.test.ts`
- Modify: `apps/present/lib/deck-catalog.ts`
- Create: `tests/e2e/design-world-gallery.spec.ts`
- Create: `tests/e2e/motion-v2.spec.ts`
- Modify: `packages/audit/src/index.ts`
- Modify: `packages/audit/src/index.test.ts`

**Interfaces:**
- Proves all twelve visual worlds, background layers, typography, media treatment and motion final-state equivalence.

- [ ] **Step 1: Add inventory tests**

Every visual world must be used by at least one complete slide and must have a full-size and thumbnail assertion.

- [ ] **Step 2: Author a disciplined gallery**

Use identical source content across selected comparison slides to make visual-world differences inspectable. Do not mix worlds inside one deck section without an explicit comparison purpose.

- [ ] **Step 3: Add audit rules**

Audit detects:

- unresolved theme token;
- font below minimum;
- text does not fit;
- background contrast risk;
- excessive blur/glow;
- motion without final state;
- continuous decorative loop;
- more than one primary motion idea without override reason.

- [ ] **Step 4: Run browser QA**

```bash
pnpm test:e2e -- tests/e2e/design-world-gallery.spec.ts tests/e2e/motion-v2.spec.ts
```

Capture full-size, thumbnail, reduced-motion and final export-state screenshots. Inspect Vietnamese diacritics, heading wraps, background safe areas, image crops and timeline replay.

- [ ] **Step 5: Run plan-level verification**

```bash
pnpm --filter @deckory/themes test
pnpm --filter @deckory/scene test
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/audit test
pnpm --filter @deckory/present test
pnpm typecheck
pnpm lint
pnpm audit:decks -- --strict
pnpm assets:check
pnpm build
pnpm test:e2e -- tests/e2e/design-world-gallery.spec.ts tests/e2e/motion-v2.spec.ts
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit the verified design system**

```bash
git add packages/themes packages/scene packages/renderer packages/audit apps/present decks/design-world-gallery tests/e2e/design-world-gallery.spec.ts tests/e2e/motion-v2.spec.ts pnpm-lock.yaml
git commit -m "feat(design): prove V2 visual worlds and motion"
```

## Plan Self-Review

- Spec coverage: visual worlds, backgrounds, typography, media styles, motion model, timeline, reduced-motion and gallery evidence are covered.
- Placeholder scan: all initial worlds, layer types, style capabilities and motion presets are enumerated.
- Type consistency: themes resolve tokens; documents store typed style and motion data; renderer compiles final behavior.
- Exit condition: Plan 06 starts only after full-size, thumbnail, reduced-motion and replay modes preserve the same content without clipping or visual-world drift.
