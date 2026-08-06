"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent
} from "react";
import { SceneRenderer } from "@deckory/renderer";
import type { DeckDocumentV2, Frame, SceneElement, SceneSlide } from "@deckory/schema/v2";
import {
  absoluteFrames,
  convertGroupLayoutMode,
  createChildSizingCommand,
  createLayoutContainerPatchCommand,
  detachElementFromAutoLayout,
  moveElementInHierarchy,
  type SceneCommand
} from "@deckory/scene";
import {
  beginGestureTransaction,
  cancelGestureTransaction,
  commitGestureTransaction,
  createNudgeCommand,
  nudgeDeltaForKey,
  toLogicalDelta,
  type GestureTransaction
} from "./canvas/gesture-transaction";
import { resolveSelectionFromPointer, type StudioSelection } from "./canvas/selection-controller";
import { SelectionStatus } from "./canvas/selection-status";
import { createLayerPatchCommand, type LayerDropIntent } from "./layers/layers-model";
import { LayersPanel } from "./layers/layers-panel";
import { LayoutPanel, type LayoutPanelValue } from "./layout/layout-panel";
import {
  commitStudioCommand,
  createStudioV2State,
  redoStudioCommand,
  setStudioActiveSlide,
  undoStudioCommand,
  type StudioV2State
} from "./studio-v2-state";
import styles from "./studio-v2.module.css";

const EMPTY_SELECTION: StudioSelection = { elementIds: [] };

type DragState = {
  pointerId: number;
  start: { x: number; y: number };
  transaction: GestureTransaction;
  baseFrames: Record<string, Frame>;
};

function paddingValue(input: number | [number, number, number, number]): LayoutPanelValue["padding"] {
  if (Array.isArray(input)) {
    return { top: input[0], right: input[1], bottom: input[2], left: input[3] };
  }
  return { top: input, right: input, bottom: input, left: input };
}

function directChildren(slide: SceneSlide, parentId: string): SceneElement[] {
  return slide.elements.filter((element) => element.parentId === parentId);
}

function layoutValueFor(slide: SceneSlide, element: SceneElement): LayoutPanelValue {
  const children = directChildren(slide, element.id);
  const firstChild = children[0];
  const common = {
    gap: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    align: "stretch" as const,
    justify: "start" as const,
    childWidth: firstChild?.constraints?.width ?? "fixed",
    childHeight: firstChild?.constraints?.height ?? "fixed",
    horizontalConstraint: element.constraints?.horizontal ?? "left",
    verticalConstraint: element.constraints?.vertical ?? "top"
  };

  if (element.kind === "stack") {
    return {
      ...common,
      mode: "stack",
      direction: element.content.direction,
      wrap: element.content.wrap,
      gap: element.content.gap,
      padding: paddingValue(element.content.padding),
      align: element.content.align,
      justify: element.content.justify
    };
  }
  if (element.kind === "grid") {
    return {
      ...common,
      mode: "grid",
      columns: element.content.columns,
      gap: Math.max(element.content.columnGap, element.content.rowGap),
      padding: paddingValue(element.content.padding),
      align: element.content.align
    };
  }
  if (element.kind === "group") return { ...common, mode: "freeform" };
  return { ...common, mode: "constraint" };
}

function previewSlide(slide: SceneSlide, frames: Record<string, Frame> | undefined): SceneSlide {
  if (!frames) return slide;
  return {
    ...slide,
    elements: slide.elements.map((element) => frames[element.id]
      ? { ...element, frame: frames[element.id]! } as SceneElement
      : element)
  };
}

function selectedFrameMap(slide: SceneSlide, ids: readonly string[]): Record<string, Frame> {
  return Object.fromEntries(
    ids.map((id) => {
      const element = slide.elements.find((candidate) => candidate.id === id);
      if (!element) throw new Error(`Không tìm thấy thành phần ${id}.`);
      return [id, element.frame];
    })
  );
}

function TextContentEditor({
  element,
  onCommit
}: {
  element: Extract<SceneElement, { kind: "text" }>;
  onCommit: (text: string) => void;
}) {
  const [draft, setDraft] = useState(element.content.text);
  useEffect(() => setDraft(element.content.text), [element.id, element.content.text]);
  return (
    <label className={styles.textEditor}>
      <span>Nội dung</span>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={() => {
          const value = draft.trim();
          if (value && value !== element.content.text) onCommit(value);
          else setDraft(element.content.text);
        }}
      />
    </label>
  );
}

