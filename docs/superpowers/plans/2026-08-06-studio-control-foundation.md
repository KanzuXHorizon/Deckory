# Deckory Studio Control Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Studio a fast, safe and professional editor for refining agent-generated decks through undo/redo, command search, slide search, canvas zoom and motion replay.

**Architecture:** Keep `DeckDocument` as the sole source of editable truth. Add pure history and command-search modules under `apps/present/lib`, small focused UI components under `apps/present/components`, and integrate them into Studio without changing the schema or bypassing the shared renderer. Preserve local draft snapshots and existing confirmation flows.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Vitest 4, Motion 13, Lucide React, Deckory typed schema.

## Global Constraints

- Preserve the existing Deckory editorial control-room identity.
- Do not introduce arbitrary JSX, inline coordinates, remote runtime assets or unvalidated animation objects into deck documents.
- Do not add dependencies.
- Keep all user-facing copy in professional Vietnamese.
- Keep Studio usable at 320, 375, 768, 1024 and 1440 CSS pixels and 200% zoom.
- Support keyboard access, visible focus and `prefers-reduced-motion`.
- Keep history bounded to 100 document states.
- Keep existing local draft and named snapshot behavior operational.
- Do not reset, delete or overwrite unrelated working-tree changes.

---

### Task 1: Pure document history model

**Files:**
- Create: `apps/present/lib/document-history.ts`
- Create: `apps/present/lib/document-history.test.ts`

**Interfaces:**
- Consumes: `DeckDocument` from `@deckory/schema`.
- Produces:
  - `type DocumentHistory<T> = { past: T[]; present: T; future: T[] }`
  - `createDocumentHistory<T>(present: T): DocumentHistory<T>`
  - `pushDocumentHistory<T>(history: DocumentHistory<T>, next: T, limit?: number): DocumentHistory<T>`
  - `undoDocumentHistory<T>(history: DocumentHistory<T>): DocumentHistory<T>`
  - `redoDocumentHistory<T>(history: DocumentHistory<T>): DocumentHistory<T>`
  - `resetDocumentHistory<T>(present: T): DocumentHistory<T>`
  - `canUndoDocumentHistory<T>(history: DocumentHistory<T>): boolean`
  - `canRedoDocumentHistory<T>(history: DocumentHistory<T>): boolean`

- [ ] **Step 1: Write failing tests for push, undo, redo, cap and branch invalidation**

```ts
import { describe, expect, it } from "vitest";
import {
  canRedoDocumentHistory,
  canUndoDocumentHistory,
  createDocumentHistory,
  pushDocumentHistory,
  redoDocumentHistory,
  undoDocumentHistory
} from "./document-history";

describe("document history", () => {
  it("undoes and redoes document states", () => {
    const initial = createDocumentHistory({ title: "A" });
    const changed = pushDocumentHistory(initial, { title: "B" });
    const undone = undoDocumentHistory(changed);
    expect(undone.present.title).toBe("A");
    expect(canRedoDocumentHistory(undone)).toBe(true);
    expect(redoDocumentHistory(undone).present.title).toBe("B");
  });

  it("invalidates the redo branch after a new mutation", () => {
    const changed = pushDocumentHistory(createDocumentHistory(1), 2);
    const branched = pushDocumentHistory(undoDocumentHistory(changed), 3);
    expect(branched.future).toEqual([]);
    expect(canUndoDocumentHistory(branched)).toBe(true);
  });

  it("caps stored history", () => {
    let history = createDocumentHistory(0);
    for (let value = 1; value <= 105; value += 1) {
      history = pushDocumentHistory(history, value, 100);
    }
    expect(history.past).toHaveLength(100);
    expect(history.past[0]).toBe(5);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails because the module does not exist**

Run: `pnpm --filter @deckory/present test -- lib/document-history.test.ts`

Expected: FAIL with module resolution error for `./document-history`.

- [ ] **Step 3: Implement the pure bounded history functions**

```ts
export type DocumentHistory<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function createDocumentHistory<T>(present: T): DocumentHistory<T> {
  return { past: [], present, future: [] };
}

export function pushDocumentHistory<T>(history: DocumentHistory<T>, next: T, limit = 100): DocumentHistory<T> {
  if (Object.is(history.present, next)) return history;
  const past = [...history.past, history.present];
  return {
    past: past.slice(Math.max(0, past.length - Math.max(1, limit))),
    present: next,
    future: []
  };
}

export function undoDocumentHistory<T>(history: DocumentHistory<T>): DocumentHistory<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future]
  };
}

export function redoDocumentHistory<T>(history: DocumentHistory<T>): DocumentHistory<T> {
  const next = history.future[0];
  if (next === undefined) return history;
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1)
  };
}

export function resetDocumentHistory<T>(present: T): DocumentHistory<T> {
  return createDocumentHistory(present);
}

export function canUndoDocumentHistory<T>(history: DocumentHistory<T>): boolean {
  return history.past.length > 0;
}

