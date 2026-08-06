import type { Frame, Transform2D } from "@deckory/schema";

export type Point = { x: number; y: number };
export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
export type ResizeFrameOptions = {
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
  keepRatio?: boolean;
  fromCenter?: boolean;
  minimumWidth?: number;
  minimumHeight?: number;
};

const QUARTER = 4;

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  return value;
}

export function roundSceneNumber(value: number): number {
  finite(value, "Scene number");
  const rounded = Math.round(value * QUARTER) / QUARTER;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function validateFrame(frame: Frame): Frame {
  finite(frame.x, "Frame x");
  finite(frame.y, "Frame y");
  finite(frame.width, "Frame width");
  finite(frame.height, "Frame height");
  if (frame.width <= 0 || frame.height <= 0) throw new RangeError("Frame width and height must be positive");
  return frame;
}

export function normalizeFrame(frame: Frame): Frame {
  validateFrame(frame);
  return {
    x: roundSceneNumber(frame.x),
    y: roundSceneNumber(frame.y),
    width: Math.max(1, roundSceneNumber(frame.width)),
    height: Math.max(1, roundSceneNumber(frame.height))
  };
}

export function translateFrame(frame: Frame, delta: Point): Frame {
  validateFrame(frame);
  finite(delta.x, "Translation x");
  finite(delta.y, "Translation y");
  return normalizeFrame({ ...frame, x: frame.x + delta.x, y: frame.y + delta.y });
}

export function clampFrame(
  frame: Frame,
  bounds: { x?: number; y?: number; width: number; height: number } = { width: 1280, height: 720 }
): Frame {
  const normalized = normalizeFrame(frame);
  const left = bounds.x ?? 0;
  const top = bounds.y ?? 0;
  const width = Math.min(normalized.width, bounds.width);
  const height = Math.min(normalized.height, bounds.height);
  return normalizeFrame({
    x: Math.min(Math.max(normalized.x, left), left + bounds.width - width),
    y: Math.min(Math.max(normalized.y, top), top + bounds.height - height),
    width,
    height
  });
}

export function resizeFrame(frame: Frame, options: ResizeFrameOptions): Frame {
  validateFrame(frame);
  finite(options.deltaX, "Resize deltaX");
  finite(options.deltaY, "Resize deltaY");

  const minWidth = Math.max(1, options.minimumWidth ?? 1);
  const minHeight = Math.max(1, options.minimumHeight ?? 1);
  const horizontalDirection = options.handle.includes("e") ? 1 : options.handle.includes("w") ? -1 : 0;
  const verticalDirection = options.handle.includes("s") ? 1 : options.handle.includes("n") ? -1 : 0;

  let width = Math.max(minWidth, frame.width + horizontalDirection * options.deltaX);
  let height = Math.max(minHeight, frame.height + verticalDirection * options.deltaY);

  if (options.keepRatio) {
    const ratio = frame.width / frame.height;
    if (horizontalDirection !== 0 && verticalDirection !== 0) {
      const widthChange = Math.abs(width / frame.width - 1);
      const heightChange = Math.abs(height / frame.height - 1);
      if (widthChange >= heightChange) height = Math.max(minHeight, width / ratio);
      else width = Math.max(minWidth, height * ratio);
    } else if (horizontalDirection !== 0) {
      height = Math.max(minHeight, width / ratio);
    } else if (verticalDirection !== 0) {
      width = Math.max(minWidth, height * ratio);
    }
  }

  let x = frame.x;
  let y = frame.y;
  const widthDelta = width - frame.width;
  const heightDelta = height - frame.height;

  if (options.fromCenter) {
    x -= widthDelta / 2;
    y -= heightDelta / 2;
  } else {
    if (horizontalDirection < 0) x -= widthDelta;
    if (verticalDirection < 0) y -= heightDelta;
  }

  return normalizeFrame({ x, y, width, height });
}

export function rotateTransform(transform: Transform2D | undefined, deltaDegrees: number): Transform2D {
  finite(deltaDegrees, "Rotation delta");
  return {
    ...(transform ?? {}),
    rotation: roundSceneNumber((transform?.rotation ?? 0) + deltaDegrees)
  };
}
