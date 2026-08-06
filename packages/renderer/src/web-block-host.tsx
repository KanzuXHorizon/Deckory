import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";
import type { SceneRenderMode } from "./element-renderer";

export const WEB_BLOCK_RENDER_TIMEOUT_MS = 1500;

export interface WebBlockSandboxPolicy {
  sandbox: "allow-scripts";
  csp: string;
}

export interface WebBlockHostManifest {
  id: string;
  version: string;
  accessibleSummary: string;
  staticFallback: { type: "svg" | "png"; assetId: string };
}

export interface WebBlockHostElement {
  id: string;
  name: string;
  manifest: WebBlockHostManifest;
}

export interface CompiledWebBlockBundle {
  code: string;
  css?: string;
  protocolVersion: string;
}

export type WebBlockLifecycleState =
  | { status: "booting" }
  | { status: "ready" }
  | { status: "rendered" }
  | { status: "error"; message: string }
  | { status: "timed-out" };

export type WebBlockLifecycleEvent =
  | { type: "reset" }
  | { type: "ready" }
  | { type: "render-complete" }
  | { type: "render-error"; message: string }
  | { type: "timeout" };

export function reduceWebBlockLifecycle(
  state: WebBlockLifecycleState,
  event: WebBlockLifecycleEvent
): WebBlockLifecycleState {
  switch (event.type) {
    case "reset":
      return { status: "booting" };
    case "ready":
      return state.status === "booting" ? { status: "ready" } : state;
    case "render-complete":
      return state.status === "booting" || state.status === "ready" ? { status: "rendered" } : state;
    case "render-error":
      return { status: "error", message: event.message };
    case "timeout":
      return state.status === "booting" || state.status === "ready" ? { status: "timed-out" } : state;
  }
}

export function shouldUseWebBlockFallback(
  state: WebBlockLifecycleState
): state is Extract<WebBlockLifecycleState, { status: "error" | "timed-out" }> {
  return state.status === "error" || state.status === "timed-out";
}