export function StudioV2({
  sourceDeck,
  initialSlideId
}: {
  sourceDeck: DeckDocumentV2;
  initialSlideId?: string;
}) {
  const [state, setState] = useState<StudioV2State>(() => createStudioV2State(sourceDeck, initialSlideId));
  const [selection, setSelection] = useState<StudioSelection>(EMPTY_SELECTION);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFrames, setPreviewFrames] = useState<Record<string, Frame> | undefined>();
  const [scale, setScale] = useState(0.7);
  const [diagnostic, setDiagnostic] = useState<{ code: string; message: string; recommendation?: string } | undefined>();
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | undefined>(undefined);

  const activeSlide = state.deck.slides.find((slide) => slide.id === state.activeSlideId) ?? state.deck.slides[0]!;
  const renderedSlide = useMemo(() => previewSlide(activeSlide, previewFrames), [activeSlide, previewFrames]);
  const primaryElement = activeSlide.elements.find((element) => element.id === selection.primaryElementId);
  const absolute = useMemo(() => absoluteFrames(renderedSlide), [renderedSlide]);

  const commit = (command: SceneCommand) => {
    try {
      setState((current) => commitStudioCommand(current, command));
      setDiagnostic(undefined);
    } catch (error) {
      setDiagnostic({
        code: "studio-command-rejected",
        message: error instanceof Error ? error.message : "Không thể áp dụng thay đổi.",
        recommendation: "Kiểm tra hierarchy, kích thước và giới hạn của thành phần rồi thử lại."
      });
    }
  };

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    const update = () => {
      const width = Math.max(320, host.clientWidth - 56);
      const height = Math.max(240, host.clientHeight - 56);
      setScale(Math.max(0.2, Math.min(1, width / 1280, height / 720)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(`deckory:v2:draft:${state.deck.id}`, JSON.stringify(state.deck));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state.deck]);

  const selectElement = (elementId: string, additive: boolean) => {
    setSelection((current) => resolveSelectionFromPointer({
      current: current.elementIds,
      targetId: elementId,
      additive,
      documentOrder: activeSlide.elements.map((element) => element.id)
    }));
  };

  const switchSlide = (slideId: string) => {
    setState((current) => setStudioActiveSlide(current, slideId));
    setSelection(EMPTY_SELECTION);
    setPreviewFrames(undefined);
    setDiagnostic(undefined);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-element-id]");
    if (!target) {
      if (!event.shiftKey && !event.metaKey && !event.ctrlKey) setSelection(EMPTY_SELECTION);
      return;
    }
    const elementId = target.dataset.elementId;
    if (!elementId) return;
    const element = activeSlide.elements.find((candidate) => candidate.id === elementId);
    if (!element) return;
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    const nextSelection = resolveSelectionFromPointer({
      current: selection.elementIds,
      targetId: elementId,
      additive,
      documentOrder: activeSlide.elements.map((candidate) => candidate.id)
    });
    setSelection(nextSelection);
    if (element.locked || nextSelection.elementIds.length === 0) return;

    const movableIds = nextSelection.elementIds.filter((id) => {
      const candidate = activeSlide.elements.find((item) => item.id === id);
      return candidate && !candidate.locked && !candidate.hidden;
    });
    if (movableIds.length === 0) return;
    const frames = selectedFrameMap(activeSlide, movableIds);
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      transaction: beginGestureTransaction(activeSlide.id, frames),
      baseFrames: frames
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = toLogicalDelta({ x: event.clientX - drag.start.x, y: event.clientY - drag.start.y }, scale);
    setPreviewFrames(Object.fromEntries(Object.entries(drag.baseFrames).map(([id, frame]) => [id, {
      ...frame,
      x: frame.x + delta.x,
      y: frame.y + delta.y
    }])));
  };

  const finishPointerGesture = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const result = cancelled
      ? cancelGestureTransaction(drag.transaction)
      : commitGestureTransaction(drag.transaction, previewFrames ?? drag.baseFrames);
    dragRef.current = undefined;
    setPreviewFrames(undefined);
    if (result.commands[0]) commit(result.commands[0] as SceneCommand);
  };

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "z") {
      event.preventDefault();
      setState((current) => event.shiftKey ? redoStudioCommand(current) : undoStudioCommand(current));
      return;
    }
    if (event.key === "Escape") {
      dragRef.current = undefined;
      setPreviewFrames(undefined);
      setSelection(EMPTY_SELECTION);
      return;
    }
    const delta = nudgeDeltaForKey(event.key, event.shiftKey);
    if (!delta || selection.elementIds.length === 0) return;
    event.preventDefault();
    commit(createNudgeCommand(activeSlide.id, selectedFrameMap(activeSlide, selection.elementIds), delta) as SceneCommand);
  };

  const handleLayerMove = (intent: LayerDropIntent) => {
    const transaction = moveElementInHierarchy(activeSlide, intent.elementId, intent.parentId, intent.index);
    commit(transaction.command as SceneCommand);
  };

  const handleLayoutChange = (patch: Partial<LayoutPanelValue>) => {
    if (!primaryElement) return;
    const currentValue = layoutValueFor(activeSlide, primaryElement);
    const nextValue = { ...currentValue, ...patch, padding: patch.padding ?? currentValue.padding };

    try {
      if (patch.mode && patch.mode !== currentValue.mode) {
        if (primaryElement.kind === "group" || primaryElement.kind === "stack" || primaryElement.kind === "grid") {
          if (patch.mode === "constraint") throw new Error("Hãy chọn một thành phần con để chỉnh constraints.");
          const children = directChildren(activeSlide, primaryElement.id);
          const conversion = convertGroupLayoutMode({ parent: primaryElement, children }, {
            mode: patch.mode === "freeform"
              ? "freeform"
              : patch.mode === "grid"
                ? "grid"
                : nextValue.direction === "vertical" ? "stack-vertical" : "stack-horizontal",
            slideId: activeSlide.id,
            gap: nextValue.gap,
            padding: nextValue.padding,
            align: nextValue.align,
            justify: nextValue.justify,
            ...(nextValue.wrap === undefined ? {} : { wrap: nextValue.wrap }),
            ...(nextValue.columns === undefined ? {} : { columns: nextValue.columns })
          });
          if (!conversion.ok) {
            setDiagnostic(conversion.diagnostics[0]);
            return;
          }
          commit(conversion.command as SceneCommand);
          return;
        }
        if (patch.mode !== "constraint") throw new Error("Chỉ group, stack hoặc grid mới có thể đổi chế độ cấu trúc.");
      }

      if (patch.horizontalConstraint || patch.verticalConstraint) {
        commit({
          type: "patch-element",
          slideId: activeSlide.id,
          elementId: primaryElement.id,
          patch: {
            constraints: {
              ...primaryElement.constraints,
              horizontal: nextValue.horizontalConstraint,
              vertical: nextValue.verticalConstraint
            }
          }
        });
        return;
      }

      if (patch.childWidth || patch.childHeight) {
        const children = directChildren(activeSlide, primaryElement.id);
        const updates = new Map(children.map((child) => {
          const command = createChildSizingCommand(activeSlide.id, child, {
            width: nextValue.childWidth,
            height: nextValue.childHeight
          });
          return [child.id, command.patch.constraints];
        }));
        commit({
          type: "replace-scene-elements",
          slideId: activeSlide.id,
          elements: activeSlide.elements.map((element) => updates.has(element.id)
            ? { ...element, constraints: updates.get(element.id) } as SceneElement
            : element)
        });
        return;
      }

      if (primaryElement.kind === "stack") {
        commit(createLayoutContainerPatchCommand(activeSlide.id, primaryElement, {
          direction: nextValue.direction ?? primaryElement.content.direction,
          gap: nextValue.gap,
          padding: [nextValue.padding.top, nextValue.padding.right, nextValue.padding.bottom, nextValue.padding.left],
          align: nextValue.align,
          justify: nextValue.justify,
          wrap: Boolean(nextValue.wrap)
        }) as SceneCommand);
        return;
      }
      if (primaryElement.kind === "grid") {
        commit(createLayoutContainerPatchCommand(activeSlide.id, primaryElement, {
          columns: nextValue.columns ?? primaryElement.content.columns,
          columnGap: nextValue.gap,
          rowGap: nextValue.gap,
          padding: [nextValue.padding.top, nextValue.padding.right, nextValue.padding.bottom, nextValue.padding.left],
          align: nextValue.align
        }) as SceneCommand);
      }
    } catch (error) {
      setDiagnostic({
        code: "layout-change-rejected",
        message: error instanceof Error ? error.message : "Không thể thay đổi layout.",
        recommendation: "Chọn đúng container hoặc thành phần con trước khi đổi chế độ."
      });
    }
  };

  const handleDetach = () => {
    if (!primaryElement) return;
    try {
      if (primaryElement.parentId) {
        commit(detachElementFromAutoLayout(activeSlide, primaryElement.id).command as SceneCommand);
        return;
      }
      if (primaryElement.kind === "stack" || primaryElement.kind === "grid") {
        const conversion = convertGroupLayoutMode({ parent: primaryElement, children: directChildren(activeSlide, primaryElement.id) }, {
          mode: "freeform",
          slideId: activeSlide.id
        });
        if (!conversion.ok) {
          setDiagnostic(conversion.diagnostics[0]);
          return;
        }
        commit(conversion.command as SceneCommand);
      }
    } catch (error) {
      setDiagnostic({ code: "detach-rejected", message: error instanceof Error ? error.message : "Không thể detach." });
    }
  };

  return (
    <main className={styles.shell} data-scene-v2-surface="studio" data-scene-v2-editing="true">
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div>
            <span>Deckory V2 Studio</span>
            <strong>{state.deck.title}</strong>
          </div>
        </div>
        <div className={styles.actions} role="group" aria-label="Lịch sử chỉnh sửa">
          <button type="button" disabled={state.history.past.length === 0} onClick={() => setState((current) => undoStudioCommand(current))}>Undo</button>
          <button type="button" disabled={state.history.future.length === 0} onClick={() => setState((current) => redoStudioCommand(current))}>Redo</button>
          <span className={styles.panelLabel}>Revision {state.deck.revision}</span>
        </div>
        <nav className={styles.navigation} aria-label="Điều hướng Deckory V2">
          <Link href="/">Hub</Link>
          <Link href={`/preview?deck=${state.deck.id}`}>Preview</Link>
          <Link href={`/present?deck=${state.deck.id}`}>Present</Link>
          <Link href={`/export?deck=${state.deck.id}`}>Export</Link>
        </nav>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.leftPanel} aria-label="Slide và Layers">
          <section className={styles.slideRail}>
            <header><span className={styles.panelLabel}>Slides</span><span>{state.deck.slides.length}</span></header>
            <ol>
              {state.deck.slides.map((slide, index) => (
                <li key={slide.id}>
                  <button type="button" className={styles.slideButton} data-active={slide.id === activeSlide.id ? "true" : "false"} onClick={() => switchSlide(slide.id)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{slide.name}</strong>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <LayersPanel
            elements={activeSlide.elements}
            selectedIds={selection.elementIds}
            {...(selection.primaryElementId ? { primaryId: selection.primaryElementId } : {})}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelect={selectElement}
            onPatch={(elementId, patch) => commit(createLayerPatchCommand(activeSlide.id, elementId, patch) as SceneCommand)}
            onMove={handleLayerMove}
          />
        </aside>

        <section className={styles.canvasArea} aria-label="Canvas Studio V2">
          <div className={styles.canvasToolbar}>
            <p>Click để chọn · kéo để di chuyển · Arrow nudge 1 px · Shift+Arrow 10 px</p>
            <div className={styles.zoomControls}><span>{Math.round(scale * 100)}%</span></div>
          </div>
          <div
            ref={canvasHostRef}
            className={styles.canvasHost}
            data-studio-v2-canvas-host="true"
            tabIndex={0}
            onKeyDown={handleCanvasKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => finishPointerGesture(event, false)}
            onPointerCancel={(event) => finishPointerGesture(event, true)}
          >
            <div className={styles.canvasScroller}>
              <div className={styles.canvasBounds} style={{ width: 1280 * scale, height: 720 * scale }}>
                <div className={styles.canvasStage} data-studio-v2-canvas-stage="true" style={{ transform: `scale(${scale})` }}>
                  <SceneRenderer slide={renderedSlide} assets={state.deck.assets} mode="studio" />
                  {selection.elementIds.map((id) => {
                    const frame = absolute[id];
                    const element = renderedSlide.elements.find((candidate) => candidate.id === id);
                    if (!frame || !element || element.hidden) return null;
                    return (
                      <div
                        key={id}
                        className={styles.selectionBox}
                        data-selection-label={element.name}
                        style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <SelectionStatus selectedIds={selection.elementIds} {...(primaryElement?.name ? { primaryName: primaryElement.name } : {})} />
          </div>
        </section>

        <aside className={styles.rightPanel} aria-label="Inspector">
          {diagnostic ? <div className={styles.error} role="alert">{diagnostic.message}</div> : null}
          {primaryElement ? (
            <>
              <section className={styles.inspectorSection}>
                <span className={styles.panelLabel}>{primaryElement.kind}</span>
                <h2>{primaryElement.name}</h2>
                <p>{primaryElement.id} · {Math.round(primaryElement.frame.width)} × {Math.round(primaryElement.frame.height)}</p>
                {primaryElement.kind === "text" ? (
                  <TextContentEditor
                    key={primaryElement.id}
                    element={primaryElement}
                    onCommit={(text) => commit({
                      type: "patch-element",
                      slideId: activeSlide.id,
                      elementId: primaryElement.id,
                      patch: { content: { text } }
                    })}
                  />
                ) : null}
              </section>
              <LayoutPanel
                value={layoutValueFor(activeSlide, primaryElement)}
                {...(diagnostic ? { diagnostic } : {})}
                onChange={handleLayoutChange}
                onDetach={handleDetach}
              />
            </>
          ) : (
            <div className={styles.emptyInspector}>
              <strong>Chọn một thành phần</strong>
              <p>Inspector sẽ hiển thị nội dung, layout và constraints phù hợp.</p>
            </div>
          )}
        </aside>
      </div>

      <footer className={styles.statusbar}>
        <span>{selection.elementIds.length} selected</span>
        <span>{activeSlide.elements.length} elements · autosave local</span>
      </footer>
    </main>
  );
}
