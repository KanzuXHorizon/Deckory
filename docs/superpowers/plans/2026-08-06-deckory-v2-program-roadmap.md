# Deckory V2 Program Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this roadmap plan-by-plan. Each linked plan contains checkbox (`- [ ]`) tasks and red-green-refactor gates.

**Goal:** Coordinate the six independently testable Deckory V2 implementation plans into one safe delivery program that upgrades the document model, Studio, custom-code authoring, visual grammar, design system, motion, export and production readiness without breaking V1 decks.

**Architecture:** This roadmap follows a Spec Kit–style “spec of specs” structure. The program specification defines the product contract; six child plans implement independently reviewable vertical slices in dependency order. Every phase remains feature-flagged or V1-compatible until its acceptance gate passes.

**Tech Stack:** TypeScript 5.9, Zod 4, React 19, Next.js 16, Motion 13, Vitest 4, Playwright, pnpm workspaces, `react-moveable`, `react-selecto`, `esbuild-wasm`, Apache ECharts 6 and elkjs.

## Global Constraints

- Program specification: `docs/superpowers/specs/2026-08-06-deckory-v2-program-design.md`.
- Written against repository HEAD `0485fbe`; every executor must record the actual starting HEAD and working-tree status again before execution.
- The checkout is already heavily modified by other batches. Never reset, checkout, clean, delete, stage, commit or overwrite unrelated paths.
- Use an isolated managed worktree for implementation unless the user explicitly instructs work on the current checkout.
- V1 validation, Preview, Presenter and Export remain operational until every registered production deck is migrated and accepted.
- Canonical V2 source is typed JSON/TypeScript `DeckDocumentV2`; XML, SVG and OOXML are import/export boundaries only.
- No remote runtime assets, arbitrary parent-DOM access or unreviewed package installation.
- All user-facing copy is professional Vietnamese unless a deck explicitly uses another locale.
- Every behavior change follows TDD: failing test, verified RED, minimal implementation, verified GREEN, refactor while green.
- Browser or performance quality may be claimed only from revision-matched runtime evidence.
- No push, publication, release tag or removal of V1 compatibility without separate authorization.

---

## 1. Program artifacts

| Artifact | Responsibility | Execution status |
|---|---|---|
| `docs/superpowers/specs/2026-08-06-deckory-v2-program-design.md` | Approved product and architecture contract | Approved specification |
| `docs/superpowers/plans/2026-08-06-deckory-v2-01-scene-foundation.md` | V2 schema, commands, migration and shared renderer | Ready after clean execution workspace is prepared |
| `docs/superpowers/plans/2026-08-06-deckory-v2-02-studio-canvas.md` | Direct manipulation, guides, hierarchy, Layers and Inspector | Blocked by Plan 01 |
| `docs/superpowers/plans/2026-08-06-deckory-v2-03-component-sdk.md` | Scene JSX, trusted React components and sandboxed Web Blocks | Blocked by Plans 01–02 |
| `docs/superpowers/plans/2026-08-06-deckory-v2-04-visual-intelligence.md` | Intent recommendation, charts, diagrams and component catalog | Blocked by Plans 01–03 |
| `docs/superpowers/plans/2026-08-06-deckory-v2-05-design-motion.md` | Visual worlds, backgrounds, typography, styling and motion | Blocked by Plans 01–04 |
| `docs/superpowers/plans/2026-08-06-deckory-v2-06-export-release.md` | Export, migration, audit, performance and final release evidence | Blocked by Plans 01–05 |

### Program control checklist

- [ ] **Prepare an isolated execution workspace** — record the current HEAD, branch, worktrees, dirty paths and baseline command results before Plan 01.
- [ ] **Accept Milestone A** — verify dual V1/V2 rendering and deterministic migration before enabling V2 Studio work.
- [ ] **Accept Milestone B** — verify direct manipulation, Layers, Inspector, history, autosave and Presenter bundle isolation.
- [ ] **Accept Milestone C** — verify Scene JSX, registered component editing and deny-by-default Web Block security.
- [ ] **Accept Milestone D** — verify the complete visual catalog, chart/diagram adapters, text-to-visual recommendations and Visual Lab V2.
- [ ] **Accept Milestone E** — verify visual worlds, backgrounds, typography, media styling, motion and reduced-motion equivalence.
- [ ] **Accept Milestone F** — verify export capabilities, migrated reference decks, twenty-dimension audit and performance budgets.
- [ ] **Run the final release gate** — execute the full quality suite and screenshot/manual review loop on one exact final revision.

