# Deckory Template Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task in the current checkout. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, agent-consumable template intelligence package with six visual styles, at least thirty slide recipes, ten deck blueprints, deterministic recommendation, safe instantiation, complete documentation, a repository skill and a validated gallery deck.

**Architecture:** Add a headless `@deckory/templates` workspace package above the existing `@deckory/schema`. Keep visual styles, slide recipes and deck blueprints independent, then expose deterministic search, recommendation, template-input validation and deck instantiation. Do not modify the renderer or couple the package to Hub/Studio; future UI can consume the stable catalog.

**Tech Stack:** TypeScript 5.9, Zod 4 through `@deckory/schema`, Vitest 4, pnpm workspace, Deckory `DeckDocument`/`validateDeck`.

## Global Constraints

- Preserve every unrelated dirty path; do not reset, checkout, delete, stage or overwrite existing work.
- Do not commit unless the user explicitly authorizes it; use focused `git diff -- <paths>` checkpoints instead.
- Use only semantic Deckory layouts and components; no arbitrary JSX, CSS coordinates or remote assets.
- Catalog IDs must be stable kebab-case.
- Output locale is `vi-VN`.
- Fixture data must be explicitly labelled illustrative.
- Every sourced or data-led recipe must encode an evidence requirement.
- Reduced motion must preserve meaning.
- No placeholder content, empty middle steps, or “repeat similarly” implementation.
- Avoid changes to currently dirty Hub/Studio files unless a later verification blocker proves the change necessary.

---

## File map

### Package root

- `packages/templates/package.json` — workspace package metadata and scripts.
- `packages/templates/tsconfig.json` — TypeScript project configuration.
- `packages/templates/src/types.ts` — public contracts for styles, recipes, blueprints, requests, content inputs, diagnostics and results.
- `packages/templates/src/catalog/styles.ts` — six visual style presets.
- `packages/templates/src/catalog/recipes.ts` — at least thirty slide recipes.
- `packages/templates/src/catalog/blueprints.ts` — ten deck blueprints.
- `packages/templates/src/catalog/index.ts` — catalog maps and integrity checks.
- `packages/templates/src/search.ts` — normalized deterministic recipe search.
- `packages/templates/src/recommend.ts` — explainable scoring for blueprint and style selection.
- `packages/templates/src/validate-input.ts` — blueprint-step and slot validation.
- `packages/templates/src/instantiate.ts` — stable ID generation, component creation and final `validateDeck` integration.
- `packages/templates/src/index.ts` — public exports.

### Tests

- `packages/templates/src/catalog/catalog.test.ts` — catalog integrity and compatibility.
- `packages/templates/src/search.test.ts` — deterministic search behavior.
- `packages/templates/src/recommend.test.ts` — scenario/audience/evidence scoring.
- `packages/templates/src/validate-input.test.ts` — actionable diagnostics.
- `packages/templates/src/instantiate.test.ts` — complete valid deck generation and stable IDs.
- `packages/templates/src/blueprint-integration.test.ts` — one complete valid deck per blueprint.

### Agent and documentation

- `.agents/skills/deckory-template-system/SKILL.md` — mandatory template selection/authoring workflow.
- `docs/TEMPLATES.md` — user and developer guide.
- `decks/template-gallery/package.json` — gallery deck workspace package.
- `decks/template-gallery/tsconfig.json` — gallery TypeScript config.
- `decks/template-gallery/deck.ts` — complete gallery deck created through `createDeckFromTemplate`.

---

### Task 1: Create package contracts and failing catalog tests

**Files:**
- Create: `packages/templates/package.json`
- Create: `packages/templates/tsconfig.json`
- Create: `packages/templates/src/types.ts`
- Create: `packages/templates/src/catalog/catalog.test.ts`

**Interfaces:**
- Consumes: `DeckDocument`, `DeckTheme`, `Slide`, `SlideComponent` from `@deckory/schema`.
- Produces: `VisualStylePreset`, `SlideRecipe`, `DeckBlueprint`, `TemplateRequest`, `TemplateRecommendation`, `TemplateSlideInput`, `CreateDeckFromTemplateInput`, `TemplateDiagnostic`, `TemplateResult<T>`.

- [ ] **Step 1: Create package configuration**

`packages/templates/package.json`:

```json
{
  "name": "@deckory/templates",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@deckory/schema": "workspace:*"
  }
}
```

