# MyInterview Single Scene V2 Visual System

## Goal

Deckory must expose exactly one MyInterview defense deck. The canonical package and route ID remain `@deckory/myinterview-defense` and `myinterview-defense`, but the implementation becomes a native `DeckDocumentV2` authored directly for Scene V2. The V1 deck package, V2 migration package, deck-scoped CSS overrides and duplicate CSS imports must not participate in runtime, export, audit or test paths.

## Product decision

- `decks/myinterview-defense/` is the only source of truth.
- `myinterview-defense` is the only public deck ID.
- `decks/myinterview-defense-v2/` is removed after its behavior is absorbed.
- The old V1 `DeckDocument` implementation is replaced rather than preserved as a runtime compatibility layer.
- Git history is the rollback mechanism; no hidden V1 route, alias or CSS shim remains.

## Architecture

The canonical deck is authored as a `DeckDocumentV2` through focused V2-specific builders. Content, evidence, assets and visual composition are represented in typed scene data rather than CSS selectors. Shared renderers remain responsible for text, image, chart, diagram, shape, motion and export behavior.

The deck is split by responsibility:

- `content.ts` contains stable academic story content, team data, evidence labels and visual intent.
- `visual-system.ts` contains MyInterview-specific tokens, backgrounds and reusable scene recipes.
- `deck.ts` assembles the 23-slide document and exports `myInterviewDefense`.
- `deck.test.ts` validates schema, story order, assets, evidence, slide-safe frames and visual diversity.

No file may import `migrateDeckV1ToV2`, `DeckDocument`, V1 slide/component types or the removed `@deckory/myinterview-defense-v2` package.

## Visual direction

The deck uses an institutional editorial-tech language suitable for a graduation defense:

- warm paper and deep ink as the primary base;
- FPT orange used sparingly for institution and decision moments;
- cobalt for system intelligence and technical structure;
- teal for coaching progress, verified flow and positive state;
- no generic dashboard chrome, glassmorphism or decorative gradient text;
- one dominant conclusion per slide;
- direct labels, local screenshots and explicit evidence footers;
- controlled visual contrast between narrative, product proof, architecture, evaluation, testing and appendix sections.

The 23 slides keep the accepted story order but use fewer repeated compositions. Required families include cover, profile, media proof, problem/solution comparison, process, architecture, criterion grid, evidence matrix, metric proof, roadmap, demo and closing.

## CSS cleanup contract

Global CSS must be import-reachable exactly once from the application root. The cleanup must:

- remove `apps/present/app/myinterview-defense.css`;
- remove duplicate `slide-components.css` inclusion;
- remove orphan global CSS files that are not reachable from the root import graph;
- preserve CSS modules imported by their owning component;
- add a deterministic CSS contract check that fails for duplicate global imports, orphan app-level CSS or MyInterview deck-ID selectors in global styles;
- keep all MyInterview-specific visual behavior in typed Scene V2 data.

## Catalog and routing

- Hub exposes one MyInterview card.
- `resolveAnyDeck("myinterview-defense")` resolves the V2 deck.
- `myinterview-defense-v2` is not a public alias and returns not found where routes require a known deck.
- Studio, Preview, Presenter and Export all consume the same canonical document.
- MyInterview remains the first recommended graduation-defense deck.

## Quality and accessibility

Every slide must provide `purpose`, `conclusion`, `notes`, accessible labels and evidence status. All visible frames must stay within 1280 × 720. Images use local typed assets. Audience mode must never contain speaker notes. Reduced motion and export modes must preserve final meaning.

## Verification

The final revision must pass:

- package tests and typecheck;
- CSS contract check;
- strict deck audit and asset audit;
- production build and route bundle budgets;
- MyInterview browser E2E across Hub, Studio, Preview, Presenter and Export;
- visual-quality inspection across all 23 slides at production CSS;
- 200% equivalent viewport and mobile/coarse-pointer checks where applicable;
- full `pnpm quality:gate`.

## Non-goals

- No new cloud persistence, collaboration or account features.
- No second MyInterview deck for backward compatibility.
- No deck-specific global stylesheet.
- No claim that every PPTX visual is natively editable beyond the existing capability contract.
