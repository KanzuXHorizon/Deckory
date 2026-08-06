import type { CSSProperties } from "react";

export type ImageRenderSpec = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  fit: "cover" | "contain" | "fill" | "none" | "scale-down";
  focalPoint?: { x: number; y: number };
  crop?: { x: number; y: number; width: number; height: number };
  duotone?: readonly [string, string];
  overlay?: { color: string; opacity: number; blendMode?: "normal" | "multiply" | "screen" | "overlay" | "soft-light" };
  effects?: { blur: number; saturation: number; contrast: number };
  cornerRadii?: number | readonly [number, number, number, number];
  opacity?: number;
  mask?: { type: "linear" | "radial"; value: string };
};

function stableHash(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isLocalSource(source: string): boolean {
  return source.startsWith("/") || source.startsWith("./") || source.startsWith("../") ||
    source.startsWith("data:") || source.startsWith("file:");
}

function radiusValue(value: ImageRenderSpec["cornerRadii"]): string | number | undefined {
  if (typeof value === "number" || value === undefined) return value;
  return value.map((entry) => `${entry}px`).join(" ");
}

function validCrop(crop: NonNullable<ImageRenderSpec["crop"]>): boolean {
  return [crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) &&
    crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0 &&
    crop.x + crop.width <= 1 && crop.y + crop.height <= 1;
}

function effectsWithinBudget(spec: ImageRenderSpec): boolean {
  const effects = spec.effects;
  if (effects && (
    effects.blur < 0 || effects.blur > 16 ||
    effects.saturation < 0 || effects.saturation > 2 ||
    effects.contrast < 0.5 || effects.contrast > 2
  )) return false;
  if (spec.overlay && (spec.overlay.opacity < 0 || spec.overlay.opacity > 0.65)) return false;
  return true;
}

function imageFilter(spec: ImageRenderSpec, duotoneId: string | undefined): string | undefined {
  const filters: string[] = [];
  if (duotoneId) filters.push(`url(#${duotoneId})`);
  if (spec.effects?.blur) filters.push(`blur(${spec.effects.blur}px)`);
  if (spec.effects && spec.effects.saturation !== 1) filters.push(`saturate(${spec.effects.saturation})`);
  if (spec.effects && spec.effects.contrast !== 1) filters.push(`contrast(${spec.effects.contrast})`);
  return filters.length ? filters.join(" ") : undefined;
}

export function ImageRenderer({ spec }: { spec: ImageRenderSpec }) {
  if (!isLocalSource(spec.src)) {
    return <div data-image-id={spec.id} data-image-error="remote-asset-rejected" role="img" aria-label={spec.alt} />;
  }
  if (!effectsWithinBudget(spec)) {
    return <div data-image-id={spec.id} data-image-error="effect-budget-exceeded" role="img" aria-label={spec.alt} />;
  }
  if (spec.crop && !validCrop(spec.crop)) {
    return <div data-image-id={spec.id} data-image-error="crop-invalid" role="img" aria-label={spec.alt} />;
  }

  const focalPoint = spec.focalPoint ?? { x: 0.5, y: 0.5 };
  const objectPosition = `${Number((focalPoint.x * 100).toFixed(3))}% ${Number((focalPoint.y * 100).toFixed(3))}%`;
  const duotoneId = spec.duotone ? `deckory-duotone-${stableHash(`${spec.id}:${spec.duotone.join(":")}`)}` : undefined;
  const crop = spec.crop;
  const maskImage = spec.mask ? `${spec.mask.type}-gradient(${spec.mask.value})` : undefined;
  const wrapperStyle: CSSProperties = {
    position: "relative",
    width: spec.width,
    height: spec.height,
    overflow: "hidden",
    borderRadius: radiusValue(spec.cornerRadii),
    opacity: spec.opacity,
    maskImage,
    WebkitMaskImage: maskImage
  };
  const imageStyle: CSSProperties = crop
    ? {
        position: "absolute",
        width: `${100 / crop.width}%`,
        height: `${100 / crop.height}%`,
        left: `${-(crop.x / crop.width) * 100}%`,
        top: `${-(crop.y / crop.height) * 100}%`,
        objectFit: spec.fit,
        objectPosition,
        filter: imageFilter(spec, duotoneId)
      }
    : {
        width: "100%",
        height: "100%",
        objectFit: spec.fit,
        objectPosition,
        filter: imageFilter(spec, duotoneId)
      };

  return (
    <figure
      className="deckory-image"
      data-image-id={spec.id}
      data-image-crop={crop ? `${crop.x},${crop.y},${crop.width},${crop.height}` : undefined}
      data-duotone={spec.duotone?.join(",")}
      style={wrapperStyle}
    >
      {spec.duotone && duotoneId && (
        <svg width="0" height="0" aria-hidden="true" focusable="false">
          <filter id={duotoneId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.05 0.85" />
              <feFuncG type="table" tableValues="0.05 0.75" />
              <feFuncB type="table" tableValues="0.08 0.95" />
            </feComponentTransfer>
          </filter>
        </svg>
      )}
      <img src={spec.src} alt={spec.alt} draggable={false} style={imageStyle} />
      {spec.overlay && (
        <span aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundColor: spec.overlay.color, opacity: spec.overlay.opacity, mixBlendMode: spec.overlay.blendMode ?? "normal" }} />
      )}
    </figure>
  );
}