`packages/templates/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["vitest/globals"] },
  "include": ["src"]
}
```

- [ ] **Step 2: Define the public contracts**

Use exact unions so catalog entries remain searchable and recommendation signals stay deterministic:

```ts
import type { DeckDocument, DeckTheme, Slide, SlideComponent } from "@deckory/schema";

export type TemplateScenario =
  | "general" | "executive" | "pitch" | "product" | "qbr"
  | "technical" | "academic" | "training" | "case-study" | "proposal";

export type TemplateAudience =
  | "general" | "leadership" | "investor" | "customer"
  | "technical" | "academic" | "student" | "team";

export type EvidenceLevel = "illustrative" | "internal" | "sourced" | "defense";
export type ContentIntensity = "low" | "medium" | "high";
export type TemplateTone = "restrained" | "professional" | "analytical" | "bold" | "academic";

export type TemplateSlot = {
  id: string;
  label: string;
  kind: "text" | "text-list" | "metrics" | "chart-values" | "table" | "code" | "architecture-layers" | "process-steps" | "comparison" | "evidence";
  required: boolean;
  maxItems?: number;
  maxLength?: number;
};

export type RecipeComponentSpec = {
  id: string;
  type: SlideComponent["type"];
  slotId: string;
  sequence?: number;
};

export type VisualStylePreset = {
  id: string;
  name: string;
  description: string;
  theme: DeckTheme;
  scenarios: readonly TemplateScenario[];
  audiences: readonly TemplateAudience[];
  tones: readonly TemplateTone[];
  dials: {
    narrativeVariance: number;
    motionIntensity: number;
    visualDensity: number;
    evidenceRigor: number;
  };
  compositionGuidance: readonly string[];
  prohibitedPatterns: readonly string[];
};

export type SlideRecipe = {
  id: string;
  name: string;
  category: "opening" | "narrative" | "business" | "data" | "comparison" | "process" | "technical" | "academic" | "product";
  purpose: string;
  layout: Slide["layout"];
  variant?: Slide["variant"];
  components: readonly RecipeComponentSpec[];
  slots: readonly TemplateSlot[];
  tags: readonly string[];
  evidence: "none" | "recommended" | "required";
  useWhen: readonly string[];
  avoidWhen: readonly string[];
};

export type BlueprintStep = {
  id: string;
  recipeId: string;
  role: string;
  required: boolean;
  minRepeats?: number;
  maxRepeats?: number;
};

export type DeckBlueprint = {
  id: string;
  name: string;
  description: string;
  scenario: TemplateScenario;
  audiences: readonly TemplateAudience[];
  durationMinutes: readonly [number, number];
  steps: readonly BlueprintStep[];
};

export type TemplateRequest = {
  scenario?: TemplateScenario;
  audience?: TemplateAudience;
  evidenceLevel?: EvidenceLevel;
  dataIntensity?: ContentIntensity;
  technicalDepth?: ContentIntensity;
  tone?: TemplateTone;
  durationMinutes?: number;
};

export type TemplateRecommendation = {
  blueprint: DeckBlueprint;
  style: VisualStylePreset;
  reasons: readonly string[];
  score: number;
};

export type TemplateSlideInput = {
  stepId: string;
  recipeId?: string;
  id?: string;
  slots: Readonly<Record<string, unknown>>;
  notes?: string;
};

export type CreateDeckFromTemplateInput = {
  id: string;
  title: string;
  blueprintId: string;
  styleId: string;
  slides: readonly TemplateSlideInput[];
};

export type TemplateDiagnostic = {
  code: "not-found" | "missing-step" | "repeat-limit" | "missing-slot" | "invalid-slot" | "evidence-required" | "deck-invalid";
  message: string;
  remediation: string;
  blueprintId?: string;
  recipeId?: string;
  stepId?: string;
  slideId?: string;
  slotId?: string;
};

export type TemplateResult<T> =
  | { ok: true; value: T; diagnostics: readonly TemplateDiagnostic[] }
  | { ok: false; diagnostics: readonly TemplateDiagnostic[] };

export type CreatedTemplateDeck = DeckDocument;
```

- [ ] **Step 3: Write failing catalog contract tests**

Create tests that import `visualStyles`, `slideRecipes`, `deckBlueprints`, `assertCatalogIntegrity` from the not-yet-created catalog module. Assert six styles, at least thirty recipes, ten blueprints, unique kebab-case IDs, supported theme values, existing recipe references and layout/component compatibility.

