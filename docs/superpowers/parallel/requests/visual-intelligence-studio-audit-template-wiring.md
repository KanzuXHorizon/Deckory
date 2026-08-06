# Contract Change Request

- Track: Visual Intelligence Core
- Base commit: `4425113417a1a064695525baef1af822b4be430b`
- Blocking capability: Expose recommendations, story diagnostics, source/data editing, catalog discovery and strict audit behavior in Studio without placing UI or command mutation logic inside the visual-domain package.
- Existing contract: `@deckory/visuals` provides pure analysis, validation, transformation, geometry, layout and inventory functions. It does not mutate DeckDocument V2 and contains no Studio components.
- Proposed exact type/signature:

```ts
type AnalyzeSelectionForVisualsInput = {
  text: string;
  locale?: string;
  hints?: VisualIntentHints;
};

type AnalyzeSelectionForVisualsResult = {
  intent: VisualIntentAnalysis;
  recommendations: VisualRecommendation[];
};

export function analyzeSelectionForVisuals(
  input: AnalyzeSelectionForVisualsInput
): AnalyzeSelectionForVisualsResult {
  const intent = classifyVisualIntent(input);
  return { intent, recommendations: recommendVisuals(intent, visualCatalog) };
}

type StoryAnalysisResult = {
  narrative: NarrativeAuditResult;
  composition: CompositionRepetitionDiagnostic[];
};

export function analyzeDeckStory(
  narrative: DeckNarrative,
  slides: readonly NarrativeSlide[],
  compositions: readonly SlideCompositionInput[]
): StoryAnalysisResult;
```

Studio command application remains outside `@deckory/visuals` and must create one undoable command per accepted recommendation. Source text may be moved to notes, accessible detail or an explicitly inspectable source element, but never silently deleted.

- Files the coordinator would change:
  - focused files under `apps/present/components/studio-v2/**`
  - focused application logic under `apps/present/lib/**`
  - `packages/audit/**`
  - `packages/templates/**`
  - Studio/component/template shared catalogs and barrels only at the integration gate
- Failing test that motivates the change: Integrated tests should verify that qualitative text never produces a chart recommendation, recommendation application preserves source content, copy changes require explicit acceptance, source deletion shows all dependents, illustrative values remain visibly labelled and every public catalog item maps to an integrated fixture.
- Compatibility impact: Additive UI panels, commands and audit rules. Existing V1/V2 editing remains unchanged until the feature-gated panels are wired.
- Can the track continue without it: yes; all mutations, UI and browser review remain integration responsibilities.

## Studio requirements

### Visual Assistant

- Show at most three deterministic candidates.
- Display reasons, required/missing inputs, evidence requirements, density warnings and alternatives.
- Disable chart application when numeric evidence is absent.
- Support replace, insert-beside and create-new-slide as separate commands.
- Preserve source content and create an undo entry.

### Story panel

- Edit audience, desired outcome, thesis and section roles.
- Show story-order, transition, unsupported-evidence, weak-heading, weak-closing, appendix and repeated-composition diagnostics.
- Show constrained copy before/after plus `ClaimPreservationReport`.
- Never auto-apply copy or slide-order changes.

### Source/data management

- Edit local/manual source metadata only; URL references are never fetched.
- Inspect claim/evidence/dataset/visual dependents before deletion.
- Bind charts to datasets or explicit manual rows.
- Display every transformation-lineage step.
- Preserve illustrative/stale/verified/unverified status and labels.

## Audit requirements

Add strict rules for:

- material unsupported claim;
- stale source;
- missing source/evidence/dataset/claim reference;
- supported claim without evidence;
- chart without question, unit, accessible summary or numeric evidence;
- more than one primary chart highlight;
- illustrative chart/dataset/source without a visible label;
- diagram fit failure or node collision;
- catalog entry without fixture inventory;
- undeclared transformation lineage;
- URL-reference fetch behavior or remote map assets.

## Template/catalog requirements

- Group catalog items by communication intent, not implementation package.
- Use `visualCoverageCatalog` and `visualFixtureInventory` as integration inputs.
- Template recipes declare slot limits, evidence requirements, density bounds and use/avoid guidance.
- Do not represent the catalog as one generic equal-card grid.
- Public gallery/browser fixtures remain coordinator-owned and must use visible illustrative-data labels.
