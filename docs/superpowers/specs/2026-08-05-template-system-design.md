# Deckory Template Intelligence — Design Specification

**Date:** 2026-08-05
**Status:** Approved direction; implementation follows this specification
**Scope:** Agent-facing template system, reusable package, quality rules, documentation and complete examples

## 1. Design read

Reading this as: a professional presentation-template platform for Deckory users and coding agents, delivering faster authoring without sacrificing narrative quality, structural validation or visual originality, with an editorial, modern and evidence-aware visual language.

Default direction dials:

- `NARRATIVE_VARIANCE`: 7/10
- `MOTION_INTENSITY`: 5/10
- `VISUAL_DENSITY`: 5/10
- `EVIDENCE_RIGOR`: 8/10

The values are defaults, not hardcoded output. A template request may override them within documented bounds.

## 2. Problem

Deckory already provides a typed `DeckDocument`, nine semantic layouts, eleven semantic components, theme settings, motion and validation. It does not yet provide a reusable intelligence layer that answers:

- Which deck structure fits the user's goal?
- Which visual system fits the audience and content?
- Which slide recipe explains a specific relationship fastest?
- Which slots are required and how much content is safe?
- When should an agent follow a template, adapt one or design a new composition?
- How can generated output be checked before it reaches Studio or Presenter?

Without this layer, every agent must reinvent narrative structure and composition rules, producing inconsistent results even when the renderer is stable.

## 3. Research synthesis

Current presentation systems converge on several useful patterns:

- Kimi Slides supports template-led generation and automatic design selection based on content, including custom template interpretation and native charts/diagrams.
- Gamma separates visual themes from layout templates and allows reusable workspace templates to be remixed with new content and instructions.
- Beautiful.ai uses adaptive “Smart Slides” that preserve layout quality as content changes.
- Canva uses brand templates, locked brand elements and formatting checks to maintain guardrails before reuse.

Deckory should adopt the reusable concepts, not copy their implementation. Deckory's differentiator remains a typed, validated slide AST shared by agents, editors and renderers.

Primary references:

- https://www.kimi.com/help/slides/ppt-overview
- https://www.kimi.com/help/slides/ppt-creation-mode
- https://www.kimi.com/en/features/slides
- https://help.gamma.app/en/articles/11029130-what-s-the-fastest-way-to-transform-content-and-layouts
- https://help.gamma.app/en/articles/12590858-how-do-i-use-workspace-templates
- https://www.beautiful.ai/slide-templates
- https://www.canva.com/newsroom/news/home-for-every-brand/

## 4. Considered approaches

### Approach A — Static deck examples

Store several complete decks and ask agents to copy them.

**Advantages:** fastest to implement; visually concrete.
**Limitations:** content and style are coupled; copying encourages repetitive compositions; difficult to search and validate semantically.

### Approach B — UI-first template marketplace

Build a Hub gallery, template preview and creation wizard before defining a headless template contract.

**Advantages:** immediate user-facing discovery.
**Limitations:** high coupling to currently changing Hub/Studio code; selection logic remains implicit; agents cannot reliably consume the system.

### Approach C — Headless hybrid template intelligence

Separate visual styles, slide recipes and deck blueprints; add selection and instantiation utilities; document the workflow through a repository skill; provide complete example decks.

**Advantages:** reusable by agents and future UI; compatible with the current renderer; typed and testable; supports both template-led and adaptive generation.
**Limitations:** template gallery UI is deferred until the headless contract proves stable.

**Decision:** Approach C.

## 5. System model

The system has four independent layers.

### 5.1 Visual Style

A `VisualStylePreset` describes the deck-level visual world using values already supported by `DeckTheme` plus art-direction metadata:

- theme preset, accent, typography and density;
- visual intent and suitable audiences;
- narrative, motion, density and evidence defaults;
- chart emphasis guidance;
- composition rhythm guidance;
- prohibited visual patterns.

Visual styles never contain slide content or arbitrary CSS.

Initial styles:

1. `executive-editorial` — restrained leadership and board communication.
2. `modern-professional` — versatile business and product presentations.
3. `technical-precision` — architecture, engineering and implementation reviews.
4. `data-briefing` — metrics, quarterly reviews and analytical reports.
5. `bold-keynote` — launches, vision and memorable stage delivery.
6. `academic-defense` — graduation defense, research and evidence-heavy learning.

