"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, FileDown, Images, Presentation, Printer } from "lucide-react";
import { SceneRenderer, resolveDeckExportReport, type ExportCapabilityRegistry, type SceneRendererExtensions } from "@deckory/renderer";
import type { DeckDocument, DeckDocumentV2, SceneSlide, Slide } from "@deckory/schema";
import { deckThemeClassName } from "../lib/deck-theme";
import { isDeckDocumentV2 } from "../lib/deck-version";
import { createDeckExportCommand, type DeckExportCliFormat } from "../lib/export-command";
import { DeckoryBrand } from "./brand-mark";
import { SlideFrame } from "./slide-frame";

const EMPTY_EXPORT_REGISTRY: ExportCapabilityRegistry = {
  resolveComponent: () => undefined
};

function fallbackAssetId(manifest: Record<string, unknown>): string | undefined {
  const fallback = manifest.staticFallback;
  if (!fallback || typeof fallback !== "object") return undefined;
  const assetId = (fallback as Record<string, unknown>).assetId;
  return typeof assetId === "string" ? assetId : undefined;
}

export function ExportDeck({ deck }: { deck: DeckDocument | DeckDocumentV2 }) {
  const v2 = isDeckDocumentV2(deck);
  const themeClassName = v2 ? "deck-theme--editorial-light" : deckThemeClassName(deck);
  const exportReport = useMemo(() => v2 ? resolveDeckExportReport(deck, EMPTY_EXPORT_REGISTRY) : undefined, [deck, v2]);
  const rendererExtensions = useMemo<SceneRendererExtensions | undefined>(() => {
    if (!v2) return undefined;
    return {
      exportTarget: "pdf",
      webBlocks: {
        resolve: ({ manifest }) => {
          const assetId = fallbackAssetId(manifest);
          const fallbackSrc = assetId ? deck.assets.find((asset) => asset.id === assetId)?.src : undefined;
          return fallbackSrc ? { fallbackSrc } : undefined;
        }
      }
    };
  }, [deck, v2]);
  const [copyState, setCopyState] = useState<{ format: DeckExportCliFormat; status: "copied" | "error" } | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
  }, []);

  const copyExportCommand = async (format: DeckExportCliFormat) => {
    const command = createDeckExportCommand(deck.id, format);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(command);
      setCopyState({ format, status: "copied" });
    } catch {
      setCopyState({ format, status: "error" });
    }

    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => {
      setCopyState((current) => current?.format === format ? null : current);
      resetTimerRef.current = null;
    }, 2_400);
  };

  return (
    <main
      className={`export-shell ${themeClassName}`}
      data-export-ready="true"
      data-export-deck-id={deck.id}
    >
      <header className="export-toolbar" aria-label="Điều khiển xuất deck">
        <div className="export-toolbar-brand">
          <Link href="/" aria-label="Về Deckory Hub"><DeckoryBrand /></Link>
          <span>EXPORT</span>
        </div>
        <div className="export-toolbar-copy">
          <strong>{deck.title}</strong>
          <span>{deck.slides.length} trang chiếu · 16:9 · dùng cùng bộ dựng với chế độ trình chiếu</span>
        </div>
        <div className="export-toolbar-actions">
          <Link className="toolbar-button" href={`/present?deck=${deck.id}`}>
            <ArrowLeft size={16} />
            <span>Về chế độ trình chiếu</span>
          </Link>
          <button
            type="button"
            className="toolbar-button primary"
            onClick={() => window.print()}
            aria-label="In hoặc lưu deck thành PDF"
          >
            <Printer size={17} />
            <span>In / Lưu PDF</span>
          </button>
        </div>
      </header>

      <section className="export-intro" aria-label="Thông tin xuất">
        <FileDown size={18} aria-hidden="true" />
        <p>Mỗi trang chiếu được cố định ở 1280 × 720. Ghi chú diễn giả và các điều khiển trình chiếu không xuất hiện trong tài liệu xuất.</p>
      </section>

      {exportReport ? <ExportCapabilityReport report={exportReport} /> : null}

      <section className="export-format-panel" aria-labelledby="export-format-title">
        <div>
          <span>ĐỊNH DẠNG XUẤT</span>
          <h2 id="export-format-title">PDF trực tiếp; ảnh và PowerPoint qua lệnh offline.</h2>
          <p>PDF mở hộp thoại in ngay trong trình duyệt. Các nút PNG, JPG, PPTX và Tất cả sao chép lệnh CLI để Chromium dựng đúng phông chữ, bố cục và tỷ lệ 16:9 trên máy này.</p>
          <p className="export-format-note"><strong>Cách dùng:</strong> sao chép lệnh, mở terminal tại thư mục Deckory rồi dán và chạy.</p>
          <div className="export-copy-feedback" role="status" aria-live="polite">
            {copyState?.status === "copied" && `Đã sao chép lệnh ${copyState.format.toUpperCase()}.`}
            {copyState?.status === "error" && "Không thể sao chép tự động. Hãy dùng terminal và nhập lệnh export thủ công."}
          </div>
        </div>
        <div className="export-format-actions" role="group" aria-label="Các định dạng xuất">
          <button type="button" onClick={() => window.print()}><Printer size={17} /><strong>PDF</strong><span>In hoặc lưu trực tiếp</span></button>
          <button type="button" onClick={() => void copyExportCommand("png")}><Images size={17} /><strong>PNG</strong><ExportCommandStatus state={copyState} format="png" fallback="Sao chép lệnh · ảnh không mất dữ liệu" /></button>
          <button type="button" onClick={() => void copyExportCommand("jpg")}><Images size={17} /><strong>JPG</strong><ExportCommandStatus state={copyState} format="jpg" fallback="Sao chép lệnh · ảnh dung lượng gọn" /></button>
          <button type="button" onClick={() => void copyExportCommand("pptx")}><Presentation size={17} /><strong>PPTX</strong><ExportCommandStatus state={copyState} format="pptx" fallback="Sao chép lệnh · một ảnh mỗi slide" /></button>
          <button type="button" onClick={() => void copyExportCommand("all")}><FileDown size={17} /><strong>Tất cả</strong><ExportCommandStatus state={copyState} format="all" fallback="Sao chép lệnh · PDF + PNG + JPG + PPTX" /></button>
        </div>
      </section>

      <div className="export-pages">
        {deck.slides.map((slide, index) => (
          <section
            className="export-page"
            data-export-slide-id={slide.id}
            data-export-slide-index={index + 1}
            aria-label={`Trang chiếu ${index + 1} trên ${deck.slides.length}: ${slide.id}`}
            key={slide.id}
          >
            {v2 ? (
              <SceneRenderer
                slide={slide as SceneSlide}
                assets={deck.assets}
                mode="export"
                {...(rendererExtensions ? { extensions: rendererExtensions } : {})}
              />
            ) : (
              <SlideFrame
                slide={slide as Slide}
                deckId={deck.id}
                assets={deck.assets}
                sequenceStep={Number.MAX_SAFE_INTEGER}
                reducedMotion
                motionDisabled
              />
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

function ExportCapabilityReport({
  report
}: {
  report: ReturnType<typeof resolveDeckExportReport>;
}) {
  const fallbackElements = report.elements.filter((element) =>
    [element.html, element.svg, element.png, element.pdf, element.pptx].includes("fallback"));
  const unsupportedElements = report.elements.filter((element) =>
    [element.html, element.svg, element.png, element.pdf, element.pptx].includes("unsupported"));
  const fallbackAssets = [...new Set(fallbackElements.flatMap((element) => element.fallback?.assetId ? [element.fallback.assetId] : []))];

  return (
    <section className="export-capability-report" data-export-capability-report="true" aria-labelledby="export-capability-title">
      <div>
        <span>EXPORT CAPABILITY</span>
        <h2 id="export-capability-title">Báo cáo khả năng xuất</h2>
        <p>Capability được tính từ từng phần tử trước khi Chromium tạo PNG hoặc PDF. Fallback và unsupported không được trình bày như native-editable.</p>
      </div>
      <dl>
        <div><dt>PNG</dt><dd>{report.targets.png.native + report.targets.png.nativeEditable} native · {report.targets.png.fallback} fallback · {report.targets.png.unsupported} unsupported</dd></div>
        <div><dt>PDF</dt><dd>{report.targets.pdf.native + report.targets.pdf.nativeEditable} native · {report.targets.pdf.fallback} fallback · {report.targets.pdf.unsupported} unsupported</dd></div>
        <div><dt>Toàn deck</dt><dd>{fallbackElements.length} thành phần dùng fallback · {unsupportedElements.length} thành phần không hỗ trợ</dd></div>
      </dl>
      {fallbackAssets.length > 0 ? <p className="export-capability-assets">Fallback asset: {fallbackAssets.join(", ")}</p> : null}
      <pre hidden data-export-capability-json="true">{JSON.stringify(report)}</pre>
    </section>
  );
}

function ExportCommandStatus({
  state,
  format,
  fallback
}: {
  state: { format: DeckExportCliFormat; status: "copied" | "error" } | null;
  format: DeckExportCliFormat;
  fallback: string;
}) {
  if (state?.format === format && state.status === "copied") {
    return <span><Check size={13} aria-hidden="true" /> Đã sao chép lệnh</span>;
  }
  if (state?.format === format && state.status === "error") {
    return <span><Copy size={13} aria-hidden="true" /> Sao chép thất bại</span>;
  }
  return <span><Copy size={13} aria-hidden="true" /> {fallback}</span>;
}
