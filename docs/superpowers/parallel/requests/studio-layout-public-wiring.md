# Contract Change Request

- Track: A — Studio Layout
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Expose the accepted layout core through the shared package surface and wire the isolated Studio modules without parallel edits to barrels, package manifests, lockfile or Studio root.
- Existing contract:
  - `packages/scene/src/index.ts` exports only geometry, commands, migration and V1 frame helpers.
  - `apps/present/package.json` does not declare `@deckory/scene`, `react-moveable` or `react-selecto`.
  - `apps/present/components/studio-v2/studio-v2.tsx` is coordinator-owned and was intentionally not modified.
- Proposed exact type/signature:

Add these exports in the coordinator integration batch:

```ts
// packages/scene/src/index.ts
export * from "./alignment";
export * from "./guides";
export * from "./hierarchy";
export * from "./layout/auto-layout";
export * from "./layout/constraints";
export * from "./layout/conversion";
export * from "./layout/sizing";
export * from "./layout/types";
```

Add these dependencies once in the integration worktree:

```json
{
  "dependencies": {
    "@deckory/scene": "workspace:*",
    "react-moveable": "0.56.0",
    "react-selecto": "1.26.3"
  }
}
```

Registry versions were resolved on 2026-08-06 with:

```bash
pnpm view react-moveable version
# 0.56.0
pnpm view react-selecto version
# 1.26.3
```

- Files the coordinator would change:
  - `packages/scene/src/index.ts`
  - `apps/present/package.json`
  - `pnpm-lock.yaml`
  - `apps/present/components/studio-v2/studio-v2.tsx`
  - optional coordinator-owned Studio workspace shell/CSS only when needed for panel placement
- Failing test that motivates the change:
  - Integration import test should import `layoutStack`, `resolveConstraints`, `groupElements`, `collectSnapGuides` and `createAlignmentCommand` from `@deckory/scene`.
  - Studio integration test should dispatch the structural command emitted by the Layout mode control and the single `transform-elements` command emitted by `gesture-transaction.ts`.
- Compatibility impact:
  - Public exports are additive.
  - `@deckory/scene` is editor-side only; Presenter and Preview must continue importing only `@deckory/renderer` and schema contracts.
  - `react-moveable` and `react-selecto` must be dynamically confined to Studio-owned overlay adapters so they do not enter Presenter, Preview, thumbnail or export bundles.
- Can the track continue without it: yes for all committed pure/UI modules; no for Moveable/Selecto overlays, shared imports and end-to-end Studio interaction QA.
