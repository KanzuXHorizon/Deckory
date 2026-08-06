# Deckory Design System

## Direction

Deckory uses an editorial control-room language: a calm neutral workspace surrounds a highly composed 16:9 artifact. The UI should feel like a professional production tool rather than a generic SaaS dashboard. Dense controls are grouped into clear rails, while the slide canvas remains visually dominant.

## Surfaces

- **Hub:** library and operations surface. It prioritizes recent decks, status, slide count, visual coverage and direct actions.
- **Studio:** three-zone editing surface with slide navigator, live canvas and contextual inspector. The canvas is the focal point.
- **Preview/Present:** scaled Scene V2 storytelling surface with multi-slide navigation, overview, fullscreen and presenter-only notes. Audience mode removes all workspace chrome and note content.
- **Export:** print-safe 16:9 surface with visible capability disclosure before artifact creation.

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
- Native editorial charts remain in the first-load renderer. Advanced ECharts SVG loads only when a slide declares a reviewed advanced variant; its loading fallback must remain accessible.
- Fallback and unsupported export states are visible product states, not hidden implementation details.

## Responsive Behavior

Presenter keeps a scaled 16:9 canvas. Hub collapses from library grid to a single column. Studio keeps the canvas first: the inspector and slide rail become horizontally reachable or stack below the canvas on narrow screens. Overview thumbnails render the same Scene V2 document in motion-disabled mode. No essential control is hidden solely because the viewport is smaller.

## Quality Rules

- Test real Vietnamese copy for overflow.
- Provide loading, empty, error, disabled, selected and success states where applicable.
- Keep keyboard focus visible.
- Avoid nested decorative cards, generic glass effects, gradient text and remote visual assets.
- Fixture data must be labelled as illustrative.
- Speaker notes must never exist in audience-mode DOM or export output.
- Heavy chart/editor runtimes must stay outside Hub, Preview and Presenter first-load budgets.
- Global CSS enters through `app/globals.css` exactly once; component-specific styling uses CSS Modules.
- Deck-specific visual direction belongs in typed Scene V2 data and theme tokens, never global selectors keyed by deck ID.
- Thumbnail, reduced-motion and export modes must show the same complete final meaning as the authored motion state.