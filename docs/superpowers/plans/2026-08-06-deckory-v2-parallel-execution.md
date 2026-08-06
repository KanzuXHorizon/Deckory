# Deckory V2 Parallel Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:using-git-worktrees before implementation, then use superpowers:executing-plans or superpowers:subagent-driven-development inside each isolated track. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run four Deckory V2 implementation sessions concurrently after the Scene Foundation is accepted, while preventing shared-file conflicts, contract drift, invalid evidence and accidental modification of the user's dirty checkout.

**Architecture:** The accepted Plan 01 commit becomes a frozen shared base. Four worktrees own disjoint core domains: Studio Layout, Component SDK, Visual Intelligence and Design/Motion. Shared schema, barrel exports, application routers, package-root scripts and integration surfaces are controlled by a later integration gate rather than edited concurrently.

**Tech Stack:** Git worktrees, TypeScript 5.9, pnpm workspaces, Vitest, Playwright, Superpowers planning/TDD/review workflows, Deckory connector.

## Global Constraints

- Start only after `docs/superpowers/plans/2026-08-06-deckory-v2-01-scene-foundation.md` is accepted on one exact integration commit.
- All four sessions must branch from that same accepted commit, not from the current dirty checkout and not from independently guessed revisions.
- Every session uses a distinct managed worktree and branch.
- Never reset, clean, checkout, delete, stage, commit or overwrite another session's files.
- Do not edit frozen shared-contract files in parallel: `packages/schema/**`, root `package.json`, `pnpm-lock.yaml`, shared barrel files, route entrypoints and `apps/present/components/studio-v2/studio-v2.tsx`.
- When a track requires a frozen-contract change, create a contract request under `docs/superpowers/parallel/requests/` and continue only with work that does not depend on the unresolved change.
- Do not add dependencies through the lockfile in a parallel track. Record dependency requests in the track integration manifest.
- A passing track test suite is not integration evidence. The coordinator must cherry-pick, resolve contract requests and run the complete combined suite.
- Do not push, merge, publish or tag from a track without explicit authorization.

---

## 1. Parallel start gate

- [ ] **Record the accepted Scene Foundation base**

The coordinator records:

```text
SCENE_FOUNDATION_COMMIT=<full git SHA>
INTEGRATION_BRANCH=<branch name>
BASELINE_TEST_COMMANDS=<commands and results>
KNOWN_PREEXISTING_FAILURES=<exact failures or none>
```

- [ ] **Verify the base contract**

Required before dispatch:

```bash
pnpm --filter @deckory/schema test
pnpm --filter @deckory/scene test
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/present test -- components/slide-frame.test.tsx components/deck-thumbnail.test.tsx
pnpm typecheck
```

Expected: all commands exit 0, or the coordinator records and explicitly accepts exact pre-existing failures.

- [ ] **Create four isolated worktrees from the same commit**

Recommended branch names:

```text
feat/v2-studio-layout
feat/v2-component-sdk-core
feat/v2-visual-intelligence-core
feat/v2-design-motion-core
```

- [ ] **Copy no dirty working-tree changes into the tracks**

Only accepted commits are shared. Uncommitted files from the original checkout are not an execution base.

---

## 2. Ownership matrix

| Track | Exclusive production ownership | Allowed tests/docs | Forbidden parallel edits |
|---|---|---|---|
| A — Studio Layout | `packages/scene/src/layout/**`, `packages/scene/src/guides.ts`, `packages/scene/src/alignment.ts`, `packages/scene/src/hierarchy.ts`, focused files under `apps/present/components/studio-v2/canvas/**`, `layers/**`, `layout/**` | Matching tests and a track manifest | `packages/schema/**`, `packages/sdk/**`, `packages/visuals/**`, `packages/themes/**`, shared barrels, route files, root manifests |
| B — Component SDK Core | `packages/sdk/**`, new isolated renderer files named `component-host*` and `web-block*` | SDK/renderer focused tests, security fixtures, track manifest | Studio root, schema, visuals, themes, shared renderer barrels/manifests, lockfile |
| C — Visual Intelligence Core | `packages/visuals/**` including narrative, evidence-domain logic, charts and diagrams | Package tests, local fixtures inside `packages/visuals`, track manifest | Studio root, schema, scene core, themes, renderer shared files, lockfile |
| D — Design and Motion Core | `packages/themes/**`, new focused files `packages/scene/src/rich-text*`, `text-fit*`, `motion*`, and renderer files `background-renderer*`, `rich-text-renderer*`, `shape-renderer*`, `image-renderer*`, `motion-compiler*` | Matching package tests and track manifest | Schema, Studio root, SDK, visuals, shared barrels/manifests, lockfile |

Ownership is path-based, not intent-based. A track may not edit a forbidden file merely because the change appears small.

## 3. Frozen contract protocol

### 3.1 Contract requests

Create one file per request:

```text
docs/superpowers/parallel/requests/<track>-<short-name>.md
```

Each request contains:

```markdown
# Contract Change Request

- Track:
- Base commit:
- Blocking capability:
- Existing contract:
- Proposed exact type/signature:
- Files the coordinator would change:
- Failing test that motivates the change:
- Compatibility impact:
- Can the track continue without it: yes/no
```

### 3.2 Dependency requests

Tracks do not modify `pnpm-lock.yaml`. Record exact package, version floor, reason, import surface and bundle impact in the integration manifest. The coordinator installs accepted dependencies once after reviewing all tracks.

