import type { CSSProperties } from "react";
import type { BackgroundLayer, DeckAssetV2, SceneSlide } from "@deckory/schema";
import { ElementRenderer, type SceneRenderMode } from "./element-renderer";

function backgroundStyle(layer: BackgroundLayer, assets: readonly DeckAssetV2[]): CSSProperties {
  const common: CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: layer.opacity,
    mixBlendMode: layer.blendMode,
    pointerEvents: "none"
  };
  switch (layer.type) {
    case "solid":
    case "color-overlay":
      return { ...common, background: layer.color ?? "transparent" };
    case "linear-gradient":
      return { ...common, background: `linear-gradient(${layer.angle ?? 135}deg, ${(layer.colors ?? ["transparent", "transparent"]).join(", ")})` };
    case "radial-gradient":
    case "glow":
      return { ...common, background: `radial-gradient(circle at ${layer.position?.x ?? 50}% ${layer.position?.y ?? 50}%, ${(layer.colors ?? [layer.color ?? "transparent", "transparent"]).join(", ")})` };
    case "image":
    case "svg": {
      const src = layer.assetId ? assets.find((asset) => asset.id === layer.assetId)?.src : undefined;
      return { ...common, backgroundImage: src ? `url(${JSON.stringify(src)})` : undefined, backgroundSize: "cover", backgroundPosition: "center" };
    }
    case "grid":
      return { ...common, backgroundImage: "linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)", backgroundSize: `${layer.scale ?? 32}px ${layer.scale ?? 32}px` };
    case "noise":
      return { ...common, backgroundImage: `radial-gradient(circle, ${layer.color ?? "rgba(0,0,0,.08)"} 0 0.6px, transparent 0.8px)`, backgroundSize: `${layer.scale ?? 4}px ${layer.scale ?? 4}px` };
    case "vignette":
      return { ...common, background: `radial-gradient(circle, transparent 45%, ${layer.color ?? "rgba(0,0,0,.22)"})` };
    case "conic-gradient":
      return { ...common, background: `conic-gradient(from ${layer.angle ?? 0}deg, ${(layer.colors ?? ["transparent", "transparent"]).join(", ")})` };
    default:
      return { ...common, background: layer.color ?? "transparent", filter: layer.blur ? `blur(${layer.blur}px)` : undefined };
  }
}

export function SceneRenderer({
  slide,
  assets = [],
  mode
}: {
  slide: SceneSlide;
  assets?: readonly DeckAssetV2[];
  mode: SceneRenderMode;
}) {
  const ordered = slide.elements
    .map((element, index) => ({ element, index }))
    .sort((left, right) => left.element.zIndex - right.element.zIndex || left.index - right.index)
    .map(({ element }) => element);

  return (
    <article
      className="scene-slide"
      data-slide-id={slide.id}
      data-render-mode={mode}
      style={{
        width: 1280,
        height: 720,
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        background: "#ffffff"
      }}
    >
      <div className="scene-background" aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -1 }}>
        {slide.background.layers.map((layer) => (
          <div key={layer.id} data-background-layer-id={layer.id} data-background-layer-type={layer.type} style={backgroundStyle(layer, assets)} />
        ))}
      </div>
      {ordered.map((element) => <ElementRenderer key={element.id} element={element} assets={assets} mode={mode} />)}
    </article>
  );
}
