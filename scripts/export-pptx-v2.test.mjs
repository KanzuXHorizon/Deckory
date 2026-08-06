import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { writePptxV2 } from "./export-pptx-v2.mjs";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXsAAAAASUVORK5CYII=",
  "base64"
);

const geometry = (x, y, width, height) => ({ x, y, width, height });

function proofPlan() {
  return {
    version: 1,
    deckId: "pptx-v2-proof",
    revision: 1,
    title: "Deckory editable PPTX proof",
    canvas: { width: 1280, height: 720, unit: "px" },
    warnings: ["Custom radar uses declared fallback."],
    slides: [{
      sourceId: "proof",
      name: "Editable proof",
      warnings: [],
      elements: [
        {
          sourceId: "group",
          sourceName: "Proof group",
          geometry: geometry(60, 60, 900, 520),
          zIndex: 1,
          operation: "addGroup",
          capability: "native-editable",
          childIds: ["title", "panel", "line", "image"]
        },
        {
          sourceId: "title",
          sourceName: "Title",
          geometry: geometry(90, 80, 720, 90),
          zIndex: 2,
          operation: "addText",
          capability: "native-editable",
          text: "Deckory giữ text editable.",
          style: { color: "#17191c", fontSize: 40, fontWeight: 760, textAlign: "left" }
        },
        {
          sourceId: "panel",
          sourceName: "Panel",
          geometry: geometry(90, 210, 420, 240),
          zIndex: 1,
          operation: "addShape",
          capability: "native-editable",
          shape: "rectangle",
          style: { fill: "#ffffff", stroke: "#d8dad6", strokeWidth: 1 }
        },
        {
          sourceId: "line",
          sourceName: "Line",
          geometry: geometry(100, 480, 360, 2),
          zIndex: 3,
          operation: "addLine",
          capability: "native-editable",
          x: 100,
          y: 480,
          x2: 460,
          y2: 480,
          markerEnd: "arrow",
          style: { stroke: "#5147e8", strokeWidth: 2 }
        },
        {
          sourceId: "image",
          sourceName: "Proof image",
          geometry: geometry(560, 210, 320, 180),
          zIndex: 2,
          operation: "addImage",
          capability: "native-editable",
          assetId: "proof-image",
          alt: "Proof image"
        },
        {
          sourceId: "custom-radar",
          sourceName: "Custom radar",
          geometry: geometry(980, 180, 220, 220),
          zIndex: 4,
          operation: "addFallbackImage",
          capability: "fallback",
          assetId: "custom-radar-fallback",
          fallbackType: "png",
          reason: "Declared Web Block fallback"
        }
      ]
    }]
  };
}

test("writes native editable DrawingML and only declared fallback media", () => {
  const directory = mkdtempSync(join(tmpdir(), "deckory-pptx-v2-"));
  try {
    const outputPath = join(directory, "proof.pptx");
    writePptxV2({
      plan: proofPlan(),
      outputPath,
      createdAt: "2026-08-06T00:00:00.000Z",
      resolveAsset: (assetId) => ({ data: ONE_PIXEL_PNG, mediaType: "image/png", extension: "png", assetId })
    });

    const entries = readStoredZip(readFileSync(outputPath));
    const slide = entries.get("ppt/slides/slide1.xml")?.toString("utf8") ?? "";
    const rels = entries.get("ppt/slides/_rels/slide1.xml.rels")?.toString("utf8") ?? "";
    const presentation = entries.get("ppt/presentation.xml")?.toString("utf8") ?? "";

    assert.match(presentation, /<p:sldIdLst>.*r:id="rId2".*<\/p:sldIdLst>/);
    assert.match(slide, /<a:t>Deckory giữ text editable\.<\/a:t>/);
    assert.match(slide, /<p:sp>.*<a:prstGeom prst="rect">/s);
    assert.match(slide, /<p:cxnSp>/);
    assert.match(slide, /<p:grpSp>/);
    assert.match(slide, /<p:pic>/);
    assert.ok(entries.has("ppt/media/media1.png"));
    assert.ok(entries.has("ppt/media/media2.png"));
    assert.equal([...entries.keys()].filter((name) => name.startsWith("ppt/media/")).length, 2);
    assert.match(rels, /Target="\.\.\/media\/media1\.png"/);
    assert.match(rels, /Target="\.\.\/media\/media2\.png"/);
    assert.doesNotMatch(rels, /TargetMode="External"|Target="https?:\/\//i);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("is deterministic when createdAt and inputs are fixed", () => {
  const directory = mkdtempSync(join(tmpdir(), "deckory-pptx-v2-deterministic-"));
  try {
    const first = join(directory, "first.pptx");
    const second = join(directory, "second.pptx");
    const options = {
      plan: proofPlan(),
      createdAt: "2026-08-06T00:00:00.000Z",
      resolveAsset: () => ({ data: ONE_PIXEL_PNG, mediaType: "image/png", extension: "png" })
    };
    writePptxV2({ ...options, outputPath: first });
    writePptxV2({ ...options, outputPath: second });
    assert.equal(readFileSync(first).compare(readFileSync(second)), 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejects unsupported plan elements instead of silently omitting them", () => {
  const plan = proofPlan();
  plan.slides[0].elements.push({
    sourceId: "chart",
    sourceName: "Chart",
    geometry: geometry(0, 0, 100, 100),
    zIndex: 5,
    operation: "unsupported",
    capability: "unsupported",
    reason: "Chart adapter unavailable"
  });
  assert.throws(
    () => writePptxV2({ plan, outputPath: "unused.pptx", resolveAsset: () => undefined }),
    /unsupported.*chart/i
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
    assert.equal(compression, 0);
    const filenameStart = offset + 30;
    const filenameEnd = filenameStart + filenameLength;
    const dataStart = filenameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;
    const filename = buffer.subarray(filenameStart, filenameEnd).toString("utf8");
    entries.set(filename, buffer.subarray(dataStart, dataEnd));
    offset = dataEnd;
  }
  assert.ok(entries.size > 0);
  assert.equal(buffer.readUInt32LE(offset), 0x02014b50);
  return entries;
}
