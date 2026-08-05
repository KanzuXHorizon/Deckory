# Deckory Engine & Present — Design

## Purpose

Build the first complete Deckory vertical slice: a Vietnamese-first, code-native presentation can be defined as typed data, rendered in the browser, audited before use, and presented reliably in a live graduation-demo environment.

## Scope boundary

This slice includes only:

- a serializable, versioned Slide AST;
- a TypeScript DSL that produces that AST;
- a deterministic DOM renderer with theme tokens and layout recipes;
- a browser presenter with keyboard navigation, slide overview, speaker notes, click sequences, fullscreen support, and reduced-motion behavior;
- automated structural, accessibility, and visual quality checks;
- an example deck that uses professional Vietnamese copy and validates the engine.

It explicitly excludes Hub, authentication, visual editing, real-time collaboration, server persistence, PPTX, PDF, PNG, imported PowerPoint, whiteboarding, and an autonomous research agent.

## Source of truth and package boundaries

The serializable Slide AST is the only presentation source of truth. The TypeScript DSL is a typed authoring layer that produces valid AST documents; React is a renderer only. No feature in this slice depends on parsing arbitrary TSX or evaluating arbitrary user JavaScript.

The first packages are deliberately narrow:

- `schema`: AST definitions, Zod validation, document versioning, diagnostic types.
- `core`: immutable document commands and presenter sequencing helpers.
- `themes`: typography, colour, spacing, and presentation-safe token contracts.
- `components`: registered, schema-backed slide content components.
- `layouts`: recipe-driven layouts with named slots and content constraints.
- `renderer-dom`: AST-to-DOM renderer shared by preview and Present.
- `audit`: deterministic structural checks and browser-based visual assertions.
- `cli`: create, dev, validate, lint, audit, and present commands.
- `apps/web`: the Deckory Present web application and example deck host.

Every component declares a stable name, props schema, semantic metadata, static fallback, and export capability metadata. This is the forward-compatible seam for the Studio inspector and later export renderer; neither is implemented in this slice.

## Presentation behavior

Present renders only validated deck documents. It offers previous/next navigation, Home/End and arrow-key support, a visible progress indicator, an accessible overview, optional speaker notes shown only in presenter mode, and click-sequence steps with stable URLs per slide.

Motion is progressive enhancement. `prefers-reduced-motion: reduce` removes nonessential transitions and automatically reveals sequence content without relying on animation for meaning. Every action remains operable by keyboard and receives an accessible label.

The canonical screen is desktop 16:9. The renderer preserves the slide aspect ratio inside smaller viewports, with safe controls outside the canvas rather than reflowing a slide into a different composition.

## Offline-ready decision

Deckory chooses the first option: after a deck has completed an online load, it remains presentable when the network disappears. This is not a promise that an arbitrary unvisited remote deck or uncached third-party asset will work offline.

Implementation is a small, first-party service worker and Web App Manifest, scoped to the browser presenter. A versioned deck manifest lists the shell, selected deck AST, local fonts, and presentation assets that must be cached before the UI can report **Sẵn sàng ngoại tuyến**. The application shell and versioned local assets are precached; new deck versions activate only after their required asset set completes. Failed or missing assets leave the deck in an explicit online-only state instead of creating a stale or partially cached presentation.

The MVP does not request installation, send push notifications, cache API responses, or promise offline editing. A clear readiness state, cache versioning, and a browser test that reloads a fully cached presentation while offline are required acceptance conditions.

## Quality contract

Validation emits actionable diagnostics containing document ID, slide ID, component ID, property path, severity, and remediation text. It rejects malformed AST, unknown component versions, duplicate IDs, invalid sequence ordering, inaccessible interactive controls, missing static fallbacks, and unresolved assets.

Audit checks are non-mutating and report: overflow/clipping risk, safe-area violations, heading hierarchy, text-size thresholds, text and background contrast, content density, missing alt text, missing citations, unsupported runtime capability, and motion duration. The audit may score a deck but never changes its content or layout.

Playwright runs Chromium visual regression tests at the reference 16:9 viewport and functional tests for keyboard navigation, notes isolation, reduced motion, sequence progression, and offline reload. Baselines are generated and reviewed in one pinned environment; visual snapshots are not accepted from arbitrary OS/browser combinations.

## Example fixture

The first fixture is a Vietnamese Deckory product/story deck designed to exercise cover, statement, split, metric, comparison, process, architecture, data, and closing slides. It uses Be Vietnam Pro for display/body Vietnamese text and Geist Mono only for technical labels. MyInterview presentation material can later be added as a separate migration fixture once that repository is available; it must not determine the core AST contract.

## Non-goals and deferred seams

The AST supports `editor` metadata and component inspection descriptors, but no editor UI ships. It supports stable document IDs and operation diagnostics, but no Yjs binding ships. It supports an `export` capability field and static fallbacks, but no PDF, PNG, or PPTX generator ships. These seams exist to avoid breaking document compatibility when those later phases start.

## Failure handling

Invalid documents do not enter the renderer. Missing assets show a slide-local, nontechnical fallback in development and block presentation readiness in production. Service-worker installation failures leave the online presenter fully usable and show a concise status; they never block an online live presentation. A corrupt stale cache is deleted and rebuilt on the next successful online load.

## Acceptance criteria

- A new agent can create a valid deck from documented TypeScript primitives without modifying the renderer.
- Every rendered deck is schema-valid, has stable IDs, and contains no detected overflow at 16:9.
- The example deck presents with pointer and keyboard navigation, speaker-note privacy, reduced motion, and no critical audit finding.
- Once the example deck reports offline readiness, it can be refreshed and presented with the browser offline.
- The offline state clearly distinguishes fully cached, caching, stale, and unavailable states.
- Functional and visual tests run reproducibly against the same reference browser runtime.

## Research basis

- Next.js supports App Router web manifests and direct service-worker registration; its PWA guidance specifically recommends a service worker for offline functionality and notes that offline must be thoroughly tested.
- Service-worker precaching gives versioned local assets an intentional cache lifecycle instead of relying on browser HTTP cache behavior.
- Motion exposes reduced-motion support, and Playwright provides reviewed screenshot baselines for visual regression.

Sources: https://nextjs.org/docs/app/guides/progressive-web-apps, https://serwist.pages.dev/docs/serwist/guide/precaching, https://motion.dev/docs/react-use-reduced-motion, https://playwright.dev/docs/test-snapshots
