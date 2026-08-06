# Deckory V2 Scene Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `DeckDocumentV2`, deterministic V1 migration, immutable scene commands and a shared renderer while preserving every existing V1 deck and presentation flow.

**Architecture:** `@deckory/schema` owns the public V1/V2 validation boundary. New `@deckory/scene` owns geometry, commands, migration and serialization. New `@deckory/renderer` owns the shared DOM/SVG artifact consumed by Studio, Preview, Presenter, thumbnails and export. V1 remains supported through an adapter until all production decks are migrated.

**Tech Stack:** TypeScript 5.9, Zod 4, React 19, Motion 13, Vitest 4, Next.js 16, pnpm workspaces.

## Global Constraints

- Work against the exact checkout revision recorded at task start; do not reset or overwrite unrelated dirty files.
- Keep `DeckDocument` V1 validation and rendering operational throughout this plan.
- Canonical V2 canvas is `1280 × 720` logical pixels.
- All IDs are stable kebab-case IDs.
- No arbitrary JSX, raw HTML, remote assets or renderer-specific event payloads enter `DeckDocumentV2`.
- Vietnamese user-facing diagnostics must be specific and actionable.
- Every behavior change follows red-green-refactor and ends with a focused commit.
- Do not push, publish or merge without separate authorization.

---

### Task 1: Add the versioned V2 document schema

**Files:**
- Create: `packages/schema/src/v2.ts`
- Create: `packages/schema/src/v2.test.ts`
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/package.json`

**Interfaces:**
- Produces: `DeckDocumentV2Schema`, `SceneSlideSchema`, `SceneElementSchema`, `DeckDocumentV2`, `SceneSlide`, `SceneElement`, `Frame`, `BackgroundStack`.
- Preserves: existing `DeckDocumentSchema`, `DeckDocument`, `validateDeck`.

- [ ] **Step 1: Write failing schema tests**

```ts
import { describe, expect, it } from "vitest";
import { DeckDocumentV2Schema } from "./v2";

const validDeck = {
  schemaVersion: 2,
  id: "scene-fixture",
  revision: 1,
  title: "Scene fixture",
  locale: "vi-VN",
  canvas: { width: 1280, height: 720, unit: "px" },
  theme: { id: "deckory-editorial", tokens: {} },
  assets: [],
  slides: [{
    id: "cover",
    name: "Cover",
    background: { layers: [{ id: "paper", type: "solid", color: "#ffffff", opacity: 1 }] },
    elements: [{
      id: "title",
      name: "Title",
      kind: "text",
      frame: { x: 72, y: 64, width: 720, height: 140 },
      zIndex: 1,
      content: { text: "Deckory V2" },
      accessibility: { label: "Deckory V2" }
    }]
  }]
};

