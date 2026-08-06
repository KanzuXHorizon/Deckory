import type { ReactNode } from "react";
import type { DeckAssetV2, SceneSlide } from "@deckory/schema";
import { BackgroundRenderer } from "./background-renderer";
import { ElementRenderer, type SceneRenderMode } from "./element-renderer";
import type { SceneRendererExtensions } from "./renderer-extensions";
import { buildSceneTree, type SceneTreeNode } from "./scene-tree";

function renderTreeNode(
  node: SceneTreeNode,
  assets: readonly DeckAssetV2[],
  mode: SceneRenderMode,
  extensions: SceneRendererExtensions | undefined
): ReactNode {
  const children = node.children.map((child) => renderTreeNode(child, assets, mode, extensions));
  return (
    <ElementRenderer
      key={node.element.id}
      element={node.element}
      assets={assets}
      mode={mode}
      {...(extensions ? { extensions } : {})}
    >
      {children}
    </ElementRenderer>
  );
}

export function SceneRenderer({
  slide,
  assets = [],
  mode,
  extensions
}: {
  slide: SceneSlide;
  assets?: readonly DeckAssetV2[];
  mode: SceneRenderMode;
  extensions?: SceneRendererExtensions;
}) {
  const tree = buildSceneTree(slide.elements);

  return (
    <article
      className="scene-slide"
      data-slide-id={slide.id}
      data-render-mode={mode}
      data-hierarchy-diagnostic-count={tree.diagnostics.length || undefined}
      style={{
        width: 1280,
        height: 720,
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        background: "#ffffff"
      }}
    >
      <div className="scene-background" aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <BackgroundRenderer stack={slide.background} assets={assets} />
      </div>
      {tree.diagnostics.length > 0 ? (
        <div
          data-scene-error="hierarchy-invalid"
          role="alert"
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        >
          Scene hierarchy không hợp lệ: {tree.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}
        </div>
      ) : tree.roots.map((node) => renderTreeNode(node, assets, mode, extensions))}
    </article>
  );
}
