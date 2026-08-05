"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Expand,
  ExternalLink,
  Grid2X2,
  MonitorPlay,
  Pause,
  PencilLine,
  Play,
  ScreenShare,
  Square,
  TimerReset,
  Wifi,
  WifiOff,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { initialPresenterState, present, type PresenterCommand, type PresenterState } from "@deckory/core";
import type { DeckDocument, Slide } from "@deckory/schema";
import {
  createPresenterSyncMessage,
  describeOfflineStatus,
  formatElapsedTime,
  isEditableTarget,
  isPresenterSyncMessage,
  prepareOfflineCache,
  PRESENTER_CHANNEL_NAME,
  PRESENTER_STORAGE_KEY,
  type OfflineStatus,
  type PresentationView,
  type PresenterSyncMessage
} from "./presenter-runtime";
import { DeckoryBrand } from "./brand-mark";
import { SlideFrame } from "./slide-frame";

type AudienceStatus = "closed" | "connecting" | "connected" | "blocked";

type PresenterProps = {
  deck: DeckDocument;
  view?: PresentationView;
  returnHref?: string;
  editHref?: string;
  modeLabel?: string;
};

export function Presenter({
  deck,
  view = "presenter",
  returnHref = "/",
  editHref,
  modeLabel = "DECKORY PRESENT"
}: PresenterProps) {
  const reducedMotion = useReducedMotion();
  const sequenceCounts = useMemo(
    () => deck.slides.map((slide) => Math.max(0, ...slide.components.map((component) => component.sequence ?? 0))),
    [deck.slides]
  );
  const [state, setState] = useState(() => initialPresenterState(sequenceCounts));
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>("checking");
  const [isOnline, setIsOnline] = useState(true);
  const [audienceStatus, setAudienceStatus] = useState<AudienceStatus>("closed");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [noteScale, setNoteScale] = useState(1);
  const [wallClock, setWallClock] = useState(() => new Date());
  const stateRef = useRef(state);
  const blackoutRef = useRef(blackout);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audienceWindowRef = useRef<Window | null>(null);
  const revisionRef = useRef(0);
  const sourceIdRef = useRef(`${view}-${Math.random().toString(36).slice(2)}`);

  const currentSlide = deck.slides[state.slideIndex] ?? deck.slides[0]!;
  const nextSlide = deck.slides[state.slideIndex + 1];
  const currentSequenceCount = sequenceCounts[state.slideIndex] ?? 0;
  const offlineCopy = describeOfflineStatus(offlineStatus, isOnline);

  stateRef.current = state;
  blackoutRef.current = blackout;

  const dispatch = useCallback((command: PresenterCommand) => {
    setState((current) => present(current, command));
  }, []);

  const applyRemoteState = useCallback((message: PresenterSyncMessage) => {
    const slideIndex = Math.min(message.slideIndex, sequenceCounts.length - 1);
    const sequenceStep = Math.min(message.sequenceStep, sequenceCounts[slideIndex] ?? 0);
    setState((current) => ({ ...current, slideIndex, sequenceStep }));
    setBlackout(message.blackout);
  }, [sequenceCounts]);

  const createCurrentMessage = useCallback((sender: PresentationView) => {
    const current = stateRef.current;
    revisionRef.current += 1;
    return createPresenterSyncMessage({
      sourceId: sourceIdRef.current,
      sender,
      slideIndex: current.slideIndex,
      sequenceStep: current.sequenceStep,
      blackout: blackoutRef.current,
      revision: revisionRef.current
    });
  }, []);

  const publishPresenterState = useCallback(() => {
    const message = createCurrentMessage("presenter");
    channelRef.current?.postMessage(message);
    try {
      window.localStorage.setItem(PRESENTER_STORAGE_KEY, JSON.stringify(message));
    } catch {
      // BroadcastChannel remains available when storage is restricted.
    }
  }, [createCurrentMessage]);

  useEffect(() => {
    const slideId = new URLSearchParams(window.location.search).get("slide");
    const slideIndex = deck.slides.findIndex((slide) => slide.id === slideId);
    if (slideIndex >= 0) setState((current) => present(current, { type: "GOTO", slideIndex }));
  }, [deck.slides]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    url.searchParams.set("slide", currentSlide.id);
    window.history.replaceState(null, "", url);
    document.title = view === "audience" ? deck.title : `${deck.title} · Presenter`;
  }, [currentSlide.id, deck.title, view]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void prepareOfflineCache().then(setOfflineStatus);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (message: PresenterSyncMessage) => {
      if (message.sourceId === sourceIdRef.current) return;
      if (view === "presenter" && message.sender === "audience") {
        setAudienceStatus("connected");
        publishPresenterState();
        return;
      }
      if (view === "audience" && message.sender === "presenter") applyRemoteState(message);
    };

    const handleStorage = (event: StorageEvent) => {
      if (view !== "audience" || event.key !== PRESENTER_STORAGE_KEY || !event.newValue) return;
      try {
        const message: unknown = JSON.parse(event.newValue);
        if (isPresenterSyncMessage(message) && message.sender === "presenter") applyRemoteState(message);
      } catch {
        // Ignore malformed stale state.
      }
    };

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(`${PRESENTER_CHANNEL_NAME}:${deck.id}`);
      channelRef.current = channel;
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (isPresenterSyncMessage(event.data)) handleMessage(event.data);
      };
    }

    window.addEventListener("storage", handleStorage);

    if (view === "audience") {
      try {
        const cached: unknown = JSON.parse(window.localStorage.getItem(PRESENTER_STORAGE_KEY) ?? "null");
        if (isPresenterSyncMessage(cached) && cached.sender === "presenter") applyRemoteState(cached);
      } catch {
        // The next broadcast restores the state.
      }
      channelRef.current?.postMessage(createCurrentMessage("audience"));
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [applyRemoteState, createCurrentMessage, deck.id, publishPresenterState, view]);

  useEffect(() => {
    if (view === "presenter") publishPresenterState();
  }, [blackout, publishPresenterState, state.sequenceStep, state.slideIndex, view]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWallClock(new Date());
      if (timerRunning) setElapsedSeconds((seconds) => seconds + 1);
      if (audienceWindowRef.current?.closed) {
        audienceWindowRef.current = null;
        setAudienceStatus("closed");
      }
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target as HTMLElement)) return;
      const key = event.key.toLowerCase();
      if (["arrowright", "pagedown", " "].includes(key)) {
        event.preventDefault();
        dispatch({ type: "NEXT" });
      } else if (["arrowleft", "pageup"].includes(key)) {
        event.preventDefault();
        dispatch({ type: "PREVIOUS" });
      } else if (key === "home") {
        event.preventDefault();
        dispatch({ type: "HOME" });
      } else if (key === "end") {
        event.preventDefault();
        dispatch({ type: "END" });
      } else if (key === "b") {
        event.preventDefault();
        setBlackout((value) => !value);
      } else if (key === "f") {
        event.preventDefault();
        void toggleFullscreen();
      } else if (view === "presenter" && key === "o") {
        event.preventDefault();
        setOverviewOpen((value) => !value);
      } else if (key === "escape") {
        setOverviewOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, view]);

  const openAudienceView = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "audience");
    url.searchParams.set("slide", currentSlide.id);
    const audienceWindow = window.open(
      url,
      "deckory-audience",
      "popup=yes,width=1600,height=900,menubar=no,toolbar=no,location=no,status=no"
    );
    if (!audienceWindow) {
      setAudienceStatus("blocked");
      return;
    }
    audienceWindowRef.current = audienceWindow;
    audienceWindow.focus();
    setAudienceStatus("connecting");
    if (elapsedSeconds === 0) setTimerRunning(true);
  };

  const closeAudienceView = () => {
    audienceWindowRef.current?.close();
    audienceWindowRef.current = null;
    setAudienceStatus("closed");
  };

  if (view === "audience") {
    return (
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
        <AudienceView slide={currentSlide} sequenceStep={state.sequenceStep} blackout={blackout} reducedMotion={Boolean(reducedMotion)} />
      </MotionConfig>
    );
  }

  const progressStyle = {
    "--deck-progress": `${((state.slideIndex + 1) / deck.slides.length) * 100}%`,
    "--reveal-progress": `${currentSequenceCount === 0 ? 100 : (state.sequenceStep / currentSequenceCount) * 100}%`,
    "--note-scale": String(noteScale)
  } as CSSProperties;

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
      <main className="presenter-shell" style={progressStyle}>
        <PresenterHeader
          deck={deck}
          modeLabel={modeLabel}
          audienceStatus={audienceStatus}
          offlineStatus={offlineStatus}
          offlineLabel={offlineCopy.label}
          offlineDescription={offlineCopy.description}
          returnHref={returnHref}
          editHref={editHref}
          onOpenAudience={openAudienceView}
          onCloseAudience={closeAudienceView}
          onOverview={() => setOverviewOpen(true)}
          onFullscreen={() => void toggleFullscreen()}
        />

        <div className="presenter-workspace">
          <section className="presenter-main-stage" aria-label="Slide đang trình chiếu">
            <div className="panel-heading stage-heading">
              <div><span className="section-label">ĐANG TRÌNH CHIẾU</span><strong>{labelForSlide(currentSlide)}</strong></div>
              <div className="slide-position" aria-label={`Slide ${state.slideIndex + 1} trên ${deck.slides.length}`}><span>{String(state.slideIndex + 1).padStart(2, "0")}</span><i /><span>{String(deck.slides.length).padStart(2, "0")}</span></div>
            </div>
            <div className="presenter-stage-canvas">
              <AnimatedSlide slide={currentSlide} sequenceStep={state.sequenceStep} reducedMotion={Boolean(reducedMotion)} />
              {blackout && <div className="presenter-blackout-notice" role="status"><Square size={14} fill="currentColor" />Màn hình khán giả đang tạm ẩn</div>}
            </div>
            <div className="stage-meta-row">
              <div className="reveal-status"><span>Reveal</span><div className="mini-progress" aria-hidden="true"><i /></div><strong>{state.sequenceStep}/{currentSequenceCount}</strong></div>
              <div className="shortcut-hint"><kbd>←</kbd><kbd>→</kbd><span>điều hướng</span><kbd>B</kbd><span>ẩn màn hình</span><kbd>O</kbd><span>tổng quan</span></div>
            </div>
          </section>

          <aside className="presenter-side-column" aria-label="Thông tin hỗ trợ người thuyết trình">
            <section className="presenter-panel next-panel">
              <div className="panel-heading compact"><div><span className="section-label">TIẾP THEO</span><strong>{nextSlide ? labelForSlide(nextSlide) : "Kết thúc presentation"}</strong></div>{nextSlide && <span className="next-index">{String(state.slideIndex + 2).padStart(2, "0")}</span>}</div>
              <div className="next-slide-preview">
                {nextSlide ? <SlideFrame slide={nextSlide} sequenceStep={0} reducedMotion /> : <div className="end-preview"><CheckCircle2 size={28} /><strong>Đã đến slide cuối</strong><span>Sẵn sàng kết thúc và chuyển sang phần trao đổi.</span></div>}
              </div>
            </section>

            <section className="presenter-panel notes-panel">
              <div className="panel-heading compact notes-heading">
                <div><span className="section-label">GHI CHÚ NGƯỜI THUYẾT TRÌNH</span><strong>Điểm cần nhấn mạnh</strong></div>
                <div className="note-size-actions" aria-label="Cỡ chữ ghi chú"><button type="button" onClick={() => setNoteScale((value) => Math.max(0.85, value - 0.1))} aria-label="Giảm cỡ chữ ghi chú"><ZoomOut size={15} /></button><button type="button" onClick={() => setNoteScale((value) => Math.min(1.35, value + 0.1))} aria-label="Tăng cỡ chữ ghi chú"><ZoomIn size={15} /></button></div>
              </div>
              <div className="speaker-note-copy" tabIndex={0}>{currentSlide.notes || "Slide này chưa có ghi chú. Hãy tập trung vào kết luận chính trên màn hình."}</div>
            </section>
          </aside>
        </div>

        <PresenterTransport
          state={state}
          slideCount={deck.slides.length}
          elapsedSeconds={elapsedSeconds}
          wallClock={wallClock}
          timerRunning={timerRunning}
          blackout={blackout}
          audienceStatus={audienceStatus}
          onPrevious={() => dispatch({ type: "PREVIOUS" })}
          onNext={() => dispatch({ type: "NEXT" })}
          onToggleTimer={() => setTimerRunning((value) => !value)}
          onResetTimer={() => { setElapsedSeconds(0); setTimerRunning(false); }}
          onToggleBlackout={() => setBlackout((value) => !value)}
          onOpenAudience={openAudienceView}
        />

        {overviewOpen && <SlideOverview slides={deck.slides} sequenceCounts={sequenceCounts} currentSlideIndex={state.slideIndex} onClose={() => setOverviewOpen(false)} onSelect={(slideIndex) => { dispatch({ type: "GOTO", slideIndex }); setOverviewOpen(false); }} />}
      </main>
    </MotionConfig>
  );
}

