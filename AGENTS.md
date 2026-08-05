# Deckory Agent Guide

Deckory documents are structured presentation data. Do not put arbitrary JSX, inline style objects, untyped coordinates, or external remote assets into a deck.

Before creating, editing, redesigning, or reviewing any deck or slide, read and follow `.agents/skills/deckory-slide-director/SKILL.md`. Use `.agents/skills/brandkit/SKILL.md` only when a product lacks a coherent identity or the user explicitly requests a brand-kit reference. Deckory-specific rules override upstream page-design assumptions.

Before selecting or creating reusable styles, slide recipes or deck blueprints, also read `.agents/skills/deckory-template-system/SKILL.md`.

## Fast path

1. Add a deck package under `decks/<name>/` with a `DeckDocument` created by `defineDeck`.
2. Use stable, kebab-case slide and component IDs.
3. Use a named layout: `cover`, `statement`, `split`, `dashboard`, `comparison`, `process`, `architecture`, `data`, or `closing`.
4. Use semantic components: `heading`, `statement`, `metric-grid`, `comparison`, `process`, `architecture`, `chart`, `table`, `code`, `insight`, `evidence-footer`.
5. Write Vietnamese copy for the audience, not implementation details. Cite the source or label fixture data as illustrative.
6. Give each meaningful slide concise `notes`; audience mode must never render them.
7. Inspect representative slides in a real browser at full-size and thumbnail scale; fix overflow, contrast, density, motion, and evidence defects.
8. Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm audit:decks -- --strict`, and `pnpm build` before claiming success.
9. For Presenter, Hub, Studio, slide renderer or responsive changes, run `pnpm test:e2e` and review the new screenshots under `output/playwright/screenshots/<run-id>/`.

## Readability rules

- One decision or insight per slide.
- Put the conclusion in the heading; do not title a chart “Results”.
- Prefer a chart, process or comparison over a table when the relationship is the story; use `table` for exact row-level comparison.
- Use `code` only for a small coherent fragment that can be explained during the talk; highlight the lines currently discussed.
- A component with `sequence` is hidden until its reveal step. Never make meaning depend only on motion.
- Preserve `16:9`; the canvas scales but does not redesign itself at mobile size.