### 3.3 Shared barrel exports

Tracks may create focused source files and import them directly in focused tests. They do not modify shared `index.ts` barrels during parallel work. The coordinator wires exports after cherry-picking.

## 4. Track deliverables

Every track returns:

1. exact base commit and branch;
2. clean `git status --short` except owned changes;
3. small logical commits;
4. focused RED/GREEN evidence;
5. test and typecheck output;
6. list of owned files changed;
7. dependency requests;
8. contract requests;
9. integration instructions;
10. unresolved risks and manual visual review needs.

Create the report at:

```text
docs/superpowers/parallel/manifests/<track>.md
```

The report is part of the track commit and contains no unverified completion claim.

## 5. Parallel track checkpoints

### Track A — Studio Layout

- [ ] Implement pure constraints, sizing, stack/grid auto layout, hierarchy and geometry tests.
- [ ] Implement focused selection/manipulation adapters and components only inside owned Studio subdirectories.
- [ ] Do not wire the Studio root or package manifests.
- [ ] Return integration instructions for root wiring, dependencies and E2E.

### Track B — Component SDK Core

- [ ] Implement Scene JSX runtime and trusted component registry.
- [ ] Implement Web Block manifest, bridge, sandbox-policy generator and focused security tests.
- [ ] Keep app compiler/source editor integration out of the parallel track.
- [ ] Return exact dependency and renderer-wiring requests.

### Track C — Visual Intelligence Core

- [ ] Implement visual intent, recommendation, narrative audit, composition fingerprints and constrained copy transforms.
- [ ] Implement typed chart/diagram domains and pure adapters that do not require Studio wiring.
- [ ] Implement evidence/data lineage domain logic locally; request schema integration separately.
- [ ] Return dependency requests for ECharts/ELK and fixture coverage inventory.

### Track D — Design and Motion Core

- [ ] Implement visual-world token package and resolution.
- [ ] Implement background, rich-text, text-fit, shape/image and motion core modules in owned files.
- [ ] Keep Studio composers/timeline and shared renderer wiring out of the parallel track.
- [ ] Return exact theme/schema/export integration requests.

## 6. Integration sequence

The coordinator integrates in this order:

1. Track A pure scene layout commits.
2. Track B SDK contracts and isolated renderer files.
3. Track C visual-domain commits.
4. Track D theme/text/motion commits.
5. Accepted dependency requests and one lockfile update.
6. Accepted schema contract requests in one reviewed schema batch.
7. Shared barrel exports and package dependencies.
8. Renderer integration.
9. Studio root integration in separate reviewed batches: Canvas → SDK → Visuals → Design/Motion.
10. Plan-specific browser tests and the combined full quality gate.

The integration order does not imply one track's code quality is preferred. It minimizes contract and renderer conflicts.

## 7. Integration verification

- [ ] **Inspect track diffs before cherry-picking**

Reject any track that edits forbidden paths, changes the lockfile, includes unrelated files or lacks a manifest.

- [ ] **Cherry-pick one logical commit at a time**

Resolve conflicts by comparing the approved interfaces, not by accepting both sides mechanically.

- [ ] **Apply contract requests as explicit coordinator commits**

Each contract change requires focused schema tests and compatibility review.

- [ ] **Install accepted dependencies once**

Run package-manager resolution in the integration worktree only.

- [ ] **Run combined unit and type verification**

```bash
pnpm --filter @deckory/schema test
pnpm --filter @deckory/scene test
pnpm --filter @deckory/sdk test
pnpm --filter @deckory/visuals test
pnpm --filter @deckory/themes test
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/present test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all available commands exit 0. A package not yet integrated is omitted only with a recorded reason.

- [ ] **Run browser tests after Studio wiring**

Run the focused Plan 02–05 E2E suites, inspect screenshots and verify Presenter excludes editor-only dependencies.

- [ ] **Record the accepted integration commit**

Only the accepted integration commit becomes the base for Plan 06 migration and release work.

## 8. Failure and conflict policy

- Shared-file conflict: stop the affected cherry-pick and compare ownership/contract requests.
- Hidden dependency on another track: record it and defer wiring; do not import an unintegrated branch artifact.
- Test passes only with another track: classify the test as integration-level and move it to coordinator ownership.
- Contract request rejected: update the track implementation or explicitly scope out the blocked capability; do not weaken validation silently.
- Browser evidence from a track branch: useful for debugging but invalid as final integrated evidence.
- Session loses base context: stop, report branch/HEAD/status and do not rebase onto an unknown revision.

## 9. Completion gate

The parallel wave is complete only when:

- all four manifests exist;
- no track contains forbidden edits;
- contract and dependency requests are resolved;
- all accepted commits are integrated;
- combined unit, typecheck, lint and build commands pass;
- Studio root wiring is complete;
- focused browser suites pass on the integrated revision;
- unresolved work is returned to the relevant child plan rather than hidden in the integration batch.

## Plan Self-Review

- Independence check: tracks own disjoint core paths and avoid shared aggregators during concurrent work.
- Contract check: schema, lockfile, route and root integration changes are coordinator-owned.
- Evidence check: track tests are not treated as integrated production evidence.
- Safety check: all sessions use the same accepted base and separate worktrees.
- Execution check: each track has concrete outputs, stop conditions and integration order.
