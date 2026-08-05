"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useId, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export function StudioConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onCancel();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;
    const focusable = [...panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )];
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0]!;
    const last = focusable.at(-1)!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="studio-confirm-backdrop" onMouseDown={handleBackdropClick}>
      <div
        ref={panelRef}
        className="studio-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header>
          <span className="studio-confirm-icon" aria-hidden="true"><AlertTriangle size={19} /></span>
          <div><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div>
          <button type="button" className="studio-confirm-close" onClick={onCancel} aria-label="Đóng xác nhận"><X size={17} /></button>
        </header>
        <footer>
          <button ref={cancelRef} type="button" className="secondary-action" onClick={onCancel}>Hủy</button>
          <button type="button" className="studio-confirm-destructive" onClick={onConfirm}>{confirmLabel}</button>
        </footer>
      </div>
    </div>
  );
}
