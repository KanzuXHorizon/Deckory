"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
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
  Minimize2,
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
import { deckThemeClassName } from "../lib/deck-theme";
import {
  createPresenterSyncMessage,
  describeAudienceFullscreen,
  describeOfflineStatus,
  formatElapsedTime,
  getNavigationDirection,
  getNextPreviewCue,
  isAudiencePresenceFresh,
  isDeckInteractiveTarget,
  isEditableTarget,
  isPresenterSyncMessage,
  prepareOfflineCache,
  resolvePresenterKeyboardAction,
  resolveRequestedSlideIndex,
  toggleFullscreenMode,
  PRESENTER_CHANNEL_NAME,
  PRESENTER_STORAGE_KEY,
  type FullscreenResult,
  type OfflineStatus,
  type PresentationView,
  type PresenterSyncMessage
} from "./presenter-runtime";
import { DeckoryBrand } from "./brand-mark";
import { ScaledSlidePreview } from "./deck-thumbnail";
import { getSlideMotion, type NavigationDirection } from "./motion-system";
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
  const [audienceFullscreen, setAudienceFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [noteScale, setNoteScale] = useState(1);
  const [wallClock, setWallClock] = useState(() => new Date());
  const stateRef = useRef(state);
  const blackoutRef = useRef(blackout);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audienceWindowRef = useRef<Window | null>(null);
  const audienceLastSeenRef = useRef(0);
  const revisionRef = useRef(0);
  const previousSlideIndexRef = useRef(state.slideIndex);
  const overviewReturnFocusRef = useRef<HTMLElement | null>(null);
  const locationResolvedRef = useRef(false);
  const sourceIdRef = useRef(`${view}-${Math.random().toString(36).slice(2)}`);

  const currentSlide = deck.slides[state.slideIndex] ?? deck.slides[0]!;
  const currentSequenceCount = sequenceCounts[state.slideIndex] ?? 0;
  const nextPreviewCue = getNextPreviewCue(state.slideIndex, state.sequenceStep, sequenceCounts);
  const nextPreviewSlide = nextPreviewCue.kind === "end" ? undefined : deck.slides[nextPreviewCue.slideIndex];
  const nextPreviewTitle = nextPreviewCue.kind === "reveal"
    ? `Hiện tiếp ${nextPreviewCue.sequenceStep}/${currentSequenceCount} · ${labelForSlide(currentSlide)}`
    : nextPreviewSlide
      ? labelForSlide(nextPreviewSlide)
      : "Kết thúc presentation";
  const nextPreviewIndex = nextPreviewCue.kind === "reveal"
    ? `${String(state.slideIndex + 1).padStart(2, "0")} · ${nextPreviewCue.sequenceStep}/${currentSequenceCount}`
    : nextPreviewCue.kind === "slide"
      ? String(nextPreviewCue.slideIndex + 1).padStart(2, "0")
      : null;
  const navigationDirection = getNavigationDirection(previousSlideIndexRef.current, state.slideIndex);
  const offlineCopy = describeOfflineStatus(offlineStatus, isOnline);
  const storageKey = `${PRESENTER_STORAGE_KEY}:${deck.id}`;

  stateRef.current = state;
  blackoutRef.current = blackout;

  useEffect(() => {
    previousSlideIndexRef.current = state.slideIndex;
  }, [state.slideIndex]);

  const dispatch = useCallback((command: PresenterCommand) => {
    setState((current) => present(current, command));
  }, []);

  const openOverview = useCallback(() => {
    overviewReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setOverviewOpen(true);
  }, []);

  const closeOverview = useCallback(() => {
    setOverviewOpen(false);
    window.requestAnimationFrame(() => {
      const target = overviewReturnFocusRef.current;
      if (target?.isConnected) target.focus();
      overviewReturnFocusRef.current = null;
    });
  }, []);

  const applyRemoteState = useCallback((message: PresenterSyncMessage) => {
    const slideIndex = Math.min(message.slideIndex, sequenceCounts.length - 1);
    const sequenceStep = Math.min(message.sequenceStep, sequenceCounts[slideIndex] ?? 0);
    setState((current) => ({ ...current, slideIndex, sequenceStep }));
    setBlackout(message.blackout);
  }, [sequenceCounts]);

  const createCurrentMessage = useCallback((
    sender: PresentationView,
    audienceAvailable?: boolean,
    audienceFullscreenState?: boolean
  ) => {
    const current = stateRef.current;
    revisionRef.current += 1;
    return createPresenterSyncMessage({
      sourceId: sourceIdRef.current,
      sender,
      slideIndex: current.slideIndex,
      sequenceStep: current.sequenceStep,
      blackout: blackoutRef.current,
      revision: revisionRef.current,
      ...(sender === "audience" ? {
        audienceAvailable: audienceAvailable ?? true,
        audienceFullscreen: audienceFullscreenState ?? Boolean(document.fullscreenElement)
      } : {})
    });
  }, []);

  const publishSyncMessage = useCallback((message: PresenterSyncMessage) => {
    channelRef.current?.postMessage(message);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(message));
    } catch {
      // BroadcastChannel remains available when storage is restricted.
    }
  }, [storageKey]);

  const publishPresenterState = useCallback(() => {
    publishSyncMessage(createCurrentMessage("presenter"));
  }, [createCurrentMessage, publishSyncMessage]);

  const publishAudiencePresence = useCallback((available = true) => {
    publishSyncMessage(createCurrentMessage("audience", available, Boolean(document.fullscreenElement)));
  }, [createCurrentMessage, publishSyncMessage]);

  useEffect(() => {
    if (!locationResolvedRef.current) {
      locationResolvedRef.current = true;
      const slideIndex = resolveRequestedSlideIndex(
        window.location.search,
        deck.slides.map((slide) => slide.id)
      );
      if (slideIndex >= 0 && slideIndex !== stateRef.current.slideIndex) {
        setState((current) => present(current, { type: "GOTO", slideIndex }));
        return;
      }
    }

    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    url.searchParams.set("slide", currentSlide.id);
    window.history.replaceState(null, "", url);
    document.title = view === "audience" ? deck.title : `${deck.title} · Presenter`;
  }, [currentSlide.id, deck.slides, deck.title, view]);

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
    const updateFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    setFullscreenSupported(
      document.fullscreenEnabled !== false
      && typeof document.documentElement.requestFullscreen === "function"
    );
    updateFullscreenState();
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  const handleToggleFullscreen = useCallback(async (): Promise<FullscreenResult> => {
    const result = await toggleFullscreenMode(document);
    setIsFullscreen(
      result === "entered"
        ? true
        : result === "exited"
          ? false
          : Boolean(document.fullscreenElement)
    );
    if (result === "unsupported") setFullscreenSupported(false);
    return result;
  }, []);

  useEffect(() => {
    const handleMessage = (message: PresenterSyncMessage) => {
      if (message.sourceId === sourceIdRef.current) return;
      if (view === "presenter" && message.sender === "audience") {
        if (message.audienceAvailable === false) {
          audienceLastSeenRef.current = 0;
          setAudienceStatus("closed");
          setAudienceFullscreen(false);
          return;
        }
        audienceLastSeenRef.current = Date.now();
        setAudienceStatus("connected");
        setAudienceFullscreen(Boolean(message.audienceFullscreen));
        publishPresenterState();
        return;
      }
      if (view === "audience" && message.sender === "presenter") applyRemoteState(message);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        const message: unknown = JSON.parse(event.newValue);
        if (isPresenterSyncMessage(message)) handleMessage(message);
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
        const cached: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
        if (isPresenterSyncMessage(cached) && cached.sender === "presenter") applyRemoteState(cached);
      } catch {
        // The next broadcast restores the state.
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [applyRemoteState, deck.id, publishPresenterState, storageKey, view]);

  useEffect(() => {
    if (view === "presenter") publishPresenterState();
  }, [blackout, publishPresenterState, state.sequenceStep, state.slideIndex, view]);

  useEffect(() => {
    if (view !== "audience") return;

    const publishPresence = () => publishAudiencePresence(true);
    const publishUnavailable = () => publishAudiencePresence(false);
    publishPresence();
    const heartbeat = window.setInterval(publishPresence, 2_500);
    window.addEventListener("pagehide", publishUnavailable);
    window.addEventListener("beforeunload", publishUnavailable);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pagehide", publishUnavailable);
      window.removeEventListener("beforeunload", publishUnavailable);
    };
  }, [isFullscreen, publishAudiencePresence, view]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWallClock(new Date());
      if (timerRunning) setElapsedSeconds((seconds) => seconds + 1);
      if (audienceWindowRef.current?.closed) {
        audienceWindowRef.current = null;
        audienceLastSeenRef.current = 0;
        setAudienceStatus("closed");
        setAudienceFullscreen(false);
        return;
      }
      if (!isAudiencePresenceFresh(audienceLastSeenRef.current)) {
        setAudienceStatus((current) => current === "connected" || current === "connecting" ? "closed" : current);
        setAudienceFullscreen(false);
      }
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target as HTMLElement) || isDeckInteractiveTarget(event.target as HTMLElement)) return;
      const action = resolvePresenterKeyboardAction(event.key, {
        overviewOpen,
        presenterView: view === "presenter"
      });
      if (!action) return;

      event.preventDefault();
      switch (action) {
        case "next":
          dispatch({ type: "NEXT" });
          return;
        case "previous":
          dispatch({ type: "PREVIOUS" });
          return;
        case "home":
          dispatch({ type: "HOME" });
          return;
        case "end":
          dispatch({ type: "END" });
          return;
        case "toggle-blackout":
          setBlackout((value) => !value);
          return;
        case "toggle-fullscreen":
          void handleToggleFullscreen();
          return;
        case "toggle-overview":
          openOverview();
          return;
        case "close-overview":
          closeOverview();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOverview, dispatch, handleToggleFullscreen, openOverview, overviewOpen, view]);

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
      audienceLastSeenRef.current = 0;
      setAudienceFullscreen(false);
      setAudienceStatus("blocked");
      return;
    }
    audienceWindowRef.current = audienceWindow;
    audienceLastSeenRef.current = Date.now();
    audienceWindow.focus();
    publishPresenterState();
    setAudienceFullscreen(false);
    setAudienceStatus("connecting");
    if (elapsedSeconds === 0) setTimerRunning(true);
  };

  const closeAudienceView = () => {
    audienceWindowRef.current?.close();
    audienceWindowRef.current = null;
    audienceLastSeenRef.current = 0;
    setAudienceFullscreen(false);
    setAudienceStatus("closed");
  };

  if (view === "audience") {
    return (
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
        <AudienceView
          slide={currentSlide}
          deckId={deck.id}
          sequenceStep={state.sequenceStep}
          blackout={blackout}
          reducedMotion={Boolean(reducedMotion)}
          direction={navigationDirection}
          themeClassName={deckThemeClassName(deck)}
          isFullscreen={isFullscreen}
          fullscreenSupported={fullscreenSupported}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </MotionConfig>
    );
  }

  const progressStyle = {
    "--deck-progress-scale": String((state.slideIndex + 1) / deck.slides.length),
    "--reveal-progress-scale": String(currentSequenceCount === 0 ? 1 : state.sequenceStep / currentSequenceCount),
    "--note-scale": String(noteScale)
  } as CSSProperties;

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
      <main className={`presenter-shell ${deckThemeClassName(deck)}`} style={progressStyle}>
        <PresenterHeader
          deck={deck}
          modeLabel={modeLabel}
          audienceStatus={audienceStatus}
          audienceFullscreen={audienceFullscreen}
          offlineStatus={offlineStatus}
          offlineLabel={offlineCopy.label}
          offlineDescription={offlineCopy.description}
          returnHref={returnHref}
          editHref={editHref}
          onOpenAudience={openAudienceView}
          onCloseAudience={closeAudienceView}
          onOverview={openOverview}
          onFullscreen={() => void handleToggleFullscreen()}
        />

        <div className="presenter-workspace">
          <section className="presenter-main-stage" aria-label="Slide đang trình chiếu">
            <div className="panel-heading stage-heading">
              <div><span className="section-label">ĐANG TRÌNH CHIẾU</span><strong>{labelForSlide(currentSlide)}</strong></div>
              <div className="slide-position" aria-label={`Slide ${state.slideIndex + 1} trên ${deck.slides.length}`}><span>{String(state.slideIndex + 1).padStart(2, "0")}</span><i /><span>{String(deck.slides.length).padStart(2, "0")}</span></div>
            </div>
            <div className="presenter-stage-canvas">
              <AnimatedSlide
                slide={currentSlide}
                deckId={deck.id}
                sequenceStep={state.sequenceStep}
                reducedMotion={Boolean(reducedMotion)}
                direction={navigationDirection}
              />
              {blackout && <div className="presenter-blackout-notice" role="status"><Square size={14} fill="currentColor" />Màn hình khán giả đang tạm ẩn</div>}
            </div>
            <div className="stage-meta-row">
              <div className="reveal-status"><span>Reveal</span><div className="mini-progress" aria-hidden="true"><i /></div><strong>{state.sequenceStep}/{currentSequenceCount}</strong></div>
              <div className="shortcut-hint"><kbd>←</kbd><kbd>→</kbd><span>điều hướng</span><kbd>B</kbd><span>ẩn màn hình</span><kbd>O</kbd><span>tổng quan</span></div>
            </div>
          </section>

          <aside className="presenter-side-column" aria-label="Thông tin hỗ trợ người thuyết trình">
            <section className="presenter-panel next-panel">
              <div className="panel-heading compact"><div><span className="section-label">TIẾP THEO</span><strong>{nextPreviewTitle}</strong></div>{nextPreviewIndex && <span className="next-index">{nextPreviewIndex}</span>}</div>
              <div className="next-slide-preview">
                {nextPreviewSlide && nextPreviewCue.kind !== "end"
                  ? <ScaledSlidePreview slide={nextPreviewSlide} deckId={deck.id} sequenceStep={nextPreviewCue.sequenceStep} className="next-slide-preview-canvas" />
                  : <div className="end-preview"><CheckCircle2 size={28} /><strong>Đã đến slide cuối</strong><span>Sẵn sàng kết thúc và chuyển sang phần trao đổi.</span></div>}
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

        {overviewOpen && <SlideOverview slides={deck.slides} deckId={deck.id} sequenceCounts={sequenceCounts} currentSlideIndex={state.slideIndex} onClose={closeOverview} onSelect={(slideIndex) => { dispatch({ type: "GOTO", slideIndex }); closeOverview(); }} />}
      </main>
    </MotionConfig>
  );
}

