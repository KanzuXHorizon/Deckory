"use client";

import { useEffect, useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { validateDeck, type DeckDocument } from "@deckory/schema";
import { Presenter } from "./presenter";

const DRAFT_KEY_PREFIX = "deckory:draft:v1:";

export function DraftPreview({ sourceDeck }: { sourceDeck: DeckDocument }) {
  const [deck, setDeck] = useState<DeckDocument | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`${DRAFT_KEY_PREFIX}${sourceDeck.id}`);
      if (!raw) {
        setDeck(sourceDeck);
        setMessage("Chưa có bản nháp đã lưu; chế độ xem trước đang dùng nội dung gốc.");
        return;
      }
      const result = validateDeck(JSON.parse(raw) as unknown);
      if (result.ok) {
        setDeck(result.deck);
        return;
      }
      setDeck(sourceDeck);
      setMessage("Bản nháp có lỗi cấu trúc; chế độ xem trước đã chuyển sang nội dung gốc an toàn.");
    } catch {
      setDeck(sourceDeck);
      setMessage("Không thể đọc bản nháp cục bộ; chế độ xem trước đã chuyển sang nội dung gốc an toàn.");
    }
  }, [sourceDeck]);

  if (!deck) {
    return <main className="preview-loading"><LoaderCircle className="is-spinning" size={24} /><span>Đang chuẩn bị preview…</span></main>;
  }

  return (
    <div className="preview-shell">
      {message && <div className="preview-warning" role="status"><CircleAlert size={16} />{message}</div>}
      <Presenter deck={deck} returnHref={`/studio?deck=${sourceDeck.id}`} editHref={`/studio?deck=${sourceDeck.id}`} modeLabel="XEM TRƯỚC BẢN NHÁP" />
    </div>
  );
}
