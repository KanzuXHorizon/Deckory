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
  | { type: "ready" }
  | { type: "render-complete" }
  | { type: "render-error"; message: string }
  | { type: "timeout" };

export function reduceWebBlockLifecycle(
  state: WebBlockLifecycleState,
  event: WebBlockLifecycleEvent
): WebBlockLifecycleState {
  switch (event.type) {
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

function escapeStyleBoundary(value: string): string {
  return value.replace(/<\/style/gi, "<\\/style");
}

export function createWebBlockSrcDoc(
  bundle: CompiledWebBlockBundle,
  manifest: WebBlockHostManifest
): string {
  const policy = createWebBlockSandboxPolicy();
  const blockId = JSON.stringify(manifest.id);
  const protocolVersion = JSON.stringify(bundle.protocolVersion);
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
    post("render-complete", {});
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

interface BridgeMessageLike {
  protocolVersion?: unknown;
  blockId?: unknown;
  type?: unknown;
  payload?: unknown;
}

function validHostMessage(
  event: MessageEvent,
  iframe: HTMLIFrameElement,
  element: WebBlockHostElement,
  bundle: CompiledWebBlockBundle
): BridgeMessageLike | undefined {
  const iframeWindow = (iframe as unknown as { contentWindow: unknown }).contentWindow;
  if (event.source !== iframeWindow || event.origin !== "null") return undefined;
  if (typeof event.data !== "object" || event.data === null) return undefined;
  const message = event.data as BridgeMessageLike;
  if (message.protocolVersion !== bundle.protocolVersion || message.blockId !== element.manifest.id) return undefined;
  if (!new Set(["ready", "render-complete", "render-error"]).has(String(message.type))) return undefined;
  return message;
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
    const timer = hostWindow.setTimeout(() => {
      setState((current) => reduceWebBlockLifecycle(current, { type: "timeout" }));
    }, WEB_BLOCK_RENDER_TIMEOUT_MS);
    const onMessage = (event: MessageEvent) => {
      const message = validHostMessage(event, iframe, element, bundle);
      if (!message) return;
      if (message.type === "ready") setState((current) => reduceWebBlockLifecycle(current, { type: "ready" }));
      if (message.type === "render-complete") setState((current) => reduceWebBlockLifecycle(current, { type: "render-complete" }));
      if (message.type === "render-error") {
        const payload = message.payload as { message?: unknown } | undefined;
        const errorMessage = typeof payload?.message === "string" ? payload.message : "Web Block render failed";
        setState((current) => reduceWebBlockLifecycle(current, { type: "render-error", message: errorMessage }));
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