- [ ] **Step 4: Run the focused test and verify failure**

Run:

```bash
pnpm --filter @deckory/templates test -- src/catalog/catalog.test.ts
```

Expected: FAIL because catalog modules and exports do not exist.

- [ ] **Step 5: Review the slice**

Run:

```bash
git diff -- packages/templates/package.json packages/templates/tsconfig.json packages/templates/src/types.ts packages/templates/src/catalog/catalog.test.ts
```

Confirm only new template-package files are present.

---

### Task 2: Implement six visual styles and thirty-plus slide recipes

**Files:**
- Create: `packages/templates/src/catalog/styles.ts`
- Create: `packages/templates/src/catalog/recipes.ts`
- Create: `packages/templates/src/catalog/index.ts`
- Modify: `packages/templates/src/catalog/catalog.test.ts`

**Interfaces:**
- Consumes: contracts from `../types.ts`, `SUPPORTED_COMPONENT_TYPES`, `SUPPORTED_LAYOUTS` from `@deckory/schema`.
- Produces: `visualStyles`, `slideRecipes`, `visualStyleById`, `slideRecipeById`, `assertCatalogIntegrity()`.

- [ ] **Step 1: Implement style presets**

Create exactly these IDs and map each to a supported `DeckTheme`:

```ts
export const visualStyles = [
  style("executive-editorial", "Executive Editorial", { preset: "editorial-light", accent: "cobalt", typography: "editorial", density: "comfortable" }, ...),
  style("modern-professional", "Modern Professional", { preset: "editorial-light", accent: "teal", typography: "modern", density: "comfortable" }, ...),
  style("technical-precision", "Technical Precision", { preset: "technical-clean", accent: "teal", typography: "technical", density: "compact" }, ...),
  style("data-briefing", "Data Briefing", { preset: "technical-clean", accent: "cobalt", typography: "modern", density: "compact" }, ...),
  style("bold-keynote", "Bold Keynote", { preset: "editorial-dark", accent: "amber", typography: "modern", density: "comfortable" }, ...),
  style("academic-defense", "Academic Defense", { preset: "editorial-light", accent: "cobalt", typography: "editorial", density: "compact" }, ...)
] as const satisfies readonly VisualStylePreset[];
```

Every style must include four 1–10 dials, at least three composition guidelines and these shared prohibited patterns: generic purple gradients, decorative charts, repeated equal-card grids, random remote imagery, low-contrast glass effects.

- [ ] **Step 2: Implement the recipe helper and recipe catalog**

Use a helper that preserves literal IDs and validates required component slots at compile time. Implement at least these 36 recipes:

```text
opening: professional-cover, executive-opener, section-transition
narrative: problem-statement, tension-and-stakes, key-message, attributed-quote, closing-action
business: executive-summary, opportunity-landscape, solution-overview, value-proposition, strategy-pillars, roadmap-phases
 data: kpi-overview, ranked-bar-analysis, trend-over-time, part-to-whole, data-with-insight, exact-comparison-table
comparison: before-after, two-option-decision, competitive-position, trade-off-matrix
process: workflow-steps, customer-journey, phased-plan, operating-model
technical: system-architecture, data-flow, implementation-proof, code-walkthrough, reliability-model
academic: research-question, methodology, findings, discussion, recommendation, defense-conclusion
product: user-problem, product-mechanism, feature-proof, experience-flow, release-readiness
```

Each recipe must use an existing Deckory layout and only components allowed by `validateDeck`'s layout compatibility rules. Data, table, chart, academic findings and evidence-led recipes must include an `evidence` slot and `evidence: "required"`.

- [ ] **Step 3: Implement catalog maps and integrity checks**

```ts
export const visualStyleById = new Map(visualStyles.map((item) => [item.id, item]));
export const slideRecipeById = new Map(slideRecipes.map((item) => [item.id, item]));

export function assertCatalogIntegrity(): void {
  assertUniqueIds("visual style", visualStyles);
  assertUniqueIds("slide recipe", slideRecipes);
  for (const recipe of slideRecipes) {
    if (!SUPPORTED_LAYOUTS.includes(recipe.layout)) throw new Error(...);
    for (const component of recipe.components) {
      if (!SUPPORTED_COMPONENT_TYPES.includes(component.type)) throw new Error(...);
      if (!recipe.slots.some((slot) => slot.id === component.slotId)) throw new Error(...);
    }
  }
}
```