function PresenterHeader({ deck, modeLabel, audienceStatus, audienceFullscreen, offlineStatus, offlineLabel, offlineDescription, returnHref, editHref, onOpenAudience, onCloseAudience, onOverview, onFullscreen }: {
  deck: DeckDocument;
  modeLabel: string;
  audienceStatus: AudienceStatus;
  audienceFullscreen: boolean;
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
        <div
          className={`status-chip status-chip--audience ${connected ? "is-connected" : ""} ${audienceFullscreen ? "is-fullscreen" : ""}`}
          title={audienceStatusDescription(audienceStatus, audienceFullscreen)}
        ><span className="status-dot" /><span>{audienceStatusLabel(audienceStatus, audienceFullscreen)}</span></div>
      </div>
      <div className="topbar-actions">
        <Link className="toolbar-button" href={returnHref}><ArrowLeft size={17} /><span>Hub</span></Link>
        {editHref && <Link className="toolbar-button" href={editHref}><PencilLine size={16} /><span>Chỉnh sửa</span></Link>}
        <button type="button" className="toolbar-button" onClick={onOverview}><Grid2X2 size={17} /><span>Tổng quan</span></button>
        <button type="button" className="toolbar-button icon-only" onClick={onFullscreen} aria-label="Toàn màn hình cửa sổ presenter"><Expand size={17} /></button>
        {connected ? <button type="button" className="toolbar-button" onClick={onCloseAudience}><X size={17} /><span>Đóng màn hình</span></button> : <button type="button" className="toolbar-button primary" onClick={onOpenAudience}><ScreenShare size={17} /><span>{audienceStatus === "blocked" ? "Thử mở lại" : "Mở màn hình khán giả"}</span></button>}
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
        {audienceStatus !== "connected" && <button type="button" className="transport-action audience-action" onClick={onOpenAudience}><MonitorPlay size={17} /><span>{audienceStatus === "blocked" ? "Thử kết nối lại" : "Kết nối khán giả"}</span><ExternalLink size={13} /></button>}
      </div>
    </footer>
  );
}

