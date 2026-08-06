# MyInterview Defense 10/10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one tracked, evidence-grounded, visually polished MyInterview graduation-defense deck that is reproducible from a clean Deckory checkout and passes schema, asset, unit, browser, export, and production-build gates.

**Architecture:** Keep `@deckory/myinterview-defense` as the only deck source of truth. Add one reusable `media-showcase` semantic component for product screenshots, use local typed assets copied from the verified MyInterview presentation bundle, and keep all MyInterview-specific composition rules in one scoped stylesheet. The main story follows the verified MyInterview defense manifest: 17 main slides plus 6 Q&A appendix slides.

**Tech Stack:** TypeScript, Zod schema validation, React 19, Next.js 16, Motion, Vitest, Playwright, Deckory typed `DeckDocument`.

## Global Constraints

- Preserve the FPT Polytechnic identity, Vietnamese copy, and MyInterview product boundary.
- No fake survey percentages, fake test counts, production-readiness claims, or unsupported AI claims.
- Main deck: 17 slides; appendix: 6 slides; all slides complete with notes and evidence footer.
- The student text-interview and evidence-linked feedback journey is the defense core.
- Voice and B2B remain evidence-gated or controlled; public production activation remains blocked.
- Use only local assets declared in `deck.assets`; no remote runtime assets.
- All images require meaningful Vietnamese alt text.
- Motion must preserve meaning under reduced motion and be disabled for export/thumbnails.
- No commit, push, merge, or remote publication without separate authorization.

---

### Task 1: Lock the Active Deck Source of Truth

**Files:**
- Modify: `decks/myinterview-defense/package.json`
- Rewrite: `decks/myinterview-defense/deck.ts`
- Modify: `apps/present/lib/deck-catalog.ts`
- Modify: `apps/present/app/layout.tsx`
- Delete after migration: `decks/myinterview-defense-polished/deck.ts`
- Delete after migration: `decks/myinterview-defense/deck-v2.ts`
- Delete after migration: `apps/present/app/myinterview-defense-v2.css`

**Interfaces:**
- Produces: `myInterviewDefense` exported from `@deckory/myinterview-defense`.
- Consumers: Hub, Studio, Preview, Present, Export, audit scripts, E2E tests.

- [ ] Add a focused catalog test that asserts the active MyInterview deck comes from `@deckory/myinterview-defense`, has stable ID `myinterview-defense`, and contains 23 slides.
- [ ] Run the focused test and confirm it fails against the current temporary import.
- [ ] Point the package export and catalog to `decks/myinterview-defense/deck.ts` only.
- [ ] Remove temporary duplicate deck sources after the final deck has been migrated.
- [ ] Run the focused test and package typecheck.

### Task 2: Add the Reusable Media Showcase Component

