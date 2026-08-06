export type LayoutMode = "freeform" | "split" | "stack" | "grid" | "statement" | "data" | "other";

export type CompositionFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SlideCompositionInput = {
  slideId: string;
  layoutMode: LayoutMode;
  dominantVisualFamily: string;
  relationship: string;
  occupiedRegions: readonly string[];
  scaleHierarchy: readonly string[];
  elementFrames: readonly CompositionFrame[];
};

export type CompositionFingerprint = {
  slideId: string;
  key: string;
  layoutMode: LayoutMode;
  dominantVisualFamily: string;
  relationship: string;
  occupiedRegions: string[];
  scaleHierarchy: string[];
  geometrySignature: string;
};

export type CompositionRepetitionDiagnostic = {
  code: "composition-sequence-repeated";
  count: number;
  slideIds: string[];
  fingerprint: string;
  message: string;
  recommendation: string;
};

function quantize(value: number, total: number, buckets: number): number {
  if (!Number.isFinite(value) || total <= 0) return 0;
  const clamped = Math.max(0, Math.min(total, value));
  return Math.round((clamped / total) * buckets);
}

function frameSignature(frame: CompositionFrame): string {
  return [
    quantize(frame.x, 1280, 16),
    quantize(frame.y, 720, 9),
    quantize(frame.width, 1280, 16),
    quantize(frame.height, 720, 9)
  ].join(":");
}

function geometrySignature(frames: readonly CompositionFrame[]): string {
  return frames
    .map((frame) => ({ frame, signature: frameSignature(frame) }))
    .sort((left, right) => {
      if (left.frame.x !== right.frame.x) return left.frame.x - right.frame.x;
      if (left.frame.y !== right.frame.y) return left.frame.y - right.frame.y;
      if (left.frame.width !== right.frame.width) return left.frame.width - right.frame.width;
      return left.frame.height - right.frame.height;
    })
    .map((item) => item.signature)
    .join("|");
}

export function fingerprintSlideComposition(
  input: SlideCompositionInput
): CompositionFingerprint {
  const occupiedRegions = [...new Set(input.occupiedRegions)].sort((a, b) =>
    a.localeCompare(b, "en")
  );
  const scaleHierarchy = [...input.scaleHierarchy];
  const geometry = geometrySignature(input.elementFrames);
  const key = [
    input.layoutMode,
    input.dominantVisualFamily.trim().toLocaleLowerCase("en"),
    input.relationship.trim().toLocaleLowerCase("en"),
    occupiedRegions.join(","),
    scaleHierarchy.join(">"),
    geometry
  ].join("::");

  return {
    slideId: input.slideId,
    key,
    layoutMode: input.layoutMode,
    dominantVisualFamily: input.dominantVisualFamily,
    relationship: input.relationship,
    occupiedRegions,
    scaleHierarchy,
    geometrySignature: geometry
  };
}

export function detectCompositionRepetition(
  slides: readonly SlideCompositionInput[],
  options: { minimumSequence?: number } = {}
): CompositionRepetitionDiagnostic[] {
  const minimumSequence = Math.max(2, options.minimumSequence ?? 3);
  const fingerprints = slides.map(fingerprintSlideComposition);
  const diagnostics: CompositionRepetitionDiagnostic[] = [];

  let runStart = 0;
  for (let index = 1; index <= fingerprints.length; index += 1) {
    const currentKey = fingerprints[index]?.key;
    const runKey = fingerprints[runStart]?.key;
    if (currentKey === runKey) continue;

    const count = index - runStart;
    if (runKey && count >= minimumSequence) {
      const run = fingerprints.slice(runStart, index);
      diagnostics.push({
        code: "composition-sequence-repeated",
        count,
        slideIds: run.map((fingerprint) => fingerprint.slideId),
        fingerprint: runKey,
        message: `${count} slide liên tiếp dùng cùng composition fingerprint.`,
        recommendation:
          "Thay đổi scale hierarchy, dominant visual family, occupied regions hoặc relationship để tạo nhịp kể chuyện rõ hơn."
      });
    }
    runStart = index;
  }

  return diagnostics;
}
