# MyInterview Single Scene V2 Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dual V1/V2 MyInterview setup with one native Scene V2 deck, remove stale CSS/runtime paths, and deliver a visually professional graduation-defense presentation with full release evidence.

**Architecture:** `decks/myinterview-defense` becomes the canonical V2 package and exports one `DeckDocumentV2` with ID `myinterview-defense`. Visual composition lives in typed scene builders and deck tokens, while a CSS contract script guards the application import graph against duplicate/orphan global styles and deck-ID overrides.

**Tech Stack:** TypeScript 5.9, React 19, Next.js 16, Deckory Scene V2, Zod schemas, Vitest, Playwright, pnpm 11.7.

## Completion Record

**Status:** Tasks 1–5 completed on `main`. The procedural checkboxes below are retained as the original execution trace; this record is authoritative for completion.

Verified implementation:

- one public MyInterview ID and one native Scene V2 package;
- no `myinterview-defense-v2` runtime package or alias;
- no MyInterview/defense stylesheet and no global deck-ID selector;
- one root CSS entry with deterministic cascade and a CI-enforced contract;
- 23 professionalized slides, five member profiles and ten local assets;
- strict audit, asset audit, production build, bundle budgets, mobile checks, visual-quality inspection and full Chromium release journey;
- full `pnpm quality:gate` passed before final commit and must be rerun on the committed revision before push.

## Global Constraints

- Keep exactly one public MyInterview deck ID: `myinterview-defense`.
- Do not retain `myinterview-defense-v2` as an alias, shim or hidden runtime path.
- Do not import V1 `DeckDocument`, V1 slide/component types or `migrateDeckV1ToV2` from the canonical deck.
- Do not use MyInterview-specific selectors in global CSS.
- Use only local typed assets and explicit evidence labels.
- Preserve the accepted 23-slide story order and five-member roster.
- Keep all visible frames within 1280 × 720.
- Run full `pnpm quality:gate` before completion or push.

---

### Task 1: Lock the single-deck and CSS contracts

**Files:**
- Create: `scripts/check-css-contract.ts`
- Create: `scripts/check-css-contract.test.ts`
- Modify: `package.json`
- Modify: `apps/present/lib/deck-catalog.test.ts`
- Modify: `apps/present/components/hub.test.tsx`

**Interfaces:**
- Produces: `checkCssContract(rootDir: string): CssContractReport` with duplicate imports, orphan app CSS and forbidden deck selectors.
- Produces: catalog behavior where `myinterview-defense` is V2 and `myinterview-defense-v2` is unresolved.

- [ ] Write failing CSS contract tests with fixture import graphs covering duplicate import, orphan CSS and `data-deck-id="myinterview-defense"` selectors.
- [ ] Run `pnpm exec vitest run scripts/check-css-contract.test.ts` and confirm the module is missing.
- [ ] Implement deterministic import-graph parsing for `layout.tsx`, CSS `@import` statements and `*.module.css` exclusions.
- [ ] Add `css:check` and include it in `quality:gate` after `assets:check`.
- [ ] Add failing catalog and Hub tests asserting one canonical MyInterview deck and no V2 alias.
- [ ] Run focused tests and confirm failures against the current dual-deck catalog.
- [ ] Commit as `test(css): lock single-deck and style contracts`.

---

### Task 2: Author the canonical native Scene V2 deck

**Files:**
- Create: `decks/myinterview-defense/content.ts`
- Create: `decks/myinterview-defense/visual-system.ts`
- Rewrite: `decks/myinterview-defense/deck.ts`
- Rewrite: `decks/myinterview-defense/deck.test.ts`
- Modify: `decks/myinterview-defense/package.json`

**Interfaces:**
- Produces: `myInterviewDefense: DeckDocumentV2`.
- Produces: `MYINTERVIEW_SLIDE_ORDER`, `MYINTERVIEW_TEAM`, `myInterviewVisualSystem`.

- [ ] Write failing tests asserting schema version 2, ID `myinterview-defense`, 23 stable slide IDs, five members, 10 assets, no migration diagnostics and no V1 imports.
- [ ] Add acceptance checks for purpose, conclusion, notes, accessible summaries, frame bounds, evidence footers and composition diversity.
- [ ] Run `pnpm --filter @deckory/myinterview-defense test` and confirm the V1 document fails the V2 contract.
- [ ] Move stable story content and evidence labels into `content.ts` without importing V1 schema types.
- [ ] Implement MyInterview tokens, backgrounds and layout recipes in `visual-system.ts`.
- [ ] Assemble all 23 slides directly as `SceneSlide` values in `deck.ts`.
- [ ] Use native charts/diagrams only where the data and relationship justify them; use editable text/shape/image composition elsewhere.
- [ ] Run package tests/typecheck and strict audit for the canonical deck.
- [ ] Commit as `feat(myinterview): author canonical Scene V2 defense deck`.

