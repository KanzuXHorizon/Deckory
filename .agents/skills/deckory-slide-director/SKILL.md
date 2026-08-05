---
name: deckory-slide-director
description: Mandatory Deckory presentation direction and quality-control skill. Use before creating, editing, redesigning, reviewing, or completing any Deckory deck or slide. Covers narrative, visual language, component selection, charts, tables, code snippets, evidence, motion, accessibility, and screenshot-based pre-flight review.
---

# Deckory Slide Director

Use this skill for every task that creates, edits, audits, redesigns, or completes a Deckory deck or slide.

This skill adapts the anti-slop principles from Leonxlnx/taste-skill to structured 16:9 presentations. Deckory repository rules, `PRODUCT.md`, `DESIGN.md`, the typed schema, and factual evidence override upstream landing-page assumptions.

## 1. Read the presentation before designing

Inspect the current deck, source material, audience, presentation setting, and existing visual truth. State one compact design read before editing:

`Reading this as: <deck kind> for <audience>, delivering <decision or learning outcome>, with a <visual language> and <evidence level>.`

Resolve these four dials from context:

- `NARRATIVE_VARIANCE` 1-10: repeated and calm at 1, deliberately varied and cinematic at 10.
- `MOTION_INTENSITY` 1-10: static at 1, choreographed transitions and reveals at 10.
- `VISUAL_DENSITY` 1-10: one sparse statement at 1, dense technical/data explanation at 10.
- `EVIDENCE_RIGOR` 1-10: illustrative concept at 1, sourced review/defense material at 10.

Deckory default: `7 / 5 / 5 / 8`. Change the dials when the audience, venue, topic, or brand requires it.

Do not default to centered titles, equal card grids, AI-purple gradients, generic glass panels, decorative charts, random stock imagery, or the same composition on consecutive slides.

## 2. Establish one visual world

Before composing individual slides, identify the deck-level visual system:

- type hierarchy and maximum line lengths;
- neutral palette and one primary accent family;
- chart palette and highlight semantics;
- corner, border, depth, icon, and texture rules;
- motion grammar and transition budget;
- image treatment and source policy;
- code theme and data-table style.

Use the repository `DESIGN.md` when the deck belongs to Deckory itself. For another product, preserve its verified assets and identity. When no usable identity exists or the user explicitly asks for one, use the repo-local `brandkit` skill to produce a reference board first. Treat the board as art direction, not factual evidence or runtime UI.

One deck uses one coherent visual world. Variance comes from composition, scale, pacing, and component choice, not from changing brand systems slide by slide.

## 3. Design the story, not a page sequence

Each slide has one primary job:

- establish context;
- state a problem or tension;
- show evidence;
- compare alternatives;
- explain a process;
- reveal architecture;
- teach a technical detail;
- state a decision;
- close with an action or memorable synthesis.

Write the conclusion in the heading. Avoid headings such as `Results`, `Architecture`, `Chart`, `Overview`, or `Code` when the slide can state what the audience should understand.

A slide must not become a document page. Cut, split, sequence, or move detail to speaker notes when content no longer fits the initial 16:9 view.

## 4. Component selection

Choose the component that best explains the relationship:

| Need | Preferred component | Do not use when |
|---|---|---|
| One memorable claim | `statement` | the audience needs evidence on the same slide |
| Two to four headline values | `metric-grid` | exact row-level comparison is the point |
| Change, rank, share, or distribution | `chart` | there are too few values or labels carry the story |
| Exact multi-field comparison | `table` | a chart communicates the relationship faster |
| Before/after or two alternatives | `comparison` | more than two alternatives must be evaluated |
| Ordered journey or operating model | `process` | order is not meaningful |
| Systems and boundaries | `architecture` | it is only a decorative list of technologies |
| Small technical proof | `code` | the snippet cannot be explained during the talk |
| Interpreted conclusion | `insight` | it merely repeats the heading |
| Source and evidence status | `evidence-footer` | never omit on sourced or illustrative data slides |

Use semantic Deckory components only. Never put arbitrary JSX, free coordinates, executable code, or remote runtime assets into a deck document.

## 5. Chart direction

A chart must answer one visible question.

- Use bar for comparison or ranking.
- Use line for change over an ordered interval.
- Use area only when magnitude plus trend matters.
- Use donut only for a small part-to-whole set; avoid it for precise comparison.
- Highlight one series or datum only when it carries the conclusion.
- Prefer direct labels to detached legends.
- Keep categories within the schema limit and shorten labels before shrinking them beyond readability.
- State unit, time range, population, and source when relevant.
- Provide an accessible summary that communicates the same conclusion without the visual marks.
- Fixture data must be labelled illustrative.

Never add a chart only to make a slide look analytical.

