import { describe, expect, it } from "vitest";
import type { DeckDocumentV2 } from "@deckory/schema/v2";
import { exportDeckToStandaloneHtml } from "./html-export";

const registry = { resolveComponent: () => undefined };

function deck(): DeckDocumentV2 {
  return {
    schemaVersion: 2,
    id: "standalone-html-fixture",
    revision: 2,
    title: "Deckory V2 — HTML độc lập",
    locale: "vi-VN",
    canvas: { width: 1280, height: 720, unit: "px" },
    theme: { id: "deckory-editorial", tokens: {} },
    assets: [],
    slides: [{
      id: "proof",
      name: "Proof",
      background: { layers: [{ id: "paper", type: "solid", color: "#f7f7f4", opacity: 1 }] },
      elements: [
        {
          id: "title",
          name: "Title",
          kind: "text",
          frame: { x: 80, y: 88, width: 920, height: 140 },
          zIndex: 1,
          content: { text: "Deckory V2 xuất HTML độc lập." },
          style: { color: "#17191c", fontSize: 52 },
          accessibility: { label: "Deckory V2 xuất HTML độc lập.", readingOrder: 1 }
        },
        {
          id: "panel",
          name: "Panel",
          kind: "shape",
          frame: { x: 80, y: 280, width: 520, height: 260 },
          zIndex: 2,
          content: { shape: "rectangle" },
          style: { fill: "#ffffff", stroke: "#d8dad6", strokeWidth: 1, borderRadius: 20 },
          accessibility: { decorative: true }
        }
      ]
    }]
  };
}

describe("exportDeckToStandaloneHtml", () => {
  it("produces one self-contained document with no remote references", async () => {
    const html = await exportDeckToStandaloneHtml(deck(), { registry });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Deckory V2 xuất HTML độc lập.");
    expect(html).toContain('data-standalone-deck-id="standalone-html-fixture"');
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toContain("react-moveable");
    expect(html).not.toContain("react-selecto");
    expect(html).not.toContain("esbuild-wasm");
  });

  it("freezes motion and interactions through export render mode", async () => {
    const source = deck();
    source.slides[0]!.elements[0]!.motion = [{
      id: "title-enter",
      type: "entrance",
      trigger: "on-enter",
      duration: 0.5,
      finalState: { opacity: 1, translateY: 0 }
    }];
    const html = await exportDeckToStandaloneHtml(source, { registry });

    expect(html).toContain('data-render-mode="export"');
    expect(html).toContain('data-motion-mode="export"');
    expect(html).not.toContain("contenteditable");
  });

  it("returns byte-for-byte deterministic output for the same deck", async () => {
    const first = await exportDeckToStandaloneHtml(deck(), { registry });
    const second = await exportDeckToStandaloneHtml(deck(), { registry });
    expect(second).toBe(first);
  });

  it("embeds a machine-readable capability report without changing the visual artifact", async () => {
    const html = await exportDeckToStandaloneHtml(deck(), { registry });
    expect(html).toContain('id="deckory-export-report"');
    expect(html).toContain('&quot;deckId&quot;:&quot;standalone-html-fixture&quot;');
  });
});