## 2. Dependency graph

```text
Plan 01 — Scene Foundation
   │
   ▼
Plan 02 — Studio Canvas
   │
   ▼
Plan 03 — Component SDK
   │
   ▼
Plan 04 — Visual Intelligence
   │
   ▼
Plan 05 — Design & Motion
   │
   ▼
Plan 06 — Export & Release
```

This sequence is intentional:

- Studio cannot manipulate elements until V2 geometry and commands exist.
- Component code cannot be safely editable until Studio selection and Inspector boundaries exist.
- Visual intelligence needs the native scene, SDK and editing contracts before shipping a large catalog.
- Advanced design and motion need stable native visuals and renderer behavior.
- Export, migration and production scoring must validate the final capabilities rather than an intermediate document model.

Read-only research, fixture preparation and visual references may run in parallel. Production changes that cross a plan boundary may not be merged ahead of their dependency gate.

## 3. Milestones and release slices

### Milestone A — Dual-document platform

Delivered by Plan 01.

Observable result:

- V1 and V2 documents validate independently.
- V1 decks retain current behavior.
- A minimal V2 deck renders through thumbnails, Preview, Presenter and Export using the shared renderer.
- V1 migration is deterministic and loss is reported explicitly.
- Scene geometry and immutable commands have focused tests.

Feature state:

- V2 rendering may be enabled globally.
- V2 Studio editing remains behind `DECKORY_SCENE_V2=1`.

Stop condition:

- Do not start direct manipulation while V2 and V1 surfaces still use divergent renderer implementations.

### Milestone B — Professional visual canvas

Delivered by Plan 02.

Observable result:

- Users select, marquee-select, drag, resize, rotate, align, distribute, group, reorder, lock and hide native V2 elements.
- Text edits directly on canvas.
- Layers and Inspector remain synchronized with canvas selection.
- Pointer and keyboard operations share the same scene-command path.
- One gesture equals one undo step.
- Autosave, checkpoints and reload preserve valid V2 scenes.

Feature state:

- V2 Studio may be enabled for internal reference decks.
- Public V1 editing remains available during migration.

Stop condition:

- Do not add arbitrary custom-code editing until Presenter excludes editor-only libraries and history transactions are stable.

### Milestone C — Agent-grade custom authoring

Delivered by Plan 03.

Observable result:

- Agents author native scenes with Scene JSX.
- Trusted registered React components expose typed props and generated Inspector controls.
- Arbitrary HTML/React runs only in a deny-by-default sandboxed Web Block.
- Web Blocks cannot access parent DOM, storage, navigation or network by default.
- Every custom element declares accessibility and export behavior.

Feature state:

- Scene JSX and registered components are production authoring paths.
- Web Blocks remain visibly marked as Advanced with capability warnings.

Stop condition:

- Do not broaden the Web Block import or sandbox policy to accommodate a visual fixture without a reviewed capability decision.

### Milestone D — Complete visual grammar

Delivered by Plan 04.

Observable result:

- Text is classified by communication relationship before a visual is selected.
- Recommendations explain reasons, requirements, evidence and alternatives.
- Common editorial charts use native Deckory renderers.
- Advanced charts use a typed ECharts SVG adapter.
- Diagrams measure text, auto-layout and route edges without fixed percentage coordinates.
- The semantic catalog covers narrative, business, product, technical, academic, people and media jobs.
- Visual Lab V2 proves every public visual at full-size and thumbnail scale.

Feature state:

- The V2 component catalog replaces the small V1 visual vocabulary for new decks.
- V1 components remain renderable through compatibility adapters.

Stop condition:

- A catalog entry without a complete fixture, Inspector contract, accessible summary and audit coverage is not public.

### Milestone E — Authored visual worlds and motion

Delivered by Plan 05.

Observable result:

- Twelve coherent visual worlds define typography, palette, charts, diagrams, imagery, texture, density and motion.
- Backgrounds use editable layered composition.
- Rich text and auto-fit preserve Vietnamese readability or report a split diagnostic.
- Shapes and media support professional fills, strokes, masks, crops and focal points.
- Motion is a typed timeline with semantic presets, scrub/replay and final-state equivalence.
- Reduced motion, thumbnails and export preserve complete content.

Feature state:

- Visual-world selection and advanced motion are enabled for V2 decks.
- Advanced motion timeline remains progressive disclosure rather than default complexity.

Stop condition:

- Do not accept a visual world or motion preset that exists only as tokens without a complete proof deck and browser screenshots.

