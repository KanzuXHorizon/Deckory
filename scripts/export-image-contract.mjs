import { readFileSync } from "node:fs";

export const EXPORT_SLIDE_WIDTH = 1280;
export const EXPORT_SLIDE_HEIGHT = 720;

export function createSlideImageClip(box) {
  if (!box) throw new Error("Không thể xác định vùng slide để xuất ảnh.");
  if (Math.abs(box.width - EXPORT_SLIDE_WIDTH) > 0.5 || Math.abs(box.height - EXPORT_SLIDE_HEIGHT) > 0.5) {
    throw new Error(
      `Canvas export phải là ${EXPORT_SLIDE_WIDTH} × ${EXPORT_SLIDE_HEIGHT}, nhận ${box.width} × ${box.height}.`
    );
  }

  return {
    x: box.x,
    y: box.y,
    width: EXPORT_SLIDE_WIDTH,
    height: EXPORT_SLIDE_HEIGHT
  };
}

export function readPngDimensions(input) {
  const buffer = Buffer.isBuffer(input) ? input : readFileSync(input);
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.length < 24) {
    throw new Error("Tệp export không phải PNG hợp lệ.");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

export function assertPngDimensions(input) {
  const dimensions = readPngDimensions(input);
  if (dimensions.width !== EXPORT_SLIDE_WIDTH || dimensions.height !== EXPORT_SLIDE_HEIGHT) {
    throw new Error(
      `Ảnh export phải là ${EXPORT_SLIDE_WIDTH} × ${EXPORT_SLIDE_HEIGHT}, nhận ${dimensions.width} × ${dimensions.height}.`
    );
  }
}
