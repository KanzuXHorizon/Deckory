import { deckoryStory } from "@deckory/deckory-story";
import { migrateDeckV1ToV2 } from "@deckory/templates";

const migration = migrateDeckV1ToV2(deckoryStory);
if (!migration.ok) {
  throw new Error(`Deckory Story V2 migration failed: ${JSON.stringify(migration.diagnostics)}`);
}

export const deckoryStoryV2 = migration.deck;
export const deckoryStoryV2MigrationDiagnostics = migration.diagnostics;