### Milestone F — Production release candidate

Delivered by Plan 06.

Observable result:

- HTML, SVG, PNG and PDF exports use the shared final-state renderer.
- Every element reports native, editable, fallback or unsupported export capability.
- PPTX has a tested adapter boundary and only claims capabilities actually proven in generated XML.
- Audit reports all twenty quality dimensions with structural/runtime/manual confidence.
- Visual Lab, Template Gallery, Deckory Story and MyInterview are migrated in controlled batches.
- Presenter excludes editor-only dependencies.
- Performance budgets and complete E2E flows pass on the final revision.
- MyInterview is visible in Hub and completes an offline graduation-defense demonstration.

Feature state:

- V2 becomes the default for new decks only after final acceptance.
- V1 compatibility removal requires a separate deprecation specification and user authorization.

## 4. Specification-to-plan traceability

| Specification area | Primary plan | Secondary verification |
|---|---|---|
| Canonical V2 document and coordinates | Plan 01 | Plan 06 migration/audit |
| Freeform, constraints and auto layout | Plans 01–02 | Plan 06 reference migration |
| Shared renderer | Plan 01 | Plans 04–06 |
| Canvas selection and transformation | Plan 02 | Plan 06 final E2E |
| Layers, grouping and history | Plan 02 | Plan 06 demo flow |
| Scene JSX | Plan 03 | Plan 06 export capability report |
| Registered React component SDK | Plan 03 | Plans 04–06 fixtures/export |
| Sandboxed Web Blocks | Plan 03 | Plan 06 security/export checks |
| Text-to-visual intelligence | Plan 04 | Plan 06 MyInterview proof |
| Broad semantic component catalog | Plan 04 | Plans 05–06 galleries/audit |
| Editorial and advanced charts | Plan 04 | Plan 06 export/audit |
| Auto-layout diagrams | Plan 04 | Plan 06 long-label QA |
| Visual worlds and branding | Plan 05 | Plan 06 migration/release screenshots |
| Layered backgrounds | Plan 05 | Plan 06 export comparison |
| Typography and rich text | Plan 05 | Plan 06 overflow gates |
| Motion timeline and reduced motion | Plan 05 | Plan 06 Presenter/export tests |
| Accessibility | All plans | Plan 06 release gate |
| Offline behavior and security | Plans 01, 03 | Plan 06 release gate |
| HTML/SVG/PNG/PDF export | Plan 06 | Final artifact comparison |
| PPTX adapter groundwork | Plan 06 | XML/package tests |
| Twenty-dimension quality scorecard | Plan 06 | Hub/Studio evidence UI |
| MyInterview migration and demo readiness | Plan 06 | Final E2E and screenshots |

## 5. Execution protocol

### 5.1 Workspace preparation

Before Plan 01:

1. Read root `AGENTS.md`, `PRODUCT.md`, `DESIGN.md` and relevant nested instructions.
2. Record `git rev-parse HEAD`, current branch, worktrees and `git status --short`.
3. Create an isolated managed worktree from the approved base revision through `superpowers:using-git-worktrees`.
4. Confirm dependency installation is reproducible with the existing lockfile.
5. Run the current baseline commands and record pre-existing failures without fixing unrelated scope.

A plan executor must stop when the requested base revision is unavailable, the managed worktree cannot be isolated or an unrelated process owns the same files.

### 5.2 Per-task execution

For every task:

1. Read the task and adjacent interface blocks.
2. Write the smallest failing test.
3. Run the focused command and confirm it fails for the intended missing behavior.
4. Implement the minimum complete behavior.
5. Run focused tests and typecheck.
6. Refactor only while green.
7. Inspect the task diff for scope, duplication, secrets and accidental generated files.
8. Commit only the explicit task files inside the isolated worktree.
9. Run a specification-compliance review and code-quality review before continuing.

### 5.3 Per-plan checkpoint

A plan is accepted only when:

- every task checkbox has concrete evidence;
- focused tests and plan-level commands pass freshly;
- final diff contains no unrelated files;
- browser screenshots are inspected where visual behavior changed;
- public interfaces match the plan exactly or the spec is updated and re-approved;
- unresolved risks and manual-review categories are recorded.

Do not start the next plan based only on an executor report.

### 5.4 Change integration

Recommended integration strategy:

- one isolated worktree per active plan;
- small task commits;
- one reviewed integration branch for accepted commits;
- no direct work on the dirty user checkout;
- migration deck commits remain separate from platform commits;
- revertable feature flags remain until the following milestone is accepted.

