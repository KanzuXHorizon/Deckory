import type { CSSProperties, ReactNode } from "react";
import type { DeckAssetV2, SceneElement } from "@deckory/schema";

export type SceneRenderMode = "final" | "thumbnail" | "studio" | "export";

function assetSource(assets: readonly DeckAssetV2[], assetId: string): string | undefined {
  return assets.find((asset) => asset.id === assetId)?.src;
}

function legacyComponent(element: Extract<SceneElement, { kind: "component-instance" }>): ReactNode {
  const { componentId, props } = element.content;
  if (componentId === "legacy-heading") {
    const title = typeof props.title === "string" ? props.title : element.accessibility.label;
    const eyebrow = typeof props.eyebrow === "string" ? props.eyebrow : undefined;
    const description = typeof props.description === "string" ? props.description : undefined;
    const emphasis = typeof props.emphasis === "string" ? props.emphasis : undefined;
    return (
      <header className="scene-legacy-heading">
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}{emphasis && <em> {emphasis}</em>}</h1>
        {description && <p>{description}</p>}
      </header>
    );
  }

  return (
    <div className="scene-component-fallback" role="group">
      <strong>{element.accessibility.label ?? element.name}</strong>
      <small>{componentId}</small>
    </div>
  );
}

function elementContent(element: SceneElement, assets: readonly DeckAssetV2[]): ReactNode {
  switch (element.kind) {
    case "group":
    case "stack":
    case "grid":
      return null;
    case "text":
      return element.content.text;
    case "rich-text":
      return element.content.plainText ?? element.accessibility.label ?? element.name;
    case "image": {
      const src = assetSource(assets, element.content.assetId);
      return src
        ? <img src={src} alt={element.content.alt ?? element.accessibility.label ?? ""} draggable={false} />
        : <span data-scene-error="asset-missing">Thiếu asset: {element.content.assetId}</span>;
    }
    case "icon":
      return <span aria-hidden={element.accessibility.decorative || undefined}>{element.content.name}</span>;
    case "shape":
      return null;
    case "line":
      return (
        <svg viewBox={`0 0 ${element.frame.width} ${element.frame.height}`} preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="0" x2={element.content.x2} y2={element.content.y2} stroke="currentColor" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case "connector":
      return <span className="scene-connector-summary">{element.content.from.elementId} → {element.content.to.elementId}</span>;
    case "svg": {
      const src = element.content.assetId ? assetSource(assets, element.content.assetId) : undefined;
      return src ? <img src={src} alt={element.accessibility.label ?? ""} draggable={false} /> : <span>{element.accessibility.label ?? element.name}</span>;
    }
    case "chart":
      return <div className="scene-chart-fallback">{element.accessibility.description ?? element.accessibility.label ?? element.name}</div>;
    case "table":
      return (
        <table>
          <thead><tr>{element.content.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{element.content.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell ?? "")}</td>)}</tr>)}</tbody>
        </table>
      );
    case "diagram":
      return <div className="scene-diagram-fallback">{element.accessibility.description ?? element.accessibility.label ?? element.name}</div>;
    case "media": {
      const src = assetSource(assets, element.content.assetId);
      return src ? <img src={src} alt={element.accessibility.label ?? ""} draggable={false} /> : <span data-scene-error="asset-missing">Thiếu asset: {element.content.assetId}</span>;
    }
    case "component-instance":
      return legacyComponent(element);
    case "web-block":
      return <div className="scene-web-block-fallback">{element.accessibility.description ?? element.accessibility.label ?? element.name}</div>;
    case "evidence-footer":
      return (
        <footer className="scene-evidence-footer">
          <span>{element.content.source}</span>
          {element.content.page && <b>{element.content.page}</b>}
        </footer>
      );
  }
}

export function ElementRenderer({
  element,
  assets,
  mode
}: {
  element: SceneElement;
  assets: readonly DeckAssetV2[];
  mode: SceneRenderMode;
}) {
  const customProperties = {
    "--scene-x": element.frame.x,
    "--scene-y": element.frame.y,
    "--scene-width": element.frame.width,
    "--scene-height": element.frame.height
  } as CSSProperties & Record<`--scene-${string}`, string | number>;

  const style: CSSProperties = {
    ...customProperties,
    position: "absolute",
    left: element.frame.x,
    top: element.frame.y,
    width: element.frame.width,
    height: element.frame.height,
    zIndex: element.zIndex,
    display: element.hidden ? "none" : undefined,
    opacity: element.opacity,
    color: element.style?.color,
    background: element.style?.fill,
    borderColor: element.style?.stroke,
    borderStyle: element.style?.stroke ? "solid" : undefined,
    borderWidth: element.style?.strokeWidth,
    borderRadius: Array.isArray(element.style?.borderRadius)
      ? element.style.borderRadius.map((value) => `${value}px`).join(" ")
      : element.style?.borderRadius,
    fontFamily: element.style?.fontFamily,
    fontSize: element.style?.fontSize,
    fontWeight: element.style?.fontWeight,
    lineHeight: element.style?.lineHeight,
    letterSpacing: element.style?.letterSpacing,
    textAlign: element.style?.textAlign,
    overflow: element.kind === "group" || element.kind === "stack" || element.kind === "grid" ? "visible" : "hidden",
    transform: element.transform?.rotation ? `rotate(${element.transform.rotation}deg)` : undefined,
    transformOrigin: element.transform?.originX !== undefined && element.transform?.originY !== undefined
      ? `${element.transform.originX}px ${element.transform.originY}px`
      : undefined,
    mixBlendMode: element.blendMode,
    pointerEvents: mode === "thumbnail" || mode === "export" ? "none" : undefined
  };

  const role = element.accessibility.decorative ? "presentation" : element.accessibility.role;
  return (
    <div
      className={`scene-element scene-element--${element.kind}`}
      data-element-id={element.id}
      data-element-kind={element.kind}
      data-parent-id={element.parentId}
      data-locked={element.locked ? "true" : undefined}
      data-render-mode={mode}
      style={style}
      role={role}
      aria-label={element.accessibility.decorative ? undefined : element.accessibility.label}
      aria-description={element.accessibility.decorative ? undefined : element.accessibility.description}
      aria-hidden={element.accessibility.decorative || undefined}
    >
      {elementContent(element, assets)}
    </div>
  );
}
