# Deckory Studio Modern Interaction Design

## Goal

Modernize Deckory Studio into a professional, icon-led presentation editor without sacrificing clarity, accessibility, precision, or responsive usability.

## Interaction model

Deckory uses three control families:

1. **Visual choice controls** for fixed, recognizable options. Layout, slide variant, transition, element effect, tone, chart type, boolean state, process icon, and architecture accent use icon-led segmented or tile controls.
2. **Command popovers** for actions with more than a few choices. Adding slides and components uses a labeled icon grid with descriptions, compatibility states, keyboard focus, and explicit selection.
3. **Precision fields** for free text and numeric values. Text, notes, duration, delay, sequence, labels, and measurements remain native inputs with professional styling and stepper affordances.

Icons never replace labels where ambiguity is possible. Every icon-only action has an accessible name and tooltip. Active state uses border, surface, icon, and text together rather than color alone.

## Studio structure

### Desktop

- Persistent slide rail, central canvas, and inspector.
- Compact top toolbar with icon-first secondary actions and labeled primary Preview/Present actions.
- Slide settings are grouped into Layout, Appearance, Transition, and Notes.
- Component stack uses recognizable component icons and clear selected state.

### Tablet

- Slide rail narrows but stays usable.
- Inspector becomes a toggleable side drawer rather than disappearing.
- Top toolbar collapses secondary labels while preserving accessible tooltips.

### Mobile

- Slide strip becomes horizontal.
- Canvas remains scrollable at a safe minimum size.
- Inspector opens as a full-height sheet/drawer.
- Primary actions remain reachable and use 44px minimum touch targets.

## Visual and behavior requirements

- Use the existing Deckory editorial/technical visual identity and Lucide icon family.
- No dependency additions.
- Use reusable controls instead of one-off button markup.
- All controls support hover, focus-visible, active, disabled, and coarse-pointer states.
- Popovers close on Escape, outside click, and successful selection; focus returns to the trigger.
- Unsupported component/layout combinations stay visible but disabled with an explanation.
- Reduced motion preserves feedback without spatial animation.
- Studio remains fully usable at 320, 375, 768, 1024, and 1440 CSS pixels and at 200% zoom.

## Verification

- Unit/static-render tests cover labels, selected state, disabled state, and icon choice controls.
- Workspace tests, typecheck, and production build must pass.
- Browser smoke covers mouse, keyboard, responsive drawer behavior, popover closing, and console output.
