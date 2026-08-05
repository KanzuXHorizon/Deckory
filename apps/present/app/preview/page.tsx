import { DraftPreview } from "../../components/draft-preview";
import { resolveDeck } from "../../lib/deck-catalog";

export default async function PreviewPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const params = await searchParams;
  return <DraftPreview sourceDeck={resolveDeck(params.deck)} />;
}
