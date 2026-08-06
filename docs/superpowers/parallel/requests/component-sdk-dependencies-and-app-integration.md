# Dependency and Application Integration Request

- Track: B — Component SDK Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Track implementation commits:
  - `8694c6a75cf156ac938d008e46ae6da7ad12a9fd`
  - `d4d205b279eb408392830f14b100bd84b9518f4e`
- Can the track continue without this request: yes; the isolated SDK and renderer hosts are complete and verified.

## 1. Workspace dependency wiring

The coordinator should run package resolution once in the integration worktree after all parallel tracks are cherry-picked.

`packages/sdk/package.json` declares only dependencies already approved elsewhere in the workspace:

```json
{
  "@deckory/schema": "workspace:*",
  "react": "19.2.8",
  "zod": "4.4.3"
}
```

Required integration action:

```bash
pnpm install
```

Expected effect:

- add the `packages/sdk` importer to `pnpm-lock.yaml`;
- do not change the versions declared by this track;
- review all parallel dependency requests before accepting any lockfile delta.

This track used `pnpm install --lockfile=false` only to link the new local workspace package for tests. It did not modify `pnpm-lock.yaml`.

## 2. Web Block compiler dependency

Plan 03 app integration requires a browser-local compiler worker. Add this only in the coordinator-owned integration batch:

```bash
pnpm --filter @deckory/present add esbuild-wasm@0.28.1
```

Reason:

- the existing lockfile already contains `esbuild@0.28.1`;
- pinning `esbuild-wasm@0.28.1` keeps compiler APIs aligned;
- the dependency belongs to `@deckory/present`, not `@deckory/sdk` or `@deckory/renderer`.

The compiler worker must:

- use an in-memory filesystem;
- expose no HTTP resolver;
- resolve only local supplied files and the reviewed runtime imports;
- accept only TS, TSX, JS, JSX, CSS and HTML files;
- enforce the existing 1 MB source budget and reject source larger than manifest `payloadBytes`;
- reject CommonJS `require`, dynamic imports and any import that escapes the supplied virtual source root;
- stop compilation after 1.5 seconds;
- call `esbuild.stop()` when disposed;
- return code and CSS separately;
- keep source maps and diagnostics Studio-only.

## 3. Reviewed Web Block runtime package

Before enabling the currently reserved import `@deckory/web-block-runtime`, create a repository-controlled package or virtual compiler module with a versioned public contract. It must not expose parent DOM, Deckory state, storage, navigation, network, dynamic import resolution, `eval` or `Function`.

The runtime must call the frozen bootloader bridge at `globalThis.__deckoryWebBlockBridge` only after the visual is actually mounted:

```ts
__deckoryWebBlockBridge.renderComplete({ width, height });
```

It must call `renderError(message, code?)` for handled failures. The bootloader no longer emits an unconditional completion signal, so a block that never reports completion correctly reaches the 1.5-second fallback.

Until that module exists, fixtures should use only:

- `react`;
- `react/jsx-runtime`;
- `react-dom/client`.

Do not broaden `REVIEWED_WEB_BLOCK_IMPORTS` to make an integration fixture compile.

## 4. Studio and application integration

Coordinator-owned files and work:

- add `@deckory/sdk` to the appropriate `apps/present/package.json` dependency list;
- wire repository-controlled component packages into a `ComponentRegistry`;
- seal the registry before Presenter audience rendering begins;
- generate Studio Inspector controls from `InspectorSchema`, compose relative child paths under object/list parents and dispatch only paths declared by the schema;
- add component catalog cards and capability disclosures;
- implement the advanced Web Block source editor;
- implement the compiler worker and source diagnostics;
- map manifest fallback asset IDs only to local, blob or reviewed image-data URLs; never pass remote fallback URLs to the host;
- inject component/Web Block resolvers through the renderer extension contract;
- reject compiled bundles whose bridge protocol is not exactly `1.0`;
- preserve the deny-all iframe Permissions Policy emitted by `createWebBlockSandboxPolicy`;
- expose no source code or Studio diagnostics in Presenter;
- sanitize and revalidate every `export-svg` bridge result before persistence or DOM insertion;
- use mandatory static fallback for PNG, PDF, PPTX and other non-interactive export paths unless a reviewed native export exists;
- isolate trusted-component SSR/static export per element or use a reviewed export fallback, because React error boundaries do not catch descendant server-render failures.

## 5. Shared exports

Coordinator should add reviewed exports after cherry-picking:

```ts
// packages/renderer/src/index.ts
export * from "./component-host";
export * from "./web-block-host";
```

`@deckory/sdk` already owns its package-local public entrypoint and JSX runtime subpaths. No root TypeScript path mapping is required.

## 6. Schema boundary

No blocking schema modification is requested.

The accepted V2 schema already provides:

```ts
component-instance.content = {
  componentId: StableId;
  version: string;
  props: Record<string, unknown>;
}

web-block.content = {
  manifest: Record<string, unknown>;
  sourceId?: StableId;
}
```

The SDK performs the stricter component and Web Block validation before those values enter a scene document. Keeping `@deckory/schema` independent of `@deckory/sdk` avoids a package cycle.

A future coordinator-owned schema-hardening batch may move shared data-only schemas downward only if it preserves this dependency direction:

```text
@deckory/schema <- @deckory/sdk <- @deckory/present
```

Do not make `@deckory/schema` import from `@deckory/sdk`.