---

### Task 3: Remove dual runtime paths and stale CSS

**Files:**
- Modify: `apps/present/lib/deck-catalog.ts`
- Modify: `apps/present/package.json`
- Modify: `apps/present/app/layout.tsx`
- Modify: `apps/present/app/globals.css`
- Delete: `apps/present/app/myinterview-defense.css`
- Delete: `decks/myinterview-defense-v2/`
- Modify: `pnpm-lock.yaml`
- Modify: `PRODUCT.md`

**Interfaces:**
- Consumes: canonical `myInterviewDefense` V2 package from Task 2.
- Produces: one Hub/catalog entry and one runtime dependency.

- [ ] Update catalog imports and V2 catalog metadata to use only `@deckory/myinterview-defense`.
- [ ] Remove the V1 deck entry and the `myinterview-defense-v2` entry.
- [ ] Remove `@deckory/myinterview-defense-v2` from application dependencies and refresh the lockfile.
- [ ] Remove the deck-specific CSS import and duplicate `slide-components.css` import.
- [ ] Remove the stale stylesheet and V2 migration package from Git.
- [ ] Update product documentation to describe one canonical Scene V2 deck.
- [ ] Run `pnpm css:check`, catalog tests, Hub tests, typecheck and build.
- [ ] Commit as `refactor(myinterview): remove legacy deck and CSS paths`.

---

### Task 4: Upgrade visual hierarchy and presentation behavior

**Files:**
- Modify: `decks/myinterview-defense/content.ts`
- Modify: `decks/myinterview-defense/visual-system.ts`
- Modify: `decks/myinterview-defense/deck.ts`
- Modify: `tests/e2e/myinterview-defense.spec.ts`
- Modify: `tests/e2e/deckory-v2-release.spec.ts`
- Modify: `tests/e2e/performance-v2.spec.ts`

**Interfaces:**
- Produces: professional cover, profiles, product proof, architecture, scoring, evidence, roadmap, demo and closing compositions on one document.

- [ ] Add browser assertions for canonical routes, title hierarchy, local asset loading, evidence labels and audience-note privacy.
- [ ] Add visual checks for representative slides: `cover`, `member-hao`, `topic`, `solution`, `architecture`, `ai-scoring`, `testing-evidence`, `demo`, `conclusion`.
- [ ] Run focused E2E and record the first visual/overflow failures.
- [ ] Refine composition, typography, spacing, backgrounds, image crop, chart/diagram framing and section contrast in Scene V2 data.
- [ ] Keep motion restrained and ensure thumbnail/export/reduced-motion modes preserve final meaning.
- [ ] Re-run focused E2E until all representative slides are clean.
- [ ] Commit as `feat(myinterview): professionalize defense visual system`.

---

### Task 5: Final audit, cleanup and release proof

**Files:**
- Modify: `docs/V2-RELEASE-CHECKLIST.md`
- Modify: `README.md`
- Modify: `DESIGN.md`
- Evidence only: `output/playwright/screenshots/<run-id>/`

**Interfaces:**
- Produces: verified single-deck release evidence on one Git revision.

- [ ] Run `git grep` for `myinterview-defense-v2`, `myinterview-defense.css`, `migrateDeckV1ToV2` and forbidden deck-ID CSS selectors; allow only historical plan/spec references where explicitly documented.
- [ ] Run `pnpm css:check` and verify zero duplicate imports, orphan global CSS or forbidden selectors.
- [ ] Run `pnpm audit:decks -- --strict` and `pnpm assets:check`.
- [ ] Run `pnpm build`, `pnpm performance:check` and focused MyInterview E2E.
- [ ] Run full `pnpm quality:gate` on the final working tree.
- [ ] Inspect Git diff, remove generated `.next*` directories and confirm no output files are staged.
- [ ] Update release documentation with verified behavior and explicit non-goals only.
- [ ] Commit as `docs(myinterview): publish single-deck release evidence`.
- [ ] Fetch remote, verify ahead/behind, push without force and confirm remote HEAD equals local HEAD.

## Plan Self-Review

- Spec coverage: single canonical V2 deck, removal of V1/runtime aliases, CSS cleanup, professional visual redesign, accessibility, evidence, export and release verification are covered.
- Placeholder scan: no TBD/TODO or deferred implementation language remains.
- Type consistency: the canonical export is `myInterviewDefense: DeckDocumentV2`; catalog, Hub and tests consume the same ID `myinterview-defense`.
- Scope: no unrelated product features are included.