export function AudienceView({
  slide,
  deckId,
  sequenceStep,
  blackout,
  reducedMotion,
  direction,
  themeClassName,
  isFullscreen,
  fullscreenSupported,
  onToggleFullscreen
}: {
  slide: Slide;
  deckId: string;
  sequenceStep: number;
  blackout: boolean;
  reducedMotion: boolean;
  direction: NavigationDirection;
  themeClassName: string;
  isFullscreen: boolean;
  fullscreenSupported: boolean;
  onToggleFullscreen: () => Promise<FullscreenResult>;
}) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const fullscreenCopy = describeAudienceFullscreen(isFullscreen, fullscreenSupported);

  const revealControls = useCallback((duration = 2_800) => {
    if (hideControlsTimerRef.current !== null) window.clearTimeout(hideControlsTimerRef.current);
    setControlsVisible(true);
    hideControlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), duration);
  }, []);

  const announceFeedback = useCallback((message: string) => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    setFeedback(message);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 3_600);
  }, []);

  const requestFullscreen = useCallback(async () => {
    const result = await onToggleFullscreen();
    const message = result === "entered"
      ? "Đã bật toàn màn hình. Nhấn F hoặc Esc để thoát."
      : result === "exited"
        ? "Đã trở lại chế độ cửa sổ."
        : result === "unsupported"
          ? "Trình duyệt này không hỗ trợ toàn màn hình cho cửa sổ trình chiếu."
          : "Không thể bật toàn màn hình. Hãy cho phép quyền trình duyệt rồi thử lại.";
    announceFeedback(message);
    revealControls(result === "error" || result === "unsupported" ? 5_000 : 3_200);
  }, [announceFeedback, onToggleFullscreen, revealControls]);

  useEffect(() => {
    revealControls(4_800);
    return () => {
      if (hideControlsTimerRef.current !== null) window.clearTimeout(hideControlsTimerRef.current);
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    };
  }, [revealControls]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target as HTMLElement) || isDeckInteractiveTarget(event.target as HTMLElement)) return;
      if (event.key.toLowerCase() !== "f") return;
      event.preventDefault();
      void requestFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestFullscreen]);

  return (
    <main
      className={`audience-shell ${themeClassName} ${blackout ? "is-blackout" : ""} ${controlsVisible ? "" : "is-idle"} ${isFullscreen ? "is-fullscreen" : ""}`}
      aria-label={`Màn hình trình chiếu: ${labelForSlide(slide)}`}
      onPointerMove={() => revealControls()}
      onPointerDown={() => revealControls(4_000)}
      onFocusCapture={() => revealControls(5_000)}
      onDoubleClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        void requestFullscreen();
      }}
    >
      <div className="audience-stage"><AnimatedSlide slide={slide} deckId={deckId} sequenceStep={sequenceStep} reducedMotion={reducedMotion} direction={direction} /></div>

      <div className="audience-utility" role="group" aria-label="Điều khiển màn hình khán giả">
        <div className="audience-utility-copy">
          <span className="audience-live-dot" aria-hidden="true" />
          <div><strong>Màn hình khán giả</strong><span>{fullscreenCopy.hint}</span></div>
        </div>
        <button
          type="button"
          onClick={() => void requestFullscreen()}
          disabled={!fullscreenSupported}
          aria-pressed={isFullscreen}
          title={fullscreenCopy.hint}
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Expand size={17} />}
          <span>{fullscreenCopy.label}</span>
          <kbd>F</kbd>
        </button>
      </div>

      <AnimatePresence>{feedback && <motion.div className="audience-feedback" role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>{feedback}</motion.div>}</AnimatePresence>
      <AnimatePresence>{blackout && <motion.div className="audience-blackout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
      <span className="sr-only" aria-live="polite">{labelForSlide(slide)}</span>
    </main>
  );
}

