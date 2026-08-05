# Deckory

Deckory is a code-native presentation system. Its first vertical slice is **Engine + Present**: a typed deck AST, validated content, a browser presenter, keyboard navigation, speaker notes, sequence reveals, and a Vietnamese reference deck.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Use Arrow keys, Page Up/Down, Home/End, or the controls. The grid opens the overview and the note icon toggles private presenter notes.

## Current boundary

The engine and browser presentation are implemented first. Visual editing, Hub, collaboration, and PDF/PNG/PPTX export are intentionally deferred so they can later consume the same validated AST.
