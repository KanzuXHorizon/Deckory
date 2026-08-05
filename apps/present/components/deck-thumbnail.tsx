"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import type { DeckAsset, Slide } from "@deckory/schema";
import { SlideFrame } from "./slide-frame";

const PRESENTATION_WIDTH = 1280;
const PRESENTATION_HEIGHT = 720;

export function calculatePreviewScale(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 0;
  return Math.min(width / PRESENTATION_WIDTH, height / PRESENTATION_HEIGHT);
}

type ScaledSlidePreviewProps = {
  slide: Slide;
  deckId?: string;
  assets?: readonly DeckAsset[] | undefined;
  sequenceStep?: number;
  className?: string;
  label?: string;
};

export function ScaledSlidePreview({
  slide,
  deckId,
  assets,
  sequenceStep = Number.MAX_SAFE_INTEGER,
  className = "",
  label
}: ScaledSlidePreviewProps) {
  return (
    <ScaledCanvas
      slide={slide}
      deckId={deckId ?? "preview"}
      assets={assets}
      sequenceStep={sequenceStep}
      className={`scaled-slide-preview${className ? ` ${className}` : ""}`}
      {...(label ? { label } : {})}
    />
  );
}

export function DeckThumbnail({
  slide,
  label,
  themeClassName,
  assets
}: {
  slide: Slide;
  label?: string;
  themeClassName?: string;
  assets?: readonly DeckAsset[] | undefined;
}) {
  const classes = ["deck-thumbnail", "scaled-slide-preview", themeClassName].filter(Boolean).join(" ");

  return (
    <ScaledCanvas
      slide={slide}
      deckId="thumbnail"
      assets={assets}
      sequenceStep={Number.MAX_SAFE_INTEGER}
      className={classes}
      label={label ?? `Xem trước slide ${slide.id}`}
    />
  );
}

function ScaledCanvas({
  slide,
  deckId,
  assets,
  sequenceStep,
  className,
  label
}: {
  slide: Slide;
  deckId: string;
  assets: readonly DeckAsset[] | undefined;
  sequenceStep: number;
  className: string;
  label?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateScale = (width = root.clientWidth, height = root.clientHeight) => {
      setScale(calculatePreviewScale(width, height));
    };
    updateScale();

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      updateScale(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={className}
      data-preview-ready={scale > 0 ? "true" : "false"}
      style={{ "--thumbnail-scale": scale } as CSSProperties}
      aria-label={label}
    >
      <div className="scaled-slide-preview-canvas">
        <SlideFrame
          slide={slide}
          deckId={deckId}
          assets={assets}
          sequenceStep={sequenceStep}
          reducedMotion
          motionDisabled
        />
      </div>
    </div>
  );
}
