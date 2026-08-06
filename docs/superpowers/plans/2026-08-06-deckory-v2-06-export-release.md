# Deckory V2 Export, Migration and Production Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete V2 with capability-aware export, transparent 20-dimension quality audit, reference-deck migration, performance hardening and evidence-backed browser release verification.

**Architecture:** Export consumes the same `SceneRenderer` and a per-element capability registry. HTML, PNG, PDF and SVG are complete V2 deliverables; PPTX uses a typed adapter boundary and explicit fallback policy. Audit combines structural checks with recorded runtime evidence. Migration proceeds deck by deck and preserves V1 rollback artifacts until final acceptance.

**Tech Stack:** TypeScript 5.9, React 19, Next.js 16, Playwright, Chromium PDF/PNG, SVG serialization, Vitest, pnpm workspaces.

## Global Constraints

- Plans 01–05 must pass before this plan starts.
- Never silently rasterize an element whose export capability was presented as editable.
- V1 source decks remain available until each migrated V2 deck passes its acceptance gate.
- Runtime evidence is revision-specific; screenshots from another HEAD are invalid.
- All fixture values remain visibly labelled illustrative.
- MyInterview must remain visible in Hub and complete the defense demo flow offline.
- Presenter audience bundles must exclude Studio, Moveable, Selecto, esbuild-wasm and source editors.
- Do not commit, push, publish or remove V1 compatibility without separate authorization.

---

### Task 1: Add element-level export capability resolution

**Files:**
- Create: `packages/renderer/src/export-capabilities.ts`
- Create: `packages/renderer/src/export-capabilities.test.ts`
- Modify: `packages/sdk/src/component-registry.ts`
- Modify: `packages/sdk/src/web-block.ts`
- Modify: `packages/schema/src/v2.ts`
- Create: `apps/present/components/studio-v2/export-capability-panel.tsx`
- Create: `apps/present/components/studio-v2/export-capability-panel.test.tsx`
- Modify: `apps/present/components/studio-v2/inspector/field-registry.ts`

**Interfaces:**
- Produces: `ExportCapability`, `ElementExportResolution`, `resolveElementExportCapability`, `resolveDeckExportReport`.

- [ ] **Step 1: Write failing capability tests**

```ts
it("reports native SVG for a supported shape", () => {
  expect(resolveElementExportCapability(shapeElement, registry)).toMatchObject({
    html: "native",
    png: "native",
    pdf: "native",
    svg: "native"
  });
});

it("reports declared snapshot fallback for a Web Block", () => {
  expect(resolveElementExportCapability(webBlockElement, registry)).toMatchObject({
    svg: "fallback",
    fallback: { type: "png", assetId: "custom-radar-fallback" }
  });
});

it("never labels a fallback as editable", () => {
  expect(resolveElementExportCapability(webBlockElement, registry).pptx).not.toBe("native-editable");
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/renderer test -- src/export-capabilities.test.ts`

Expected: FAIL because capability resolution does not exist.

- [ ] **Step 3: Implement explicit capability states**

```ts
type ExportCapabilityState =
  | "native"
  | "native-editable"
  | "fallback"
  | "unsupported";
```

Resolution includes reason, fallback, warnings and the responsible component/version.

- [ ] **Step 4: Build Studio disclosure UI**