export function createWebBlockSandboxPolicy(): WebBlockSandboxPolicy {
  return Object.freeze({
    sandbox: "allow-scripts" as const,
    csp: [
      "default-src 'none'",
      "script-src 'unsafe-inline'",
      "style-src 'unsafe-inline'",
      "img-src data: blob:",
      "font-src data:",
      "media-src data: blob:",
      "connect-src 'none'",
      "object-src 'none'",
      "frame-src 'none'",
      "child-src 'none'",
      "worker-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "navigate-to 'none'",
      "require-trusted-types-for 'script'",
      "trusted-types deckory-web-block"
    ].join("; ")
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeScriptBoundary(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

function safeInlineJson(value: string): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    switch (character) {
      case "<": return "\\u003c";
      case ">": return "\\u003e";
      case "&": return "\\u0026";
      case "\u2028": return "\\u2028";
      case "\u2029": return "\\u2029";
      default: return character;
    }
  });
}

function escapeStyleBoundary(value: string): string {
  return value.replace(/<\/style/gi, "<\\/style");
}

export function createWebBlockSrcDoc(
  bundle: CompiledWebBlockBundle,
  manifest: WebBlockHostManifest
): string {
  const policy = createWebBlockSandboxPolicy();
  const blockId = safeInlineJson(manifest.id);
  const protocolVersion = safeInlineJson(bundle.protocolVersion);
  const summary = escapeHtml(manifest.accessibleSummary);
  const css = escapeStyleBoundary(bundle.css ?? "");
  const code = escapeScriptBoundary(bundle.code);

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(policy.csp)}">
<meta name="referrer" content="no-referrer">
<style>html,body,#root{width:100%;height:100%;margin:0;overflow:hidden}body{font-family:system-ui,sans-serif}${css}</style>
</head>
<body>
<div id="root" role="img" aria-label="${summary}"></div>
<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">${summary}</span>
<script>
"use strict";
(() => {
  const protocolVersion = ${protocolVersion};
  const blockId = ${blockId};
  const post = (type, payload) => window.parent.postMessage({ protocolVersion, blockId, type, payload }, "*");
  const bridge = Object.freeze({
    renderComplete: (payload = {}) => post("render-complete", payload),
    renderError: (message, code) => post("render-error", { message, ...(code ? { code } : {}) }),
    requestResize: (width, height) => post("resize-request", { width, height }),
    setInteractionState: (state) => post("interaction-state", { state }),
    patchInspector: (path, value) => post("inspector-patch", { path, value }),
    exportSvg: (svg) => post("export-svg", { svg })
  });
  Object.defineProperty(globalThis, "__deckoryWebBlockBridge", {
    value: bridge,
    configurable: false,
    enumerable: false,
    writable: false
  });
  try {
    if (globalThis.trustedTypes) {
      try {
        globalThis.trustedTypes.createPolicy("deckory-web-block", {
          createHTML: (value) => value,
          createScriptURL: (value) => value
        });
      } catch {}
    }
    post("ready", { capabilities: ["export-svg", "inspector-patch", "resize-request"] });
    ${code}
  } catch (error) {
    const message = error instanceof Error ? error.message : "Web Block render failed";
    post("render-error", { message });
  }
  window.addEventListener("error", (event) => post("render-error", { message: event.message || "Web Block runtime error" }));
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "Unhandled rejection");
    post("render-error", { message: reason });
  });
})();
<\/script>
</body>
</html>`;
}

const visuallyHiddenStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
};

function WebBlockFallback({
  element,
  fallbackSrc,
  status
}: {
  element: WebBlockHostElement;
  fallbackSrc: string | undefined;
  status: "static-export" | "bundle-missing" | "error" | "timed-out";
}) {
  const summary = element.manifest.accessibleSummary;
  return (
    <div
      data-web-block-host={element.id}
      data-web-block-status={status}
      role="img"
      aria-label={summary}
    >
      {fallbackSrc
        ? <img src={fallbackSrc} alt={summary} draggable={false} />
        : <span>{summary}</span>}
    </div>
  );
}

export type WebBlockHostMessage =
  | {
      protocolVersion: string;
      blockId: string;
      type: "ready";
      payload: { capabilities: readonly ("export-svg" | "inspector-patch" | "resize-request")[] };
    }
  | {
      protocolVersion: string;
      blockId: string;
      type: "render-complete";
      payload: { width?: number; height?: number };
    }
  | {
      protocolVersion: string;
      blockId: string;
      type: "render-error";
      payload: { message: string; code?: string };
    };

const hostCapabilities = new Set(["export-svg", "inspector-patch", "resize-request"]);
const MAX_WEB_BLOCK_HOST_MESSAGE_BYTES = 16 * 1024;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function validDimension(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 4096;
}

export function parseWebBlockHostMessage(
  value: unknown,
  expected: { protocolVersion: string; blockId: string }
): WebBlockHostMessage | undefined {
  if (!isPlainRecord(value) || !hasOnlyKeys(value, ["protocolVersion", "blockId", "type", "payload"])) return undefined;
  if (value.protocolVersion !== expected.protocolVersion || value.blockId !== expected.blockId) return undefined;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return undefined;
  }
  if (new TextEncoder().encode(serialized).byteLength > MAX_WEB_BLOCK_HOST_MESSAGE_BYTES) return undefined;
  if (!isPlainRecord(value.payload)) return undefined;

  if (value.type === "ready") {
    if (!hasOnlyKeys(value.payload, ["capabilities"]) || !Array.isArray(value.payload.capabilities)) return undefined;
    const capabilities = value.payload.capabilities;
    if (capabilities.length > hostCapabilities.size || new Set(capabilities).size !== capabilities.length) return undefined;
    if (!capabilities.every((capability) => typeof capability === "string" && hostCapabilities.has(capability))) return undefined;
    return value as WebBlockHostMessage;
  }

  if (value.type === "render-complete") {
    if (!hasOnlyKeys(value.payload, ["width", "height"])) return undefined;
    if (value.payload.width !== undefined && !validDimension(value.payload.width)) return undefined;
    if (value.payload.height !== undefined && !validDimension(value.payload.height)) return undefined;
    return value as WebBlockHostMessage;
  }

  if (value.type === "render-error") {
    if (!hasOnlyKeys(value.payload, ["message", "code"])) return undefined;
    if (typeof value.payload.message !== "string" || value.payload.message.trim().length === 0 || value.payload.message.length > 2_000) return undefined;
    if (value.payload.code !== undefined && (typeof value.payload.code !== "string" || value.payload.code.trim().length === 0 || value.payload.code.length > 120)) return undefined;
    return value as WebBlockHostMessage;
  }

  return undefined;
}

function validHostMessage(
  event: MessageEvent,
  iframe: HTMLIFrameElement,
  element: WebBlockHostElement,
  bundle: CompiledWebBlockBundle
): WebBlockHostMessage | undefined {
  const iframeWindow = (iframe as unknown as { contentWindow: unknown }).contentWindow;
  if (event.source !== iframeWindow || event.origin !== "null") return undefined;
  return parseWebBlockHostMessage(event.data, {
    protocolVersion: bundle.protocolVersion,
    blockId: element.manifest.id
  });
}

function InteractiveWebBlockHost({
  element,
  bundle,
  fallbackSrc,
  mode
}: {
  element: WebBlockHostElement;
  bundle: CompiledWebBlockBundle;
  fallbackSrc: string | undefined;
  mode: Exclude<SceneRenderMode, "export">;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<WebBlockLifecycleState>({ status: "booting" });
  const srcDoc = useMemo(() => createWebBlockSrcDoc(bundle, element.manifest), [bundle, element.manifest]);
  const policy = useMemo(() => createWebBlockSandboxPolicy(), []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const hostWindow = globalThis as unknown as {
      setTimeout(callback: () => void, delay: number): number;
      clearTimeout(handle: number): void;
      addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
      removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
    };
    setState((current) => reduceWebBlockLifecycle(current, { type: "reset" }));
    const timer = hostWindow.setTimeout(() => {
      setState((current) => reduceWebBlockLifecycle(current, { type: "timeout" }));
    }, WEB_BLOCK_RENDER_TIMEOUT_MS);
    const onMessage = (event: MessageEvent) => {
      const message = validHostMessage(event, iframe, element, bundle);
      if (!message) return;
      if (message.type === "ready") setState((current) => reduceWebBlockLifecycle(current, { type: "ready" }));
      if (message.type === "render-complete") {
        hostWindow.clearTimeout(timer);
        setState((current) => reduceWebBlockLifecycle(current, { type: "render-complete" }));
      }
      if (message.type === "render-error") {
        hostWindow.clearTimeout(timer);
        setState((current) => reduceWebBlockLifecycle(current, { type: "render-error", message: message.payload.message }));
      }
    };
    hostWindow.addEventListener("message", onMessage);
    return () => {
      hostWindow.clearTimeout(timer);
      hostWindow.removeEventListener("message", onMessage);
    };
  }, [bundle, element]);

  if (shouldUseWebBlockFallback(state)) {
    return <WebBlockFallback element={element} fallbackSrc={fallbackSrc} status={state.status} />;
  }

  const summaryId = `${element.id}-web-block-summary`;
  return (
    <div data-web-block-host={element.id} data-web-block-status={state.status} aria-describedby={summaryId}>
      <span id={summaryId} data-web-block-accessible-summary="true" style={visuallyHiddenStyle}>
        {element.manifest.accessibleSummary}
      </span>
      <iframe
        ref={iframeRef}
        sandbox={policy.sandbox}
        srcDoc={srcDoc}
        title={element.manifest.accessibleSummary}
        referrerPolicy="no-referrer"
        loading="eager"
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          pointerEvents: mode === "thumbnail" ? "none" : undefined
        }}
      />
    </div>
  );
}

export function WebBlockHost({
  element,
  bundle,
  fallbackSrc,
  mode
}: {
  element: WebBlockHostElement;
  bundle?: CompiledWebBlockBundle;
  fallbackSrc?: string;
  mode: SceneRenderMode;
}) {
  if (mode === "export") {
    return <WebBlockFallback element={element} fallbackSrc={fallbackSrc} status="static-export" />;
  }
  if (!bundle) {
    return <WebBlockFallback element={element} fallbackSrc={fallbackSrc} status="bundle-missing" />;
  }
  return <InteractiveWebBlockHost element={element} bundle={bundle} fallbackSrc={fallbackSrc} mode={mode} />;
}
