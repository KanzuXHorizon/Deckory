import { describe, expect, it } from "vitest";
import {
  MAX_WEB_BLOCK_MESSAGE_BYTES,
  WEB_BLOCK_PROTOCOL_VERSION,
  createWebBlockMessage,
  parseWebBlockMessage,
  validateWebBlockMessageEvent
} from "./web-block-bridge";

const sourceWindow = {} as Window;

describe("versioned Web Block bridge", () => {
  it("creates and parses validated protocol messages", () => {
    const message = createWebBlockMessage("ready", "custom-radar", { capabilities: ["export-svg"] });
    expect(message).toEqual({
      protocolVersion: WEB_BLOCK_PROTOCOL_VERSION,
      blockId: "custom-radar",
      type: "ready",
      payload: { capabilities: ["export-svg"] }
    });
    expect(parseWebBlockMessage(message)).toEqual(message);
  });

  it("rejects unsupported protocol versions and block IDs", () => {
    expect(() => parseWebBlockMessage({
      protocolVersion: "9.0",
      blockId: "custom-radar",
      type: "ready",
      payload: { capabilities: [] }
    })).toThrow(/protocol/i);
    expect(() => parseWebBlockMessage({
      protocolVersion: WEB_BLOCK_PROTOCOL_VERSION,
      blockId: "NOT SAFE",
      type: "ready",
      payload: { capabilities: [] }
    })).toThrow();
  });

  it("validates source window, opaque sandbox origin and expected block", () => {
    const message = createWebBlockMessage("render-complete", "custom-radar", { width: 640, height: 360 });
    expect(validateWebBlockMessageEvent({ source: sourceWindow, origin: "null", data: message }, {
      expectedSource: sourceWindow,
      expectedBlockId: "custom-radar"
    })).toMatchObject({ ok: true, message });

    expect(validateWebBlockMessageEvent({ source: {}, origin: "null", data: message }, {
      expectedSource: sourceWindow,
      expectedBlockId: "custom-radar"
    })).toMatchObject({ ok: false, reason: "source-mismatch" });

    expect(validateWebBlockMessageEvent({ source: sourceWindow, origin: "https://example.com", data: message }, {
      expectedSource: sourceWindow,
      expectedBlockId: "custom-radar"
    })).toMatchObject({ ok: false, reason: "origin-denied" });

    expect(validateWebBlockMessageEvent({ source: sourceWindow, origin: "null", data: message }, {
      expectedSource: sourceWindow,
      expectedBlockId: "other-block"
    })).toMatchObject({ ok: false, reason: "block-mismatch" });
  });

  it("rejects non-serializable bridge payloads", () => {
    expect(() => createWebBlockMessage("inspector-patch", "custom-radar", {
      path: ["value"],
      value: () => 1
    })).toThrow(/tuần tự/i);
  });

  it("rejects unsafe Inspector paths and oversized messages", () => {
    expect(() => createWebBlockMessage("inspector-patch", "custom-radar", {
      path: ["constructor", "prototype", "polluted"],
      value: true
    })).toThrow(/path|constructor/i);

    expect(MAX_WEB_BLOCK_MESSAGE_BYTES).toBe(256 * 1024);
    expect(() => createWebBlockMessage("interaction-state", "custom-radar", {
      state: { value: "x".repeat(MAX_WEB_BLOCK_MESSAGE_BYTES) }
    })).toThrow(/giới hạn|bytes/i);
  });

  it("bounds resize requests and accepts only inert static SVG", () => {
    expect(() => createWebBlockMessage("resize-request", "custom-radar", { width: 10000, height: 200 })).toThrow();
    expect(createWebBlockMessage("export-svg", "custom-radar", {
      svg: "<svg viewBox='0 0 10 10'><path d='M0 0h10v10z'/></svg>"
    }).type).toBe("export-svg");
    expect(() => createWebBlockMessage("export-svg", "custom-radar", {
      svg: "<svg><script>alert(1)</script></svg>"
    })).toThrow(/SVG|active|không an toàn/i);
    expect(() => createWebBlockMessage("export-svg", "custom-radar", {
      svg: "<svg><a href='https://example.com'>x</a></svg>"
    })).toThrow(/SVG|href|không an toàn/i);
  });

  it("rejects unsafe object keys and unbounded Inspector indexes", () => {
    expect(() => createWebBlockMessage("interaction-state", "custom-radar", {
      state: JSON.parse('{"__proto__":{"polluted":true}}')
    })).toThrow(/__proto__|không an toàn/i);
    expect(() => createWebBlockMessage("inspector-patch", "custom-radar", {
      path: ["items", 1_000_000_000, "label"],
      value: "Unsafe"
    })).toThrow(/index|giới hạn|too big|10000/i);
  });
});
