"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { Slide } from "@deckory/schema";
import { SlideFrame } from "./slide-frame";

const PRESENTATION_WIDTH = 1280;

type ScaledSlidePreviewProps = {
  slide: Slide;
  deckId?: string;
  sequenceStep?: number;
  className?: string;
  label?: string;
};

export function ScaledSlidePreview({
  slide,
  deckId,
  sequenceStep = Number.MAX_SAFE_INTEGER,
  className = "",
  label
}: ScaledSlidePreviewProps) {
  return (
    <ScaledCanvas
      slide={slide}
      deckId={deckId ?? "preview"}
      sequenceStep={sequenceStep}
      className={`scaled-slide-preview${className ? ` ${className}` : ""}`}
      {...(label ? { label } : {})}
    />
  );
}

export function DeckThumbnail({
  slide,
  label,
  themeClassName
}: {
  slide: Slide;
  label?: string;
  themeClassName?: string;
}) {
  const classes = ["deck-thumbnail", "scaled-slide-preview", themeClassName].filter(Boolean).join(" ");

  return (
    <ScaledCanvas
      slide={slide}
      deckId="thumbnail"
      sequenceStep={Number.MAX_SAFE_INTEGER}
      className={classes}
      label={label ?? `Xem trước slide ${slide.id}`}
    />
  );
}

function ScaledCanvas({
  slide,
  deckId,
  sequenceStep,
  className,
  label
}: {
  slide: Slide;
  deckId: string;
  sequenceStep: number;
  className: string;
  label?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateScale = () => setScale(root.clientWidth / PRESENTATION_WIDTH);
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ "--thumbnail-scale": scale } as CSSProperties}
      aria-label={label}
    >
      <div className="scaled-slide-preview-canvas">
        <SlideFrame
          slide={slide}
          deckId={deckId}
          sequenceStep={sequenceStep}
          reducedMotion
          motionDisabled
        />
      </div>
    </div>
  );
}
