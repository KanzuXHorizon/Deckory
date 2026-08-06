import type { Frame, SceneElement, Slide } from "@deckory/schema";

export const V2_CANVAS = { width: 1280, height: 720 } as const;
export const V2_SAFE_AREA = { top: 48, right: 72, bottom: 48, left: 72 } as const;
export const V2_HEADING_FRAME: Frame = { x: 72, y: 48, width: 1136, height: 154 };
export const V2_BODY_FRAME: Frame = { x: 72, y: 222, width: 1136, height: 398 };
export const V2_EVIDENCE_FRAME: Frame = { x: 72, y: 660, width: 1136, height: 28 };

function isHeading(element: SceneElement): element is Extract<SceneElement, { kind: "component-instance" }> {
  return element.kind === "component-instance" && element.content.componentId === "legacy-heading";
}

function isEvidence(element: SceneElement): element is Extract<SceneElement, { kind: "evidence-footer" }> {
  return element.kind === "evidence-footer";
}

function bodyFrames(layout: Slide["layout"], count: number): Frame[] {
  if (count <= 0) return [];
  const frame = V2_BODY_FRAME;
  if (count === 1) return [{ ...frame }];

  if (["split", "data", "dashboard", "architecture", "comparison"].includes(layout) && count === 2) {
    const gap = 36;
    const firstWidth = layout === "data" ? 720 : (frame.width - gap) / 2;
    return [
      { x: frame.x, y: frame.y, width: firstWidth, height: frame.height },
      { x: frame.x + firstWidth + gap, y: frame.y, width: frame.width - firstWidth - gap, height: frame.height }
    ];
  }

  const gap = 20;
  const height = (frame.height - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => ({
    x: frame.x,
    y: frame.y + index * (height + gap),
    width: frame.width,
    height
  }));
}

export function assignV1LayoutFrames(layout: Slide["layout"], elements: readonly SceneElement[]): SceneElement[] {
  const body = elements.filter((element) => !isHeading(element) && !isEvidence(element));
  const frames = bodyFrames(layout, body.length);
  let bodyIndex = 0;

  return elements.map((element) => {
    if (isHeading(element)) {
      const coverFrame = layout === "cover" || layout === "closing"
        ? { x: 72, y: 148, width: 930, height: 280 }
        : V2_HEADING_FRAME;
      return { ...element, frame: { ...coverFrame } } as SceneElement;
    }
    if (isEvidence(element)) return { ...element, frame: { ...V2_EVIDENCE_FRAME } } as SceneElement;
    const frame = frames[bodyIndex++] ?? V2_BODY_FRAME;
    return { ...element, frame: { ...frame } } as SceneElement;
  });
}
