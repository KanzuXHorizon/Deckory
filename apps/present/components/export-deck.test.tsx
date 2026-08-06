import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckDocument, DeckDocumentV2 } from "@deckory/schema";
import { sceneFoundationDeck } from "../lib/deck-catalog";
import { ExportDeck } from "./export-deck";

const deck: DeckDocument = {
  id: "export-contract",
  version: 1,
  title: "Export contract",
  locale: "vi-VN",
  themeId: "export-contract",
  slides: [
    {
      id: "cover",
      layout: "cover",
      notes: "Ghi chú riêng tư không được xuất.",
      components: [
        { id: "heading", type: "heading", props: { title: "Xuất cùng renderer đã kiểm chứng" } }
      ]
    },
    {
      id: "evidence",
      layout: "data",
      notes: "Giải thích chart khi thuyết trình.",
      components: [
        { id: "heading", type: "heading", props: { title: "Mọi reveal được xuất ở trạng thái hoàn chỉnh" } },
        {
          id: "chart",
          type: "chart",
          sequence: 2,
          props: {
            title: "Độ phủ",
            unit: "điểm",
            values: [{ label: "Export", value: 100, highlight: true }]
          }
        },
        { id: "footer", type: "evidence-footer", props: { source: "Fixture minh hoạ" } }
      ]
    }
  ]
};

describe("ExportDeck", () => {
  it("renders V2 scenes in export mode and discloses the capability report", () => {
    const html = renderToStaticMarkup(<ExportDeck deck={sceneFoundationDeck} />);

    expect(html).toContain('data-export-deck-id="scene-foundation"');
    expect(html).toContain('data-export-slide-id="cover"');
    expect(html).toContain('class="scene-slide"');
    expect(html).toContain('data-render-mode="export"');
    expect(html).toContain('data-element-id="title"');
    expect(html).toContain("Một scene graph dùng chung cho mọi bề mặt.");
    expect(html).toContain('data-export-capability-report="true"');
    expect(html).toContain("Báo cáo khả năng xuất");
    expect(html).toContain('data-export-capability-json="true"');
    expect(html).toContain("PDF");
    expect(html).toContain("PNG");
  });

  it("shows fallback and unsupported counts before export", () => {
    const webBlockDeck: DeckDocumentV2 = {
      ...sceneFoundationDeck,
      id: "web-block-export-proof",
      title: "Web Block export proof",
      visualIntelligence: {},
      assets: [{
        id: "custom-radar-fallback",
        type: "image",
        src: "data:image/png;base64,iVBORw0KGgo=",
        mediaType: "image/png",
        width: 640,
        height: 360
      }],
      slides: [{
        ...sceneFoundationDeck.slides[0]!,
        id: "fallback-proof",
        elements: [{
          id: "custom-radar",
          name: "Custom radar",
          kind: "web-block",
          frame: { x: 100, y: 100, width: 640, height: 360 },
          zIndex: 1,
          content: {
            sourceId: "custom-radar-source",
            manifest: {
              id: "custom-radar",
              version: "1.0.0",
              entry: "index.html",
              framework: "html",
              accessibleSummary: "Radar minh hoạ",
              staticFallback: { type: "png", assetId: "custom-radar-fallback" },
              allowedImports: [],
              payloadBytes: 64,
              localAssetBytes: 0
            }
          },
          accessibility: { label: "Radar minh hoạ" },
          exportPolicy: { html: "fallback", svg: "fallback", png: "fallback", pdf: "fallback", pptx: "unsupported", fallbackAssetId: "custom-radar-fallback" }
        }]
      }]
    };

    const html = renderToStaticMarkup(<ExportDeck deck={webBlockDeck} />);
    expect(html).toContain("1 thành phần dùng fallback");
    expect(html).toContain("1 thành phần không hỗ trợ");
    expect(html).toContain('data-web-block-status="static-export"');
    expect(html).toContain("custom-radar-fallback");
  });

  it("renders every slide at a stable export boundary without speaker notes", () => {
    const html = renderToStaticMarkup(<ExportDeck deck={deck} />);

    expect(html).toContain('data-export-ready="true"');
    expect(html).toContain('data-export-deck-id="export-contract"');
    expect(html).toContain('data-export-slide-id="cover"');
    expect(html).toContain('data-export-slide-id="evidence"');
    expect(html).toContain('data-visible="true"');
    expect(html).toContain("In / Lưu PDF");
    expect(html).toContain("PNG");
    expect(html).toContain("JPG");
    expect(html).toContain("PPTX");
    expect(html).toContain("PDF + PNG + JPG + PPTX");
    expect(html).toContain("Sao chép lệnh");
    expect(html).toContain("mở terminal tại thư mục Deckory");
    expect(html).not.toContain("Ghi chú riêng tư không được xuất.");
    expect(html).not.toContain("Giải thích chart khi thuyết trình.");
    expect(html).not.toContain("speaker-note-copy");
  });
});
