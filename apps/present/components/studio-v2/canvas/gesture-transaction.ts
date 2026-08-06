import type { Frame, Transform2D } from "@deckory/schema/v2";

export type StudioTransformChange = {
  elementId: string;
  frame: Frame;
  transform?: Transform2D;
};

export type StudioTransformCommand = {
  type: "transform-elements";
  slideId: string;
  changes: StudioTransformChange[];
};

export type GestureTransaction = {
  slideId: string;
  elementOrder: string[];
  originalFrames: Record<string, Frame>;
  originalTransforms?: Record<string, Transform2D | undefined>;
};

export type GestureCommitResult = {
  frames: Record<string, Frame>;
  transforms?: Record<string, Transform2D | undefined>;
  commands: StudioTransformCommand[];
};

function cloneFrames(frames: Record<string, Frame>): Record<string, Frame> {
  return Object.fromEntries(Object.entries(frames).map(([id, frame]) => [id, { ...frame }]));
}

function cloneTransforms(transforms: Record<string, Transform2D | undefined>): Record<string, Transform2D | undefined> {
  return Object.fromEntries(Object.entries(transforms).map(([id, transform]) => [id, transform ? { ...transform } : undefined]));
}

function roundQuarter(value: number): number {
  if (!Number.isFinite(value)) throw new TypeError("Gesture geometry must be finite");
  const rounded = Math.round(value * 4) / 4;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function roundScale(value: number): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError("Gesture scale must be finite and positive");
  return Math.round(value * 10_000) / 10_000;
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

function normalizeTransform(transform: Transform2D | undefined): Transform2D | undefined {
  if (!transform) return undefined;
  const next: Transform2D = {};
  if (transform.rotation !== undefined) next.rotation = roundQuarter(transform.rotation);
  if (transform.scaleX !== undefined) next.scaleX = roundScale(transform.scaleX);
  if (transform.scaleY !== undefined) next.scaleY = roundScale(transform.scaleY);
  if (transform.skewX !== undefined) next.skewX = roundQuarter(transform.skewX);
  if (transform.skewY !== undefined) next.skewY = roundQuarter(transform.skewY);
  if (transform.originX !== undefined) next.originX = roundQuarter(transform.originX);
  if (transform.originY !== undefined) next.originY = roundQuarter(transform.originY);
  return next;
}

function sameFrame(left: Frame, right: Frame): boolean {
  return left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height;
}

function sameTransform(left: Transform2D | undefined, right: Transform2D | undefined): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export function toLogicalDelta(delta: { x: number; y: number }, zoom: number): { x: number; y: number } {
  if (!Number.isFinite(zoom) || zoom <= 0) throw new RangeError("Canvas zoom must be finite and positive");
  return { x: roundQuarter(delta.x / zoom), y: roundQuarter(delta.y / zoom) };
}

export function nudgeDeltaForKey(key: string, accelerated: boolean): { x: number; y: number } | undefined {
  const amount = accelerated ? 10 : 1;
  if (key === "ArrowLeft") return { x: -amount, y: 0 };
  if (key === "ArrowRight") return { x: amount, y: 0 };
  if (key === "ArrowUp") return { x: 0, y: -amount };
  if (key === "ArrowDown") return { x: 0, y: amount };
  return undefined;
}

export function beginGestureTransaction(
  slideId: string,
  frames: Record<string, Frame>,
  transforms?: Record<string, Transform2D | undefined>
): GestureTransaction {
  const elementOrder = Object.keys(frames);
  if (elementOrder.length === 0) throw new Error("Không thể bắt đầu gesture khi chưa chọn thành phần.");
  const transaction: GestureTransaction = { slideId, elementOrder, originalFrames: cloneFrames(frames) };
  if (transforms !== undefined) transaction.originalTransforms = cloneTransforms(transforms);
  return transaction;
}

export function commitGestureTransaction(
  transaction: GestureTransaction,
  finalFrames: Record<string, Frame>,
  finalTransforms?: Record<string, Transform2D | undefined>
): GestureCommitResult {
  const normalizedFrames: Record<string, Frame> = {};
  const normalizedTransforms: Record<string, Transform2D | undefined> = {};
  const includeTransforms = transaction.originalTransforms !== undefined || finalTransforms !== undefined;
  const changes = transaction.elementOrder.map((elementId) => {
    const finalFrame = finalFrames[elementId];
    if (!finalFrame) throw new Error(`Gesture thiếu frame cuối cho thành phần "${elementId}".`);
    const frame = normalizeFrame(finalFrame);
    normalizedFrames[elementId] = frame;

    const hasFinalTransform = finalTransforms !== undefined && Object.prototype.hasOwnProperty.call(finalTransforms, elementId);
    const transform = normalizeTransform(hasFinalTransform
      ? finalTransforms[elementId]
      : transaction.originalTransforms?.[elementId]);
    if (includeTransforms) normalizedTransforms[elementId] = transform;

    const change: StudioTransformChange = { elementId, frame };
    if (transform !== undefined) change.transform = transform;
    return change;
  });

  const changed = changes.some(({ elementId, frame, transform }) => {
    const originalFrame = transaction.originalFrames[elementId]!;
    const originalTransform = normalizeTransform(transaction.originalTransforms?.[elementId]);
    return !sameFrame(frame, originalFrame) || !sameTransform(transform, originalTransform);
  });
  const result: GestureCommitResult = {
    frames: normalizedFrames,
    commands: changed ? [{ type: "transform-elements", slideId: transaction.slideId, changes }] : []
  };
  if (includeTransforms) result.transforms = normalizedTransforms;
  return result;
}

export function cancelGestureTransaction(transaction: GestureTransaction): GestureCommitResult {
  const result: GestureCommitResult = { frames: cloneFrames(transaction.originalFrames), commands: [] };
  if (transaction.originalTransforms !== undefined) result.transforms = cloneTransforms(transaction.originalTransforms);
  return result;
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
