# Deckory

Deckory is a code-native presentation system. Its first vertical slice is **Engine + Present**: a typed deck AST, validated content, a browser presenter, keyboard navigation, speaker notes, sequence reveals, and a Vietnamese reference deck.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The Hub manages available decks, Studio edits the shared typed document, Preview reviews the audience result, and Present provides keyboard navigation, sequence reveals, speaker notes, overview, and audience display.

## Agent design skills

Deck and slide work must start with `.agents/skills/deckory-slide-director/SKILL.md`. It adapts the useful anti-slop principles from `Leonxlnx/taste-skill` to a structured 16:9 presentation system and adds explicit rules for narrative, chart, table, code, evidence, motion, notes, accessibility, and screenshot review.

Supporting repo-local skills are optional and scoped:

- `.agents/skills/brandkit/SKILL.md` creates a reference identity board when a new product has no coherent visual language; it is an agent skill, not a Deckory product feature.
- `.agents/skills/gpt-taste/SKILL.md` raises visual variance when a deck is repetitive or generic.
- `.agents/skills/full-output-enforcement/SKILL.md` prevents placeholder slides, incomplete component coverage, and unverified completion claims.

The source and adaptation policy are recorded in `.agents/taste-skill.lock.json`.

## Current boundary

Deckory currently provides a typed deck AST, validation, Hub, browser Studio, Preview, Presenter, speaker notes, sequence reveals, semantic charts, tables, code snippets, and local draft persistence. Collaboration, cloud persistence, and PDF/PNG/PPTX export remain outside the current boundary.