**Files:**
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/document.test.ts`
- Modify: `apps/present/components/slide-frame.tsx`
- Modify: `apps/present/components/slide-frame.test.tsx`
- Modify: `apps/present/components/component-inspector.tsx`
- Modify: `apps/present/components/component-inspector.test.tsx`
- Modify: `apps/present/lib/component-catalog.ts`
- Modify: `apps/present/app/slide-components.css`

**Interfaces:**
- Produces component type: `media-showcase`.
- Props: optional `title`, optional `summary`, `variant: "single" | "duo" | "triptych"`, and one to three items with `assetId`, `alt`, `title`, optional `eyebrow`, optional `caption`, and optional `featured`.

- [ ] Write schema tests for valid local-asset media items, maximum three items, one featured item, and missing asset diagnostics.
- [ ] Run schema tests and confirm they fail because `media-showcase` does not exist.
- [ ] Add schema, validation, layout compatibility, and asset resolution.
- [ ] Write renderer tests for semantic figures, alt text, variant class, and reduced-motion-safe output.
- [ ] Run renderer tests and confirm they fail before implementation.
- [ ] Implement renderer and reusable CSS with laptop-frame treatment, direct captions, and staggered motion.
- [ ] Add Studio inspector fields and component-catalog defaults with tests.
- [ ] Run focused schema, renderer, and inspector tests.

### Task 3: Import Verified MyInterview Visual Assets

**Files:**
- Create: `apps/present/public/myinterview/team/hao.svg`
- Create: `apps/present/public/myinterview/team/quynh.svg`
- Create: `apps/present/public/myinterview/team/thu.svg`
- Create: `apps/present/public/myinterview/team/hoang.svg`
- Create: `apps/present/public/myinterview/team/minh.svg`
- Create: `apps/present/public/myinterview/product/dashboard.svg`
- Create: `apps/present/public/myinterview/product/setup.svg`
- Create: `apps/present/public/myinterview/product/interview.svg`
- Create: `apps/present/public/myinterview/product/feedback.svg`
- Create: `apps/present/public/myinterview/product/action-plan.svg`

**Interfaces:**
- Consumes: verified local images from `MyInterview/docs/presentation/slides/assets`.
- Produces: typed local asset IDs used by the deck.

- [ ] Convert source images in memory to bounded JPEG data and wrap them in local SVG files without modifying the MyInterview repository.
- [ ] Register every image in `deck.assets` with dimensions, media type, and source label.
- [ ] Run `pnpm assets:check` and confirm all references resolve locally.

### Task 4: Rebuild the Defense Narrative and Copy

**Files:**
- Rewrite: `decks/myinterview-defense/deck.ts`
- Rewrite: `apps/present/app/myinterview-defense.css`
- Modify: `tests/e2e/myinterview-defense.spec.ts`

**Interfaces:**
- Produces 17 main slides and 6 appendix slides.
- Main slides: cover; five members; topic; current-state gap; solution; architecture; AI/scoring; responsible AI; implementation status; testing/evidence; limitations/roadmap; conclusion; demo.
- Appendix: backend boundaries; interview/scoring state machines; rubric; auth/data ownership; voice conditions; deployment stack.

- [ ] Write deck tests asserting 23 slides, no placeholder survey, all notes present, all evidence footers present, five member photos, at least four product screenshots, and appendix IDs.
- [ ] Run the tests and confirm they fail against the current deck.
- [ ] Rewrite the deck using current MyInterview manifest facts: Next.js 16.2.11, React 19.2.7, TypeScript 6.0.3, FastAPI 0.139.0, PostgreSQL/Neon-compatible async SQLAlchemy with pgvector, Google Gen AI, Speechmatics primary and Deepgram fallback.
- [ ] Replace quantitative survey placeholders with a qualitative current-state comparison.
- [ ] Use concise Vietnamese copy and define unavoidable English technical terms at first use.
- [ ] Add actual team photos and product screenshots.
- [ ] Keep evidence footers traceable to specific documents, manifests, or local presentation assets.
- [ ] Rewrite scoped CSS for strong 16:9 hierarchy, safe footer zone, profile image cropping, media composition, projector readability, and consistent density.
- [ ] Run deck tests, strict audit, and asset check.

### Task 5: Harden Presenter Runtime and Visual Regression Coverage

**Files:**
- Modify: `apps/present/components/presenter.tsx` or the smallest presenter transport file owning wall-clock hydration.
- Modify: matching presenter unit test.
- Modify: `tests/e2e/myinterview-defense.spec.ts`
- Modify: `tests/e2e/visual-quality.spec.ts` only if a reusable assertion is missing.

**Interfaces:**
- Produces stable server/client wall-clock rendering and clean Presenter console.

- [ ] Add a failing regression test proving the initial wall-clock markup is deterministic across SSR and hydration.
- [ ] Run the focused test and confirm the mismatch is reproduced.
- [ ] Render a stable placeholder until mounted, then update the live clock on the client.
- [ ] Extend E2E coverage for cover, member photo, product screenshot, architecture, scoring, responsible AI, demo, appendix jump, and audience mode.
- [ ] Run focused unit and E2E tests.

### Task 6: Full Quality Gate and Screenshot Loop

**Files:**
- Generated evidence only under ignored `output/playwright/`.

- [ ] Run `git diff --check` on owned paths.
- [ ] Run `pnpm --filter @deckory/schema test`.
- [ ] Run `pnpm --filter @deckory/present test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm audit:decks -- --strict`.
- [ ] Run `pnpm assets:check`.
- [ ] Run `pnpm build`.
- [ ] Run the MyInterview E2E spec and `pnpm test:visual`.
- [ ] Capture representative screenshots at full-size and thumbnail scale.
- [ ] Inspect heading wraps, clipping, contrast, footer collisions, image legibility, keyboard focus, reduced motion, console errors, and export output.
- [ ] Fix defects and repeat affected checks until clean or report the exact external blocker.

## Plan Self-Review

- Coverage: source consolidation, semantic media support, real assets, 23-slide narrative, copy, runtime, E2E, export, and visual QA are all assigned.
- Placeholders: none; no survey data or test metrics are invented.
- Type consistency: `media-showcase` is the single new component ID across schema, renderer, catalog, inspector, CSS, deck, and tests.
- Scope: MyInterview deck and directly required reusable renderer support only; unrelated export and Studio work remains untouched.
