# Deckory Cross-Surface UI Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate measurable UI/UX, overflow, responsive, accessibility, and visual-consistency defects across Hub, Studio, Preview, Presenter, thumbnails, and semantic slide components without replacing Deckory’s editorial control-room identity.

**Architecture:** Preserve the existing typed `DeckDocument` renderer and route structure. Audit the live product first, fix defects at the smallest owning component or CSS module, add focused regression coverage for behavior changes, and verify the same document renders consistently across every surface and viewport.

**Tech Stack:** Next.js 16.3, React, TypeScript, Vitest, Motion, Lucide, Playwright CLI, CSS modules/global surface styles.

## Global Constraints

- Work directly on the current `main` checkout; do not reset, delete, overwrite, or stage unrelated parallel-agent changes.
- Do not add dependencies.
- Keep Hub, Studio, Preview, Present, overview, and thumbnails on one typed renderer.
- Preserve the neutral editorial workspace, cobalt/teal/amber state semantics, Lucide icon family, and 16:9 canvas behavior.
- No essential action may disappear on mobile.
- Test 320, 375, 768, 1024, and 1440 CSS pixels, coarse pointer, keyboard, reduced motion, and 200% zoom.
- Do not create commits unless the user explicitly authorizes them; verification checkpoints replace commit steps in this execution.

---

### Task 1: Establish a Clean Live Audit Baseline

**Files:**
- Inspect: `apps/present/components/hub.tsx`
- Inspect: `apps/present/components/studio.tsx`
- Inspect: `apps/present/components/presenter.tsx`
- Inspect: `apps/present/components/slide-frame.tsx`
- Inspect: `apps/present/app/globals.css`
- Inspect: `apps/present/app/workspace.css`
- Inspect: `apps/present/app/presenter.css`
- Inspect: `apps/present/app/semantic-visuals.css`

**Interfaces:**
- Consumes: production routes `/`, `/studio`, `/preview`, `/present`.
- Produces: a prioritized defect inventory with exact surface, viewport, expected behavior, and reproduction.

- [ ] Start the existing production build or dev server on a free localhost port without modifying source files.
- [ ] Inspect Hub, Studio, Preview, and Presenter at 1440, 1024, 768, 375, and 320 pixels.
- [ ] Record horizontal overflow, clipped content, hidden actions, overlapping layers, inaccessible controls, console errors, and mismatched renderer output.
- [ ] Repeat the critical paths with keyboard-only input, coarse pointer, reduced motion, and 200% zoom.
- [ ] Classify each verified issue as P0–P3 and identify the earliest owning component or CSS selector.

### Task 2: Harden Hub Information Hierarchy and Responsive Actions

**Files:**
- Modify: `apps/present/components/hub.tsx`
- Modify: `apps/present/app/workspace.css`
- Modify only if shared tokens are required: `apps/present/app/globals.css`
- Add or modify focused tests near `apps/present/components/hub.tsx` if interaction behavior changes.

**Interfaces:**
- Consumes: deck catalog metadata and `DeckThumbnail`.
- Produces: a scan-friendly deck library with reachable edit, preview, and present actions at every viewport.

- [ ] Write a focused failing static-render or behavior test for each Hub interaction defect found in Task 1.
- [ ] Run the focused test and confirm it fails for the intended reason.
- [ ] Fix only verified hierarchy, wrapping, action reachability, empty/search state, focus, and touch-target defects.
- [ ] Re-run focused tests and inspect Hub at all required viewports.
- [ ] Confirm no horizontal page overflow and no card action becomes icon-only without an accessible label.

### Task 3: Complete Studio Workspace Adaptation

