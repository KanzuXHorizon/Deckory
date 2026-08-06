# Deckory V2 Studio Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Studio from an inspector-driven preview into a professional direct-manipulation canvas with selection, drag, resize, rotate, snapping, layers, grouping, direct text editing and accessible keyboard operations.

**Architecture:** The scene renderer remains artifact-only. Studio adds a Deckory-owned editor state and overlay around it. `react-moveable` and `react-selecto` provide pointer controls through adapters, while all persistent changes are produced by `@deckory/scene` commands. One completed gesture creates one history transaction.

**Tech Stack:** React 19, Next.js 16, TypeScript 5.9, `react-moveable`, `react-selecto`, Vitest, Playwright, `@deckory/scene`, `@deckory/renderer`.

## Global Constraints

- This plan starts only after Plan 01 dual-document rendering passes.
- Do not persist Moveable or Selecto event objects in the deck.
- Canvas geometry uses unscaled `1280 × 720` logical pixels; zoom is view state only.
- All pointer actions have keyboard equivalents where semantically possible.
- A drag, resize, rotate, align, reorder or group operation creates exactly one undo step.
- Presenter and Preview bundles must not import editor libraries.
- Preserve current local draft, snapshot, validation and command-palette behaviors.
- Do not commit, push or publish without separate authorization.

---

### Task 1: Split Studio state from the monolithic component

**Files:**
- Create: `apps/present/components/studio-v2/studio-v2.tsx`
- Create: `apps/present/components/studio-v2/use-studio-document.ts`
- Create: `apps/present/components/studio-v2/use-studio-document.test.ts`
- Create: `apps/present/components/studio-v2/studio-types.ts`
- Modify: `apps/present/components/studio.tsx`
- Modify: `apps/present/app/studio/page.tsx`

**Interfaces:**
- Consumes: `DeckDocumentV2`, `SceneCommand`, `applySceneCommand`.
- Produces: `useStudioDocument`, `StudioSelection`, `StudioViewState`, `StudioV2`.

- [ ] **Step 1: Write failing document-hook tests**

```ts
it("commits one scene command as one history entry", () => {
  const state = createStudioDocumentState(sceneDeck);
  const next = reduceStudioDocument(state, {
    type: "commit-command",
    command: {
      type: "patch-element",
      slideId: "cover",
      elementId: "title",
      patch: { name: "Primary title" }
    }
  });
  expect(next.history.past).toHaveLength(1);
  expect(next.present.slides[0]!.elements[0]!.name).toBe("Primary title");
});

it("stores zoom and panel state outside the document history", () => {
  const state = createStudioDocumentState(sceneDeck);
  const next = reduceStudioDocument(state, { type: "set-zoom", zoom: 1.25 });
  expect(next.history.past).toHaveLength(0);
  expect(next.view.zoom).toBe(1.25);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `pnpm --filter @deckory/present test -- components/studio-v2/use-studio-document.test.ts`

Expected: FAIL because the V2 Studio state module does not exist.

- [ ] **Step 3: Implement the editor reducer and hook**

Keep these concerns separate:

```ts
export type StudioSelection = {
  slideId: string;
  elementIds: string[];
  primaryElementId?: string;
};

export type StudioViewState = {
  zoom: "fit" | number;
  pan: { x: number; y: number };
  activeTool: "select" | "text" | "shape" | "connector" | "hand";
  activeInspectorTab: StudioInspectorTab;
};
```

Document history stores valid V2 decks only. Transient pointer previews do not enter history.

- [ ] **Step 4: Make `studio.tsx` a V1/V2 router**

V1 continues using the current Studio during migration. V2 routes to `StudioV2`. Do not add compatibility branches inside every child component.

- [ ] **Step 5: Run focused verification**

```bash
pnpm --filter @deckory/present test -- components/studio-v2/use-studio-document.test.ts
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit the Studio boundary**

```bash
git add apps/present/components/studio-v2 apps/present/components/studio.tsx apps/present/app/studio/page.tsx
git commit -m "refactor(studio): isolate V2 document and view state"
```

---

### Task 2: Build selectable scene overlays and marquee selection

