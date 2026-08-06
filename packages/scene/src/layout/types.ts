import type { Frame } from "@deckory/schema/v2";

export type LayoutDiagnosticCode =
  | "constraint-minimum-does-not-fit"
  | "constraint-maximum-exceeded"
  | "sizing-minimum-does-not-fit"
  | "sizing-maximum-exceeded"
  | "auto-layout-does-not-fit"
  | "grid-does-not-fit"
  | "layout-conversion-does-not-fit"
  | "invalid-layout-input";

export type LayoutDiagnostic = {
  code: LayoutDiagnosticCode;
  message: string;
  recommendation?: string;
  elementIds?: string[];
};

export type LayoutFailure = {
  ok: false;
  diagnostics: LayoutDiagnostic[];
};

export type LayoutValueSuccess<T> = {
  ok: true;
  value: T;
};

export type LayoutValueResult<T> = LayoutValueSuccess<T> | LayoutFailure;

export type LayoutPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type LayoutPaddingInput = number | LayoutPadding | readonly [number, number, number, number];

export type LayoutBounds = Pick<Frame, "width" | "height">;

export function failure(diagnostic: LayoutDiagnostic): LayoutFailure {
  return { ok: false, diagnostics: [diagnostic] };
}

export function normalizePadding(input: LayoutPaddingInput): LayoutPadding {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) throw new RangeError("Layout padding must be a finite non-negative number");
    return { top: input, right: input, bottom: input, left: input };
  }

  if (Array.isArray(input)) {
    const [top, right, bottom, left] = input;
    for (const value of input) {
      if (!Number.isFinite(value) || value < 0) throw new RangeError("Layout padding must contain finite non-negative numbers");
    }
    return { top, right, bottom, left };
  }

  const padding = input as LayoutPadding;
  for (const value of [padding.top, padding.right, padding.bottom, padding.left]) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError("Layout padding must contain finite non-negative numbers");
  }
  return { ...padding };
}
