# Deckory V2 Visual Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a broad, explainable visual grammar that converts text and structured data into professional native charts, diagrams and content compositions instead of repeated cards and bullet lists.

**Architecture:** New `@deckory/visuals` owns visual intent, typed chart/diagram contracts, recommendation metadata and layout adapters. The public deck stores Deckory specs, not ECharts or ELK payloads. Renderers are selected by capability: Deckory editorial SVG/DOM for common visuals, ECharts 6 SVG for advanced charts and ELK.js for auto-layout only.

**Tech Stack:** TypeScript 5.9, Zod 4, React 19, Apache ECharts 6 SVG modules, elkjs, Web Workers, Vitest, Playwright.

## Global Constraints

- Plans 01–03 must pass before this plan starts.
- Never fabricate numeric data to satisfy a chart recommendation.
- Every visual states its communication question, accessible summary and evidence requirements.
- Direct labels are preferred to detached legends.
- Every public catalog item has a complete fixture, Inspector support, use/avoid guidance and browser evidence.
- Diagram auto-layout must measure text and emit diagnostics rather than clip nodes.
- Advanced libraries remain behind Deckory-owned typed adapters.
- Do not commit, push or publish without separate authorization.

---

### Task 1: Create the visual-intent and recommendation domain

**Files:**
- Create: `packages/visuals/package.json`
- Create: `packages/visuals/tsconfig.json`
- Create: `packages/visuals/src/index.ts`
- Create: `packages/visuals/src/intent.ts`
- Create: `packages/visuals/src/intent.test.ts`
- Create: `packages/visuals/src/catalog.ts`
- Create: `packages/visuals/src/catalog.test.ts`
- Create: `packages/visuals/src/recommend.ts`
- Create: `packages/visuals/src/recommend.test.ts`

**Interfaces:**
- Produces: `VisualIntent`, `VisualCatalogEntry`, `VisualRecommendation`, `classifyVisualIntent`, `recommendVisuals`.

- [ ] **Step 1: Add the package manifest**

Use workspace dependencies on `@deckory/schema`, `@deckory/scene` and Zod. Add standard test/typecheck/lint scripts.

- [ ] **Step 2: Write failing intent tests**

```ts
it("classifies ordered operational text as process without inventing values", () => {
  const result = classifyVisualIntent({
    text: "Thiết lập hồ sơ. Tạo phiên. Thực hành. Nhận phản hồi.",
    locale: "vi-VN"
  });
  expect(result.primary).toBe("process");
  expect(result.extractedSteps).toHaveLength(4);
  expect(result.numericClaims).toHaveLength(0);
});

it("classifies a two-sided argument as comparison", () => {
  const result = classifyVisualIntent({
    text: "Cách cũ phụ thuộc thao tác thủ công; cách mới tự động hóa và có audit trail.",
    locale: "vi-VN"
  });
  expect(result.primary).toBe("before-after");
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm --filter @deckory/visuals test -- src/intent.test.ts`

Expected: FAIL because the package does not exist.

- [ ] **Step 4: Implement deterministic intent extraction**

Initial intent union:

```ts
type VisualIntent =
  | "single-claim" | "comparison" | "before-after" | "trade-off"
  | "ranking" | "magnitude" | "trend" | "distribution" | "part-to-whole"
  | "chronology" | "process" | "journey" | "lifecycle" | "roadmap"
  | "hierarchy" | "architecture" | "dependency" | "network" | "causality"
  | "geography" | "ownership" | "evidence-chain" | "risk"
  | "prioritization" | "implementation-proof" | "decision" | "action";
```

Use explicit text signals and optional structured hints. Do not call an external model in the deterministic core.

- [ ] **Step 5: Write failing recommendation tests**

```ts
it("returns process alternatives with reasons and required inputs", () => {
  const recommendations = recommendVisuals(processIntent, visualCatalog);
  expect(recommendations[0]).toMatchObject({
    componentId: "linear-process",
    reasons: expect.arrayContaining([expect.stringMatching(/thứ tự/i)]),
    requiredInputs: expect.arrayContaining([expect.objectContaining({ kind: "steps" })])
  });
});

it("does not recommend a chart without numeric evidence", () => {
  expect(recommendVisuals(processIntent, visualCatalog).some((item) => item.family === "chart")).toBe(false);
});
```

- [ ] **Step 6: Implement catalog integrity and ranking**

Each catalog entry includes:

- stable ID;
- family;
- intents;
- required/optional inputs;
- item bounds;
- density range;
- use/avoid guidance;
- evidence requirements;
- accessible-summary strategy;
- renderer capability;
- export capabilities;
- fixture ID.

Ranking is deterministic and returns reasons, alternatives and warnings.

- [ ] **Step 7: Verify and commit**

