export type OfflineStatus = "checking" | "ready" | "online-only" | "unsupported" | "error";
export type PresentationView = "presenter" | "audience";

export type PerformanceResourceLike = { name: string };
export type EditableTargetLike = { tagName?: string; isContentEditable?: boolean } | null;
export type InteractiveTargetLike = { closest?: (selector: string) => unknown } | null;
export type FullscreenResult = "entered" | "exited" | "unsupported" | "error";
export type PresenterKeyboardAction =
  | "next"
  | "previous"
  | "home"
  | "end"
  | "toggle-blackout"
  | "toggle-fullscreen"
  | "toggle-overview"
  | "toggle-laser"
  | "close-overview";
export type FullscreenElementLike = { requestFullscreen?: () => Promise<void> | void };
export type FullscreenDocumentLike = {
  fullscreenElement: unknown | null;
  fullscreenEnabled?: boolean;
  documentElement: FullscreenElementLike;
  exitFullscreen?: () => Promise<void> | void;
};

export type LaserPointerState = {
  enabled: boolean;
  visible: boolean;
  x: number;
  y: number;
};

export type PresenterSyncState = {
  sourceId: string;
  sender: PresentationView;
  slideIndex: number;
  sequenceStep: number;
  blackout: boolean;
  revision: number;
  audienceAvailable?: boolean;
  audienceFullscreen?: boolean;
  interactionState?: Record<string, string>;
  laser?: LaserPointerState;
};

export type PresenterSyncMessage = PresenterSyncState & {
  type: "DECKORY_PRESENTATION_STATE";
  sentAt: number;
};

export type NextPreviewCue =
  | { kind: "reveal"; slideIndex: number; sequenceStep: number }
  | { kind: "slide"; slideIndex: number; sequenceStep: 0 }
  | { kind: "end" };

export const PRESENTER_CHANNEL_NAME = "deckory-presentation";
export const PRESENTER_STORAGE_KEY = "deckory:presentation-state";

const REQUIRED_SHELL_PATHS = ["/", "/manifest.webmanifest", "/icon.svg"] as const;
const INTERACTION_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:::[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const MAX_INTERACTION_ENTRIES = 128;
const MAX_INTERACTION_VALUE_LENGTH = 4_096;

export function buildRequiredAssetList(
  resources: readonly PerformanceResourceLike[],
  origin: string
): string[] {
  const assets = new Set<string>(REQUIRED_SHELL_PATHS);

  for (const resource of resources) {
    try {
      const url = new URL(resource.name, origin);
      if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) continue;
      assets.add(`${url.pathname}${url.search}`);
    } catch {
      // Ignore malformed performance entries; readiness is based on valid local assets only.
    }
  }

  return [...assets];
}

export function describeOfflineStatus(status: OfflineStatus, isOnline: boolean) {
  if (status === "ready" && !isOnline) {
    return { label: "Ngoại tuyến", description: "Deck đang dùng bản đã lưu trên thiết bị." };
  }

  switch (status) {
    case "checking":
      return { label: "Đang chuẩn bị", description: "Đang kiểm tra font, deck và tài nguyên cần thiết." };
    case "ready":
      return { label: "Sẵn sàng ngoại tuyến", description: "Giao diện, phông chữ và tài nguyên trình chiếu đã được lưu trên thiết bị." };
    case "online-only":
      return { label: "Cần kết nối mạng", description: "Một số tài nguyên chưa được lưu đầy đủ trên thiết bị." };
    case "unsupported":
      return { label: "Không hỗ trợ ngoại tuyến", description: "Trình duyệt này không thể lưu bản trình chiếu để sử dụng khi mất mạng." };
    case "error":
      return { label: "Chưa sẵn sàng ngoại tuyến", description: "Vẫn có thể trình chiếu khi đang kết nối mạng." };
  }
}

