# Contract Change Request

- Track: B — Component SDK Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Shared renderer wiring for trusted components and Web Blocks
- Existing contract: `ElementRenderer` handles `component-instance` and `web-block` through legacy text fallbacks and accepts only `{ element, assets, mode }`.
- Can the track continue without it: yes; isolated hosts and tests are complete.

## Proposed exact integration contract

Add a renderer-owned dependency-injection contract without importing `@deckory/sdk` into the renderer core:

```ts
export interface SceneRendererExtensions {
  components?: {
    resolve(input: {
      componentId: string;
      version: string;
    }): ComponentHostDefinition<unknown> | undefined;
  };
  webBlocks?: {
    resolve(input: {
      elementId: string;
      manifest: Record<string, unknown>;
      sourceId?: string;
    }): {
      bundle?: CompiledWebBlockBundle;
      fallbackSrc?: string;
    } | undefined;
  };
  exportTarget?: ComponentExportCapability;
}
```

Update these shared files in the coordinator integration worktree:

- `packages/renderer/src/element-renderer.tsx`
- `packages/renderer/src/scene-renderer.tsx`
- `packages/renderer/src/index.ts`
- the shared compatibility wrapper that supplies renderer props

Proposed signatures:

```ts
export function ElementRenderer(props: {
  element: SceneElement;
  assets: readonly DeckAssetV2[];
  mode: SceneRenderMode;
  extensions?: SceneRendererExtensions;
}): ReactNode;

export function SceneRenderer(props: {
  slide: SceneSlide;
  assets: readonly DeckAssetV2[];
  mode: SceneRenderMode;
  extensions?: SceneRendererExtensions;
}): ReactNode;
```

For `component-instance`, adapt the SDK definition structurally:

```ts
const definition = extensions?.components?.resolve({
  componentId: element.content.componentId,
  version: element.content.version
});

return (
  <TrustedComponentHost
    element={element}
    definition={definition}
    mode={mode}
    exportTarget={extensions?.exportTarget}
  />
);
```

For `web-block`, resolve compiler output and fallback source, then render `WebBlockHost`. Do not add a default global registry inside `@deckory/renderer`.

## Compatibility impact

- Existing callers remain valid because `extensions` is optional.
- V1 and unregistered V2 components preserve an explicit element-level fallback.
- Presenter must seal the SDK registry before first audience render.
- Browser security claims remain blocked until coordinator-owned E2E proves opaque-origin isolation and CSP enforcement.