function PresenterHeader({ deck, modeLabel, audienceStatus, offlineStatus, offlineLabel, offlineDescription, returnHref, editHref, onOpenAudience, onCloseAudience, onOverview, onFullscreen }: {
  deck: DeckDocument;
  modeLabel: string;
  audienceStatus: AudienceStatus;
  offlineStatus: OfflineStatus;
  offlineLabel: string;
  offlineDescription: string;
  returnHref: string;
  editHref: string | undefined;
  onOpenAudience: () => void;
  onCloseAudience: () => void;
  onOverview: () => void;
  onFullscreen: () => void;
}) {
  const connected = audienceStatus === "connected";
  return (
    <header className="presenter-topbar">
      <div className="presenter-brand"><DeckoryBrand /><span>Presenter Console</span></div>
      <div className="deck-title-block"><span>{modeLabel}</span><h1>{deck.title}</h1></div>
      <div className="topbar-statuses">
        <div className={`status-chip status-chip--${offlineStatus}`} title={offlineDescription}>{offlineStatus === "ready" ? <Wifi size={14} /> : <WifiOff size={14} />}<span>{offlineLabel}</span></div>
        <div className={`status-chip status-chip--audience ${connected ? "is-connected" : ""}`}><span className="status-dot" /><span>{audienceStatusLabel(audienceStatus)}</span></div>
      </div>
      <div className="topbar-actions">
        <Link className="toolbar-button" href={returnHref}><ArrowLeft size={17} /><span>Hub</span></Link>
        {editHref && <Link className="toolbar-button" href={editHref}><PencilLine size={16} /><span>Chỉnh sửa</span></Link>}
        <button type="button" className="toolbar-button" onClick={onOverview}><Grid2X2 size={17} /><span>Tổng quan</span></button>
        <button type="button" className="toolbar-button icon-only" onClick={onFullscreen} aria-label="Toàn màn hình cửa sổ presenter"><Expand size={17} /></button>
        {connected ? <button type="button" className="toolbar-button" onClick={onCloseAudience}><X size={17} /><span>Đóng màn hình</span></button> : <button type="button" className="toolbar-button primary" onClick={onOpenAudience}><ScreenShare size={17} /><span>Mở màn hình khán giả</span></button>}
      </div>
    </header>
  );
}

