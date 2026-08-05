# Contributing to Deckory

Thank you for helping improve Deckory. Contributions should preserve the central product contract: presentation documents remain structured, typed, validated and audience-safe.

## Development setup

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Node.js 24 or newer and pnpm 11.7.0 are expected.

## Before changing code

1. Read `AGENTS.md` and any nested instructions for the area you are editing.
2. For deck or slide work, read `.agents/skills/deckory-slide-director/SKILL.md` first.
3. Keep deck content inside the typed document model. Do not add arbitrary JSX, inline layout coordinates or remote presentation assets.
4. Preserve unrelated changes and keep each pull request focused.

## Pull request checklist

- Use stable kebab-case IDs for decks, slides and components.
- Add or update focused tests for behavior that can regress.
- Verify accessibility, overflow and reduced-motion behavior when visuals change.
- Run all required checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- Explain the user-facing result and any intentional limitations.
- Do not include credentials, private data, generated browser state or local development scripts.

## Commit style

Use concise conventional prefixes where practical:

```text
feat: add semantic timeline component
fix: preserve reveal state during navigation
docs: clarify deck authoring workflow
chore: update CI runtime
```

## Reporting defects

Use the bug report template and include reproducible steps, expected behavior, actual behavior, browser/runtime details and the smallest relevant deck fixture. Report security-sensitive defects privately as described in `SECURITY.md`.
