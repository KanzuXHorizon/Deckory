# Deckory 10/10 Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a typed slide-master workflow, explainable adaptive composition, a transparent 15-dimension quality scorecard and semantic diagram coverage, then prove the system on MyInterview.

**Architecture:** Extend `@deckory/templates` with master metadata and deterministic recommendation, extend `@deckory/audit` with scorecards and rhythm diagnostics, add one typed semantic `diagram` component across schema/renderer/inspector/templates, and integrate the new capabilities into Studio and Hub without bypassing the shared `DeckDocument` renderer.

**Tech Stack:** TypeScript, Zod, React 19, Next.js 16, Motion 13, Vitest, Playwright, Deckory typed `DeckDocument`.

## Global Constraints

- Preserve unrelated dirty changes and the current checkout.
- No arbitrary JSX, free coordinates, serialized CSS or remote runtime assets in deck documents.
- Keep all user-facing copy professional Vietnamese.
- Preserve reduced-motion final state, keyboard access and 200% zoom usability.
- Do not invent evidence, data or production-readiness claims.
- Do not commit, push or publish remotely without separate authorization.

---

### Task 1: Typed Slide Master Catalog and Recommendation

**Files:**
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/document.test.ts`
- Modify: `packages/templates/src/types.ts`
- Create: `packages/templates/src/catalog/masters.ts`
- Create: `packages/templates/src/masters.test.ts`
- Create: `packages/templates/src/masters.ts`
- Modify: `packages/templates/src/catalog/index.ts`
- Modify: `packages/templates/src/index.ts`
- Modify: `apps/present/lib/studio-template-intelligence.ts`
- Modify: `apps/present/lib/studio-template-intelligence.test.ts`

**Interfaces:**
- Produces `SlideMasterPreset`, `slideMasters`, `getSlideMaster`, `compatibleSlideMasters`, `recommendSlideMaster`, and `applySlideMaster`.
- Extends slide variants with `cinematic`, `asymmetric`, `editorial`, `evidence`, and `gallery`.

- [ ] Write failing tests for master catalog integrity, compatibility, deterministic recommendation and content-preserving application.
- [ ] Run focused tests and confirm failures.
- [ ] Add schema variants, typed master catalog and recommendation.
- [ ] Implement `applySlideMaster` so it changes only variant, background, transition and safe component effects.
- [ ] Run focused schema and template tests.

### Task 2: Studio Slide Master Workflow

**Files:**
- Modify: `apps/present/components/studio-template-panel.tsx`
- Modify: `apps/present/components/studio-template-panel.test.tsx`
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/app/workspace.css`
- Modify: `apps/present/app/slide-components.css`

**Interfaces:**
- Adds a third `Slide master` tab.
- Exposes compatible masters, current master recommendation and an `Tự cân bằng bố cục` action.

- [ ] Write failing UI tests for master tab, compatibility copy, recommendation and apply actions.
- [ ] Run focused tests and confirm failures.
- [ ] Integrate master selection and recommendation into Studio.
- [ ] Add distinct variant styling without changing semantic content or slide geometry.
- [ ] Run focused Studio tests.

### Task 3: 15-Dimension Quality Scorecard

**Files:**
- Modify: `packages/audit/src/index.ts`
- Modify: `packages/audit/src/index.test.ts`
- Modify: `apps/present/lib/deck-catalog.ts`
- Modify: `apps/present/components/hub.tsx`
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/app/workspace.css`
- Modify: `apps/present/app/globals.css`

**Interfaces:**
- Produces `DeckQualityDimension`, `DeckQualityScorecard`, `scoreDeckQuality` and richer rhythm issue codes.
- Hub displays overall score and readiness.
- Studio displays prioritized structural issues and categories requiring runtime review.

- [ ] Write failing tests for all 15 dimensions, repeated composition signatures, dominant layout, flat density, motion overload, typography budgets and evidence coverage.
- [ ] Run audit tests and confirm failure.
- [ ] Implement transparent scoring with deductions and confidence labels.
- [ ] Integrate score summaries into Hub and Studio.
- [ ] Run audit and present tests.

### Task 4: Typed Semantic Diagram Component

**Files:**
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/document.test.ts`
- Create: `apps/present/components/semantic-diagrams.tsx`
- Create: `apps/present/components/semantic-diagrams.test.tsx`
- Modify: `apps/present/components/slide-frame.tsx`
- Modify: `apps/present/components/component-inspector.tsx`
- Modify: `apps/present/components/component-inspector.test.tsx`
- Modify: `apps/present/lib/component-catalog.ts`
- Modify: `apps/present/app/slide-components.css`
- Modify: `packages/templates/src/types.ts`
- Modify: `packages/templates/src/catalog/recipes.ts`
- Modify: `packages/templates/src/catalog/catalog.test.ts`

**Interfaces:**
- Adds `diagram` with variants `timeline`, `funnel`, `pyramid`, `cycle`, `quadrant`, `roadmap`.
- Props include title, summary, variant and bounded typed items.

- [ ] Write failing schema and renderer tests for all variants, item bounds, accessible summary and reduced motion.
- [ ] Run focused tests and confirm failures.
- [ ] Implement schema, renderer, CSS, inspector and catalog defaults.
- [ ] Add complete recipes and catalog integrity tests.
- [ ] Run focused schema, renderer, inspector and template tests.

### Task 5: MyInterview Rhythm and Master Proof

**Files:**
- Modify: `decks/myinterview-defense/deck.ts`
- Modify: `decks/myinterview-defense/deck.test.ts`
- Modify: `tests/e2e/myinterview-defense.spec.ts`

**Interfaces:**
- Keeps 23 slides and existing evidence.
- Applies multiple master composition families and at least one semantic diagram where it explains the relationship better than the incumbent visual.

- [ ] Add failing deck tests for master variance, no repeated composition triplets and diagram accessibility.
- [ ] Apply masters and refine only slides identified by the audit.
- [ ] Run deck tests, strict audit and MyInterview E2E.

### Task 6: Full Verification and Visual Loop

**Files:**
- Evidence only under ignored `output/playwright/`.

- [ ] Run focused tests for schema, templates, audit and present.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm audit:decks -- --strict`.
- [ ] Run `pnpm assets:check`.
- [ ] Run `pnpm build`.
- [ ] Run relevant E2E tests.
- [ ] Capture Hub, Studio, Preview, Presenter, template master and MyInterview representative screenshots.
- [ ] Inspect overflow, heading wraps, density, contrast, focus, reduced motion, console errors and thumbnail readability.
- [ ] Fix defects and repeat affected checks.

## Plan Self-Review

- Coverage: slide masters, adaptive composition, 15-category quality, semantic visuals, MyInterview proof and browser verification are represented.
- Placeholders: none.
- Type consistency: master and diagram interfaces are named once and consumed consistently.
- Scope: all work remains inside Deckory's typed semantic architecture and does not add cloud collaboration or arbitrary canvas editing.
