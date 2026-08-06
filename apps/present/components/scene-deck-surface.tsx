"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SceneRenderer } from "@deckory/renderer";
import type { DeckDocumentV2, SceneSlide } from "@deckory/schema";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  FileOutput,
  Grid2X2,
  Home,
  NotebookText,
  PanelsTopLeft,
  X
} from "lucide-react";
import styles from "./scene-deck-surface.module.css";

const CANVAS_WIDTH = 1280;

export function SceneDeckSurface({
  deck,
  surface,
  editingEnabled = false,
  initialSlideId,
  view = "presenter"
}: {
  deck: DeckDocumentV2;
  surface: "preview" | "presenter" | "studio";
  editingEnabled?: boolean;
  initialSlideId?: string;
  view?: "presenter" | "audience";
}) {
  const initialIndex = Math.max(0, deck.slides.findIndex((slide) => slide.id === initialSlideId));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const activeSlide = deck.slides[activeIndex] ?? deck.slides[0]!;
  const audienceMode = surface === "presenter" && view === "audience";
  const presenterControls = surface === "presenter" && view === "presenter";

  useEffect(() => {
    const nextIndex = deck.slides.findIndex((slide) => slide.id === initialSlideId);
    if (nextIndex >= 0) setActiveIndex(nextIndex);
  }, [deck, initialSlideId]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => setScale(Math.max(0.1, stage.clientWidth / CANVAS_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape") {
        setOverviewOpen(false);
        setNotesOpen(false);
        return;
      }
      if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        setOverviewOpen((value) => !value);
        return;
      }
      if (presenterControls && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNotesOpen((value) => !value);
        return;
      }
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setActiveIndex((index) => Math.min(deck.slides.length - 1, index + 1));
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(deck.slides.length - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deck.slides.length, presenterControls]);

  const surfaceLabel = surface === "studio"
    ? editingEnabled ? "V2 Studio foundation" : "V2 Studio read-only"
    : surface === "presenter" ? view === "audience" ? "V2 Audience" : "V2 Presenter"
      : "V2 Preview";

  const selectSlide = (index: number) => {
    setActiveIndex(index);
    setOverviewOpen(false);
    setNotesOpen(false);
  };

  const requestFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  return (
    <main
      className={`${styles.shell} ${audienceMode ? styles.audience : ""}`}
      data-scene-v2-surface={surface}
      data-scene-v2-editing={surface === "studio" ? String(editingEnabled) : undefined}
      data-active-slide-id={activeSlide.id}
      data-deck-slide-count={deck.slides.length}
    >
      <header className={styles.topbar}>
        <div className={styles.identity}>
          <span>{surfaceLabel}</span>
          <h1>{deck.title}</h1>
        </div>
        <span className={styles.counter} aria-live="polite">{activeIndex + 1} / {deck.slides.length}</span>
        <nav className={styles.navigation} aria-label="Điều hướng Deckory V2">
          <Link href="/"><Home size={14} /> Hub</Link>
          {surface !== "studio" ? <Link href={`/studio?deck=${deck.id}&slide=${activeSlide.id}`}><PanelsTopLeft size={14} /> Studio</Link> : null}
          {surface !== "presenter" ? <Link href={`/present?deck=${deck.id}&slide=${activeSlide.id}`}><Expand size={14} /> Present</Link> : null}
          <Link href={`/export?deck=${deck.id}`}><FileOutput size={14} /> Export</Link>
        </nav>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.rail} aria-label="Danh sách slide V2">
          <ol>
            {deck.slides.map((slide, index) => (
              <li key={slide.id}>
                <button
                  type="button"
                  className={styles.slideButton}
                  data-active={index === activeIndex ? "true" : "false"}
                  aria-label={`Chọn slide ${index + 1}: ${slide.name}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => selectSlide(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{slide.name}</strong>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className={styles.stageArea} aria-label={`Slide ${activeIndex + 1}: ${activeSlide.name}`}>
          {surface === "studio" && !editingEnabled ? (
            <p role="status" style={{ position: "absolute", top: 8, left: 16, zIndex: 4, color: "#c3c6cc", fontSize: 12 }}>
              Studio V2 đang ở chế độ chỉ đọc. Mở editor đầy đủ bằng cấu hình Scene V2.
            </p>
          ) : null}
          <div ref={stageRef} className={styles.stage}>
            <div className={styles.canvas} style={{ "--surface-scale": scale } as CSSProperties}>
              <SceneRenderer
                key={activeSlide.id}
                slide={activeSlide}
                assets={deck.assets}
                mode={surface === "studio" ? "studio" : "final"}
              />
            </div>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <p>{activeSlide.conclusion ?? activeSlide.name}</p>
        <div className={styles.footerActions}>
          <button type="button" aria-label="Slide trước" disabled={activeIndex === 0} onClick={() => selectSlide(Math.max(0, activeIndex - 1))}><ChevronLeft size={15} /> Trước</button>
          <button type="button" aria-label="Mở tổng quan slide" onClick={() => setOverviewOpen(true)}><Grid2X2 size={15} /> Tổng quan</button>
          {presenterControls ? <button type="button" aria-label="Mở ghi chú người thuyết trình" onClick={() => setNotesOpen((value) => !value)}><NotebookText size={15} /> Ghi chú</button> : null}
          {surface === "presenter" ? <button type="button" aria-label="Bật toàn màn hình" onClick={() => void requestFullscreen()}><Expand size={15} /> Fullscreen</button> : null}
          <button type="button" aria-label="Slide tiếp theo" disabled={activeIndex === deck.slides.length - 1} onClick={() => selectSlide(Math.min(deck.slides.length - 1, activeIndex + 1))}>Tiếp <ChevronRight size={15} /></button>
        </div>
      </footer>

      {overviewOpen ? (
        <section className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="v2-overview-title" data-v2-overview="true">
          <header className={styles.overlayHeader}>
            <h2 id="v2-overview-title">Tổng quan {deck.slides.length} slide</h2>
            <button type="button" aria-label="Đóng tổng quan slide" onClick={() => setOverviewOpen(false)}><X size={16} /> Đóng</button>
          </header>
          <div className={styles.overlayGrid}>
            {deck.slides.map((slide, index) => (
              <OverviewSlide
                key={slide.id}
                slide={slide}
                assets={deck.assets}
                active={index === activeIndex}
                index={index}
                onSelect={() => selectSlide(index)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {notesOpen && presenterControls ? (
        <aside className={styles.notesPanel} aria-label="Ghi chú người thuyết trình">
          <h2>Ghi chú người thuyết trình</h2>
          <p>{activeSlide.notes ?? "Slide này chưa có ghi chú."}</p>
        </aside>
      ) : null}
    </main>
  );
}

function OverviewSlide({
  slide,
  assets,
  active,
  index,
  onSelect
}: {
  slide: SceneSlide;
  assets: DeckDocumentV2["assets"];
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);
  useEffect(() => {
    const node = thumbnailRef.current;
    if (!node) return;
    const update = () => setScale(Math.max(0.08, node.clientWidth / CANVAS_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <button type="button" className={styles.overviewButton} data-active={active ? "true" : "false"} onClick={onSelect} aria-label={`Mở slide ${index + 1}: ${slide.name}`}>
      <div ref={thumbnailRef} className={styles.thumbnail}>
        <div className={styles.thumbnailCanvas} style={{ "--thumbnail-scale": scale } as CSSProperties}>
          <SceneRenderer slide={slide} assets={assets} mode="thumbnail" />
        </div>
      </div>
      <strong>{String(index + 1).padStart(2, "0")} · {slide.name}</strong>
    </button>
  );
}
