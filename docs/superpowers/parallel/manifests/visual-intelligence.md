# Visual Intelligence Track Manifest

## Track status

The isolated Visual Intelligence core is implemented and verified inside its owned package. This manifest does **not** claim renderer, Studio, audit, template, export or browser completion. Those capabilities remain integration-gate responsibilities documented below.

## Exact execution context

```text
TRACK=Visual Intelligence Core
BASE_COMMIT=4425113417a1a064695525baef1af822b4be430b
BASE_BRANCH=feat/deckory-v2-scene-foundation
TRACK_BRANCH=feat/v2-visual-intelligence-core
WORKTREE=C:\Users\KanzuWakazaki\.devspace\profiles\Deckory\session-1\worktrees\Deckory-b1874421
FINAL_REVIEW_BASE=2f27b76d2aec6a172d0d8efe9a92e88246809adb
FINAL_REVIEW_BRANCH=feat/v2-visual-intelligence-final
FINAL_REVIEW_WORKTREE=C:\Users\KanzuWakazaki\.devspace\profiles\Deckory\session-1\worktrees\Deckory-6f845517
ORIGINAL_DIRTY_CHECKOUT=F:\Deckory
```

The original checkout was not used for implementation and was not reset, cleaned, staged or committed.

The managed worktree writes a Windows Git pointer. Connector shell commands therefore used `git.exe`; package commands used Windows `node.exe` with the repository's Corepack/pnpm entrypoint.

## Commits

Implementation and request commits, in order:

1. `948cbba4e930a92a87702c3734696ff150fbe04c` — `feat(visuals): classify and recommend visual intent`
2. `8c72b56fff5cf2d3a2e90c3588a069ee6e5dad4c` — `feat(story): audit narrative and constrained copy`
3. `b938de44d041a54e1f0a95c326708204591f5954` — `feat(evidence): add local data lineage domain`
4. `09857eb236792bcff4bfbdbd7996d1fc22aaa392` — `feat(charts): add typed editorial chart core`
5. `86c80a20ac9e44929e8f682af5812c0d87ded3ac` — `feat(diagrams): add measured deterministic layouts`
6. `901c85e3b4d6b7b89a4549d4c0f891904b7d2a14` — `feat(visuals): add catalog coverage inventory`
7. `ed20ee3911b8e08c54b11168f7027b6587f26dc1` — `docs(visuals): record integration requests`
8. `f13c8f5ffd6c03326ed1e1e388f08634b5b43cdb` — `docs(visuals): add track integration manifest`
9. `54c95672bae59c2ab6a79c738c324c1e4c7d46c7` — `fix(visuals): harden recommendation evidence inputs`
10. `0f0d27c4b4fdc462dbd33905a171262df86cb919` — `fix(story): strengthen narrative and claim diagnostics`
11. `4f87c9436afef291d82d118f6ad1678efba67667` — `fix(evidence): validate datasets and transform lineage`
12. `757f30e0570a240daea4f44e573a678aa68bdd78` — `fix(charts): preserve truthful editorial geometry`
13. `09da854787503173b9aaa8aaacd6a991a7ae621b` — `fix(diagrams): validate complete graph layouts`
14. `838cdbbd6a100baadd57b2f994a3882bc4cf8533` — `fix(visuals): harden adapter and fixture boundaries`
15. `1feb709906820bd18340bc5e2ad1ebb9545b64c6` — `fix(story): make narrative contracts strict`
16. `2f27b76d2aec6a172d0d8efe9a92e88246809adb` — `docs(visuals): finalize reviewed track manifest`
17. `8a28195ba0ad01b44413132170b8f89d2051127e` — `fix(visuals): consolidate final intelligence hardening`

The final commit containing this consolidated manifest is reported by the session result because a Git commit cannot embed its own SHA without changing that SHA.

## Owned files changed

Only `packages/visuals/**` and allowed Visual Intelligence manifest/request documents were created or modified.

### Package configuration and public barrel

- `packages/visuals/package.json`
- `packages/visuals/tsconfig.json`
- `packages/visuals/src/index.ts`

