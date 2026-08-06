import { DraftPreview } from "../../components/draft-preview";
import { SceneDeckSurface } from "../../components/scene-deck-surface";
import { resolveAnyDeck } from "../../lib/deck-catalog";
import { isDeckDocumentV2 } from "../../lib/deck-version";

export default async function PreviewPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "presenter" ? "presenter" : "audience";
  const deck = resolveAnyDeck(params.deck);
  return isDeckDocumentV2(deck)
    ? <SceneDeckSurface deck={deck} surface="preview" />
    : <DraftPreview sourceDeck={deck} view={view} />;
}