Call `assertCatalogIntegrity()` at module initialization so duplicate IDs fail fast.

- [ ] **Step 4: Run catalog tests**

Run:

```bash
pnpm --filter @deckory/templates test -- src/catalog/catalog.test.ts
```

Expected: tests for styles and recipes pass; blueprint assertions remain failing until Task 3.

- [ ] **Step 5: Review the slice**

Run:

```bash
git diff -- packages/templates/src/catalog packages/templates/src/types.ts
```

Verify every recipe has a real purpose, slot contract, use/avoid guidance and no placeholder text.

---

### Task 3: Implement ten narrative blueprints and complete catalog integrity

**Files:**
- Create: `packages/templates/src/catalog/blueprints.ts`
- Modify: `packages/templates/src/catalog/index.ts`
- Modify: `packages/templates/src/catalog/catalog.test.ts`

**Interfaces:**
- Consumes: `SlideRecipe` IDs from `recipes.ts`.
- Produces: `deckBlueprints`, `deckBlueprintById`; completes `assertCatalogIntegrity()`.

- [ ] **Step 1: Add ten complete blueprints**

Create exactly these IDs:

```text
professional-presentation
executive-briefing
startup-pitch
product-strategy
quarterly-business-review
technical-architecture-review
academic-defense
training-workshop
case-study
project-proposal
```

Every blueprint must begin with an opening recipe, end with a conclusion/action recipe, contain 6–12 steps, define realistic duration bounds and use stable unique step IDs. Optional repeatable steps must set explicit `minRepeats` and `maxRepeats`; no step may have `maxRepeats > 4`.

- [ ] **Step 2: Complete blueprint integrity checks**

Extend `assertCatalogIntegrity()` to fail when:

- a blueprint ID or step ID is duplicated;
- a step references a missing recipe;
- `minRepeats` exceeds `maxRepeats`;
- a required step has `maxRepeats: 0`;
- a blueprint lacks an opening or closing recipe family.

- [ ] **Step 3: Run catalog tests**

Run:

```bash
pnpm --filter @deckory/templates test -- src/catalog/catalog.test.ts
```

Expected: PASS with exactly six styles, at least thirty recipes and exactly ten blueprints.

- [ ] **Step 4: Review the slice**

Run:

```bash
git diff -- packages/templates/src/catalog/blueprints.ts packages/templates/src/catalog/index.ts packages/templates/src/catalog/catalog.test.ts
```

Confirm each narrative has a distinct purpose and no blueprint is a renamed duplicate.

---

### Task 4: Add deterministic search and recommendation

**Files:**
- Create: `packages/templates/src/search.ts`
- Create: `packages/templates/src/search.test.ts`
- Create: `packages/templates/src/recommend.ts`
- Create: `packages/templates/src/recommend.test.ts`

**Interfaces:**
- Consumes: catalog maps and `TemplateRequest`.
- Produces: `searchSlideRecipes(query: string): readonly SlideRecipe[]`, `recommendTemplate(request: TemplateRequest): TemplateRecommendation`.

- [ ] **Step 1: Write failing search tests**

Cover normalization of Vietnamese/English text, exact ID boost, tag/name/purpose matching, deterministic ordering and empty-query behavior returning no results.

Example assertions:

```ts
expect(searchSlideRecipes("kiến trúc hệ thống")[0]?.id).toBe("system-architecture");
expect(searchSlideRecipes("kpi dữ liệu").map((item) => item.id)).toContain("kpi-overview");
expect(searchSlideRecipes("professional-cover")[0]?.id).toBe("professional-cover");
expect(searchSlideRecipes("   ")).toEqual([]);
```

- [ ] **Step 2: Implement normalized weighted search**

Normalize with lowercase, Unicode NFD diacritic removal and punctuation collapse. Score exact ID `100`, exact name `80`, tag match `25` each, category `20`, purpose token `8`, use-when token `4`. Sort by descending score then ID.

- [ ] **Step 3: Write failing recommendation tests**

Cover at least:

```ts
recommendTemplate({ scenario: "academic", audience: "academic", evidenceLevel: "defense", tone: "academic" })
// => academic-defense blueprint + academic-defense style

recommendTemplate({ scenario: "technical", audience: "technical", technicalDepth: "high", tone: "analytical" })
// => technical-architecture-review + technical-precision

recommendTemplate({ scenario: "qbr", audience: "leadership", dataIntensity: "high" })
// => quarterly-business-review + data-briefing
```