### Intent, recommendation and catalog

- `packages/visuals/src/intent.ts`
- `packages/visuals/src/intent.test.ts`
- `packages/visuals/src/catalog.ts`
- `packages/visuals/src/catalog.test.ts`
- `packages/visuals/src/recommend.ts`
- `packages/visuals/src/recommend.test.ts`

### Narrative, copy and composition

- `packages/visuals/src/narrative/narrative-model.ts`
- `packages/visuals/src/narrative/narrative-model.test.ts`
- `packages/visuals/src/narrative/story-audit.ts`
- `packages/visuals/src/narrative/story-audit.test.ts`
- `packages/visuals/src/narrative/copy-transform.ts`
- `packages/visuals/src/narrative/copy-transform.test.ts`
- `packages/visuals/src/narrative/composition-fingerprint.ts`
- `packages/visuals/src/narrative/composition-fingerprint.test.ts`

### Evidence, datasets and transformation lineage

- `packages/visuals/src/evidence/domain.ts`
- `packages/visuals/src/evidence/domain.test.ts`
- `packages/visuals/src/evidence/data-transform.ts`
- `packages/visuals/src/evidence/data-transform.test.ts`
- `packages/visuals/src/evidence/lineage.ts`

### Charts

- `packages/visuals/src/charts/chart-spec.ts`
- `packages/visuals/src/charts/chart-spec.test.ts`
- `packages/visuals/src/charts/chart-format.ts`
- `packages/visuals/src/charts/chart-format.test.ts`
- `packages/visuals/src/charts/editorial-geometry.ts`
- `packages/visuals/src/charts/editorial-geometry.test.ts`
- `packages/visuals/src/charts/echarts-adapter.ts`
- `packages/visuals/src/charts/echarts-adapter.test.ts`

### Diagrams

- `packages/visuals/src/diagrams/diagram-spec.ts`
- `packages/visuals/src/diagrams/diagram-spec.test.ts`
- `packages/visuals/src/diagrams/measure.ts`
- `packages/visuals/src/diagrams/measure.test.ts`
- `packages/visuals/src/diagrams/layout.ts`
- `packages/visuals/src/diagrams/layout.test.ts`
- `packages/visuals/src/diagrams/elk-adapter.ts`
- `packages/visuals/src/diagrams/elk-adapter.test.ts`

### Coverage and fixture inventory

- `packages/visuals/src/inventory.ts`
- `packages/visuals/src/inventory.test.ts`

### Integration requests

- `docs/superpowers/parallel/requests/visual-intelligence-schema-evidence-contracts.md`
- `docs/superpowers/parallel/requests/visual-intelligence-renderer-adapters.md`
- `docs/superpowers/parallel/requests/visual-intelligence-studio-audit-template-wiring.md`

No schema, scene, renderer, Studio, templates, audit, root manifest or lockfile was committed by this track.

## Public interface inventory

Everything below is exported through `packages/visuals/src/index.ts`.

### Visual intent and recommendation

**Functions/constants**

- `visualIntents`
- `classifyVisualIntent`
- `recommendVisuals`
- `visualCatalog`
- `getVisualCatalogEntry`
- `validateVisualCatalog`

**Types**

- `VisualIntent`
- `ExtractedClaimKind`
- `ExtractedClaim`
- `ExtractedSide`
- `NumericClaimRole`
- `NumericClaim`
- `StructuredRelationship`
- `VisualIntentHints`
- `VisualIntentInput`
- `VisualIntentAnalysis`
- `VisualInputStatus`
- `ResolvedVisualInputRequirement`
- `VisualAlternative`
- `VisualRecommendation`
- `VisualFamily`
- `VisualInputKind`
- `VisualInputRequirement`
- `EvidenceRequirement`
- `RendererCapability`
- `VisualCatalogEntry`
- `CatalogDiagnostic`

### Narrative, copy and composition

**Schemas/functions**