## 6. Feature flags and compatibility

| Flag / boundary | Purpose | Removal condition |
|---|---|---|
| `DECKORY_SCENE_V2` | Enable V2 Studio entry | V2 Studio passes Milestone B and reference smoke tests |
| V1 renderer adapter | Preserve existing deck behavior | Separate deprecation plan after all registered decks migrate |
| Web Block Advanced mode | Prevent accidental arbitrary-code use | Remains permanent unless product policy changes |
| Advanced motion timeline | Keep normal Studio workflow focused | Remains progressive disclosure |
| PPTX experimental capability | Prevent overclaiming editability | Only individual proven adapters become stable |

## 7. Cross-plan invariants

The following tests or audits must be retained throughout the program:

- V1 reference deck renders in Preview and Presenter.
- Notes remain private in audience mode.
- Reduced motion renders complete final state.
- Assets are local and manifest-backed.
- Scene IDs remain stable and unique.
- Geometry remains finite.
- Studio history contains valid documents.
- Export uses the shared renderer.
- Web Blocks have no default network/parent access.
- Charts include question, unit, evidence and accessible summary.
- Diagrams report inability to fit rather than clipping.
- Public components have fixtures and Inspector contracts.
- Visual claims distinguish structural checks from runtime/manual evidence.

## 8. Risks and mitigation

### Renderer divergence

Risk: Studio, Presenter and Export slowly acquire different wrappers and visual behavior.

Mitigation: all artifact rendering stays in `@deckory/renderer`; editor overlays and export waiting logic sit outside the artifact DOM.

### Scene model overexpansion

Risk: V2 becomes an unbounded CSS/DOM serialization format.

Mitigation: element kinds, style fields and interactions are discriminated typed contracts. Arbitrary DOM exists only in Web Blocks.

### Editor dependency bloat

Risk: Moveable, Selecto, code compilation and source editors enter Presenter bundles.

Mitigation: route-level dynamic boundaries plus Plan 06 bundle-denylist tests.

### Visual catalog quantity without quality

Risk: dozens of components differ only by labels or card arrangement.

Mitigation: catalog entries are organized by communication relationship, require use/avoid guidance and must pass gallery screenshots at full-size and thumbnail scale.

### Chart/diagram library lock-in

Risk: public documents become coupled to ECharts or ELK payloads.

Mitigation: Deckory `ChartSpec` and `DiagramSpec` remain canonical; adapters are internal and replaceable.

### Arbitrary-code security

Risk: custom code accesses parent state, network or browser storage.

Mitigation: trusted registration for repository code; deny-by-default iframe sandbox and versioned bridge for runtime arbitrary code; browser security tests remain release blockers.

### Export overclaiming

Risk: a visually correct raster fallback is described as editable.

Mitigation: per-element capability reports and package-level PPTX XML tests.

### Migration regressions

Risk: production decks lose evidence, notes, IDs or visual meaning.

Mitigation: deterministic migration diagnostics, preserved V1 sources, deck-specific tests and separate migration commits.

### Performance degradation

Risk: rich scenes become difficult to manipulate or present.

Mitigation: explicit budgets, worker layout/compilation, progressive thumbnail rendering, route isolation and final stress tests.

## 9. Program done criteria

The V2 program is complete only when:

- all six child plans are accepted;
- every release gate in the program specification is evidenced on the same final revision;
- V1 decks still work or a separately approved deprecation has landed;
- new V2 decks support native scene authoring, direct manipulation, Scene JSX, registered components and isolated Web Blocks;
- the public visual catalog is complete, editable, accessible and represented by fixtures;
- visual worlds and motion preserve content in final/reduced/static states;
- HTML, SVG, PNG and PDF exports match Preview within reviewed tolerances;
- PPTX capability claims match actual adapter/package evidence;
- all twenty quality dimensions disclose confidence and deductions;
- MyInterview V2 is visible, offline-ready and passes the graduation-defense demo journey;
- full quality gate and screenshot loop pass on the final revision;
- documentation describes verified behavior and explicit remaining non-goals.

## 10. Roadmap self-review

- Dependency check: each plan consumes only interfaces produced by earlier plans.
- Coverage check: every major section of the program specification maps to at least one child plan.
- Placeholder check: no deferred feature marker or unspecified “complete later” instruction remains.
- Safety check: dirty-checkout preservation, worktree isolation, feature flags and V1 compatibility are explicit.
- Execution check: every milestone has observable output, stop conditions and removal gates.
