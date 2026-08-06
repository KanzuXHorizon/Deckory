# Contract Change Request

- Track: Visual Intelligence Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Persist typed charts, diagrams, deck narrative, sources, claims, evidence, datasets and visual bindings in DeckDocument V2 without duplicating the contracts or exposing vendor payloads.
- Existing contract: `packages/schema/src/v2.ts` contains the accepted Scene Foundation element/document union but does not reference `ChartSpec`, `DiagramSpec`, `DeckNarrative` or `EvidenceDomain` from `@deckory/visuals`.
- Proposed exact type/signature:

```ts
import {
  ChartSpecSchema,
  DiagramSpecSchema,
  DeckNarrativeSchema,
  EvidenceDomainSchema,
  type ChartSpec,
  type DiagramSpec,
  type DeckNarrative,
  type EvidenceDomain
} from "@deckory/visuals";

export type ChartSceneElementV2 = SceneElementBaseV2 & {
  kind: "chart";
  chart: ChartSpec;
};

export type DiagramSceneElementV2 = SceneElementBaseV2 & {
  kind: "diagram";
  diagram: DiagramSpec;
};

export type VisualIntelligenceDocumentV2 = {
  narrative?: DeckNarrative;
  evidence?: EvidenceDomain;
};

export const ChartSceneElementV2Schema = SceneElementBaseV2Schema.extend({
  kind: z.literal("chart"),
  chart: ChartSpecSchema
}).strict();

export const DiagramSceneElementV2Schema = SceneElementBaseV2Schema.extend({
  kind: z.literal("diagram"),
  diagram: DiagramSpecSchema
}).strict();

export const VisualIntelligenceDocumentV2Schema = z.object({
  narrative: DeckNarrativeSchema.optional(),
  evidence: EvidenceDomainSchema.optional()
}).strict();
```

Add `ChartSceneElementV2Schema` and `DiagramSceneElementV2Schema` to the V2 scene-element discriminated union. Add optional `visualIntelligence: VisualIntelligenceDocumentV2Schema` to `DeckDocumentV2Schema` rather than scattering evidence/narrative fields across unrelated top-level keys.

- Files the coordinator would change:
  - `packages/schema/package.json`
  - `packages/schema/src/v2.ts`
  - focused schema tests under `packages/schema/src/**`
  - root/package lock integration owned by the coordinator
- Failing test that motivates the change: Integration tests should parse a V2 chart and diagram element and reject raw `option`, `echartsOption`, `elkGraph` and `layoutOptions` keys; they should also reject missing claim/evidence/source/dataset references through `validateEvidenceDomain` at the integration boundary.
- Compatibility impact: Additive optional V2 fields and element variants. V1 and existing V2 documents remain valid. Presenter/export consumers must add explicit chart/diagram handling before documents using these variants are production-ready.
- Can the track continue without it: yes; the isolated visual-domain contracts and tests are complete, but persistence in public DeckDocument V2 remains blocked.

## Integration constraints

- Keep `@deckory/visuals` independent of `@deckory/schema` to avoid a package cycle; schema may depend on visuals for these contracts.
- Do not copy or weaken the schemas into `unknown`/raw records.
- Do not add ECharts options or ELK graph payloads to any public schema.
- URL-reference sources remain metadata only; no Presenter/export fetch behavior is permitted.