- `NarrativeSectionRoleSchema`
- `AudienceProfileSchema`
- `NarrativeSectionSchema`
- `DeckNarrativeSchema`
- `buildNarrativeIndex`
- `auditNarrative`
- `analyzeClaimPreservation`
- `rewriteConclusionHeading`
- `removeTechnicalFiller`
- `shortenCopy`
- `simplifyProfessionalVietnamese`
- `parallelizeList`
- `splitDenseCopy`
- `draftSpeakerNotes`
- `fingerprintSlideComposition`
- `detectCompositionRepetition`

**Types**

- `NarrativeSectionRole`
- `AudienceProfile`
- `NarrativeSection`
- `DeckNarrative`
- `NarrativeEvidenceStatus`
- `NarrativeSlide`
- `NarrativeIndex`
- `NarrativeDiagnosticCode`
- `NarrativeDiagnostic`
- `NarrativeAuditInput`
- `NarrativeAuditResult`
- `NumericClaimChange`
- `SemanticClaimChange`
- `ClaimPreservationReport`
- `CopyTransformSuccess`
- `CopyTransformFailure`
- `CopyTransformResult`
- `LayoutMode`
- `CompositionFrame`
- `SlideCompositionInput`
- `CompositionFingerprint`
- `CompositionRepetitionDiagnostic`

### Evidence, data and lineage

**Schemas/functions**

- `EvidenceStatusSchema`
- `DataSourceKindSchema`
- `DeckDataSourceSchema`
- `EvidenceRecordSchema`
- `ClaimRecordSchema`
- `DataValueSchema`
- `DatasetColumnSchema`
- `TransformLineageStepSchema`
- `DatasetLineageSchema`
- `DatasetSchema`
- `VisualDataBindingSchema`
- `EvidenceDomainSchema`
- `validateEvidenceDomain`
- `applyDataTransform`
- `applyDataTransforms`
- `traceSourceDependents`
- `resolveDataset`

**Types**

- `EvidenceStatus`
- `DataSourceKind`
- `DeckDataSource`
- `EvidenceRecord`
- `ClaimRecord`
- `DataValue`
- `DataRow`
- `DatasetColumn`
- `TransformLineageStep`
- `DatasetLineage`
- `Dataset`
- `VisualDataBinding`
- `EvidenceDomain`
- `EvidenceDomainDiagnosticCode`
- `EvidenceDomainDiagnostic`
- `SelectTransform`
- `FilterOperator`
- `FilterTransform`
- `SortTransform`
- `DeriveOperand`
- `DeriveExpression`
- `DeriveTransform`
- `AggregateOperation`
- `GroupAggregateTransform`
- `PivotTransform`
- `DataTransform`
- `DataTransformDiagnosticCode`
- `DataTransformDiagnostic`
- `DataTransformSuccess`
- `DataTransformFailure`
- `DataTransformResult`
- `SourceDependentKind`
- `SourceDependent`
- `ResolvedDatasetReference`

### Chart domain, geometry and ECharts boundary

**Schemas/constants/functions/interfaces**

- `editorialChartVariants`
- `advancedChartVariants`
- `ChartVariantSchema`
- `ChartDatumSchema`
- `ChartEncodingSchema`
- `NumberFormatSpecSchema`
- `DirectLabelPolicySchema`
- `ChartHighlightSchema`
- `ChartAnnotationSchema`
- `ChartReferenceLineSchema`
- `ChartEvidenceSchema`
- `ChartAnimationPolicySchema`
- `ChartSpecSchema`
- `formatChartValue`
- `buildEditorialChartGeometry`
- `isEChartsVariant`
- `resolveEChartsRenderConfig`
- `createEChartsRenderRequest`
- `EChartsAdapter`

**Types**

- `ChartVariant`
- `ChartDatum`
- `ChartEncoding`
- `NumberFormatSpec`
- `DirectLabelPolicy`
- `ChartHighlight`
- `ChartAnnotation`
- `ChartReferenceLine`
- `ChartEvidence`
- `ChartAnimationPolicy`
- `ChartSpec`
- `ChartGeometryBounds`
- `ChartGeometryMark`
- `ChartGeometryLabel`
- `ChartGeometryDiagnostic`
- `ChartBaseline`
- `EditorialGeometrySuccess`
- `EditorialGeometryFailure`
- `EditorialGeometryResult`
- `AdvancedChartVariant`
- `ChartRenderMode`
- `EChartsRenderConfig`
- `EChartsRenderRequest`
- `EChartsSvgResult`

