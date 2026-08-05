# Deckory Slide Quality Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install a Deckory-specific taste/brand skill workflow and add complete semantic table and code-snippet support for professional data and technical slides.

**Architecture:** Repository-local skills define the mandatory deck creation and visual-review workflow. The existing typed deck AST gains `table` and `code` components, which are implemented end-to-end through schema, renderer, Studio, Inspector, responsive preview styles, and tests without arbitrary JSX or runtime code execution.

**Tech Stack:** TypeScript 5.9, Zod, React 19, Next.js, Motion, Vitest, semantic HTML/CSS, Playwright.

## Global Constraints

- Preserve all unrelated dirty changes in the checkout.
- Do not create a product Brand Kit feature in this batch.
- Deck content remains typed `DeckDocument` data and must pass `validateDeck`.
- No arbitrary JSX, untyped coordinates, remote assets, or executable snippets.
- Vietnamese audience copy remains concise and professional.
- Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before completion.

---

### Task 1: Repository-local slide quality skills

**Files:**
- Create: `.agents/skills/deckory-slide-director/SKILL.md`
- Create: `.agents/skills/brandkit/SKILL.md`
- Create: `.agents/skills/gpt-taste/SKILL.md`
- Create: `.agents/skills/full-output-enforcement/SKILL.md`
- Create: `.agents/taste-skill.lock.json`
- Modify: `AGENTS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: upstream taste-skill principles and Deckory repository constraints.
- Produces: a discoverable primary skill at `.agents/skills/deckory-slide-director/SKILL.md` and optional supporting skills.

- [ ] Write complete skill files with frontmatter, invocation triggers, workflow, component-selection rules, pre-flight checklist, and visual verification loop.
- [ ] Record source URL, retrieval date, installed local names, and adaptation status in the lock manifest.
- [ ] Require the Deckory skill in `AGENTS.md` for all slide/deck creation, review, and redesign work.
- [ ] Document the workflow and exact local paths in `README.md`.
- [ ] Scan the files for placeholder text, ambiguous Brand Kit product language, or page-only assumptions.

### Task 2: Typed table and code contracts

**Files:**
- Modify: `packages/schema/src/document.test.ts`
- Modify: `packages/schema/src/index.ts`

**Interfaces:**
- Produces: `SlideComponent` variants `table` and `code`.
- `table.props`: `{ title: string; columns: string[]; rows: Array<{ cells: string[]; highlight?: boolean }>; note?: string }`.
- `code.props`: `{ title: string; language: string; code: string; caption?: string; showLineNumbers?: boolean; highlightLines?: number[] }`.

- [ ] Add a failing test that validates a data slide containing both typed components.
- [ ] Add a failing test that rejects mismatched table cells and out-of-range highlighted code lines.
- [ ] Run `cmd.exe /c pnpm --filter @deckory/schema test` and confirm failure is caused by unsupported component types.
- [ ] Add schemas, discriminated-union entries, layout compatibility, and cross-field validation.
- [ ] Re-run the focused schema tests and confirm they pass.

### Task 3: Semantic renderer and responsive visual treatment

**Files:**
- Modify: `apps/present/components/slide-frame.test.tsx`
- Modify: `apps/present/components/slide-frame.tsx`
- Create: `apps/present/app/slide-components.css`
- Modify: `apps/present/app/globals.css`

**Interfaces:**
- Consumes: the `table` and `code` component contracts from Task 2.
- Produces: `DataTable` and `CodeSnippet` rendering with semantic table/pre/code markup, accessible labels, optional line numbers, and highlighted rows/lines.

- [ ] Add a failing renderer test for semantic table output, escaped code, language label, and highlight markers.
- [ ] Run the focused presentation test and confirm the switch does not support the new components.
- [ ] Implement the two renderer branches without a syntax-highlighting dependency.
- [ ] Add dedicated CSS for full-size, Overview, and next-slide preview rendering; import it before existing global rules.
- [ ] Re-run the focused renderer tests and confirm they pass.

### Task 4: Studio creation and Inspector editing

**Files:**
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/components/component-inspector.tsx`

**Interfaces:**
- Consumes: typed components from Task 2 and renderer from Task 3.
- Produces: compatible component-palette entries, safe defaults, and editable fields for all table/code properties.

- [ ] Add `table` and `code` to compatible layouts and component factories.
- [ ] Add Inspector branches for titles, columns, cells, highlights, language, line-number visibility, highlighted-line lists, code, caption, and note.
- [ ] Add focused immutable update helpers for table columns/rows/cells.
- [ ] Run typecheck to catch missing exhaustive switch branches and invalid union assignments.

### Task 5: Full verification and visual review

**Files:**
- Review only unless a defect is found.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: test/build evidence and representative browser screenshots.

- [ ] Run `cmd.exe /c pnpm test`.
- [ ] Run `cmd.exe /c pnpm typecheck`.
- [ ] Run `cmd.exe /c pnpm build`.
- [ ] Start the app and inspect Hub, Studio, Preview, and Present in a real browser.
- [ ] Capture representative table and code slides at presentation and thumbnail scale.
- [ ] Correct overflow, contrast, spacing, or accessibility defects and repeat the relevant checks.
- [ ] Inspect `git diff --check`, final scoped diff, and `git status --short`; do not stage or commit unrelated work.
