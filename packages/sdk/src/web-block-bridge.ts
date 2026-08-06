import { z } from "zod";

export const WEB_BLOCK_PROTOCOL_VERSION = "1.0" as const;
export const MAX_WEB_BLOCK_MESSAGE_BYTES = 256 * 1024;
const MAX_WEB_BLOCK_MESSAGE_DEPTH = 32;
const MAX_WEB_BLOCK_MESSAGE_NODES = 10_000;

const unsafePathSegments = new Set(["__proto__", "prototype", "constructor"]);
const stableId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const inspectorPathSegment = z.union([
  z.string().trim().min(1).refine((segment) => !unsafePathSegments.has(segment), "Inspector path chứa segment không an toàn"),
  z.number().int().nonnegative()
]);
const common = {
  protocolVersion: z.literal(WEB_BLOCK_PROTOCOL_VERSION),
  blockId: stableId
};

const readyMessage = z.object({
  ...common,
  type: z.literal("ready"),
  payload: z.object({ capabilities: z.array(z.enum(["export-svg", "inspector-patch", "resize-request"])).max(16) }).strict()
}).strict();
const renderCompleteMessage = z.object({
  ...common,
  type: z.literal("render-complete"),
  payload: z.object({ width: z.number().finite().positive().max(4096).optional(), height: z.number().finite().positive().max(4096).optional() }).strict()
}).strict();
const renderErrorMessage = z.object({
  ...common,
  type: z.literal("render-error"),
  payload: z.object({ message: z.string().trim().min(1).max(2_000), code: z.string().trim().min(1).max(120).optional() }).strict()
}).strict();
const resizeRequestMessage = z.object({
  ...common,
  type: z.literal("resize-request"),
  payload: z.object({ width: z.number().finite().positive().max(4096), height: z.number().finite().positive().max(4096) }).strict()
}).strict();
const interactionStateMessage = z.object({
  ...common,
  type: z.literal("interaction-state"),
  payload: z.object({ state: z.record(z.string(), z.unknown()) }).strict()
}).strict();
const inspectorPatchMessage = z.object({
  ...common,
  type: z.literal("inspector-patch"),
  payload: z.object({
    path: z.array(inspectorPathSegment).min(1).max(32),
    value: z.unknown()
  }).strict()
}).strict();
const exportSvgMessage = z.object({
  ...common,
  type: z.literal("export-svg"),
  payload: z.object({ svg: z.string().trim().min(1).max(2 * 1024 * 1024) }).strict()
}).strict();

export const WebBlockMessageSchema = z.discriminatedUnion("type", [
  readyMessage,
  renderCompleteMessage,
  renderErrorMessage,
  resizeRequestMessage,
  interactionStateMessage,
  inspectorPatchMessage,
  exportSvgMessage
]);

export interface WebBlockMessagePayloadMap {
  ready: { capabilities: readonly ("export-svg" | "inspector-patch" | "resize-request")[] };
  "render-complete": { width?: number; height?: number };
  "render-error": { message: string; code?: string };
  "resize-request": { width: number; height: number };
  "interaction-state": { state: Record<string, unknown> };
  "inspector-patch": { path: readonly (string | number)[]; value: unknown };
  "export-svg": { svg: string };
}

export type WebBlockMessageType = keyof WebBlockMessagePayloadMap;
export type WebBlockMessage<T extends WebBlockMessageType = WebBlockMessageType> = {
  [K in T]: {
    protocolVersion: typeof WEB_BLOCK_PROTOCOL_VERSION;
    blockId: string;
    type: K;
    payload: WebBlockMessagePayloadMap[K];
  }
}[T];

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

interface SerializationBudget {
  nodes: number;
}

function assertSerializable(
  value: unknown,
  path: string,
  seen: Set<object>,
  depth: number,
  budget: SerializationBudget
): void {
  if (depth > MAX_WEB_BLOCK_MESSAGE_DEPTH) {
    throw new TypeError(`Bridge payload tại ${path} vượt giới hạn độ sâu.`);
  }
  budget.nodes += 1;
  if (budget.nodes > MAX_WEB_BLOCK_MESSAGE_NODES) {
    throw new TypeError(`Bridge payload vượt giới hạn số node.`);
  }
  if (value === null || value === undefined) return;
  const valueType = typeof value;
  if (valueType === "function" || valueType === "symbol" || valueType === "bigint") {
    throw new TypeError(`Bridge payload tại ${path} không thể tuần tự.`);
  }
  if (valueType === "number" && !Number.isFinite(value as number)) {
    throw new TypeError(`Bridge payload tại ${path} chứa số không hữu hạn.`);
  }
  if (valueType !== "object") return;
  const objectValue = value as object;
  if (seen.has(objectValue)) throw new TypeError(`Bridge payload tại ${path} chứa tham chiếu vòng và không thể tuần tự.`);
  seen.add(objectValue);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`, seen, depth + 1, budget));
  } else {
    if (!isPlainObject(objectValue)) throw new TypeError(`Bridge payload tại ${path} phải là dữ liệu thuần có thể tuần tự.`);
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      assertSerializable(child, `${path}.${key}`, seen, depth + 1, budget);
    }
  }
  seen.delete(objectValue);
}

export function parseWebBlockMessage(value: unknown): WebBlockMessage {
  if (typeof value !== "object" || value === null || (value as { protocolVersion?: unknown }).protocolVersion !== WEB_BLOCK_PROTOCOL_VERSION) {
    throw new TypeError(`Web Block protocol không được hỗ trợ; yêu cầu ${WEB_BLOCK_PROTOCOL_VERSION}.`);
  }
  assertSerializable(value, "message", new Set<object>(), 0, { nodes: 0 });
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).byteLength > MAX_WEB_BLOCK_MESSAGE_BYTES) {
    throw new TypeError(`Web Block bridge message vượt giới hạn ${MAX_WEB_BLOCK_MESSAGE_BYTES} bytes.`);
  }
  return WebBlockMessageSchema.parse(value) as WebBlockMessage;
}

export function createWebBlockMessage<T extends WebBlockMessageType>(
  type: T,
  blockId: string,
  payload: WebBlockMessagePayloadMap[T]
): WebBlockMessage<T> {
  return parseWebBlockMessage({
    protocolVersion: WEB_BLOCK_PROTOCOL_VERSION,
    blockId,
    type,
    payload
  }) as WebBlockMessage<T>;
}

export interface WebBlockMessageEventLike {
  source: unknown;
  origin: string;
  data: unknown;
}

export type WebBlockMessageEventValidation =
  | { ok: true; message: WebBlockMessage }
  | { ok: false; reason: "source-mismatch" | "origin-denied" | "invalid-message" | "block-mismatch" };

export function validateWebBlockMessageEvent(
  event: WebBlockMessageEventLike,
  expected: { expectedSource: unknown; expectedBlockId: string }
): WebBlockMessageEventValidation {
  if (event.source !== expected.expectedSource) return { ok: false, reason: "source-mismatch" };
  if (event.origin !== "null") return { ok: false, reason: "origin-denied" };
  let message: WebBlockMessage;
  try {
    message = parseWebBlockMessage(event.data);
  } catch {
    return { ok: false, reason: "invalid-message" };
  }
  if (message.blockId !== expected.expectedBlockId) return { ok: false, reason: "block-mismatch" };
  return { ok: true, message };
}
