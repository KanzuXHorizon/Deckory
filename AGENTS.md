# Deckory Agent Guide

Deckory documents are structured presentation data. Do not put arbitrary JSX, inline style objects, untyped coordinates, or external remote assets into a deck.

## Fast path

1. Add a deck package under `decks/<name>/` with a `DeckDocument` created by `defineDeck`.
2. Use stable, kebab-case slide and component IDs.
3. Use a named layout: `cover`, `statement`, `split`, `dashboard`, `comparison`, `process`, `architecture`, `data`, or `closing`.
4. Use semantic components: `heading`, `statement`, `metric-grid`, `comparison`, `process`, `architecture`, `chart`, `evidence-footer`.
5. Write Vietnamese copy for the audience, not implementation details. Cite the source or label fixture data as illustrative.
6. Give each meaningful slide concise `notes`; audience mode must never render them.
7. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before claiming success.

## Readability rules

- One decision or insight per slide.
- Put the conclusion in the heading; do not title a chart “Results”.
- Prefer a chart, process or comparison over a raw data table when the relationship is the story.
- A component with `sequence` is hidden until its reveal step. Never make meaning depend only on motion.
- Preserve `16:9`; the canvas scales but does not redesign itself at mobile size.