function AnimatedSlide({ slide, deckId, sequenceStep, reducedMotion, direction }: { slide: Slide; deckId: string; sequenceStep: number; reducedMotion: boolean; direction: NavigationDirection }) {
  const slideMotion = getSlideMotion(slide.transition, direction, reducedMotion);
  const presenceMode = slide.transition?.type === "push" || slide.transition?.type === "morph" ? "sync" : "wait";

  return (
    <AnimatePresence mode={presenceMode} initial={false}>
      <motion.div
        key={slide.id}
        className="animated-slide"
        data-transition={slide.transition?.type ?? "fade"}
        initial={slideMotion.initial}
        animate={slideMotion.animate}
        exit={slideMotion.exit}
        transition={slideMotion.transition}
      >
        <div className="animated-slide-canvas">
          <SlideFrame slide={slide} deckId={deckId} sequenceStep={sequenceStep} reducedMotion={reducedMotion} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function SlideOverview({ slides, deckId, sequenceCounts, currentSlideIndex, onClose, onSelect }: { slides: Slide[]; deckId: string; sequenceCounts: readonly number[]; currentSlideIndex: number; onClose: () => void; onSelect: (slideIndex: number) => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const currentCard = panel.querySelector<HTMLElement>('[data-overview-current="true"]');
    const closeButton = panel.querySelector<HTMLElement>(".overview-close");
    window.requestAnimationFrame(() => (currentCard ?? closeButton ?? panel).focus());
  }, []);

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;
    const focusable = [...panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.getAttribute("aria-hidden") !== "true");
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0]!;
    const last = focusable.at(-1)!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="overview-backdrop">
      <div
        ref={panelRef}
        className="overview-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overview-title"
        aria-describedby="overview-description"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
      >
        <header className="overview-header">
          <div>
            <span className="section-label">SLIDE OVERVIEW</span>
            <h2 id="overview-title">Chọn nơi bạn muốn tiếp tục</h2>
            <p id="overview-description">Xem toàn bộ mạch kể chuyện mà không làm gián đoạn màn hình khán giả.</p>
          </div>
          <button type="button" className="overview-close" onClick={onClose} aria-label="Đóng tổng quan"><X size={20} /></button>
        </header>
        <div className="overview-grid">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              className={`overview-card ${index === currentSlideIndex ? "is-current" : ""}`}
              data-overview-current={index === currentSlideIndex ? "true" : undefined}
              onClick={() => onSelect(index)}
              aria-label={`Mở slide ${index + 1}: ${labelForSlide(slide)}`}
              aria-current={index === currentSlideIndex ? "page" : undefined}
            >
              <span className="overview-card-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="overview-preview"><ScaledSlidePreview slide={slide} deckId={deckId} sequenceStep={sequenceCounts[index] ?? 0} className="overview-preview-canvas" /></div>
              <div className="overview-card-copy"><strong>{labelForSlide(slide)}</strong><span>{slide.layout}</span></div>
            </button>
          ))}
        </div>
        <footer className="overview-footer"><CircleHelp size={16} /><span>Dùng Tab để duyệt slide, Enter để chọn và Esc để trở lại Presenter.</span></footer>
      </div>
    </div>
  );
}

