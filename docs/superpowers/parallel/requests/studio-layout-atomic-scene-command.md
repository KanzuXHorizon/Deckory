# Contract Change Request

- Track: A — Studio Layout
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Apply group, ungroup, reparent and layout-mode conversion as exactly one immutable SceneCommand and one undo transaction.
- Existing contract: `SceneCommand` supports frame transforms, inserts, deletes, reorder and patch operations, but no atomic operation can simultaneously insert/remove a container, change element kind/content, patch parent IDs and replace child frames.
- Proposed exact type/signature:

```ts
export type SceneCommand =
  | ExistingSceneCommand
  | {
      type: "replace-scene-elements";
      slideId: string;
      /** Complete ordered element collection for the target slide after the action. */
      elements: SceneElement[];
    };
```

`applySceneCommand` behavior:

1. Resolve `slideId` using the existing actionable missing-slide diagnostic.
2. Capture a deep clone of the current complete `slide.elements` collection.
3. Replace `slide.elements` with a deep clone of `command.elements`.
4. Generate one inverse command:

```ts
{
  type: "replace-scene-elements",
  slideId: command.slideId,
  elements: previousElements
}
```

5. Increment revision exactly once.
6. Validate the resulting complete document with `DeckDocumentV2Schema`; duplicate IDs, missing parents and hierarchy cycles must reject the command without returning a partial document.

- Files the coordinator would change:
  - `packages/scene/src/commands.ts`
  - `packages/scene/src/commands.test.ts`
  - `packages/scene/src/index.ts` only for the separate public-export integration batch if required
- Failing test that motivates the change:
  - Add an official command test that replaces `[a, b]` with `[group, a-with-parent, b-with-parent]`, asserts one revision increment, then applies the generated inverse and restores the exact original ordered element array.
  - Track tests already verify one proposed command is produced by:
    - `packages/scene/src/layout/conversion.test.ts`
    - `packages/scene/src/hierarchy.test.ts`
- Compatibility impact: Additive command-union member. Existing commands, V1 compatibility and serialized documents are unchanged. The command is editor history data, not a new DeckDocumentV2 schema field.
- Can the track continue without it: yes for pure layout, adapters and UI modules; no for final Studio root history wiring.