```bash
pnpm --filter @deckory/visuals test
pnpm --filter @deckory/visuals typecheck
git add packages/visuals pnpm-lock.yaml
git commit -m "feat(visuals): classify and recommend visual intent"
```

---

### Task 2: Define the Deckory chart contract and editorial chart renderer

**Files:**
- Create: `packages/visuals/src/charts/chart-spec.ts`
- Create: `packages/visuals/src/charts/chart-spec.test.ts`
- Create: `packages/visuals/src/charts/editorial-chart.tsx`
- Create: `packages/visuals/src/charts/editorial-chart.test.tsx`
- Create: `packages/visuals/src/charts/chart-format.ts`
- Create: `packages/visuals/src/charts/chart-format.test.ts`
- Modify: `packages/visuals/src/index.ts`
- Modify: `packages/schema/src/v2.ts`
- Modify: `packages/renderer/src/element-renderer.tsx`

**Interfaces:**
- Produces: `ChartSpecSchema`, `ChartSpec`, `EditorialChart`, `formatChartValue`.
- Initial editorial variants: horizontal bar, vertical bar, grouped bar, stacked bar, line, area, dot plot, lollipop, bullet, slope, waterfall.

- [ ] **Step 1: Write failing chart-spec tests**

```ts
it("requires question, unit, summary and evidence for a sourced chart", () => {
  expect(() => ChartSpecSchema.parse({
    variant: "horizontal-bar",
    title: "Điểm chất lượng",
    data: [{ category: "Layout", value: 92 }]
  })).toThrow();
});

it("rejects more than one primary highlight", () => {
  expect(() => ChartSpecSchema.parse(chartWithTwoPrimaryHighlights)).toThrow(/highlight/i);
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/visuals test -- src/charts/chart-spec.test.ts`

Expected: FAIL because chart contract does not exist.

- [ ] **Step 3: Implement the typed chart contract**

Required fields:

```ts
type ChartSpec = {
  question: string;
  title: string;
  accessibleSummary: string;
  variant: ChartVariant;
  data: ChartDatum[];
  encoding: ChartEncoding;
  unit: string;
  numberFormat: NumberFormatSpec;
  labels: DirectLabelPolicy;
  highlights?: ChartHighlight[];
  annotations?: ChartAnnotation[];
  referenceLines?: ReferenceLine[];
  evidence: ChartEvidence;
  missingValuePolicy: "gap" | "zero" | "omit";
  animation: ChartAnimationPolicy;
};
```

- [ ] **Step 4: Write failing editorial-renderer tests**

```tsx
it("renders direct labels and the highlighted datum", () => {
  const html = renderToStaticMarkup(<EditorialChart spec={barSpec} mode="final" />);
  expect(html).toContain("Visual hierarchy");
  expect(html).toContain("95");
  expect(html).toContain('data-primary-highlight="true"');
});

it("renders final values when motion is disabled", () => {
  const html = renderToStaticMarkup(<EditorialChart spec={barSpec} mode="thumbnail" reducedMotion />);
  expect(html).toContain('data-motion-state="final"');
});
```

- [ ] **Step 5: Implement editorial SVG/DOM renderers**

Use shared scales, label collision checks and annotation primitives. Keep visual styles theme-driven. Avoid one CSS implementation branching into unreadable conditionals; split each chart family into focused files under `charts/editorial/` when implementation begins.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @deckory/visuals test -- src/charts
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/visuals typecheck
git add packages/visuals/src/charts packages/visuals/src/index.ts packages/schema/src/v2.ts packages/renderer/src/element-renderer.tsx
git commit -m "feat(charts): add typed editorial chart system"
```

---

### Task 3: Add advanced ECharts 6 SVG adapters

**Files:**
- Modify: `packages/visuals/package.json`
- Create: `packages/visuals/src/charts/echarts-adapter.ts`
- Create: `packages/visuals/src/charts/echarts-adapter.test.ts`
- Create: `packages/visuals/src/charts/echarts-renderer.tsx`
- Create: `packages/visuals/src/charts/echarts-renderer.test.tsx`
- Create: `packages/visuals/src/charts/echarts-modules.ts`
- Create: `packages/visuals/src/charts/advanced-fixtures.ts`

**Interfaces:**
- Produces: `toEChartsOption`, `EChartsSvgRenderer`.
- Advanced variants: scatter, bubble, histogram, box plot, heatmap, calendar heatmap, donut, waffle, treemap, sunburst, funnel, sankey, radar, gauge, Gantt, timeline chart, small multiples, choropleth and proportional-symbol map.

- [ ] **Step 1: Add ECharts 6**

Run: `pnpm --filter @deckory/visuals add echarts@6`

Expected: manifest and lockfile update.

- [ ] **Step 2: Write failing adapter tests**

```ts
it("maps a Deckory sankey spec without exposing raw option fields", () => {
  const option = toEChartsOption(sankeySpec, chartTheme);
  expect(option.series).toEqual([expect.objectContaining({ type: "sankey" })]);
  expect(JSON.stringify(option)).not.toContain("http://");
});