Require at least three human-readable reason strings and deterministic output for identical input.

- [ ] **Step 4: Implement explainable scoring**

Score blueprint scenario `+60`, audience `+20`, duration fit `+10`; style scenario `+30`, audience `+20`, tone `+20`; add explicit evidence/data/technical bonuses based on known style IDs. Select highest score, tie-break by ID. Return combined score and reason strings tied to matched request fields.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @deckory/templates test -- src/search.test.ts src/recommend.test.ts
```

Expected: PASS.

- [ ] **Step 6: Review the slice**

Run:

```bash
git diff -- packages/templates/src/search.ts packages/templates/src/search.test.ts packages/templates/src/recommend.ts packages/templates/src/recommend.test.ts
```

Confirm no random or model-dependent behavior exists.

---

### Task 5: Validate template input with actionable diagnostics

**Files:**
- Create: `packages/templates/src/validate-input.ts`
- Create: `packages/templates/src/validate-input.test.ts`

**Interfaces:**
- Consumes: `CreateDeckFromTemplateInput`, catalog maps.
- Produces: `validateTemplateInput(input): TemplateResult<{ blueprint: DeckBlueprint; style: VisualStylePreset; slides: readonly ResolvedTemplateSlide[] }>` and internal `ResolvedTemplateSlide`.

- [ ] **Step 1: Write failing validation tests**

Test:

- unknown blueprint/style;
- missing required step;
- step repeated beyond limit;
- recipe override not found;
- missing required slot;
- text longer than `maxLength`;
- array longer than `maxItems`;
- missing evidence on required recipe;
- valid complete input returns resolved blueprint/style/recipe references.

Assert exact diagnostic codes and contextual IDs.

- [ ] **Step 2: Implement expected-error result handling**

Resolve the blueprint and style first. Group slides by `stepId`; validate required and repeat counts. Resolve `recipeId` override only when it exists. Validate slots using these runtime shapes:

```ts
text: string
text-list: string[]
metrics: { value: string; label: string; note: string; tone?: "cobalt" | "teal" | "amber" }[]
chart-values: { label: string; value: number; highlight?: boolean }[]
table: { title: string; columns: string[]; rows: { cells: string[]; highlight?: boolean }[]; note?: string }
code: { title: string; language: string; code: string; caption?: string; showLineNumbers?: boolean; highlightLines?: number[] }
architecture-layers: { label: string; items: string[]; accent?: boolean }[]
process-steps: { title: string; note: string; icon: "data" | "system" | "people" | "sparkle" }[]
comparison: { left: { eyebrow: string; title: string; points: string[] }; right: { eyebrow: string; title: string; points: string[] } }
evidence: { source: string; page?: string }
```

Return all diagnostics in one pass so an agent can correct the input efficiently.

- [ ] **Step 3: Run validation tests**

Run:

```bash
pnpm --filter @deckory/templates test -- src/validate-input.test.ts
```

Expected: PASS.

- [ ] **Step 4: Review the slice**

Run:

```bash
git diff -- packages/templates/src/validate-input.ts packages/templates/src/validate-input.test.ts
```

Confirm expected authoring failures return diagnostics rather than throw.

---

### Task 6: Instantiate validated inputs into DeckDocument

**Files:**
- Create: `packages/templates/src/instantiate.ts`
- Create: `packages/templates/src/instantiate.test.ts`
- Create: `packages/templates/src/index.ts`

**Interfaces:**
- Consumes: `validateTemplateInput`, `defineDeck`, `validateDeck`.
- Produces: `createDeckFromTemplate(input): TemplateResult<DeckDocument>`, `getVisualStyle`, `getSlideRecipe`, `getDeckBlueprint` and public package exports.

- [ ] **Step 1: Write failing instantiation tests**

Use a complete `professional-presentation` input and assert:

- output is `ok: true`;
- deck theme equals the selected style theme;
- locale is `vi-VN` and version is `1`;
- generated slide/component IDs are stable across two calls;
- sequence values increase;
- final `validateDeck` succeeds;
- invalid input preserves template diagnostics;
- final schema errors convert to `deck-invalid` diagnostics.

- [ ] **Step 2: Implement stable ID generation**

Use a local slug function compatible with schema IDs. Prefix component IDs with semantic component type and append a deterministic numeric suffix only when necessary. Never use timestamps, UUIDs or randomness.

- [ ] **Step 3: Implement recipe-to-component mapping**

Map slot data to supported props. Required mappings include:

```ts
heading -> { eyebrow?, title, description?, emphasis? }
statement -> { quote, byline? }
metric-grid -> { metrics }
comparison -> comparison slot object
process -> { steps }
architecture -> { layers }
chart -> { title, unit, variant?, showValues?, values }
table -> table slot object
code -> code slot object
insight -> { label, title, description, metric?, tone? }
evidence-footer -> evidence slot object
```

Recipe slot conventions must be explicit: heading recipes use slots `heading`, optional `description`, optional `emphasis`, optional `eyebrow`; chart recipes use `chart`; insight recipes use `insight`; evidence uses `evidence`.

Apply safe transitions by layout family:

```ts
cover/closing: fade or morph
statement: fade
comparison/process/architecture: slide or push
 data/dashboard/split: wipe or fade