### Diagram domain, measurement, layout and ELK boundary

**Schemas/functions/interfaces**

- `DiagramLayoutStrategySchema`
- `DiagramDirectionSchema`
- `DiagramPortSchema`
- `DiagramNodeSchema`
- `DiagramEndpointSchema`
- `DiagramEdgeSchema`
- `DiagramPositionedNodeSchema`
- `DiagramPointSchema`
- `DiagramRoutedEdgeSchema`
- `GeneratedDiagramLayoutSchema`
- `DiagramManualOverrideSchema`
- `DiagramEvidenceSchema`
- `DiagramSpecSchema`
- `measureTextBlock`
- `measureDiagramNodes`
- `layoutDiagram`
- `createElkLayoutRequest`
- `ElkLayoutAdapter`

**Types**

- `DiagramLayoutStrategy`
- `DiagramDirection`
- `DiagramPort`
- `DiagramNode`
- `DiagramEndpoint`
- `DiagramEdge`
- `DiagramPositionedNode`
- `DiagramPoint`
- `DiagramRoutedEdge`
- `GeneratedDiagramLayout`
- `DiagramManualOverride`
- `DiagramEvidence`
- `DiagramSpec`
- `TextMeasureOptions`
- `MeasuredTextBlock`
- `DiagramNodeMeasureOptions`
- `MeasuredDiagramNode`
- `DiagramLayoutBounds`
- `LaidOutDiagramNode`
- `LaidOutDiagramEdge`
- `DiagramLayoutDiagnosticCode`
- `DiagramLayoutDiagnostic`
- `DiagramLayoutSuccess`
- `DiagramLayoutFailure`
- `DiagramLayoutResult`
- `ElkLayoutStrategy`
- `ElkLayoutRequestNode`
- `ElkLayoutRequestEdge`
- `ElkLayoutRequest`
- `ElkLayoutResult`

### Catalog coverage and fixture inventory

**Constants/functions**

- `requiredDiagramVisualIds`
- `requiredSemanticVisualIds`
- `visualCoverageCatalog`
- `visualFixtureInventory`
- `validateVisualCoverageInventory`

**Types**

- `VisualCoverageKind`
- `VisualCoverageRenderer`
- `VisualCoverageEntry`
- `VisualFixtureRecord`
- `RequiredDiagramVisualId`
- `RequiredSemanticVisualId`
- `VisualCoverageDiagnostic`

## Behavior and coverage inventory

### Intent and recommendations

- 27 deterministic intent values.
- Explicit extraction of claims, ordered steps, sides, entities and locale-aware numeric claims.
- Numeric roles distinguish value, date, identifier and ordinal semantics; only value claims satisfy chart evidence.
- Deterministic ranking with reasons, alternatives, input status, evidence requirements and warnings.
- Numeric chart candidates are excluded when no chart-eligible value exists.
- No external model or network dependency in the deterministic core.

### Narrative/copy/composition

- Required audience, primary outcome, thesis and section-role domain.
- Main-story/appendix indexing and duplicate assignment checks.
- Diagnostics for weak thesis, solution-before-evidence, context without tension, evidence without interpretation, abrupt transitions, duplicate slides, weak conclusion headings, weak closing, appendix leakage and missing/unassigned slides.
- Constrained copy operations: conclusion heading, shorten, professional Vietnamese simplification, list parallelization, dense-copy split, technical-filler removal and speaker-note drafting.
- Claim-preservation reports track numeric meaning, direction, polarity, temporal scope, certainty and limitations; locale-format-only changes remain equivalent while real value changes are refused.
- Composition fingerprints include layout mode, dominant visual family, relationship, occupied regions, scale hierarchy and quantized freeform geometry.

### Evidence and datasets

