import { Children, type CSSProperties, type ReactNode } from "react";
import type { DeckAssetV2, SceneElement } from "@deckory/schema";
import { normalizeRichText, type RichTextDocumentInput } from "@deckory/scene/rich-text";
import { ChartRenderer } from "./chart-renderer";
import { TrustedComponentHost } from "./component-host";
import { DiagramRenderer } from "./diagram-renderer";
import { ImageRenderer, type ImageRenderSpec } from "./image-renderer";
import type { CompilerMotionState } from "./motion-compiler";
import type { SceneRendererExtensions } from "./renderer-extensions";
import { RichTextRenderer } from "./rich-text-renderer";
import { ShapeRenderer, type ShapeRenderSpec } from "./shape-renderer";
import { WebBlockHost, type WebBlockHostManifest } from "./web-block-host";

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

function renderRichText(element: Extract<SceneElement, { kind: "rich-text" }>): ReactNode {
  try {
    const document = normalizeRichText(element.content.document as RichTextDocumentInput);
    return <RichTextRenderer document={document} />;
  } catch (error) {
    return (
      <span data-scene-error="rich-text-invalid">
        {element.content.plainText ?? element.accessibility.label ?? (error instanceof Error ? error.message : element.name)}
      </span>
    );
  }
}

function shapeRenderSpec(element: Extract<SceneElement, { kind: "shape" }>): ShapeRenderSpec {
  const supportedBlendModes = new Set<NonNullable<ShapeRenderSpec["blendMode"]>>([
    "normal", "multiply", "screen", "overlay", "darken", "lighten", "soft-light", "difference"
  ]);
  const blendMode = element.blendMode && supportedBlendModes.has(element.blendMode as NonNullable<ShapeRenderSpec["blendMode"]>)
    ? element.blendMode as NonNullable<ShapeRenderSpec["blendMode"]>
    : undefined;
  return {
    id: element.id,
    shape: element.content.shape,
    width: element.frame.width,
    height: element.frame.height,
    ...(element.content.path ? { path: element.content.path } : {}),
    fill: { type: "solid", color: element.style?.fill ?? "transparent" },
    ...(element.style?.stroke ? {
      stroke: { color: element.style.stroke, width: element.style.strokeWidth ?? 1 }
    } : {}),
    ...(element.style?.borderRadius !== undefined ? { cornerRadii: element.style.borderRadius } : {}),
    ...(element.opacity !== undefined ? { opacity: element.opacity } : {}),
    ...(blendMode ? { blendMode } : {})
  };
}

function imageRenderSpec(
  element: Extract<SceneElement, { kind: "image" }>,
  assets: readonly DeckAssetV2[]
): ImageRenderSpec | undefined {
  const src = assetSource(assets, element.content.assetId);
  if (!src) return undefined;
  return {
    id: element.id,
    src,
    alt: element.content.alt ?? element.accessibility.label ?? "",
    width: element.frame.width,
    height: element.frame.height,
    fit: element.style?.objectFit ?? "cover",
    ...(element.style?.focalPoint ? { focalPoint: element.style.focalPoint } : {}),
    ...(element.style?.borderRadius !== undefined ? { cornerRadii: element.style.borderRadius } : {}),
    ...(element.opacity !== undefined ? { opacity: element.opacity } : {})
  };
}

function hasMotionProperty(state: CompilerMotionState | undefined, property: keyof CompilerMotionState): boolean {
  return Boolean(state && Object.prototype.hasOwnProperty.call(state, property));
}

function elementTransform(element: SceneElement, motionState: CompilerMotionState | undefined): string | undefined {
  const transforms: string[] = [];
  if (hasMotionProperty(motionState, "translateX")) transforms.push(`translateX(${motionState!.translateX}px)`);
  if (hasMotionProperty(motionState, "translateY")) transforms.push(`translateY(${motionState!.translateY}px)`);
  if (hasMotionProperty(motionState, "scale")) transforms.push(`scale(${motionState!.scale})`);
  if (hasMotionProperty(motionState, "scaleX")) transforms.push(`scaleX(${motionState!.scaleX})`);
  if (hasMotionProperty(motionState, "scaleY")) transforms.push(`scaleY(${motionState!.scaleY})`);
  const rotation = hasMotionProperty(motionState, "rotation") ? motionState!.rotation : element.transform?.rotation;
  if (rotation !== undefined) transforms.push(`rotate(${rotation}deg)`);
  if (element.transform?.skewX !== undefined) transforms.push(`skewX(${element.transform.skewX}deg)`);
  if (element.transform?.skewY !== undefined) transforms.push(`skewY(${element.transform.skewY}deg)`);
  return transforms.length > 0 ? transforms.join(" ") : undefined;
}

