# Contract Change Request

- Track: A — Studio Layout
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Persist aspect-ratio sizing so the implemented coupled sizing policy can round-trip through `DeckDocumentV2`, Studio Layout controls, undo and reload.
- Existing contract: `ElementConstraintsSchema` stores horizontal/vertical anchoring, fixed/hug/fill sizing and min/max bounds, but it has no aspect-ratio field. The pure layout core already supports a positive width/height ratio and rejects derived dimensions that violate min/max or available space. Without a document field, that behavior is programmatic only and cannot be preserved by Studio.
- Proposed exact type/signature:

```ts
const AspectRatioConstraintSchema = z.object({
  value: finiteNumber.positive(),
  preserve: z.enum(["width", "height"])
}).strict();

export const ElementConstraintsSchema = z.object({
  horizontal: z.enum(["left", "right", "center", "stretch", "scale"]).optional(),
  vertical: z.enum(["top", "bottom", "center", "stretch", "scale"]).optional(),
  width: z.enum(["fixed", "hug", "fill"]).optional(),
  height: z.enum(["fixed", "hug", "fill"]).optional(),
  minWidth: finiteNumber.nonnegative().optional(),
  maxWidth: finiteNumber.positive().optional(),
  minHeight: finiteNumber.nonnegative().optional(),
  maxHeight: finiteNumber.positive().optional(),
  aspectRatio: AspectRatioConstraintSchema.optional()
}).strict();
```

`value` is canonical `width / height`. `preserve` identifies the authoritative axis when the other dimension must be derived.

After acceptance:

1. Map `aspectRatio` into `LayoutSizingPolicy.aspectRatio` only on the authoritative axis in `packages/scene/src/layout/conversion.ts` and the Studio root adapter.
2. Reject contradictory policies such as `preserve: "height"` combined with main-axis fill when the allocated width cannot remain authoritative; do not silently break the ratio.
3. Add Layout Inspector controls for locking/unlocking the current ratio and choosing the preserved axis.
4. Keep ratio validation in the Scene layout core, not in pointer-library payloads.

- Files the coordinator would change:
  - `packages/schema/src/v2.ts`
  - `packages/schema/src/v2.test.ts`
  - integration follow-up in `packages/scene/src/layout/conversion.ts` and its tests
  - coordinator-owned Studio Layout adapter/root wiring
- Failing test that motivates the change:
  - V2 schema accepts `{ aspectRatio: { value: 16 / 9, preserve: "width" } }`.
  - V2 schema rejects zero, negative, non-finite ratios and unknown preserve values.
  - Studio conversion/reload retains the exact ratio and authoritative axis.
  - Resizing the authoritative axis derives the dependent axis and returns `sizing-minimum-does-not-fit` or `sizing-maximum-exceeded` when bounds cannot be satisfied.
- Compatibility impact: Additive and optional. Existing documents parse unchanged. No migration output is modified unless a source format explicitly contains an aspect-ratio constraint.
- Can the track continue without it: yes for pure sizing and fixed/hug/fill layout; no for persistent aspect-ratio authoring and reload fidelity.
