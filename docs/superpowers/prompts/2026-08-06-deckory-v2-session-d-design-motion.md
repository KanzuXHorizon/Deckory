# Parallel Session D Prompt — Visual Worlds, Typography, Styling and Motion Core

```text
@Deckory

You are the Deckory V2 Design System and Motion core implementation session.

Mission

Build the independent visual foundation for professional V2 decks: coherent visual-world tokens, deterministic layered backgrounds, rich-text normalization and safe auto-fit, professional shape/image styling and a typed motion timeline compiler with complete reduced-motion and final-state behavior.

This session runs in parallel with Studio Layout, Component SDK and Visual Intelligence. Work only in your owned core files and return explicit integration requests for shared schema, renderer barrels and Studio UI.

Required reading

1. Read root AGENTS.md, PRODUCT.md and DESIGN.md.
2. Read:
   - docs/superpowers/specs/2026-08-06-deckory-v2-program-design.md
   - docs/superpowers/plans/2026-08-06-deckory-v2-05-design-motion.md
   - docs/superpowers/plans/2026-08-06-deckory-v2-parallel-execution.md
3. Read nested instructions for packages/scene and packages/renderer before editing owned files.
4. Use Superpowers: using-git-worktrees, test-driven-development, systematic-debugging when needed, and verification-before-completion.

Start gate

Plan 01 Scene Foundation must already be accepted. Resolve the exact accepted integration commit from the coordinator context. If the V2 scene and shared renderer boundaries are not proven, stop and report the missing gate rather than creating alternative contracts.

Workspace safety

- Create and use a dedicated managed worktree from the accepted Scene Foundation commit.
- Record full HEAD, branch, status, worktrees and baseline tests.
- Do not copy or modify the user's dirty checkout.
- Never reset, clean, overwrite, stage or commit unrelated paths.
- Do not push, merge or publish.

Exclusive production ownership

You may create or modify only:

- packages/themes/**
- packages/scene/src/rich-text.ts and matching tests
- packages/scene/src/text-fit.ts and matching tests
- packages/scene/src/motion.ts and matching tests
- new focused renderer files named:
  - packages/renderer/src/background-renderer*
  - packages/renderer/src/rich-text-renderer*
  - packages/renderer/src/shape-renderer*
  - packages/renderer/src/image-renderer*
  - packages/renderer/src/motion-compiler*
- matching focused tests
- docs/superpowers/parallel/manifests/design-motion.md
- docs/superpowers/parallel/requests/design-motion-*.md

Forbidden parallel edits

Do not modify:

- packages/schema/**
- packages/sdk/**
- packages/visuals/**
- apps/present/**
- packages/audit/**
- packages/templates/**
- pnpm-lock.yaml
- root package.json
- packages/scene/src/index.ts
- packages/renderer/src/index.ts
- existing shared renderer roots
- route entrypoints
- any file owned by another parallel session

If a schema field, theme export, package dependency, renderer integration or Studio panel is required, create an exact contract or dependency request instead of modifying the shared file.

Implementation scope

Implement the independently testable core from Plan 05:

1. Visual-world package:
   - strict token types for semantic colors, typography, spacing, radii, depth, charts, diagrams, imagery, backgrounds, density, safe areas and motion;
   - twelve required visual worlds:
     Deckory Editorial Control Room, Swiss Precision, Scientific Illustration, Technical Blueprint, Data Journalism, Minimal Luxury, Cinematic Dark, Academic Defense, Product Showcase, Geometric Modernism, Organic Systems and Risograph Editorial;
   - deterministic deck → slide → element token resolution;
   - unknown-token and contrast diagnostics.
2. Background rendering core:
   - solid;
   - linear, radial and conic gradients;
   - mesh-gradient contract and deterministic SVG output;
   - image and SVG layers;
   - pattern and grid;
   - seeded local grain/noise;
   - glow, vignette, overlay, blur and edge mask;
   - stable layer ordering and missing-asset diagnostics.
3. Rich text:
   - semantic paragraphs and runs, not arbitrary HTML;
   - normalized marks and lists;
   - Vietnamese diacritic and punctuation safety;
   - reading order and plain-text extraction.
4. Text fit:
   - local measurement contract;
   - preferred and minimum font sizes;
   - maximum lines;
   - cache keys based on font, size, width and text hash;
   - explicit text-does-not-fit diagnostics;
   - never shrink below the declared minimum.
5. Shape and image rendering:
   - fills and gradients;
   - strokes and dash patterns;
   - independent corner radii;
   - bounded shadow, glow and blur;
   - clip and mask contracts;
   - opacity and reviewed blend modes;
   - image fit, crop, focal point, duotone and overlay;
   - local assets only.
6. Motion domain and compiler:
   - entrance, emphasis, exit, path, stagger, morph, chart progress, connector progress and camera cues;
   - on-enter, on-click, after-previous and with-previous triggers;
   - deterministic cue ordering;
   - mandatory final state for every animated property;
   - reduced, thumbnail and export modes resolve to complete final content;
   - no arbitrary Motion object stored in the document.
7. Semantic motion preset data only:
   - reveal argument;
   - compare states;
   - trace process;
   - spotlight evidence;
   - overview to detail;
   - problem to solution morph;
   - chart and conclusion;
   - architecture walkthrough.

Parallel-track limitations

- Do not build Studio Background Composer, typography toolbar, style panels or motion timeline UI.
- Do not wire owned renderer files into shared renderer roots.
- Do not modify schema or lockfile.
- Do not create the gallery deck or audit rules in this track.
- Keep visual-world tokens separate from specific deck content.

Engineering method

- Strict red-green-refactor.
- Test exact final-state equivalence for reduced motion, thumbnail and export.
- Use deterministic seeds and IDs for generated SVG/background output.
- Enforce explicit effect budgets; do not allow unlimited blur, glow or shadow values.
- Preserve professional restraint: visual worlds are coherent systems, not theme-per-slide novelty.
- Keep Vietnamese typography and local font behavior first-class.
- Return actionable diagnostics instead of silent fallback.

Required verification

Run at minimum:

- all packages/themes tests and typecheck;
- focused packages/scene tests for rich text, text fit and motion;
- focused owned packages/renderer tests;
- deterministic output tests across repeated runs;
- static checks that no remote asset URL or unbounded effect value enters the output.

Do not claim Studio, Presenter, export or complete visual QA; shared wiring and browser review are integration work.

Deliverables

1. Small logical commits limited to owned paths.
2. Fresh RED/GREEN evidence.
3. docs/superpowers/parallel/manifests/design-motion.md containing:
   - exact base commit, branch and commits;
   - public types and signatures;
   - changed files;
   - test results;
   - exact schema, dependency, barrel, renderer and Studio requests;
   - remaining browser, accessibility and export QA.
4. Return exact commit SHAs and concise integration instructions. Do not merge or push.
```
