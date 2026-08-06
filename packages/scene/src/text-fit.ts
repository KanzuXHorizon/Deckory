import type { NormalizedRichTextDocument } from "./rich-text";

export type TextMeasurementRequest = {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  width: number;
};

export type TextMeasurement = {
  lineCount: number;
  height: number;
  maximumLineWidth: number;
  paragraphLines: readonly number[];
};

export type TextMeasurer = {
  measure(document: NormalizedRichTextDocument, request: TextMeasurementRequest): TextMeasurement;
};

export type TextMeasurementCacheKeyInput = {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  width: number;
  text: string;
};

export type TextFitPolicy = {
  fontFamily: string;
  fontWeight: number;
  preferredSize: number;
  minimumSize: number;
  lineHeight: number;
  letterSpacing: number;
  maximumLines: number;
};

export type TextFitSuccess = {
  ok: true;
  fontSize: number;
  measurement: TextMeasurement;
  cacheKey: string;
};

export type TextFitFailure = {
  ok: false;
  code: "text-does-not-fit";
  fontSize: number;
  measuredLines: number;
  measuredHeight: number;
  maximumLines: number;
  availableHeight: number;
  overflowingParagraph: number;
  recommendation: string;
  cacheKey: string;
};

export type TextFitResult = TextFitSuccess | TextFitFailure;

function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (const character of text.normalize("NFC")) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function compactNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

export function buildTextMeasurementCacheKey(input: TextMeasurementCacheKeyInput): string {
  return [
    input.fontFamily.trim(),
    compactNumber(input.fontWeight),
    compactNumber(input.fontSize),
    compactNumber(input.width),
    hashText(input.text)
  ].join("|");
}

function isCombiningMark(character: string): boolean {
  return /\p{Mark}/u.test(character);
}