**Files:**
- Create: `apps/present/components/studio-v2/scene-canvas.tsx`
- Create: `apps/present/components/studio-v2/scene-canvas.test.tsx`
- Create: `apps/present/components/studio-v2/selection-overlay.tsx`
- Create: `apps/present/components/studio-v2/selection-controller.ts`
- Create: `apps/present/components/studio-v2/selection-controller.test.ts`
- Modify: `apps/present/package.json`
- Modify: `apps/present/app/workspace.css`

**Interfaces:**
- Produces: `SceneCanvas`, `SelectionController`, `resolveSelectionFromPointer`, `resolveMarqueeSelection`.
- Third-party adapters: `react-selecto` is confined to `selection-overlay.tsx`.

- [ ] **Step 1: Install editor-only dependencies**

Run:

```bash
pnpm --filter @deckory/present add react-moveable react-selecto
```

Expected: package manifest and lockfile update without changing runtime source.

- [ ] **Step 2: Write failing selection-controller tests**

```ts
it("replaces selection on plain click and toggles on shift click", () => {
  const selected = resolveSelectionFromPointer({
    current: ["title"],
    targetId: "hero",
    additive: false
  });
  expect(selected).toEqual(["hero"]);
  expect(resolveSelectionFromPointer({ current: selected, targetId: "title", additive: true }))
    .toEqual(["hero", "title"]);
});

it("does not select hidden or locked descendants through marquee", () => {
  expect(resolveMarqueeSelection(elements, marqueeRect)).toEqual(["visible-card"]);
});
```

- [ ] **Step 3: Run selection tests and confirm RED**

Run: `pnpm --filter @deckory/present test -- components/studio-v2/selection-controller.test.ts`

Expected: FAIL because the selection controller does not exist.

- [ ] **Step 4: Implement selection as pure logic**

Selection logic must handle:

- replace;
- additive toggle;
- marquee containment/intersection mode;
- group deep-select modifier;
- locked and hidden rules;
- primary selection;
- stable document order.

- [ ] **Step 5: Render Studio mode with element hit targets**

`SceneCanvas` wraps `SceneRenderer mode="studio"` and maps `data-element-id` nodes to the selection controller. The rendered slide remains visually identical to final mode except for editor overlays outside the slide artifact.

- [ ] **Step 6: Add accessible selection status**

Use an `aria-live="polite"` region that reports messages such as `Đã chọn 3 thành phần` without announcing every pointer move.

- [ ] **Step 7: Run tests and typecheck**

```bash
pnpm --filter @deckory/present test -- components/studio-v2/scene-canvas.test.tsx components/studio-v2/selection-controller.test.ts
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit selection support**

```bash
git add apps/present/components/studio-v2 apps/present/app/workspace.css apps/present/package.json pnpm-lock.yaml
git commit -m "feat(studio): add scene selection and marquee"
```

---

### Task 3: Add drag, resize and rotate transaction adapters

**Files:**
- Create: `apps/present/components/studio-v2/moveable-overlay.tsx`
- Create: `apps/present/components/studio-v2/moveable-adapter.ts`
- Create: `apps/present/components/studio-v2/moveable-adapter.test.ts`
- Modify: `apps/present/components/studio-v2/scene-canvas.tsx`
- Modify: `apps/present/app/workspace.css`

**Interfaces:**
- Produces: `beginElementTransform`, `previewElementTransform`, `commitElementTransform`, `cancelElementTransform`.
- Consumes: pure geometry and `transform-elements` command from `@deckory/scene`.

- [ ] **Step 1: Write failing adapter tests**

```ts
it("converts scaled pointer delta to logical-pixel movement", () => {
  expect(toLogicalDelta({ clientX: 24, clientY: -12 }, 0.75))
    .toEqual({ x: 32, y: -16 });
});

