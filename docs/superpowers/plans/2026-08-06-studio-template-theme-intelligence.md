# Studio Template and Theme Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-quality Studio surface for inserting typed slide recipes and applying or safely customizing visual styles without exposing arbitrary CSS or coordinates.

**Architecture:** Reuse the existing `@deckory/templates` catalog as the source of truth. A pure adapter converts a `SlideRecipe` into a valid editable `Slide` using the existing component factory; a modal Studio panel handles discovery, recipe insertion, visual style application, and guarded theme overrides. All document mutations continue through Studio history/autosave so undo, redo, validation, Preview, Presenter, and Export remain consistent.

**Tech Stack:** TypeScript, React 19, Next.js 16, `@deckory/schema`, `@deckory/templates`, Vitest, Playwright, existing Deckory Studio controls and shared renderer.

## Global Constraints

- Keep Deckory agent-first: recipes describe narrative structure and semantic components, not pixel coordinates.
- Do not introduce arbitrary CSS, remote assets, JSX serialization, or untyped template payloads.
- Every inserted recipe must produce a `validateDeck`-compatible slide.
- Theme customization is restricted to `DeckTheme` tokens: preset, accent, typography, and density.
- Existing Studio undo/redo, autosave, validation, keyboard access, reduced motion, and responsive behavior must continue to work.
- UI copy is Vietnamese, direct, professional, and audience-facing.
- The MyInterview commits remain local-only and must not be pushed.

---

### Task 1: Typed recipe and theme adapter

**Files:**
- Create: `apps/present/lib/studio-template-intelligence.ts`
- Create: `apps/present/lib/studio-template-intelligence.test.ts`

**Interfaces:**
- Consumes: `SlideRecipe`, `VisualStylePreset`, `DeckDocument`, `DeckTheme`, and `createComponent(type, id)`.
- Produces:
  - `filterStudioRecipes(recipes, query, category): SlideRecipe[]`
  - `createSlideFromRecipe(recipe, existingSlideIds): Slide`
  - `applyVisualStyle(deck, style): DeckDocument`
  - `customizeDeckTheme(deck, patch): DeckDocument`

- [ ] **Step 1: Write failing tests** covering Vietnamese accent-insensitive search, stable unique slide IDs, valid component construction, style application, and safe custom theme IDs.
- [ ] **Step 2: Run** `pnpm --filter @deckory/present exec vitest run lib/studio-template-intelligence.test.ts` and verify missing-module failure.
- [ ] **Step 3: Implement the adapter** with deterministic defaults, copied motion metadata, and no shared object mutation.
- [ ] **Step 4: Run the focused test and `pnpm --filter @deckory/present typecheck`.**
- [ ] **Step 5: Commit with the UI task after browser integration passes.**

### Task 2: Accessible template and style panel

**Files:**
- Create: `apps/present/components/studio-template-panel.tsx`
- Create: `apps/present/components/studio-template-panel.test.tsx`
- Modify: `apps/present/app/workspace.css`

**Interfaces:**
- Consumes: recipe/style catalogs, current `DeckTheme`, and callbacks for insert/apply/customize.
- Produces: `StudioTemplatePanel` with recipe and visual-style tabs.

- [ ] **Step 1: Write a failing static-render test** asserting dialog semantics, recipe guidance, evidence status, style dials, and guarded theme controls.
- [ ] **Step 2: Run the focused test and verify missing-component failure.**
- [ ] **Step 3: Implement focus management, Escape/backdrop close, tab switching, search, category filters, recipe cards, style cards, and theme token controls.**
- [ ] **Step 4: Add responsive CSS** for wide desktop, tablet drawer-like composition, mobile bottom-sheet behavior, visible focus, disabled states, and reduced motion.
- [ ] **Step 5: Run component tests and typecheck.**

### Task 3: Studio integration and command access

**Files:**
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/lib/studio-command-catalog.ts`
- Modify: `apps/present/lib/studio-command-catalog.test.ts`
- Modify: `apps/present/package.json`
- Modify: `apps/present/next.config.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `slideRecipes`, `visualStyles`, recipe adapter functions, and `StudioTemplatePanel`.
- Produces: topbar and command-palette access, insertion after selected slide, style application, and custom theme mutation through bounded document history.

- [ ] **Step 1: Add failing command-catalog assertions** for `open-templates` and its Vietnamese aliases.
- [ ] **Step 2: Run focused command tests and verify failure.**
- [ ] **Step 3: Add the templates workspace dependency and Next transpilation entry.**
- [ ] **Step 4: Integrate panel state and callbacks in Studio.** Insert recipes immediately after the selected slide, select the new slide/component, mark the document dirty, and close the panel. Apply style/theme changes through `updateDeck` so undo/redo remains valid.
- [ ] **Step 5: Add a visible `Mẫu & phong cách` action and command-palette route.**
- [ ] **Step 6: Run Studio/component tests, typecheck, and production build.**

### Task 4: Production browser evidence

**Files:**
- Modify: `tests/e2e/studio-workflow.spec.ts`

**Interfaces:**
- Consumes: complete Studio template panel.
- Produces: browser evidence screenshot `studio-template-theme-intelligence.png`.

- [ ] **Step 1: Add an E2E scenario** that opens the panel, searches an accent-insensitive Vietnamese term, inserts a data recipe, verifies slide count/selection, applies a visual style, customizes an accent token, closes by keyboard, and validates undo.
- [ ] **Step 2: Run `pnpm test:e2e`.**
- [ ] **Step 3: Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm audit:decks -- --strict`, `pnpm assets:check`, and `git diff --check`.**
- [ ] **Step 4: Review the generated screenshot and source diff for overflow, accidental copy regressions, unused code, and scope leakage.**
- [ ] **Step 5: Commit as `feat(studio): add template and theme intelligence`. Do not push the MyInterview commits.**
