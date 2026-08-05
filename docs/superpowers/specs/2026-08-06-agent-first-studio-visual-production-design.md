# Deckory Agent-First Studio & Visual Production Design

## Status

Approved for implementation on 2026-08-06.

## Product direction

Deckory is an agent-first presentation production system. Agents usually create the first complete deck, while people and later agents review, correct, customize and present the same typed document. The product must therefore make generated work easy to inspect and safely refine rather than imitate an unrestricted pixel canvas.

The first deployment target is an installable offline-first PWA. This initiative prioritizes visible product quality before deeper persistence work: Studio interaction quality, slide and visual quality, reusable templates, motion, accessibility and consistency across Hub, Preview and Presenter.

## Design read

Reading this as: a professional production editor for presentation authors and agents, delivering trustworthy structured decks with an editorial control-room visual language and defense-grade evidence discipline.

- Narrative variance: 8/10
- Motion intensity: 6/10
- Visual density: adaptive 3–8/10
- Evidence rigor: 8/10

## Outcomes

1. Studio becomes the fastest and safest place to refine an agent-generated deck.
2. Slide visuals communicate relationships clearly at full-size and thumbnail scale.
3. Templates encode narrative, visual and motion decisions rather than only colors.
4. Hub, Studio, Preview and Presenter feel like one production product.
5. Every important operation remains usable offline, by keyboard and with reduced motion.

## Non-goals for this initiative

- Arbitrary free-positioned JSX or serialized CSS in deck documents.
- Real-time collaboration, cloud accounts or server persistence.
- A Canva-compatible unrestricted drawing surface.
- Editable PPTX export.
- Arbitrary keyframe or timeline serialization.
- Replacing the existing Deckory editorial identity.

## Architecture

### 1. Studio workspace foundation

Studio remains a three-zone production workspace: slide navigator, dominant 16:9 canvas and contextual inspector. It gains a focused command layer rather than adding permanent controls everywhere.

Required capabilities:

- bounded undo and redo history for document mutations;
- keyboard shortcuts with platform-safe behavior;
- explicit save, autosave and recovery state;
- slide search and rapid navigation;
- command palette for high-frequency commands;
- canvas fit and zoom controls;
- direct motion replay for the selected slide or component;
- contextual inspector sections with progressive disclosure;
- useful empty, disabled, error and offline states;
- responsive drawer behavior without hiding essential actions.

The document history is in-memory in this phase and does not replace existing local draft snapshots. A later PWA persistence phase can store the same history model in IndexedDB.

### 2. Slide and visual engine

The shared renderer remains the only visual source for Hub thumbnails, Studio, Preview, Presenter and Export. Visual upgrades must be semantic and schema-compatible.

Required visual behavior:

- charts animate from a meaningful zero or baseline to the authored value;
- metrics use restrained count-up only in audience-scale presentation contexts;
- process, architecture and visualizer components animate by semantic sequence;
- direct labels remain readable without waiting for motion;
- thumbnails and overview render a fully revealed static state;
- reduced motion removes travel, blur, drawing and counting but preserves final values;
- animation uses transform, opacity, clip-path, stroke progress or numeric interpolation only;
- no visual depends on animation for meaning.

Visual components must support long Vietnamese copy, negative and zero values, one-item datasets, dense labels and narrow previews without clipping.

### 3. Template intelligence and customization

A complete template is:

`Visual Style × Slide Recipe × Deck Blueprint × Motion Grammar`

The existing typed template package remains the instantiation boundary. Enhancements must expose safe customization rather than bypass it.

Required capabilities:

- template cards show real representative previews and communication purpose;
- filters cover scenario, audience, evidence level, visual density and technical depth;
- every style defines a restrained motion grammar and density range;
- recipe search explains use and avoid guidance;
- agent overrides remain per-step and validate through public APIs;
- custom themes use supported tokens only;
- fixtures remain explicitly illustrative.

### 4. Product-wide UI system

Hub, Studio, Preview, Presenter and Export share:

- workspace tokens and semantic state colors;
- focus, hover, pressed, disabled and loading behavior;
- one Lucide icon grammar;
- compact professional Vietnamese copy;
- motion duration and easing tokens;
- offline and local-only language;
- responsive and 200% zoom behavior.

The canvas is visually dominant. Product chrome must not compete with the deck.

## Interaction rules

### Undo and redo

- Every user-visible document mutation creates one history entry.
- Consecutive text input updates within a short window may be coalesced later; the first implementation may record each mutation if correctness remains stable.
- History is capped at 100 document states.
- Undo and redo never affect selected UI tabs, open popovers or viewport zoom.
- Restoring a named snapshot resets the active undo branch to the restored document.
- Keyboard shortcuts are `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` and `Ctrl+Y`.

### Command palette

