---
name: gpt-taste
description: Supporting anti-default visual-design skill for GPT/Codex. Use with deckory-slide-director when a deck is visually repetitive, timid, generic, or lacks compositional and motion variety. Deckory presentation constraints override landing-page-specific upstream rules.
---

# GPT Taste for Deckory

Adapted from `Leonxlnx/taste-skill/skills/gpt-tasteskill`.

Use this skill only after `deckory-slide-director` has established the audience, narrative, visual world, component set, and evidence requirements.

## Directive

Break common generated-design defaults without turning the deck into visual noise.

Avoid:

- narrow headings wrapping into four or more lines;
- the same left/right split on every slide;
- equal card grids used regardless of content;
- empty or mathematically broken compositions;
- cheap labels such as `SECTION 01`, `QUESTION 05`, or `ABOUT US`;
- invisible or low-contrast controls and text;
- decorative data visuals;
- arbitrary floating badges, stamps, or pill tags;
- motion added to every element;
- a single centered composition repeated across the deck.

## Controlled variance

Before editing, inventory the previous and next slide. Choose a composition that improves narrative rhythm rather than repeating the nearest layout.

Vary among:

- cinematic statement;
- asymmetric split;
- full-width evidence visual;
- dense but disciplined data field;
- exact comparison table;
- process or architecture flow;
- code-led technical explanation;
- spotlight insight;
- quiet transition or section divider.

Do not randomize blindly. Audience comprehension, content relationship, brand system, and 16:9 safety determine the composition.

## Typography

- Keep the primary heading within two lines when possible.
- Widen the text measure or reduce scale before accepting a broken wrap.
- Use a coherent sans/mono or brand-approved stack.
- Do not inject a random serif word only to appear editorial.
- Maintain visible descenders, Vietnamese diacritics, and punctuation at all scales.
- Use small uppercase labels sparingly; one repeated eyebrow on every slide is a generated-design tell.

## Density and spacing

- Give each slide a distinct visual center.
- Use large negative space when the statement is the story.
- Use dense layouts only when the audience needs simultaneous comparison.
- A grid has exactly as many cells as the content requires.
- Do not create empty filler cells.
- Use cards only when they communicate grouping or elevation.
- Keep gutters and safe margins consistent even when composition varies.

## Motion

Prefer Deckory sequence reveals, typed transitions, and shared morph IDs over page-scroll GSAP patterns.

Motion may:

- reveal an argument in spoken order;
- transform the same object between two states;
- emphasize a selected datum or code line;
- transition between overview and detail.

Motion must not:

- make the deck depend on scrolling;
- loop continuously without meaning;
- hide content from reduced-motion users;
- create horizontal overflow;
- compete with the speaker.

## Visual assets

Use verified product screenshots, diagrams, local assets, or generated reference material with explicit status. Do not add random stock imagery or remote placeholders. Brand-kit images establish art direction; they do not replace product evidence.

## Mandatory pre-flight

Confirm:

1. The deck contains multiple composition families with deliberate pacing.
2. No heading is a narrow multi-line wall.
3. Every grid is complete and balanced.
4. Every chart, table, and code visual has a clear teaching purpose.
5. No cheap meta-label rhythm dominates the deck.
6. Contrast and focus remain accessible.
7. Full-size and thumbnail screenshots have been reviewed.
8. Reduced motion preserves meaning.
9. The implementation remains typed Deckory data rather than arbitrary JSX.

Source: https://github.com/Leonxlnx/taste-skill/tree/main/skills/gpt-tasteskill
License: MIT, upstream copyright Leonxlnx and contributors.