import { myInterviewDefense } from "@deckory/myinterview-defense";
import { migrateDeckV1ToV2 } from "@deckory/templates";

const migration = migrateDeckV1ToV2(myInterviewDefense);
if (!migration.ok) {
  throw new Error(`MyInterview Defense V2 migration failed: ${JSON.stringify(migration.diagnostics)}`);
}

export const myInterviewDefenseV2 = migration.deck;
export const myInterviewDefenseV2MigrationDiagnostics = migration.diagnostics;
