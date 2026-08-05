"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  Eye,
  Layers3,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2
} from "lucide-react";
import {
  SUPPORTED_COMPONENT_TYPES,
  SUPPORTED_LAYOUTS,
  validateDeck,
  type DeckDocument,
  type Slide,
  type SlideComponent
} from "@deckory/schema";
import { cloneDeck, slideTitle } from "../lib/deck-catalog";
import { DeckoryBrand } from "./brand-mark";
import { ComponentInspector } from "./component-inspector";
import { DeckThumbnail } from "./deck-thumbnail";
import { SlideFrame } from "./slide-frame";

const DRAFT_KEY_PREFIX = "deckory:draft:v1:";
const variants = ["default", "spotlight", "quiet", "technical"] as const;

type SaveState = "clean" | "dirty" | "saved" | "error";

export function Studio({ sourceDeck, initialSlideId }: { sourceDeck: DeckDocument; initialSlideId?: string }) {
  const [deck, setDeck] = useState(() => cloneDeck(sourceDeck));
  const [selectedSlideId, setSelectedSlideId] = useState(() => sourceDeck.slides.some((slide) => slide.id === initialSlideId) ? initialSlideId! : sourceDeck.slides[0]!.id);
  const [selectedComponentId, setSelectedComponentId] = useState(() => sourceDeck.slides[0]!.components[0]!.id);
  const [saveState, setSaveState] = useState<SaveState>("clean");
  const [storageMessage, setStorageMessage] = useState("");
  const [newLayout, setNewLayout] = useState<Slide["layout"]>("data");
  const [componentMenuOpen, setComponentMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`${DRAFT_KEY_PREFIX}${sourceDeck.id}`);
      if (!stored) return;
      const candidate = JSON.parse(stored) as unknown;
      const result = validateDeck(candidate);
      if (result.ok) {
        setDeck(result.deck);
        const requested = result.deck.slides.find((slide) => slide.id === initialSlideId);
        const first = requested ?? result.deck.slides[0]!;
        setSelectedSlideId(first.id);
        setSelectedComponentId(first.components[0]!.id);
        setSaveState("saved");
        setStorageMessage("Đã khôi phục bản nháp trên trình duyệt này.");
      } else {
        setStorageMessage("Bản nháp cũ không còn hợp lệ nên Studio đã mở bản nguồn an toàn.");
      }
    } catch {
      setStorageMessage("Không thể đọc bản nháp cục bộ. Bản nguồn vẫn an toàn.");
    }
  }, [initialSlideId, sourceDeck.id]);

  const validation = useMemo(() => validateDeck(deck), [deck]);
  const diagnostics = validation.diagnostics;
  const selectedSlideIndex = Math.max(0, deck.slides.findIndex((slide) => slide.id === selectedSlideId));
  const selectedSlide = deck.slides[selectedSlideIndex] ?? deck.slides[0]!;
  const selectedComponent = selectedSlide.components.find((component) => component.id === selectedComponentId) ?? selectedSlide.components[0]!;
  const readinessLabel = validation.ok ? "Sẵn sàng preview" : `${diagnostics.length} lỗi cấu trúc`;

  useEffect(() => {
    if (!selectedSlide.components.some((component) => component.id === selectedComponentId)) {
      setSelectedComponentId(selectedSlide.components[0]!.id);
    }
  }, [selectedComponentId, selectedSlide]);

  const updateDeck = (updater: (current: DeckDocument) => DeckDocument) => {
    setDeck((current) => updater(current));
    setSaveState("dirty");
    setStorageMessage("");
  };

  const updateSlide = (patch: Partial<Slide>) => {
    updateDeck((current) => ({
      ...current,
      slides: current.slides.map((slide) => slide.id === selectedSlide.id ? { ...slide, ...patch } : slide)
    }));
  };

  const updateComponent = (nextComponent: SlideComponent) => {
    updateDeck((current) => ({
      ...current,
      slides: current.slides.map((slide) => slide.id === selectedSlide.id ? {
        ...slide,
        components: slide.components.map((component) => component.id === selectedComponent.id ? nextComponent : component)
      } : slide)
    }));
  };

  const saveDraft = () => {
    try {
      window.localStorage.setItem(`${DRAFT_KEY_PREFIX}${deck.id}`, JSON.stringify(deck));
      setSaveState("saved");
      setStorageMessage(validation.ok ? "Đã lưu bản nháp. Preview sẽ dùng phiên bản này." : "Đã lưu bản nháp cùng diagnostics để tiếp tục chỉnh sửa.");
    } catch {
      setSaveState("error");
      setStorageMessage("Trình duyệt không cho phép lưu cục bộ. Phiên chỉnh sửa hiện tại vẫn còn trong bộ nhớ.");
    }
  };

  const resetDraft = () => {
    try {
      window.localStorage.removeItem(`${DRAFT_KEY_PREFIX}${sourceDeck.id}`);
    } catch {
      // The in-memory reset remains safe even when storage is unavailable.
    }
    const fresh = cloneDeck(sourceDeck);
    setDeck(fresh);
    setSelectedSlideId(fresh.slides[0]!.id);
    setSelectedComponentId(fresh.slides[0]!.components[0]!.id);
    setSaveState("clean");
    setStorageMessage("Đã khôi phục bản nguồn.");
  };

  const selectSlide = (slide: Slide) => {
    setSelectedSlideId(slide.id);
    setSelectedComponentId(slide.components[0]!.id);
  };

  const addSlide = () => {
    const id = nextStableId(newLayout, deck.slides.map((slide) => slide.id));
    const slide = createSlideTemplate(newLayout, id, deck.slides.length + 1);
    updateDeck((current) => ({ ...current, slides: [...current.slides, slide] }));
    setSelectedSlideId(slide.id);
    setSelectedComponentId(slide.components[0]!.id);
  };

  const duplicateSlide = () => {
    const id = nextStableId(`${selectedSlide.id}-copy`, deck.slides.map((slide) => slide.id));
    const duplicate = cloneDeck({ ...deck, slides: [{ ...selectedSlide, id }] }).slides[0]!;
    updateDeck((current) => {
      const slides = [...current.slides];
      slides.splice(selectedSlideIndex + 1, 0, duplicate);
      return { ...current, slides };
    });
    setSelectedSlideId(id);
    setSelectedComponentId(duplicate.components[0]!.id);
  };

  const deleteSlide = () => {
    if (deck.slides.length <= 1) return;
    const fallback = deck.slides[selectedSlideIndex - 1] ?? deck.slides[selectedSlideIndex + 1] ?? deck.slides[0]!;
    updateDeck((current) => ({ ...current, slides: current.slides.filter((slide) => slide.id !== selectedSlide.id) }));
    setSelectedSlideId(fallback.id);
    setSelectedComponentId(fallback.components[0]!.id);
  };

  const moveSlide = (direction: -1 | 1) => {
    const targetIndex = selectedSlideIndex + direction;
    if (targetIndex < 0 || targetIndex >= deck.slides.length) return;
    updateDeck((current) => ({ ...current, slides: moveItem(current.slides, selectedSlideIndex, targetIndex) }));
  };

  const addComponent = (type: SlideComponent["type"]) => {
    const existing = selectedSlide.components.map((component) => component.id);
    const component = createComponent(type, nextStableId(type, existing));
    updateSlide({ components: [...selectedSlide.components, component] });
    setSelectedComponentId(component.id);
    setComponentMenuOpen(false);
  };

  const deleteComponent = () => {
    if (selectedSlide.components.length <= 1) return;
    const index = selectedSlide.components.findIndex((component) => component.id === selectedComponent.id);
    const fallback = selectedSlide.components[index - 1] ?? selectedSlide.components[index + 1] ?? selectedSlide.components[0]!;
    updateSlide({ components: selectedSlide.components.filter((component) => component.id !== selectedComponent.id) });
    setSelectedComponentId(fallback.id);
  };

  const moveComponent = (direction: -1 | 1) => {
    const index = selectedSlide.components.findIndex((component) => component.id === selectedComponent.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedSlide.components.length) return;
    updateSlide({ components: moveItem(selectedSlide.components, index, targetIndex) });
  };

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="studio-topbar-left">
          <Link className="icon-action" href="/" aria-label="Về Deckory Hub"><ArrowLeft size={18} /></Link>
          <Link className="brand-lockup-link" href="/" aria-label="Deckory Hub"><DeckoryBrand /></Link>
          <div className="studio-document-title"><span>STUDIO</span><input aria-label="Tên deck" value={deck.title} onChange={(event) => updateDeck((current) => ({ ...current, title: event.target.value }))} /></div>
        </div>
        <div className="studio-status" data-state={validation.ok ? "ready" : "error"}>{validation.ok ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}<span>{readinessLabel}</span></div>
        <div className="studio-actions">
          <button className="toolbar-button" onClick={resetDraft}><RotateCcw size={16} /> Khôi phục</button>
          <button className="toolbar-button" onClick={saveDraft} data-state={saveState}><Save size={16} /> {saveState === "saved" ? "Đã lưu" : "Lưu draft"}</button>
          <Link className="toolbar-button" href={`/preview?deck=${deck.id}&slide=${selectedSlide.id}`}><Eye size={16} /> Preview</Link>
          <Link className="toolbar-button toolbar-button--strong" href={`/present?deck=${deck.id}&slide=${selectedSlide.id}`}><Play size={16} /> Present</Link>
        </div>
      </header>

      {storageMessage && <div className="studio-notice" role="status">{storageMessage}</div>}

      <div className="studio-workspace">
        <aside className="slide-rail" aria-label="Danh sách slide">
          <header><div><span>SLIDES</span><strong>{deck.slides.length}</strong></div><button className="icon-action" onClick={duplicateSlide} aria-label="Nhân bản slide"><Copy size={16} /></button></header>
          <div className="slide-rail-list">
            {deck.slides.map((slide, index) => (
              <button key={slide.id} className={`slide-rail-item ${slide.id === selectedSlide.id ? "is-active" : ""}`} onClick={() => selectSlide(slide)} aria-current={slide.id === selectedSlide.id ? "true" : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <DeckThumbnail slide={slide} />
                <strong>{slideTitle(slide)}</strong>
              </button>
            ))}
          </div>
          <div className="slide-add-control">
            <select aria-label="Layout cho slide mới" value={newLayout} onChange={(event) => setNewLayout(event.target.value as Slide["layout"])}>{SUPPORTED_LAYOUTS.map((layout) => <option key={layout} value={layout}>{layout}</option>)}</select>
            <button onClick={addSlide}><Plus size={16} /> Thêm slide</button>
          </div>
        </aside>

        <section className="studio-canvas-zone" aria-label="Canvas chỉnh sửa">
          <div className="canvas-toolbar">
            <div><span>Slide {selectedSlideIndex + 1}</span><strong>{selectedSlide.layout} / {selectedSlide.variant ?? "default"}</strong></div>
            <div>
              <button className="icon-action" onClick={() => moveSlide(-1)} disabled={selectedSlideIndex === 0} aria-label="Đưa slide lên"><ArrowUp size={16} /></button>
              <button className="icon-action" onClick={() => moveSlide(1)} disabled={selectedSlideIndex === deck.slides.length - 1} aria-label="Đưa slide xuống"><ArrowDown size={16} /></button>
              <button className="icon-action icon-action--danger" onClick={deleteSlide} disabled={deck.slides.length <= 1} aria-label="Xoá slide"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="studio-stage">
            <div className="studio-slide-canvas"><SlideFrame slide={selectedSlide} sequenceStep={Number.MAX_SAFE_INTEGER} reducedMotion /></div>
          </div>
          <div className="canvas-footnote"><span>16:9 safe canvas</span><span>{selectedSlide.components.length} component · {selectedSlide.notes ? "có speaker notes" : "chưa có notes"}</span></div>
        </section>

        <aside className="inspector" aria-label="Inspector">
          <header className="inspector-header"><div><Settings2 size={17} /><span>INSPECTOR</span></div><strong>{selectedComponent.type}</strong></header>
          <div className="inspector-scroll">
            <section className="inspector-section">
              <header><h3>Cài đặt slide</h3><p>Layout và variant điều khiển visual grammar, không phải tọa độ tự do.</p></header>
              <div className="inspector-field-grid inspector-field-grid--two">
                <label className="inspector-field"><span>Layout</span><select value={selectedSlide.layout} onChange={(event) => updateSlide({ layout: event.target.value as Slide["layout"] })}>{SUPPORTED_LAYOUTS.map((layout) => <option key={layout}>{layout}</option>)}</select></label>
                <label className="inspector-field"><span>Variant</span><select value={selectedSlide.variant ?? "default"} onChange={(event) => updateSlide({ variant: event.target.value as Slide["variant"] })}>{variants.map((variant) => <option key={variant}>{variant}</option>)}</select></label>
              </div>
              <label className="inspector-field"><span>Speaker notes</span><textarea rows={4} value={selectedSlide.notes ?? ""} onChange={(event) => updateSlide({ notes: event.target.value.trim() ? event.target.value : undefined })} placeholder="Điểm cần nói, ngữ cảnh hoặc chuyển ý…" /></label>
            </section>

            <section className="component-stack">
              <header><div><Layers3 size={16} /><span>COMPONENTS</span></div><button onClick={() => setComponentMenuOpen((open) => !open)}><Plus size={15} /> Thêm <ChevronDown size={14} /></button></header>
              {componentMenuOpen && <div className="component-palette">{SUPPORTED_COMPONENT_TYPES.map((type) => <button key={type} disabled={!isCompatible(selectedSlide.layout, type)} onClick={() => addComponent(type)}>{type}</button>)}</div>}
              <div className="component-stack-list">
                {selectedSlide.components.map((component, index) => (
                  <button key={component.id} className={component.id === selectedComponent.id ? "is-active" : ""} onClick={() => setSelectedComponentId(component.id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{component.type}</strong><small>{component.id}</small></button>
                ))}
              </div>
              <footer>
                <button onClick={() => moveComponent(-1)} aria-label="Đưa component lên"><ArrowUp size={15} /></button>
                <button onClick={() => moveComponent(1)} aria-label="Đưa component xuống"><ArrowDown size={15} /></button>
                <button onClick={deleteComponent} disabled={selectedSlide.components.length <= 1} aria-label="Xoá component"><Trash2 size={15} /></button>
              </footer>
            </section>

            <ComponentInspector component={selectedComponent} onChange={updateComponent} />

            <section className={`diagnostics ${validation.ok ? "diagnostics--ready" : "diagnostics--error"}`}>
              <header>{validation.ok ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}<div><h3>{validation.ok ? "Document hợp lệ" : "Cần xử lý trước khi preview"}</h3><p>{validation.ok ? "Schema, layout và component contract đều hợp lệ." : `${diagnostics.length} diagnostics đang ảnh hưởng document.`}</p></div></header>
              {!validation.ok && <ul>{diagnostics.slice(0, 6).map((diagnostic, index) => <li key={`${diagnostic.propertyPath}-${index}`}><strong>{diagnostic.message}</strong><span>{diagnostic.propertyPath}</span><small>{diagnostic.remediation}</small></li>)}</ul>}
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}

function nextStableId(prefix: string, existing: string[]): string {
  const base = prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  if (!existing.includes(base)) return base;
  let index = 2;
  while (existing.includes(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

const compatibleComponents: Record<Slide["layout"], SlideComponent["type"][]> = {
  cover: ["heading", "evidence-footer"],
  statement: ["statement", "heading", "evidence-footer"],
  split: ["heading", "metric-grid", "insight", "evidence-footer"],
  dashboard: ["heading", "metric-grid", "chart", "insight", "evidence-footer"],
  comparison: ["heading", "comparison", "evidence-footer"],
  process: ["heading", "process", "evidence-footer"],
  architecture: ["heading", "architecture", "insight", "evidence-footer"],
  data: ["heading", "chart", "metric-grid", "insight", "evidence-footer"],
  closing: ["heading", "statement", "evidence-footer"]
};

function isCompatible(layout: Slide["layout"], type: SlideComponent["type"]): boolean {
  return compatibleComponents[layout].includes(type);
}

function createSlideTemplate(layout: Slide["layout"], id: string, page: number): Slide {
  const heading: SlideComponent = { id: "heading", type: "heading", props: { eyebrow: "SLIDE MỚI", title: "Đặt kết luận chính của slide ở đây.", description: "Thay nội dung minh hoạ bằng thông tin thật trước khi trình chiếu." } };
  const footer: SlideComponent = { id: "footer", type: "evidence-footer", props: { page: String(page).padStart(2, "0"), source: "Nội dung minh hoạ — cần thay bằng nguồn thật" } };
  const middle: Partial<Record<Slide["layout"], SlideComponent>> = {
    statement: { id: "statement", type: "statement", props: { quote: "Một luận điểm rõ ràng đáng nhớ hơn một trang đầy chữ.", byline: "Deckory placeholder" } },
    split: { id: "metrics", type: "metric-grid", props: { metrics: [
      { value: "64%", label: "tín hiệu chính", note: "fixture minh hoạ", tone: "cobalt" },
      { value: "24%", label: "tín hiệu phụ", note: "fixture minh hoạ", tone: "teal" },
      { value: "12%", label: "phần còn lại", note: "fixture minh hoạ", tone: "amber" }
    ] } },
    dashboard: { id: "metrics", type: "metric-grid", props: { metrics: [
      { value: "92", label: "chỉ số A", note: "fixture minh hoạ", tone: "cobalt" },
      { value: "84", label: "chỉ số B", note: "fixture minh hoạ", tone: "teal" },
      { value: "71", label: "chỉ số C", note: "fixture minh hoạ", tone: "amber" }
    ] } },
    comparison: { id: "comparison", type: "comparison", props: { left: { eyebrow: "HIỆN TẠI", title: "Cách cũ", points: ["Nhiều thao tác", "Khó kiểm tra", "Thiếu nhất quán"] }, right: { eyebrow: "ĐỀ XUẤT", title: "Cách mới", points: ["Rõ luồng", "Có validation", "Dễ tái sử dụng"] } } },
    process: { id: "process", type: "process", props: { steps: [
      { title: "Nhận dữ liệu", note: "Xác định nguồn và phạm vi.", icon: "data" },
      { title: "Tạo cấu trúc", note: "Chọn mạch kể phù hợp.", icon: "system" },
      { title: "Kiểm tra", note: "Review nội dung và visual.", icon: "sparkle" },
      { title: "Trình bày", note: "Đưa insight đến khán giả.", icon: "people" }
    ] } },
    architecture: { id: "architecture", type: "architecture", props: { layers: [
      { label: "INPUT", items: ["Nguồn dữ liệu", "Ngữ cảnh"] },
      { label: "SOURCE OF TRUTH", items: ["DeckDocument"], accent: true },
      { label: "OUTPUT", items: ["Studio", "Preview", "Present"] }
    ] } },
    data: { id: "chart", type: "chart", props: { title: "Dữ liệu minh hoạ", unit: "điểm", variant: "bar", values: [
      { label: "Nhóm A", value: 82, highlight: true },
      { label: "Nhóm B", value: 67 },
      { label: "Nhóm C", value: 74 }
    ] } }
  };

  if (layout === "cover" || layout === "closing") return { id, layout, components: [heading, footer] };
  if (layout === "statement") return { id, layout, components: [middle.statement!, footer] };
  return { id, layout, components: [heading, middle[layout]!, footer] };
}

function createComponent(type: SlideComponent["type"], id: string): SlideComponent {
  switch (type) {
    case "heading": return { id, type, props: { title: "Tiêu đề mới", description: "Mô tả ngắn cho slide." } };
    case "statement": return { id, type, props: { quote: "Luận điểm mới", byline: "Nguồn" } };
    case "metric-grid": return { id, type, props: { metrics: [
      { value: "82", label: "Metric A", note: "Fixture", tone: "cobalt" },
      { value: "74", label: "Metric B", note: "Fixture", tone: "teal" },
      { value: "61", label: "Metric C", note: "Fixture", tone: "amber" }
    ] } };
    case "comparison": return { id, type, props: { left: { eyebrow: "TRƯỚC", title: "Hiện tại", points: ["Điểm 1", "Điểm 2"] }, right: { eyebrow: "SAU", title: "Đề xuất", points: ["Điểm 1", "Điểm 2"] } } };
    case "process": return { id, type, props: { steps: [
      { title: "Bước một", note: "Mô tả", icon: "data" },
      { title: "Bước hai", note: "Mô tả", icon: "system" },
      { title: "Bước ba", note: "Mô tả", icon: "sparkle" }
    ] } };
    case "architecture": return { id, type, props: { layers: [
      { label: "INPUT", items: ["Nguồn"] },
      { label: "CORE", items: ["Source of truth"], accent: true },
      { label: "OUTPUT", items: ["Kết quả"] }
    ] } };
    case "chart": return { id, type, props: { title: "Chart mới", unit: "điểm", variant: "bar", values: [
      { label: "A", value: 72, highlight: true },
      { label: "B", value: 58 },
      { label: "C", value: 64 }
    ] } };
    case "table": return { id, type, props: { title: "Bảng mới", columns: ["Tiêu chí", "Kết quả"], rows: [
      { cells: ["Mục A", "Đạt"], highlight: true },
      { cells: ["Mục B", "Đang cải thiện"] }
    ], note: "Thay dữ liệu minh hoạ bằng nguồn đã kiểm chứng." } };
    case "code": return { id, type, props: { title: "Đoạn mã mới", language: "typescript", code: "const insight = createStory(data);", caption: "Giải thích ngắn ý nghĩa của đoạn mã.", showLineNumbers: true } };
    case "insight": return { id, type, props: { label: "KẾT LUẬN", title: "Insight chính", description: "Diễn giải vì sao insight này quan trọng.", metric: "+12", tone: "cobalt" } };
    case "evidence-footer": return { id, type, props: { source: "Nguồn cần bổ sung" } };
  }
}
