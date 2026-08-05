"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  CircleAlert,
  Copy,
  Eye,
  Layers3,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  SlidersHorizontal,
  Trash2,
  X
} from "lucide-react";
import {
  validateDeck,
  type DeckDocument,
  type Slide,
  type SlideComponent
} from "@deckory/schema";
import { cloneDeck, slideTitle } from "../lib/deck-catalog";
import { deckThemeClassName } from "../lib/deck-theme";
import { createComponent, isCompatible } from "../lib/component-catalog";
import {
  componentLabel,
  componentOptions,
  effectOptions,
  layoutOptions,
  transitionOptions,
  variantOptions
} from "../lib/studio-option-catalog";
import { DeckoryBrand } from "./brand-mark";
import { ComponentInspector } from "./component-inspector";
import { CommandGrid, IconChoiceGroup, StudioPopover } from "./studio-controls";
import { DeckThumbnail } from "./deck-thumbnail";
import { SlideFrame } from "./slide-frame";

const DRAFT_KEY_PREFIX = "deckory:draft:v1:";
type SaveState = "clean" | "dirty" | "saved" | "error";

export function Studio({ sourceDeck, initialSlideId }: { sourceDeck: DeckDocument; initialSlideId?: string }) {
  const [deck, setDeck] = useState(() => cloneDeck(sourceDeck));
  const [selectedSlideId, setSelectedSlideId] = useState(() => sourceDeck.slides.some((slide) => slide.id === initialSlideId) ? initialSlideId! : sourceDeck.slides[0]!.id);
  const [selectedComponentId, setSelectedComponentId] = useState(() => sourceDeck.slides[0]!.components[0]!.id);
  const [saveState, setSaveState] = useState<SaveState>("clean");
  const [storageMessage, setStorageMessage] = useState("");
  const [slideMenuOpen, setSlideMenuOpen] = useState(false);
  const [componentMenuOpen, setComponentMenuOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [compactStudio, setCompactStudio] = useState(false);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    const media = window.matchMedia("(max-width: 940px)");
    const sync = () => {
      setCompactStudio(media.matches);
      if (!media.matches) setInspectorOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!inspectorOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setInspectorOpen(false);
      requestAnimationFrame(() => inspectorTriggerRef.current?.focus());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inspectorOpen]);

  const compatibleComponentOptions = useMemo(
    () => componentOptions.map((option) => isCompatible(selectedSlide.layout, option.value)
      ? option
      : { ...option, disabled: true, disabledReason: `Không dùng được trong layout ${selectedSlide.layout}.` }),
    [selectedSlide.layout]
  );

  const closeInspector = () => {
    setInspectorOpen(false);
    requestAnimationFrame(() => inspectorTriggerRef.current?.focus());
  };

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

  const addSlide = (layout: Slide["layout"]) => {
    const id = nextStableId(layout, deck.slides.map((slide) => slide.id));
    const slide = createSlideTemplate(layout, id, deck.slides.length + 1);
    updateDeck((current) => ({ ...current, slides: [...current.slides, slide] }));
    setSelectedSlideId(slide.id);
    setSelectedComponentId(slide.components[0]!.id);
    setSlideMenuOpen(false);
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
    <main className={`studio-shell ${deckThemeClassName(deck)}`}>
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
            <StudioPopover
              open={slideMenuOpen}
              onOpenChange={setSlideMenuOpen}
              label="Thêm slide"
              description="Chọn bố cục theo điều bạn muốn khán giả hiểu."
              triggerIcon={Plus}
              triggerLabel="Thêm slide"
              triggerClassName="slide-add-trigger"
            >
              <CommandGrid label="Chọn layout cho slide mới" options={layoutOptions} onSelect={addSlide} />
            </StudioPopover>
          </div>
        </aside>

        <section className="studio-canvas-zone" aria-label="Canvas chỉnh sửa">
          <div className="canvas-toolbar">
            <div><span>Slide {selectedSlideIndex + 1}</span><strong>{selectedSlide.layout} / {selectedSlide.variant ?? "default"}</strong></div>
            <div>
              <button ref={inspectorTriggerRef} className="icon-action studio-inspector-toggle" hidden={!compactStudio} onClick={() => setInspectorOpen(true)} aria-label="Mở Inspector" aria-controls="studio-inspector" aria-expanded={inspectorOpen}><SlidersHorizontal size={16} /></button>
              <button className="icon-action" onClick={() => moveSlide(-1)} disabled={selectedSlideIndex === 0} aria-label="Đưa slide lên"><ArrowUp size={16} /></button>
              <button className="icon-action" onClick={() => moveSlide(1)} disabled={selectedSlideIndex === deck.slides.length - 1} aria-label="Đưa slide xuống"><ArrowDown size={16} /></button>
              <button className="icon-action icon-action--danger" onClick={deleteSlide} disabled={deck.slides.length <= 1} aria-label="Xoá slide"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="studio-stage">
            <div className="studio-slide-canvas"><SlideFrame slide={selectedSlide} deckId={deck.id} sequenceStep={Number.MAX_SAFE_INTEGER} reducedMotion motionDisabled /></div>
          </div>
          <div className="canvas-footnote"><span>16:9 safe canvas</span><span>{selectedSlide.components.length} component · {selectedSlide.notes ? "có speaker notes" : "chưa có notes"}</span></div>
        </section>

        {compactStudio && inspectorOpen && <button className="inspector-backdrop" type="button" aria-label="Đóng Inspector" onClick={closeInspector} />}
        <aside
          id="studio-inspector"
          className="inspector"
          aria-label="Inspector"
          data-open={!compactStudio || inspectorOpen ? "true" : "false"}
          aria-hidden={compactStudio && !inspectorOpen ? true : undefined}
          inert={compactStudio && !inspectorOpen ? true : undefined}
        >
          <header className="inspector-header">
            <div><Settings2 size={17} /><span>INSPECTOR</span></div>
            <div className="inspector-header-actions">
              <strong>{componentLabel(selectedComponent.type)}</strong>
              <button className="icon-action inspector-close" type="button" onClick={closeInspector} aria-label="Đóng Inspector"><X size={17} /></button>
            </div>
          </header>
          <div className="inspector-scroll">
            <section className="inspector-section slide-settings-section">
              <header><h3>Cài đặt slide</h3><p>Chọn visual grammar theo thông điệp thay vì điều chỉnh tọa độ thủ công.</p></header>
              <IconChoiceGroup label="Bố cục" value={selectedSlide.layout} options={layoutOptions} compact onChange={(layout) => updateSlide({ layout })} />
              <IconChoiceGroup label="Phong cách" value={selectedSlide.variant ?? "default"} options={variantOptions} compact onChange={(variant) => updateSlide({ variant })} />
              <IconChoiceGroup label="Chuyển slide" value={selectedSlide.transition?.type ?? "fade"} options={transitionOptions} compact onChange={(type) => updateSlide({ transition: { ...(selectedSlide.transition ?? {}), type } })} />
              <label className="inspector-field"><span>Thời lượng chuyển slide</span><div className="number-field-with-unit"><input type="number" min="0.1" max="1.2" step="0.1" value={selectedSlide.transition?.duration ?? 0.42} onChange={(event) => updateSlide({ transition: { type: selectedSlide.transition?.type ?? "fade", duration: Number(event.target.value) || 0.42, easing: selectedSlide.transition?.easing } })} /><span>giây</span></div></label>
              <label className="inspector-field"><span>Ghi chú người thuyết trình</span><textarea rows={4} value={selectedSlide.notes ?? ""} onChange={(event) => updateSlide({ notes: event.target.value.trim() ? event.target.value : undefined })} placeholder="Điểm cần nói, ngữ cảnh hoặc chuyển ý…" /></label>
            </section>

            <section className="component-stack">
              <header>
                <div><Layers3 size={16} /><span>COMPONENTS</span></div>
                <StudioPopover
                  open={componentMenuOpen}
                  onOpenChange={setComponentMenuOpen}
                  label="Thêm component"
                  description={`Các component phù hợp với layout ${selectedSlide.layout}.`}
                  triggerIcon={Plus}
                  triggerLabel="Thêm"
                  triggerClassName="component-add-trigger"
                  align="end"
                >
                  <CommandGrid label="Chọn component" options={compatibleComponentOptions} onSelect={addComponent} />
                </StudioPopover>
              </header>
              <div className="component-stack-list">
                {selectedSlide.components.map((component, index) => (
                  <button key={component.id} className={component.id === selectedComponent.id ? "is-active" : ""} onClick={() => setSelectedComponentId(component.id)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{componentLabel(component.type)}</strong>
                    <small>{component.id}</small>
                  </button>
                ))}
              </div>
              <footer>
                <button onClick={() => moveComponent(-1)} aria-label="Đưa component lên"><ArrowUp size={15} /></button>
                <button onClick={() => moveComponent(1)} aria-label="Đưa component xuống"><ArrowDown size={15} /></button>
                <button onClick={deleteComponent} disabled={selectedSlide.components.length <= 1} aria-label="Xoá component"><Trash2 size={15} /></button>
              </footer>
            </section>

            <ComponentInspector component={selectedComponent} onChange={updateComponent} />

            <section className="inspector-section motion-inspector">
              <header><h3>Motion của component</h3><p>Hiệu ứng hỗ trợ thứ tự kể; không thay thế hierarchy hoặc nội dung.</p></header>
              <IconChoiceGroup label="Hiệu ứng" value={selectedComponent.effect?.type ?? "rise"} options={effectOptions} compact onChange={(type) => updateComponent({ ...selectedComponent, effect: { ...(selectedComponent.effect ?? {}), type } })} />
              <div className="inspector-field-grid inspector-field-grid--three motion-fields">
                <label className="inspector-field"><span>Sequence</span><input type="number" min="1" value={selectedComponent.sequence ?? ""} placeholder="Tự động" onChange={(event) => updateComponent({ ...selectedComponent, sequence: event.target.value ? Number(event.target.value) : undefined })} /></label>
                <label className="inspector-field"><span>Duration</span><input type="number" min="0.1" max="1.2" step="0.1" value={selectedComponent.effect?.duration ?? 0.34} onChange={(event) => updateComponent({ ...selectedComponent, effect: { type: selectedComponent.effect?.type ?? "rise", duration: Number(event.target.value) || 0.34, delay: selectedComponent.effect?.delay, easing: selectedComponent.effect?.easing } })} /></label>
                <label className="inspector-field"><span>Delay</span><input type="number" min="0" max="1.5" step="0.05" value={selectedComponent.effect?.delay ?? 0} onChange={(event) => updateComponent({ ...selectedComponent, effect: { type: selectedComponent.effect?.type ?? "rise", duration: selectedComponent.effect?.duration, delay: Number(event.target.value) || 0, easing: selectedComponent.effect?.easing } })} /></label>
              </div>
            </section>

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
