<div align="center">
  <img src="docs/assets/deckory-mark.svg" width="88" alt="Deckory logo" />
  <h1>Deckory</h1>
  <p><strong>Presentations, engineered.</strong></p>
  <p>A code-native presentation system for structured, validated and visually expressive decks.</p>

  <p>
    <a href="https://github.com/KanzuXHorizon/Deckory/actions/workflows/ci.yml"><img alt="CI status" src="https://github.com/KanzuXHorizon/Deckory/actions/workflows/ci.yml/badge.svg" /></a>
    <a href="https://github.com/KanzuXHorizon/Deckory/actions/workflows/codeql.yml"><img alt="CodeQL status" src="https://github.com/KanzuXHorizon/Deckory/actions/workflows/codeql.yml/badge.svg" /></a>
    <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-5B52EE.svg" /></a>
    <img alt="Node.js 24" src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white" />
    <img alt="pnpm 11.7" src="https://img.shields.io/badge/pnpm-11.7-F69220?logo=pnpm&logoColor=white" />
    <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-15171A?logo=next.js&logoColor=white" />
    <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  </p>

  <p>
    <a href="#quick-start">Quick start</a> ·
    <a href="#how-it-works">How it works</a> ·
    <a href="#create-a-deck">Create a deck</a> ·
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>
</div>

<img src="docs/assets/deckory-hero.svg" alt="Deckory turns typed documents into semantic visuals and a presentation-ready experience" />

## Why Deckory

Traditional presentation tools treat every slide as an isolated canvas. Deckory treats a presentation as a **typed document system**: content is structured, validated and rendered through semantic components, allowing the same source to power editing, previewing and presenting.

- **Structured by design** — decks use a typed AST instead of arbitrary page-level JSX.
- **Semantic visuals** — charts, tables, comparisons, processes, architecture diagrams and code blocks communicate intent.
- **Presentation-ready** — keyboard navigation, reveal sequences, overview mode and private speaker notes are built in.
- **Safer iteration** — validation catches malformed documents before they reach the audience.
- **Agent-friendly** — repository skills define standards for narrative, visual quality, accessibility and completeness.

## Product surfaces

| Surface | Purpose |
| --- | --- |
| **Hub** | Browse available decks and open the right working surface. |
| **Studio** | Edit the shared typed document with live validation. |
| **Preview** | Review the audience-facing result before delivery. |
| **Presenter** | Present multi-slide V1/V2 decks with keyboard controls, overview, fullscreen and private speaker notes. |
| **Export** | Produce capability-aware HTML, SVG, PNG, JPG, PDF and PPTX artifacts without remote runtime assets. |

## How it works

```text
Typed DeckDocument V1 / Scene V2
               │
               ▼
 Schema + evidence validation ──► actionable diagnostics
               │
               ▼
 Shared semantic scene renderer
               │
               ├──► Studio
               ├──► Preview
               ├──► Presenter
               └──► Export capability pipeline
```

A deck is authored once and consumed by multiple product surfaces. Layouts describe composition; semantic components describe meaning; the renderer owns visual consistency and presentation behavior.

## Quick start

### Requirements

- Node.js 24 or newer
- Corepack
- pnpm 11.7.0

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Deckory application locally. |
| `pnpm lint` | Run repository lint checks. |
| `pnpm typecheck` | Validate TypeScript contracts. |
| `pnpm test` | Run workspace test suites. |
| `pnpm audit:decks -- --strict` | Audit every registered deck and fail on warnings or errors. |
| `pnpm assets:check` | Verify local asset files, media types and manifest references. |
| `pnpm css:check` | Verify one global CSS entry, no orphan app stylesheet and no deck-ID visual overrides. |
| `pnpm performance:check` | Verify production route bundle budgets and first-load denylist after `pnpm build`. |
| `pnpm export:deck -- --deck=<id> --format=pdf` | Export a registered deck through the production browser renderer. |
| `pnpm test:e2e` | Build an isolated production artifact and run Chromium presentation flows. |
| `pnpm build` | Create the production Next.js build. |
| `pnpm quality:gate` | Run the complete local release gate, including build, bundle budgets and E2E. |

The same quality gates run on every push and pull request through GitHub Actions.

## Create a deck

Decks live under `decks/<name>/` and are defined with `defineDeck`.

