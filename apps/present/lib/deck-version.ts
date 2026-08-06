import {
  DeckDocumentSchema,
  DeckDocumentV2Schema,
  type DeckDocument,
  type DeckDocumentV2
} from "@deckory/schema";

export type AnyDeckDocument = DeckDocument | DeckDocumentV2;

export type ResolvedDeckDocument =
  | { version: 1; deck: DeckDocument }
  | { version: 2; deck: DeckDocumentV2 };

function firstIssueMessage(path: PropertyKey[], message: string): string {
  return `Tài liệu không hợp lệ tại ${path.map(String).join(".") || "document"}: ${message}`;
}

export function resolveRenderableDeck(input: unknown): ResolvedDeckDocument {
  if (!input || typeof input !== "object") {
    throw new Error("Tài liệu trình chiếu phải là một object hợp lệ.");
  }

  const candidate = input as Record<string, unknown>;
  if ("schemaVersion" in candidate) {
    if (candidate.schemaVersion !== 2) {
      throw new Error(`Phiên bản tài liệu không được hỗ trợ: ${String(candidate.schemaVersion)}.`);
    }
    const parsed = DeckDocumentV2Schema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!;
      throw new Error(firstIssueMessage(issue.path, issue.message));
    }
    return { version: 2, deck: parsed.data };
  }

  if ("version" in candidate && candidate.version !== 1) {
    throw new Error(`Phiên bản tài liệu không được hỗ trợ: ${String(candidate.version)}.`);
  }
  const parsed = DeckDocumentSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    throw new Error(firstIssueMessage(issue.path, issue.message));
  }
  return { version: 1, deck: parsed.data };
}

export function isDeckDocumentV2(input: unknown): input is DeckDocumentV2 {
  if (!input || typeof input !== "object" || (input as Record<string, unknown>).schemaVersion !== 2) return false;
  return DeckDocumentV2Schema.safeParse(input).success;
}