function audienceStatusLabel(status: AudienceStatus, fullscreen = false) {
  switch (status) {
    case "connected": return fullscreen ? "Khán giả · Toàn màn hình" : "Màn hình đã kết nối";
    case "connecting": return "Đang kết nối";
    case "blocked": return "Popup bị chặn";
    case "closed": return "Chưa mở màn hình";
  }
}

function audienceStatusDescription(status: AudienceStatus, fullscreen: boolean) {
  switch (status) {
    case "connected": return fullscreen
      ? "Màn hình khán giả đang kết nối và hiển thị toàn màn hình."
      : "Màn hình khán giả đang kết nối ở chế độ cửa sổ. Nhấn F trên màn hình đó để bật toàn màn hình.";
    case "connecting": return "Đang chờ cửa sổ khán giả phản hồi.";
    case "blocked": return "Trình duyệt đã chặn popup. Hãy cho phép popup cho Deckory rồi thử lại.";
    case "closed": return "Chưa có màn hình khán giả đang hoạt động.";
  }
}

function labelForSlide(slide: Slide) {
  const heading = slide.components.find((component) => component.type === "heading");
  if (heading?.type === "heading") return heading.props.title;
  const statement = slide.components.find((component) => component.type === "statement");
  if (statement?.type === "statement") return statement.props.quote;
  return slide.id;
}
