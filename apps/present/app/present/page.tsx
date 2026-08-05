import { Presenter } from "../../components/presenter";
import { resolveDeck } from "../../lib/deck-catalog";

export default async function PresentPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string; view?: string | string[] }>;
}) {
  const params = await searchParams;
  const deck = resolveDeck(params.deck);
  const view = params.view === "audience" ? "audience" : "presenter";

  return (
    <Presenter
      deck={deck}
      view={view}
      returnHref="/"
      editHref={`/studio?deck=${deck.id}`}
    />
  );
}
