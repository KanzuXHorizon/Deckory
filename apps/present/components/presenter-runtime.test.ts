import { describe, expect, it } from "vitest";
import {
  buildRequiredAssetList,
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
  resolvePresentationView,
  resolvePresenterKeyboardAction,
  resolveRequestedSlideIndex,
  shouldPrepareOfflineCache,
  toggleFullscreenMode,
  type FullscreenDocumentLike,
  type PerformanceResourceLike
} from "./presenter-runtime";

describe("presenter runtime helpers", () => {
  it("builds a unique same-origin asset manifest for offline readiness", () => {
    const resources: PerformanceResourceLike[] = [
      { name: "https://deckory.local/_next/static/app.js" },
      { name: "https://deckory.local/_next/static/app.js" },
      { name: "https://deckory.local/_next/static/font.woff2" },
      { name: "https://analytics.example.com/pixel" }
    ];

    expect(buildRequiredAssetList(resources, "https://deckory.local")).toEqual([
      "/",
      "/manifest.webmanifest",
      "/icon.svg",
      "/_next/static/app.js",
      "/_next/static/font.woff2"
    ]);
  });

  it("does not install a service worker while Next.js development assets are changing", () => {
    expect(shouldPrepareOfflineCache("development")).toBe(false);
    expect(shouldPrepareOfflineCache("test")).toBe(false);
    expect(shouldPrepareOfflineCache("production")).toBe(true);
  });

  it("uses precise readiness copy instead of claiming offline support after registration", () => {
    expect(describeOfflineStatus("checking", true).label).toBe("Đang chuẩn bị");
    expect(describeOfflineStatus("ready", false).label).toBe("Ngoại tuyến");
    expect(describeOfflineStatus("online-only", true).label).toBe("Cần kết nối mạng");
    expect(describeOfflineStatus("unsupported", true).label).toBe("Không hỗ trợ ngoại tuyến");
  });

  it("does not trigger slide shortcuts while the user is editing", () => {
    expect(isEditableTarget({ tagName: "INPUT", isContentEditable: false })).toBe(true);
    expect(isEditableTarget({ tagName: "TEXTAREA", isContentEditable: false })).toBe(true);
    expect(isEditableTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isEditableTarget({ tagName: "BUTTON", isContentEditable: false })).toBe(false);
  });

  it("keeps keyboard events inside semantic slide interactions", () => {
    const interactiveTarget = { closest: (selector: string) => selector === "[data-deck-interactive]" ? { dataset: {} } : null };
    const regularTarget = { closest: () => null };

    expect(isDeckInteractiveTarget(interactiveTarget)).toBe(true);
    expect(isDeckInteractiveTarget(regularTarget)).toBe(false);
    expect(isDeckInteractiveTarget(null)).toBe(false);
  });

  it("resolves direct slide URLs without falling back to the cover slide", () => {
    const slides = ["cover", "data-story", "closing"];
    expect(resolveRequestedSlideIndex("?slide=data-story", slides)).toBe(1);
    expect(resolveRequestedSlideIndex("?slide=unknown", slides)).toBe(-1);
    expect(resolveRequestedSlideIndex("", slides)).toBe(-1);
  });

  it("defaults to presenter view and only accepts the audience view explicitly", () => {
    expect(resolvePresentationView("")).toBe("presenter");
    expect(resolvePresentationView("?view=presenter")).toBe("presenter");
    expect(resolvePresentationView("?view=audience")).toBe("audience");
    expect(resolvePresentationView("?view=unknown")).toBe("presenter");
  });

  it("blocks presentation shortcuts behind the overview dialog", () => {
    expect(resolvePresenterKeyboardAction("ArrowRight", { overviewOpen: true, presenterView: true })).toBeNull();
    expect(resolvePresenterKeyboardAction("b", { overviewOpen: true, presenterView: true })).toBeNull();
    expect(resolvePresenterKeyboardAction("Escape", { overviewOpen: true, presenterView: true })).toBe("close-overview");
    expect(resolvePresenterKeyboardAction("ArrowRight", { overviewOpen: false, presenterView: true })).toBe("next");
    expect(resolvePresenterKeyboardAction("o", { overviewOpen: false, presenterView: true })).toBe("toggle-overview");
    expect(resolvePresenterKeyboardAction("o", { overviewOpen: false, presenterView: false })).toBeNull();
  });

  it("creates and validates the cross-window presentation state contract", () => {
    const message = createPresenterSyncMessage({
      sourceId: "presenter-1",
      sender: "presenter",
      slideIndex: 2,
      sequenceStep: 1,
      blackout: true,
      revision: 7
    });

    expect(message.type).toBe("DECKORY_PRESENTATION_STATE");
    expect(isPresenterSyncMessage(message)).toBe(true);
    expect(isPresenterSyncMessage({ ...message, slideIndex: -1 })).toBe(false);
    expect(isPresenterSyncMessage({ ...message, sender: "remote" })).toBe(false);
    expect(isPresenterSyncMessage({ ...message, type: "UNKNOWN" })).toBe(false);
  });

  it("validates optional audience presence and fullscreen state", () => {
    const message = createPresenterSyncMessage({
      sourceId: "audience-1",
      sender: "audience",
      slideIndex: 1,
      sequenceStep: 0,
      blackout: false,
      revision: 3,
      audienceAvailable: true,
      audienceFullscreen: true
    });

    expect(isPresenterSyncMessage(message)).toBe(true);
    expect(isPresenterSyncMessage({ ...message, audienceAvailable: "yes" })).toBe(false);
    expect(isPresenterSyncMessage({ ...message, audienceFullscreen: 1 })).toBe(false);
  });

  it("bounds and validates synchronized interaction state", () => {
    const message = createPresenterSyncMessage({
      sourceId: "presenter-1",
      sender: "presenter",
      slideIndex: 1,
      sequenceStep: 0,
      blackout: false,
      revision: 4,
      interactionState: { "scoring::simulator": "custom-state" }
    });

    expect(isPresenterSyncMessage(message)).toBe(true);
    expect(isPresenterSyncMessage({ ...message, interactionState: { "": "value" } })).toBe(false);
    expect(isPresenterSyncMessage({ ...message, interactionState: { "invalid key": "value" } })).toBe(false);
    expect(isPresenterSyncMessage({ ...message, interactionState: { "scoring::simulator": "x".repeat(4_097) } })).toBe(false);
    expect(isPresenterSyncMessage({
      ...message,
      interactionState: Object.fromEntries(Array.from({ length: 129 }, (_, index) => [`slide-${index}::component`, "value"]))
    })).toBe(false);
  });

  it("expires audience presence only after the reliability window", () => {
    expect(isAudiencePresenceFresh(1_000, 8_999, 8_000)).toBe(true);
    expect(isAudiencePresenceFresh(1_000, 9_001, 8_000)).toBe(false);
    expect(isAudiencePresenceFresh(0, 1_000, 8_000)).toBe(false);
  });

  it("describes audience fullscreen controls with actionable copy", () => {
    expect(describeAudienceFullscreen(false, true).label).toBe("Bật toàn màn hình");
    expect(describeAudienceFullscreen(true, true).label).toBe("Thoát toàn màn hình");
    expect(describeAudienceFullscreen(false, false).label).toBe("Không hỗ trợ toàn màn hình");
  });

  it("toggles fullscreen safely and reports unsupported or rejected requests", async () => {
    let requested = false;
    const enterDocument: FullscreenDocumentLike = {
      fullscreenElement: null,
      fullscreenEnabled: true,
      documentElement: {
        requestFullscreen: async () => { requested = true; }
      }
    };
    expect(await toggleFullscreenMode(enterDocument)).toBe("entered");
    expect(requested).toBe(true);

    let exited = false;
    const exitDocument: FullscreenDocumentLike = {
      fullscreenElement: {},
      fullscreenEnabled: true,
      documentElement: {},
      exitFullscreen: async () => { exited = true; }
    };
    expect(await toggleFullscreenMode(exitDocument)).toBe("exited");
    expect(exited).toBe(true);

    expect(await toggleFullscreenMode({ fullscreenElement: null, fullscreenEnabled: false, documentElement: {} })).toBe("unsupported");
    expect(await toggleFullscreenMode({
      fullscreenElement: null,
      fullscreenEnabled: true,
      documentElement: { requestFullscreen: async () => { throw new Error("denied"); } }
    })).toBe("error");
  });

  it("formats presenter elapsed time without dropping hour precision", () => {
    expect(formatElapsedTime(0)).toBe("00:00");
    expect(formatElapsedTime(65)).toBe("01:05");
    expect(formatElapsedTime(3_723)).toBe("1:02:03");
  });

  it("previews the next reveal before advancing to the next slide", () => {
    const sequenceCounts = [2, 1, 0];

    expect(getNextPreviewCue(0, 0, sequenceCounts)).toEqual({
      kind: "reveal",
      slideIndex: 0,
      sequenceStep: 1
    });
    expect(getNextPreviewCue(0, 2, sequenceCounts)).toEqual({
      kind: "slide",
      slideIndex: 1,
      sequenceStep: 0
    });
    expect(getNextPreviewCue(2, 0, sequenceCounts)).toEqual({ kind: "end" });
  });

  it("derives stable forward and backward navigation directions", () => {
    expect(getNavigationDirection(1, 2)).toBe(1);
    expect(getNavigationDirection(2, 1)).toBe(-1);
    expect(getNavigationDirection(2, 2)).toBe(1);
  });
});
