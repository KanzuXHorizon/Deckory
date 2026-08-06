# Deckory 10/10 Presentation Intelligence Design

## Status

Approved by the user on 2026-08-06 through the explicit 10/10 quality rubric and request to exceed Gamma/Kimi while preserving a professional slide-master workflow.

## Design read

Reading this as: an offline-first professional presentation production system for agents and human reviewers, delivering high-variance, evidence-grounded, fully structured 16:9 decks with an editorial control-room UI and production-grade runtime.

- Narrative variance: 9/10
- Motion intensity: adaptive 3–8/10
- Visual density: adaptive 2–9/10
- Evidence rigor: 10/10

## Product objective

Deckory must outperform generic AI slide generators by combining fast structured authoring with stronger editability, validation, evidence discipline, visual rhythm, accessibility and offline reliability. It must not imitate Gamma's web-card format or Kimi's surface styling. Its advantage is a typed presentation AST shared by agent, editor, renderer, audit and export.

## Required quality rubric

Every release loop evaluates:

1. Storytelling
2. UI
3. UX
4. Visual Design
5. Motion Design
6. Typography
7. Layout
8. Charts
9. Copywriting
10. Accessibility
11. Interaction
12. Branding
13. Evidence
14. Demo Readiness
15. Production Quality

A score is diagnostic evidence, not a marketing claim. Automated scoring must disclose the checks that produced it and never claim browser or human-review quality without corresponding runtime evidence.

## Architecture

### 1. Slide Master Library

Add a typed `SlideMasterPreset` catalog to `@deckory/templates`. A master is a safe composition preset, not arbitrary coordinates or CSS. It defines:

- stable ID and communication role;
- supported layout;
- slide variant and background;
- default transition;
- component effect grammar;
- density and safe-area guidance;
- use/avoid guidance;
- composition family for rhythm analysis.

Studio exposes masters as a dedicated tab next to recipes and visual styles. Masters are filtered to the selected slide's compatible layout. Applying a master updates only validated slide-level presentation properties and safe component effects; content and semantic component types remain intact.

### 2. Adaptive Composition

Add deterministic master recommendation that considers:

- current slide layout and component signature;
- previous two composition families;
- authored visual style motion and density dials;
- evidence role and component count.

The recommendation must avoid repeating the same composition family on adjacent slides when another compatible master exists. It remains explainable and reversible.

### 3. 15-Dimension Quality Scorecard

Extend `@deckory/audit` with a transparent scorecard. Each dimension contains:

- score from 0–10;
- checks performed;
- deductions and remediation;
- confidence: structural, runtime or manual-review-required.

Structural checks cover narrative shape, heading quality, composition repetition, density, motion restraint, typography length budgets, chart evidence, copy quality, accessibility metadata, branding consistency, evidence coverage and demo completeness. UI/UX and production dimensions may combine structural checks with explicit runtime-evidence requirements.

Hub shows the overall quality score and readiness level. Studio exposes the scorecard and prioritized issues without blocking editing.

### 4. Semantic Visual Expansion

Add a typed semantic diagram component rather than arbitrary SVG/JSX. Initial variants:

- timeline;
- funnel;
- pyramid;
- cycle;
- quadrant;
- roadmap.

Every variant requires an accessible summary, bounded item count, stable IDs, final-state rendering under reduced motion, full-size and thumbnail readability and inspector support. Templates gain recipes only after renderer and schema tests pass.

### 5. MyInterview reference deck

Use MyInterview as the production proof:

- keep the 23-slide evidence-grounded story;
- assign masters to create deliberate visual rhythm;
- replace repetitive composition where the audit identifies it;
- preserve FPT identity and real local assets;
- keep appendix density appropriate for defense Q&A;
- never invent evidence or readiness claims.

## Visual language

Preserve Deckory's editorial control-room identity. Variance comes from composition, scale, density, semantic visual choice and motion grammar, not random theme changes. Avoid AI-purple gradients, generic glass, equal card grids, decorative charts, repeated centered headings and motion on every element.

## Motion grammar

- Masters may specify fade, slide, push, wipe, zoom or morph transitions within schema limits.
- Component effects remain semantic and bounded.
- One authored motion idea per slide.
- Thumbnails and export show final state.
- Reduced motion preserves all content without travel, blur, drawing or counting.

## Accessibility

- All master, quality and visual controls are keyboard accessible.
- Master cards describe role, compatibility and motion.
- Diagram variants expose an accessible textual summary.
- Color is not the sole state encoding.
- Focus remains visible at 200% zoom.
- Runtime QA covers 320, 375, 768, 1024 and 1440 CSS pixels.

## Failure handling

- Incompatible masters are hidden or disabled with an explanation.
- Applying a master never deletes content.
- Invalid audit input returns schema errors instead of a fabricated score.
- Diagram render failure falls back to accessible text and final state.
- Quality score categories requiring browser review are marked as such.

## Testing strategy

- Catalog integrity, stable IDs and master compatibility.
- Deterministic recommendation and repetition avoidance.
- Master application preserves content and schema validity.
- Scorecard deductions, caps and report formatting.
- Diagram schema, renderer, inspector and reduced-motion behavior.
- Hub and Studio UI semantics.
- Browser screenshots for Hub, Studio, Preview, Presenter and MyInterview representative slides.
- Repository gates: tests, typecheck, lint, strict deck audit, asset check, build and E2E.

## Acceptance criteria

- Studio offers a real typed slide-master workflow.
- A user can apply or auto-select a compatible master without breaking content.
- The audit identifies repeated compositions beyond repeated layout names.
- Every catalog deck receives a transparent 15-dimension scorecard.
- MyInterview demonstrates multiple composition families without visual randomness.
- New semantic visuals remain editable, accessible and schema validated.
- No arbitrary JSX, coordinates, CSS or remote runtime assets enter deck documents.
