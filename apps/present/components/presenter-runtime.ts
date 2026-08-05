export type OfflineStatus = "checking" | "ready" | "online-only" | "unsupported" | "error";
export type PresentationView = "presenter" | "audience";

export type PerformanceResourceLike = { name: string };
export type EditableTargetLike = { tagName?: string; isContentEditable?: boolean } | null;

export type PresenterSyncState = {
  sourceId: string;
  sender: PresentationView;
  slideIndex: number;
  sequenceStep: number;
  blackout: boolean;
  revision: number;
};

export type PresenterSyncMessage = PresenterSyncState & {
  type: "DECKORY_PRESENTATION_STATE";
  sentAt: number;
};

export const PRESENTER_CHANNEL_NAME = "deckory-presentation";
export const PRESENTER_STORAGE_KEY = "deckory:presentation-state";

const REQUIRED_SHELL_PATHS = ["/", "/manifest.webmanifest", "/icon.svg"] as const;

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
      return { label: "Sẵn sàng ngoại tuyến", description: "Shell, font và tài nguyên của deck đã được lưu." };
    case "online-only":
      return { label: "Chỉ trực tuyến", description: "Một số tài nguyên chưa được lưu đầy đủ trên thiết bị." };
    case "unsupported":
      return { label: "Không hỗ trợ cache", description: "Trình duyệt này không hỗ trợ service worker." };
    case "error":
      return { label: "Không thể chuẩn bị", description: "Deck vẫn trình chiếu trực tuyến; cache ngoại tuyến chưa sẵn sàng." };
  }
}

export function isEditableTarget(target: EditableTargetLike): boolean {
  if (!target) return false;
  const tagName = target.tagName?.toUpperCase();
  return target.isContentEditable === true || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

export function resolvePresentationView(search: string): PresentationView {
  return new URLSearchParams(search).get("view") === "audience" ? "audience" : "presenter";
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
    && typeof message.sentAt === "number"
    && Number.isFinite(message.sentAt);
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