**Files:**
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/components/studio-controls.tsx`
- Modify: `apps/present/app/workspace.css`
- Modify: `apps/present/app/globals.css`
- Test: `apps/present/components/studio-controls.test.tsx`
- Test: `apps/present/components/studio-responsive.test.tsx`

**Interfaces:**
- Consumes: `IconChoiceGroup`, `StudioPopover`, `CommandGrid`, `ComponentInspector`.
- Produces: a canvas-first editor with no hidden core actions, predictable drawers/popovers, and no viewport overflow.

- [ ] Add a failing regression test for each verified Studio behavior defect.
- [ ] Run the focused Studio tests and confirm the new assertions fail.
- [ ] Correct rail/canvas/inspector sizing, sticky regions, popover anchoring, focus restoration, disabled explanations, and mobile action placement.
- [ ] Preserve native text and numeric inputs while keeping visual choices icon-led and labelled.
- [ ] Re-run Studio tests and browser-check 320–1440 pixels, coarse pointer, keyboard, and 200% zoom.

### Task 4: Harden Preview and Presenter Task Flow

**Files:**
- Modify: `apps/present/components/presenter.tsx`
- Modify: `apps/present/components/presenter-runtime.ts`
- Modify: `apps/present/app/presenter.css`
- Test: `apps/present/components/presenter-audience.test.tsx`
- Test: `apps/present/components/presenter-runtime.test.ts`

**Interfaces:**
- Consumes: validated deck, presenter runtime state, keyboard/fullscreen/overview controls.
- Produces: stable audience and presenter views with readable canvas, notes, transport, overview, and failure states.

- [ ] Add failing tests for verified control-state, keyboard, or presenter-runtime defects.
- [ ] Run focused Presenter tests and confirm failure.
- [ ] Fix control grouping, mobile transport, notes/overview density, focus order, disabled states, timer/status copy, and layout clipping.
- [ ] Ensure reduced motion preserves state feedback and audience mode never exposes speaker notes.
- [ ] Re-run tests and inspect Preview/Present at all required viewports and fullscreen where supported.

### Task 5: Normalize Semantic Components and Thumbnail Fidelity

**Files:**
- Modify: `apps/present/components/slide-frame.tsx`
- Modify: `apps/present/components/semantic-visuals.tsx`
- Modify: `apps/present/components/deck-thumbnail.tsx`
- Modify: `apps/present/app/slide-components.css`
- Modify: `apps/present/app/story-components.css`
- Modify: `apps/present/app/semantic-visuals.css`
- Test: `apps/present/components/slide-frame.test.tsx`
- Test: `apps/present/components/deck-thumbnail.test.tsx`

**Interfaces:**
- Consumes: semantic `SlideComponent` variants and motion-disabled rendering mode.
- Produces: identical meaning and safe geometry at full slide, thumbnail, overview, and next-slide-preview scales.

- [ ] Add failing regression coverage for each verified component or thumbnail mismatch.
- [ ] Run focused renderer tests and confirm failure.
- [ ] Fix text wrapping, density, safe margins, static interactive rendering, image treatment, chart/table/code readability, and nested-interactive risks.
- [ ] Verify Team Showcase and Visualizer remain interactive in presentation mode and static in thumbnail/overview mode.
- [ ] Re-run tests and compare representative screenshots at full size and thumbnail scale.

### Task 6: Cross-Surface Accessibility, Performance, and Visual Consistency Pass

**Files:**
- Modify only verified owners among `apps/present/app/*.css` and `apps/present/components/*.tsx`.
- Inspect: `PRODUCT.md`
- Inspect: `DESIGN.md`

**Interfaces:**
- Consumes: all corrected surfaces.
- Produces: one coherent token, focus, motion, typography, spacing, and state system.

- [ ] Remove verified hard-coded visual drift where a design token already exists.
- [ ] Correct focus-visible, contrast, semantic landmark, label, heading, touch-target, and reduced-motion defects.
- [ ] Replace verified layout-property animation or unnecessary expensive effects with transform/opacity or a static alternative.
- [ ] Check Vietnamese real copy, loading, empty, error, disabled, selected, and success states.
- [ ] Run the Impeccable detector once on the final changed UI targets and verify every finding in context.

### Task 7: Final Production Verification

**Files:**
- Inspect final diff only; do not modify unless a verification failure identifies a root cause.

**Interfaces:**
- Consumes: completed hardening changes.
- Produces: fresh, evidence-backed release readiness status.

- [ ] Run focused tests for every changed behavior.
- [ ] Run `pnpm -r --if-present test`.
- [ ] Run `pnpm -r --if-present typecheck`.
- [ ] Run `pnpm --filter @deckory/present build`.
- [ ] Start the production build and run clean browser smoke on `/`, `/studio`, `/preview`, and `/present`.
- [ ] Confirm zero console errors, zero unexpected page overflow, zero nested interactive controls, and reachable primary actions at all required viewports.
- [ ] Run `git diff --check`, inspect changed-file scope, and report unrelated dirty paths separately.
