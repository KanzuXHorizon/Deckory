# Contract Change Request

- Track: A — Studio Layout
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Persist independent grid padding and grid alignment without losing settings during freeform/constraint/stack/grid round trips.
- Existing contract:

```ts
const gridContent = z.object({
  columns: z.number().int().positive().max(24),
  rows: z.number().int().positive().max(24).optional(),
  columnGap: finiteNumber.nonnegative().default(0),
  rowGap: finiteNumber.nonnegative().default(0),
  padding: finiteNumber.nonnegative().default(0)
}).strict();
```

The pure `layoutGrid` engine accepts independent top/right/bottom/left padding and `start | center | end | stretch` alignment. The current document contract can store only uniform padding and no alignment setting. The track therefore rejects non-uniform grid conversion instead of silently discarding it.

- Proposed exact type/signature:

```ts
const gridContent = z.object({
  columns: z.number().int().positive().max(24),
  rows: z.number().int().positive().max(24).optional(),
  columnGap: finiteNumber.nonnegative().default(0),
  rowGap: finiteNumber.nonnegative().default(0),
  padding: z.union([
    finiteNumber.nonnegative(),
    z.tuple([
      finiteNumber.nonnegative(),
      finiteNumber.nonnegative(),
      finiteNumber.nonnegative(),
      finiteNumber.nonnegative()
    ])
  ]).default(0),
  align: z.enum(["start", "center", "end", "stretch"]).default("stretch")
}).strict();
```

Tuple order is `[top, right, bottom, left]`, matching the existing stack contract and the track layout engine.

After acceptance, update `convertGroupLayoutMode` so grid conversion stores:

```ts
content: {
  columns,
  rows,
  columnGap: gap,
  rowGap: gap,
  padding: [top, right, bottom, left],
  align
}
```

- Files the coordinator would change:
  - `packages/schema/src/v2.ts`
  - `packages/schema/src/v2.test.ts`
  - Track integration follow-up: `packages/scene/src/layout/conversion.ts` and its test
- Failing test that motivates the change:
  - Schema accepts a grid with tuple padding and `align: "center"`.
  - V2 migration/validation still accepts the existing numeric padding form.
  - Layout conversion round-trips independent grid padding and alignment without changing parent bounds.
- Compatibility impact: Additive. Existing numeric padding remains valid and continues to parse to the same value. Existing grids receive the default `align: "stretch"` during parsing.
- Can the track continue without it: yes for pure layout and uniform-padding conversion; no for complete persistence of independent grid padding/alignment.