function PresenterTransport({ state, slideCount, elapsedSeconds, wallClock, timerRunning, blackout, audienceStatus, onPrevious, onNext, onToggleTimer, onResetTimer, onToggleBlackout, onOpenAudience }: {
  state: PresenterState;
  slideCount: number;
  elapsedSeconds: number;
  wallClock: Date;
  timerRunning: boolean;
  blackout: boolean;
  audienceStatus: AudienceStatus;
  onPrevious: () => void;
  onNext: () => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onToggleBlackout: () => void;
  onOpenAudience: () => void;
}) {
  return (
    <footer className="presenter-transport" aria-label="Điều khiển presentation">
      <div className="transport-progress"><div className="deck-progress-track" aria-hidden="true"><i /></div><span>{Math.round(((state.slideIndex + 1) / slideCount) * 100)}% hoàn thành</span></div>
      <div className="timer-cluster">
        <div className="clock-readout"><Clock3 size={17} /><div><span>Thời gian</span><strong>{formatElapsedTime(elapsedSeconds)}</strong></div></div>
        <button type="button" className="transport-icon" onClick={onToggleTimer} aria-label={timerRunning ? "Tạm dừng đồng hồ" : "Chạy đồng hồ"}>{timerRunning ? <Pause size={17} /> : <Play size={17} />}</button>
        <button type="button" className="transport-icon" onClick={onResetTimer} aria-label="Đặt lại đồng hồ"><TimerReset size={17} /></button>
        <div className="wall-clock"><span>Hiện tại</span><strong>{wallClock.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</strong></div>
      </div>
      <div className="primary-navigation">
        <button type="button" onClick={onPrevious} disabled={state.slideIndex === 0 && state.sequenceStep === 0} aria-label="Quay lại"><ChevronLeft size={23} /></button>
        <div className="nav-position"><span>SLIDE</span><strong>{state.slideIndex + 1}<i>/</i>{slideCount}</strong></div>
        <button type="button" className="next" onClick={onNext} disabled={state.slideIndex === slideCount - 1 && state.sequenceStep === (state.sequenceCounts[state.slideIndex] ?? 0)} aria-label="Tiếp theo"><ChevronRight size={23} /></button>
      </div>
      <div className="transport-actions">
        <button type="button" className={`transport-action ${blackout ? "is-active" : ""}`} onClick={onToggleBlackout} aria-pressed={blackout}><Square size={16} fill={blackout ? "currentColor" : "none"} /><span>{blackout ? "Hiện màn hình" : "Ẩn màn hình"}</span><kbd>B</kbd></button>
        {audienceStatus !== "connected" && <button type="button" className="transport-action audience-action" onClick={onOpenAudience}><MonitorPlay size={17} /><span>Kết nối khán giả</span><ExternalLink size={13} /></button>}
      </div>
    </footer>
  );
}

function AudienceView({ slide, sequenceStep, blackout, reducedMotion }: { slide: Slide; sequenceStep: number; blackout: boolean; reducedMotion: boolean }) {
  return (
    <main className={`audience-shell ${blackout ? "is-blackout" : ""}`} aria-label={`Màn hình trình chiếu: ${labelForSlide(slide)}`}>
      <div className="audience-stage"><AnimatedSlide slide={slide} sequenceStep={sequenceStep} reducedMotion={reducedMotion} /></div>
      <AnimatePresence>{blackout && <motion.div className="audience-blackout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
      <span className="sr-only" aria-live="polite">{labelForSlide(slide)}</span>
    </main>
  );
}

function AnimatedSlide({ slide, sequenceStep, reducedMotion }: { slide: Slide; sequenceStep: number; reducedMotion: boolean }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={slide.id} className="animated-slide" initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.992 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.006 }} transition={{ duration: reducedMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}>
        <SlideFrame slide={slide} sequenceStep={sequenceStep} reducedMotion={reducedMotion} />
      </motion.div>
    </AnimatePresence>
  );
}

