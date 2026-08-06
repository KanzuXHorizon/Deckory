export type DeckExportCliFormat = "png" | "jpg" | "pptx" | "all";

const SAFE_DECK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createDeckExportCommand(deckId: string, format: DeckExportCliFormat): string {
  if (!SAFE_DECK_ID.test(deckId)) {
    throw new Error("Cần một deck ID hợp lệ ở dạng kebab-case để tạo lệnh export.");
  }

  return `pnpm export:deck -- --deck=${deckId} --format=${format}`;
}