All styles map to currently supported Deckory themes. Metadata can be richer than renderer tokens without changing the document schema.

### 5.2 Slide Recipe

A `SlideRecipe` describes one communication job, not a fixed screenshot.

Each recipe contains:

- stable ID, name, category and purpose;
- compatible Deckory layout and component composition;
- required and optional semantic slots;
- slot constraints such as maximum items, text length and evidence requirements;
- recommended variants, motion and density;
- when to use and when not to use;
- quality checks and anti-patterns;
- searchable tags.

Initial recipe families:

- Opening: cover, executive opener, section transition.
- Narrative: problem, tension, key message, quote, closing action.
- Business: executive summary, opportunity, solution, value proposition, strategy pillars, roadmap.
- Data: KPI overview, ranked comparison, trend, distribution, data-plus-insight, exact table.
- Comparison: before/after, option comparison, competitive position, trade-off decision.
- Process: workflow, customer journey, phased plan, operating model.
- Technical: system architecture, data flow, implementation proof, code explanation, reliability model.
- Academic: research question, methodology, findings, discussion, recommendation, defense conclusion.
- Product: user problem, product mechanism, feature proof, experience flow, release readiness.

Recipes may share a Deckory layout while defining different narrative and slot contracts.

### 5.3 Deck Blueprint

A `DeckBlueprint` is a narrative sequence of recipe references with optional or repeatable steps.

Each step defines:

- recipe ID;
- narrative role;
- whether it is required;
- allowed repetition count;
- evidence expectation;
- transition intent;
- guidance for omission or substitution.

Initial blueprints:

1. `professional-presentation` — general-purpose professional narrative.
2. `executive-briefing` — decision-led leadership update.
3. `startup-pitch` — problem, solution, market, proof and ask.
4. `product-strategy` — context, insight, choice, roadmap and measures.
5. `quarterly-business-review` — outcomes, trends, drivers, risks and next actions.
6. `technical-architecture-review` — goals, constraints, architecture, flow, trade-offs and readiness.
7. `academic-defense` — motivation, research, method, findings, limitations and conclusion.
8. `training-workshop` — learning goals, concept, example, practice and recap.
9. `case-study` — context, challenge, intervention, evidence and learning.
10. `project-proposal` — need, approach, scope, plan, risk and approval request.

### 5.4 Selection and Instantiation

The package exposes deterministic utilities:

- `getVisualStyle(id)`
- `getSlideRecipe(id)`
- `getDeckBlueprint(id)`
- `searchSlideRecipes(query)`
- `recommendTemplate(request)`
- `createDeckFromTemplate(input)`
- `validateTemplateInput(input)`

`recommendTemplate` uses explicit metadata rather than an opaque model. It scores scenario, audience, evidence level, data intensity, technical depth, desired tone and requested duration. The result explains why the blueprint and style were selected.

`createDeckFromTemplate` accepts a selected blueprint, visual style and user-supplied slide content. It must:

1. verify every required blueprint step is supplied or explicitly omitted where allowed;
2. verify required semantic slots and slot limits;
3. generate stable slide and component IDs;
4. apply safe defaults for theme, variant, transition and effects;
5. add concise notes when supplied;
6. return a valid `DeckDocument` or actionable diagnostics;
7. call Deckory's existing `validateDeck` before success.

No template utility writes arbitrary JSX, CSS, coordinates or remote assets.

## 6. Authoring modes

The repository skill exposes three modes.

### Template mode

Use when the user names a blueprint, recipe or visual style. Follow the selected contract closely and only adapt optional steps.

Example: “Dùng template academic-defense, phong cách modern-professional.”

### Adaptive mode

Use when the user states a goal but does not name a template. Analyze audience, decision, evidence and content shape; call the recommendation utilities; explain the selected blueprint and style in the deck notes or authoring summary.

Example: “Tạo deck báo cáo quý cho ban lãnh đạo.”

### Original mode

Use when no recipe communicates the relationship truthfully. The agent may create a new recipe only by composing supported Deckory layouts and components, documenting why existing recipes were unsuitable, and adding tests before catalog inclusion.

Original mode is not permission to use arbitrary JSX or bypass validation.

## 7. Agent skill workflow

A new repository skill, `deckory-template-system`, will instruct agents to:

