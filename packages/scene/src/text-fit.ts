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
  lineHeight?: number;
  letterSpacing?: number;
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
    ...(input.lineHeight === undefined ? [] : [`lh:${compactNumber(input.lineHeight)}`]),
    ...(input.letterSpacing === undefined ? [] : [`ls:${compactNumber(input.letterSpacing)}`]),
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
    let height = 0;
    for (const paragraph of document.paragraphs) {
      const body = paragraph.runs.map((run) => run.text).join("");
      const prefix = paragraph.list
        ? `${"  ".repeat(paragraph.list.level)}${paragraph.list.kind === "bullet" ? "•" : `${paragraph.list.ordinal ?? 1}.`} `
        : "";
      const paragraphRequest = {
        ...request,
        letterSpacing: paragraph.style?.tracking ?? request.letterSpacing
      };
      const result = measureParagraph(`${prefix}${body}`, paragraphRequest);
      paragraphLines.push(result.lines);
      maximumLineWidth = Math.max(maximumLineWidth, result.maximumLineWidth);
      height += (paragraph.style?.spacingBefore ?? 0) +
        result.lines * request.fontSize * (paragraph.style?.lineHeight ?? request.lineHeight) +
        (paragraph.style?.spacingAfter ?? 0);
    }
    const lineCount = paragraphLines.reduce((sum, count) => sum + count, 0);
    return { lineCount, height, maximumLineWidth, paragraphLines };
  }
};

export function measureRichText(
  document: NormalizedRichTextDocument,
  request: TextMeasurementRequest,
  measurer: TextMeasurer = deterministicLocalTextMeasurer
): TextMeasurement {
  return measurer.measure(document, request);
}

function measurementFingerprint(document: NormalizedRichTextDocument): string {
  return JSON.stringify(document.paragraphs.map((paragraph) => ({
    text: paragraph.runs.map((run) => run.text).join(""),
    list: paragraph.list,
    style: paragraph.style
  })));
}

function cacheKeyFor(document: NormalizedRichTextDocument, request: TextMeasurementRequest): string {
  return buildTextMeasurementCacheKey({
    fontFamily: request.fontFamily,
    fontWeight: request.fontWeight,
    fontSize: request.fontSize,
    width: request.width,
    lineHeight: request.lineHeight,
    letterSpacing: request.letterSpacing,
    text: measurementFingerprint(document)
  });
}

export function fitTextToFrame(
  document: NormalizedRichTextDocument,
  frame: { width: number; height: number },
  policy: TextFitPolicy,
  measurer: TextMeasurer = deterministicLocalTextMeasurer
): TextFitResult {
  if (!Number.isFinite(frame.width) || frame.width <= 0 || !Number.isFinite(frame.height) || frame.height <= 0) {
    throw new Error("Text fit frame requires finite positive width and height");
  }
  if (!Number.isFinite(policy.minimumSize) || !Number.isFinite(policy.preferredSize) ||
      policy.minimumSize <= 0 || policy.preferredSize < policy.minimumSize) {
    throw new Error("Text fit policy requires finite preferredSize >= minimumSize > 0");
  }
  if (!Number.isFinite(policy.fontWeight) || !Number.isFinite(policy.lineHeight) || policy.lineHeight <= 0 ||
      !Number.isFinite(policy.letterSpacing)) {
    throw new Error("Text fit policy requires finite fontWeight, positive lineHeight and finite letterSpacing");
  }
  if (policy.maximumLines < 1 || !Number.isInteger(policy.maximumLines)) {
    throw new Error("Text fit policy requires a positive integer maximumLines");
  }

  const step = 0.5;
  let size = policy.preferredSize;
  while (true) {
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
    size = Math.max(policy.minimumSize, size - step);
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
  let cumulativeLines = 0;
  let cumulativeHeight = 0;
  let overflowingParagraph = Math.max(0, minimumMeasurement.paragraphLines.length - 1);
  for (const [index, lineCount] of minimumMeasurement.paragraphLines.entries()) {
    const paragraph = document.paragraphs[index];
    cumulativeLines += lineCount;
    cumulativeHeight += (paragraph?.style?.spacingBefore ?? 0) +
      lineCount * policy.minimumSize * (paragraph?.style?.lineHeight ?? policy.lineHeight) +
      (paragraph?.style?.spacingAfter ?? 0);
    if (cumulativeLines > policy.maximumLines || cumulativeHeight > frame.height) {
      overflowingParagraph = index;
      break;
    }
  }

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
