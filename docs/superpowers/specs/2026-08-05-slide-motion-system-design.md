# Deckory Slide Motion System Design

## Goal

Add a production-grade, typed motion system for slide transitions and element reveals, including a shared-element morph capability, without allowing arbitrary animation objects inside deck documents.

## Product principles

- Motion explains continuity, hierarchy, and narrative progression; it is not decoration by default.
- Deck authors select semantic presets, while the presenter runtime owns implementation details.
- Content remains visible and usable when animation is unavailable.
- `prefers-reduced-motion` disables spatial, blur, wipe, and morph movement while preserving immediate state changes.
- The system must work in normal presentation, overview thumbnails, keyboard navigation, forward/backward navigation, and repeated interruption.

## Typed document contract

### Slide transition

Each slide may define:

```ts
transition?: {
  type: "none" | "fade" | "slide" | "push" | "wipe" | "zoom" | "morph";
  duration?: number;
  easing?: "standard" | "emphasized" | "linear";
}
```

`duration` is expressed in seconds and constrained to `0.1..1.2`. The transition belongs to the entering slide. When omitted, the runtime uses a quiet `fade` default.

### Element effect

Each semantic component may define:

```ts
effect?: {
  type: "none" | "fade" | "rise" | "scale" | "wipe" | "blur" | "pop";
  duration?: number;
  delay?: number;
  easing?: "standard" | "emphasized" | "linear";
}
morphId?: string
```

`duration` is constrained to `0.1..1.2`; `delay` is constrained to `0..1.5`; `morphId` uses stable kebab-case IDs. `sequence` still controls when an element becomes visible. `effect` only controls how that visibility change is presented.

## Runtime architecture

Create `apps/present/components/motion-system.ts` as the single registry for:

- normalized timing and easing;
- direction-aware slide variants;
- element reveal variants;
- reduced-motion fallbacks;
- shared layout IDs derived from deck ID and `morphId`.

`Presenter` tracks the last slide index to derive forward/backward direction, reads the entering slide transition, and renders both slides concurrently only for transitions that require overlap. `morph` uses Motion shared `layoutId`; it falls back to fade when no matching `morphId` exists.

`SlideFrame` remains the semantic renderer. It delegates reveal animation to the motion registry and sets `layoutId` only when a component explicitly opts into morphing. Overview thumbnails render fully revealed, motion-disabled content.

## Preset behavior

- `none`: immediate switch.
- `fade`: opacity only.
- `slide`: entering slide travels a short distance in navigation direction.
- `push`: entering and exiting slides move as a coordinated pair.
- `wipe`: bounded clip-path reveal with opacity fallback.
- `zoom`: restrained scale plus opacity.
- `morph`: fade/scale shell transition plus shared-element interpolation for matching `morphId` values.

Element presets remain subtle: `rise` is the default sequence reveal; `pop` is reserved for compact metrics or callouts; `blur` is bounded; `wipe` uses clip-path rather than width/height.

## Accessibility and performance

- Reduced motion resolves every transition to zero-duration opacity/state changes.
- Hidden sequence content uses `aria-hidden` and does not receive pointer interaction.
- Only transform, opacity, filter, and clip-path are animated.
- Blur is capped and never used in overview thumbnails.
- No new animation dependency is added; the existing `motion` package is used.
- Default durations stay between 180 and 520 ms; authored focal transitions may opt up to 1.2 s.

## Validation and diagnostics

The schema rejects unknown presets, unstable morph IDs, negative delays, and out-of-range durations. Existing deck documents remain valid because all motion fields are optional.

## Test strategy

- Schema tests for accepted presets, compatibility, limits, and invalid values.
- Motion registry unit tests for forward/backward variants and reduced-motion normalization.
- Static render tests for component effect metadata, shared layout IDs, and accessibility state.
- Presenter build/typecheck tests for integration.
- Browser smoke check of keyboard navigation, overview thumbnails, reduced motion, and representative `fade`, `wipe`, `push`, and `morph` slides.

## Scope boundaries

This batch does not add a visual timeline editor or arbitrary keyframe authoring. The contract is intentionally preset-based so a future editor can expose safe controls without serializing JSX or runtime-specific animation objects.