```ts
import { defineDeck } from "@deckory/schema";

export const productStory = defineDeck({
  id: "product-story",
  version: 1,
  title: "Product story",
  locale: "en-US",
  themeId: "deckory-editorial",
  slides: [
    {
      id: "cover",
      layout: "cover",
      notes: "Introduce the problem before the product.",
      components: [
        {
          id: "heading",
          type: "heading",
          props: {
            eyebrow: "PRODUCT / 2026",
            title: "Turn complex information into",
            emphasis: "a clear decision."
          }
        }
      ]
    }
  ]
});
```

Deckory conventions:

- use stable, kebab-case deck, slide and component IDs;
- select a named layout such as `cover`, `split`, `dashboard`, `comparison`, `process`, `architecture` or `data`;
- prefer semantic components over arbitrary positioning;
- add concise speaker notes to meaningful slides;
- label illustrative data clearly and cite real evidence;
- validate, test and inspect representative slides before presenting.

See [`AGENTS.md`](AGENTS.md) for the complete repository rules, [`docs/AUDIT.md`](docs/AUDIT.md) for quality diagnostics, [`docs/ASSETS.md`](docs/ASSETS.md) for local asset manifests, [`docs/EXPORT.md`](docs/EXPORT.md) for the export contract, [`docs/V2-RELEASE-CHECKLIST.md`](docs/V2-RELEASE-CHECKLIST.md) for the release gate, [`docs/SNAPSHOTS.md`](docs/SNAPSHOTS.md) for local Studio checkpoints and [`decks/deckory-story-v2/deck.ts`](decks/deckory-story-v2/deck.ts) for the V2 reference deck.

## Architecture

```text
apps/present       Hub, Studio, Preview and Presenter
packages/schema    Typed deck contract and validation
packages/core      Presentation runtime and navigation behavior
packages/audit     Deterministic deck quality diagnostics and reports
packages/templates Reusable styles, slide recipes and deck blueprints
decks              Versioned deck packages and reference content
.agents/skills     Deckory-specific design and completion guidance
```

The monorepo uses pnpm workspaces. Presentation content remains independent from product surfaces, while shared schemas and runtime behavior live in focused packages.

## Design system for agents

Deck and slide work starts with [`.agents/skills/deckory-slide-director/SKILL.md`](.agents/skills/deckory-slide-director/SKILL.md). It defines standards for narrative, composition, charts, tables, code, evidence, motion, accessibility and screenshot-based review.

Supporting skills include:

- **Brandkit** — establishes a coherent identity direction when one does not exist.
- **GPT Taste** — increases visual range when a deck feels repetitive or generic.
- **Full Output Enforcement** — prevents placeholder slides and incomplete delivery claims.

The source and adaptation policy is recorded in [`.agents/taste-skill.lock.json`](.agents/taste-skill.lock.json).

## Project status

Deckory is an actively developed early-stage project. The current repository includes:

- typed V1 documents plus the coordinate-based `DeckDocumentV2` scene model;
- Hub, Scene V2 Studio, multi-slide Preview and Presenter surfaces using the shared renderer;
- one canonical native Scene V2 MyInterview defense deck with 23 slides and local assets, plus three migrated V2 reference decks;
- native editorial charts plus lazy-loaded ECharts SVG for reviewed advanced chart variants;
- semantic tables, code, metrics, comparisons, processes, diagrams, evidence lineage and accessible summaries;
- keyboard navigation, overview, fullscreen and private presenter notes with audience-mode privacy;
- local draft persistence, command history and named version snapshots with protected restore;
- deterministic 20-dimension V2 audit with structural and runtime-evidence confidence;
- isolated Chromium E2E coverage for production CSS, focus, privacy, reduced motion, performance and narrow viewports;
- capability-aware standalone HTML/SVG, browser PNG/JPG/PDF and native-editable PPTX primitive export;
- route bundle budgets that keep heavy ECharts and editor runtimes out of Presenter first-load;
- automated lint, typecheck, test, deck audit, asset check, build, bundle and CodeQL workflows.

The following remain outside the current product boundary:

- real-time collaboration;
- cloud persistence and user accounts;
- automatic ELK worker layout for `elk-layered` and `elk-force` diagrams;
- fully editable PPTX conversion for charts, diagrams, Web Blocks and arbitrary custom components. PPTX currently keeps supported primitives editable and discloses fallback or unsupported elements.

The README intentionally distinguishes implemented behavior from future product direction.

## Community and support

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.
- Follow [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) in all project spaces.
- Use [`SUPPORT.md`](SUPPORT.md) for setup and issue-reporting guidance.
- Report vulnerabilities privately as described in [`SECURITY.md`](SECURITY.md).

## License

Deckory is available under the [MIT License](LICENSE).