export function isEditableTarget(target: EditableTargetLike): boolean {
  if (!target) return false;
  const tagName = target.tagName?.toUpperCase();
  return target.isContentEditable === true || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

export function isDeckInteractiveTarget(target: InteractiveTargetLike): boolean {
  return Boolean(target && typeof target.closest === "function" && target.closest("[data-deck-interactive]"));
}

export function resolveRequestedSlideIndex(search: string, slideIds: readonly string[]): number {
  const requestedId = new URLSearchParams(search).get("slide");
  return requestedId ? slideIds.indexOf(requestedId) : -1;
}

export function resolvePresentationView(search: string): PresentationView {
  return new URLSearchParams(search).get("view") === "audience" ? "audience" : "presenter";
}

export function resolvePresenterKeyboardAction(
  key: string,
  context: { overviewOpen: boolean; presenterView: boolean }
): PresenterKeyboardAction | null {
  const normalizedKey = key.toLocaleLowerCase("en-US");

  if (context.overviewOpen) {
    return normalizedKey === "escape" ? "close-overview" : null;
  }
  if (!context.presenterView) return null;

  if (["arrowright", "pagedown", " "].includes(normalizedKey)) return "next";
  if (["arrowleft", "pageup"].includes(normalizedKey)) return "previous";
  if (normalizedKey === "home") return "home";
  if (normalizedKey === "end") return "end";
  if (normalizedKey === "b") return "toggle-blackout";
  if (normalizedKey === "f") return "toggle-fullscreen";
  if (normalizedKey === "o") return "toggle-overview";
  if (normalizedKey === "l") return "toggle-laser";
  return null;
}

export function isAudiencePresenceFresh(lastSeenAt: number, now = Date.now(), timeoutMs = 8_000): boolean {
  return lastSeenAt > 0 && timeoutMs > 0 && now >= lastSeenAt && now - lastSeenAt < timeoutMs;
}

export function describeAudienceFullscreen(isFullscreen: boolean, supported: boolean) {
  if (!supported) {
    return {
      label: "Không hỗ trợ toàn màn hình",
      hint: "Trình duyệt này không cung cấp Fullscreen API cho cửa sổ trình chiếu."
    };
  }

  return isFullscreen
    ? { label: "Thoát toàn màn hình", hint: "Nhấn F hoặc Esc để trở lại chế độ cửa sổ." }
    : { label: "Bật toàn màn hình", hint: "Nhấn F hoặc nhấp đúp để lấp đầy màn hình trình chiếu." };
}

export async function toggleFullscreenMode(targetDocument: FullscreenDocumentLike): Promise<FullscreenResult> {
  try {
    if (targetDocument.fullscreenElement) {
      if (typeof targetDocument.exitFullscreen !== "function") return "unsupported";
      await targetDocument.exitFullscreen();
      return "exited";
    }

    if (targetDocument.fullscreenEnabled === false || typeof targetDocument.documentElement.requestFullscreen !== "function") {
      return "unsupported";
    }

    await targetDocument.documentElement.requestFullscreen();
    return "entered";
  } catch {
    return "error";
  }
}

export function createPresenterSyncMessage(state: PresenterSyncState): PresenterSyncMessage {
  return {
    type: "DECKORY_PRESENTATION_STATE",
    sentAt: Date.now(),
    ...state
  };
}

export function isPresenterSyncMessage(value: unknown): value is PresenterSyncMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<PresenterSyncMessage>;

  return message.type === "DECKORY_PRESENTATION_STATE"
    && typeof message.sourceId === "string"
    && message.sourceId.length > 0
    && (message.sender === "presenter" || message.sender === "audience")
    && Number.isInteger(message.slideIndex)
    && (message.slideIndex ?? -1) >= 0
    && Number.isInteger(message.sequenceStep)
    && (message.sequenceStep ?? -1) >= 0
    && typeof message.blackout === "boolean"
    && Number.isInteger(message.revision)
    && (message.revision ?? -1) >= 0
    && (message.audienceAvailable === undefined || typeof message.audienceAvailable === "boolean")
    && (message.audienceFullscreen === undefined || typeof message.audienceFullscreen === "boolean")
    && (message.interactionState === undefined || isValidInteractionState(message.interactionState))
    && (message.laser === undefined || isValidLaserPointerState(message.laser))
    && typeof message.sentAt === "number"
    && Number.isFinite(message.sentAt);
}

function isValidLaserPointerState(value: unknown): value is LaserPointerState {
  if (!value || typeof value !== "object") return false;
  const laser = value as Partial<LaserPointerState>;
  return typeof laser.enabled === "boolean"
    && typeof laser.visible === "boolean"
    && typeof laser.x === "number"
    && Number.isFinite(laser.x)
    && laser.x >= 0
    && laser.x <= 1
    && typeof laser.y === "number"
    && Number.isFinite(laser.y)
    && laser.y >= 0
    && laser.y <= 1;
}

function isValidInteractionState(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= MAX_INTERACTION_ENTRIES
    && entries.every(([key, interactionValue]) => (
      INTERACTION_KEY_PATTERN.test(key)
      && typeof interactionValue === "string"
      && interactionValue.length <= MAX_INTERACTION_VALUE_LENGTH
    ));
}

export function getNextPreviewCue(
  slideIndex: number,
  sequenceStep: number,
  sequenceCounts: readonly number[]
): NextPreviewCue {
  const currentSequenceCount = Math.max(0, sequenceCounts[slideIndex] ?? 0);
  if (sequenceStep < currentSequenceCount) {
    return { kind: "reveal", slideIndex, sequenceStep: sequenceStep + 1 };
  }

  const nextSlideIndex = slideIndex + 1;
  return nextSlideIndex < sequenceCounts.length
    ? { kind: "slide", slideIndex: nextSlideIndex, sequenceStep: 0 }
    : { kind: "end" };
}

export function getNavigationDirection(previousIndex: number, nextIndex: number): -1 | 1 {
  return nextIndex < previousIndex ? -1 : 1;
}

export function formatElapsedTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const seconds = safeSeconds % 60;
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return hours > 0 ? `${hours}:${clock}` : clock;
}

export function shouldPrepareOfflineCache(environment: string | undefined): boolean {
  return environment === "production";
}

export async function prepareOfflineCache(timeoutMs = 8_000): Promise<OfflineStatus> {
  if (!shouldPrepareOfflineCache(process.env.NODE_ENV)) return "online-only";
  if (!("serviceWorker" in navigator)) return "unsupported";

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    await document.fonts.ready;

    const resources = performance.getEntriesByType("resource") as PerformanceResourceLike[];
    const assets = buildRequiredAssetList(resources, window.location.origin);
    const worker = navigator.serviceWorker.controller
      ?? registration.active
      ?? registration.waiting
      ?? registration.installing;

    if (!worker) return "online-only";

    const response = await requestCachePreparation(worker, assets, timeoutMs);
    return response.ok ? "ready" : "online-only";
  } catch {
    return "error";
  }
}

function requestCachePreparation(
  worker: ServiceWorker,
  assets: readonly string[],
  timeoutMs: number
): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => resolve({ ok: false }), timeoutMs);

    channel.port1.onmessage = (event: MessageEvent<{ type?: string; ok?: boolean }>) => {
      if (event.data?.type !== "DECKORY_CACHE_RESULT") return;
      window.clearTimeout(timeout);
      resolve({ ok: event.data.ok === true });
    };

    worker.postMessage({ type: "CACHE_REQUIRED_ASSETS", assets }, [channel.port2]);
  });
}
