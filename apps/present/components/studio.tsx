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
  FileDown,
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
import { StudioConfirmDialog } from "./studio-confirm-dialog";
import { CommandGrid, IconChoiceGroup, StudioPopover } from "./studio-controls";
import { DeckThumbnail, ScaledSlidePreview } from "./deck-thumbnail";

const DRAFT_KEY_PREFIX = "deckory:draft:v1:";
const INSPECTOR_TABS = [
  ["content", "Nội dung"],
  ["slide", "Slide"],
  ["motion", "Chuyển động"],
  ["quality", "Kiểm tra"]
] as const;
type SaveState = "clean" | "dirty" | "saving" | "saved" | "error";
type InspectorTab = (typeof INSPECTOR_TABS)[number][0];
type DestructiveAction = "reset-draft" | "delete-slide" | "delete-component";

export function Studio({ sourceDeck, initialSlideId }: { sourceDeck: DeckDocument; initialSlideId?: string }) {
  const [deck, setDeck] = useState(() => cloneDeck(sourceDeck));
  const [selectedSlideId, setSelectedSlideId] = useState(() => sourceDeck.slides.some((slide) => slide.id === initialSlideId) ? initialSlideId! : sourceDeck.slides[0]!.id);
  const [selectedComponentId, setSelectedComponentId] = useState(() => sourceDeck.slides[0]!.components[0]!.id);
  const [saveState, setSaveState] = useState<SaveState>("clean");
  const [storageMessage, setStorageMessage] = useState("");
  const [slideMenuOpen, setSlideMenuOpen] = useState(false);
  const [componentMenuOpen, setComponentMenuOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("content");
  const [compactStudio, setCompactStudio] = useState(false);
  const [pendingDestructiveAction, setPendingDestructiveAction] = useState<DestructiveAction | null>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const destructiveReturnFocusRef = useRef<HTMLElement | null>(null);

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
  const readinessLabel = validation.ok ? "Sẵn sàng xem trước" : `${diagnostics.length} lỗi cấu trúc`;
  const saveStateLabel = getSaveStateLabel(saveState);
  const layoutLabel = layoutOptions.find((option) => option.value === selectedSlide.layout)?.label ?? selectedSlide.layout;
  const variantLabel = variantOptions.find((option) => option.value === (selectedSlide.variant ?? "default"))?.label ?? "Chuẩn";

  useEffect(() => {
    if (!selectedSlide.components.some((component) => component.id === selectedComponentId)) {
      setSelectedComponentId(selectedSlide.components[0]!.id);
    }
  }, [selectedComponentId, selectedSlide]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1040px)");
    const sync = () => {
      setCompactStudio(media.matches);
      if (!media.matches) setInspectorOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = window.setTimeout(() => {
      setSaveState("saving");
      try {
        window.localStorage.setItem(`${DRAFT_KEY_PREFIX}${deck.id}`, JSON.stringify(deck));
        setSaveState("saved");
      } catch {
        setSaveState("error");
        setStorageMessage("Trình duyệt không cho phép tự động lưu. Phiên chỉnh sửa hiện tại vẫn còn trong bộ nhớ.");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [deck, saveState]);

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

  const requestDestructiveAction = (action: DestructiveAction, trigger: HTMLElement) => {
    destructiveReturnFocusRef.current = trigger;
    setPendingDestructiveAction(action);
  };

  const closeDestructiveConfirmation = () => {
    setPendingDestructiveAction(null);
    requestAnimationFrame(() => {
      const target = destructiveReturnFocusRef.current;
      if (target?.isConnected) target.focus();
      destructiveReturnFocusRef.current = null;
    });
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
    setSaveState("saving");
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

  const confirmDestructiveAction = () => {
    const action = pendingDestructiveAction;
    setPendingDestructiveAction(null);
    if (action === "reset-draft") resetDraft();
    else if (action === "delete-slide") deleteSlide();
    else if (action === "delete-component") deleteComponent();
    requestAnimationFrame(() => {
      const target = destructiveReturnFocusRef.current;
      if (target?.isConnected) target.focus();
      destructiveReturnFocusRef.current = null;
    });
  };

  const destructiveCopy = getDestructiveCopy(pendingDestructiveAction, selectedSlide, selectedComponent);

  return (
    <main className={`studio-shell ${deckThemeClassName(deck)}`}>
      <header className="studio-topbar">
        <div className="studio-topbar-left">
          <Link className="icon-action" href="/" aria-label="Về Deckory Hub"><ArrowLeft size={18} /></Link>
          <Link className="brand-lockup-link" href="/" aria-label="Deckory Hub"><DeckoryBrand /></Link>
          <div className="studio-document-title"><span>STUDIO</span><input aria-label="Tên deck" value={deck.title} onChange={(event) => updateDeck((current) => ({ ...current, title: event.target.value }))} /></div>
        </div>
        <div className="studio-status-cluster">
          <div className="studio-status" data-state={validation.ok ? "ready" : "error"}>{validation.ok ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}<span>{readinessLabel}</span></div>
          <div className="studio-save-state" data-state={saveState} aria-live="polite"><Save size={14} /><span>{saveStateLabel}</span></div>
        </div>
        <div className="studio-actions">
          <button className="toolbar-button studio-action--reset" onClick={(event) => requestDestructiveAction("reset-draft", event.currentTarget)}><RotateCcw size={16} /> Khôi phục</button>
          <button className="toolbar-button studio-action--save" onClick={saveDraft} data-state={saveState} aria-label="Lưu ngay"><Save size={16} /><span>Lưu ngay</span></button>
          <Link className="toolbar-button studio-action--preview" href={`/preview?deck=${deck.id}&slide=${selectedSlide.id}`} aria-label="Xem trước"><Eye size={16} /><span>Xem trước</span></Link>
          <Link className="toolbar-button studio-action--export" href={`/export?deck=${deck.id}`} aria-label="Xuất deck"><FileDown size={16} /><span>Xuất</span></Link>
          <Link className="toolbar-button toolbar-button--strong studio-action--present" href={`/present?deck=${deck.id}&slide=${selectedSlide.id}`} aria-label="Trình chiếu"><Play size={16} /><span>Trình chiếu</span></Link>
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
            <div><span>Slide {selectedSlideIndex + 1}</span><strong>{layoutLabel} · {variantLabel}</strong></div>
            <div>
              <button ref={inspectorTriggerRef} className="icon-action studio-inspector-toggle" hidden={!compactStudio} onClick={() => setInspectorOpen(true)} aria-label="Mở Inspector" aria-controls="studio-inspector" aria-expanded={inspectorOpen}><SlidersHorizontal size={16} /></button>
              <button className="icon-action" onClick={() => moveSlide(-1)} disabled={selectedSlideIndex === 0} aria-label="Đưa slide lên"><ArrowUp size={16} /></button>
              <button className="icon-action" onClick={() => moveSlide(1)} disabled={selectedSlideIndex === deck.slides.length - 1} aria-label="Đưa slide xuống"><ArrowDown size={16} /></button>
              <button className="icon-action icon-action--danger" onClick={(event) => requestDestructiveAction("delete-slide", event.currentTarget)} disabled={deck.slides.length <= 1} aria-label="Xoá slide"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="studio-stage">
            <ScaledSlidePreview slide={selectedSlide} deckId={deck.id} sequenceStep={Number.MAX_SAFE_INTEGER} className="studio-slide-canvas" label={`Canvas slide ${selectedSlideIndex + 1}`} />
          </div>
          <div className="canvas-footnote"><span>Canvas an toàn 16:9</span><span>{selectedSlide.components.length} thành phần · {selectedSlide.notes ? "đã có ghi chú" : "chưa có ghi chú"}</span></div>
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
            <div><Settings2 size={17} /><span>THUỘC TÍNH</span></div>
            <div className="inspector-header-actions">
              <strong>{componentLabel(selectedComponent.type)}</strong>
              <button className="icon-action inspector-close" type="button" onClick={closeInspector} aria-label="Đóng Inspector"><X size={17} /></button>
            </div>
          </header>
          <div className="inspector-tabs" role="tablist" aria-label="Khu vực Inspector">
            {INSPECTOR_TABS.map(([tab, label], index) => (
              <button
                key={tab}
                id={`inspector-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={inspectorTab === tab}
                aria-controls={`inspector-panel-${tab}`}
                tabIndex={inspectorTab === tab ? 0 : -1}
                className={inspectorTab === tab ? "is-active" : ""}
                onClick={() => setInspectorTab(tab)}
                onKeyDown={(event) => {
                  let targetIndex: number | undefined;
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") targetIndex = (index + 1) % INSPECTOR_TABS.length;
                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") targetIndex = (index - 1 + INSPECTOR_TABS.length) % INSPECTOR_TABS.length;
                  if (event.key === "Home") targetIndex = 0;
                  if (event.key === "End") targetIndex = INSPECTOR_TABS.length - 1;
                  if (targetIndex === undefined) return;
                  event.preventDefault();
                  const nextTab = INSPECTOR_TABS[targetIndex]![0];
                  setInspectorTab(nextTab);
                  requestAnimationFrame(() => document.getElementById(`inspector-tab-${nextTab}`)?.focus());
                }}
              >
                {label}
                {tab === "quality" && diagnostics.length > 0 && <span>{diagnostics.length}</span>}
              </button>
            ))}
          </div>
          <div className="inspector-scroll">
            {inspectorTab === "content" && (
              <div id="inspector-panel-content" role="tabpanel" aria-labelledby="inspector-tab-content">
                <section className="component-stack">
                  <header>
                    <div><Layers3 size={16} /><span>Thành phần</span></div>
                    <StudioPopover
                      open={componentMenuOpen}
                      onOpenChange={setComponentMenuOpen}
                      label="Thêm thành phần"
                      description={`Các thành phần phù hợp với bố cục ${layoutLabel}.`}
                      triggerIcon={Plus}
                      triggerLabel="Thêm"
                      triggerClassName="component-add-trigger"
                      align="end"
                    >
                      <CommandGrid label="Chọn thành phần" options={compatibleComponentOptions} onSelect={addComponent} />
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
                    <button onClick={() => moveComponent(-1)} aria-label="Đưa thành phần lên"><ArrowUp size={15} /></button>
                    <button onClick={() => moveComponent(1)} aria-label="Đưa thành phần xuống"><ArrowDown size={15} /></button>
                    <button onClick={(event) => requestDestructiveAction("delete-component", event.currentTarget)} disabled={selectedSlide.components.length <= 1} aria-label="Xoá thành phần"><Trash2 size={15} /></button>
                  </footer>
                </section>
                <ComponentInspector component={selectedComponent} onChange={updateComponent} />
              </div>
            )}

            {inspectorTab === "slide" && (
              <div id="inspector-panel-slide" role="tabpanel" aria-labelledby="inspector-tab-slide">
                <section className="inspector-section slide-settings-section">
                  <header><h3>Thiết lập slide</h3><p>Chọn visual grammar theo thông điệp thay vì điều chỉnh tọa độ thủ công.</p></header>
                  <IconChoiceGroup label="Bố cục" value={selectedSlide.layout} options={layoutOptions} compact onChange={(layout) => updateSlide({ layout })} />
                  <IconChoiceGroup label="Phong cách" value={selectedSlide.variant ?? "default"} options={variantOptions} compact onChange={(variant) => updateSlide({ variant })} />
                  <IconChoiceGroup label="Chuyển slide" value={selectedSlide.transition?.type ?? "fade"} options={transitionOptions} compact onChange={(type) => updateSlide({ transition: { ...(selectedSlide.transition ?? {}), type } })} />
                  <label className="inspector-field"><span>Thời lượng chuyển slide</span><div className="number-field-with-unit"><input type="number" min="0.1" max="1.2" step="0.1" value={selectedSlide.transition?.duration ?? 0.42} onChange={(event) => updateSlide({ transition: { type: selectedSlide.transition?.type ?? "fade", duration: Number(event.target.value) || 0.42, easing: selectedSlide.transition?.easing } })} /><span>giây</span></div></label>
                  <label className="inspector-field"><span>Ghi chú người thuyết trình</span><textarea rows={5} value={selectedSlide.notes ?? ""} onChange={(event) => updateSlide({ notes: event.target.value.trim() ? event.target.value : undefined })} placeholder="Điểm cần nói, ngữ cảnh hoặc chuyển ý…" /></label>
                </section>
              </div>
            )}

            {inspectorTab === "motion" && (
              <div id="inspector-panel-motion" role="tabpanel" aria-labelledby="inspector-tab-motion">
                <section className="inspector-section motion-inspector">
                  <header><h3>Chuyển động của thành phần</h3><p>Hiệu ứng hỗ trợ thứ tự kể; không thay thế hierarchy hoặc nội dung.</p></header>
                  <IconChoiceGroup label="Hiệu ứng" value={selectedComponent.effect?.type ?? "rise"} options={effectOptions} compact onChange={(type) => updateComponent({ ...selectedComponent, effect: { ...(selectedComponent.effect ?? {}), type } })} />
                  <div className="inspector-field-grid inspector-field-grid--three motion-fields">
                    <label className="inspector-field"><span>Thứ tự</span><input type="number" min="1" value={selectedComponent.sequence ?? ""} placeholder="Tự động" onChange={(event) => updateComponent({ ...selectedComponent, sequence: event.target.value ? Number(event.target.value) : undefined })} /></label>
                    <label className="inspector-field"><span>Thời lượng</span><input type="number" min="0.1" max="1.2" step="0.1" value={selectedComponent.effect?.duration ?? 0.34} onChange={(event) => updateComponent({ ...selectedComponent, effect: { type: selectedComponent.effect?.type ?? "rise", duration: Number(event.target.value) || 0.34, delay: selectedComponent.effect?.delay, easing: selectedComponent.effect?.easing } })} /></label>
                    <label className="inspector-field"><span>Độ trễ</span><input type="number" min="0" max="1.5" step="0.05" value={selectedComponent.effect?.delay ?? 0} onChange={(event) => updateComponent({ ...selectedComponent, effect: { type: selectedComponent.effect?.type ?? "rise", duration: selectedComponent.effect?.duration, delay: Number(event.target.value) || 0, easing: selectedComponent.effect?.easing } })} /></label>
                  </div>
                </section>
              </div>
            )}

            {inspectorTab === "quality" && (
              <div id="inspector-panel-quality" role="tabpanel" aria-labelledby="inspector-tab-quality">
                <section className={`diagnostics ${validation.ok ? "diagnostics--ready" : "diagnostics--error"}`}>
                  <header>{validation.ok ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}<div><h3>{validation.ok ? "Document hợp lệ" : "Cần xử lý trước khi xem trước"}</h3><p>{validation.ok ? "Schema, bố cục và contract thành phần đều hợp lệ." : `${diagnostics.length} lỗi đang ảnh hưởng document.`}</p></div></header>
                  {!validation.ok && <ul>{diagnostics.slice(0, 8).map((diagnostic, index) => <li key={`${diagnostic.propertyPath}-${index}`}><strong>{diagnostic.message}</strong><span>{diagnostic.propertyPath}</span><small>{diagnostic.remediation}</small></li>)}</ul>}
                </section>
              </div>
            )}
          </div>
        </aside>
      </div>

      {destructiveCopy && (
        <StudioConfirmDialog
          title={destructiveCopy.title}
          description={destructiveCopy.description}
          confirmLabel={destructiveCopy.confirmLabel}
          onConfirm={confirmDestructiveAction}
          onCancel={closeDestructiveConfirmation}
        />
      )}
    </main>
  );
}

function getDestructiveCopy(
  action: DestructiveAction | null,
  slide: Slide,
  component: SlideComponent
): { title: string; description: string; confirmLabel: string } | null {
  if (action === "reset-draft") {
    return {
      title: "Khôi phục bản nguồn?",
      description: "Mọi thay đổi trong bản nháp cục bộ sẽ bị xoá và Studio sẽ trở về nội dung nguồn đã kiểm chứng.",
      confirmLabel: "Khôi phục bản nguồn"
    };
  }
  if (action === "delete-slide") {
    return {
      title: "Xoá slide này?",
      description: `Slide “${slideTitle(slide)}” và toàn bộ nội dung bên trong sẽ bị xoá khỏi bản nháp.`,
      confirmLabel: "Xoá slide"
    };
  }
  if (action === "delete-component") {
    return {
      title: "Xoá thành phần này?",
      description: `Thành phần “${componentLabel(component.type)}” sẽ bị xoá khỏi slide hiện tại.`,
      confirmLabel: "Xoá thành phần"
    };
  }
  return null;
}

function getSaveStateLabel(state: SaveState): string {
  switch (state) {
    case "clean": return "Chưa có thay đổi";
    case "dirty": return "Chờ tự động lưu";
    case "saving": return "Đang lưu…";
    case "saved": return "Đã lưu trên trình duyệt";
    case "error": return "Chưa thể lưu";
  }
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
    statement: { id: "statement", type: "statement", props: { quote: "Một luận điểm rõ ràng đáng nhớ hơn một trang đầy chữ.", byline: "Nguyên tắc trình bày Deckory" } },
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
