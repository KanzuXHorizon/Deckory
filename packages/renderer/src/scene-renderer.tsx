import type { ReactNode } from "react";
import type { DeckAssetV2, SceneSlide } from "@deckory/schema";
import { BackgroundRenderer } from "./background-renderer";
import { ElementRenderer, type SceneRenderMode } from "./element-renderer";
import {
  compileMotionTimeline,
  type CompilerMotionProperty,
  type CompilerMotionState,
  type CompilerMotionTrack
} from "./motion-compiler";
import type { SceneRendererExtensions } from "./renderer-extensions";
import { buildSceneTree, type SceneTreeNode } from "./scene-tree";

const MOTION_PROPERTIES = new Set<CompilerMotionProperty>([
  "opacity", "translateX", "translateY", "scale", "scaleX", "scaleY", "rotation",
  "blur", "progress", "pathOffset", "cameraX", "cameraY", "cameraZoom"
]);

function numericMotionState(input: Record<string, unknown>): CompilerMotionState {
  const state: CompilerMotionState = {};
  for (const [property, value] of Object.entries(input)) {
    if (MOTION_PROPERTIES.has(property as CompilerMotionProperty) && typeof value === "number" && Number.isFinite(value)) {
      state[property as CompilerMotionProperty] = value;
    }
  }
  return state;
}

function motionTracks(slide: SceneSlide): CompilerMotionTrack[] {
  return slide.elements.flatMap((element) => (element.motion ?? []).map((motion, sourceOrder) => {
    const finalState = numericMotionState(motion.finalState);
    return {
      id: `${element.id}-${motion.id}`,
      elementId: element.id,
      cues: [{
        id: motion.id,
        type: motion.type,
        trigger: motion.trigger,
        duration: motion.duration,
        ...(motion.delay === undefined ? {} : { delay: motion.delay }),
        easing: motion.easing ?? "standard",
        from: {},
        to: finalState,
        sourceOrder
      }],
      finalState
    };
  }));
}

function renderTreeNode(
  node: SceneTreeNode,
  assets: readonly DeckAssetV2[],
  mode: SceneRenderMode,
  extensions: SceneRendererExtensions | undefined,
  motionStateByElement: Readonly<Record<string, CompilerMotionState>>
): ReactNode {
  const children = node.children.map((child) => renderTreeNode(child, assets, mode, extensions, motionStateByElement));
  return (
    <ElementRenderer
      key={node.element.id}
      element={node.element}
      assets={assets}
      mode={mode}
      {...(extensions ? { extensions } : {})}
      {...(motionStateByElement[node.element.id] ? { motionState: motionStateByElement[node.element.id] } : {})}
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
  const timeline = compileMotionTimeline(motionTracks(slide));

  return (
    <article
      className="scene-slide"
      data-slide-id={slide.id}
      data-render-mode={mode}
      data-hierarchy-diagnostic-count={tree.diagnostics.length || undefined}
      data-motion-diagnostic-count={mode === "studio" && timeline.diagnostics.length ? timeline.diagnostics.length : undefined}
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
      ) : tree.roots.map((node) => renderTreeNode(node, assets, mode, extensions, timeline.finalStateByElement))}
    </article>
  );
}
