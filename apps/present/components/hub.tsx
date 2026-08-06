"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  FileOutput,
  LayoutGrid,
  Pencil,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { deckCatalog, sceneFoundationAudit, v2DeckCatalog, visualCoverage } from "../lib/deck-catalog";
import { deckThemeClassName } from "../lib/deck-theme";
import { DeckoryBrand } from "./brand-mark";
import { DeckThumbnail } from "./deck-thumbnail";
import { QualitySummaryV2 } from "./quality-summary-v2";

const DRAFT_KEY_PREFIX = "deckory:draft:v1:";

export function Hub() {
  const [query, setQuery] = useState("");
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

  const featuredItem = v2DeckCatalog[0]!;
  const totalDecks = deckCatalog.length + v2DeckCatalog.length;
  const totalSlides = deckCatalog.reduce((sum, item) => sum + item.deck.slides.length, 0)
    + v2DeckCatalog.reduce((sum, item) => sum + item.deck.slides.length, 0);
  const qualityScores = [
    ...deckCatalog.map((item) => item.quality.overallScore),
    ...v2DeckCatalog.map((item) => item.audit.scorecard.overallScore)
  ];
  const averageQuality = Math.round((qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length) * 10) / 10;

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

          <div className="hub-active-deck" aria-label={`Deck bảo vệ nổi bật: ${featuredItem.deck.title}`}>
            <div>
              <span>{featuredItem.updatedLabel}</span>
              <strong>{featuredItem.deck.title}</strong>
              <small>{featuredItem.description}</small>
              <div className="hub-quality-summary" aria-label={`V2 quality score ${featuredItem.audit.scorecard.overallScore} trên 10`}>
                <span>V2 QUALITY SCORE</span>
                <strong>{featuredItem.audit.scorecard.overallScore}<small>/10</small></strong>
                <em>{featuredItem.audit.scorecard.readiness}</em>
              </div>
            </div>
            <div className="hub-active-actions">
              <Link className="primary-action primary-action--large" href={`/studio?deck=${featuredItem.deck.id}`}><Pencil size={17} /> Mở deck</Link>
              <Link className="secondary-action" href={`/preview?deck=${featuredItem.deck.id}`}><Eye size={17} /> Xem trước</Link>
              <Link className="secondary-action" href={`/present?deck=${featuredItem.deck.id}`}><Play size={17} /> Trình chiếu</Link>
            </div>
          </div>

          <div className="hub-health-strip" aria-label="Tình trạng không gian làm việc">
            <article><LayoutGrid size={17} /><strong>{totalDecks}</strong><span>deck có cấu trúc</span></article>
            <article><SlidersHorizontal size={17} /><strong>{totalSlides}</strong><span>slide có thể quản lý</span></article>
            <article><BarChart3 size={17} /><strong>{averageQuality}</strong><span>điểm chất lượng TB</span></article>
            <article aria-label="15 tiêu chí được chấm"><CheckCircle2 size={17} /><strong>15</strong><span>tiêu chí được chấm</span></article>
          </div>
        </div>

        <div className="hub-featured-stage" aria-label={`Bản xem trước ${featuredItem.deck.title}`}>
          <div className="hero-stage-meta">
            <span>DECK BẢO VỆ NỔI BẬT</span>
            <span>{featuredItem.deck.slides.length} slide</span>
          </div>
          <DeckThumbnail slide={featuredItem.deck.slides[0]!} assets={featuredItem.deck.assets} />
          <div className="hero-stage-footer">
            <div><strong>{featuredItem.deck.slides[0]!.name}</strong><span>{featuredItem.tags.join(" · ")}</span></div>
            <Link href={`/preview?deck=${featuredItem.deck.id}`}>Mở preview <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="hub-section" id="v2-quality" aria-labelledby="v2-quality-title">
        <div className="section-heading-row">
          <div>
            <span className="section-label">RELEASE GATE V2</span>
            <h2 id="v2-quality-title">Chất lượng được công bố theo bằng chứng, không theo cảm giác.</h2>
            <p>Scorecard V2 tách kiểm tra cấu trúc khỏi browser, accessibility, export, performance và manual visual review trên đúng revision.</p>
          </div>
          <Link className="secondary-action" href="/studio?deck=scene-foundation">Mở Studio V2 <ArrowRight size={16} /></Link>
        </div>
        <QualitySummaryV2 report={sceneFoundationAudit} />
      </section>

      <section className="hub-section hub-v2-library" id="v2-library" aria-labelledby="v2-library-title">
        <div className="section-heading-row">
          <div>
            <span className="section-label">SCENE V2 LIBRARY</span>
            <h2 id="v2-library-title">Bốn deck tham chiếu dùng document model có thể audit.</h2>
            <p>MyInterview được author trực tiếp trên Scene V2; các deck tham chiếu còn lại giữ trạng thái review và công bố rõ evidence, performance cùng export capability.</p>
          </div>
          <div className="hub-v2-summary" aria-label="Tóm tắt thư viện Scene V2">
            <strong>{v2DeckCatalog.length}</strong>
            <span>deck V2 · {v2DeckCatalog.reduce((sum, item) => sum + item.deck.slides.length, 0)} slide</span>
          </div>
        </div>
        <div className="deck-library-grid hub-v2-grid">
          {v2DeckCatalog.map((item) => {
            const score = item.audit.scorecard.overallScore;
            const structuralErrors = item.audit.summary.errorCount;
            return (
              <article className="deck-card hub-v2-card" data-v2-deck-id={item.deck.id} key={item.deck.id}>
                <Link className="deck-card-preview" href={`/preview?deck=${item.deck.id}`} aria-label={`Xem trước ${item.deck.title}`}>
                  <DeckThumbnail slide={item.deck.slides[0]!} assets={item.deck.assets} />
                  <span className={`hub-status-chip ${structuralErrors === 0 ? "hub-status-chip--ready" : "hub-status-chip--draft"}`}>
                    {structuralErrors === 0 ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                    {structuralErrors === 0 ? "Structural pass" : `${structuralErrors} lỗi cấu trúc`}
                  </span>
                </Link>
                <div className="deck-card-content">
                  <div><span>{item.deck.slides.length} SLIDE</span><span>{item.updatedLabel}</span></div>
                  <h3>{item.deck.title}</h3>
                  <p>{item.description}</p>
                  <div className="deck-card-quality" aria-label={`V2 quality score ${score} trên 10`}>
                    <span>V2 score · runtime pending</span>
                    <div aria-hidden="true"><i style={{ width: `${score * 10}%` }} /></div>
                    <strong>{score}/10</strong>
                  </div>
                  <ul>{item.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                </div>
                <footer>
                  <Link href={`/studio?deck=${item.deck.id}`}><Pencil size={14} /> Studio</Link>
                  <Link href={`/preview?deck=${item.deck.id}`}><Eye size={14} /> Preview</Link>
                  <Link href={`/present?deck=${item.deck.id}`}><Play size={14} /> Present</Link>
                  <Link className="deck-card-present" href={`/export?deck=${item.deck.id}`} aria-label={`Xuất deck ${item.deck.title}`}><FileOutput size={15} /><span>Export</span></Link>
                </footer>
              </article>
            );
          })}
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
              return (
                <article className="deck-card" data-deck-id={item.deck.id} key={item.deck.id}>
                  <Link className="deck-card-preview" href={`/preview?deck=${item.deck.id}`} aria-label={`Xem trước ${item.deck.title}`}>
                    <DeckThumbnail slide={item.deck.slides[0]!} assets={item.deck.assets} themeClassName={deckThemeClassName(item.deck)} />
                    <span className={`hub-status-chip ${hasDraft ? "hub-status-chip--draft" : "hub-status-chip--ready"}`}>
                      {hasDraft ? <Clock3 size={13} /> : <CheckCircle2 size={13} />}
                      {hasDraft ? "Có bản nháp" : "Sẵn sàng"}
                    </span>
                  </Link>
                  <div className="deck-card-content">
                    <div><span>{item.deck.slides.length} SLIDE</span><span>{item.updatedLabel}</span></div>
                    <h3>{item.deck.title}</h3>
                    <p>{item.description}</p>
                    <div className="deck-card-quality" aria-label={`Quality score ${item.quality.overallScore} trên 10`}>
                      <span>Quality score</span>
                      <div aria-hidden="true"><i style={{ width: `${item.quality.overallScore * 10}%` }} /></div>
                      <strong>{item.quality.overallScore}/10</strong>
                    </div>
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
          <div><span className="section-label">CẤU TRÚC TRÌNH CHIẾU</span><h2 id="slides-title">Toàn bộ mạch bảo vệ MyInterview</h2></div>
          <div className="selected-deck-copy"><span>{featuredItem.deck.title}</span><strong>{featuredItem.deck.slides.length} slide</strong></div>
        </div>
        <div className="slide-strip">
          {featuredItem.deck.slides.map((slide, index) => (
            <Link className="slide-strip-item" key={slide.id} href={`/studio?deck=${featuredItem.deck.id}&slide=${slide.id}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <DeckThumbnail slide={slide} assets={featuredItem.deck.assets} />
              <strong>{slide.name}</strong>
              <small>Scene V2 · {slide.elements.length} phần tử</small>
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
