# Deckory Design System

## Direction

Deckory uses an editorial control-room language: a calm neutral workspace surrounds a highly composed 16:9 artifact. The UI should feel like a professional production tool rather than a generic SaaS dashboard. Dense controls are grouped into clear rails, while the slide canvas remains visually dominant.

## Surfaces

- **Hub:** library and operations surface. It prioritizes recent decks, status, slide count, visual coverage and direct actions.
- **Studio:** three-zone editing surface with slide navigator, live canvas and contextual inspector. The canvas is the focal point.
- **Preview/Present:** distraction-free storytelling surface with deliberate navigation, notes and overview.

## Color

- Workspace ink: `#15171a`
- Workspace canvas: `#f2f2ed`
- Surface: `#ffffff`
- Hairline: `#d9dad6`
- Cobalt: `#5147e8`
- Teal: `#0f8b8d`
- Amber: `#c77700`
- Dark stage: `#111216`

Accent is used for state and narrative emphasis, not as decoration across every card. Teal communicates readiness or positive validation; amber marks attention without implying failure; red is reserved for destructive actions or validation errors.

## Typography

The product uses a workhorse sans stack for UI and an editorial serif only inside selected slide content. Interface headings use compact weight and restrained tracking. Monospace is limited to measurement, IDs, diagnostics and sequence metadata.

## Shape and Depth

Controls use 10–12px radii. Large panels use 14–16px radii only where they represent a distinct workspace region. Prefer one boundary mechanism at a time: either a hairline or a shadow. The slide canvas may use a broad offset shadow to separate the artifact from the workspace.

## Motion

Motion explains hierarchy and mode changes: slide changes, panel opening, selection and reveal sequencing. Hover motion stays minimal. Reduced motion disables travel while preserving state changes. No meaning depends only on animation.

## Component Language

- Compact action controls with icons and explicit accessible labels.
- Strong selected states using background, outline and positional cue rather than glow.
- Slide thumbnails preserve actual 16:9 composition.
- Diagnostics are actionable and reference slide/component context.
- Charts use direct labels and accessible summaries; legends are avoided when labels can sit next to marks.

## Responsive Behavior

Presenter keeps a scaled 16:9 canvas. Hub collapses from library grid to a single column. Studio keeps the canvas first: the inspector and slide rail become horizontally reachable or stack below the canvas on narrow screens. No essential control is hidden solely because the viewport is smaller.

## Quality Rules

- Test real Vietnamese copy for overflow.
- Provide loading, empty, error, disabled, selected and success states where applicable.
- Keep keyboard focus visible.
- Avoid nested decorative cards, generic glass effects, gradient text and remote visual assets.
- Fixture data must be labelled as illustrative.