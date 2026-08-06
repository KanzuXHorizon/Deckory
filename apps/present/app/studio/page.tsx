import { Studio } from "../../components/studio";
import { SceneDeckSurface } from "../../components/scene-deck-surface";
import { StudioV2 } from "../../components/studio-v2/studio-v2";
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
    const editingEnabled = process.env.DECKORY_SCENE_V2 !== "0";
    if (editingEnabled) return <StudioV2 sourceDeck={sourceDeck} {...(params.slide ? { initialSlideId: params.slide } : {})} />;
    return <SceneDeckSurface deck={sourceDeck} surface="studio" editingEnabled={false} />;
  }

  return params.slide ? <Studio sourceDeck={sourceDeck} initialSlideId={params.slide} /> : <Studio sourceDeck={sourceDeck} />;
}