function parseWebBlockManifest(input: Record<string, unknown>): WebBlockHostManifest | undefined {
  const staticFallback = input.staticFallback;
  if (
    typeof input.id !== "string" || !input.id.trim() ||
    typeof input.version !== "string" || !input.version.trim() ||
    typeof input.accessibleSummary !== "string" || !input.accessibleSummary.trim() ||
    !staticFallback || typeof staticFallback !== "object"
  ) return undefined;

  const fallback = staticFallback as Record<string, unknown>;
  if ((fallback.type !== "svg" && fallback.type !== "png") || typeof fallback.assetId !== "string" || !fallback.assetId.trim()) {
    return undefined;
  }

  return {
    id: input.id,
    version: input.version,
    accessibleSummary: input.accessibleSummary,
    staticFallback: { type: fallback.type, assetId: fallback.assetId }
  };
}

function elementContent(
  element: SceneElement,
  assets: readonly DeckAssetV2[],
  mode: SceneRenderMode,
  extensions: SceneRendererExtensions | undefined,
  children: ReactNode
): ReactNode {
  switch (element.kind) {
    case "group":
    case "stack":
    case "grid":
      return children;
    case "text":
      return element.content.text;
    case "rich-text":
      return renderRichText(element);
    case "image": {
      const spec = imageRenderSpec(element, assets);
      return spec
        ? <ImageRenderer spec={spec} />
        : <span data-scene-error="asset-missing">Thiếu asset: {element.content.assetId}</span>;
    }
    case "icon":
      return <span aria-hidden={element.accessibility.decorative || undefined}>{element.content.name}</span>;
    case "shape":
      return <ShapeRenderer spec={shapeRenderSpec(element)} />;
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
      return <ChartRenderer spec={element.content.chart} width={element.frame.width} height={element.frame.height} mode={mode} assets={assets} />;
    case "table":
      return (
        <div style={{ width: "100%", height: "100%", overflow: "hidden", border: "1px solid color-mix(in srgb, currentColor 18%, transparent)", borderRadius: 14, background: "rgba(255,255,255,.92)" }}>
          <table style={{ width: "100%", height: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "inherit", lineHeight: "inherit" }}>
            <thead>
              <tr>{element.content.columns.map((column) => (
                <th key={column} scope="col" style={{ padding: "11px 14px", borderBottom: "2px solid color-mix(in srgb, currentColor 24%, transparent)", background: "color-mix(in srgb, currentColor 7%, white)", textAlign: "left", fontWeight: 780 }}>
                  {column}
                </th>
              ))}</tr>
            </thead>
            <tbody>{element.content.rows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ background: rowIndex % 2 === 0 ? "rgba(255,255,255,.72)" : "color-mix(in srgb, currentColor 3%, white)" }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: "9px 14px", borderBottom: rowIndex === element.content.rows.length - 1 ? "none" : "1px solid color-mix(in srgb, currentColor 12%, transparent)", verticalAlign: "middle", fontWeight: cellIndex === 0 ? 680 : 500 }}>
                    {String(cell ?? "")}
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      );
    case "diagram":
      return <DiagramRenderer spec={element.content.diagram} width={element.frame.width} height={element.frame.height} />;
    case "media": {
      const src = assetSource(assets, element.content.assetId);
      return src ? <img src={src} alt={element.accessibility.label ?? ""} draggable={false} /> : <span data-scene-error="asset-missing">Thiếu asset: {element.content.assetId}</span>;
    }
    case "component-instance": {
      const definition = extensions?.components?.resolve({
        componentId: element.content.componentId,
        version: element.content.version
      });
      return definition ? (
        <TrustedComponentHost
          element={{
            id: element.id,
            name: element.name,
            content: element.content,
            accessibility: {
              ...(element.accessibility.label ? { label: element.accessibility.label } : {}),
              ...(element.accessibility.description ? { description: element.accessibility.description } : {})
            }
          }}
          definition={definition}
          mode={mode}
          {...(extensions?.exportTarget ? { exportTarget: extensions.exportTarget } : {})}
        />
      ) : legacyComponent(element);
    }
    case "web-block": {
      const manifest = parseWebBlockManifest(element.content.manifest);
      if (!manifest) {
        return <div className="scene-web-block-fallback" data-web-block-status="manifest-invalid">{element.accessibility.description ?? element.accessibility.label ?? element.name}</div>;
      }
      const resolution = extensions?.webBlocks?.resolve({
        elementId: element.id,
        manifest: element.content.manifest,
        ...(element.content.sourceId ? { sourceId: element.content.sourceId } : {})
      });
      return (
        <WebBlockHost
          element={{ id: element.id, name: element.name, manifest }}
          mode={mode}
          {...(resolution?.bundle ? { bundle: resolution.bundle } : {})}
          {...(resolution?.fallbackSrc ? { fallbackSrc: resolution.fallbackSrc } : {})}
        />
      );
    }
    case "evidence-footer":
      return (
        <footer className="scene-evidence-footer" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, borderTop: "1px solid color-mix(in srgb, currentColor 22%, transparent)", fontSize: "inherit", lineHeight: 1.2 }}>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{element.content.source}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flex: "none", fontWeight: 720 }}>
            {element.content.brandLabel && <em style={{ fontStyle: "normal", opacity: .82 }}>{element.content.brandLabel}</em>}
            {element.content.page && <b style={{ minWidth: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{element.content.page}</b>}
          </span>
        </footer>
      );
  }
}

