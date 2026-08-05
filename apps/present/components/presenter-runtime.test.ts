import { describe, expect, it } from "vitest";
import {
  buildRequiredAssetList,
  createPresenterSyncMessage,
  describeOfflineStatus,
  formatElapsedTime,
  getNavigationDirection,
  isEditableTarget,
  isPresenterSyncMessage,
  resolvePresentationView,
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

  it("uses precise readiness copy instead of claiming offline support after registration", () => {
    expect(describeOfflineStatus("checking", true).label).toBe("Đang chuẩn bị");
    expect(describeOfflineStatus("ready", false).label).toBe("Ngoại tuyến");
    expect(describeOfflineStatus("online-only", true).label).toBe("Chỉ trực tuyến");
    expect(describeOfflineStatus("unsupported", true).label).toBe("Không hỗ trợ cache");
  });

  it("does not trigger slide shortcuts while the user is editing", () => {
    expect(isEditableTarget({ tagName: "INPUT", isContentEditable: false })).toBe(true);
    expect(isEditableTarget({ tagName: "TEXTAREA", isContentEditable: false })).toBe(true);
    expect(isEditableTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isEditableTarget({ tagName: "BUTTON", isContentEditable: false })).toBe(false);
  });

  it("defaults to presenter view and only accepts the audience view explicitly", () => {
    expect(resolvePresentationView("")).toBe("presenter");
    expect(resolvePresentationView("?view=presenter")).toBe("presenter");
    expect(resolvePresentationView("?view=audience")).toBe("audience");
    expect(resolvePresentationView("?view=unknown")).toBe("presenter");
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

  it("formats presenter elapsed time without dropping hour precision", () => {
    expect(formatElapsedTime(0)).toBe("00:00");
    expect(formatElapsedTime(65)).toBe("01:05");
    expect(formatElapsedTime(3_723)).toBe("1:02:03");
  });

  it("derives stable forward and backward navigation directions", () => {
    expect(getNavigationDirection(1, 2)).toBe(1);
    expect(getNavigationDirection(2, 1)).toBe(-1);
    expect(getNavigationDirection(2, 2)).toBe(1);
  });
});
