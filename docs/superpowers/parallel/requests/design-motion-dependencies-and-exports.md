# Contract Change Request

- Track: Design and Motion Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Register `@deckory/themes`, link canonical scene types into renderer integration and expose focused package subpaths without editing the parallel lockfile or shared barrels.
- Existing contract: `pnpm-lock.yaml` has no `packages/themes` importer; `@deckory/renderer` depends only on schema/react; scene/renderer package exports expose only `.`.
- Proposed exact type/signature: package changes below.
- Files the coordinator would change: `pnpm-lock.yaml`, `packages/scene/package.json`, `packages/renderer/package.json`; root `package.json` only if an explicit package-level script is desired.
- Failing test that motivates the change: `pnpm --filter @deckory/themes` temporarily adds an empty importer; this track restored the lockfile before every commit as required. Shared renderer integration cannot import canonical scene types until a workspace dependency is accepted.
- Compatibility impact: workspace-only links; no production third-party dependency or bundle increase by itself.
- Can the track continue without it: yes; focused modules use direct/structural contracts until integration.

## Exact package changes

`packages/scene/package.json`:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./rich-text": "./src/rich-text.ts",
    "./text-fit": "./src/text-fit.ts",
    "./motion": "./src/motion.ts"
  }
}
```

`packages/renderer/package.json`:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./background-renderer": "./src/background-renderer.tsx",
    "./rich-text-renderer": "./src/rich-text-renderer.tsx",
    "./shape-renderer": "./src/shape-renderer.tsx",
    "./image-renderer": "./src/image-renderer.tsx",
    "./motion-compiler": "./src/motion-compiler.ts"
  },
  "dependencies": {
    "@deckory/schema": "workspace:*",
    "@deckory/scene": "workspace:*",
    "@deckory/themes": "workspace:*",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  }
}
```

`packages/themes/package.json` already defines:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts",
    "./themes": "./src/themes.ts",
    "./resolve": "./src/resolve.ts"
  }
}
```

Run one coordinator-owned install:

```bash
pnpm install --frozen-lockfile=false
```

Expected lockfile changes are limited to:

- `importers.packages/themes: {}`;
- renderer workspace links for `@deckory/scene` and `@deckory/themes`.

Then run supply-chain policy checks and inspect the lockfile diff before commit.

## Third-party dependency request

None. The track intentionally uses:

- React/ReactDOM already present in renderer;
- deterministic local SVG/CSS;
- a local text-measurement contract with no browser or remote font dependency;
- no noise, gradient, color, motion or image-effect library.

Bundle impact before Studio integration: only modules imported by shared renderer consumers are included. Presenter must not import Studio UI modules.
