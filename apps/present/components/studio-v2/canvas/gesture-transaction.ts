import type { Frame } from "@deckory/schema/v2";

export type StudioTransformCommand = {
  type: "transform-elements";
  slideId: string;
  changes: Array<{ elementId: string; frame: Frame }>;
};

export type GestureTransaction = {
  slideId: string;
  elementOrder: string[];
  originalFrames: Record<string, Frame>;
};

export type GestureCommitResult = {
  frames: Record<string, Frame>;
  commands: StudioTransformCommand[];
};

function cloneFrames(frames: Record<string, Frame>): Record<string, Frame> {
  return Object.fromEntries(Object.entries(frames).map(([id, frame]) => [id, { ...frame }]));
}

function roundQuarter(value: number): number {
  if (!Number.isFinite(value)) throw new TypeError("Gesture geometry must be finite");
  const rounded = Math.round(value * 4) / 4;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function normalizeFrame(frame: Frame): Frame {
  if (frame.width <= 0 || frame.height <= 0) throw new RangeError("Gesture frame size must be positive");
  return {
    x: roundQuarter(frame.x),
    y: roundQuarter(frame.y),
    width: Math.max(1, roundQuarter(frame.width)),
    height: Math.max(1, roundQuarter(frame.height))
  };
}

export function toLogicalDelta(delta: { x: number; y: number }, zoom: number): { x: number; y: number } {
  if (!Number.isFinite(zoom) || zoom <= 0) throw new RangeError("Canvas zoom must be finite and positive");
  return { x: roundQuarter(delta.x / zoom), y: roundQuarter(delta.y / zoom) };
}

export function beginGestureTransaction(slideId: string, frames: Record<string, Frame>): GestureTransaction {
  const elementOrder = Object.keys(frames);
  if (elementOrder.length === 0) throw new Error("Không thể bắt đầu gesture khi chưa chọn thành phần.");
  return { slideId, elementOrder, originalFrames: cloneFrames(frames) };
}

export function commitGestureTransaction(
  transaction: GestureTransaction,
  finalFrames: Record<string, Frame>
): GestureCommitResult {
  const normalized = cloneFrames(finalFrames);
  const changes = transaction.elementOrder.map((elementId) => {
    const frame = normalized[elementId];
    if (!frame) throw new Error(`Gesture thiếu frame cuối cho thành phần "${elementId}".`);
    return { elementId, frame: normalizeFrame(frame) };
  });
  const changed = changes.some(({ elementId, frame }) => {
    const original = transaction.originalFrames[elementId]!;
    return frame.x !== original.x || frame.y !== original.y || frame.width !== original.width || frame.height !== original.height;
  });
  return {
    frames: Object.fromEntries(changes.map(({ elementId, frame }) => [elementId, frame])),
    commands: changed ? [{ type: "transform-elements", slideId: transaction.slideId, changes }] : []
  };
}

export function cancelGestureTransaction(transaction: GestureTransaction): GestureCommitResult {
  return { frames: cloneFrames(transaction.originalFrames), commands: [] };
}

export function createNudgeCommand(
  slideId: string,
  frames: Record<string, Frame>,
  delta: { x: number; y: number }
): StudioTransformCommand {
  const changes = Object.entries(frames).map(([elementId, frame]) => ({
    elementId,
    frame: normalizeFrame({ ...frame, x: frame.x + delta.x, y: frame.y + delta.y })
  }));
  if (changes.length === 0) throw new Error("Không thể nudge khi chưa chọn thành phần.");
  return { type: "transform-elements", slideId, changes };
}