```

Keep durations between `0.3` and `0.58`; sequence only explanatory components, never evidence footers.

- [ ] **Step 4: Validate the generated deck**

Call `validateDeck`. Convert every Deckory diagnostic into `TemplateDiagnostic` with code `deck-invalid`, preserving slide/component path in the message.

- [ ] **Step 5: Export the public API**

`src/index.ts` must export all contracts, catalogs, maps and utilities without exposing internal helper functions.

- [ ] **Step 6: Run focused tests and typecheck**

Run:

```bash
pnpm --filter @deckory/templates test -- src/instantiate.test.ts
pnpm --filter @deckory/templates typecheck
```

Expected: PASS.

- [ ] **Step 7: Review the slice**

Run:

```bash
git diff -- packages/templates/src/instantiate.ts packages/templates/src/instantiate.test.ts packages/templates/src/index.ts
```

Confirm only typed Deckory data is emitted.

---

### Task 7: Prove every blueprint and create a complete gallery deck

**Files:**
- Create: `packages/templates/src/blueprint-integration.test.ts`
- Create: `decks/template-gallery/package.json`
- Create: `decks/template-gallery/tsconfig.json`
- Create: `decks/template-gallery/deck.ts`

**Interfaces:**
- Consumes: public `@deckory/templates` API.
- Produces: one valid generated fixture per blueprint and `templateGalleryDeck`.

- [ ] **Step 1: Build reusable complete fixture data in the integration test**

Create a helper that examines each recipe's slot definitions and supplies realistic Vietnamese fixture values matching every slot kind. Evidence values must say `Dữ liệu fixture minh hoạ / Deckory template validation`.

- [ ] **Step 2: Instantiate one complete deck per blueprint**

For each blueprint, expand every required step once and every optional step at its minimum repeat count. Use an appropriate style mapping:

```text
professional-presentation -> modern-professional
executive-briefing -> executive-editorial
startup-pitch -> bold-keynote
product-strategy -> modern-professional
quarterly-business-review -> data-briefing
technical-architecture-review -> technical-precision
academic-defense -> academic-defense
training-workshop -> modern-professional
case-study -> executive-editorial
project-proposal -> executive-editorial
```

Assert all ten outputs are valid Deckory documents and contain no empty strings.

- [ ] **Step 3: Create the gallery package**

Use dependencies:

```json
{
  "name": "@deckory/template-gallery",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./deck.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": { "@deckory/templates": "workspace:*" }
}
```

- [ ] **Step 4: Create a complete professional gallery deck**

Instantiate `professional-presentation` with `modern-professional`. Include 8–10 slides covering opening, problem, key message, KPI/data, comparison, process/roadmap, architecture or product mechanism, recommendation and closing. Use realistic Vietnamese copy and explicitly illustrative metrics. Throw during module initialization only when the checked-in fixture unexpectedly fails, because that is a programmer error:

```ts
const result = createDeckFromTemplate(input);
if (!result.ok) {
  throw new Error(result.diagnostics.map((item) => item.message).join("\n"));
}
export const templateGalleryDeck = result.value;
```

- [ ] **Step 5: Run integration tests and typecheck**

Run:

```bash
pnpm --filter @deckory/templates test -- src/blueprint-integration.test.ts
pnpm --filter @deckory/template-gallery typecheck
```

Expected: PASS.

- [ ] **Step 6: Review the slice**

Run:

```bash
git diff -- packages/templates/src/blueprint-integration.test.ts decks/template-gallery
```

Confirm the gallery contains no placeholders and all evidence is labelled illustrative.

---

### Task 8: Add agent skill and complete documentation

**Files:**
- Create: `.agents/skills/deckory-template-system/SKILL.md`
- Create: `docs/TEMPLATES.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: public package contracts and existing `deckory-slide-director` workflow.
- Produces: discoverable agent workflow and human usage guide.

