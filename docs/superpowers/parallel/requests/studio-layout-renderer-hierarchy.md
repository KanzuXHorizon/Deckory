# Integration Change Request

- Track: A — Studio Layout
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Render parent-local frames and container transforms consistently after group, ungroup, reparent and layout conversion.
- Existing implementation evidence:
  - `packages/renderer/src/scene-renderer.tsx` sorts every `slide.elements` entry into one flat array and renders every element directly under `.scene-slide`.
  - `packages/renderer/src/element-renderer.tsx` writes `left: element.frame.x` and `top: element.frame.y` without resolving `parentId`.
  - Container content for `group`, `stack` and `grid` returns `null`, so descendants are not nested under their parent DOM node.
  - Track A hierarchy operations intentionally convert descendants to parent-local frames. With the current flat renderer, grouping an element at slide x=100 into a group at x=80 changes its stored child x to 20, and the renderer displays it at slide x=20 instead of x=100.
- Required behavior:
  1. Treat `SceneElement.frame` as parent-local when `parentId` exists.
  2. Render roots and descendants as a validated hierarchy rather than as unrelated flat siblings, or consume an equivalent deterministic geometry resolver that produces the same visual result.
  3. Preserve stable sibling ordering by `zIndex`, then document order.
  4. Keep `data-element-id`, `data-element-kind`, `data-parent-id` and render-mode attributes on the actual selectable element node.
  5. Container overflow remains visible unless an explicit clip/mask contract says otherwise.
  6. Parent rotation/scale/skew must compose with descendants. Do not flatten transformed hierarchy by adding x/y only.
  7. Invalid parent references or cycles produce an element/slide diagnostic rather than silently rendering at the wrong coordinate.

Recommended renderer shape:

```tsx
type SceneTreeNode = {
  element: SceneElement;
  children: SceneTreeNode[];
};

function renderNode(node: SceneTreeNode): ReactNode {
  return (
    <ElementRenderer element={node.element} mode={mode} assets={assets}>
      {node.children.map(renderNode)}
    </ElementRenderer>
  );
}
```

`ElementRenderer` should render supplied children inside `group`, `stack` and `grid` container nodes. Parent-local `left`/`top` then compose naturally through DOM hierarchy. If the coordinator chooses a flat renderer instead, it must use a tested 2D matrix composition utility and preserve the same output for rotation, scale, skew and custom transform origins.

- Files the coordinator would change:
  - focused renderer hierarchy/tree module under `packages/renderer/src/`
  - `packages/renderer/src/scene-renderer.tsx`
  - `packages/renderer/src/element-renderer.tsx`
  - focused renderer tests
  - package dependency wiring only if a pure resolver is imported from `@deckory/scene`
- Required regression tests:
  1. Parent `{ x: 80, y: 60 }` with child-local `{ x: 20, y: 30 }` renders the child at visual slide position `{ x: 100, y: 90 }`.
  2. Two nested containers compose local frames across all levels.
  3. Grouping through Track A output produces markup/geometry visually equivalent to the pre-group state.
  4. Rotating a group rotates its descendants around the declared transform origin.
  5. Sibling z-order remains deterministic inside each parent.
  6. V1 rendering and root-level V2 elements remain unchanged.
- Compatibility impact: This corrects V2 hierarchy semantics and should be additive for root-only Scene Foundation fixtures. It can alter incorrectly rendered nested V2 content, which is the intended correction. V1 renderer behavior must remain unchanged.
- Can the track continue without it: yes for pure hierarchy and isolated panel tests; no for valid browser QA of group, ungroup, reparent, nested selection, smart guides or layout containers.
