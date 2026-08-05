"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  LayoutGrid,
  Pencil,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { deckCatalog, slideTitle, visualCoverage } from "../lib/deck-catalog";
import { deckThemeClassName } from "../lib/deck-theme";
import { layoutLabel } from "../lib/studio-option-catalog";
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
          <a className="is-active" href="#library">Deck</a>
          <a href="#slides">Slide</a>
          <a href="#visual-system">Hệ thống</a>
        </nav>
        <Link className="primary-action" href="/studio?deck=template-gallery">
          <Sparkles size={17} /> Mở thư viện mẫu
        </Link>
      </header>

      <section className="hub-workspace-intro" aria-labelledby="hub-title">
        <div className="hub-workspace-copy">
          <span className="section-label">DECKORY WORKSPACE</span>
          <h1 id="hub-title">Không gian làm việc cho những deck cần được tin cậy.</h1>
          <p>Chọn bộ trình chiếu, kiểm tra trạng thái và đi thẳng vào chỉnh sửa hoặc trình chiếu. Đây là thư viện làm việc tập trung, không phải trang giới thiệu tiếp thị.</p>

          <div className="hub-active-deck" aria-label={`Deck đang chọn: ${activeItem.deck.title}`}>
            <div>
              <span>{activeItem.updatedLabel}</span>
              <strong>{activeItem.deck.title}</strong>
              <small>{activeItem.description}</small>
            </div>
            <div className="hub-active-actions">
              <Link className="primary-action primary-action--large" href={`/studio?deck=${activeItem.deck.id}`}><Pencil size={17} /> Mở deck</Link>
              <Link className="secondary-action" href={`/preview?deck=${activeItem.deck.id}`}><Eye size={17} /> Xem trước</Link>
              <Link className="secondary-action" href={`/present?deck=${activeItem.deck.id}`}><Play size={17} /> Trình chiếu</Link>
            </div>
          </div>

          <div className="hub-health-strip" aria-label="Tình trạng không gian làm việc">
            <article><LayoutGrid size={17} /><strong>{deckCatalog.length}</strong><span>deck có cấu trúc</span></article>
            <article><SlidersHorizontal size={17} /><strong>{totalSlides}</strong><span>slide có thể quản lý</span></article>
            <article><BarChart3 size={17} /><strong>4</strong><span>kiểu biểu đồ</span></article>
            <article><CheckCircle2 size={17} /><strong>{deckCatalog.length}</strong><span>deck hợp lệ</span></article>
          </div>
        </div>

        <div className="hub-featured-stage" aria-label={`Bản xem trước ${activeItem.deck.title}`}>
          <div className="hero-stage-meta">
            <span>DECK ĐANG CHỌN</span>
            <span>{activeItem.deck.slides.length} slide</span>
          </div>
          <DeckThumbnail slide={activeItem.deck.slides[0]!} assets={activeItem.deck.assets} themeClassName={deckThemeClassName(activeItem.deck)} />
          <div className="hero-stage-footer">
            <div><strong>{slideTitle(activeItem.deck.slides[0]!)}</strong><span>{activeItem.tags.join(" · ")}</span></div>
            <Link href={`/preview?deck=${activeItem.deck.id}`}>Mở preview <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="hub-section hub-library" id="library" aria-labelledby="library-title">
        <div className="section-heading-row">
          <div><span className="section-label">THƯ VIỆN TRÌNH CHIẾU</span><h2 id="library-title">Bộ trình chiếu trong không gian làm việc</h2><p>Chọn một bộ trình chiếu để cập nhật vùng làm việc phía trên hoặc mở trực tiếp vào chế độ cần dùng.</p></div>
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
                    <DeckThumbnail slide={item.deck.slides[0]!} assets={item.deck.assets} themeClassName={deckThemeClassName(item.deck)} />
                    <span className={`hub-status-chip ${hasDraft ? "hub-status-chip--draft" : "hub-status-chip--ready"}`}>
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
                    <Link href={`/studio?deck=${item.deck.id}`}><Pencil size={14} /> Chỉnh sửa deck</Link>
                    <Link href={`/preview?deck=${item.deck.id}`}><Eye size={14} /> Xem trước deck</Link>
                    <Link className="deck-card-present" href={`/present?deck=${item.deck.id}`} aria-label={`Trình chiếu deck ${item.deck.title}`}><Play size={15} /><span>Trình chiếu deck</span></Link>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state"><Search size={28} /><h3>Không tìm thấy deck phù hợp</h3><p>Thử một từ khóa ngắn hơn hoặc xoá bộ lọc hiện tại.</p><button onClick={() => setQuery("")}>Xoá tìm kiếm</button></div>
        )}
      </section>

      <section className="hub-section slide-manager" id="slides" aria-labelledby="slides-title">
        <div className="section-heading-row">
          <div><span className="section-label">CẤU TRÚC TRÌNH CHIẾU</span><h2 id="slides-title">Các trang của bộ trình chiếu đang chọn</h2></div>
          <div className="selected-deck-copy"><span>{activeItem.deck.title}</span><strong>{activeItem.deck.slides.length} slide</strong></div>
        </div>
        <div className="slide-strip">
          {activeItem.deck.slides.map((slide, index) => (
            <Link className="slide-strip-item" key={slide.id} href={`/studio?deck=${activeItem.deck.id}&slide=${slide.id}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <DeckThumbnail slide={slide} assets={activeItem.deck.assets} themeClassName={deckThemeClassName(activeItem.deck)} />
              <strong>{slideTitle(slide)}</strong>
              <small>{layoutLabel(slide.layout)} · {slide.components.length} thành phần</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="hub-section visual-system" id="visual-system" aria-labelledby="visual-title">
        <div className="visual-system-copy">
          <span className="section-label">HỆ THỐNG TRÌNH BÀY</span>
          <h2 id="visual-title">Một visual grammar đủ rộng nhưng không mất kiểm soát.</h2>
          <p>Mỗi bố cục và thành phần đều có quy tắc rõ ràng, giới hạn nội dung và bước kiểm tra trước khi trình chiếu. Trợ lý có thể tái sử dụng mẫu mà vẫn giữ đúng thứ bậc thông tin và độ chính xác.</p>
          <Link className="secondary-action" href="/studio?deck=visual-lab">Mở Visual Lab <ArrowRight size={16} /></Link>
        </div>
        <div className="coverage-list">
          {visualCoverage.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}
        </div>
      </section>

      <footer className="hub-footer"><span>Deckory / không gian trình chiếu có cấu trúc</span><span>Biên tập và xem trước ưu tiên ngoại tuyến</span></footer>
    </main>
  );
}
