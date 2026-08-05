export function DeckoryBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-lockup ${compact ? "brand-lockup--compact" : ""}`} aria-label="Deckory">
      <svg className="brand-symbol" viewBox="0 0 36 36" aria-hidden="true">
        <rect x="4" y="5" width="9" height="26" rx="2.5" />
        <rect x="15" y="11" width="9" height="20" rx="2.5" />
        <rect x="26" y="18" width="6" height="13" rx="2" />
      </svg>
      {!compact && <span className="brand-wordmark">deckory</span>}
    </span>
  );
}
