import { DeckDocumentV2Schema, type DeckDocument, type DeckDocumentV2 } from "@deckory/schema";

export type MigrationAcceptanceIssue = {
  code:
    | "schema-invalid"
    | "slide-count-changed"
    | "slide-id-changed"
    | "missing-purpose"
    | "missing-conclusion"
    | "missing-notes"
    | "frame-outside-canvas"
    | "narrative-coverage"
    | "claim-coverage"
    | "chart-lineage"
    | "asset-missing"
    | "team-content-missing"
    | "composition-repetition";
  message: string;
  slideId?: string;
  elementId?: string;
};

export type MigrationAcceptanceReport = {
  passed: boolean;
  issues: MigrationAcceptanceIssue[];
};

export function evaluateV2MigrationAcceptance(
  source: DeckDocument,
  migrated: DeckDocumentV2,
  options: { requireTeamRoster?: boolean; maximumRepeatedComposition?: number } = {}
): MigrationAcceptanceReport {
  const issues: MigrationAcceptanceIssue[] = [];
  const schema = DeckDocumentV2Schema.safeParse(migrated);
  if (!schema.success) {
    schema.error.issues.forEach((issue) => issues.push({
      code: "schema-invalid",
      message: `${issue.path.join(".")}: ${issue.message}`
    }));
    return { passed: false, issues };
  }

  if (source.slides.length !== migrated.slides.length) {
    issues.push({ code: "slide-count-changed", message: `${source.slides.length} V1 slide became ${migrated.slides.length} V2 slide.` });
  }
  const sourceIds = source.slides.map((slide) => slide.id);
  const migratedIds = migrated.slides.map((slide) => slide.id);
  if (sourceIds.join("|") !== migratedIds.join("|")) {
    issues.push({ code: "slide-id-changed", message: "V2 slide IDs or order differ from the V1 source." });
  }

  for (const slide of migrated.slides) {
    if (!slide.purpose?.trim()) issues.push({ code: "missing-purpose", slideId: slide.id, message: "Slide purpose is missing." });
    if (!slide.conclusion?.trim()) issues.push({ code: "missing-conclusion", slideId: slide.id, message: "Slide conclusion is missing." });
    if (!slide.notes?.trim()) issues.push({ code: "missing-notes", slideId: slide.id, message: "Speaker notes are missing." });
    for (const element of slide.elements) {
      const { x, y, width, height } = element.frame;
      if (width <= 0 || height <= 0 || x < 0 || y < 0 || x + width > 1280 || y + height > 720) {
        issues.push({ code: "frame-outside-canvas", slideId: slide.id, elementId: element.id, message: `Element frame is outside 1280 × 720: ${x},${y},${width},${height}.` });
      }
    }
  }

  const narrativeIds = migrated.visualIntelligence?.narrative?.sections.flatMap((section) => section.slideIds) ?? [];
  if (new Set(narrativeIds).size !== migrated.slides.length || migratedIds.some((id) => !narrativeIds.includes(id))) {
    issues.push({ code: "narrative-coverage", message: "Narrative sections do not cover every migrated slide exactly once." });
  }

  const claims = migrated.visualIntelligence?.evidence?.claims ?? [];
  const claimedSlides = new Set(claims.map((claim) => claim.slideId));
  if (migratedIds.some((id) => !claimedSlides.has(id))) {
    issues.push({ code: "claim-coverage", message: "At least one migrated slide has no explicit supported/unsupported/illustrative claim record." });
  }

  const evidence = migrated.visualIntelligence?.evidence;
  const datasets = new Set(evidence?.datasets.map((dataset) => dataset.id) ?? []);
  const boundElements = new Set((evidence?.visualBindings ?? [])
    .filter((binding) => binding.kind === "chart" && binding.datasetId && datasets.has(binding.datasetId))
    .map((binding) => `${binding.slideId}:${binding.elementId}`));
  for (const slide of migrated.slides) {
    for (const element of slide.elements) {
      if (element.kind === "chart" && !boundElements.has(`${slide.id}:${element.id}`)) {
        issues.push({ code: "chart-lineage", slideId: slide.id, elementId: element.id, message: "Chart lacks a dataset binding with an existing dataset." });
      }
    }
  }

  const migratedAssets = new Set(migrated.assets.map((asset) => asset.id));
  for (const asset of source.assets ?? []) {
    if (!migratedAssets.has(asset.id)) issues.push({ code: "asset-missing", message: `Source asset ${asset.id} is missing from V2.` });
  }

  if (options.requireTeamRoster) {
    const sourceMembers = source.slides.flatMap((slide) => slide.components.flatMap((component) =>
      component.type === "team-showcase" ? component.props.members.map((member) => member.name) : []));
    const migratedText = migrated.slides.flatMap((slide) => slide.elements.flatMap((element) =>
      element.kind === "text" ? [element.content.text] : [])).join("\n");
    for (const member of sourceMembers) {
      if (!migratedText.includes(member)) issues.push({ code: "team-content-missing", message: `Team member ${member} is missing from migrated editable text.` });
    }
  }

  const maximumRepeatedComposition = options.maximumRepeatedComposition ?? 4;
  let repeated = 1;
  let previous = "";
  for (const slide of migrated.slides) {
    const signature = slide.elements
      .filter((element) => element.kind !== "evidence-footer")
      .map((element) => `${element.kind}:${bucket(element.frame.x, 1280)}:${bucket(element.frame.y, 720)}:${bucket(element.frame.width, 1280)}:${bucket(element.frame.height, 720)}`)
      .sort()
      .join("|");
    if (signature === previous) repeated += 1;
    else repeated = 1;
    if (repeated > maximumRepeatedComposition) {
      issues.push({ code: "composition-repetition", slideId: slide.id, message: `More than ${maximumRepeatedComposition} consecutive slides share the same composition signature.` });
      break;
    }
    previous = signature;
  }

  return { passed: issues.length === 0, issues };
}

function bucket(value: number, total: number): number {
  return Math.round((value / total) * 12);
}
