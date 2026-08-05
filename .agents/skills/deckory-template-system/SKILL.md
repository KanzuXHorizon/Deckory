---
name: deckory-template-system
description: Use when selecting, adapting, creating or validating Deckory visual styles, slide recipes or deck blueprints. Supports named-template, adaptive and original modes while preserving the typed DeckDocument contract.
---

# Deckory Template System

Use this skill whenever a request involves reusable presentation templates, visual styles, slide recipes, deck blueprints, automatic template selection or a new recipe contribution.

This skill does not replace `.agents/skills/deckory-slide-director/SKILL.md`. The slide director owns narrative and visual quality; this skill owns reusable selection, slot contracts and instantiation.

## Required reading

Before authoring:

1. Read `AGENTS.md`, `PRODUCT.md`, `DESIGN.md` and `docs/TEMPLATES.md`.
2. Read `.agents/skills/deckory-slide-director/SKILL.md`.
3. Inspect the target source material, audience, venue, duration and evidence status.
4. Inspect the current public API in `packages/templates/src/index.ts`; never guess catalog IDs.

## State the authoring context

Resolve and record:

- audience;
- decision, learning outcome or action expected;
- evidence level: illustrative, internal, sourced or defense;
- duration and expected slide count;
- data intensity and technical depth;
- presentation mode: named template, adaptive or original.

When information is incomplete, infer only reversible visual defaults. Never invent factual claims, citations or benchmark data.

## Mode 1 — Named template

Use when the user names a blueprint, style or recipe.

Example request:

> Dùng blueprint `academic-defense` với style `academic-defense` cho bài bảo vệ 20 phút.

Workflow:

1. Resolve IDs with `getDeckBlueprint`, `getVisualStyle` and `getSlideRecipe`.
2. Inventory every slide: blueprint step, recipe, conclusion heading, evidence, notes and source.
3. Fill every required semantic slot.
4. Instantiate with `createDeckFromTemplate`.
5. Correct all template diagnostics before opening Studio or Presenter.

Do not silently substitute a different named template. Report an unknown ID with available alternatives.

## Mode 2 — Adaptive selection

Use when the user gives a goal but does not name a template.

Example:

```ts
const recommendation = recommendTemplate({
  scenario: "qbr",
  audience: "leadership",
  evidenceLevel: "sourced",
  dataIntensity: "high",
  durationMinutes: 20
});
```

Workflow:

1. Call `recommendTemplate` with the explicit request signals.
2. Review the returned reasons; confirm the selected blueprint and style communicate the relationship truthfully.
3. Use `searchSlideRecipes` when a blueprint step needs a more specific recipe.
4. Document recipe overrides in the authoring inventory.
5. Instantiate and validate through the public API.

Recommendation is deterministic metadata scoring, not permission to skip content analysis.

## Mode 3 — Original recipe contribution

Use only when no catalog recipe explains the relationship accurately.

Before adding a recipe:

1. Search by communication job, data relationship and Vietnamese/English keywords.
2. Explain why the closest existing recipes are unsuitable.
3. Compose only supported Deckory layouts and semantic components.
4. Define stable kebab-case ID, purpose, slots, limits, use/avoid guidance, evidence requirement and tags.
5. Add catalog integrity, input validation and instantiation tests.
6. Add the recipe to a complete fixture or gallery deck.
7. Browser-review at full-size and thumbnail scale.

Original mode never permits arbitrary JSX, inline coordinates, remote runtime assets or bypassing `validateDeck`.

## Slide inventory contract

Before implementation, make one row per slide containing:

- blueprint step ID;
- recipe ID;
- conclusion heading;
- primary semantic component;
- evidence status and source;
- reveal intent;
- speaker-note intent;
- transition into and out of the slide.

A deck is incomplete when a required blueprint step, required slot, evidence footer or meaningful note is missing.

## Instantiation rules

Use `createDeckFromTemplate` for catalog-led decks. It must remain the only boundary that converts template input into `DeckDocument`.

Expected handling:

```ts
const result = createDeckFromTemplate(input);
if (!result.ok) {
  for (const diagnostic of result.diagnostics) {
    console.error(diagnostic.code, diagnostic.message, diagnostic.remediation);
  }
  throw new Error("Template input is not presentation-ready.");
}

const deck = result.value;
```

Never cast an invalid result, discard diagnostics or construct arbitrary components outside the typed schema.

## Evidence rules

- Fixture values must explicitly say they are illustrative.
- Sourced slides identify the source in `evidence-footer`.
- Academic and defense decks state sample, unit, time range and limitations when relevant.
- Charts answer one visible question and include an accessible conclusion.
- Tables are for exact row-level comparison, not compressed spreadsheets.
- Code is a small coherent proof, normally 6–16 visible lines.

## Browser pre-flight

Open Studio, Preview and Present using the generated deck. Inspect:

- full 16:9 canvas and thumbnail rendering;
- Vietnamese diacritics and heading wraps;
- overflow, clipping, density and safe area;
- chart, table and code readability;
- evidence labels and notes privacy;
- keyboard navigation, focus, reduced motion and reveal sequence;
- console and network errors.

Fix the template contract or recipe when the same defect appears across multiple generated decks. Do not patch only one fixture when the root cause is shared.

## Verification

Before claiming completion, run:

```bash
pnpm --filter @deckory/templates test
pnpm --filter @deckory/templates typecheck
pnpm test
pnpm typecheck
pnpm build
```

Also run the relevant browser screenshot loop and inspect the final Git diff. Report only checks that completed successfully.

## Prohibited output

Never ship:

- placeholder slides or empty required steps;
- marker công việc dang dở, chỉ dẫn lặp máy móc hoặc phần giữa bị hoãn;
- fake evidence presented as real;
- recipe IDs guessed without catalog lookup;
- a new recipe without tests and use/avoid rules;
- arbitrary JSX, CSS or remote assets inside template input;
- template selection based only on visual taste;
- claims of browser review without real screenshots.
