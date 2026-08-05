# Deckory Slide Quality Skills Design

## Goal

Integrate the useful parts of Leonxlnx/taste-skill into Deckory as repository-local agent skills, then close the renderer gaps that prevent agents from producing complete technical and data-heavy presentations.

## Scope

This batch treats `brandkit` as an agent skill for generating identity reference boards. It does not add a Brand Kit product feature, database model, or editor panel to Deckory.

The implementation includes:

- a Deckory-specific slide direction and quality-control skill;
- adapted repo-local `brandkit`, `gpt-taste`, and `full-output-enforcement` skills with source attribution;
- root agent instructions that require the Deckory slide skill for deck work;
- semantic `table` and `code` components across schema, validation, renderer, Studio creation, Inspector editing, thumbnails, and tests;
- a visual-review workflow using real Preview/Present screenshots and iterative correction.

## Architecture

### Skill layer

`.agents/skills/deckory-slide-director/SKILL.md` is the primary entry point for any deck or slide task. It translates upstream anti-slop rules into a presentation-specific workflow: audience and narrative read, design dials, component selection, evidence handling, speaker notes, motion discipline, and pre-flight review.

The upstream-derived skills remain separate and optional:

- `brandkit` establishes a reference identity board when a product has no usable visual language or the user explicitly requests one;
- `gpt-taste` supplies stronger anti-default and visual-variance prompts, but Deckory-specific constraints override page/landing assumptions;
- `full-output-enforcement` prevents incomplete decks, omitted slides, placeholder components, or truncated implementation.

A lock manifest records the upstream repository, retrieval date, local paths, and adaptation policy.

### Presentation component layer

`table` and `code` become typed members of `SlideComponent` rather than arbitrary JSX.

`table` supports a title, two to six columns, one to eight rows, optional highlighted rows, and a note. Validation requires every row to contain exactly the same number of cells as the column set.

`code` supports a title, language label, source text, optional caption, optional line numbers, and explicit highlighted lines. Validation rejects highlighted line numbers outside the snippet.

Both components render semantic accessible markup and remain readable in Overview, Studio thumbnails, next-slide preview, and the full Presenter.

## Quality rules

- One decision, insight, or teaching point per slide.
- Headings state the conclusion instead of naming the artifact.
- Use charts for relationships, tables for exact comparison, and code only for the smallest executable or explanatory fragment needed by the talk.
- Data slides include a source or an explicit illustrative-data label.
- Code snippets stay within the visible 16:9 canvas and use highlighted lines to direct attention.
- Brand-kit output is reference material, not factual product evidence and not a substitute for accessible HTML/CSS rendering.
- Motion supports reveal order and continuity; it cannot be the only carrier of meaning.
- Every meaningful slide has concise speaker notes.
- Preview and Present must be visually inspected at 16:9, with overflow, contrast, focus, reduced motion, and screenshot review included in the final gate.

## Verification

- Schema tests prove valid and invalid table/code contracts.
- Renderer tests prove semantic table output, escaped code output, line-number behavior, highlighted lines, and accessible labels.
- `pnpm test`, `pnpm typecheck`, and `pnpm build` must pass.
- A real browser pass captures representative data and technical slides and checks them at normal presentation size and thumbnail scale.

## Non-goals

- Cloud brand-kit storage or reusable product-level theme management.
- Arbitrary JSX, coordinates, remote assets, or runtime execution of code snippets.
- Installing every upstream skill regardless of relevance.
- Copying landing-page-specific AIDA or GSAP rules into slides without presentation-specific judgment.