it("commits the final multi-element frame set once", () => {
  const transaction = createTransformTransaction(sceneDeck, "cover", ["a", "b"]);
  const result = commitTransformTransaction(transaction, {
    a: { x: 10, y: 20, width: 100, height: 80 },
    b: { x: 140, y: 20, width: 100, height: 80 }
  });
  expect(result.command.type).toBe("transform-elements");
  expect(result.command.changes).toHaveLength(2);
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm --filter @deckory/present test -- components/studio-v2/moveable-adapter.test.ts`

Expected: FAIL because adapter functions do not exist.

- [ ] **Step 3: Implement Deckory-owned transformation adapters**

Moveable callbacks may update CSS variables for transient preview. On gesture end, calculate final logical frames and dispatch one `transform-elements` command. On Escape or pointer cancellation, restore original frames and do not add history.

- [ ] **Step 4: Configure Moveable capabilities**

Enable:

- draggable;
- resizable;
- rotatable;
- groupable;
- snappable;
- keepRatio modifier;
- resize-from-center modifier.

Do not enable warp or arbitrary scale in the first release because they complicate export fidelity and text layout.

- [ ] **Step 5: Add keyboard transforms**

Arrow keys nudge by 1 logical pixel; Shift+Arrow nudges by 10. Keyboard transformations must use the same command path as pointer gestures.

- [ ] **Step 6: Verify behavior tests**

```bash
pnpm --filter @deckory/present test -- components/studio-v2/moveable-adapter.test.ts components/studio-v2/scene-canvas.test.tsx
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit manipulation**

```bash
git add apps/present/components/studio-v2 apps/present/app/workspace.css
git commit -m "feat(studio): manipulate scene elements directly"
```

---

### Task 4: Implement snapping, guides, alignment and distribution

**Files:**
- Create: `packages/scene/src/guides.ts`
- Create: `packages/scene/src/guides.test.ts`
- Create: `packages/scene/src/alignment.ts`
- Create: `packages/scene/src/alignment.test.ts`
- Modify: `packages/scene/src/index.ts`
- Create: `apps/present/components/studio-v2/canvas-guides.tsx`
- Modify: `apps/present/components/studio-v2/moveable-overlay.tsx`
- Modify: `apps/present/components/studio-v2/studio-v2.tsx`

**Interfaces:**
- Produces: `collectSnapGuides`, `snapFrame`, `alignElements`, `distributeElements`, `CanvasGuides`.

- [ ] **Step 1: Write failing guide tests**

```ts
it("snaps an element center to the slide center within tolerance", () => {
  const result = snapFrame(
    { x: 532, y: 200, width: 200, height: 120 },
    collectSnapGuides({ width: 1280, height: 720 }, [], []),
    { tolerance: 10 }
  );
  expect(result.frame.x).toBe(540);
  expect(result.matches.some((match) => match.kind === "canvas-center-x")).toBe(true);
});
```

- [ ] **Step 2: Write failing alignment tests**

```ts
it("distributes three elements with equal horizontal gaps", () => {
  const result = distributeElements(frames, "horizontal");
  const firstGap = result[1]!.x - (result[0]!.x + result[0]!.width);
  const secondGap = result[2]!.x - (result[1]!.x + result[1]!.width);
  expect(firstGap).toBe(secondGap);
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm --filter @deckory/scene test -- src/guides.test.ts src/alignment.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 4: Implement deterministic geometry operations**

Guide sources:

- canvas edge/center;
- master safe area;
- custom slide guides;
- sibling edge/center;
- text baseline metadata;
- auto-layout padding and gap.

Snap tolerance is supplied in logical pixels after zoom conversion.

- [ ] **Step 5: Add canvas guide rendering and toolbar actions**

Render guide lines and distance labels outside the artifact DOM. Add alignment/distribution buttons with explicit disabled reasons when fewer elements are selected than required.

- [ ] **Step 6: Verify package and Studio tests**

```bash
pnpm --filter @deckory/scene test
pnpm --filter @deckory/present test -- components/studio-v2
pnpm --filter @deckory/scene typecheck
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit guides and alignment**

```bash
git add packages/scene/src/guides.ts packages/scene/src/guides.test.ts packages/scene/src/alignment.ts packages/scene/src/alignment.test.ts packages/scene/src/index.ts apps/present/components/studio-v2
git commit -m "feat(studio): add smart guides and alignment"
```

---

### Task 5: Add hierarchy, grouping and Layers panel

**Files:**
- Create: `packages/scene/src/hierarchy.ts`
- Create: `packages/scene/src/hierarchy.test.ts`
- Modify: `packages/scene/src/commands.ts`
- Modify: `packages/scene/src/commands.test.ts`
- Create: `apps/present/components/studio-v2/layers-panel.tsx`
- Create: `apps/present/components/studio-v2/layers-panel.test.tsx`
- Modify: `apps/present/components/studio-v2/studio-v2.tsx`
- Modify: `apps/present/app/workspace.css`

**Interfaces:**
- Produces: `groupElements`, `ungroupElement`, `reparentElements`, `flattenSceneHierarchy`, Layers UI.

- [ ] **Step 1: Write failing hierarchy tests**

```ts
it("groups selected elements without changing their visual positions", () => {
  const result = groupElements(slide, ["a", "b"], "feature-group");
  const before = absoluteFrames(slide);
  const after = absoluteFrames(result.slide);
  expect(after.a).toEqual(before.a);
  expect(after.b).toEqual(before.b);
});

it("rejects hierarchy cycles", () => {
  expect(() => reparentElements(slide, ["parent"], "child")).toThrow(/chu kỳ/i);
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/scene test -- src/hierarchy.test.ts`

Expected: FAIL because hierarchy operations do not exist.

- [ ] **Step 3: Implement hierarchy commands with inverse operations**

Grouping calculates a parent frame from child bounds and converts child frames to parent-local coordinates. Ungroup restores slide-local coordinates.

- [ ] **Step 4: Build accessible Layers tree**

Required behavior:

- hierarchical tree semantics;
- Arrow keys navigate;
- Enter selects;
- Space toggles additive selection;
- F2 renames;
- drag reorder and reparent;
- lock/hide toggles;
- search;
- reveal primary selection.

- [ ] **Step 5: Verify hierarchy and UI tests**

```bash
pnpm --filter @deckory/scene test -- src/hierarchy.test.ts src/commands.test.ts
pnpm --filter @deckory/present test -- components/studio-v2/layers-panel.test.tsx
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit layers and grouping**

```bash
git add packages/scene/src/hierarchy.ts packages/scene/src/hierarchy.test.ts packages/scene/src/commands.ts packages/scene/src/commands.test.ts apps/present/components/studio-v2/layers-panel.tsx apps/present/components/studio-v2/layers-panel.test.tsx apps/present/components/studio-v2/studio-v2.tsx apps/present/app/workspace.css
git commit -m "feat(studio): add layers and scene grouping"
```

---

### Task 6: Add direct text editing and progressive Inspector

**Files:**
- Create: `apps/present/components/studio-v2/text-edit-overlay.tsx`
- Create: `apps/present/components/studio-v2/text-edit-overlay.test.tsx`
- Create: `apps/present/components/studio-v2/inspector/scene-inspector.tsx`
- Create: `apps/present/components/studio-v2/inspector/scene-inspector.test.tsx`
- Create: `apps/present/components/studio-v2/inspector/field-registry.ts`
- Create: `apps/present/components/studio-v2/inspector/field-registry.test.ts`
- Modify: `apps/present/components/studio-v2/studio-v2.tsx`
- Modify: `apps/present/app/workspace.css`

**Interfaces:**
- Produces: direct plain/rich-text editing and Inspector tabs `content`, `layout`, `style`, `data`, `motion`, `interaction`, `accessibility`, `export`, `quality`.

- [ ] **Step 1: Write failing text-edit tests**

```tsx
it("commits text on blur as one patch command", () => {
  const { result } = renderTextEditor({ initial: "Cũ", next: "Mới" });
  expect(result.commands).toEqual([expect.objectContaining({
    type: "patch-element",
    patch: { content: { text: "Mới" } }
  })]);
});

it("cancels editing on Escape", () => {
  const { result } = renderTextEditor({ initial: "Cũ", next: "Mới", cancel: true });
  expect(result.commands).toHaveLength(0);
});
```

- [ ] **Step 2: Run text tests and confirm RED**

Run: `pnpm --filter @deckory/present test -- components/studio-v2/text-edit-overlay.test.tsx`

Expected: FAIL because the editor does not exist.

- [ ] **Step 3: Implement direct text edit mode**

Use a controlled editing surface positioned over the rendered text frame. Do not mutate rendered DOM as the source of truth. Enter or double-click begins editing; Escape cancels; blur or Ctrl+Enter commits.

- [ ] **Step 4: Write failing field-registry tests**

```ts
it("shows only relevant fields for an image element", () => {
  expect(fieldsForElement(imageElement).map((field) => field.id)).toEqual(expect.arrayContaining([
    "content.asset-id", "style.object-fit", "style.focal-point", "accessibility.label"
  ]));
  expect(fieldsForElement(imageElement).map((field) => field.id)).not.toContain("data.chart-unit");
});
```

- [ ] **Step 5: Build the progressive Inspector**

Do not hardcode one giant conditional component. Register field definitions by element kind and semantic capability. Every field includes label, help text, validation and update path.

- [ ] **Step 6: Run focused verification**

```bash
pnpm --filter @deckory/present test -- components/studio-v2/text-edit-overlay.test.tsx components/studio-v2/inspector
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit direct editing and Inspector**

```bash
git add apps/present/components/studio-v2 apps/present/app/workspace.css
git commit -m "feat(studio): edit scene content and properties directly"
```

---

### Task 7: Implement constraints, sizing policies and auto layout

**Files:**
- Create: `packages/scene/src/layout/constraints.ts`
- Create: `packages/scene/src/layout/constraints.test.ts`
- Create: `packages/scene/src/layout/auto-layout.ts`
- Create: `packages/scene/src/layout/auto-layout.test.ts`
- Create: `packages/scene/src/layout/sizing.ts`
- Create: `packages/scene/src/layout/sizing.test.ts`
- Modify: `packages/scene/src/index.ts`
- Modify: `packages/scene/src/commands.ts`
- Modify: `packages/scene/src/commands.test.ts`
- Create: `apps/present/components/studio-v2/layout/auto-layout-panel.tsx`
- Create: `apps/present/components/studio-v2/layout/auto-layout-panel.test.tsx`
- Create: `apps/present/components/studio-v2/layout/constraint-controls.tsx`
- Create: `apps/present/components/studio-v2/layout/constraint-controls.test.tsx`
- Modify: `apps/present/components/studio-v2/inspector/field-registry.ts`
- Modify: `apps/present/components/studio-v2/studio-v2.tsx`

**Interfaces:**
- Produces: `resolveConstraints`, `layoutStack`, `layoutGrid`, `convertGroupLayoutMode`, `LayoutSizingPolicy` and Studio controls for freeform, constraint and auto-layout modes.

- [ ] **Step 1: Write failing constraint tests**

```ts
it("keeps a right-anchored element attached when its parent grows", () => {
  const result = resolveConstraints({
    originalParent: { width: 600, height: 400 },
    nextParent: { width: 800, height: 400 },
    child: { x: 420, y: 40, width: 140, height: 80 },
    constraints: { horizontal: "right", vertical: "top" }
  });
  expect(result).toEqual({ x: 620, y: 40, width: 140, height: 80 });
});

it("stretches an element without violating its minimum size", () => {
  const result = resolveConstraints(stretchFixture);
  expect(result.width).toBeGreaterThanOrEqual(stretchFixture.minimumSize.width);
});
```

- [ ] **Step 2: Write failing auto-layout tests**

```ts
it("lays out a horizontal stack with deterministic padding and gaps", () => {
  const result = layoutStack({
    frame: { x: 100, y: 100, width: 600, height: 180 },
    direction: "horizontal",
    padding: { top: 20, right: 24, bottom: 20, left: 24 },
    gap: 16,
    children: [fixedChild("a", 120, 80), fillChild("b"), fixedChild("c", 100, 80)]
  });
  expect(result.frames.a.x).toBe(124);
  expect(result.frames.c.x + result.frames.c.width).toBe(676);
  expect(result.frames.b.width).toBe(308);
});

it("converts a freeform group to auto layout without changing its initial visual bounds", () => {
  const result = convertGroupLayoutMode(freeformGroup, "stack-horizontal");
  expect(result.beforeBounds).toEqual(result.afterBounds);
});

it("returns a diagnostic when hug-content exceeds the parent maximum", () => {
  const result = layoutStack(overfullHugContentFixture);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.diagnostics[0]?.code).toBe("auto-layout-does-not-fit");
});
```

- [ ] **Step 3: Run layout tests and confirm RED**

Run:

```bash
pnpm --filter @deckory/scene test -- src/layout/constraints.test.ts src/layout/auto-layout.test.ts src/layout/sizing.test.ts
```

Expected: FAIL because the layout engine does not exist.

- [ ] **Step 4: Implement deterministic layout policies**

Required sizing modes:

- fixed;
- hug-content;
- fill-container;
- min/max bounded fixed;
- aspect-ratio constrained.

Auto-layout supports horizontal/vertical stack and explicit grid. It resolves padding, gap, alignment, distribution, wrapping and child sizing without reading browser viewport geometry. Text and registered components provide intrinsic-size measurements through a typed callback.

- [ ] **Step 5: Add reversible layout-mode commands**

Add commands for:

- convert group to freeform, constraint, stack or grid;
- patch padding, gap, direction, alignment and sizing;
- detach one child from auto layout while preserving its absolute frame;
- restore the previous layout mode through the generated inverse command.

Switching modes must preserve the current visual bounds and create one history entry.

- [ ] **Step 6: Build the Layout Inspector controls**

The panel exposes:

- layout mode;
- direction and wrap;
- gap and independent padding;
- horizontal/vertical alignment;
- fixed, hug and fill sizing per child;
- horizontal/vertical constraints;
- detach from auto layout;
- fit diagnostic with an explicit recommendation.

Controls are keyboard accessible and use Vietnamese copy. They do not expose raw JSON.

- [ ] **Step 7: Run focused verification**

```bash
pnpm --filter @deckory/scene test -- src/layout src/commands.test.ts
pnpm --filter @deckory/present test -- components/studio-v2/layout
pnpm --filter @deckory/scene typecheck
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit layout modes**

```bash
git add packages/scene/src/layout packages/scene/src/index.ts packages/scene/src/commands.ts packages/scene/src/commands.test.ts apps/present/components/studio-v2/layout apps/present/components/studio-v2/inspector/field-registry.ts apps/present/components/studio-v2/studio-v2.tsx
git commit -m "feat(studio): add constraints and auto layout"
```

---

### Task 8: Browser QA for interaction, responsive behavior and history

**Files:**
- Create: `tests/e2e/studio-v2-canvas.spec.ts`
- Modify: `playwright.config.ts` only when a V2-specific project setting is required.
- Evidence: `output/playwright/screenshots/<run-id>/studio-v2-*`

**Interfaces:**
- Verifies the complete V2 Studio vertical slice.

- [ ] **Step 1: Add E2E interaction scenarios**

Cover:

- select by canvas and Layers;
- shift multi-select;
- drag and undo;
- resize and redo;
- keyboard nudge;
- align and distribute;
- group/ungroup;
- convert a group to auto layout, change gap and undo;
- resize a constrained parent and verify anchored children;
- detach a child from auto layout while preserving its visual frame;
- rename, lock and hide;
- direct text edit and cancel;
- autosave and reload;
- reduced motion;
- 200% browser zoom;
- narrow Inspector drawer;
- no console errors.

- [ ] **Step 2: Run E2E and confirm failures before completing missing behavior**

Run: `pnpm test:e2e -- tests/e2e/studio-v2-canvas.spec.ts`

Expected before final fixes: one or more assertions FAIL on the first incomplete interaction.

- [ ] **Step 3: Correct only defects exposed by the V2 scenarios**

Do not redesign unrelated V1 surfaces in this task.

- [ ] **Step 4: Re-run E2E and inspect screenshots**

Run: `pnpm test:e2e -- tests/e2e/studio-v2-canvas.spec.ts`

Expected: PASS. Inspect full-size and narrow screenshots for clipped controls, unreadable labels, overlay drift and selection handles outside the visible canvas.

- [ ] **Step 5: Run plan-level verification**

```bash
pnpm --filter @deckory/scene test
pnpm --filter @deckory/present test
pnpm --filter @deckory/scene typecheck
pnpm --filter @deckory/present typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit the verified canvas slice**

```bash
git add tests/e2e/studio-v2-canvas.spec.ts apps/present packages/scene pnpm-lock.yaml
git commit -m "test(studio): prove V2 canvas editing flow"
```

## Plan Self-Review

- Spec coverage: direct selection, manipulation, snapping, guides, alignment, grouping, hierarchy, constraints, auto layout, sizing, layers, text editing, Inspector, keyboard, persistence and browser QA are covered.
- Placeholder scan: every interaction has a concrete command path and verification scenario.
- Type consistency: Studio view state remains separate from `DeckDocumentV2`; all mutations use `SceneCommand`.
- Exit condition: Plan 03 starts only when a V2 deck can be edited visually, undone, saved, reloaded and presented without importing editor dependencies into Presenter.