function characterAdvance(character: string): number {
  if (isCombiningMark(character)) return 0;
  if (/\s/u.test(character)) return 0.28;
  if (/[.,;:!?'"“”‘’…]/u.test(character)) return 0.26;
  if (/[—–-]/u.test(character)) return 0.42;
  if (/[0-9]/u.test(character)) return 0.56;
  if (/\p{Extended_Pictographic}/u.test(character)) return 1;
  if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(character)) return 1;
  if (/\p{Lu}/u.test(character)) return 0.64;
  return 0.54;
}

function textWidth(text: string, request: TextMeasurementRequest): number {
  const normalized = text.normalize("NFC");
  const characters = Array.from(normalized);
  const emWidth = characters.reduce((total, character) => total + characterAdvance(character), 0);
  return emWidth * request.fontSize + Math.max(0, characters.length - 1) * request.letterSpacing;
}

function splitOverlongToken(token: string, request: TextMeasurementRequest): readonly string[] {
  const pieces: string[] = [];
  let current = "";
  for (const character of Array.from(token.normalize("NFC"))) {
    const candidate = current + character;
    if (current && textWidth(candidate, request) > request.width) {
      pieces.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces.length > 0 ? pieces : [""];
}

function measureParagraph(text: string, request: TextMeasurementRequest): { lines: number; maximumLineWidth: number } {
  const explicitLines = text.normalize("NFC").split("\n");
  let lines = 0;
  let maximumLineWidth = 0;

  for (const explicitLine of explicitLines) {
    const words = explicitLine.trim().length === 0 ? [""] : explicitLine.trim().split(/\s+/u);
    let current = "";
    let currentWidth = 0;
    let lineCount = 1;

    for (const word of words) {
      const pieces = textWidth(word, request) > request.width ? splitOverlongToken(word, request) : [word];
      for (const piece of pieces) {
        const candidate = current ? `${current} ${piece}` : piece;
        const candidateWidth = textWidth(candidate, request);
        if (current && candidateWidth > request.width) {
          maximumLineWidth = Math.max(maximumLineWidth, currentWidth);
          lineCount += 1;
          current = piece;
          currentWidth = textWidth(piece, request);
        } else {
          current = candidate;
          currentWidth = candidateWidth;
        }
      }
    }

    maximumLineWidth = Math.max(maximumLineWidth, currentWidth);
    lines += lineCount;
  }

  return { lines, maximumLineWidth };
}

export const deterministicLocalTextMeasurer: TextMeasurer = {
  measure(document, request) {
    if (!Number.isFinite(request.width) || request.width <= 0) {
      throw new Error("Text measurement width must be a finite positive number");
    }
    if (!Number.isFinite(request.fontSize) || request.fontSize <= 0) {
      throw new Error("Text measurement fontSize must be a finite positive number");
    }

    const paragraphLines: number[] = [];
    let maximumLineWidth = 0;
    for (const paragraph of document.paragraphs) {
      const result = measureParagraph(paragraph.runs.map((run) => run.text).join(""), request);
      paragraphLines.push(result.lines);
      maximumLineWidth = Math.max(maximumLineWidth, result.maximumLineWidth);
    }
    const lineCount = paragraphLines.reduce((sum, count) => sum + count, 0);
    return {
      lineCount,
      height: lineCount * request.fontSize * request.lineHeight,
      maximumLineWidth,
      paragraphLines
    };
  }
};

export function measureRichText(
  document: NormalizedRichTextDocument,
  request: TextMeasurementRequest,
  measurer: TextMeasurer = deterministicLocalTextMeasurer
): TextMeasurement {
  return measurer.measure(document, request);
}

function cacheKeyFor(document: NormalizedRichTextDocument, request: TextMeasurementRequest): string {
  return buildTextMeasurementCacheKey({
    fontFamily: request.fontFamily,
    fontWeight: request.fontWeight,
    fontSize: request.fontSize,
    width: request.width,
    text: document.plainText
  });
}

export function fitTextToFrame(
  document: NormalizedRichTextDocument,
  frame: { width: number; height: number },
  policy: TextFitPolicy,
  measurer: TextMeasurer = deterministicLocalTextMeasurer
): TextFitResult {
  if (policy.minimumSize <= 0 || policy.preferredSize < policy.minimumSize) {
    throw new Error("Text fit policy requires preferredSize >= minimumSize > 0");
  }
  if (policy.maximumLines < 1 || !Number.isInteger(policy.maximumLines)) {
    throw new Error("Text fit policy requires a positive integer maximumLines");
  }

  const step = 0.5;
  for (let size = policy.preferredSize; size + 1e-9 >= policy.minimumSize; size -= step) {
    const fontSize = Math.max(policy.minimumSize, Number(size.toFixed(3)));
    const request: TextMeasurementRequest = {
      fontFamily: policy.fontFamily,
      fontWeight: policy.fontWeight,
      fontSize,
      lineHeight: policy.lineHeight,
      letterSpacing: policy.letterSpacing,
      width: frame.width
    };
    const measurement = measureRichText(document, request, measurer);
    if (measurement.lineCount <= policy.maximumLines && measurement.height <= frame.height) {
      return { ok: true, fontSize, measurement, cacheKey: cacheKeyFor(document, request) };
    }
    if (fontSize === policy.minimumSize) break;
  }

  const minimumRequest: TextMeasurementRequest = {
    fontFamily: policy.fontFamily,
    fontWeight: policy.fontWeight,
    fontSize: policy.minimumSize,
    lineHeight: policy.lineHeight,
    letterSpacing: policy.letterSpacing,
    width: frame.width
  };
  const minimumMeasurement = measureRichText(document, minimumRequest, measurer);
  const overflowingParagraph = Math.max(
    0,
    minimumMeasurement.paragraphLines.findIndex((lineCount) => lineCount > policy.maximumLines)
  );

  return {
    ok: false,
    code: "text-does-not-fit",
    fontSize: policy.minimumSize,
    measuredLines: minimumMeasurement.lineCount,
    measuredHeight: minimumMeasurement.height,
    maximumLines: policy.maximumLines,
    availableHeight: frame.height,
    overflowingParagraph,
    recommendation: "Split or rewrite the text, or increase the frame while preserving the declared minimum font size.",
    cacheKey: cacheKeyFor(document, minimumRequest)
  };
}
