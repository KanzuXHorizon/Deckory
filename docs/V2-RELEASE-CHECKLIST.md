# Deckory V2 Release Checklist

Deckory V2 is publishable only from a clean revision that passes the complete local gate and the repository CI workflows. This checklist records verified behavior and explicit non-goals; it is not a roadmap claim.

## Verified product contract

- Hub exposes the four migrated V2 reference decks while retaining V1 sources.
- MyInterview V2 preserves 23 intended slides, five team members and local FPT/MyInterview assets.
- Studio V2 edits the shared scene document through command history with undo/redo and export capability disclosure.
- Preview and Presenter render every slide from the same `DeckDocumentV2` source.
- Presenter supports keyboard navigation, overview, fullscreen and presenter-only notes.
- Audience mode does not render speaker notes or presenter chrome.
- Native editorial charts stay in the core renderer.
- Reviewed advanced chart variants use lazy-loaded ECharts SVG and retain accessible summaries.
- HTML/SVG static export embeds local assets and rejects remote runtime dependencies.
- PNG/JPG/PDF browser export uses the shared final-state renderer.
- PPTX keeps supported text, shape, line, connector, image and group primitives editable.
- Every export target reports `native`, `native-editable`, `fallback` or `unsupported` before artifact creation.
- Route bundle budgets keep heavy ECharts and editor/compiler signatures outside Hub, Preview and Presenter first-load.

## Explicit non-goals and limitations

- No real-time collaboration, cloud persistence or user accounts.
- No claim that the application is a service-worker-backed offline PWA. Runtime and export dependencies are local, but a local server is still required for browser surfaces.
- `elk-layered` and `elk-force` require a future reviewed worker adapter; production decks must use generated or deterministic native layouts today.
- PPTX does not claim fully editable chart, diagram, Web Block or arbitrary custom-component conversion.
- Browser image-based PPTX remains a compatibility path for legacy decks and must not be described as editable.
- Runtime/manual quality dimensions remain evidence-gated and may not be promoted from review to production-ready by structural tests alone.

## Required release gate

Run from the repository root on the exact revision being published:

```bash
pnpm install --frozen-lockfile
pnpm quality:gate
```

`pnpm quality:gate` includes:

1. `git diff --check`;
2. workspace typecheck and lint;
3. workspace and script tests;
4. strict V1/V2 deck audit;
5. local asset verification;
6. production Next.js build;
7. route bundle budget and denylist verification;
8. complete Chromium E2E suite.

A release must stop on the first non-zero command. Previous green runs from another revision are not evidence.

## Required browser evidence

The final E2E run must cover and retain screenshots for:

- Hub and V2 migration cards;
- Studio V2 canvas, Layers, Inspector, quality and export capability panels;
- Preview and Presenter multi-slide navigation;
- Presenter overview and notes privacy;
- MyInterview V2 representative slides;
- advanced ECharts lazy-load proof;
- Export capability report and 16:9 output;
- mobile/narrow viewport, 200% zoom and reduced-motion checks from the existing suites.

Generated screenshots live under `output/playwright/screenshots/<run-id>/` and are intentionally excluded from source commits.

## Publication procedure

1. Record `git rev-parse HEAD`, `git status --short` and `git diff --check`.
2. Run the complete release gate on that revision.
3. Inspect the final tracked diff for secrets, remote assets, generated build output and unrelated changes.
4. Commit logical batches with descriptive messages.
5. Re-run the full gate after the final documentation commit.
6. Fetch the remote and verify the branch is not behind.
7. Push without force.
8. Confirm the remote branch points to the expected commit and let GitHub Actions complete.

Do not tag or describe a release as production-ready when runtime evidence is missing or CI is red.