1. read the user goal, audience, venue, time budget, evidence and source material;
2. choose template, adaptive or original mode;
3. select one visual style and one deck blueprint;
4. inventory every slide using recipe ID, conclusion heading, evidence status, component and notes intent;
5. instantiate complete typed content;
6. validate slot constraints and `DeckDocument` schema;
7. inspect representative slides in a browser at full and thumbnail scale;
8. revise overflow, density, contrast, rhythm, evidence labels and motion;
9. run tests, typecheck and build;
10. report the exact template/style decisions and checks performed.

The existing `deckory-slide-director` remains mandatory and has higher priority for visual quality. The new skill supplies template selection and instantiation rules.

## 8. Quality and safety rules

- One primary insight, decision or teaching point per slide.
- Headings state conclusions rather than generic topics.
- Template content is never presented as real evidence.
- Fixture data must be explicitly marked illustrative.
- A recipe cannot require a component unsupported by its layout.
- Text and item limits must remain within current schema and renderer budgets.
- Every chart recipe requires a visible question, unit and accessible conclusion.
- Every sourced data recipe requires an evidence footer.
- No placeholder steps, empty middle slides or “repeat similarly” output.
- Visual styles prohibit generic AI-purple gradients, repeated equal-card grids, decorative charts, random stock imagery and low-contrast glass effects.
- Reduced motion preserves meaning.
- Vietnamese diacritics and realistic copy are part of visual testing.

## 9. Error handling

Template diagnostics are structured and actionable:

- template/blueprint/recipe not found;
- required blueprint step missing;
- required slot missing;
- slot value exceeds limit;
- unsupported layout/component composition;
- duplicate generated IDs;
- evidence requirement unmet;
- final Deckory schema validation failed.

Diagnostics identify blueprint, recipe, slide and slot where possible and include a remediation message. Template functions return result objects rather than throwing for expected authoring errors. Programmer errors such as duplicate catalog IDs fail fast during catalog initialization and tests.

## 10. Testing strategy

### Unit tests

- every catalog ID is unique and kebab-case;
- every style maps to a supported `DeckTheme`;
- every recipe uses a supported layout and compatible components;
- every blueprint references existing recipes;
- search returns relevant recipes deterministically;
- recommendation scoring respects explicit request signals;
- required slots and repeat limits produce precise diagnostics;
- generated IDs are stable and unique;
- a complete template input produces a valid `DeckDocument`;
- incomplete or misleading evidence input is rejected.

### Integration tests

- instantiate at least one complete deck from each blueprint;
- validate every generated deck with `validateDeck`;
- ensure recipe motion and sequence values remain valid;
- ensure package exports work from another workspace package.

### Visual verification

A representative gallery deck will exercise all visual styles and recipe families. It must be opened in Studio and Preview and inspected at full slide and thumbnail scale for:

- Vietnamese heading wraps;
- clipping and overflow;
- density and composition rhythm;
- chart/table/code readability;
- evidence labels;
- contrast and reduced motion;
- console errors.

## 11. Deliverables

1. `@deckory/templates` workspace package.
2. Typed style, recipe, blueprint, request, input, result and diagnostic contracts.
3. Six visual style presets.
4. At least thirty complete slide recipes across the listed families.
5. Ten complete deck blueprints.
6. Search, recommendation, validation and instantiation utilities.
7. Unit and integration tests covering every catalog entry.
8. `.agents/skills/deckory-template-system/SKILL.md`.
9. `docs/TEMPLATES.md` with user and agent usage examples.
10. A complete template gallery deck generated through the package, without placeholders.

## 12. Non-goals for this iteration

- importing arbitrary PPTX masters;
- image-to-slide reconstruction;
- cloud template marketplace or sharing;
- browser template editor;
- automatic external research or citation retrieval;
- arbitrary theme token expansion in the renderer;
- changing Hub/Studio code currently modified by other work.

These can consume the stable headless contract in later iterations.

## 13. Acceptance criteria

The feature is complete when:

- an agent can choose a named blueprint/style or obtain a deterministic recommendation;
- a user can request a scenario without naming a template and receive an explained selection;
- every recipe and blueprint is typed, searchable and validated;
- at least thirty recipes, ten blueprints and six styles are present with no placeholders;
- complete example inputs instantiate valid Deckory documents;
- tests cover catalog integrity, recommendation behavior, diagnostics and generated documents;
- the agent skill prevents schema bypass and incomplete output;
- repository tests, typecheck and build are run with actual results reported;
- existing unrelated dirty changes are preserved.
