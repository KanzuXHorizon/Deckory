import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { writeImageDeckPptx } from "./pptx-image-deck.mjs";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXsAAAAASUVORK5CYII=",
  "base64"
);

test("writes an Office-compatible image deck with one image per slide", () => {
  const directory = mkdtempSync(join(tmpdir(), "deckory-pptx-"));
  try {
    const firstImage = join(directory, "slide-1.png");
    const secondImage = join(directory, "slide-2.png");
    const outputPath = join(directory, "deck.pptx");
    writeFileSync(firstImage, ONE_PIXEL_PNG);
    writeFileSync(secondImage, ONE_PIXEL_PNG);

    writeImageDeckPptx({
      outputPath,
      title: "Deckory & kiểm chứng <PPTX>",
      imagePaths: [firstImage, secondImage]
    });

    const entries = readStoredZip(readFileSync(outputPath));
    assert.ok(entries.has("[Content_Types].xml"));
    assert.ok(entries.has("ppt/presentation.xml"));
    assert.ok(entries.has("ppt/slides/slide1.xml"));
    assert.ok(entries.has("ppt/slides/slide2.xml"));
    assert.ok(entries.has("ppt/media/image1.png"));
    assert.ok(entries.has("ppt/media/image2.png"));
    assert.equal(entries.get("ppt/media/image1.png")?.compare(ONE_PIXEL_PNG), 0);

    const presentation = entries.get("ppt/presentation.xml")?.toString("utf8") ?? "";
    const core = entries.get("docProps/core.xml")?.toString("utf8") ?? "";
    const slideRelationship = entries.get("ppt/slides/_rels/slide2.xml.rels")?.toString("utf8") ?? "";
    assert.match(presentation, /<p:sldIdLst>.*r:id="rId2".*r:id="rId3".*<\/p:sldIdLst>/);
    assert.match(presentation, /type="screen16x9"/);
    assert.match(core, /Deckory &amp; kiểm chứng &lt;PPTX&gt;/);
    assert.match(slideRelationship, /Target="\.\.\/media\/image2\.png"/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejects an empty image deck", () => {
  assert.throws(
    () => writeImageDeckPptx({ outputPath: "unused.pptx", title: "Empty", imagePaths: [] }),
    /ít nhất một ảnh slide/
  );
});

function readStoredZip(buffer) {
  const entries = new Map();
  let offset = 0;

  while (offset + 4 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const filenameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    assert.equal(compression, 0, "PPTX writer should use stored ZIP entries for deterministic output");

    const filenameStart = offset + 30;
    const filenameEnd = filenameStart + filenameLength;
    const dataStart = filenameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;
    assert.ok(dataEnd <= buffer.length, "ZIP entry must stay within the output buffer");

    const filename = buffer.subarray(filenameStart, filenameEnd).toString("utf8");
    entries.set(filename, buffer.subarray(dataStart, dataEnd));
    offset = dataEnd;
  }

  assert.ok(entries.size > 0, "PPTX must contain local ZIP entries");
  assert.equal(buffer.readUInt32LE(offset), 0x02014b50, "Local entries must be followed by a central directory");
  return entries;
}