- [ ] **Step 1: Write the repository skill**

The skill frontmatter must be:

```yaml
---
name: deckory-template-system
description: Use when selecting, adapting, creating or validating Deckory visual styles, slide recipes or deck blueprints. Supports named-template, adaptive and original modes while preserving the typed DeckDocument contract.
---
```

The body must require:

1. read `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/TEMPLATES.md` and `deckory-slide-director`;
2. state audience, outcome, evidence and presentation duration;
3. select template, adaptive or original mode;
4. call/search the catalog instead of guessing recipe IDs;
5. inventory recipe, conclusion heading, evidence and notes per slide;
6. instantiate through `createDeckFromTemplate` when using catalog templates;
7. create a new recipe only when existing recipes are demonstrably unsuitable;
8. validate, browser-review and run repository checks;
9. never use arbitrary JSX, remote assets, fake evidence or incomplete output.

Include exact examples for named template, adaptive selection and original recipe contribution.

- [ ] **Step 2: Write `docs/TEMPLATES.md`**

Document:

- mental model: Style × Recipe × Blueprint;
- six styles with use cases;
- ten blueprints with audiences and duration;
- recipe categories and search examples;
- named, adaptive and original authoring modes;
- TypeScript examples for `recommendTemplate`, `searchSlideRecipes`, `createDeckFromTemplate`;
- diagnostic handling;
- recipe contribution checklist;
- evidence and visual preflight rules.

All code examples must compile against the public API.

- [ ] **Step 3: Make the skill discoverable**

Add one concise sentence to `AGENTS.md` after the mandatory slide-director instruction:

```md
Before selecting or creating reusable styles, slide recipes or deck blueprints, also read `.agents/skills/deckory-template-system/SKILL.md`.
```

Do not alter unrelated guide content.

- [ ] **Step 4: Run documentation and skill checks**

Run:

```bash
rg -n "TBD|TODO|implement later|repeat similarly" .agents/skills/deckory-template-system/SKILL.md docs/TEMPLATES.md
pnpm --filter @deckory/templates typecheck
```

Expected: ripgrep exits with no matches; typecheck passes.

- [ ] **Step 5: Review the slice**

Run:

```bash
git diff -- AGENTS.md .agents/skills/deckory-template-system/SKILL.md docs/TEMPLATES.md
```

Confirm the new sentence is the only existing-file change.

---

### Task 9: Run full verification and inspect final scope

**Files:**
- No new files.
- Inspect all files created or modified in Tasks 1–8.

**Interfaces:**
- Consumes: complete feature.
- Produces: verification evidence and residual-risk report.

- [ ] **Step 1: Run package tests**

```bash
pnpm --filter @deckory/templates test
```

Expected: all template unit and integration tests pass.

- [ ] **Step 2: Run repository checks**

```bash
pnpm test
pnpm typecheck
pnpm build
```

Record exact exit codes and failures. If the Windows connector cannot locate Node through the pnpm shim, resolve the repository-pinned runtime path without changing project files, then rerun. Do not claim checks that did not complete.

- [ ] **Step 3: Inspect final feature diff**

```bash
git diff --stat -- packages/templates decks/template-gallery .agents/skills/deckory-template-system/SKILL.md docs/TEMPLATES.md docs/superpowers/specs/2026-08-05-template-system-design.md docs/superpowers/plans/2026-08-05-template-system.md AGENTS.md
git diff --check -- packages/templates decks/template-gallery .agents/skills/deckory-template-system/SKILL.md docs/TEMPLATES.md AGENTS.md
```

Expected: no whitespace errors; no unrelated paths.

- [ ] **Step 4: Check catalog completeness**

Use the passing catalog tests as the source of truth and report exact counts of styles, recipes and blueprints. Search for placeholder markers in the feature paths.

- [ ] **Step 5: Report limitations honestly**

Report that gallery UI registration and browser screenshot review are deferred only if the existing dirty Hub/Studio state prevents safe integration. Do not claim visual browser evidence unless a real browser session and screenshots were completed.
