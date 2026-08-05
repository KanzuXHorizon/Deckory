# Semantic Visuals & Team Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed, editable, animated and interactive team-showcase and semantic visualizer components to Deckory.

**Architecture:** Extend the v1 discriminated-union schema, render the new components through focused client components, and preserve the shared SlideFrame path across Studio, Preview, Present and thumbnails. Native SVG plus Motion handles visual motion; deck documents contain only validated semantic data and local image references.

**Tech Stack:** TypeScript 5.9, React 19, Next.js 16, Zod, Motion for React, Vitest, CSS.

## Global Constraints

- `name` is the only required team-member field.
- Image sources must begin with `/` or `data:image/`; remote URLs are invalid.
- Every image requires non-empty alt text.
- Motion must preserve meaning with reduced motion and `motionDisabled`.
- Interactive roots use `data-deck-interactive` and keyboard-accessible controls.
- Thumbnail and Overview rendering is static and non-interactive.
- Existing unrelated dirty files must be preserved; edits are additive and surgical.
- No arbitrary JSX, remote runtime assets, placeholder content or unvalidated coordinates enter a deck document.

---

### Task 1: Typed schema and validation

**Files:**
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/document.test.ts`

**Interfaces:**
- Produces: `team-showcase` and `visualizer` members of `SlideComponent`.
- Produces: `TeamShowcaseProps` and `VisualizerProps` through inferred discriminated-union types.

- [ ] Add failing tests for optional member fields, local image sources, invalid remote images, visualizer parent references and compatible layouts.
- [ ] Run `pnpm --filter @deckory/schema test` and confirm the new tests fail because the component types are unknown.
- [ ] Add strict schemas for team members, image metadata, visualizer items, variants, interactions and animations.
- [ ] Add semantic validation that rejects unknown `parentId` values and self-parenting.
- [ ] Register both component types in `SUPPORTED_COMPONENT_TYPES` and `LAYOUT_COMPONENTS`.
- [ ] Re-run the schema tests and confirm they pass.

### Task 2: Catalog defaults and Studio compatibility

**Files:**
- Modify: `apps/present/lib/component-catalog.ts`
- Modify: `apps/present/lib/component-catalog.test.ts`

**Interfaces:**
- Consumes: new `SlideComponent` variants from Task 1.
- Produces: valid defaults from `createComponent("team-showcase", id)` and `createComponent("visualizer", id)`.

- [ ] Add failing tests that create both defaults and validate them inside compatible layouts.
- [ ] Register compatibility matrices matching the design spec.
- [ ] Add complete professional default content with optional image fields omitted.
- [ ] Run the focused catalog test and confirm it passes.

### Task 3: Interactive runtime boundary

**Files:**
- Create: `apps/present/components/semantic-visuals.tsx`
- Modify: `apps/present/components/presenter-runtime.ts`
- Modify: `apps/present/components/presenter-runtime.test.ts`
- Modify: `apps/present/components/presenter.tsx`

**Interfaces:**
- Produces: `TeamShowcase`, `SemanticVisualizer` client components.
- Produces: `isDeckInteractiveTarget(target: EventTarget | null): boolean`.

- [ ] Add tests for identifying descendants of `[data-deck-interactive]` and ignoring unrelated targets.
- [ ] Implement the target guard without relying on browser-only globals in tests.
- [ ] Update Presenter keyboard handling to return when a handled event originates inside an interactive visual.
- [ ] Implement team selection, visualizer inspect/step state, Escape reset and static mode.
- [ ] Ensure all interactive controls have explicit labels and focusable buttons.

### Task 4: SlideFrame rendering

**Files:**
- Modify: `apps/present/components/slide-frame.tsx`
- Modify: `apps/present/components/slide-frame.test.tsx`

**Interfaces:**
- Consumes: `TeamShowcase`, `SemanticVisualizer` from Task 3.
- Passes: `reducedMotion` and `motionDisabled` to both renderers.

- [ ] Add renderer tests for image alt text, monogram fallback, accessible visual summary and motion-disabled static state.
- [ ] Pass motion context through `Component`.
- [ ] Add switch cases for both new component types.
- [ ] Run focused SlideFrame tests.

### Task 5: Professional visual system

**Files:**
- Modify: `apps/present/app/slide-components.css`
- Modify: `apps/present/app/globals.css` only if shared tokens are required.

**Interfaces:**
- Styles: `.team-showcase*`, `.semantic-visualizer*`, `.visual-node*`, `.visual-detail*`.

- [ ] Add responsive 16:9-safe layouts for editorial, cards, constellation and spotlight team variants.
- [ ] Add SVG visual systems for growth-tree, timeline-path, orbit and network.
- [ ] Add selected, hover, focus, static and reduced-motion states.
- [ ] Verify missing optional fields collapse cleanly with no empty chrome.
- [ ] Verify 2, 4 and 6 member/item counts remain balanced.

### Task 6: Studio Inspector authoring

**Files:**
- Modify: `apps/present/components/component-inspector.tsx`
- Modify: `apps/present/components/component-inspector.test.tsx`

**Interfaces:**
- Edits existing preset member/item slots and all optional fields.
- Uses `SelectField`, `TextField`, `TextAreaField`, `BooleanChoice` and focused update helpers.

- [ ] Add tests proving both component inspectors render their professional field labels.
- [ ] Add variant, project/center label, member identity, image and visualizer behavior fields.
- [ ] Convert blank optional values to `undefined`.
- [ ] Preserve strict inferred props when updating arrays.
- [ ] Run focused Inspector tests.

### Task 7: Reference deck coverage

**Files:**
- Modify: `decks/deckory-story/deck.ts`

**Interfaces:**
- Adds one team slide and one semantic growth/interaction slide with concise speaker notes.

- [ ] Add a professional team-showcase slide using optional-field variation and monogram fallbacks.
- [ ] Add a growth-tree or network visualizer slide whose heading states the conclusion.
- [ ] Label all illustrative content clearly.
- [ ] Validate the complete deck.

### Task 8: Verification and visual pre-flight

**Files:**
- No planned source additions.

- [ ] Run focused tests for schema, catalog, runtime, SlideFrame and Inspector.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm build`.
- [ ] Open Studio and Preview in a real browser.
- [ ] Capture one team slide and one visualizer slide at full size and thumbnail scale.
- [ ] Test mouse, keyboard, Escape, sequence reveal, reduced motion and static overview behavior.
- [ ] Inspect the final diff for unrelated changes, placeholders, remote URLs and missing accessible labels.
