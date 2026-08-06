import { templateGalleryDeck } from "@deckory/template-gallery";
import { migrateDeckV1ToV2 } from "@deckory/templates";

const migration = migrateDeckV1ToV2(templateGalleryDeck);
if (!migration.ok) {
  throw new Error(`Template Gallery V2 migration failed: ${JSON.stringify(migration.diagnostics)}`);
}

export const templateGalleryV2 = migration.deck;
export const templateGalleryV2MigrationDiagnostics = migration.diagnostics;
