# Parallel Session B Prompt — Scene JSX, Component SDK and Web Block Core

```text
@Deckory

You are the Deckory V2 Component SDK and Custom Code core implementation session.

Mission

Build the independent code-authoring foundation for Deckory V2: Scene JSX that compiles to native scene nodes, a trusted versioned React component registry, Inspector metadata contracts, Web Block manifests, a versioned bridge and a deny-by-default sandbox policy generator.

This session runs in parallel with Studio Layout, Visual Intelligence and Design/Motion. Keep your scope isolated so the integration coordinator can cherry-pick it safely.

Required reading

1. Read root AGENTS.md, PRODUCT.md and DESIGN.md.
2. Read:
   - docs/superpowers/specs/2026-08-06-deckory-v2-program-design.md
   - docs/superpowers/plans/2026-08-06-deckory-v2-03-component-sdk.md
   - docs/superpowers/plans/2026-08-06-deckory-v2-parallel-execution.md
3. Read nested instructions for packages/sdk and packages/renderer before editing.
4. Use Superpowers: using-git-worktrees, test-driven-development, systematic-debugging when needed, and verification-before-completion.

Start gate

Plan 01 Scene Foundation must already be accepted. Resolve the exact accepted commit from the coordinator context. If the V2 schema and shared renderer boundary are not proven on that commit, stop and report the missing prerequisite instead of improvising a replacement architecture.

Workspace safety

- Create a dedicated managed worktree from the accepted Scene Foundation commit.
- Record the exact branch, full HEAD, git status, worktrees and baseline tests.
- Do not work in or copy dirty files from the user's main checkout.
- Do not reset, clean, stage or commit unrelated paths.
- Do not push, merge or publish.

Exclusive production ownership

You may create or modify only:

- packages/sdk/**
- new isolated renderer files whose names begin with:
  - packages/renderer/src/component-host
  - packages/renderer/src/web-block
- matching focused tests
- security fixtures local to packages/sdk or the owned renderer tests
- docs/superpowers/parallel/manifests/component-sdk.md
- docs/superpowers/parallel/requests/component-sdk-*.md

Forbidden parallel edits

Do not modify:

- packages/schema/**
- packages/scene/**
- packages/visuals/**
- packages/themes/**
- pnpm-lock.yaml
- root package.json
- package barrel files or shared renderer index files
- apps/present/**
- route entrypoints
- any file owned by another parallel session

If you need a schema field, dependency, package export, renderer registry injection or Studio UI integration, create an exact contract/dependency request. Do not edit the shared file.

Implementation scope

Implement the independently testable core of Plan 03:

1. Scene JSX runtime:
   - jsx, jsxs and Fragment;
   - approved capitalized scene primitives only;
   - immutable SceneNodeDescription output;
   - no arbitrary DOM output;
   - reject intrinsic HTML tags and executable inline handlers;
   - validate final scenes against the accepted V2 contract where possible.
2. Trusted component registry:
   - stable id and semantic version;
   - strict Zod props schema;
   - default frame;
   - InspectorSchema;
   - renderer contract;
   - accessible summary;
   - export capabilities;
   - optional prop migration;
   - duplicate registration and version-resolution rules.
3. Generated Inspector metadata domain only:
   - text, multiline, number, boolean, select, segmented, color token, asset, table, list and object-group field definitions;
   - validation and stable update paths;
   - no Studio React controls in this parallel track.
4. Web Block domain:
   - source and manifest contracts;
   - explicit payload budgets;
   - allowed import declarations;
   - mandatory accessible summary;
   - mandatory static SVG/PNG fallback;
   - versioned message protocol.
5. Sandbox policy generator:
   - iframe sandbox must never include allow-same-origin;
   - CSP default-src 'none';
   - connect-src 'none';
   - only local/data/blob resources required by the reviewed runtime;
   - validated and escaped srcdoc bootloader;
   - timeout and error/fallback state contracts;
   - parent-message validation.
6. Focused renderer host modules:
   - trusted component error boundary;
   - Web Block iframe lifecycle contract;
   - accessible summary outside the iframe;
   - no shared renderer wiring in this track.

Explicitly defer

- esbuild-wasm installation and app worker integration;
- Studio source editor;
- component library UI;
- generated Studio Inspector controls;
- shared renderer barrel exports;
- package-manifest and lockfile dependency wiring;
- Presenter and export integration.

Record these as precise integration instructions, not unfinished comments in production code.

Engineering method

- Strict red-green-refactor for every behavior.
- Test the real contract, not mocks of the registry or sandbox policy.
- Security tests must assert denied capabilities, not merely the presence of a sandbox attribute.
- Never weaken sandbox, CSP, import allowlist or payload budgets to make a fixture pass.
- Keep arbitrary code isolated from the parent document and Deckory state.
- Do not use eval or Function in trusted Deckory runtime code.
- Keep Scene JSX deterministic and serializable.

Required verification

Run at minimum:

- all packages/sdk tests;
- SDK typecheck;
- focused owned renderer tests;
- renderer typecheck when isolated files compile against the accepted base;
- static scans confirming no allow-same-origin, remote resolver or parent DOM access is introduced.

Do not claim browser security is fully proven; integration E2E remains coordinator-owned.

Deliverables

1. Small commits limited to owned paths.
2. Fresh RED/GREEN evidence.
3. docs/superpowers/parallel/manifests/component-sdk.md containing:
   - base commit, branch and commits;
   - exact public types and signatures;
   - changed files;
   - test outputs;
   - schema, dependency, barrel and app-integration requests;
   - security assumptions and remaining E2E scenarios.
4. Return exact commit SHAs and a concise integration summary. Do not merge or push.
```
