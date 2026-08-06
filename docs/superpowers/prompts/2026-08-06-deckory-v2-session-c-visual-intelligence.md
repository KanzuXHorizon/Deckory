# Parallel Session C Prompt — Visual Intelligence, Story, Evidence, Charts and Diagrams

```text
@Deckory

You are the Deckory V2 Visual Intelligence core implementation session.

Mission

Build the independent domain core that turns raw text and structured data into explainable professional visuals: visual-intent classification, recommendation, deck-level storytelling and copy audits, composition diversity, evidence/data lineage, typed chart specifications, typed diagram specifications and pure rendering/layout adapters.

This session runs in parallel with Studio Layout, Component SDK and Design/Motion. Keep the work inside the visual domain and return clean integration contracts rather than editing shared application surfaces.

Required reading

1. Read root AGENTS.md, PRODUCT.md and DESIGN.md.
2. Read:
   - docs/superpowers/specs/2026-08-06-deckory-v2-program-design.md
   - docs/superpowers/plans/2026-08-06-deckory-v2-04-visual-intelligence.md
   - docs/superpowers/plans/2026-08-06-deckory-v2-parallel-execution.md
3. Read nested instructions relevant to packages/visuals.
4. Use Superpowers: using-git-worktrees, test-driven-development, systematic-debugging when needed, and verification-before-completion.

Start gate

Plan 01 Scene Foundation must already be accepted on an exact integration commit. Resolve that commit from the coordinator context. If the accepted V2 scene contract is unavailable, stop and report the missing gate. Do not create a competing document model.

Workspace safety

- Create a dedicated managed worktree from the accepted Scene Foundation commit.
- Record branch, full HEAD, git status, worktrees and baseline tests.
- Never work in the user's dirty checkout.
- Never reset, clean, overwrite, stage or commit unrelated files.
- Do not push, merge or publish.

Exclusive production ownership

You may create or modify only:

- packages/visuals/**
- tests and fixtures located inside packages/visuals
- docs/superpowers/parallel/manifests/visual-intelligence.md
- docs/superpowers/parallel/requests/visual-intelligence-*.md

Forbidden parallel edits

Do not modify:

- packages/schema/**
- packages/scene/**
- packages/sdk/**
- packages/themes/**
- packages/renderer/**
- apps/present/**
- packages/audit/**
- packages/templates/**
- pnpm-lock.yaml
- root package.json
- shared barrel files outside packages/visuals
- files owned by another session

When the visual domain requires schema, data-source, renderer, dependency, Studio, audit or template integration, create an exact contract or dependency request instead of editing the shared path.

Implementation scope

Implement the independently testable core from Plan 04:

1. Visual intent and recommendation:
   - relationship taxonomy;
   - extracted claims, steps, sides, entities and numeric claims;
   - deterministic candidate ranking;
   - reasons, required inputs, evidence requirements, alternatives and warnings;
   - never recommend numeric charts without numeric evidence.
2. Deck-level storytelling:
   - DeckNarrative domain;
   - audience, desired decision, thesis and section roles;
   - slide purpose and conclusion;
   - diagnostics for weak thesis, solution-before-evidence, evidence-without-interpretation, abrupt transitions, duplicate slides, weak closing and appendix leakage.
3. Copy intelligence:
   - shorten;
   - conclusion-heading rewrite;
   - simplify professional Vietnamese;
   - parallelize lists;
   - split dense copy;
   - remove technical filler;
   - speaker-note draft from existing claims only;
   - claim-preservation report and refusal when evidence is missing.
4. Composition diversity:
   - fingerprint based on occupied regions, scale hierarchy, dominant visual family, layout mode and relationship;
   - repeated sequence diagnostics;
   - do not reduce visually distinct freeform slides to the same fingerprint.
5. Evidence and data lineage domain:
   - local/manual source metadata;
   - claim and evidence records;
   - dataset and transformation types;
   - select, filter, sort, derive, group-aggregate and pivot operations;
   - source-dependent tracing;
   - illustrative/stale/verified/unverified states;
   - no remote fetch behavior.
6. Chart domain:
   - strict Deckory ChartSpec;
   - question, summary, unit, format, evidence, labels, highlights, annotations, references and missing-value policy;
   - pure editorial chart geometry/format functions for common charts;
   - adapter contracts for advanced charts.
7. Diagram domain:
   - strict DiagramSpec;
   - measured nodes, typed ports and edges;
   - deterministic tree, radial, timeline, matrix and cycle layout algorithms;
   - adapter contract for layered/graph layout;
   - collision and does-not-fit diagnostics;
   - manual-override model separate from generated layout.
8. Catalog metadata:
   - stable IDs;
   - intent coverage;
   - use/avoid guidance;
   - input requirements;
   - density bounds;
   - accessibility strategy;
   - export capability declarations;
   - fixture coverage inventory.

Parallel-track limitations

- Do not install ECharts or ELK by changing the lockfile. Record exact versions and module needs in the manifest.
- Pure adapter tests may target an internal interface or local fixture abstraction. The coordinator will install dependencies and wire real adapters after review.
- Do not implement Studio panels, visual assistant UI, chart editor UI, Story panel, Source Manager, audit integration, templates or the public gallery deck in this track.
- Do not weaken types to unknown records merely because shared schema integration is deferred.

Engineering method

- Strict red-green-refactor.
- Use deterministic fixtures in Vietnamese and English.
- Keep factual extraction separate from visual recommendation.
- Make every refusal and diagnostic actionable.
- Avoid opaque scoring; recommendation ranking must expose reasons.
- Do not implement one generic CardGrid as the semantic component system.
- Do not encode ECharts options or ELK payloads in public Deckory contracts.
- Ensure every transformation retains data lineage.

Required verification

Run at minimum:

- all packages/visuals tests;
- packages/visuals typecheck;
- coverage/inventory tests for every public visual-domain entry created in this track;
- deterministic repeat-run tests for recommendation and layout output.

Do not claim Studio, renderer, export or browser completion; those are integration responsibilities.

Deliverables

1. Small logical commits limited to packages/visuals and the manifest/request docs.
2. Fresh RED/GREEN evidence.
3. docs/superpowers/parallel/manifests/visual-intelligence.md containing:
   - exact base, branch and commits;
   - public interfaces;
   - changed files;
   - tests and results;
   - exact schema/data-source/dependency/renderer/Studio/audit/template requests;
   - component and chart/diagram coverage inventory;
   - unresolved visual-browser QA.
4. Return exact commit SHAs and concise integration instructions. Do not merge or push.
```
