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
  motionDisabled?: boolean;
  reducedMotion?: boolean;
  previewKey?: string | number;
};

export function ScaledSlidePreview({
  slide,
  deckId,
  assets,
  sequenceStep = Number.MAX_SAFE_INTEGER,
  className = "",
  label,
  motionDisabled = true,
  reducedMotion = true,
  previewKey = "static"
}: ScaledSlidePreviewProps) {
  return (
    <ScaledCanvas
      slide={slide}
      deckId={deckId ?? "preview"}
      assets={assets}
      sequenceStep={sequenceStep}
      className={`scaled-slide-preview${className ? ` ${className}` : ""}`}
      motionDisabled={motionDisabled}
      reducedMotion={reducedMotion}
      previewKey={previewKey}
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
      motionDisabled
      reducedMotion
      previewKey="thumbnail"
    />
  );
}

function ScaledCanvas({
  slide,
  deckId,
  assets,
  sequenceStep,
  className,
  label,
  motionDisabled,
  reducedMotion,
  previewKey
}: {
  slide: Slide;
  deckId: string;
  assets: readonly DeckAsset[] | undefined;
  sequenceStep: number;
  className: string;
  label?: string;
  motionDisabled: boolean;
  reducedMotion: boolean;
  previewKey: string | number;
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
          key={previewKey}
          slide={slide}
          deckId={deckId}
          assets={assets}
          sequenceStep={sequenceStep}
          reducedMotion={reducedMotion}
          motionDisabled={motionDisabled}
        />
      </div>
    </div>
  );
}
