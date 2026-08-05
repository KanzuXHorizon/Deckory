import type { CSSProperties } from "react";
import type { LaserPointerState } from "./presenter-runtime";

export function LaserPointer({ state, audience = false }: { state: LaserPointerState; audience?: boolean }) {
  if (!state.enabled || !state.visible) return null;

  const style = {
    "--laser-x": `${state.x * 100}%`,
    "--laser-y": `${state.y * 100}%`
  } as CSSProperties;

  return (
    <div
      className={`laser-pointer${audience ? " laser-pointer--audience" : ""}`}
      style={style}
      aria-hidden="true"
      data-laser-visible="true"
    >
      <span />
    </div>
  );
}
