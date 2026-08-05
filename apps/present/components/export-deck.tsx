"use client";

import Link from "next/link";
import { ArrowLeft, FileDown, Printer } from "lucide-react";
import type { DeckDocument } from "@deckory/schema";
import { deckThemeClassName } from "../lib/deck-theme";
import { DeckoryBrand } from "./brand-mark";
import { SlideFrame } from "./slide-frame";

export function ExportDeck({ deck }: { deck: DeckDocument }) {
  const themeClassName = deckThemeClassName(deck);

  return (
    <main
      className={`export-shell ${themeClassName}`}
      data-export-ready="true"
      data-export-deck-id={deck.id}
    >
      <header className="export-toolbar" aria-label="Điều khiển xuất deck">
        <div className="export-toolbar-brand">
          <Link href="/" aria-label="Về Deckory Hub"><DeckoryBrand /></Link>
          <span>EXPORT</span>
        </div>
        <div className="export-toolbar-copy">
          <strong>{deck.title}</strong>
          <span>{deck.slides.length} slide · 16:9 · cùng renderer với Presenter</span>
        </div>
        <div className="export-toolbar-actions">
          <Link className="toolbar-button" href={`/present?deck=${deck.id}`}>
            <ArrowLeft size={16} />
            <span>Về Presenter</span>
          </Link>
          <button
            type="button"
            className="toolbar-button primary"
            onClick={() => window.print()}
            aria-label="In hoặc lưu deck thành PDF"
          >
            <Printer size={17} />
            <span>In / Lưu PDF</span>
          </button>
        </div>
      </header>

      <section className="export-intro" aria-label="Thông tin xuất">
        <FileDown size={18} aria-hidden="true" />
        <p>Mỗi slide được khóa ở 1280 × 720. Speaker notes và điều khiển Presenter không xuất hiện trong tài liệu.</p>
      </section>

      <div className="export-pages">
        {deck.slides.map((slide, index) => (
          <section
            className="export-page"
            data-export-slide-id={slide.id}
            data-export-slide-index={index + 1}
            aria-label={`Slide ${index + 1} trên ${deck.slides.length}: ${slide.id}`}
            key={slide.id}
          >
            <SlideFrame
              slide={slide}
              deckId={deck.id}
              sequenceStep={Number.MAX_SAFE_INTEGER}
              reducedMotion
              motionDisabled
            />
          </section>
        ))}
      </div>
    </main>
  );
}
