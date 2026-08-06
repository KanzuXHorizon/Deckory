import { Studio } from "../../components/studio";
import { SceneDeckSurface } from "../../components/scene-deck-surface";
import { resolveAnyDeck } from "../../lib/deck-catalog";
import { isDeckDocumentV2 } from "../../lib/deck-version";

export default async function StudioPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string; slide?: string }>;
}) {
  const params = await searchParams;
  const sourceDeck = resolveAnyDeck(params.deck);

  if (isDeckDocumentV2(sourceDeck)) {
    return <SceneDeckSurface deck={sourceDeck} surface="studio" editingEnabled={process.env.DECKORY_SCENE_V2 === "1"} />;
  }

  return params.slide ? <Studio sourceDeck={sourceDeck} initialSlideId={params.slide} /> : <Studio sourceDeck={sourceDeck} />;
}