it("forces SVG rendering and disables animation for thumbnails", () => {
  const config = resolveEChartsRenderConfig("thumbnail", false);
  expect(config.renderer).toBe("svg");
  expect(config.animation).toBe(false);
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm --filter @deckory/visuals test -- src/charts/echarts-adapter.test.ts`

Expected: FAIL because adapter does not exist.

- [ ] **Step 4: Implement tree-shaken module registration**

Import only chart/component modules required by the declared public variants plus `SVGRenderer`. Do not import the full ECharts bundle.

- [ ] **Step 5: Implement safe option translation**

Translation owns:

- Deckory palette;
- direct labels;
- tooltip behavior;
- aria option;
- axis overflow boundaries;
- animation mode;
- source metadata outside the SVG;
- no remote map/data loading.

Geographic charts accept only local GeoJSON/SVG assets from the deck manifest.

- [ ] **Step 6: Add fixture tests for every advanced variant**

One test enumerates the public advanced variant catalog and asserts each variant has a valid fixture and successful option translation.

- [ ] **Step 7: Verify and commit**

```bash
pnpm --filter @deckory/visuals test -- src/charts
pnpm --filter @deckory/visuals typecheck
git add packages/visuals/src/charts packages/visuals/package.json pnpm-lock.yaml
git commit -m "feat(charts): add advanced SVG chart adapters"
```

---

### Task 4: Define the diagram contract and worker-based layout engine

**Files:**
- Modify: `packages/visuals/package.json`
- Create: `packages/visuals/src/diagrams/diagram-spec.ts`
- Create: `packages/visuals/src/diagrams/diagram-spec.test.ts`
- Create: `packages/visuals/src/diagrams/layout.ts`
- Create: `packages/visuals/src/diagrams/layout.test.ts`
- Create: `packages/visuals/src/diagrams/elk-adapter.ts`
- Create: `packages/visuals/src/diagrams/elk-adapter.test.ts`
- Create: `packages/visuals/src/diagrams/layout-worker.ts`
- Create: `packages/visuals/src/diagrams/measure.ts`
- Create: `packages/visuals/src/diagrams/measure.test.ts`
- Modify: `packages/schema/src/v2.ts`

**Interfaces:**
- Produces: `DiagramSpec`, `layoutDiagram`, `measureDiagramNodes`, `DiagramLayoutResult`.
- Layout strategies: `elk-layered`, `elk-force`, `tree`, `radial`, `timeline`, `matrix`, `cycle`, `manual`.

- [ ] **Step 1: Add ELK.js**

Run: `pnpm --filter @deckory/visuals add elkjs`

Expected: manifest and lockfile update.

- [ ] **Step 2: Write failing diagram-schema tests**

```ts
it("requires stable node and edge IDs", () => {
  expect(() => DiagramSpecSchema.parse(diagramWithDuplicateNodeIds)).toThrow(/node ID/i);
});

it("rejects an edge that references a missing node", () => {
  expect(() => DiagramSpecSchema.parse(diagramWithMissingTarget)).toThrow(/target/i);
});
```

- [ ] **Step 3: Write failing layout tests**

```ts
it("measures long Vietnamese labels before ELK layout", async () => {
  const result = await layoutDiagram(longLabelArchitecture, { width: 1080, height: 420 });
  expect(result.nodes.every((node) => node.width >= node.measuredTextWidth)).toBe(true);
});

it("returns an overflow diagnostic instead of clipping unreadable nodes", async () => {
  const result = await layoutDiagram(overfullDiagram, { width: 480, height: 220 });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.diagnostics[0]?.code).toBe("diagram-does-not-fit");
});
```

- [ ] **Step 4: Run tests and confirm RED**

Run: `pnpm --filter @deckory/visuals test -- src/diagrams`

Expected: FAIL because diagram modules do not exist.

- [ ] **Step 5: Implement measurement and layout strategies**

- measure labels using the same local font metrics as the renderer;
- pass measured node sizes and typed ports to ELK;
- request orthogonal routing for architecture/flow diagrams;
- use worker execution for ELK;
- enforce a 2-second warning threshold;
- preserve generated result separately from manual overrides;
- return actionable split/reduce-density recommendations when a diagram cannot fit.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @deckory/visuals test -- src/diagrams
pnpm --filter @deckory/visuals typecheck
git add packages/visuals/src/diagrams packages/visuals/package.json packages/schema/src/v2.ts pnpm-lock.yaml
git commit -m "feat(diagrams): add measured automatic layout"
```

---

### Task 5: Implement the native diagram renderer and editing model

**Files:**
- Create: `packages/visuals/src/diagrams/diagram-renderer.tsx`
- Create: `packages/visuals/src/diagrams/diagram-renderer.test.tsx`
- Create: `packages/visuals/src/diagrams/diagram-motion.ts`
- Modify: `packages/renderer/src/element-renderer.tsx`
- Create: `apps/present/components/studio-v2/diagram-editor.tsx`
- Create: `apps/present/components/studio-v2/diagram-editor.test.tsx`
- Modify: `apps/present/components/studio-v2/inspector/field-registry.ts`

**Interfaces:**
- Produces: editable diagram node/edge rendering, layout action and manual override commands.

- [ ] **Step 1: Write failing renderer tests**

```tsx
it("renders nodes, routed edges and accessible traversal summary", () => {
  const html = renderToStaticMarkup(<DiagramRenderer spec={architectureSpec} layout={layoutResult} mode="final" />);
  expect(html).toContain('data-diagram-node-id="api"');
  expect(html).toContain('data-diagram-edge-id="api-to-service"');
  expect(html).toContain("API chuyển yêu cầu đến service");
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/visuals test -- src/diagrams/diagram-renderer.test.tsx`

Expected: FAIL because renderer does not exist.

- [ ] **Step 3: Implement renderer families**

Complete renderer support for:

- linear and branching process;
- flowchart;
- swimlane;
- journey and service blueprint;
- cycle and feedback loop;
- timeline and roadmap;
- hierarchy and org chart;
- mind/concept map;
- dependency/network/ecosystem;
- architecture/context/container/component;
- sequence/data/API/event flow;
- state machine and ERD;
- quadrant/matrix/pyramid/funnel/Venn/concentric/orbit/constellation/evidence chain.

Reuse primitives and layout contracts; do not create one hardcoded component per fixture.

- [ ] **Step 4: Add diagram editing**

Studio supports:

- select node or edge;
- edit label and description;
- add/remove node;
- connect nodes through typed ports;
- choose layout strategy;
- re-layout;
- drag a node to create a manual override;
- clear selected override with confirmation;
- view fit diagnostics.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @deckory/visuals test -- src/diagrams
pnpm --filter @deckory/present test -- components/studio-v2/diagram-editor.test.tsx
pnpm --filter @deckory/visuals typecheck
pnpm --filter @deckory/present typecheck
git add packages/visuals/src/diagrams packages/renderer/src/element-renderer.tsx apps/present/components/studio-v2/diagram-editor.tsx apps/present/components/studio-v2/diagram-editor.test.tsx apps/present/components/studio-v2/inspector/field-registry.ts
git commit -m "feat(diagrams): render and edit semantic relationships"
```

---

### Task 6: Ship the professional semantic component catalog

**Files:**
- Create: `packages/visuals/src/components/narrative.tsx`
- Create: `packages/visuals/src/components/business.tsx`
- Create: `packages/visuals/src/components/technical.tsx`
- Create: `packages/visuals/src/components/academic.tsx`
- Create: `packages/visuals/src/components/people.tsx`
- Create: `packages/visuals/src/components/media.tsx`
- Create: `packages/visuals/src/components/components.test.tsx`
- Create: `packages/visuals/src/components/definitions.ts`
- Create: `packages/visuals/src/components/definitions.test.ts`
- Modify: `packages/visuals/src/catalog.ts`
- Modify: `apps/present/lib/component-catalog.ts`
- Modify: `packages/templates/src/catalog/recipes.ts`
- Modify: `packages/templates/src/catalog/catalog.test.ts`

**Interfaces:**
- Produces complete native components and recipe entries for every required non-chart/non-diagram visual family in the V2 specification.

- [ ] **Step 1: Write failing coverage tests**

```ts
const requiredIds = [
  "professional-cover", "cinematic-cover", "section-divider", "thesis-statement",
  "problem-framing", "solution-framing", "quote-evidence", "definition",
  "misconception-correction", "before-after", "closing-synthesis", "agenda-map",
  "metric-strip", "metric-spotlight", "kpi-scorecard", "target-actual",
  "okr-tree", "strategy-pillars", "opportunity-sizing", "value-proposition",
  "prioritization-matrix", "risk-register", "risk-heatmap", "decision-matrix",
  "capability-map", "browser-frame", "device-mockup", "product-tour",
  "screenshot-annotation", "code-walkthrough", "code-diff", "terminal-proof",
  "research-question", "methodology", "sample-scope", "findings",
  "limitations", "claim-evidence-map", "team-editorial", "member-spotlight",
  "raci", "persona", "stakeholder-map", "image-duo", "triptych", "collage"
];

it("ships every required semantic component with a complete definition", () => {
  for (const id of requiredIds) {
    expect(visualCatalog.get(id)).toMatchObject({
      fixtureId: expect.any(String),
      inspector: expect.any(Array),
      accessibleSummary: expect.any(Function),
      useWhen: expect.any(Array),
      avoidWhen: expect.any(Array)
    });
  }
});
```

- [ ] **Step 2: Run coverage tests and confirm RED**

Run: `pnpm --filter @deckory/visuals test -- src/components/definitions.test.ts`

Expected: FAIL listing the first missing component.

- [ ] **Step 3: Implement components by focused family**

Each source file exposes small focused renderers that compose native scene primitives. Avoid universal `CardGrid` abstractions. Every component defines content bounds, density variants, editable props, accessible summary and evidence behavior.

- [ ] **Step 4: Add recipe and Studio library metadata**

Recipes must state communication purpose and slot limits. Studio library groups by audience task, not by implementation package.

- [ ] **Step 5: Run component and template tests**

```bash
pnpm --filter @deckory/visuals test -- src/components
pnpm --filter @deckory/templates test
pnpm --filter @deckory/present test -- lib/component-catalog.test.ts
pnpm --filter @deckory/visuals typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit the catalog**

```bash
git add packages/visuals/src/components packages/visuals/src/catalog.ts apps/present/lib/component-catalog.ts packages/templates/src/catalog/recipes.ts packages/templates/src/catalog/catalog.test.ts
git commit -m "feat(visuals): add professional semantic component catalog"
```

---

### Task 7: Add the text-to-visual assistant in Studio

**Files:**
- Create: `apps/present/components/studio-v2/visual-assistant.tsx`
- Create: `apps/present/components/studio-v2/visual-assistant.test.tsx`
- Create: `apps/present/lib/visual-assistant.ts`
- Create: `apps/present/lib/visual-assistant.test.ts`
- Modify: `apps/present/components/studio-v2/studio-v2.tsx`
- Modify: `apps/present/components/studio-command-palette.tsx`

**Interfaces:**
- Produces: `analyzeSelectionForVisuals`, recommendation UI and `applyVisualRecommendation`.

- [ ] **Step 1: Write failing application tests**

```ts
it("preserves source text when converting to a process visual", () => {
  const result = applyVisualRecommendation(deck, {
    slideId: "workflow",
    sourceElementIds: ["paragraph"],
    recommendationId: "linear-process"
  });
  expect(result.deck.slides[0]!.elements.some((element) => element.kind === "diagram")).toBe(true);
  expect(result.deck.slides[0]!.notes).toContain("Thiết lập hồ sơ");
});

it("requests numeric input instead of generating a chart from qualitative text", () => {
  const analysis = analyzeSelectionForVisuals(qualitativeParagraph);
  expect(analysis.recommendations.some((item) => item.family === "chart")).toBe(false);
  expect(analysis.missingInputs).toContainEqual(expect.objectContaining({ kind: "numeric-data" }));
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/present test -- lib/visual-assistant.test.ts`

Expected: FAIL because assistant logic does not exist.

- [ ] **Step 3: Implement analysis and preview**

The assistant shows up to three candidates with:

- visual preview;
- why it fits;
- required missing inputs;
- evidence requirement;
- density warning;
- replace, insert-beside or create-new-slide action.

- [ ] **Step 4: Preserve and expose source content**

Conversion never silently deletes source text. The chosen action either retains it in notes, converts it to accessible detail or keeps it as a hidden source element explicitly visible in Layers.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @deckory/present test -- components/studio-v2/visual-assistant.test.tsx lib/visual-assistant.test.ts
pnpm --filter @deckory/present typecheck
git add apps/present/components/studio-v2/visual-assistant.tsx apps/present/components/studio-v2/visual-assistant.test.tsx apps/present/lib/visual-assistant.ts apps/present/lib/visual-assistant.test.ts apps/present/components/studio-v2/studio-v2.tsx apps/present/components/studio-command-palette.tsx
git commit -m "feat(studio): transform text into explainable visuals"
```

---

### Task 8: Add deck-level storytelling, copy and composition intelligence

**Files:**
- Create: `packages/visuals/src/narrative/narrative-model.ts`
- Create: `packages/visuals/src/narrative/narrative-model.test.ts`
- Create: `packages/visuals/src/narrative/story-audit.ts`
- Create: `packages/visuals/src/narrative/story-audit.test.ts`
- Create: `packages/visuals/src/narrative/copy-transform.ts`
- Create: `packages/visuals/src/narrative/copy-transform.test.ts`
- Create: `packages/visuals/src/narrative/composition-fingerprint.ts`
- Create: `packages/visuals/src/narrative/composition-fingerprint.test.ts`
- Modify: `packages/visuals/src/index.ts`
- Create: `apps/present/components/studio-v2/story-panel.tsx`
- Create: `apps/present/components/studio-v2/story-panel.test.tsx`
- Create: `apps/present/lib/story-commands.ts`
- Create: `apps/present/lib/story-commands.test.ts`
- Modify: `apps/present/components/studio-v2/studio-v2.tsx`
- Modify: `apps/present/components/studio-command-palette.tsx`

**Interfaces:**
- Produces: `DeckNarrative`, `auditNarrative`, `rewriteConclusionHeading`, `splitDenseSlide`, `fingerprintSlideComposition`, `detectCompositionRepetition` and a deck-level Story panel.

- [ ] **Step 1: Write failing narrative-model tests**

```ts
it("requires one primary outcome and thesis for a production narrative", () => {
  expect(() => DeckNarrativeSchema.parse({
    audience: { role: "graduation-committee" },
    sections: []
  })).toThrow(/thesis|outcome/i);
});

it("keeps appendix slides outside the main argument", () => {
  const result = buildNarrativeIndex(deckWithAppendix);
  expect(result.mainSlideIds).not.toContain("appendix-api");
});
```

- [ ] **Step 2: Write failing story-audit tests**

```ts
it("detects a solution introduced before problem evidence", () => {
  const result = auditNarrative(solutionFirstDeck);
  expect(result.diagnostics).toContainEqual(expect.objectContaining({
    code: "solution-before-evidence",
    slideId: "solution"
  }));
});

it("detects repeated topic headings without conclusions", () => {
  const result = auditNarrative(topicHeadingDeck);
  expect(result.diagnostics.filter((item) => item.code === "weak-conclusion-heading")).toHaveLength(3);
});

it("detects five consecutive slides with the same composition fingerprint", () => {
  const result = detectCompositionRepetition(repetitiveDeck);
  expect(result[0]).toMatchObject({ code: "composition-sequence-repeated", count: 5 });
});
```

- [ ] **Step 3: Run narrative tests and confirm RED**

Run:

```bash
pnpm --filter @deckory/visuals test -- src/narrative/narrative-model.test.ts src/narrative/story-audit.test.ts src/narrative/composition-fingerprint.test.ts
```

Expected: FAIL because the narrative modules do not exist.

- [ ] **Step 4: Implement deterministic story analysis**

Analyze:

- thesis and audience outcome;
- section roles and transitions;
- slide purpose and conclusion;
- question answered;
- claim/evidence interpretation;
- main-story versus appendix placement;
- duplicate semantic content;
- composition fingerprint sequence;
- density rhythm;
- opening and closing completeness.

Composition fingerprints use layout mode, dominant element family, occupied regions, scale hierarchy and visual relationship. They must not treat two visually distinct freeform slides as identical merely because both contain text and an image.

- [ ] **Step 5: Write failing constrained-copy tests**

```ts
it("turns a topic heading into a conclusion without changing the claim", () => {
  expect(rewriteConclusionHeading({
    heading: "Kết quả đánh giá",
    evidenceText: "Điểm tăng từ 62 lên 84 sau ba vòng luyện tập."
  })).toMatchObject({
    text: "Ba vòng luyện tập nâng điểm đánh giá từ 62 lên 84.",
    introducedClaims: []
  });
});

it("refuses to invent a result when evidence is missing", () => {
  const result = rewriteConclusionHeading({ heading: "Hiệu quả hệ thống", evidenceText: "" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.code).toBe("evidence-required");
});
```

- [ ] **Step 6: Implement copy transforms with claim preservation**

Supported transforms:

- shorten;
- conclusion heading;
- simplify Vietnamese;
- parallelize list items;
- split dense paragraph;
- remove technical filler;
- create speaker-note draft from existing claims.

Each result returns the original claims, resulting claims, removed phrases and warnings. Reject transformations that change numbers, certainty, limitation or evidence status.

- [ ] **Step 7: Build the Story panel and command actions**

The Story panel shows:

- audience and desired decision;
- thesis;
- section map;
- slide purpose and conclusion;
- story diagnostics;
- repeated composition sequences;
- copy suggestions with before/after diff;
- move to appendix;
- split slide;
- create transition slide;
- accept/reject one suggestion at a time.

No suggestion mutates the deck without an explicit command and undo entry.

- [ ] **Step 8: Verify and commit**

```bash
pnpm --filter @deckory/visuals test -- src/narrative
pnpm --filter @deckory/present test -- components/studio-v2/story-panel.test.tsx lib/story-commands.test.ts
pnpm --filter @deckory/visuals typecheck
pnpm --filter @deckory/present typecheck
git add packages/visuals/src/narrative packages/visuals/src/index.ts apps/present/components/studio-v2/story-panel.tsx apps/present/components/studio-v2/story-panel.test.tsx apps/present/lib/story-commands.ts apps/present/lib/story-commands.test.ts apps/present/components/studio-v2/studio-v2.tsx apps/present/components/studio-command-palette.tsx
git commit -m "feat(story): audit narrative and conclusion copy"
```

---

### Task 9: Add evidence, data-source and chart-data management

**Files:**
- Create: `packages/schema/src/v2-evidence.ts`
- Create: `packages/schema/src/v2-evidence.test.ts`
- Modify: `packages/schema/src/v2.ts`
- Create: `packages/scene/src/data-sources.ts`
- Create: `packages/scene/src/data-sources.test.ts`
- Create: `packages/scene/src/data-transform.ts`
- Create: `packages/scene/src/data-transform.test.ts`
- Modify: `packages/scene/src/index.ts`
- Create: `apps/present/components/studio-v2/data/source-manager.tsx`
- Create: `apps/present/components/studio-v2/data/source-manager.test.tsx`
- Create: `apps/present/components/studio-v2/data/chart-data-editor.tsx`
- Create: `apps/present/components/studio-v2/data/chart-data-editor.test.tsx`
- Create: `apps/present/components/studio-v2/data/claim-evidence-panel.tsx`
- Create: `apps/present/components/studio-v2/data/claim-evidence-panel.test.tsx`
- Modify: `apps/present/components/studio-v2/inspector/field-registry.ts`
- Modify: `packages/audit/src/index.ts`
- Modify: `packages/audit/src/index.test.ts`

**Interfaces:**
- Produces: `DeckDataSource`, `ClaimRecord`, `EvidenceRecord`, `Dataset`, `DataTransform`, `resolveDataset`, `traceSourceDependents` and Studio source/data editors.

- [ ] **Step 1: Write failing evidence-schema tests**

```ts
it("rejects a claim that references missing evidence", () => {
  expect(() => DeckDocumentV2Schema.parse(deckWithMissingEvidence)).toThrow(/evidence/i);
});

it("requires illustrative data to remain labelled", () => {
  expect(() => EvidenceRecordSchema.parse({
    id: "fixture-score",
    sourceId: "fixture",
    label: "Điểm chất lượng",
    status: "illustrative"
  })).toThrow(/illustrative label/i);
});
```

- [ ] **Step 2: Write failing dataset and transform tests**

```ts
it("resolves one local dataset for multiple charts without duplicating rows", () => {
  const resolved = resolveDataset(deck, "quality-scores");
  expect(resolved.rows).toHaveLength(4);
  expect(deck.slides.filter((slide) => JSON.stringify(slide).includes("quality-scores"))).toHaveLength(2);
});

it("records an inspectable aggregate transform", () => {
  const result = applyDataTransform(dataset, {
    id: "average-by-round",
    type: "group-aggregate",
    groupBy: ["round"],
    measures: [{ field: "score", operation: "mean", output: "averageScore" }]
  });
  expect(result.lineage.transformId).toBe("average-by-round");
});

it("lists every dependent claim and visual before source deletion", () => {
  expect(traceSourceDependents(deck, "interview-evaluation")).toEqual(expect.arrayContaining([
    expect.objectContaining({ kind: "claim", id: "claim-score-improvement" }),
    expect.objectContaining({ kind: "chart", slideId: "results" })
  ]));
});
```

- [ ] **Step 3: Run evidence/data tests and confirm RED**

```bash
pnpm --filter @deckory/schema test -- src/v2-evidence.test.ts
pnpm --filter @deckory/scene test -- src/data-sources.test.ts src/data-transform.test.ts
```

Expected: FAIL because evidence and dataset contracts do not exist.

- [ ] **Step 4: Implement source, evidence and transformation contracts**

Support local/manual, CSV, JSON, table, document, code, image and URL-reference metadata sources. URL references are never fetched by Presenter. Transform operations are versioned and initially limited to select, filter, sort, derive, group-aggregate and pivot. Every output includes lineage to source IDs and transform IDs.

- [ ] **Step 5: Build the Source Manager**

Required behavior:

- add and rename source;
- select a local asset;
- set source date and evidence status;
- view dependent claims and visuals;
- mark stale, verified, unverified or illustrative;
- block destructive deletion until dependents are reviewed;
- expose privacy/copyright note fields;
- no network fetch action in the offline V2 release.

- [ ] **Step 6: Build chart data and claim-evidence editors**

Chart data editor supports:

- bind to dataset;
- choose category, value and series fields;
- edit explicit manual rows;
- preview number format and missing values;
- inspect transformations;
- set unit, period and sample;
- label fixture data.

Claim-evidence panel links slide or element claims to one or more evidence records and reports unsupported or stale material claims.

- [ ] **Step 7: Add strict audit rules**

Audit detects:

- material unsupported claim;
- stale source;
- chart/table without source binding or explicit manual status;
- undeclared transformation;
- illustrative values without visible label;
- deleted/missing source reference;
- source date or period required by the selected visual but absent.

- [ ] **Step 8: Verify and commit**

```bash
pnpm --filter @deckory/schema test -- src/v2-evidence.test.ts
pnpm --filter @deckory/scene test -- src/data-sources.test.ts src/data-transform.test.ts
pnpm --filter @deckory/present test -- components/studio-v2/data
pnpm --filter @deckory/audit test
pnpm typecheck
git add packages/schema/src/v2-evidence.ts packages/schema/src/v2-evidence.test.ts packages/schema/src/v2.ts packages/scene/src/data-sources.ts packages/scene/src/data-sources.test.ts packages/scene/src/data-transform.ts packages/scene/src/data-transform.test.ts packages/scene/src/index.ts apps/present/components/studio-v2/data apps/present/components/studio-v2/inspector/field-registry.ts packages/audit/src/index.ts packages/audit/src/index.test.ts
git commit -m "feat(evidence): manage sources, claims and chart data"
```

---

### Task 10: Build and visually audit the V2 Visual Gallery

**Files:**
- Create: `decks/visual-lab-v2/package.json`
- Create: `decks/visual-lab-v2/tsconfig.json`
- Create: `decks/visual-lab-v2/deck.tsx`
- Create: `decks/visual-lab-v2/deck.test.ts`
- Modify: `apps/present/lib/deck-catalog.ts`
- Create: `tests/e2e/visual-lab-v2.spec.ts`
- Modify: `packages/audit/src/index.ts`
- Modify: `packages/audit/src/index.test.ts`

**Interfaces:**
- Proves every public chart, diagram and semantic component in full-size and thumbnail rendering.

- [ ] **Step 1: Generate a complete gallery inventory test**

The test compares public visual catalog IDs against fixture usage and fails with the exact missing IDs. No catalog item may rely only on unit-test markup.

- [ ] **Step 2: Author gallery slides by communication family**

Use one insight per slide, real explanatory fixture relationships and varied compositions. Label all numbers `Dữ liệu fixture minh hoạ`.

- [ ] **Step 3: Add audit rules**

Audit must detect:

- missing summary/evidence;
- chart without unit;
- multiple primary highlights;
- detached legend where direct labels are available;
- diagram layout failure;
- unreadable minimum label size;
- catalog item without fixture.

- [ ] **Step 4: Run unit and strict audit**

```bash
pnpm --filter @deckory/visuals test
pnpm --filter @deckory/audit test
pnpm audit:decks -- --strict
```

Expected: PASS.

- [ ] **Step 5: Run browser QA**

Run: `pnpm test:e2e -- tests/e2e/visual-lab-v2.spec.ts`

Capture representative screenshots for:

- editorial bar;
- waterfall;
- sankey;
- treemap;
- heatmap;
- layered architecture;
- long-label dependency graph;
- product tour;
- academic evidence map;
- team editorial;
- collage;
- thumbnail overview.

- [ ] **Step 6: Inspect and correct visual defects**

Reject any fixture with clipped labels, old dashboard styling, repeated equal-card composition, excessive top-right emptiness, decorative charting or unreadable thumbnails.

- [ ] **Step 7: Run plan-level verification**

```bash
pnpm --filter @deckory/visuals test
pnpm --filter @deckory/templates test
pnpm --filter @deckory/audit test
pnpm --filter @deckory/present test
pnpm typecheck
pnpm lint
pnpm audit:decks -- --strict
pnpm assets:check
pnpm build
pnpm test:e2e -- tests/e2e/visual-lab-v2.spec.ts
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit the verified visual system**

```bash
git add packages/visuals packages/templates packages/audit apps/present decks/visual-lab-v2 tests/e2e/visual-lab-v2.spec.ts pnpm-lock.yaml
git commit -m "feat(visuals): prove the V2 visual grammar"
```

## Plan Self-Review

- Spec coverage: intent classification, recommendation, editorial charts, advanced charts, measured diagrams, the complete semantic catalog, text-to-visual transformation, deck-level storytelling, copy constraints, composition diversity, evidence/data lineage and gallery evidence are covered.
- Placeholder scan: required component and chart families are explicitly named and covered by inventory tests.
- Type consistency: public documents use `ChartSpec` and `DiagramSpec`; ECharts and ELK remain internal adapters.
- Exit condition: Plan 05 starts only when every public visual is represented by a complete editable fixture and long Vietnamese labels no longer clip or collide.
