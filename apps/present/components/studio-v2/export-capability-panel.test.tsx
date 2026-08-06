import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckExportReport } from "@deckory/renderer";
import { ExportCapabilityPanel } from "./export-capability-panel";

function report(): DeckExportReport {
  return {
    deckId: "fixture",
    revision: 3,
    slideCount: 1,
    elementCount: 2,
    targets: {
      html: { native: 1, nativeEditable: 0, fallback: 1, unsupported: 0 },
      svg: { native: 1, nativeEditable: 0, fallback: 1, unsupported: 0 },
      png: { native: 1, nativeEditable: 0, fallback: 1, unsupported: 0 },
      pdf: { native: 1, nativeEditable: 0, fallback: 1, unsupported: 0 },
      pptx: { native: 0, nativeEditable: 1, fallback: 0, unsupported: 1 }
    },
    elements: [
      {
        elementId: "panel",
        elementName: "Panel",
        kind: "shape",
        html: "native",
        svg: "native",
        png: "native",
        pdf: "native",
        pptx: "native-editable",
        responsible: { type: "deckory-native", id: "shape" },
        reasons: { pptx: "Deckory native shape." },
        warnings: []
      },
      {
        elementId: "custom-radar",
        elementName: "Custom radar",
        kind: "web-block",
        html: "fallback",
        svg: "fallback",
        png: "fallback",
        pdf: "fallback",
        pptx: "unsupported",
        fallback: { type: "png", assetId: "custom-radar-fallback" },
        responsible: { type: "web-block", id: "custom-radar", version: "1.0.0" },
        reasons: {
          svg: "Web Block dùng static fallback png cho svg.",
          pptx: "Web Block không hỗ trợ PPTX."
        },
        warnings: ["Custom radar dùng fallback cho svg.", "Custom radar không hỗ trợ pptx."]
      }
    ],
    warnings: ["Custom radar dùng fallback cho svg.", "Custom radar không hỗ trợ pptx."]
  };
}

describe("ExportCapabilityPanel", () => {
  it("shows a deck summary before export starts", () => {
    const html = renderToStaticMarkup(<ExportCapabilityPanel report={report()} />);

    expect(html).toContain('data-export-capability-panel="true"');
    expect(html).toContain("Khả năng xuất");
    expect(html).toContain("PPTX");
    expect(html).toContain("1 editable");
    expect(html).toContain("1 không hỗ trợ");
    expect(html).toContain("Fallback và unsupported luôn được công bố trước khi xuất");
  });

  it("shows selected-element reasons and fallback asset", () => {
    const html = renderToStaticMarkup(<ExportCapabilityPanel report={report()} selectedElementId="custom-radar" />);

    expect(html).toContain("Custom radar");
    expect(html).toContain("custom-radar@1.0.0");
    expect(html).toContain("custom-radar-fallback");
    expect(html).toContain("Web Block dùng static fallback png cho svg.");
    expect(html).toContain("Web Block không hỗ trợ PPTX.");
  });

  it("renders a precise empty selection state", () => {
    const html = renderToStaticMarkup(<ExportCapabilityPanel report={report()} selectedElementId="missing" />);
    expect(html).toContain("Chọn một thành phần để xem chi tiết theo định dạng");
  });
});
