# Deckory Hub, Studio and Visual System Design

## Goal

Turn the existing Engine + Present vertical slice into a coherent local-first presentation workspace without introducing a backend or an alternate document model.

## Chosen Architecture

Use one typed `DeckDocument` as the source of truth across four surfaces:

1. `/` Hub for deck discovery, status and direct actions.
2. `/studio?deck=<id>` for editing a browser-local draft.
3. `/preview?deck=<id>` for validating and reviewing that draft with the production renderer.
4. `/present?deck=<id>` for presenting the source deck.

A small deck catalog resolves known documents and metadata. Studio drafts are stored in `localStorage` under a versioned key and are validated with `validateDeck` before being treated as presentation-ready.

## UX Structure

### Hub

- Compact product navigation and clear primary action.
- Portfolio summary: decks, slides, visual types and readiness.
- Searchable deck library with real 16:9 thumbnails.
- Per-deck actions: edit, preview and present.
- Visual-system coverage section showing the available semantic building blocks.

### Studio

- Left rail: slide thumbnails, reorder, duplicate, delete and add-slide menu.
- Center: live 16:9 canvas using `SlideFrame`.
- Right inspector: slide settings, notes and type-specific component fields.
- Top bar: save draft, reset, preview, present and validation state.
- Diagnostics point to the affected slide/component and provide remediation.

### Preview and Present

Both reuse `Presenter`; preview reads the browser draft, while present resolves the source deck. Presenter exposes an optional return action without altering the audience canvas.

## Visual Component Upgrade

Keep existing semantic components and repair selector/markup mismatches that currently prevent tone, highlight and connector styles from rendering. Extend `chart` with typed variants: bar, line, area and donut. Each variant uses the same labelled values and emits an accessible summary.

## Data and Persistence

- No cloud or collaboration claims.
- Source decks remain immutable imports.
- Studio clones a source deck and stores a versioned browser draft.
- Reset removes the draft and restores source data.
- Preview falls back to the source deck if the draft is absent or invalid.

## Error Handling

- Unknown deck IDs fall back to the default catalog item with a visible notice where appropriate.
- Invalid drafts remain editable but display diagnostics and disable claims of readiness.
- Destructive slide deletion is disabled when only one slide remains.
- Browser storage failures do not destroy the in-memory editing session.

## Acceptance Criteria

- Hub, Studio, Preview and Present build as static-compatible Next.js routes.
- A user can edit heading copy and notes, switch slide variant/layout, edit chart data, duplicate/reorder/delete/add slides, save, reload and preview the draft.
- All current schema tests remain green and chart variants are covered by focused tests.
- `pnpm test`, `pnpm typecheck` and `pnpm build` pass.
- Desktop and mobile browser screenshots show no major overflow, clipping or unusable controls.
- Reduced motion and keyboard focus remain supported.

## Deliberate Non-goals

Authentication, cloud persistence, multi-user collaboration, import/export and arbitrary drag-to-coordinate editing are not included in this vertical slice.