- Opens with `Ctrl/Cmd+K`.
- Searches commands and slides using normalized Vietnamese text.
- Supports keyboard navigation, Enter to execute and Escape to close.
- Commands are visible only when applicable; destructive commands require the existing confirmation dialog.
- Focus returns to the opener after closing.

### Motion replay

- Studio renders the selected slide fully revealed by default.
- Replay temporarily resets the selected preview sequence and replays authored transition and element effects.
- Component replay focuses on the selected component where the renderer supports it; otherwise it replays the slide sequence.
- The control is disabled when motion is `none` or reduced motion is active and explains why.

### Canvas zoom

- Presets: Fit, 75%, 100%, 125%.
- Fit is the default and remains responsive to viewport changes.
- Zoom affects only the Studio canvas viewport, never deck geometry or export.
- Keyboard focus and pointer interaction remain stable while zoom changes.

## Visual language

Deckory keeps its editorial control-room identity:

- neutral workspace surfaces;
- dark ink and restrained cobalt, teal and amber accents;
- slide canvas with stronger separation than surrounding controls;
- compact workhorse sans UI typography;
- serif only in selected deck content;
- hairlines or shadows, never both without a hierarchy reason;
- 10–12px control radii and 14–16px workspace-region radii;
- no generic glass, neon glow, gradient text or decorative dashboards.

Microinteraction is quiet and functional:

- selected slide and selected component use a short state transition;
- command surfaces scale or travel no more than 8px;
- success feedback does not block work;
- destructive controls do not animate playfully;
- hover never moves dense layout geometry.

## Accessibility

- All primary flows work by keyboard.
- Roving focus patterns follow ARIA expectations.
- Dialogs and command surfaces trap focus while open and restore it on close.
- Focus-visible remains clear on light and dark surfaces.
- Reduced motion is fully supported.
- Status changes use polite live regions.
- Icon-only actions have accessible labels and tooltips.
- Color is never the sole state indicator.
- Product surfaces remain usable at 320, 375, 768, 1024 and 1440 CSS pixels and 200% zoom.

## Offline and PWA boundary

The current service worker and local draft behavior remain operational. This phase may improve visible offline readiness and cache messaging but does not migrate document storage to IndexedDB yet.

The next persistence phase will add:

- IndexedDB document and version storage;
- multi-tab write coordination;
- storage persistence requests;
- asset storage strategy for larger local media;
- explicit migration from legacy localStorage drafts.

## Failure handling

- Storage failure preserves the in-memory document and explains the limitation without technical leakage.
- Invalid drafts fall back to the source deck and identify that recovery occurred.
- Invalid template input displays actionable diagnostics.
- Motion failure shows final content immediately.
- Unsupported browser capabilities degrade to a usable online-only or static experience.
- No raw stack trace, runtime exception or internal provider detail appears in user-facing copy.

## Testing strategy

### Unit and component tests

- document history push, undo, redo, cap and branch invalidation;
- shortcut resolution and editable-target protection;
- command search normalization and disabled-command handling;
- zoom normalization and preset behavior;
- motion final-state and reduced-motion behavior;
- template metadata and diagnostics.

### Browser tests

- Studio keyboard editing, undo/redo and command palette;
- slide navigation and motion replay;
- responsive inspector and canvas at required widths;
- 200% zoom;
- Hub, Studio, Preview and Presenter screenshot review;
- offline Presenter launch after cache preparation;
- console and network error review;
- reduced-motion screenshots.

### Repository gates

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm audit:decks -- --strict`
- `pnpm assets:check`
- `pnpm build`
- `pnpm test:e2e`

## Delivery slices

### Slice 1 — Studio control foundation

Undo/redo, shortcuts, command palette, slide search, canvas zoom and motion replay with focused tests.

### Slice 2 — Visual motion refinement

Semantic chart, metric, process, architecture and visualizer animation with static and reduced-motion guarantees.

### Slice 3 — Template discovery and customization

Improved template metadata, filtering, previews and safe style/motion customization.

### Slice 4 — Product-wide polish

Hub, Preview, Presenter and Export alignment, responsive states, accessibility, copy and screenshot refinement.

### Slice 5 — PWA persistence hardening

IndexedDB, migration, multi-tab coordination and durable offline asset storage. This slice starts only after visible product quality is stable.

## Acceptance criteria

- An agent-generated deck can be opened, searched, corrected, undone, replayed, previewed and presented without editing source code.
- Studio remains understandable without reading documentation.
- Visuals are legible at full-size and thumbnail scale.
- Motion is purposeful, replayable and fully reduced-motion safe.
- Template selection communicates narrative purpose and evidence expectations.
- All product surfaces share consistent UI states and copy.
- No requested feature introduces arbitrary JSX, inline coordinates, remote runtime assets or unvalidated animation objects.
- Fresh tests, typecheck, build and browser evidence support every completion claim.
