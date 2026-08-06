import type { DeckDocumentV2 } from "@deckory/schema";
import { createDeckFromTemplate } from "../instantiate";
import type { CreateDeckFromTemplateInput, TemplateDiagnostic } from "../types";
import { migrateDeckV1ToV2, type V2MigrationDiagnostic } from "./migrate";

export type CreateDeckV2FromTemplateResult =
  | { ok: true; deck: DeckDocumentV2; diagnostics: V2MigrationDiagnostic[] }
  | { ok: false; diagnostics: Array<TemplateDiagnostic | V2MigrationDiagnostic> };

export function createDeckV2FromTemplate(
  input: CreateDeckFromTemplateInput
): CreateDeckV2FromTemplateResult {
  const v1 = createDeckFromTemplate(input);
  if (!v1.ok) return { ok: false, diagnostics: [...v1.diagnostics] };
  return migrateDeckV1ToV2(v1.value);
}
