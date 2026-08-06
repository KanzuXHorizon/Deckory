import type { CSSProperties, ReactNode } from "react";
import type { BackgroundLayer, BackgroundStack, DeckAssetV2 } from "@deckory/schema/v2";

const MAX_BACKGROUND_BLUR = 64;
const MAX_GLOW_OPACITY = 0.4;

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function seeded(seed: number): () => number {
  let state = (seed || 1) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function isLocalAssetSource(source: string, mediaType: string): boolean {
  const value = source.trim();
  if (value.startsWith("//")) return false;
  if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../") || value.startsWith("file:")) {
    return true;
  }
  if (value.startsWith("data:")) {
    return /^data:image\//i.test(value) && /^image\//i.test(mediaType);
  }
  return false;
}

function layerAsset(layer: BackgroundLayer, assets: readonly DeckAssetV2[]) {
  return layer.assetId ? assets.find((asset) => asset.id === layer.assetId) : undefined;
}

function dataNumber(layer: BackgroundLayer, key: string, fallback: number): number {
  const value = layer.data?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function dataString(layer: BackgroundLayer, key: string, fallback: string): string {
  const value = layer.data?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function finiteInRange(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function safeCssFragment(value: string): boolean {
  const source = value.trim();
  return source.length > 0 && !/(?:url\s*\(|@import|javascript:|expression\s*\(|[;{}])/i.test(source);
}

function layerParametersValid(layer: BackgroundLayer): boolean {
  if (!finiteInRange(layer.opacity, 0, 1)) return false;
  if (layer.blur !== undefined && !finiteInRange(layer.blur, 0, MAX_BACKGROUND_BLUR)) return false;
  if (layer.scale !== undefined && !finiteInRange(layer.scale, 0.1, 16)) return false;
  if (layer.angle !== undefined && !Number.isFinite(layer.angle)) return false;
  if (layer.color !== undefined && !safeCssFragment(layer.color)) return false;
  if (layer.colors?.some((color) => !safeCssFragment(color))) return false;
  if (layer.position && (!finiteInRange(layer.position.x, 0, 100) || !finiteInRange(layer.position.y, 0, 100))) return false;
  if (layer.size && (!finiteInRange(layer.size.width, 0.1, 1280) || !finiteInRange(layer.size.height, 0.1, 720))) return false;

  const size = layer.data?.size;
  if ((layer.type === "grid" || layer.type === "pattern") && size !== undefined &&
      (typeof size !== "number" || !finiteInRange(size, 2, 512))) return false;
  const lineWidth = layer.data?.lineWidth;
  if (layer.type === "pattern" && lineWidth !== undefined &&
      (typeof lineWidth !== "number" || !finiteInRange(lineWidth, 0.25, 32))) return false;
  const edge = layer.data?.edge;
  if (layer.type === "edge-mask" && edge !== undefined &&
      (typeof edge !== "number" || !finiteInRange(edge, 0, 50))) return false;
  return true;
}

function assetTypeValid(layer: BackgroundLayer, asset: DeckAssetV2): boolean {
  return layer.type === "svg"
    ? asset.type === "svg"
    : asset.type === "image" || asset.type === "svg";
}

function gradientStops(colors: readonly string[]): string {
  const denominator = Math.max(1, colors.length - 1);
  return colors.map((color, index) => `${color} ${(index / denominator) * 100}%`).join(", ");
}

function meshLayer(layer: BackgroundLayer): ReactNode {
  const colors = layer.colors?.length ? layer.colors : [layer.color ?? "#5147e8", "#0f8b8d"];
  const random = seeded(layer.seed ?? Number.parseInt(stableHash(layer.id), 16));
  const id = `deckory-mesh-${stableHash(`${layer.id}:${layer.seed ?? 0}:${colors.join(",")}`)}`;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1280 720" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        {colors.map((color, index) => (
          <radialGradient key={color + index} id={`${id}-${index}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <rect width="1280" height="720" fill={colors[0]} opacity="0.18" />
      {colors.map((_, index) => {
        const x = Math.round(random() * 900 + 100);
        const y = Math.round(random() * 480 + 80);
        const radius = Math.round(random() * 280 + 260);
        return <circle key={index} cx={x} cy={y} r={radius} fill={`url(#${id}-${index})`} />;
      })}
    </svg>
  );
}

function noiseLayer(layer: BackgroundLayer): ReactNode {
  const seed = layer.seed ?? Number.parseInt(stableHash(layer.id).slice(0, 6), 16);
  const id = `deckory-noise-${layer.id}-${stableHash(`${seed}:${layer.scale ?? 1}`)}`;
  const frequency = Math.max(0.15, Math.min(1.2, 0.72 / (layer.scale ?? 1)));
  return (
    <svg width="100%" height="100%" aria-hidden="true">
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves="3" seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function layerStyle(layer: BackgroundLayer): CSSProperties {
  const colors = layer.colors?.length ? layer.colors : [layer.color ?? "#ffffff", "#000000"];
  const position = layer.position ?? { x: 50, y: 50 };
  const base: CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: layer.opacity,
    mixBlendMode: layer.blendMode,
    pointerEvents: "none"
  };

  switch (layer.type) {
    case "solid":
    case "color-overlay":
      return { ...base, backgroundColor: layer.color ?? colors[0] };
    case "linear-gradient":
      return { ...base, backgroundImage: `linear-gradient(${layer.angle ?? 135}deg, ${gradientStops(colors)})` };
    case "radial-gradient":
      return { ...base, backgroundImage: `radial-gradient(circle at ${position.x}% ${position.y}%, ${gradientStops(colors)})` };
    case "conic-gradient":
      return { ...base, backgroundImage: `conic-gradient(from ${layer.angle ?? 0}deg at ${position.x}% ${position.y}%, ${gradientStops(colors)})` };
    case "pattern": {
      const size = dataNumber(layer, "size", 24);
      const line = dataNumber(layer, "lineWidth", 1);
      const color = layer.color ?? "rgba(21,23,26,0.16)";
      return { ...base, backgroundImage: `repeating-linear-gradient(${layer.angle ?? 45}deg, ${color} 0 ${line}px, transparent ${line}px ${size}px)` };
    }
    case "grid": {
      const size = dataNumber(layer, "size", 32);
      const color = layer.color ?? "rgba(21,23,26,0.14)";
      return {
        ...base,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`
      };
    }
    case "glow":
      return {
        ...base,
        backgroundImage: `radial-gradient(circle at ${position.x}% ${position.y}%, ${layer.color ?? colors[0]} 0%, transparent 68%)`,
        filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
        transform: layer.blur ? "scale(1.08)" : undefined
      };
    case "vignette":
      return { ...base, backgroundImage: `radial-gradient(ellipse at center, transparent 48%, ${layer.color ?? "#000000"} 100%)` };
    case "blur-backdrop":
      return { ...base, backdropFilter: `blur(${layer.blur ?? 12}px)` };
    case "edge-mask": {
      const size = dataNumber(layer, "edge", 12);
      return {
        ...base,
        backgroundColor: layer.color ?? "#000000",
        maskImage: `linear-gradient(to right, transparent 0%, black ${size}%, black ${100 - size}%, transparent 100%)`
      };
    }
    default:
      return base;
  }
}

function renderLayer(layer: BackgroundLayer, assets: readonly DeckAssetV2[]): ReactNode {
  if ((layer.blur ?? 0) > MAX_BACKGROUND_BLUR || (layer.type === "glow" && layer.opacity > MAX_GLOW_OPACITY)) {
    return <div data-background-error="effect-budget-exceeded" data-background-layer={layer.id} />;
  }
  if (!layerParametersValid(layer)) {
    return <div data-background-error="parameter-invalid" data-background-layer={layer.id} />;
  }

  if (layer.type === "image" || layer.type === "svg") {
    const asset = layerAsset(layer, assets);
    if (!asset) return <div data-background-error="asset-missing" data-background-layer={layer.id} />;
    if (!assetTypeValid(layer, asset)) {
      return <div data-background-error="asset-type-invalid" data-background-layer={layer.id} />;
    }
    if (!isLocalAssetSource(asset.src, asset.mediaType)) {
      return <div data-background-error="remote-asset-rejected" data-background-layer={layer.id} />;
    }
    const fit = dataString(layer, "fit", "cover");
    return (
      <div data-background-layer={layer.id} style={layerStyle(layer)}>
        <img src={asset.src} alt="" aria-hidden="true" draggable={false} style={{ width: "100%", height: "100%", objectFit: fit === "contain" ? "contain" : "cover" }} />
      </div>
    );
  }

  if (layer.type === "mesh-gradient") {
    return <div data-background-layer={layer.id} style={layerStyle(layer)}>{meshLayer(layer)}</div>;
  }
  if (layer.type === "noise") {
    return <div data-background-layer={layer.id} style={layerStyle(layer)}>{noiseLayer(layer)}</div>;
  }
  return <div data-background-layer={layer.id} style={layerStyle(layer)} />;
}

export function BackgroundRenderer({ stack, assets }: { stack: BackgroundStack; assets: readonly DeckAssetV2[] }) {
  return (
    <div className="deckory-background-stack" data-background-layer-count={stack.layers.length} style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden="true">
      {stack.layers.map((layer) => <div key={layer.id}>{renderLayer(layer, assets)}</div>)}
    </div>
  );
}
