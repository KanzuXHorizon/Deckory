"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, CircleHelp, Expand, Grid2X2, ListTree, NotebookTabs, Wifi, WifiOff, X } from "lucide-react";
import { initialPresenterState, present, type PresenterCommand } from "@deckory/core";
import type { DeckDocument, Slide } from "@deckory/schema";
import { SlideFrame } from "./slide-frame";

export function Presenter({ deck }: { deck: DeckDocument }) {
  const reducedMotion = useReducedMotion();
  const sequenceCounts = useMemo(() => deck.slides.map((slide) => Math.max(0, ...slide.components.map((component) => component.sequence ?? 0))), [deck.slides]);
  const [state, setState] = useState(() => initialPresenterState(sequenceCounts));
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [presenterMode, setPresenterMode] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const dispatch = useCallback((command: PresenterCommand) => setState((current) => present(current, command)), []);
  const currentSlide = deck.slides[state.slideIndex] ?? deck.slides[0]!;

  useEffect(() => { const id = new URLSearchParams(window.location.search).get("slide"); const index = deck.slides.findIndex((slide) => slide.id === id); if (index >= 0) setState((current) => present(current, { type: "GOTO", slideIndex: index })); }, [deck.slides]);
  useEffect(() => { const url = new URL(window.location.href); url.searchParams.set("slide", currentSlide.id); window.history.replaceState(null, "", url); }, [currentSlide.id]);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); dispatch({ type: "NEXT" }); } if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); dispatch({ type: "PREVIOUS" }); } if (event.key === "Home") { event.preventDefault(); dispatch({ type: "HOME" }); } if (event.key === "End") { event.preventDefault(); dispatch({ type: "END" }); } if (event.key === "Escape") setOverviewOpen(false); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [dispatch]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").then(() => setOfflineReady(true)).catch(() => setOfflineReady(false)); }, []);
  const toggleFullscreen = async () => { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen?.(); };

  return <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}><main className="present-shell">
    <header className="present-toolbar" aria-label="Điều khiển trình chiếu"><div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>deckory</span></div><div className="deck-context"><span className="eyebrow">DECKORY PRESENT</span><strong>{deck.title}</strong></div><div className="toolbar-actions"><span className={`connection-status ${offlineReady ? "is-ready" : ""}`} title={offlineReady ? "Deck đã sẵn sàng ngoại tuyến" : "Deck cần kết nối"}>{offlineReady ? <Wifi size={15} /> : <WifiOff size={15} />}<span>{offlineReady ? "Sẵn sàng" : "Trực tuyến"}</span></span><button className="icon-button" onClick={() => setPresenterMode((value) => !value)} aria-pressed={presenterMode} aria-label="Bật hoặc tắt ghi chú người thuyết trình"><NotebookTabs size={18} /></button><button className="icon-button" onClick={() => setOverviewOpen(true)} aria-label="Mở tổng quan slide"><Grid2X2 size={18} /></button><button className="icon-button" onClick={toggleFullscreen} aria-label="Bật toàn màn hình"><Expand size={18} /></button></div></header>
    <section className="stage" aria-label={`Slide ${state.slideIndex + 1}: ${currentSlide.id}`}><AnimatePresence mode="wait" initial={false}><motion.div key={currentSlide.id} className="slide-scale" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}><SlideFrame slide={currentSlide} sequenceStep={state.sequenceStep} reducedMotion={Boolean(reducedMotion)} /></motion.div></AnimatePresence></section>
    <footer className="present-footer"><div className="progress-copy"><span>{String(state.slideIndex + 1).padStart(2, "0")}</span><i /><span>{String(deck.slides.length).padStart(2, "0")}</span></div><div className="progress-rail" aria-hidden="true"><span style={{ width: `${((state.slideIndex + 1) / deck.slides.length) * 100}%` }} /></div><div className="navigation-actions"><button className="nav-button" onClick={() => dispatch({ type: "PREVIOUS" })} aria-label="Slide trước"><ChevronLeft size={20} /></button><button className="nav-button next" onClick={() => dispatch({ type: "NEXT" })} aria-label="Slide tiếp theo"><ChevronRight size={20} /></button></div></footer>
    {presenterMode && <aside className="speaker-notes" aria-label="Ghi chú người thuyết trình"><div><ListTree size={16} /><span>GHI CHÚ RIÊNG</span></div><p>{currentSlide.notes || "Slide này không có ghi chú riêng."}</p></aside>}
    {overviewOpen && <SlideOverview slides={deck.slides} currentSlideIndex={state.slideIndex} onClose={() => setOverviewOpen(false)} onSelect={(slideIndex) => { dispatch({ type: "GOTO", slideIndex }); setOverviewOpen(false); }} />}
  </main></MotionConfig>;
}

function SlideOverview({ slides, currentSlideIndex, onClose, onSelect }: { slides: Slide[]; currentSlideIndex: number; onClose: () => void; onSelect: (slideIndex: number) => void }) { return <div className="overview-backdrop" role="dialog" aria-modal="true" aria-label="Tổng quan slide"><div className="overview-panel"><header><div><span className="eyebrow">TỔNG QUAN</span><h2>Chọn điểm bạn muốn kể tiếp</h2></div><button className="icon-button" onClick={onClose} aria-label="Đóng tổng quan"><X size={19} /></button></header><div className="overview-grid">{slides.map((slide, index) => <button key={slide.id} className={`overview-card ${index === currentSlideIndex ? "active" : ""}`} onClick={() => onSelect(index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{labelForSlide(slide)}</strong><small>{slide.layout}</small></button>)}</div><footer><CircleHelp size={15} /> Dùng phím mũi tên, Home và End để điều hướng nhanh.</footer></div></div>; }
function labelForSlide(slide: Slide) { const heading = slide.components.find((component) => component.type === "heading"); const props = heading?.props as { title?: string } | undefined; return props?.title ?? slide.id; }
