"use client";

import {
  Command,
  FileDown,
  Layers3,
  LayoutTemplate,
  Play,
  Plus,
  Presentation,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Undo2,
  X,
  type LucideIcon
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Slide } from "@deckory/schema";
import {
  filterStudioCommands,
  filterStudioSlides,
  type StudioCommand,
  type StudioCommandId
} from "../lib/studio-command-catalog";
import { layoutOptions } from "../lib/studio-option-catalog";

type PaletteResult =
  | { key: string; kind: "command"; command: StudioCommand }
  | { key: string; kind: "slide"; slide: Slide };

const COMMAND_ICONS: Record<StudioCommandId, LucideIcon> = {
  save: Save,
  undo: Undo2,
  redo: Redo2,
  preview: Presentation,
  present: Play,
  export: FileDown,
  "add-slide": Plus,
  "add-component": Layers3,
  "open-templates": LayoutTemplate,
  "motion-replay": Sparkles,
  "reset-draft": RotateCcw
};

export function StudioCommandPalette({
  open,
  commands,
  slides,
  onOpenChange,
  onCommand,
  onSelectSlide
}: {
  open: boolean;
  commands: readonly StudioCommand[];
  slides: readonly Slide[];
  onOpenChange: (open: boolean) => void;
  onCommand: (commandId: StudioCommandId) => void;
  onSelectSlide: (slideId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  const results = useMemo<PaletteResult[]>(() => [
    ...filterStudioCommands(commands, query).map((command) => ({
      key: `command:${command.id}`,
      kind: "command" as const,
      command
    })),
    ...filterStudioSlides(slides, query).map((slide) => ({
      key: `slide:${slide.id}`,
      kind: "slide" as const,
      slide
    }))
  ], [commands, query, slides]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (results.length === 0) return 0;
      if (isSelectable(results[current])) return current;
      return findSelectableIndex(results, 0, 1);
    });
  }, [results]);

  if (!open) return null;

  const execute = (result: PaletteResult | undefined) => {
    if (!result || !isSelectable(result)) return;
    if (result.kind === "command") onCommand(result.command.id);
    else onSelectSlide(result.slide.id);
    onOpenChange(false);
  };

  const moveActive = (direction: -1 | 1) => {
    if (results.length === 0) return;
    setActiveIndex((current) => findSelectableIndex(results, current + direction, direction));
  };

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'input:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="studio-command-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={dialogRef}
        className="studio-command-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        onKeyDown={(event) => {
          trapFocus(event);
          if (event.key === "Escape") {
            event.preventDefault();
            onOpenChange(false);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(-1);
          } else if (event.key === "Enter" && document.activeElement === searchRef.current) {
            event.preventDefault();
            execute(results[activeIndex]);
          }
        }}
      >
        <header className="studio-command-header">
          <div>
            <span><Command size={15} aria-hidden="true" /> BẢNG LỆNH</span>
            <h2 id={headingId}>Đi đến đúng thao tác, không rời canvas.</h2>
            <p id={descriptionId}>Tìm lệnh hoặc mở nhanh một slide trong deck hiện tại.</p>
          </div>
          <button type="button" aria-label="Đóng bảng lệnh" onClick={() => onOpenChange(false)}>
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <label className="studio-command-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Tìm lệnh hoặc slide</span>
          <input
            ref={searchRef}
            value={query}
            aria-label="Tìm lệnh hoặc slide"
            placeholder="Nhập lệnh, tên slide hoặc bố cục…"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
          />
          <kbd>Esc</kbd>
        </label>

        <div className="studio-command-results" role="listbox" aria-label="Kết quả bảng lệnh">
          {results.length > 0 ? (
            results.map((result, index) => {
              if (result.kind === "command") {
                const Icon = COMMAND_ICONS[result.command.id];
                const description = result.command.disabledReason ?? result.command.description;
                return (
                  <button
                    key={result.key}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={index === activeIndex ? "is-active" : ""}
                    disabled={result.command.disabled}
                    onMouseEnter={() => {
                      if (!result.command.disabled) setActiveIndex(index);
                    }}
                    onClick={() => execute(result)}
                  >
                    <span className="studio-command-result-icon"><Icon size={17} aria-hidden="true" /></span>
                    <span className="studio-command-result-copy">
                      <strong>{result.command.label}</strong>
                      <small>{description}</small>
                    </span>
                    <span className="studio-command-result-kind">LỆNH</span>
                  </button>
                );
              }

              return (
                <button
                  key={result.key}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? "is-active" : ""}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => execute(result)}
                >
                  <span className="studio-command-slide-index">{String(slides.indexOf(result.slide) + 1).padStart(2, "0")}</span>
                  <span className="studio-command-result-copy">
                    <strong>{getSlideLabel(result.slide)}</strong>
                    <small>{result.slide.id}</small>
                  </span>
                  <span className="studio-command-result-kind">{getLayoutLabel(result.slide.layout).toLocaleUpperCase("vi")}</span>
                </button>
              );
            })
          ) : (
            <div className="studio-command-empty">
              <Search size={22} aria-hidden="true" />
              <strong>Không có lệnh hoặc slide phù hợp</strong>
              <span>Thử từ khóa ngắn hơn hoặc tìm theo bố cục.</span>
            </div>
          )}
        </div>

        <footer className="studio-command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Di chuyển</span>
          <span><kbd>Enter</kbd> Mở</span>
          <span><kbd>Esc</kbd> Đóng</span>
        </footer>
      </div>
    </div>
  );
}

function getSlideLabel(slide: Slide): string {
  const heading = slide.components.find((component) => component.type === "heading");
  return heading?.type === "heading" ? heading.props.title : slide.id;
}

function getLayoutLabel(layout: Slide["layout"]): string {
  return layoutOptions.find((option) => option.value === layout)?.label ?? layout;
}

function isSelectable(result: PaletteResult | undefined): boolean {
  return result?.kind === "slide" || (result?.kind === "command" && !result.command.disabled);
}

function findSelectableIndex(results: readonly PaletteResult[], start: number, direction: -1 | 1): number {
  if (results.length === 0) return 0;
  for (let offset = 0; offset < results.length; offset += 1) {
    const index = (start + offset * direction + results.length * 2) % results.length;
    if (isSelectable(results[index])) return index;
  }
  return 0;
}