The Export Inspector shows a deck summary and selected-element detail. Unsupported and fallback elements are visible before the user starts export.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @deckory/renderer test -- src/export-capabilities.test.ts
pnpm --filter @deckory/present test -- components/studio-v2/export-capability-panel.test.tsx
pnpm typecheck
git add packages/renderer/src/export-capabilities.ts packages/renderer/src/export-capabilities.test.ts packages/sdk/src/component-registry.ts packages/sdk/src/web-block.ts packages/schema/src/v2.ts apps/present/components/studio-v2/export-capability-panel.tsx apps/present/components/studio-v2/export-capability-panel.test.tsx apps/present/components/studio-v2/inspector/field-registry.ts
git commit -m "feat(export): disclose element export capabilities"
```

---

### Task 2: Produce standalone HTML and deterministic SVG exports

**Files:**
- Create: `packages/renderer/src/export/html-export.ts`
- Create: `packages/renderer/src/export/html-export.test.ts`
- Create: `packages/renderer/src/export/svg-export.ts`
- Create: `packages/renderer/src/export/svg-export.test.ts`
- Create: `packages/renderer/src/export/asset-embed.ts`
- Create: `packages/renderer/src/export/asset-embed.test.ts`
- Modify: `packages/renderer/src/index.ts`
- Modify: `scripts/export-deck.mjs`
- Modify: `docs/EXPORT.md`

**Interfaces:**
- Produces: `exportDeckToStandaloneHtml`, `exportSlideToSvg`, `embedExportAssets`.

- [ ] **Step 1: Write failing standalone HTML tests**

```ts
it("contains no remote asset references", async () => {
  const html = await exportDeckToStandaloneHtml(sceneDeck, exportContext);
  expect(html).not.toMatch(/https?:\/\//);
  expect(html).toContain("Deckory V2");
});

it("does not include Studio source code or editor dependencies", async () => {
  const html = await exportDeckToStandaloneHtml(sceneDeck, exportContext);
  expect(html).not.toContain("react-moveable");
  expect(html).not.toContain("esbuild-wasm");
});
```

- [ ] **Step 2: Write failing SVG tests**

```ts
it("serializes native text and shapes with the 1280 by 720 viewBox", async () => {
  const svg = await exportSlideToSvg(nativeSceneSlide, exportContext);
  expect(svg).toContain('viewBox="0 0 1280 720"');
  expect(svg).toContain("Deckory V2");
});

it("uses the declared fallback for unsupported custom content", async () => {
  const svg = await exportSlideToSvg(webBlockSlide, exportContext);
  expect(svg).toContain("custom-radar-fallback");
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm --filter @deckory/renderer test -- src/export`

Expected: FAIL because exporters do not exist.

- [ ] **Step 4: Implement asset embedding and export modes**

- embed local images and fonts;
- freeze motion at final state;
- disable interactions;
- preserve accessible title/description in SVG;
- include evidence footer;
- preserve capability warnings in the export report, not the visual artifact;
- avoid browser-dependent random IDs.

- [ ] **Step 5: Extend the CLI**

Supported commands:

```bash
pnpm export:deck -- --deck=<id> --format=html
pnpm export:deck -- --deck=<id> --format=svg
```

Output contains artifact path plus a JSON capability report.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @deckory/renderer test -- src/export
pnpm typecheck
pnpm export:deck -- --deck=visual-lab-v2 --format=html
pnpm export:deck -- --deck=visual-lab-v2 --format=svg
git add packages/renderer/src/export packages/renderer/src/index.ts scripts/export-deck.mjs docs/EXPORT.md
git commit -m "feat(export): add standalone HTML and SVG"
```

---

### Task 3: Harden PNG and PDF export for V2 scenes

**Files:**
- Modify: `apps/present/components/export-deck.tsx`
- Modify: `apps/present/components/export-deck.test.tsx`
- Modify: `apps/present/app/export/page.tsx`
- Modify: `apps/present/app/export.css`
- Modify: `scripts/export-deck.mjs`
- Modify: `tests/e2e/export.spec.ts`
- Create: `tests/e2e/export-v2.spec.ts`

**Interfaces:**
- Extends existing PNG/PDF export with V2 capability reports and final-state rendering.

- [ ] **Step 1: Write failing component tests**

```tsx
it("shows fallback and unsupported counts before export", () => {
  const html = renderToStaticMarkup(<ExportDeck deck={webBlockDeck} />);
  expect(html).toContain("1 thành phần dùng fallback");
});
```

- [ ] **Step 2: Add failing E2E assertions**

Cover:

- PNG dimensions exactly match `1280 × 720` logical output ratio;
- PDF page count equals slide count;
- no editor handles or focus rings;
- motion final state;
- Web Block static fallback;
- local fonts and images;
- Vietnamese copy;
- capability report generated.

- [ ] **Step 3: Run focused tests and confirm RED**

```bash
pnpm --filter @deckory/present test -- components/export-deck.test.tsx
pnpm test:e2e -- tests/e2e/export-v2.spec.ts
```

Expected: FAIL on missing V2 report/final-state behavior.

- [ ] **Step 4: Implement V2 export flow using the shared renderer**

Do not create a separate visual implementation for export. Use `mode="export"` and wait for fonts, images, charts, diagrams and Web Block fallbacks to report ready.

- [ ] **Step 5: Re-run and inspect outputs**

```bash
pnpm --filter @deckory/present test -- components/export-deck.test.tsx
pnpm test:e2e -- tests/e2e/export.spec.ts tests/e2e/export-v2.spec.ts
```

Expected: PASS. Compare exported representative slides with Preview screenshots.

- [ ] **Step 6: Commit V2 PNG/PDF export**

```bash
git add apps/present/components/export-deck.tsx apps/present/components/export-deck.test.tsx apps/present/app/export/page.tsx apps/present/app/export.css scripts/export-deck.mjs tests/e2e/export.spec.ts tests/e2e/export-v2.spec.ts
git commit -m "feat(export): render V2 PNG and PDF faithfully"
```

---

### Task 4: Define the native PPTX adapter boundary and prove basic editable shapes

**Files:**
- Create: `packages/renderer/src/export/pptx-types.ts`
- Create: `packages/renderer/src/export/pptx-adapter.ts`
- Create: `packages/renderer/src/export/pptx-adapter.test.ts`
- Create: `scripts/export-pptx-v2.mjs`
- Create: `scripts/export-pptx-v2.test.mjs`
- Modify: `package.json`
- Modify: `docs/EXPORT.md`

**Interfaces:**
- Produces: `PptxExportAdapter`, `PptxElementResult`, `exportDeckToPptxPlan`.
- Initial native proof: text, rectangle, ellipse, line, connector, image and group.

- [ ] **Step 1: Write failing adapter-plan tests**

```ts
it("maps native scene primitives to editable PPTX operations", () => {
  const plan = exportDeckToPptxPlan(nativePrimitiveDeck, adapters);
  expect(plan.slides[0]!.elements).toEqual(expect.arrayContaining([
    expect.objectContaining({ sourceId: "title", operation: "addText", capability: "native-editable" }),
    expect.objectContaining({ sourceId: "panel", operation: "addShape", capability: "native-editable" })
  ]));
});

it("keeps unsupported content as an explicit fallback operation", () => {
  const plan = exportDeckToPptxPlan(webBlockDeck, adapters);
  expect(plan.slides[0]!.elements).toContainEqual(expect.objectContaining({
    sourceId: "custom-radar",
    operation: "addFallbackImage",
    capability: "fallback"
  }));
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/renderer test -- src/export/pptx-adapter.test.ts`

Expected: FAIL because the adapter boundary does not exist.

- [ ] **Step 3: Implement the adapter plan without coupling schema to one PPTX library**

The plan contains logical-pixel geometry, text runs, fills, strokes, assets and fallback references. Conversion to EMU happens only inside the script adapter.

- [ ] **Step 4: Implement the basic native proof exporter**

Use the repository-approved local PPTX dependency or existing script capability. If no dependency can preserve the tested native operations, stop and report the exact blocker rather than producing a misleading image-only file.

- [ ] **Step 5: Verify the generated package structure**

Tests open the PPTX ZIP and assert:

- slide count;
- text exists in slide XML;
- native shape nodes exist;
- fallback media exists only for declared fallback elements;
- no remote relationships.

- [ ] **Step 6: Commit the adapter proof**

```bash
git add packages/renderer/src/export/pptx-types.ts packages/renderer/src/export/pptx-adapter.ts packages/renderer/src/export/pptx-adapter.test.ts scripts/export-pptx-v2.mjs scripts/export-pptx-v2.test.mjs package.json docs/EXPORT.md pnpm-lock.yaml
git commit -m "feat(export): define editable PPTX adapter boundary"
```

---

### Task 5: Extend audit to the full 20-dimension V2 scorecard

**Files:**
- Create: `packages/audit/src/v2-scorecard.ts`
- Create: `packages/audit/src/v2-scorecard.test.ts`
- Create: `packages/audit/src/runtime-evidence.ts`
- Create: `packages/audit/src/runtime-evidence.test.ts`
- Modify: `packages/audit/src/index.ts`
- Modify: `packages/audit/src/index.test.ts`
- Modify: `apps/present/components/hub.tsx`
- Modify: `apps/present/components/hub.test.tsx`
- Modify: `apps/present/components/studio-v2/inspector/scene-inspector.tsx`

**Interfaces:**
- Produces: `scoreDeckV2`, `DeckQualityScorecardV2`, `RuntimeEvidenceRecord`, 20 dimensions.

- [ ] **Step 1: Write failing scorecard coverage tests**

```ts
it("returns all twenty named dimensions", () => {
  expect(scoreDeckV2(completeDeck).dimensions.map((item) => item.id)).toEqual([
    "storytelling", "ui", "ux", "visual-design", "motion-design",
    "typography", "layout", "charts", "copywriting", "accessibility",
    "interaction", "branding", "evidence", "demo-readiness", "production-quality",
    "customizability", "visual-variety", "editability", "export-fidelity", "performance"
  ]);
});

it("does not award runtime-only points without revision-matched evidence", () => {
  const score = scoreDeckV2(completeDeck, { runtimeEvidence: [] });
  expect(score.dimensions.find((item) => item.id === "performance")?.confidence)
    .toBe("manual-review-required");
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/audit test -- src/v2-scorecard.test.ts`

Expected: FAIL because the V2 scorecard does not exist.

- [ ] **Step 3: Implement transparent deductions and evidence confidence**

Structural checks include:

- thesis, section role, conclusion and slide-purpose metadata;
- story-order and transition diagnostics;
- composition repetition and density rhythm;
- constrained-copy claim preservation;
- unsupported, stale or illustrative claim status;
- dataset/source references and declared transformation lineage;
- visible overflow;
- safe-area collision;
- text fit;
- chart evidence;
- diagram fit;
- reading order;
- export fallback counts;
- component editability;
- visual catalog diversity;
- motion final state;
- local assets.

Runtime checks require revision, viewport, mode, timestamp and evidence artifact.

- [ ] **Step 4: Integrate score summaries into Hub and Studio**

Show score, readiness, top three issues and categories awaiting runtime review. Never show a green 10/10 badge for a manual-review-required category.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @deckory/audit test
pnpm --filter @deckory/present test -- components/hub.test.tsx components/studio-v2
pnpm typecheck
git add packages/audit apps/present/components/hub.tsx apps/present/components/hub.test.tsx apps/present/components/studio-v2/inspector/scene-inspector.tsx
git commit -m "feat(audit): score V2 across twenty quality dimensions"
```

---

### Task 6: Migrate templates and reference decks in controlled batches

**Files:**
- Modify/Create within: `packages/templates/src/v2/`
- Create: `packages/templates/src/v2/instantiate.ts`
- Create: `packages/templates/src/v2/instantiate.test.ts`
- Create: `packages/templates/src/v2/migrate-catalog.test.ts`
- Create or modify: `decks/visual-lab-v2/`
- Create: `decks/template-gallery-v2/`
- Create: `decks/deckory-story-v2/`
- Create: `decks/myinterview-defense-v2/`
- Modify: `apps/present/lib/deck-catalog.ts`
- Modify: `apps/present/lib/deck-catalog.test.ts`

**Interfaces:**
- Produces V2 template instantiation and four production reference decks while retaining V1 sources.

- [ ] **Step 1: Write failing V2 template instantiation tests**

```ts
it("instantiates a V2 recipe with explicit frames and semantic metadata", () => {
  const result = createDeckV2FromTemplate(input);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.deck.schemaVersion).toBe(2);
  expect(result.deck.slides[0]!.elements.every((element) => element.frame.width > 0)).toBe(true);
});
```

- [ ] **Step 2: Migrate Visual Lab and Template Gallery**

Use these to verify every component, recipe, master and visual world before migrating story-critical decks.

- [ ] **Step 3: Migrate Deckory Story**

Preserve thesis, architecture and evidence. Replace repeated layouts only where the V2 catalog provides a clearer relationship visual.

- [ ] **Step 4: Migrate MyInterview Defense**

Required acceptance:

- all 23 intended story beats remain represented;
- FPT and MyInterview local assets remain valid;
- five-member team content remains complete;
- no clipped Vietnamese text;
- screenshots use deliberate crops and annotations;
- charts and illustrative values are labelled;
- all material factual claims resolve to evidence records or are explicitly marked unsupported/illustrative;
- datasets and chart transformations remain inspectable;
- slide conclusions form a coherent problem → evidence → solution → proof → decision arc;
- no long sequence repeats the same composition fingerprint without an intentional reason;
- visualizer positions no longer rely on fixed percentages;
- presentation flow works offline;
- MyInterview V2 is visible in Hub.

- [ ] **Step 5: Add per-deck migration tests**

Tests assert slide count/range, stable critical IDs, thesis and section roles, conclusion coverage, claim/evidence coverage, dataset lineage, notes, composition variance, no unresolved migration diagnostics and schema validity.

- [ ] **Step 6: Run strict migration verification**

```bash
pnpm --filter @deckory/templates test
pnpm test
pnpm typecheck
pnpm audit:decks -- --strict
pnpm assets:check
```

Expected: PASS.

- [ ] **Step 7: Commit each deck separately**

Use one logical commit per migrated deck so a visual regression can be reverted without reverting the platform.

```bash
git commit -m "feat(visual-lab): migrate gallery to Scene V2"
git commit -m "feat(templates): migrate gallery to Scene V2"
git commit -m "feat(deckory-story): migrate product story to Scene V2"
git commit -m "feat(myinterview): migrate defense deck to Scene V2"
```

---

### Task 7: Enforce performance and bundle boundaries

**Files:**
- Create: `apps/present/lib/performance-budgets.ts`
- Create: `apps/present/lib/performance-budgets.test.ts`
- Create: `tests/e2e/performance-v2.spec.ts`
- Modify: `apps/present/next.config.ts`
- Modify: `apps/present/app/present/page.tsx`
- Modify: `apps/present/app/studio/page.tsx`
- Modify: `package.json`

**Interfaces:**
- Verifies interaction and bundle budgets from the V2 specification.

- [ ] **Step 1: Add failing budget tests**

```ts
it("keeps editor-only modules out of the Presenter denylist", () => {
  const report = analyzeRouteBundle(presenterBundleFixture);
  expect(report.imports).not.toEqual(expect.arrayContaining([
    "react-moveable", "react-selecto", "esbuild-wasm"
  ]));
});
```

- [ ] **Step 2: Add browser performance scenarios**

Use a 20-slide deck with 80 native elements per slide. Measure:

- selection latency;
- drag frame rate;
- undo/redo duration;
- slide switch duration;
- thumbnail responsiveness;
- ELK worker duration;
- Web Block timeout behavior.

- [ ] **Step 3: Run and confirm any budget failures**

Run: `pnpm test:e2e -- tests/e2e/performance-v2.spec.ts`

Expected on the first run: report exact observed metrics; FAIL any metric exceeding the specification threshold.

- [ ] **Step 4: Correct measured bottlenecks**

Allowed changes include selector isolation, memoization, worker transfer, route-level dynamic import and thumbnail virtualization. Do not lower budgets without explicit user approval and recorded evidence.

- [ ] **Step 5: Re-run and record evidence**

Expected:

- selection under 50 ms;
- undo/redo under 30 ms for one-slide command;
- slide switch under 150 ms after assets load;
- drag target 60 FPS and no lower than 45 FPS on the test machine;
- Presenter bundle excludes editor dependencies.

- [ ] **Step 6: Commit performance hardening**

```bash
git add apps/present/lib/performance-budgets.ts apps/present/lib/performance-budgets.test.ts tests/e2e/performance-v2.spec.ts apps/present/next.config.ts apps/present/app/present/page.tsx apps/present/app/studio/page.tsx package.json
git commit -m "perf(v2): enforce editor and presenter budgets"
```

---

### Task 8: Run the final production visual and demo loop

**Files:**
- Create: `tests/e2e/deckory-v2-release.spec.ts`
- Create: `docs/V2-RELEASE-CHECKLIST.md`
- Update: `README.md`
- Update: `PRODUCT.md`
- Update: `DESIGN.md`
- Evidence only: `output/playwright/screenshots/<run-id>/`

**Interfaces:**
- Final release gate for the complete V2 program.

- [ ] **Step 1: Record the exact revision and dirty paths**

Run:

```bash
git rev-parse HEAD
git status --short
```

Store the revision in the runtime evidence report. Do not include unrelated dirty files in any V2 commit.

- [ ] **Step 2: Add the final E2E journey**

Cover:

- Hub opens MyInterview V2;
- Studio selects, drags, aligns and edits text;
- visual assistant converts a paragraph;
- chart data changes and re-renders;
- diagram re-layouts long Vietnamese labels;
- background and visual world change;
- motion replays and reduced-motion final state matches;
- registered component editing;
- Web Block isolation/fallback;
- checkpoint save/reload;
- Preview;
- Presenter keyboard/fullscreen/overview/notes privacy;
- HTML, SVG, PNG and PDF export;
- capability report;
- offline reload.

- [ ] **Step 3: Run the complete quality gate**

```bash
git diff --check
pnpm test
pnpm typecheck
pnpm lint
pnpm audit:decks -- --strict
pnpm assets:check
pnpm build
pnpm test:e2e
```

Expected: every command exits 0. If any command fails, report the actual failure and do not claim readiness.

- [ ] **Step 4: Capture required screenshots**

For Hub, Studio, Preview, Presenter, Overview and Export capture:

- 320 px;
- 375 px;
- 768 px;
- 1024 px;
- 1440 px;
- 200% zoom;
- reduced motion;
- thumbnail scale.

Capture representative slides from each visual world and major chart/diagram family.

- [ ] **Step 5: Perform manual visual inspection**

Reject and correct:

- clipping or cropping;
- safe-area/footer overlap;
- blank top-right regions without purpose;
- headings wrapping beyond intended lines;
- repeated composition families;
- old dashboard-style charts;
- visualizer collisions;
- unreadable tables/code;
- motion competing with the speaker;
- focus loss;
- source or fixture labels missing;
- audience notes leakage;
- export mismatch.

Repeat affected checks and screenshots after every correction.

- [ ] **Step 6: Update product documentation from verified behavior only**

Document:

- V2 scene model;
- authoring modes;
- direct manipulation;
- component SDK;
- Web Block limitations;
- visual catalog;
- export capabilities;
- quality audit;
- remaining non-goals.

Do not describe unverified native PPTX capabilities as complete.

- [ ] **Step 7: Inspect the final diff**

Run:

```bash
git diff --check
git diff --stat
git status --short
```

Confirm there are no generated secrets, remote assets, temporary code, unrelated changes or unreviewed output files.

- [ ] **Step 8: Commit documentation and final release evidence references**

```bash
git add tests/e2e/deckory-v2-release.spec.ts docs/V2-RELEASE-CHECKLIST.md README.md PRODUCT.md DESIGN.md
git commit -m "docs(v2): publish verified platform contract"
```

Do not push or tag a release without explicit authorization.

## Plan Self-Review

- Spec coverage: capability disclosure, HTML/SVG/PNG/PDF export, PPTX adapter boundary, 20-dimension audit, template/deck migration, performance and final visual/demo readiness are covered.
- Placeholder scan: export states, required evidence, migration order, performance budgets and final commands are explicit.
- Type consistency: exporters consume `DeckDocumentV2` through the shared renderer and `ElementExportResolution`; PPTX uses a separate adapter plan.
- Exit condition: V2 is production-ready only after the complete quality gate passes on the final revision and the screenshot/manual review loop has no unresolved defects.
