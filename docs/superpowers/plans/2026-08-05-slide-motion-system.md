# Deckory Slide Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed slide transitions, semantic element effects, and shared-element morphing to Deckory's presenter.

**Architecture:** Extend the deck schema with optional motion contracts, centralize all animation behavior in a pure motion registry, and keep `Presenter`/`SlideFrame` as thin consumers. Use the existing `motion` dependency, direction-aware variants, and strict reduced-motion fallbacks.

**Tech Stack:** TypeScript 5.9, React 19, Next.js 16, Motion 13, Zod, Vitest.

## Global Constraints

- Work directly on the current `main` checkout and preserve all existing dirty changes.
- Do not add arbitrary JSX, inline deck style objects, or runtime animation objects to deck documents.
- All motion fields remain optional so existing v1 decks stay valid.
- Only transform, opacity, bounded filter, and clip-path may animate.
- Reduced motion must remove spatial, blur, wipe, and morph movement.
- Do not add a new dependency.
- Do not commit unless the user explicitly requests it.

---

### Task 1: Typed Motion Contract

**Files:**
- Modify: `packages/schema/src/index.ts`
- Test: `packages/schema/src/document.test.ts`

**Interfaces:**
- Produces: `SlideTransition`, `ElementEffect`, `SlideTransitionSchema`, `ElementEffectSchema`.
- Produces optional `slide.transition`, `component.effect`, and `component.morphId` fields.

- [ ] Add failing tests that accept supported slide/element presets and reject unknown presets, unstable `morphId`, duration outside `0.1..1.2`, and delay outside `0..1.5`.
- [ ] Run `pnpm --filter @deckory/schema test` and confirm the new cases fail for missing fields.
- [ ] Implement strict Zod schemas and inferred exports while preserving every existing document.
- [ ] Run `pnpm --filter @deckory/schema test` and `pnpm --filter @deckory/schema typecheck`.

### Task 2: Pure Motion Registry

**Files:**
- Create: `apps/present/components/motion-system.ts`
- Create: `apps/present/components/motion-system.test.ts`

**Interfaces:**
- Produces: `getSlideMotion(transition, direction, reducedMotion)` returning `initial`, `animate`, `exit`, and `transition` objects.
- Produces: `getElementMotion(effect, visible, reducedMotion)` returning `animate` and `transition` objects.
- Produces: `getMorphLayoutId(deckId, morphId)` returning a stable namespaced string or `undefined`.

- [ ] Write failing unit tests for forward/backward `slide`, coordinated `push`, `wipe`, `zoom`, `none`, and reduced-motion behavior.
- [ ] Run the focused Vitest file and confirm failure because the module does not exist.
- [ ] Implement preset registries, normalized timing, easing aliases, and shared ID namespacing.
- [ ] Run the focused tests until green.

### Task 3: Element Effects and Morph IDs

**Files:**
- Modify: `apps/present/components/slide-frame.tsx`
- Test: `apps/present/components/slide-frame.test.tsx`

**Interfaces:**
- Consumes: `getElementMotion`, `getMorphLayoutId`.
- Changes `SlideFrame` props to include optional `deckId?: string` and `motionDisabled?: boolean` while retaining existing callers.

- [ ] Add failing static-render tests for `data-effect`, stable shared layout metadata, hidden sequence accessibility, and motion-disabled overview rendering.
- [ ] Run the focused test and confirm expected failures.
- [ ] Replace the hardcoded rise animation with the registry output; pass explicit `layoutId` for opted-in components only.
- [ ] Preserve `aria-hidden`, disable pointer events while hidden, and ensure reduced motion immediately reveals content.
- [ ] Run the focused test and typecheck.

### Task 4: Direction-Aware Slide Transitions

**Files:**
- Modify: `apps/present/components/presenter.tsx`
- Test: `apps/present/components/presenter-runtime.test.ts`
- Modify: `apps/present/components/presenter-runtime.ts`

**Interfaces:**
- Produces: `getNavigationDirection(previousIndex, nextIndex): -1 | 1`.
- Consumes: `getSlideMotion` and the entering slide's `transition`.

- [ ] Add failing runtime tests for forward/backward direction and same-index sequence steps.
- [ ] Implement the pure direction helper.
- [ ] Track previous slide index in `Presenter`, use direction-aware variants, and switch AnimatePresence mode appropriately for morph/push overlap.
- [ ] Pass `deck.id` into `SlideFrame`; disable animation in overview thumbnails.
- [ ] Run presenter tests and typecheck.

### Task 5: Representative Deck Authoring

**Files:**
- Modify: `decks/deckory-story/deck.ts`
- Test: existing schema validation through workspace tests.

**Interfaces:**
- Uses only the typed schema contract.

- [ ] Assign restrained transitions across the sample story: quiet fade for routine slides, wipe for a data reveal, push for process continuity, zoom for a focal statement, and morph only where matching semantic components exist.
- [ ] Add element effects to a small number of headings, metrics, chart, and insight components; use stable matching `morphId` values across at least one adjacent slide pair.
- [ ] Run schema and deck package tests/typecheck.

### Task 6: Motion Styling and Visual Verification

**Files:**
- Modify only if needed: `apps/present/app/globals.css`

**Interfaces:**
- CSS may only provide containment, transform origins, hidden pointer behavior, and browser fallbacks; animation geometry remains in the registry.

- [ ] Add any required containment/fallback classes without introducing keyframes that duplicate the registry.
- [ ] Run `pnpm test`, `pnpm typecheck`, and `pnpm build`.
- [ ] Run the Impeccable detector once over changed UI files.
- [ ] Start the presenter and verify in a real browser: next/previous keyboard navigation, repeated interruption, overview thumbnails, fullscreen controls, representative transitions, and reduced-motion behavior.
- [ ] Inspect the final diff for accidental overwrites, generated files, secrets, and unrelated changes.
