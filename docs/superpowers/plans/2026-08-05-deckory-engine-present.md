# Deckory Engine & Present Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver a browser-native, Vietnamese-first Deckory presentation engine with a polished interactive presenter and a quality-checked example deck.

**Architecture:** A pnpm/Turborepo monorepo keeps the document contract, renderer, audit rules, and presenter independently testable. A serializable AST crosses every boundary; the React/Next renderer consumes only validated documents. The present app contains product-shell controls and a 16:9 canvas, while slide visuals remain component/layout driven.

**Tech Stack:** TypeScript strict, pnpm workspaces, Turborepo, Next.js App Router, React, Zod, Motion, Lucide React, Vitest, Testing Library, Playwright, CSS custom properties.

## Global Constraints

- Vietnamese-first content using Be Vietnam Pro; icons use Lucide and convey an action or status.
- AST is the only document source of truth; React is a renderer, not authoring storage.
- Use no arbitrary HTML/JSX from deck content and no untyped `any`.
- Preserve 16:9 slide geometry, WCAG-oriented contrast, keyboard operation, and reduced-motion behavior.
- Browser presentation is the release target; export, Studio, Hub, Yjs, and persistence are out of scope.
- Every behavior is test-first, with an observed failing test before implementation.

---

## Planned file structure

```text
apps/present/                         # Next.js presenter host
packages/schema/                      # AST, Zod validation, diagnostics
packages/core/                        # navigation and sequence state
packages/themes/                      # tokens and validated theme contract
packages/components/                  # declarative slide component props
packages/layouts/                     # layout recipes and density policy
packages/renderer-dom/                # AST → React renderer
packages/audit/                       # deterministic document checks
decks/deckory-story/                  # Vietnamese fixture deck and source data
docs/                                 # agent guide, component catalog, theme guide
```

### Task 1: Repository foundation and quality toolchain

**Files:** root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `AGENTS.md`, package manifests, Vitest and Playwright configuration.

- [ ] Write a failing workspace smoke test importing `@deckory/schema`.
- [ ] Run the test and capture its expected unresolved-module failure.
- [ ] Add a strict TypeScript pnpm workspace, shared scripts, package aliases, and a minimal schema package export.
- [ ] Re-run the smoke test, typecheck, lint, and build.
- [ ] Commit: `chore: bootstrap Deckory monorepo`.

### Task 2: Versioned Slide AST and validation diagnostics

**Files:** `packages/schema/src/document.ts`, `diagnostics.ts`, `validate.ts`, `index.ts`, tests.

- [ ] Write failing tests for duplicate IDs, unknown component names, invalid sequence positions, and a valid 16:9 document.
- [ ] Implement Zod schemas and a `validateDeck(input): DeckValidationResult` function that never throws for untrusted input.
- [ ] Verify schema package tests and strict typecheck pass.
- [ ] Commit: `feat(schema): add versioned slide document contract`.

### Task 3: Themes, component registry, and layout contracts

**Files:** `packages/themes/src/*`, `packages/components/src/*`, `packages/layouts/src/*`, tests.

- [ ] Write failing tests asserting each registered component exposes schema, semantic metadata, static fallback, and export capability.
- [ ] Implement tokens and registries for heading, statement, metric grid, comparison, process, architecture, chart, and evidence footer components.
- [ ] Implement layout recipes with named slots and readable density limits.
- [ ] Run package tests and commit: `feat(kit): add presentation grammar`.

### Task 4: DOM renderer and visual primitives

**Files:** `packages/renderer-dom/src/*`, unit tests, test fixture styles.

- [ ] Write failing renderer tests for validated content, semantic headings, alt text, static fallbacks, and component registry rejection.
- [ ] Render AST with deterministic DOM IDs and layout components; add charts/diagram primitives that map data to labels rather than decorative shapes.
- [ ] Add CSS composition rules for 16:9 safe areas, typography scale, contrast, and responsive canvas framing.
- [ ] Verify unit tests and commit: `feat(renderer): render structured slides`.

### Task 5: Presenter state machine and accessible controls

**Files:** `packages/core/src/*`, `apps/present/app/*`, `components/*`, tests.

- [ ] Write failing reducer tests for Arrow/Home/End navigation, bounded sequence reveal, and stable `slide` URL parsing.
- [ ] Implement pure presenter state commands; bind them to an accessible Next client shell with overview, progress, fullscreen, and audience/presenter modes.
- [ ] Test speaker notes isolation and keyboard navigation in component tests.
- [ ] Commit: `feat(present): add accessible browser presenter`.

### Task 6: Motion and offline readiness

**Files:** motion wrapper, manifest route, `public/sw.js`, offline state module, tests.

- [ ] Write failing tests proving reduced motion reveals full sequence and cache readiness remains false with a missing asset.
- [ ] Add Motion transitions with a single reduced-motion decision point; add an explicit asset manifest and service worker message protocol.
- [ ] Verify no online presentation path is blocked when service worker registration fails.
- [ ] Commit: `feat(present): add respectful motion and offline readiness`.

### Task 7: Quality audit and Vietnamese visual fixture

**Files:** `packages/audit/src/*`, `decks/deckory-story/*`, unit/Playwright tests, visual baselines.

- [ ] Write failing audit tests for insufficient contrast, too-small text, missing citations, and unsafe density.
- [ ] Implement non-mutating audit rules with actionable remediation and deck quality summary.
- [ ] Build a 9–11 slide Deckory story that turns raw adoption, workflow, and architecture data into a metric story, comparison, process, architecture diagram, and timeline.
- [ ] Add Playwright tests for navigation, notes privacy, reduced motion, and reference screenshots.
- [ ] Run full `test`, `lint`, `typecheck`, `build`, and browser suite; inspect screenshots.
- [ ] Commit: `feat: ship Deckory engine and presenter vertical slice`.

## Self-review

The plan maps each scope item to a task, keeps export/editor/collaboration outside the implementation boundary, requires red-green tests for all package behavior, and ends in a real browser verification rather than a UI-only claim. No task relies on undocumented interfaces or deferred implementation placeholders.
