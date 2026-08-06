import { describe, expect, it } from "vitest";
import type { DeckDocumentV2, SceneElement } from "@deckory/schema/v2";
import { exportDeckToPptxPlan } from "./pptx-adapter.js";

function element(input: Partial<SceneElement> & Pick<SceneElement, "id" | "name" | "kind" | "content">): SceneElement {
  return {
    frame: { x: 0, y: 0, width: 120, height: 60 },
    zIndex: 1,
    accessibility: { label: input.name },
    ...input
  } as SceneElement;
}

function fixture(elements: SceneElement[], assets: DeckDocumentV2["assets"] = []): DeckDocumentV2 {
  return {
    schemaVersion: 2,
    id: "pptx-proof",
    revision: 1,
    title: "PPTX proof",
    locale: "vi-VN",
    canvas: { width: 1280, height: 720, unit: "px" },
    theme: { id: "deckory-editorial", tokens: {} },
    assets,
    slides: [{
      id: "proof",
      name: "Proof",
      purpose: "editable-export-proof",
      conclusion: "Native primitives remain editable.",
      notes: "Local fixture.",
      background: { layers: [{ id: "paper", type: "solid", color: "#ffffff", opacity: 1 }] },
      elements
    }]
  };
}

const registry = { resolveComponent: () => undefined };

describe("exportDeckToPptxPlan", () => {
  it("maps native text and shapes to editable PPTX operations", () => {
    const deck = fixture([
      element({
        id: "title",
        name: "Title",
        kind: "text",
        frame: { x: 80, y: 60, width: 760, height: 110 },
        content: { text: "Deckory giữ text editable." },
        style: { color: "#17191c", fontSize: 42, fontWeight: 760, textAlign: "left" }
      }),
      element({
        id: "panel",
        name: "Panel",
        kind: "shape",
        frame: { x: 80, y: 220, width: 480, height: 260 },
        content: { shape: "rectangle" },
        style: { fill: "#ffffff", stroke: "#d8dad6", strokeWidth: 1, borderRadius: 18 }
      }),
      element({
        id: "ellipse",
        name: "Ellipse",
        kind: "shape",
        frame: { x: 620, y: 220, width: 240, height: 180 },
        content: { shape: "ellipse" },
        opacity: 0.9,
        style: { fill: "#5147e8" }
      })
    ]);

    const plan = exportDeckToPptxPlan(deck, registry);
    expect(plan.slides[0]!.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: "title", operation: "addText", capability: "native-editable", text: "Deckory giữ text editable." }),
      expect.objectContaining({ sourceId: "panel", operation: "addShape", capability: "native-editable", shape: "rectangle" }),
      expect.objectContaining({ sourceId: "ellipse", operation: "addShape", capability: "native-editable", shape: "ellipse" })
    ]));
  });

  it("maps lines, connectors, images and groups without converting pixels to EMU", () => {
    const deck = fixture([
      element({ id: "group", name: "Group", kind: "group", frame: { x: 50, y: 50, width: 800, height: 500 }, content: { children: ["image", "line"] } }),
      element({ id: "image", name: "Image", kind: "image", parentId: "group", frame: { x: 40, y: 60, width: 320, height: 180 }, content: { assetId: "proof-image", alt: "Proof image" } }),
      element({ id: "line", name: "Line", kind: "line", parentId: "group", frame: { x: 100, y: 300, width: 280, height: 2 }, content: { x2: 280, y2: 0, markerEnd: "arrow" }, style: { stroke: "#17191c", strokeWidth: 2 } }),
      element({ id: "from", name: "From", kind: "shape", frame: { x: 500, y: 80, width: 120, height: 80 }, content: { shape: "rectangle" } }),
      element({ id: "to", name: "To", kind: "shape", frame: { x: 760, y: 300, width: 120, height: 80 }, content: { shape: "rectangle" } }),
      element({ id: "connector", name: "Connector", kind: "connector", frame: { x: 0, y: 0, width: 1, height: 1 }, content: { from: { elementId: "from" }, to: { elementId: "to" }, routing: "straight" } })
    ], [{ id: "proof-image", type: "image", src: "data:image/png;base64,iVBORw0KGgo=", mediaType: "image/png", width: 1, height: 1 }]);

    const plan = exportDeckToPptxPlan(deck, registry);
    const operations = plan.slides[0]!.elements;
    expect(operations).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: "group", operation: "addGroup", childIds: ["image", "line"] }),
      expect.objectContaining({ sourceId: "image", operation: "addImage", assetId: "proof-image" }),
      expect.objectContaining({ sourceId: "line", operation: "addLine", x: 150, y: 350, x2: 430, y2: 350 }),
      expect.objectContaining({ sourceId: "connector", operation: "addLine", x: 560, y: 120, x2: 820, y2: 340 })
    ]));
    expect(plan.canvas).toEqual({ width: 1280, height: 720, unit: "px" });
  });

  it("keeps Web Blocks as explicit fallback image operations", () => {
    const deck = fixture([
      element({
        id: "custom-radar",
        name: "Custom radar",
        kind: "web-block",
        content: { manifest: { id: "custom-radar", version: "1.0.0", staticFallback: { type: "png", assetId: "custom-radar-fallback" } } },
        exportPolicy: { pptx: "fallback", fallbackAssetId: "custom-radar-fallback" }
      })
    ], [{ id: "custom-radar-fallback", type: "image", src: "data:image/png;base64,iVBORw0KGgo=", mediaType: "image/png", width: 1, height: 1 }]);

    const plan = exportDeckToPptxPlan(deck, registry);
    expect(plan.slides[0]!.elements).toContainEqual(expect.objectContaining({
      sourceId: "custom-radar",
      operation: "addFallbackImage",
      capability: "fallback",
      assetId: "custom-radar-fallback"
    }));
  });

  it("reports unsupported elements instead of dropping them", () => {
    const deck = fixture([
      element({ id: "chart", name: "Chart", kind: "chart", content: { chart: {} as never } })
    ]);

    const plan = exportDeckToPptxPlan(deck, registry);
    expect(plan.slides[0]!.elements).toContainEqual(expect.objectContaining({
      sourceId: "chart",
      operation: "unsupported",
      capability: "unsupported"
    }));
    expect(plan.warnings).toContainEqual(expect.stringMatching(/Chart.*không hỗ trợ PPTX/i));
  });
});
