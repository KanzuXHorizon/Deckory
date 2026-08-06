import type { CSSProperties } from "react";

export type ShapeFill =
  | { type: "solid"; color: string }
  | { type: "linear-gradient"; angle: number; stops: readonly { offset: number; color: string }[] }
  | { type: "radial-gradient"; position?: { x: number; y: number }; stops: readonly { offset: number; color: string }[] };

export type ShapeRenderSpec = {
  id: string;
  shape: "rectangle" | "ellipse" | "triangle" | "diamond" | "polygon" | "path";
  width: number;
  height: number;
  path?: string;
  fill: ShapeFill;
  stroke?: { color: string; width: number; dash?: readonly number[] };
  cornerRadii?: number | readonly [number, number, number, number];
  opacity?: number;
  blendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "soft-light" | "difference";
  shadow?: { x: number; y: number; blur: number; spread: number; color: string; opacity: number };
  glow?: { color: string; blur: number; opacity: number };
  blur?: number;
  clipPath?: string;
  mask?: { type: "linear" | "radial"; value: string };
};

function stops(stopsValue: readonly { offset: number; color: string }[]): string {
  return [...stopsValue]
    .sort((left, right) => left.offset - right.offset)
    .map((stop) => `${stop.color} ${Math.max(0, Math.min(1, stop.offset)) * 100}%`)
    .join(", ");
}

function fillValue(fill: ShapeFill): string {
  if (fill.type === "solid") return fill.color;
  if (fill.type === "linear-gradient") return `linear-gradient(${fill.angle}deg, ${stops(fill.stops)})`;
  const position = fill.position ?? { x: 50, y: 50 };
  return `radial-gradient(circle at ${position.x}% ${position.y}%, ${stops(fill.stops)})`;
}

function radiusValue(spec: ShapeRenderSpec): string | number | undefined {
  if (spec.shape === "ellipse") return "50%";
  if (typeof spec.cornerRadii === "number" || spec.cornerRadii === undefined) return spec.cornerRadii;
  return spec.cornerRadii.map((value) => `${value}px`).join(" ");
}

function shapeClip(spec: ShapeRenderSpec): string | undefined {
  if (spec.clipPath) return spec.clipPath;
  if (spec.shape === "triangle") return "polygon(50% 0%, 100% 100%, 0% 100%)";
  if (spec.shape === "diamond") return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
  if (spec.shape === "polygon") return spec.path ? `path('${spec.path}')` : undefined;
  if (spec.shape === "path") return spec.path ? `path('${spec.path}')` : undefined;
  return undefined;
}

function effectError(spec: ShapeRenderSpec): boolean {
  return (spec.blur ?? 0) > 16 ||
    (spec.glow?.blur ?? 0) > 56 ||
    (spec.glow?.opacity ?? 0) > 0.4 ||
    (spec.shadow?.blur ?? 0) > 48 ||
    (spec.shadow?.opacity ?? 0) > 0.4;
}

function shadowValue(spec: ShapeRenderSpec): string | undefined {
  const values: string[] = [];
  if (spec.shadow) {
    values.push(`${spec.shadow.x}px ${spec.shadow.y}px ${spec.shadow.blur}px ${spec.shadow.spread}px color-mix(in srgb, ${spec.shadow.color} ${spec.shadow.opacity * 100}%, transparent)`);
  }
  if (spec.glow) {
    values.push(`0 0 ${spec.glow.blur}px color-mix(in srgb, ${spec.glow.color} ${spec.glow.opacity * 100}%, transparent)`);
  }
  return values.length ? values.join(", ") : undefined;
}

export function ShapeRenderer({ spec }: { spec: ShapeRenderSpec }) {
  if (effectError(spec)) {
    return <div data-shape-id={spec.id} data-shape-error="effect-budget-exceeded" />;
  }

  const dash = spec.stroke?.dash?.map((value) => `${value}px`).join(" ");
  const customProperties = dash
    ? { "--deckory-stroke-dash": dash } as CSSProperties & Record<"--deckory-stroke-dash", string>
    : {};
  const maskImage = spec.mask
    ? `${spec.mask.type}-gradient(${spec.mask.value})`
    : undefined;
  const style: CSSProperties = {
    ...customProperties,
    width: spec.width,
    height: spec.height,
    background: fillValue(spec.fill),
    border: spec.stroke ? `${spec.stroke.width}px ${dash ? "dashed" : "solid"} ${spec.stroke.color}` : undefined,
    borderRadius: radiusValue(spec),
    opacity: spec.opacity,
    mixBlendMode: spec.blendMode,
    boxShadow: shadowValue(spec),
    filter: spec.blur ? `blur(${spec.blur}px)` : undefined,
    clipPath: shapeClip(spec),
    maskImage,
    WebkitMaskImage: maskImage,
    overflow: "hidden"
  };

  return <div className="deckory-shape" data-shape-id={spec.id} data-shape-kind={spec.shape} data-stroke-dash={dash} style={style} />;
}
