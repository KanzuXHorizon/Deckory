import { Presenter } from "../../components/presenter";
import { SceneDeckSurface } from "../../components/scene-deck-surface";
import { resolveAnyDeck } from "../../lib/deck-catalog";
import { isDeckDocumentV2 } from "../../lib/deck-version";

export default async function PresentPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string; view?: string | string[]; slide?: string }>;
}) {
  const params = await searchParams;
  const deck = resolveAnyDeck(params.deck);
  const view = params.view === "audience" ? "audience" : "presenter";

  if (isDeckDocumentV2(deck)) return (
    <SceneDeckSurface
      deck={deck}
      surface="presenter"
      view={view}
      {...(params.slide ? { initialSlideId: params.slide } : {})}
    />
  );

  return (
    <Presenter
      deck={deck}
      view={view}
      returnHref="/"
      editHref={`/studio?deck=${deck.id}`}
    />
  );
}
