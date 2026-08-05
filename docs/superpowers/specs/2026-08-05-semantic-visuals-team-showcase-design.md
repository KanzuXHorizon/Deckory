# Semantic Visuals & Team Showcase Design

## Goal

Extend Deckory with production-ready, typed presentation components for professional team introductions and content-aware animated visuals. The result must remain editable by Studio, render consistently in Studio/Preview/Present/Overview, support keyboard interaction and reduced motion, and never require arbitrary JSX or remote runtime assets in deck documents.

## Design read

Reading this as a structured presentation engine for presenters and agents, delivering richer storytelling without sacrificing validation, with an editorial control-room visual language and evidence-first behavior.

- Narrative variance: 8/10
- Motion intensity: 7/10
- Visual density: 5/10
- Evidence rigor: 8/10

## Chosen architecture

Use native SVG and Motion for React as the primary runtime. Deck data remains declarative and validated. Rive and dotLottie are not required dependencies for this slice; they may be introduced later through an optional local-asset adapter with a static fallback.

This choice keeps the document model inspectable, themeable, agent-editable, accessible and lightweight while supporting SVG path drawing, focus/press states, reveal sequencing and reduced-motion behavior.

## Component: `team-showcase`

### Data model

Each member requires only `name`. Every other field is optional:

- `role`
- `studentId`
- `summary`
- `skills`
- `contributions`
- `links`
- `image`
- `accent`
- `featured`

`image.src` accepts local application paths beginning with `/` or inline `data:image/...` assets only. `image.alt` is required when an image exists. Remote URLs are rejected.

### Variants

- `editorial`: asymmetric portrait-led roster for 2–4 members.
- `cards`: compact professional grid for 2–6 members.
- `constellation`: team members connected to a central project or shared mission.
- `spotlight`: one featured member with supporting members in a compact rail.
- `profile`: one member receives a dedicated slide with a large portrait or monogram, role, optional student ID, summary, skills, contributions and links.

The renderer automatically handles missing fields without empty labels, filler rows or broken spacing. When no image is supplied, it renders a deterministic monogram avatar. The `profile` variant accepts exactly one member so no hidden team data can be silently omitted.

### Interaction

Cards and constellation nodes are buttons in interactive presentation modes. Selecting a member reveals the available role, student ID, summary, skills, contributions and links. Keyboard focus and selection are visible. Thumbnail and overview rendering uses a complete static state and disables interaction.

For decks that need one page per member, `createTeamShowcaseSlides()` in `@deckory/templates` can generate roster-only, profile-only, or roster-plus-profile slide sequences from one typed member array. IDs, transitions, headings and optional evidence footers are generated consistently.

## Component: `visualizer`

### Variants

- `growth-tree`: roots, trunk, branches and milestone leaves communicate organic development.
- `timeline-path`: a path and ordered milestones communicate progress over time.
- `orbit`: satellites around a central idea communicate supporting capabilities.
- `network`: connected nodes communicate systems, teams or relationships.

### Data model

- `title` and `summary` are optional presentation labels.
- `center` is optional and used by orbit/network variants.
- `items` contains 2–8 typed visual nodes.
- Each item requires `id`, `label` and `description`; `value`, `icon`, `tone`, `parentId` and `featured` are optional.
- `interaction` supports `inspect`, `step` or `none`.
- `animation` supports `grow`, `draw`, `orbit`, `pulse` or `none`.

### Motion grammar

Motion explains relationship rather than decorating the slide:

- tree paths draw from roots to branches, then leaves enter in sequence;
- timeline paths draw from start to end and milestones reveal in order;
- orbit nodes settle into meaningful positions and only use subtle idle motion when allowed;
- network edges draw before nodes receive emphasis.

Reduced motion renders the final state immediately and removes travel, path drawing and looping motion. Meaning never depends on animation.

### Interaction

In `inspect` mode, users click or focus nodes to open a detail panel. In `step` mode, next/previous controls advance the internal visual story without changing the presentation slide. In `none` mode, the visual is static.

All interactive roots use `data-deck-interactive`. Presenter navigation ignores handled arrow/Enter/Space events originating inside these roots. Escape resets selection and returns focus predictably.

## Layout compatibility

- `team-showcase`: `split`, `dashboard`, `process`, `architecture`, `data`, `closing`. Roster and profile variants use the same compatibility rules; the profile preset defaults to `data` for maximum safe canvas.
- `visualizer`: `split`, `dashboard`, `process`, `architecture`, `data`, `statement`, `closing`.

Cover remains intentionally minimal and does not accept these components.

## Studio authoring

The component catalog provides complete valid defaults. The Inspector exposes variant, labels and existing member/item fields without forcing optional data. It uses conventional fields for text and compact native choices for variant/behavior. The first implementation edits a complete preset shape rather than introducing arbitrary add/remove list operations into the already-dirty Studio batch.

## Accessibility and safety

- Local or inline image sources only.
- Required alt text for supplied images.
- Buttons have descriptive accessible names.
- Focus states meet the existing Deckory focus treatment.
- Static accessible summaries repeat the visual meaning.
- `prefers-reduced-motion` and Deckory `motionDisabled` are both honored.
- Continuous motion is disabled in thumbnails, Overview and reduced-motion mode.
- Interaction never traps focus and does not steal global presentation shortcuts unless the event is handled inside the component.

## Verification

- Schema tests for valid optional team fields, local image policy, visualizer parent references and layout compatibility.
- Catalog tests proving defaults validate.
- Renderer tests for monogram fallback, image alt text, accessible visual summaries and static motion-disabled output.
- Presenter runtime tests for interactive-target navigation blocking.
- Focused test, full test, typecheck and build.
- Browser review at full slide and thumbnail scale, including reduced motion and keyboard interaction.