- Source kinds: manual, CSV, JSON, table, document, code, image and URL-reference metadata.
- Evidence states: verified, unverified, illustrative and stale.
- Claims, evidence, datasets and visual bindings have deterministic cross-reference diagnostics.
- URL references contain metadata only; no fetch contract exists.
- Six declarative transforms: select, filter, sort, derive, group-aggregate and pivot.
- Every transform output retains source IDs, source dataset ID, transform ID/type/version and row counts.
- Source-dependent tracing covers evidence, claims, datasets, charts, diagrams and tables.

### Charts

- 30 typed `ChartVariant` values.
- 11 editorial variants with pure geometry declarations:
  - horizontal bar;
  - vertical bar;
  - grouped bar;
  - stacked bar;
  - line;
  - area;
  - dot plot;
  - lollipop;
  - bullet;
  - slope;
  - waterfall.
- 19 advanced variants behind `EChartsAdapter`:
  - scatter;
  - bubble;
  - histogram;
  - box plot;
  - heatmap;
  - calendar heatmap;
  - donut;
  - waffle;
  - treemap;
  - sunburst;
  - funnel;
  - sankey;
  - radar;
  - gauge;
  - Gantt;
  - timeline;
  - small multiples;
  - choropleth;
  - proportional-symbol map.
- Direct-label policy, primary-highlight limit, annotations, reference lines, unit/number format, missing-value policy, evidence and local geography asset contracts.
- Impossible ranges and negative weighted flows are rejected; line/area gaps stay disconnected and label policy is respected.
- SVG-only ECharts request/result boundary; no raw ECharts option in public exports.

### Diagrams

- 38 diagram visual-family metadata records.
- Deterministic core layouts: tree, radial, timeline, matrix and cycle.
- Manual layout applies overrides separately from generated layout.
- Adapter-only strategies: `elk-layered` and `elk-force`.
- Typed nodes, ports, endpoints and edges with source/target direction validation.
- Deterministic Vietnamese-safe text measurement fallback and line wrapping.
- Fit, collision, missing-generated-layout, graph-cycle and adapter-required diagnostics.
- Orthogonal/polyline/straight/spline routing contracts.
- No raw ELK graph/layout options in public exports.

### Catalog and fixtures

- 15 recommendation catalog entries with complete use/avoid, input, evidence, density, accessibility, renderer and export metadata.
- All 27 public visual intents have at least one deterministic recommendation candidate.
- 46 required semantic editorial/composition entries from the Plan 04 component inventory.
- 114 coverage entries: 30 chart variants, 38 diagram families and 46 semantic components.
- 118 stable fixture records after including recommendation-only editorial/composition fixtures.
- Every fixture is explicitly illustrative and requires visible evidence labeling.
- Every fixture records unit coverage and `required-after-integration` browser review status.

## TDD evidence

Strict RED was observed before production modules were added:

| Slice | RED command | Expected failure |
|---|---|---|
| Intent/catalog/recommendation | `pnpm --filter @deckory/visuals test -- src/intent.test.ts src/catalog.test.ts src/recommend.test.ts` | Missing `intent`, `catalog` and `recommend` modules |
| Narrative/copy/composition | `pnpm --filter @deckory/visuals test -- src/narrative/narrative-model.test.ts src/narrative/story-audit.test.ts src/narrative/copy-transform.test.ts src/narrative/composition-fingerprint.test.ts` | Missing narrative modules |
| Evidence/data lineage | `pnpm --filter @deckory/visuals test -- src/evidence/domain.test.ts src/evidence/data-transform.test.ts` | Missing evidence/domain and transform modules |
| Charts | `pnpm --filter @deckory/visuals test -- src/charts/chart-spec.test.ts src/charts/chart-format.test.ts src/charts/editorial-geometry.test.ts src/charts/echarts-adapter.test.ts` | Missing chart modules |
| Diagrams | `pnpm --filter @deckory/visuals test -- src/diagrams/diagram-spec.test.ts src/diagrams/measure.test.ts src/diagrams/layout.test.ts src/diagrams/elk-adapter.test.ts` | Missing diagram modules |
| Inventory | `pnpm --filter @deckory/visuals test -- src/inventory.test.ts` | Missing inventory module |