export function canRedoDocumentHistory<T>(history: DocumentHistory<T>): boolean {
  return history.future.length > 0;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm --filter @deckory/present test -- lib/document-history.test.ts`

Expected: PASS.

### Task 2: Command and slide search model

**Files:**
- Create: `apps/present/lib/studio-command-catalog.ts`
- Create: `apps/present/lib/studio-command-catalog.test.ts`

**Interfaces:**
- Produces:
  - `type StudioCommandId = "save" | "undo" | "redo" | "preview" | "present" | "export" | "add-slide" | "add-component" | "motion-replay" | "reset-draft"`
  - `type StudioCommand = { id: StudioCommandId; label: string; description: string; keywords: string[]; disabled?: boolean }`
  - `normalizeStudioSearch(value: string): string`
  - `filterStudioCommands(commands: readonly StudioCommand[], query: string): StudioCommand[]`
  - `filterStudioSlides(slides: readonly Slide[], query: string): Slide[]`

- [ ] **Step 1: Write failing tests for Vietnamese normalization and relevance**

```ts
it("matches Vietnamese text without requiring diacritics", () => {
  expect(normalizeStudioSearch("Chuyển động")).toBe("chuyen dong");
});

it("matches commands by label, description and keyword", () => {
  const results = filterStudioCommands(commands, "trinh chieu");
  expect(results[0]?.id).toBe("present");
});

it("matches slides by heading, id and layout", () => {
  expect(filterStudioSlides(slides, "kien truc").map((slide) => slide.id)).toEqual(["architecture"]);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm --filter @deckory/present test -- lib/studio-command-catalog.test.ts`

Expected: FAIL because the command catalog module does not exist.

- [ ] **Step 3: Implement deterministic normalized search**

Use Unicode NFD normalization, strip combining marks, map `đ` to `d`, lowercase with the Vietnamese locale and score exact prefix matches before substring matches. Use existing `slideTitle(slide)` for slide display text.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm --filter @deckory/present test -- lib/studio-command-catalog.test.ts`

Expected: PASS.

### Task 3: Accessible command palette

**Files:**
- Create: `apps/present/components/studio-command-palette.tsx`
- Create: `apps/present/components/studio-command-palette.test.tsx`

**Interfaces:**
- Consumes:
  - `commands: readonly StudioCommand[]`
  - `slides: readonly Slide[]`
  - `open: boolean`
  - `onOpenChange(open: boolean): void`
  - `onCommand(commandId: StudioCommandId): void`
  - `onSelectSlide(slideId: string): void`
- Produces: `StudioCommandPalette`.

- [ ] **Step 1: Write failing static-render tests**

Cover dialog semantics, search label, command labels, disabled state, slide result labels and empty state copy.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm --filter @deckory/present test -- components/studio-command-palette.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the palette**

Implementation requirements:

- `role="dialog"`, `aria-modal="true"`, heading and description IDs;
- autofocus search field when opened;
- Escape closes and restores focus through the parent opener;
- ArrowUp and ArrowDown move the active result;
- Enter executes the active result;
- disabled commands remain visible with an explanation but cannot execute;
- results contain a command section and a slide section;
- query normalization uses Task 2 functions;
- no dependency additions.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm --filter @deckory/present test -- components/studio-command-palette.test.tsx`

Expected: PASS.

### Task 4: Motion-capable Studio canvas preview

**Files:**
- Modify: `apps/present/components/deck-thumbnail.tsx`
- Modify: `apps/present/components/deck-thumbnail.test.tsx`

**Interfaces:**
- Extend `ScaledSlidePreviewProps` with:
  - `motionDisabled?: boolean`
  - `reducedMotion?: boolean`
  - `previewKey?: string | number`
- `DeckThumbnail` always forces static fully revealed rendering.

- [ ] **Step 1: Write a failing test proving Studio preview can opt into motion while thumbnails remain static**

Assert the rendered Studio preview does not force `data-motion-disabled` when `motionDisabled={false}`, while `DeckThumbnail` still renders static behavior.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm --filter @deckory/present test -- components/deck-thumbnail.test.tsx`

Expected: FAIL because the props are unsupported.

- [ ] **Step 3: Implement explicit motion props and remount key**

`ScaledSlidePreview` defaults to static behavior for backwards compatibility. Studio passes `motionDisabled={false}` only during replay. The canvas key changes for each replay so entrance effects restart. Thumbnail behavior never changes.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm --filter @deckory/present test -- components/deck-thumbnail.test.tsx`

Expected: PASS.

### Task 5: Integrate history, palette, search, zoom and replay into Studio

**Files:**
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/components/studio-responsive.test.tsx`
- Modify: `apps/present/components/studio-controls.test.tsx`

**Interfaces:**
- Consumes Tasks 1–4.
- Produces user-visible Studio controls and keyboard behavior.

- [ ] **Step 1: Add failing tests for visible controls and semantic states**

Static tests must assert:

- buttons named `Hoàn tác` and `Làm lại` exist and begin disabled;
- a command trigger named `Mở bảng lệnh` exists;
- slide search input named `Tìm slide` exists;
- canvas zoom controls expose Fit, 75%, 100% and 125%;
- motion replay button has an explanatory disabled state when the selected slide has no authored motion.

- [ ] **Step 2: Run focused Studio tests and verify failure**

Run: `pnpm --filter @deckory/present test -- components/studio-responsive.test.tsx components/studio-controls.test.tsx`

Expected: FAIL on missing controls.

- [ ] **Step 3: Replace direct deck state with bounded history state**

Use `DocumentHistory<DeckDocument>` as the document mutation boundary. `updateDeck` pushes a new present state and marks the draft dirty. Undo and redo update the history state, preserve current selection when possible, fall back to the first valid slide/component and mark the draft dirty.

Reset and snapshot restore call `resetDocumentHistory(restoredDeck)` so undo cannot cross a source or named-version boundary.

- [ ] **Step 4: Add keyboard shortcuts with editable-target protection**

Global behavior:

```ts
const modifier = event.metaKey || event.ctrlKey;
if (!modifier) return;
if (event.key.toLowerCase() === "k") openPalette();
if (event.key.toLowerCase() === "z" && event.shiftKey) redo();
else if (event.key.toLowerCase() === "z") undo();
else if (event.key.toLowerCase() === "y") redo();
```

Do not intercept undo/redo while the target is an `input`, `textarea`, `select` or content-editable element. `Ctrl/Cmd+K` may open from editable targets because it is an application command.

- [ ] **Step 5: Add slide search and command execution**

Filter the rail with Task 2. Display `Không có slide phù hợp` with a clear-search action when no result matches. Command actions reuse existing Studio functions and routes; destructive reset still opens the existing confirmation dialog.

- [ ] **Step 6: Add canvas zoom and motion replay**

Store `"fit" | 0.75 | 1 | 1.25` as view-only state. Fit uses the existing responsive preview. Numeric zoom sizes the 1280×720 canvas inside a scrollable viewport without changing slide geometry.

Replay behavior:

- set a replay token;
- temporarily set `sequenceStep` to `0`;
- advance through authored sequence steps on a bounded timer;
- pass `motionDisabled={false}` and the replay token to `ScaledSlidePreview`;
- cancel timers on slide change or unmount;
- immediately show the final state under reduced motion.

- [ ] **Step 7: Run focused Studio tests and verify pass**

Run: `pnpm --filter @deckory/present test -- components/studio-responsive.test.tsx components/studio-controls.test.tsx components/studio-command-palette.test.tsx lib/document-history.test.ts lib/studio-command-catalog.test.ts`

Expected: PASS.

### Task 6: Product-quality styling and responsive behavior

**Files:**
- Modify: `apps/present/app/workspace.css`
- Modify: `apps/present/app/globals.css` only where a shared token or primitive is genuinely required.

**Interfaces:**
- Styles the semantic class names introduced by Tasks 3–5.

- [ ] **Step 1: Add command palette styling**

Use an editorial modal surface with a restrained backdrop, strong search focus, compact result rows, semantic selected state and no glass effect. Limit travel to 8px and disable spatial motion under reduced motion.

- [ ] **Step 2: Add Studio control styling**

Cover:

- undo/redo compact group;
- slide search integrated into the rail header;
- canvas zoom segmented control;
- replay state and status cue;
- numeric zoom scroll viewport;
- disabled, hover, active and focus-visible states;
- touch targets at narrow widths.

- [ ] **Step 3: Add responsive rules**

At 1040px and below, keep the command trigger, undo/redo and primary preview/present routes reachable. At 640px and below, make the command palette a near-full-height sheet and keep canvas zoom horizontally scrollable.

- [ ] **Step 4: Run typecheck and the complete app tests**

Run: `pnpm --filter @deckory/present typecheck`

Run: `pnpm --filter @deckory/present test`

Expected: PASS.

### Task 7: Browser evidence and regression gates

**Files:**
- Modify only if a reproduced defect requires correction.
- Evidence output: `output/playwright/screenshots/<run-id>/`.

**Interfaces:**
- Validates the complete slice in the real application.

- [ ] **Step 1: Build and run focused browser checks**

Run: `pnpm build`

Run: `pnpm test:e2e`

Expected: production build and browser flows pass.

- [ ] **Step 2: Review Studio at required viewports**

Inspect 320, 375, 768, 1024 and 1440 CSS pixels plus 200% zoom. Verify:

- command palette search and keyboard selection;
- undo/redo state and shortcuts;
- slide search empty and populated states;
- Fit, 75%, 100% and 125% canvas behavior;
- replay and reduced-motion behavior;
- inspector drawer, focus restoration and no clipping;
- no console errors.

- [ ] **Step 3: Run repository gates**

Run:

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm audit:decks -- --strict
pnpm assets:check
pnpm build
```

Expected: all commands pass.

- [ ] **Step 4: Inspect final scope**

Run: `git diff --stat` and `git status --short`.

Confirm that only the intended Studio foundation files and pre-existing unrelated changes remain. Do not stage or commit without explicit authorization.
