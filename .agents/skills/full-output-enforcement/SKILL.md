---
name: full-output-enforcement
description: Prevents incomplete Deckory decks and implementations. Use when the user requests exhaustive slide coverage, a complete component set, a full deck, or production-ready implementation without placeholders.
---

# Full Output Enforcement

Adapted from `Leonxlnx/taste-skill/skills/output-skill`.

Treat every requested deck and implementation as production-critical. A partial result is broken unless an external blocker is reported explicitly.

## Banned patterns

Never replace requested work with:

- placeholder slides;
- empty sections;
- `TODO` or `implement later` markers;
- omitted middle slides;
- one example followed by “repeat similarly”;
- fake data presented as real;
- components described but not implemented;
- tests claimed but not run;
- screenshots claimed but not captured;
- code comments standing in for executable implementation.

## Execution

1. Count the requested deliverables: decks, slides, components, states, tests, and evidence artifacts.
2. Implement every deliverable at full quality.
3. Validate each deck document and inspect the rendered result.
4. Re-read the request and compare the completed count with the requested count.
5. Report blockers, skipped checks, or residual risks precisely; never hide them behind a completion claim.

## Deckory completion check

Before finalizing, confirm:

- every requested slide exists and has a purpose;
- no slide is a scaffold or placeholder;
- every referenced component is supported by schema, renderer, Studio, and Inspector where editing is expected;
- charts, tables, and code snippets contain complete typed data;
- evidence status and speaker notes are present where required;
- tests, typecheck, build, and visual review results are reported accurately.

Source: https://github.com/Leonxlnx/taste-skill/tree/main/skills/output-skill
License: MIT, upstream copyright Leonxlnx and contributors.