export function ElementRenderer({
  element,
  assets,
  mode,
  children,
  extensions,
  motionState
}: {
  element: SceneElement;
  assets: readonly DeckAssetV2[];
  mode: SceneRenderMode;
  children?: ReactNode;
  extensions?: SceneRendererExtensions;
  motionState?: CompilerMotionState;
}) {
  const customProperties = {
    "--scene-x": element.frame.x,
    "--scene-y": element.frame.y,
    "--scene-width": element.frame.width,
    "--scene-height": element.frame.height,
    ...(hasMotionProperty(motionState, "progress") ? { "--deckory-progress": motionState!.progress! } : {}),
    ...(hasMotionProperty(motionState, "pathOffset") ? { "--deckory-path-offset": motionState!.pathOffset! } : {})
  } as CSSProperties & Record<`--${string}`, string | number>;

  const style: CSSProperties = {
    ...customProperties,
    position: "absolute",
    left: element.frame.x,
    top: element.frame.y,
    width: element.frame.width,
    height: element.frame.height,
    zIndex: element.zIndex,
    display: element.hidden ? "none" : undefined,
    opacity: motionState?.opacity ?? element.opacity,
    color: element.style?.color,
    background: element.kind === "shape" ? undefined : element.style?.fill,
    borderColor: element.kind === "shape" ? undefined : element.style?.stroke,
    borderStyle: element.kind !== "shape" && element.style?.stroke ? "solid" : undefined,
    borderWidth: element.kind === "shape" ? undefined : element.style?.strokeWidth,
    borderRadius: element.kind === "shape" || element.kind === "image"
      ? undefined
      : Array.isArray(element.style?.borderRadius)
        ? element.style.borderRadius.map((value) => `${value}px`).join(" ")
        : element.style?.borderRadius,
    fontFamily: element.style?.fontFamily,
    fontSize: element.style?.fontSize,
    fontWeight: element.style?.fontWeight,
    lineHeight: element.style?.lineHeight,
    letterSpacing: element.style?.letterSpacing,
    textAlign: element.style?.textAlign,
    overflow: element.kind === "group" || element.kind === "stack" || element.kind === "grid" ? "visible" : "hidden",
    transform: elementTransform(element, motionState),
    transformOrigin: element.transform?.originX !== undefined && element.transform?.originY !== undefined
      ? `${element.transform.originX}px ${element.transform.originY}px`
      : undefined,
    mixBlendMode: element.blendMode,
    filter: hasMotionProperty(motionState, "blur") ? `blur(${motionState!.blur}px)` : undefined,
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
      data-scene-child-count={Children.count(children) || undefined}
      style={style}
      role={role}
      aria-label={element.accessibility.decorative ? undefined : element.accessibility.label}
      aria-description={element.accessibility.decorative ? undefined : element.accessibility.description}
      aria-hidden={element.accessibility.decorative || undefined}
    >
      {elementContent(element, assets, mode, extensions, children)}
    </div>
  );
}