## 6. Table direction

Use a table when exact values and row-level comparison are the story.

- Two to six columns and one to eight rows.
- Every row has the same number of cells as the column set.
- Column labels are short and parallel.
- Highlight at most two rows unless the highlighting encodes a real state.
- Keep one unit per numeric column and place it in the heading or column label.
- Do not shrink a spreadsheet onto a slide. Split it, aggregate it, or move the full data to an appendix.
- Use a note for definitions, caveats, or source context, not for another paragraph of narrative.

## 7. Code-snippet direction

Code is a teaching visual, not a repository dump.

- Show the smallest coherent fragment that supports the spoken explanation.
- Prefer 6-16 visible lines; split anything longer into sequential slides.
- Set the real language label.
- Highlight only the lines currently being discussed.
- Preserve indentation and meaningful names.
- Remove secrets, tokens, private data, machine paths, irrelevant imports, generated output, and unrelated error handling.
- Do not execute code inside Deckory.
- Use a caption to state why the fragment matters, not to narrate each token.

## 8. Typography and composition

- A display heading normally fits within two lines.
- Body copy remains within a readable measure and does not compete with the visual.
- Use hierarchy through scale, weight, alignment, and whitespace before adding containers.
- Cards require a real grouping or elevation reason.
- Avoid repeating the same split, grid, or centered composition on adjacent slides.
- Use asymmetric layouts deliberately, with clear visual balance and safe margins.
- Keep important content inside the 16:9 safe canvas at Studio, Preview, Present, Overview, and next-slide-preview scales.
- Use one icon family and a consistent stroke treatment.
- Avoid emoji unless the product brief explicitly requires a playful social-native language.

## 9. Motion and delivery

Motion explains sequence, continuity, comparison, or emphasis.

- Use reveal `sequence` to match the spoken order.
- Use morph IDs only for genuine shared elements.
- Keep transitions within the schema performance budget.
- Do not animate every component independently.
- Never make meaning depend only on motion.
- Reduced motion must preserve all content and state.
- Thumbnail and overview rendering must disable motion.

Speaker notes should contain the transition into the slide, the one point to say, evidence caveats, and the transition out. Audience mode must never render notes.

## 10. Brandkit usage

Invoke the repo-local `brandkit` skill only when:

- a new product deck has no coherent visual identity;
- the user requests a brand kit, identity board, visual world, or logo direction;
- conflicting product assets need a reference direction before slide production.

Do not invoke it for every slide. Establish the visual world once, extract usable rules, then compose slides with semantic Deckory components.

Do not copy generated logos or claims into production without review. Do not use brand-kit imagery as a substitute for real product screenshots, data, or evidence.

## 11. Required workflow

1. Read `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, the target deck, schema, renderer, and one representative slide.
2. Produce the design read and dials.
3. Inventory the story: slide purpose, evidence, component, layout, transition, and speaker-note intent.
4. Identify missing component coverage before authoring content.
5. Build or edit the smallest complete vertical slice using typed components.
6. Run schema validation and focused tests.
7. Open Studio and Preview in a real browser.
8. Capture representative screenshots at full slide and thumbnail scale.
9. Inspect heading wraps, overflow, visual balance, contrast, chart/table/code readability, evidence labels, notes, focus, reduced motion, and console errors.
10. Correct defects and repeat the screenshot loop until the deck is presentation-ready.
11. Run `pnpm test`, `pnpm typecheck`, and `pnpm build`.
12. Inspect the final diff and report only checks actually run.

## 12. Slide pre-flight gate

A slide fails pre-flight when any answer is no:

- Does it communicate one primary decision, insight, or teaching point?
- Does the heading state that conclusion?
- Is the chosen component the fastest truthful explanation?
- Is all visible text readable without zoom?
- Does it fit the 16:9 canvas without clipping or crowding?
- Are chart units, table columns, and code language explicit?
- Is sourced or illustrative evidence labelled?
- Is color used consistently and accessibly?
- Does the slide remain meaningful with reduced motion?
- Does it have concise speaker notes when meaningful?
- Has it been visually inspected in Preview or Present?

## 13. Deck pre-flight gate

A deck fails pre-flight when:

- consecutive slides repeat the same composition without narrative reason;
- the opening does not establish stakes and the closing does not resolve them;
- visual density remains flat across the entire story;
- decorative visuals outnumber explanatory visuals;
- data or technical claims lack evidence status;
- motion competes with the speaker;
- any slide is a placeholder, scaffold, or incomplete example;
- Studio, Preview, Present, or thumbnails render different meanings from the same document.

Use `full-output-enforcement` when the requested deck, component set, or implementation must be exhaustive. Deckory constraints override any conflicting upstream instruction.