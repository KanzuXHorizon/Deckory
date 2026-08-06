import { describe, expect, it } from "vitest";
import { createDeckExportCommand } from "./export-command";

describe("deck export command", () => {
  it("builds explicit offline export commands for supported formats", () => {
    expect(createDeckExportCommand("deckory-story", "png")).toBe("pnpm export:deck -- --deck=deckory-story --format=png");
    expect(createDeckExportCommand("deckory-story", "jpg")).toBe("pnpm export:deck -- --deck=deckory-story --format=jpg");
    expect(createDeckExportCommand("deckory-story", "pptx")).toBe("pnpm export:deck -- --deck=deckory-story --format=pptx");
    expect(createDeckExportCommand("deckory-story", "all")).toBe("pnpm export:deck -- --deck=deckory-story --format=all");
  });

  it("rejects unsafe deck IDs instead of emitting shell fragments", () => {
    expect(() => createDeckExportCommand("deck; rm -rf", "png")).toThrow(/deck ID hợp lệ/);
  });
});