Focused GREEN progression:

- intent/catalog/recommendation: 12 tests;
- narrative/copy/composition: 27 cumulative tests;
- evidence/data lineage: 37 cumulative tests;
- chart core/adapters: 56 cumulative tests;
- diagram core/adapters: 76 cumulative tests;
- inventory: 82 cumulative tests;
- recommendation evidence/input hardening: 87 cumulative tests;
- narrative and claim diagnostics: 91 cumulative tests;
- dataset and transform-lineage validation: 95 cumulative tests;
- truthful chart geometry: 100 cumulative tests;
- complete diagram graph validation: 105 cumulative tests;
- adapter and fixture-boundary validation: 107 cumulative tests;
- strict narrative contracts: 108 cumulative tests;
- consolidated final review: 117 cumulative tests.

Final consolidation RED was observed on top of the 108-test reviewed branch:

| Review boundary | Observed RED |
|---|---|
| Semantic catalog coverage | Required semantic inventory export was absent |
| Locale numeric intent | Vietnamese grouping was split; stage ordinals counted as chart values |
| Chart validation | Invalid box ranges and negative Sankey flows parsed successfully |
| Editorial geometry | Line gaps were bridged and grouped/stacked labels ignored `mode: none` |
| Dataset boundary | Mixed-type pivot input reached the stronger existing `invalid-dataset` refusal; duplicate aggregate outputs remained covered |
| Claim preservation | Equivalent locale-formatted values were reported as changed claims |

Systematic fixes were made only after root causes were reproduced:

- Unicode `\b` behavior around Vietnamese letters;
- stale inherited highlight/animation fixture metadata after changing chart variants;
- `exactOptionalPropertyTypes` object construction;
- explicit `id` to `portId` translation at the ELK boundary;
- TypeScript exhaustiveness fallback for editorial geometry;
- calendar years distinguished from quantitative chart evidence;
- structured geography, relationship and evidence availability distinguished from intent labels;
- missing closing, repeated conclusions and section-boundary narrative bridges;
- polarity and temporal-scope claim preservation;
- strict dataset row/column validation and collision-free transform lineage;
- truthful zero-baseline chart geometry, bullet target domains and series-safe slope geometry;
- complete traversal/generated-layout contracts, graph-cycle refusal and typed-port routing;
- ELK request bounds/measurement validation and orphan-fixture diagnostics;
- locale-sensitive grouping/decimal parsing and ordinal classification;
- missing-value segment continuity and direct-label policy propagation;
- canonical numeric-meaning comparison without weakening polarity, certainty, limitation or temporal-scope checks;
- concurrent-review reconciliation by consolidating from `2f27b76d2aec6a172d0d8efe9a92e88246809adb` instead of overwriting either review branch.

## Deterministic repeat evidence

Repeat-run assertions cover:

- identical intent analysis for identical input;
- identical recommendation ranking and explanations;
- freeform fingerprint normalization independent of region ordering;
- identical evidence-domain diagnostics;
- identical transform output and lineage;
- identical editorial chart geometry;
- identical tree, radial, timeline, matrix and cycle layouts;
- identical coverage-inventory validation.

## Verification evidence

### Accepted base baseline

Executed in the managed worktree before implementation:

```text
pnpm --filter @deckory/schema test
pnpm --filter @deckory/scene test
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/present test -- components/slide-frame.test.tsx components/deck-thumbnail.test.tsx
pnpm typecheck
```

Results:

- schema: 36 passed;
- scene: 13 passed;
- renderer: 3 passed;
- present: 134 passed;
- workspace typecheck: passed.

### Final package gate before this manifest

```text
pnpm --filter @deckory/visuals test
pnpm --filter @deckory/visuals typecheck
pnpm --filter @deckory/visuals lint
```

Results:

- 18 test files passed;
- 117 tests passed;
- 0 failed;
- package typecheck passed;
- package lint script passed.

### Workspace regression gate before this manifest

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Results:

- 353 tests passed across workspace packages, app, deck and script suites;
- 0 failed;
- all available workspace typechecks passed;
- all available workspace lint scripts passed;
- Next.js production build compiled and generated all Preview, Presenter, Studio and Export routes.

### Diff/ownership checks

```text
git diff --check 2f27b76d2aec6a172d0d8efe9a92e88246809adb..HEAD
git diff --check 4425113417a1a064695525baef1af822b4be430b..HEAD
```

Both consolidation-delta and full-track checks passed before manifest creation. The changed-path inventory contains only `packages/visuals/**` and allowed `docs/superpowers/parallel/{requests,manifests}/**` paths. `pnpm-lock.yaml` was restored after pnpm generated a local importer and is not part of this track.

## Dependency requests

The coordinator must perform one reviewed dependency installation and lockfile update after accepting the track:

| Package | Exact registry version verified | Use |
|---|---:|---|
| `zod` | `4.4.3` | Already declared by `@deckory/visuals`; coordinator must add the workspace importer to the lockfile |
| `echarts` | `6.1.0` | Advanced SVG chart adapter only |
| `elkjs` | `0.12.0` | Layered/force diagram layout adapter, preferably behind a worker |

Exact adapter and bundle constraints are recorded in `visual-intelligence-renderer-adapters.md`.

## Contract and integration requests

1. `visual-intelligence-schema-evidence-contracts.md`
   - Chart/diagram scene-element variants;
   - optional deck-level visual-intelligence document field;
   - schema package dependency without introducing a cycle;
   - no raw vendor payloads.
2. `visual-intelligence-renderer-adapters.md`
   - ECharts 6.1.0 SVG adapter;
   - ELK.js 0.12.0 layout adapter;
   - local geography assets;
   - reduced-motion/thumbnail/export final-state rules.
3. `visual-intelligence-studio-audit-template-wiring.md`
   - Visual Assistant;
   - Story panel;
   - source/data/evidence management;
   - audit rules;
   - template/catalog integration.

## Unresolved renderer requirements

- Wire chart and diagram scene-element variants after schema acceptance.
- Render editorial geometry with theme tokens and direct accessible labels.
- Implement the private ECharts module registration/translation adapter and inspect generated SVG.
- Implement ELK worker execution, timeout warning and Deckory-only result translation.
- Replace or calibrate the deterministic text estimator against shared renderer font metrics.
- Verify annotation/label collisions, long Vietnamese labels and minimum readable sizes in the real renderer.
- Keep advanced dependencies out of Presenter bundles when no advanced visual is used.

## Unresolved Studio requirements

- Visual Assistant UI and undoable apply commands.
- Story panel, section editing and one-suggestion-at-a-time acceptance.
- Source Manager, chart-data editor and claim/evidence panel.
- Explicit preservation of source text during text-to-visual conversion.
- Manual diagram node overrides, typed edge editing and re-layout controls.
- Inspector metadata and shared catalog wiring.

## Unresolved evidence/audit/template requirements

- Persist the local evidence domain through DeckDocument V2.
- Enforce source/evidence/dataset/claim cross-reference validation at load/save boundaries.
- Add strict audit rules for unsupported/stale/illustrative material and undeclared lineage.
- Integrate `visualCoverageCatalog` and `visualFixtureInventory` into templates and the Studio library.
- Create complete gallery deck fixtures; metadata inventory alone is not browser evidence.

## Unresolved browser and export review

No browser, screenshot, Presenter, Studio, export or PowerPoint claim is made by this track. After integration, browser QA must cover at minimum:

- editorial horizontal bar and waterfall;
- scatter, heatmap, treemap and sankey through ECharts SVG;
- layered architecture and force/network layouts through ELK;
- long Vietnamese labels and diagram fit diagnostics;
- reduced motion, thumbnail mode and deterministic export mode;
- local-only choropleth assets;
- visible illustrative-data/evidence labels;
- accessible summaries and keyboard traversal;
- no console/page errors and no remote data/map fetch.

Representative full-size and thumbnail screenshots must be inspected before the coordinator can accept browser completeness.
