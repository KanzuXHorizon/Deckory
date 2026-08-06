# Parallel Session A Prompt — Studio Canvas, Constraints and Auto Layout

```text
@Deckory

You are the Deckory V2 Studio Canvas and Layout Engine implementation session.

Mission

Build the independent Studio-layout core for Deckory V2: deterministic constraints, fixed/hug/fill sizing, stack/grid auto layout, hierarchy, alignment, guides and the focused canvas adapters required for professional direct manipulation.

This session is one of four parallel sessions. Your highest priority is isolation and integration safety, not touching every UI surface.

Required reading

1. Read the repository root AGENTS.md, PRODUCT.md and DESIGN.md.
2. Read:
   - docs/superpowers/specs/2026-08-06-deckory-v2-program-design.md
   - docs/superpowers/plans/2026-08-06-deckory-v2-02-studio-canvas.md
   - docs/superpowers/plans/2026-08-06-deckory-v2-parallel-execution.md
3. Read all nested instructions for packages/scene and apps/present before editing those paths.
4. Use the relevant Superpowers skills: using-git-worktrees, test-driven-development, systematic-debugging when needed, and verification-before-completion.

Start gate

Plan 01 Scene Foundation must already be accepted on an integration commit. Resolve that exact accepted commit from the coordinator-provided branch or execution context. If you cannot prove the accepted Scene Foundation base, stop and report the missing gate. Do not guess a base revision.

Workspace safety

- Create and use a dedicated managed worktree from the accepted Scene Foundation commit.
- Record branch, full HEAD, git status, worktrees and baseline test results.
- Never use the user's dirty checkout as the implementation workspace.
- Never reset, clean, overwrite, stage or commit unrelated changes.
- Do not push, merge or publish.

Exclusive production ownership

You may create or modify only:

- packages/scene/src/layout/**
- packages/scene/src/guides.ts and matching tests
- packages/scene/src/alignment.ts and matching tests
- packages/scene/src/hierarchy.ts and matching tests
- focused new files under:
  - apps/present/components/studio-v2/canvas/**
  - apps/present/components/studio-v2/layers/**
  - apps/present/components/studio-v2/layout/**
- tests colocated with those owned files
- docs/superpowers/parallel/manifests/studio-layout.md
- docs/superpowers/parallel/requests/studio-layout-*.md when a frozen contract change is required

Forbidden parallel edits

Do not modify:

- packages/schema/**
- packages/sdk/**
- packages/visuals/**
- packages/themes/**
- pnpm-lock.yaml
- root package.json
- shared package barrel files
- route entrypoints
- apps/present/components/studio-v2/studio-v2.tsx
- renderer shared roots
- files owned by another parallel session

If a shared export, dependency, schema field or Studio-root wire-up is required, record an exact integration request instead of editing the shared file.

Implementation scope

Implement the pure and independently testable core from Plan 02, prioritizing:

1. Constraint resolution:
   - left, right, center, stretch and scale horizontally;
   - top, bottom, center, stretch and scale vertically;
   - finite geometry and minimum-size enforcement.
2. Sizing policies:
   - fixed;
   - hug-content;
   - fill-container;
   - min/max bounds;
   - aspect-ratio constraints.
3. Auto layout:
   - horizontal and vertical stacks;
   - explicit grid;
   - padding, gap, alignment, distribution and wrap;
   - deterministic intrinsic-size callback;
   - actionable does-not-fit diagnostics.
4. Reversible layout conversion:
   - freeform ↔ constraint ↔ stack ↔ grid;
   - preserve current visual bounds;
   - generate inverse commands for undo.
5. Geometry helpers for alignment, distribution, hierarchy and smart guides.
6. Focused UI modules inside the owned Studio subdirectories. These modules may expose props and callbacks, but do not wire the Studio root.
7. Keyboard-accessible controls and professional Vietnamese copy in owned UI modules.

Do not implement unrelated visual design, custom components, charts, diagrams, themes, motion or exports.

Engineering method

- Follow strict red-green-refactor.
- Write one focused failing test for each behavior before production code.
- Confirm RED is caused by the missing behavior.
- Implement the minimum complete behavior.
- Keep persistent logic independent of Moveable/Selecto event payloads.
- One gesture must ultimately map to one SceneCommand, but root history wiring belongs to integration.
- Reject impossible layouts with typed diagnostics; never clip or silently shrink below declared minimums.
- Do not create generic abstractions that hide layout behavior.

Required verification

Run all commands available from the accepted base that cover owned code, including at minimum:

- focused packages/scene tests for layout, constraints, sizing, hierarchy, guides and alignment;
- focused apps/present tests for owned Studio modules;
- packages/scene typecheck;
- apps/present typecheck when owned UI files compile without root wiring.

Do not claim the full Studio flow passes because root integration is intentionally deferred.

Deliverables

1. Small logical commits containing only owned paths.
2. Fresh RED/GREEN evidence for each implemented behavior.
3. docs/superpowers/parallel/manifests/studio-layout.md containing:
   - exact base commit and branch;
   - changed files;
   - commits;
   - tests and outputs;
   - shared export/dependency/schema requests;
   - exact Studio-root integration instructions;
   - unresolved risks and browser QA still required.
4. Return a concise final report with the exact commit SHAs. Do not merge or push.
```
