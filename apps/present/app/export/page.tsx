import { notFound } from "next/navigation";
import { ExportDeck } from "../../components/export-deck";
import { defaultDeck, findAnyDeck } from "../../lib/deck-catalog";

export default async function ExportPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const params = await searchParams;
  const requestedDeckId = params.deck ?? defaultDeck.id;
  const deck = findAnyDeck(requestedDeckId);

  if (!deck) notFound();
  return <ExportDeck deck={deck} />;
}
