"use client";

import { X, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

export type StudioChoiceOption<Value extends string> = {
  value: Value;
  label: string;
  description?: string;
  icon: LucideIcon;
  disabled?: boolean;
  disabledReason?: string;
};

export function IconChoiceGroup<Value extends string>({
  label,
  value,
  options,
  onChange,
  compact = false
}: {
  label: string;
  value: Value;
  options: readonly StudioChoiceOption<Value>[];
  onChange: (value: Value) => void;
  compact?: boolean;
}) {
  return (
    <fieldset className={`studio-choice-field ${compact ? "is-compact" : ""}`}>
      <legend>{label}</legend>
      <div className="studio-choice-group" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const Icon = option.icon;
          const selected = option.value === value;
          const supportingCopy = option.disabledReason ?? option.description;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${option.label}${supportingCopy ? `: ${supportingCopy}` : ""}`}
              className={selected ? "is-selected" : ""}
              data-value={option.value}
              disabled={option.disabled}
              tabIndex={selected ? 0 : -1}
              title={supportingCopy}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => {
                if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
                const options = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
                const currentIndex = options.indexOf(event.currentTarget);
                if (currentIndex < 0 || options.length === 0) return;
                event.preventDefault();
                const nextIndex = event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? options.length - 1
                    : (currentIndex + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + options.length) % options.length;
                const next = options[nextIndex];
                next?.focus();
                next?.click();
              }}
            >
              <Icon size={compact ? 16 : 17} aria-hidden="true" />
              <span>
                <strong>{option.label}</strong>
                {!compact && option.description && <small>{option.description}</small>}
                {option.disabledReason && <em>{option.disabledReason}</em>}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function BooleanChoice({
  label,
  value,
  onChange,
  trueLabel,
  falseLabel,
  trueIcon: TrueIcon,
  falseIcon: FalseIcon
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel: string;
  falseLabel: string;
  trueIcon: LucideIcon;
  falseIcon: LucideIcon;
}) {
  return (
    <fieldset className="studio-choice-field is-compact">
      <legend>{label}</legend>
      <div className="studio-boolean-choice" role="group" aria-label={label}>
        <button type="button" aria-pressed={value} className={value ? "is-selected" : ""} onClick={() => onChange(true)}>
          <TrueIcon size={15} aria-hidden="true" /><span>{trueLabel}</span>
        </button>
        <button type="button" aria-pressed={!value} className={!value ? "is-selected" : ""} onClick={() => onChange(false)}>
          <FalseIcon size={15} aria-hidden="true" /><span>{falseLabel}</span>
        </button>
      </div>
    </fieldset>
  );
}

export function CommandGrid<Value extends string>({
  label,
  options,
  onSelect
}: {
  label: string;
  options: readonly StudioChoiceOption<Value>[];
  onSelect: (value: Value) => void;
}) {
  return (
    <div className="studio-command-grid" role="group" aria-label={label}>
      {options.map((option) => {
        const Icon = option.icon;
        const supportingCopy = option.disabledReason ?? option.description;

        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            title={supportingCopy}
            aria-label={`${option.label}${supportingCopy ? `: ${supportingCopy}` : ""}`}
            onClick={() => onSelect(option.value)}
          >
            <span className="studio-command-icon"><Icon size={18} aria-hidden="true" /></span>
            <span className="studio-command-copy">
              <strong>{option.label}</strong>
              {supportingCopy && <small>{supportingCopy}</small>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StudioPopover({
  open,
  onOpenChange,
  label,
  description,
  triggerIcon,
  triggerLabel,
  triggerClassName,
  align = "start",
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  description?: string;
  triggerIcon: LucideIcon;
  triggerLabel: string;
  triggerClassName?: string;
  align?: "start" | "end";
  children: ReactNode;
}) {
  const TriggerIcon = triggerIcon;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousOpenRef = useRef(open);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  useEffect(() => {
    if (open && !previousOpenRef.current) {
      requestAnimationFrame(() => {
        const target = panelRef.current?.querySelector<HTMLElement>(
          "[data-popover-autofocus], .studio-command-grid > button:not(:disabled), input:not(:disabled), button:not(:disabled)"
        );
        target?.focus();
      });
    }
    if (previousOpenRef.current && !open) triggerRef.current?.focus();
    previousOpenRef.current = open;
  }, [open]);

  return (
    <div className="studio-popover" ref={rootRef} data-align={align}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName ?? "studio-popover-trigger"}
        aria-label={triggerLabel}
        title={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
      >
        <TriggerIcon size={16} aria-hidden="true" />
        <span>{triggerLabel}</span>
      </button>
      {open && (
        <div ref={panelRef} id={panelId} className="studio-popover-panel" role="dialog" aria-label={label}>
          <header>
            <div>
              <strong>{label}</strong>
              {description && <span>{description}</span>}
            </div>
            <button type="button" aria-label={`Đóng ${label}`} onClick={() => onOpenChange(false)}>
              <X size={16} aria-hidden="true" />
            </button>
          </header>
          {children}
        </div>
      )}
    </div>
  );
}