describe("DeckDocumentV2Schema", () => {
  it("accepts an explicit scene document", () => {
    expect(DeckDocumentV2Schema.parse(validDeck).schemaVersion).toBe(2);
  });

  it("rejects non-finite geometry", () => {
    const invalid = structuredClone(validDeck);
    invalid.slides[0]!.elements[0]!.frame.x = Number.NaN;
    expect(() => DeckDocumentV2Schema.parse(invalid)).toThrow();
  });

  it("rejects duplicate element IDs within one slide", () => {
    const invalid = structuredClone(validDeck);
    invalid.slides[0]!.elements.push(structuredClone(invalid.slides[0]!.elements[0]!));
    expect(() => DeckDocumentV2Schema.parse(invalid)).toThrow(/element ID/i);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `pnpm --filter @deckory/schema test -- src/v2.test.ts`

Expected: FAIL because `./v2` and `DeckDocumentV2Schema` do not exist.

- [ ] **Step 3: Implement the strict V2 schemas**

Create discriminated schemas for:

```ts
export const SceneElementKindSchema = z.enum([
  "group", "stack", "grid", "text", "rich-text", "image", "icon",
  "shape", "line", "connector", "svg", "chart", "table", "diagram",
  "media", "component-instance", "web-block", "evidence-footer"
]);

export const FrameSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive()
}).strict();
```

Add strict schemas for canvas, background layers, transforms, constraints, accessibility, semantic metadata, export policy and the element-content discriminated union. Add `superRefine` checks for duplicate slide/element/background-layer IDs and invalid parent references.

- [ ] **Step 4: Export V2 types without changing V1 names**

`packages/schema/src/index.ts` must add:

```ts
export * from "./v2";
```

Do not rename or overload `DeckDocument` in this task.

- [ ] **Step 5: Run schema tests and typecheck**

Run:

```bash
pnpm --filter @deckory/schema test
pnpm --filter @deckory/schema typecheck
```

Expected: all schema tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit the schema boundary**

```bash
git add packages/schema/src/v2.ts packages/schema/src/v2.test.ts packages/schema/src/index.ts packages/schema/package.json
git commit -m "feat(schema): add DeckDocument V2 scene contract"
```

---

### Task 2: Create scene geometry and immutable command transactions

**Files:**
- Create: `packages/scene/package.json`
- Create: `packages/scene/tsconfig.json`
- Create: `packages/scene/src/index.ts`
- Create: `packages/scene/src/geometry.ts`
- Create: `packages/scene/src/geometry.test.ts`
- Create: `packages/scene/src/commands.ts`
- Create: `packages/scene/src/commands.test.ts`

**Interfaces:**
- Consumes: `DeckDocumentV2`, `SceneElement`, `Frame` from `@deckory/schema`.
- Produces: `clampFrame`, `translateFrame`, `resizeFrame`, `rotateTransform`, `applySceneCommand`, `SceneCommand`, `SceneTransaction`.

- [ ] **Step 1: Add the package manifest**

```json
{
  "name": "@deckory/scene",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "dependencies": { "@deckory/schema": "workspace:*" }
}
```

- [ ] **Step 2: Write failing geometry tests**

```ts
it("translates a frame without mutating the input", () => {
  const input = { x: 10, y: 20, width: 100, height: 80 };
  const output = translateFrame(input, { x: 15, y: -5 });
  expect(output).toEqual({ x: 25, y: 15, width: 100, height: 80 });
  expect(input).toEqual({ x: 10, y: 20, width: 100, height: 80 });
});

it("resizes from the center while preserving ratio", () => {
  expect(resizeFrame(
    { x: 100, y: 100, width: 200, height: 100 },
    { handle: "se", deltaX: 100, deltaY: 10, keepRatio: true, fromCenter: true }
  )).toEqual({ x: 50, y: 75, width: 300, height: 150 });
});
```

- [ ] **Step 3: Run geometry tests and confirm RED**

Run: `pnpm --filter @deckory/scene test -- src/geometry.test.ts`

Expected: FAIL because the package implementation does not exist.

- [ ] **Step 4: Implement pure geometry functions**

Geometry functions must:

- return new values;
- normalize `-0` to `0`;
- round to 0.25 logical pixels;
- reject non-finite inputs;
- enforce a minimum element size of `1 × 1` logical pixels;
- keep modifier behavior independent of pointer libraries.

- [ ] **Step 5: Write failing command tests**

```ts
it("moves multiple elements as one transaction", () => {
  const result = applySceneCommand(deck, {
    type: "transform-elements",
    slideId: "cover",
    changes: [
      { elementId: "title", frame: { x: 90, y: 64, width: 720, height: 140 } },
      { elementId: "hero", frame: { x: 820, y: 90, width: 320, height: 420 } }
    ]
  });
  expect(result.deck.revision).toBe(deck.revision + 1);
  expect(result.inverse.type).toBe("transform-elements");
  expect(deck.slides[0]!.elements[0]!.frame.x).toBe(72);
});
```

- [ ] **Step 6: Implement command application and inverse generation**

Initial command union:

```ts
type SceneCommand =
  | { type: "transform-elements"; slideId: string; changes: ElementFrameChange[] }
  | { type: "insert-elements"; slideId: string; elements: SceneElement[] }
  | { type: "delete-elements"; slideId: string; elementIds: string[] }
  | { type: "reorder-elements"; slideId: string; orderedIds: string[] }
  | { type: "patch-element"; slideId: string; elementId: string; patch: SceneElementPatch }
  | { type: "patch-slide"; slideId: string; patch: SceneSlidePatch };
```

Reject missing IDs and duplicate inserts with typed Vietnamese diagnostics.

- [ ] **Step 7: Run package verification**

```bash
pnpm --filter @deckory/scene test
pnpm --filter @deckory/scene typecheck
```

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 8: Commit scene operations**

```bash
git add packages/scene pnpm-lock.yaml
git commit -m "feat(scene): add geometry and immutable commands"
```

---

### Task 3: Implement deterministic V1-to-V2 migration

**Files:**
- Create: `packages/scene/src/migrate-v1.ts`
- Create: `packages/scene/src/migrate-v1.test.ts`
- Create: `packages/scene/src/v1-layout-frames.ts`
- Modify: `packages/scene/src/index.ts`

**Interfaces:**
- Consumes: V1 `DeckDocument` and V2 types.
- Produces: `migrateDeckV1ToV2(deck: DeckDocument): DeckMigrationResult`.

- [ ] **Step 1: Write failing migration tests**

```ts
it("migrates the same V1 deck deterministically", () => {
  const first = migrateDeckV1ToV2(v1Deck);
  const second = migrateDeckV1ToV2(v1Deck);
  expect(first).toEqual(second);
});

it("preserves component IDs and evidence source", () => {
  const result = migrateDeckV1ToV2(v1Deck);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const slide = result.deck.slides[0]!;
  expect(slide.elements.map((element) => element.id)).toContain("heading");
  expect(slide.evidence?.source).toBe("Fixture minh hoạ");
});

it("reports unsupported interactive content instead of dropping it", () => {
  const result = migrateDeckV1ToV2(v1InteractiveDeck);
  expect(result.diagnostics.some((item) => item.code === "migration-review-required")).toBe(true);
});
```

- [ ] **Step 2: Run migration tests and confirm RED**

Run: `pnpm --filter @deckory/scene test -- src/migrate-v1.test.ts`

Expected: FAIL because `migrateDeckV1ToV2` does not exist.

- [ ] **Step 3: Define deterministic layout frame recipes**

`v1-layout-frames.ts` must map every existing V1 layout/component signature to explicit `1280 × 720` frames. Use named constants for safe area, heading region, body region and evidence footer. Do not derive frames from viewport size.

- [ ] **Step 4: Implement semantic migration adapters**

Map each V1 component to either:

- native V2 element content;
- V2 `component-instance` using a registered legacy adapter;
- explicit diagnostic plus preserved fallback payload.

Never silently delete props.

- [ ] **Step 5: Run migration and schema verification**

```bash
pnpm --filter @deckory/scene test
pnpm --filter @deckory/schema test
pnpm --filter @deckory/scene typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit migration**

```bash
git add packages/scene/src/migrate-v1.ts packages/scene/src/migrate-v1.test.ts packages/scene/src/v1-layout-frames.ts packages/scene/src/index.ts
git commit -m "feat(scene): migrate V1 decks to explicit scenes"
```

---

### Task 4: Extract the shared scene renderer

**Files:**
- Create: `packages/renderer/package.json`
- Create: `packages/renderer/tsconfig.json`
- Create: `packages/renderer/src/index.ts`
- Create: `packages/renderer/src/scene-renderer.tsx`
- Create: `packages/renderer/src/scene-renderer.test.tsx`
- Create: `packages/renderer/src/element-renderer.tsx`
- Create: `packages/renderer/src/legacy-renderer.tsx`
- Modify: `apps/present/components/slide-frame.tsx`
- Modify: `apps/present/components/deck-thumbnail.tsx`
- Modify: `apps/present/package.json`

**Interfaces:**
- Consumes: V1 `Slide` or V2 `SceneSlide` through `RenderableSlide`.
- Produces: `SceneRenderer`, `RenderableSlide`, `renderableSlideFromV1`, consistent `data-element-id` DOM markers.

- [ ] **Step 1: Write failing renderer contract tests**

```tsx
it("renders explicit frames using logical-pixel CSS variables", () => {
  const html = renderToStaticMarkup(<SceneRenderer slide={sceneSlide} assets={[]} mode="final" />);
  expect(html).toContain('data-element-id="title"');
  expect(html).toContain('--scene-x:72');
  expect(html).toContain('--scene-width:720');
});

it("keeps the evidence footer in the final renderer", () => {
  const html = renderToStaticMarkup(<SceneRenderer slide={sceneSlideWithEvidence} assets={[]} mode="final" />);
  expect(html).toContain("Fixture minh hoạ");
});
```

- [ ] **Step 2: Run renderer tests and confirm RED**

Run: `pnpm --filter @deckory/renderer test -- src/scene-renderer.test.tsx`

Expected: FAIL because the package does not exist.

- [ ] **Step 3: Implement a renderer with explicit scene layers**

The renderer must:

- use one canonical `1280 × 720` root;
- render background layers separately from elements;
- render elements sorted by `zIndex` and stable document order;
- expose `data-element-id`, `data-element-kind` and `data-parent-id`;
- use absolute geometry only inside the fixed scene canvas;
- preserve reading order through explicit accessibility metadata;
- support `mode: "final" | "thumbnail" | "studio" | "export"` without changing meaning.

- [ ] **Step 4: Wrap the current V1 renderer as a legacy adapter**

Do not rewrite every current semantic visual in this task. `legacy-renderer.tsx` must call the current V1 implementation so existing screenshots stay stable.

- [ ] **Step 5: Replace direct renderer ownership in thumbnails and `SlideFrame`**

`apps/present/components/slide-frame.tsx` becomes a compatibility wrapper around `@deckory/renderer`. Keep public props stable for existing call sites.

- [ ] **Step 6: Run focused and cross-surface tests**

```bash
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/present test -- components/slide-frame.test.tsx components/deck-thumbnail.test.tsx
pnpm --filter @deckory/renderer typecheck
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit renderer extraction**

```bash
git add packages/renderer apps/present/components/slide-frame.tsx apps/present/components/deck-thumbnail.tsx apps/present/package.json pnpm-lock.yaml
git commit -m "refactor(renderer): share V1 and V2 slide rendering"
```

---

### Task 5: Add V2 catalog resolution and feature-flagged Studio entry

**Files:**
- Create: `apps/present/lib/deck-version.ts`
- Create: `apps/present/lib/deck-version.test.ts`
- Modify: `apps/present/lib/deck-catalog.ts`
- Modify: `apps/present/app/studio/page.tsx`
- Modify: `apps/present/app/preview/page.tsx`
- Modify: `apps/present/app/present/page.tsx`
- Modify: `apps/present/components/export-deck.tsx`

**Interfaces:**
- Produces: `ResolvedDeckDocument`, `resolveRenderableDeck`, `isDeckDocumentV2`.
- Feature flag: `DECKORY_SCENE_V2=1` enables V2 editing entry while V1 rendering remains unconditional.

- [ ] **Step 1: Write failing deck-version tests**

```ts
it("resolves V1 and V2 without guessing from unrelated fields", () => {
  expect(resolveRenderableDeck(v1Deck).version).toBe(1);
  expect(resolveRenderableDeck(v2Deck).version).toBe(2);
});

it("rejects an unknown schema version", () => {
  expect(() => resolveRenderableDeck({ ...v2Deck, schemaVersion: 9 })).toThrow(/phiên bản tài liệu/i);
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm --filter @deckory/present test -- lib/deck-version.test.ts`

Expected: FAIL because the resolver does not exist.

- [ ] **Step 3: Implement explicit document resolution**

Never detect V2 by checking for an `elements` field alone. Parse through V1 or V2 schemas and return typed diagnostics.

- [ ] **Step 4: Route all surfaces through the resolver**

Preview, Presenter and Export must accept V2 regardless of the Studio feature flag. Studio V2 editing may remain behind the flag until Plan 02.

- [ ] **Step 5: Run application verification**

```bash
pnpm --filter @deckory/present test
pnpm --filter @deckory/present typecheck
pnpm build
```

Expected: PASS and production build exits 0.

- [ ] **Step 6: Run a browser compatibility smoke test**

Add or update an E2E fixture that opens one V1 deck and one minimal V2 deck in Preview and Presenter. Assert one visible heading and no console errors.

Run: `pnpm test:e2e -- tests/e2e/scene-v2-smoke.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit the dual-document boundary**

```bash
git add apps/present/lib/deck-version.ts apps/present/lib/deck-version.test.ts apps/present/lib/deck-catalog.ts apps/present/app/studio/page.tsx apps/present/app/preview/page.tsx apps/present/app/present/page.tsx apps/present/components/export-deck.tsx tests/e2e/scene-v2-smoke.spec.ts
git commit -m "feat(present): resolve V1 and V2 decks across surfaces"
```

## Plan Self-Review

- Spec coverage: V2 schema, explicit coordinates, migration, immutable commands, shared renderer and V1 compatibility are covered.
- Placeholder scan: no implementation step delegates undefined validation or error handling.
- Type consistency: `DeckDocumentV2`, `SceneCommand`, `SceneRenderer` and `ResolvedDeckDocument` are defined before consumption.
- Exit condition: Plan 02 may start only after both V1 and minimal V2 decks render through Preview, Presenter, thumbnails and Export without forking the renderer.
