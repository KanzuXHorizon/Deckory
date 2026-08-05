"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { deckCatalog, slideTitle, visualCoverage } from "../lib/deck-catalog";
import { DeckoryBrand } from "./brand-mark";
import { DeckThumbnail } from "./deck-thumbnail";

const DRAFT_KEY_PREFIX = "deckory:draft:v1:";

export function Hub() {
  const [query, setQuery] = useState("");
  const [activeDeckId, setActiveDeckId] = useState(deckCatalog[0]!.deck.id);
  const [draftDeckIds, setDraftDeckIds] = useState<string[]>([]);

  useEffect(() => {
    const drafts = deckCatalog
      .map((item) => item.deck.id)
      .filter((deckId) => window.localStorage.getItem(`${DRAFT_KEY_PREFIX}${deckId}`));
    setDraftDeckIds(drafts);
  }, []);

  const filteredDecks = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi");
    if (!needle) return deckCatalog;
    return deckCatalog.filter((item) => [item.deck.title, item.description, ...item.tags].join(" ").toLocaleLowerCase("vi").includes(needle));
  }, [query]);

  const activeItem = deckCatalog.find((item) => item.deck.id === activeDeckId) ?? deckCatalog[0]!;
  const totalSlides = deckCatalog.reduce((sum, item) => sum + item.deck.slides.length, 0);

  return (
    <main className="hub-shell">
      <header className="hub-topbar">
        <Link className="brand-lockup-link" href="/" aria-label="Deckory Hub">
          <DeckoryBrand />
        </Link>
        <nav className="hub-nav" aria-label="Điều hướng chính">
          <a className="is-active" href="#library">Thư viện</a>
          <a href="#visual-system">Visual system</a>
        </nav>
        <Link className="primary-action" href={`/studio?deck=${activeItem.deck.id}`}>
          <Sparkles size={17} /> Mở Studio
        </Link>
      </header>

      <section className="hub-hero" aria-labelledby="hub-title">
        <div className="hub-hero-copy">
          <span className="section-label">DECKORY WORKSPACE</span>
          <h1 id="hub-title">Quản lý câu chuyện.<br /><em>Không chỉ quản lý file.</em></h1>
          <p>Hub kết nối deck, slide, visual system và trạng thái sẵn sàng trong một workspace. Mọi bề mặt đều dùng chung document model đã validate.</p>
          <div className="hero-actions">
            <Link className="primary-action primary-action--large" href={`/studio?deck=${activeItem.deck.id}`}>Chỉnh deck đang chọn <ArrowRight size={18} /></Link>
            <Link className="secondary-action" href={`/present?deck=${activeItem.deck.id}`}><Play size={17} /> Trình chiếu</Link>
          </div>
        </div>
        <div className="hub-hero-stage" aria-label={`Deck nổi bật: ${activeItem.deck.title}`}>
          <div className="hero-stage-meta">
            <span>{activeItem.updatedLabel}</span>
            <span>{activeItem.deck.slides.length} slide</span>
          </div>
          <DeckThumbnail slide={activeItem.deck.slides[0]!} />
          <div className="hero-stage-footer">
            <div><strong>{activeItem.deck.title}</strong><span>{activeItem.description}</span></div>
            <Link href={`/preview?deck=${activeItem.deck.id}`}>Preview <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="hub-summary" aria-label="Tổng quan workspace">
        <article><LayoutGrid size={18} /><strong>{deckCatalog.length}</strong><span>deck có cấu trúc</span></article>
        <article><SlidersHorizontal size={18} /><strong>{totalSlides}</strong><span>slide có thể quản lý</span></article>
        <article><BarChart3 size={18} /><strong>4</strong><span>kiểu chart có sẵn</span></article>
        <article><CheckCircle2 size={18} /><strong>{deckCatalog.length}</strong><span>deck hợp lệ</span></article>
      </section>

      <section className="hub-section" id="library" aria-labelledby="library-title">
        <div className="section-heading-row">
          <div><span className="section-label">DECK LIBRARY</span><h2 id="library-title">Tất cả deck trong workspace</h2></div>
          <label className="search-field"><Search size={17} /><span className="sr-only">Tìm deck</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, mục đích hoặc visual…" /></label>
        </div>

        {filteredDecks.length > 0 ? (
          <div className="deck-library-grid">
            {filteredDecks.map((item) => {
              const hasDraft = draftDeckIds.includes(item.deck.id);
              const active = item.deck.id === activeDeckId;
              return (
                <article className={`deck-card ${active ? "is-selected" : ""}`} key={item.deck.id}>
                  <button className="deck-card-preview" onClick={() => setActiveDeckId(item.deck.id)} aria-label={`Chọn ${item.deck.title}`}>
                    <DeckThumbnail slide={item.deck.slides[0]!} />
                    <span className={`status-chip ${hasDraft ? "status-chip--draft" : "status-chip--ready"}`}>
                      {hasDraft ? <Clock3 size={13} /> : <CheckCircle2 size={13} />}
                      {hasDraft ? "Có bản nháp" : "Sẵn sàng"}
                    </span>
                  </button>
                  <div className="deck-card-content">
                    <div><span>{item.deck.slides.length} SLIDE</span><span>{item.updatedLabel}</span></div>
                    <h3>{item.deck.title}</h3>
                    <p>{item.description}</p>
                    <ul>{item.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                  </div>
                  <footer>
                    <Link href={`/studio?deck=${item.deck.id}`}>Chỉnh sửa</Link>
                    <Link href={`/preview?deck=${item.deck.id}`}>Preview</Link>
                    <Link className="deck-card-present" href={`/present?deck=${item.deck.id}`} aria-label={`Trình chiếu ${item.deck.title}`}><Play size={15} /></Link>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state"><Search size={28} /><h3>Không tìm thấy deck phù hợp</h3><p>Thử một từ khóa ngắn hơn hoặc xoá bộ lọc hiện tại.</p><button onClick={() => setQuery("")}>Xoá tìm kiếm</button></div>
        )}
      </section>

      <section className="hub-section slide-manager" aria-labelledby="slides-title">
        <div className="section-heading-row">
          <div><span className="section-label">SLIDE MANAGER</span><h2 id="slides-title">Cấu trúc của deck đang chọn</h2></div>
          <div className="selected-deck-copy"><span>{activeItem.deck.title}</span><strong>{activeItem.deck.slides.length} slide</strong></div>
        </div>
        <div className="slide-strip">
          {activeItem.deck.slides.map((slide, index) => (
            <Link className="slide-strip-item" key={slide.id} href={`/studio?deck=${activeItem.deck.id}&slide=${slide.id}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <DeckThumbnail slide={slide} />
              <strong>{slideTitle(slide)}</strong>
              <small>{slide.layout} · {slide.components.length} component</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="hub-section visual-system" id="visual-system" aria-labelledby="visual-title">
        <div className="visual-system-copy">
          <span className="section-label">VISUAL SYSTEM</span>
          <h2 id="visual-title">Đủ thành phần để kể một câu chuyện hoàn chỉnh.</h2>
          <p>Không phải một gallery component rời rạc. Mỗi layout và visual được giới hạn để giữ hierarchy, khả năng đọc và tính nhất quán giữa editor với presenter.</p>
          <Link className="secondary-action" href="/studio?deck=visual-lab">Mở Visual Lab <ArrowRight size={16} /></Link>
        </div>
        <div className="coverage-list">
          {visualCoverage.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}
        </div>
      </section>

      <footer className="hub-footer"><span>Deckory / structured presentation workspace</span><span>Local-first editor preview</span></footer>
    </main>
  );
}
