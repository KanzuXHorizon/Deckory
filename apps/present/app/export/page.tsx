import { notFound } from "next/navigation";
import { ExportDeck } from "../../components/export-deck";
import { deckCatalog, defaultDeck } from "../../lib/deck-catalog";

export default async function ExportPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const params = await searchParams;
  const requestedDeckId = params.deck ?? defaultDeck.id;
  const item = deckCatalog.find((candidate) => candidate.deck.id === requestedDeckId);

  if (!item) notFound();
  return <ExportDeck deck={item.deck} />;
}
