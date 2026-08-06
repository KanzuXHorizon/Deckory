import { DraftPreview } from "../../components/draft-preview";
import { resolveDeck } from "../../lib/deck-catalog";

export default async function PreviewPage({
  searchParams
}: {
  searchParams: Promise<{ deck?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "presenter" ? "presenter" : "audience";
  return <DraftPreview sourceDeck={resolveDeck(params.deck)} view={view} />;
}
