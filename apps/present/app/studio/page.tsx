import { Studio } from "../../components/studio";
import { resolveDeck } from "../../lib/deck-catalog";

export default async function StudioPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string; slide?: string }>;
}) {
  const params = await searchParams;
  const sourceDeck = resolveDeck(params.deck);

  return params.slide ? <Studio sourceDeck={sourceDeck} initialSlideId={params.slide} /> : <Studio sourceDeck={sourceDeck} />;
}