function SlideOverview({ slides, sequenceCounts, currentSlideIndex, onClose, onSelect }: { slides: Slide[]; sequenceCounts: readonly number[]; currentSlideIndex: number; onClose: () => void; onSelect: (slideIndex: number) => void }) {
  return (
    <div className="overview-backdrop" role="dialog" aria-modal="true" aria-label="Tổng quan slide">
      <div className="overview-panel">
        <header className="overview-header"><div><span className="section-label">SLIDE OVERVIEW</span><h2>Chọn nơi bạn muốn tiếp tục</h2><p>Xem toàn bộ mạch kể chuyện mà không làm gián đoạn màn hình khán giả.</p></div><button type="button" className="overview-close" onClick={onClose} aria-label="Đóng tổng quan"><X size={20} /></button></header>
        <div className="overview-grid">
          {slides.map((slide, index) => <button type="button" key={slide.id} className={`overview-card ${index === currentSlideIndex ? "is-current" : ""}`} onClick={() => onSelect(index)} aria-label={`Mở slide ${index + 1}: ${labelForSlide(slide)}`}><span className="overview-card-index">{String(index + 1).padStart(2, "0")}</span><div className="overview-preview"><SlideFrame slide={slide} sequenceStep={sequenceCounts[index] ?? 0} reducedMotion /></div><div className="overview-card-copy"><strong>{labelForSlide(slide)}</strong><span>{slide.layout}</span></div></button>)}
        </div>
        <footer className="overview-footer"><CircleHelp size={16} /><span>Dùng phím mũi tên để điều hướng, <kbd>B</kbd> để tạm ẩn màn hình và <kbd>F</kbd> để bật toàn màn hình.</span></footer>
      </div>
    </div>
  );
}

function audienceStatusLabel(status: AudienceStatus) {
  switch (status) {
    case "connected": return "Màn hình đã kết nối";
    case "connecting": return "Đang kết nối";
    case "blocked": return "Popup bị chặn";
    case "closed": return "Chưa mở màn hình";
  }
}

function labelForSlide(slide: Slide) {
  const heading = slide.components.find((component) => component.type === "heading");
  if (heading?.type === "heading") return heading.props.title;
  const statement = slide.components.find((component) => component.type === "statement");
  if (statement?.type === "statement") return statement.props.quote;
  return slide.id;
}

async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen?.();
}
