import { notFound } from "next/navigation";
import { ExportDeck } from "../../components/export-deck";
import { deckCatalog, defaultDeck, sceneFoundationDeck } from "../../lib/deck-catalog";

export default async function ExportPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const params = await searchParams;
  const requestedDeckId = params.deck ?? defaultDeck.id;
  const deck = requestedDeckId === sceneFoundationDeck.id
    ? sceneFoundationDeck
    : deckCatalog.find((candidate) => candidate.deck.id === requestedDeckId)?.deck;

  if (!deck) notFound();
  return <ExportDeck deck={deck} />;
}
