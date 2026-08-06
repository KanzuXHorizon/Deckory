# Contract Change Request

- Track: Design and Motion Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Make the isolated design renderers and motion compiler the shared V2 rendering path.
- Existing contract: `scene-renderer.tsx` contains a limited `backgroundStyle`; `element-renderer.tsx` renders rich text as plain text, images as raw `<img>` and shapes as empty content; no motion timeline is compiled for V2 modes; `packages/renderer/src/index.ts` exports only the Scene Foundation surface.
- Proposed exact type/signature: listed below.
- Files the coordinator would change: `packages/renderer/src/index.ts`, `packages/renderer/src/scene-renderer.tsx`, `packages/renderer/src/element-renderer.tsx`, matching shared integration tests.
- Failing test that motivates the change: focused renderer tests pass only through direct imports because shared renderer roots were frozen during parallel execution.
- Compatibility impact: V1 remains on `LegacyRenderer`. V2 output gains deterministic backgrounds, semantic rich text, bounded shape/image effects and typed final-state motion.
- Can the track continue without it: yes; shared consumers will not use these modules until this request is applied.

## Required exports

Add to `packages/renderer/src/index.ts` after all tracks are integrated:

```ts
export * from "./background-renderer";
export * from "./rich-text-renderer";
export * from "./shape-renderer";
export * from "./image-renderer";
export * from "./motion-compiler";
```

Preferred package subpaths are also requested in the dependency/package request so focused consumers do not depend on the root barrel.

## Scene renderer wiring

In `packages/renderer/src/scene-renderer.tsx`:

1. Delete the local `backgroundStyle` function after migration.
2. Replace the current `.scene-background` layer loop with:

```tsx
<BackgroundRenderer stack={slide.background} assets={assets} />
```

3. Keep background renderer behind the scene article and above the article base background. Use `z-index: 0` for background and ensure elements remain above it. Do not use a negative stacking context that can disappear under isolated export roots.
4. Resolve motion tracks once per slide:

```ts
const timeline = compileMotionTimeline(
  slide.elements.flatMap((element) => element.motion ?? [])
);
```

5. Pass `timeline`, `mode` and each element's resolved state to `ElementRenderer`.
6. If `timeline.diagnostics.length > 0`, Studio mode exposes `data-motion-diagnostic-count`; final/thumbnail/export still render complete `finalState` and do not hide content.

## Element renderer wiring

Extend `ElementRenderer` props:

```ts
export type ElementRendererProps = {
  element: SceneElement;
  assets: readonly DeckAssetV2[];
  mode: SceneRenderMode;
  motionState?: CompilerMotionState;
};
```

Map motion state only through reviewed properties:

```ts
opacity
transform: translateX, translateY, scale, scaleX, scaleY, rotation
filter: blur
CSS custom properties: --deckory-progress, --deckory-path-offset
```

No consumer-provided Motion object or callback may enter the renderer.

Dispatch exact element kinds:

```tsx
case "rich-text":
  return <RichTextRenderer document={normalizeRichText(element.content.document)} />;

case "shape":
  return <ShapeRenderer spec={shapeElementToRenderSpec(element)} />;

case "image":
  return <ImageRenderer spec={imageElementToRenderSpec(element, asset)} />;
```

Adapters must be pure and tested. Missing/remote assets retain explicit error nodes. `normalizeRichText` should run at document creation/edit boundaries; renderer may accept an already-normalized document and only normalize as defensive fallback.

## Render-mode contract

Use this exact final-state policy:

```ts
export type MotionResolveMode = "live" | "reduced" | "thumbnail" | "export" | "final";

const motionMode =
  mode === "thumbnail" ? "thumbnail" :
  mode === "export" ? "export" :
  prefersReducedMotion ? "reduced" :
  mode === "final" ? "final" :
  "live";
```

`reduced`, `thumbnail`, `export` and `final` must call `resolveMotionState(track, { mode, time: Infinity })` and return the complete declared final state. Reduced motion must not substitute an earlier or partially revealed state.

## Shared integration tests

Add tests proving:

- existing V1 renderer snapshots remain unchanged;
- V2 background layer order is stable;
- mesh/noise markup is byte-identical across repeated renders;
- missing, protocol-relative, wrong-type and remote assets expose explicit diagnostics;
- rich text is escaped, unsafe links/colors are rejected and consecutive list items preserve grouped semantic list markup;
- background/shape/image CSS fragments cannot introduce remote `url(...)`, executable CSS or invalid geometry;
- shape/image budgets reject negative, non-finite and excessive effects with specific diagnostics;
- focal point/crop/duotone survive full-size, thumbnail and export markup;
- delayed live cues expose their declared `from` state, completed live timelines return the declared final state, and same-element track final states merge deterministically;
- reduced, thumbnail, export and final modes produce equivalent complete element state;
- Presenter audience bundle receives no Studio timeline/editor module.
