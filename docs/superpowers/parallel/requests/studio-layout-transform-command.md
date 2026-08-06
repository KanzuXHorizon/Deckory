# Contract Change Request

- Track: A — Studio Layout
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Commit drag, resize and rotate—including multi-selection rotation—as one immutable SceneCommand and one undo step.
- Existing contract: `transform-elements` accepts only `{ elementId, frame }`. Rotation, scale, skew and transform origin live in `SceneElement.transform`, so the current command cannot persist rotation without emitting separate `patch-element` commands. Separate commands would violate the one-gesture/one-history-entry requirement.
- Track adapter evidence: `apps/present/components/studio-v2/canvas/gesture-transaction.ts` now produces one local `transform-elements` payload whose changes may include a normalized `transform`. Frame-only gestures remain byte-for-byte compatible with the existing payload shape.
- Proposed exact type/signature:

```ts
export type ElementGeometryChange = {
  elementId: string;
  frame: Frame;
  /** Omitted means preserve the existing transform. */
  transform?: Transform2D;
};

export type SceneCommand =
  | ExistingSceneCommand
  | {
      type: "transform-elements";
      slideId: string;
      changes: ElementGeometryChange[];
    };
```

`applySceneCommand` behavior for each change:

1. Capture the current frame and transform for the inverse.
2. Replace the frame with a deep clone of `change.frame`.
3. When `change.transform` is present, replace the element transform with a deep clone.
4. When `change.transform` is omitted, preserve the current transform.
5. Validate the complete V2 document once after all changes.
6. Increment revision exactly once.
7. Return one inverse `transform-elements` command containing previous frames and previous transforms for elements whose transform changed.

The first integration does not need a separate `null` reset sentinel. Reset rotation can persist `{ rotation: 0 }`; a later cleanup command may remove identity transforms if document normalization requires it.

- Normalization rules already enforced by the Track A adapter:
  - frame, rotation, skew and origins use quarter logical-pixel/degree normalization;
  - scale uses deterministic four-decimal normalization and must remain positive;
  - non-finite values reject before command dispatch;
  - frame-only drag preserves any existing transform.
- Files the coordinator would change:
  - `packages/scene/src/commands.ts`
  - `packages/scene/src/commands.test.ts`
  - shared public types/barrels in the coordinator export batch
- Required regression tests:
  1. Rotating two elements emits one command and increments revision once.
  2. Applying its inverse restores exact frames and transforms.
  3. A drag command without `transform` preserves pre-existing rotation.
  4. Mixed changes—one frame-only and one frame+rotation—remain atomic.
  5. Duplicate element IDs and invalid transforms reject without a partial document.
- Compatibility impact: Additive optional field on each change. Existing serialized frame-only command payloads remain valid and retain existing behavior.
- Can the track continue without it: yes for transient Studio previews and frame-only transforms; no for persistent rotate, multi-selection rotate or correct one-step undo/redo of rotation.
