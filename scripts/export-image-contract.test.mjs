import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPORT_SLIDE_HEIGHT,
  EXPORT_SLIDE_WIDTH,
  assertPngDimensions,
  createSlideImageClip,
  readPngDimensions
} from "./export-image-contract.mjs";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXsAAAAASUVORK5CYII=",
  "base64"
);

test("creates an exact 1280 by 720 screenshot clip from a fractional browser box", () => {
  assert.deepEqual(
    createSlideImageClip({ x: 79.5, y: 89.25, width: 1280, height: 720 }),
    { x: 79.5, y: 89.25, width: EXPORT_SLIDE_WIDTH, height: EXPORT_SLIDE_HEIGHT }
  );
});

test("reads PNG dimensions and rejects an export with the wrong canvas", () => {
  assert.deepEqual(readPngDimensions(ONE_PIXEL_PNG), { width: 1, height: 1 });
  assert.throws(
    () => assertPngDimensions(ONE_PIXEL_PNG),
    /1280 × 720/
  );
});
