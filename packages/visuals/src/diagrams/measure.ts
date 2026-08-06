import type { DiagramSpec } from "./diagram-spec";

export type TextMeasureOptions = {
  fontSize?: number;
  lineHeight?: number;
  maxWidth?: number;
};

export type MeasuredTextBlock = {
  width: number;
  height: number;
  lineHeightPx: number;
  lines: string[];
};

export type DiagramNodeMeasureOptions = {
  fontSize?: number;
  descriptionFontSize?: number;
  lineHeight?: number;
  maxTextWidth?: number;
  horizontalPadding?: number;
  verticalPadding?: number;
  labelDescriptionGap?: number;
  minimumWidth?: number;
  minimumHeight?: number;
};

export type MeasuredDiagramNode = {
  nodeId: string;
  width: number;
  height: number;
  measuredTextWidth: number;
  measuredTextHeight: number;
  lines: string[];
  labelLines: string[];
  descriptionLines: string[];
};

function glyphFactor(character: string): number {
  if (/\p{Mark}/u.test(character)) return 0;
  if (/\s/u.test(character)) return 0.33;
  if (/[ilI1|.,:;!'`]/u.test(character)) return 0.3;
  if (/[mwMW@#%&]/u.test(character)) return 0.9;
  if (/\p{Lu}/u.test(character)) return 0.68;
  if (/\p{N}/u.test(character)) return 0.56;
  if (/[-–—/\\()[\]{}]/u.test(character)) return 0.42;
  return 0.56;
}

function measureLine(value: string, fontSize: number): number {
  const normalized = value.normalize("NFC");
  let width = 0;
  for (const character of normalized) width += glyphFactor(character) * fontSize;
  return Number(width.toFixed(3));
}

function splitLongToken(token: string, maxWidth: number, fontSize: number): string[] {
  const pieces: string[] = [];
  let current = "";
  for (const character of token.normalize("NFC")) {
    const candidate = `${current}${character}`;
    if (current && measureLine(candidate, fontSize) > maxWidth) {
      pieces.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

function wrapParagraph(paragraph: string, maxWidth: number, fontSize: number): string[] {
  const words = paragraph.normalize("NFC").trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";

  for (const sourceWord of words) {
    const tokens = measureLine(sourceWord, fontSize) > maxWidth
      ? splitLongToken(sourceWord, maxWidth, fontSize)
      : [sourceWord];
    for (const token of tokens) {
      const candidate = current ? `${current} ${token}` : token;
      if (current && measureLine(candidate, fontSize) > maxWidth) {
        lines.push(current);
        current = token;
      } else {
        current = candidate;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function measureTextBlock(
  text: string,
  options: TextMeasureOptions = {}
): MeasuredTextBlock {
  const fontSize = options.fontSize ?? 16;
  const lineHeight = options.lineHeight ?? 1.25;
  const maxWidth = options.maxWidth ?? Number.POSITIVE_INFINITY;
  const paragraphs = text.normalize("NFC").split(/\r?\n/u);
  const lines = paragraphs.flatMap((paragraph) =>
    Number.isFinite(maxWidth)
      ? wrapParagraph(paragraph, maxWidth, fontSize)
      : [paragraph.trim()]
  );
  const safeLines = lines.length > 0 ? lines : [""];
  const width = Math.max(...safeLines.map((line) => measureLine(line, fontSize)), 0);
  const lineHeightPx = fontSize * lineHeight;
  return {
    width: Number(width.toFixed(3)),
    height: Number((safeLines.length * lineHeightPx).toFixed(3)),
    lineHeightPx: Number(lineHeightPx.toFixed(3)),
    lines: safeLines
  };
}

export function measureDiagramNodes(
  spec: DiagramSpec,
  options: DiagramNodeMeasureOptions = {}
): MeasuredDiagramNode[] {
  const fontSize = options.fontSize ?? 17;
  const descriptionFontSize = options.descriptionFontSize ?? Math.max(12, fontSize - 3);
  const lineHeight = options.lineHeight ?? 1.25;
  const maxTextWidth = options.maxTextWidth ?? 240;
  const horizontalPadding = options.horizontalPadding ?? 22;
  const verticalPadding = options.verticalPadding ?? 16;
  const labelDescriptionGap = options.labelDescriptionGap ?? 8;
  const minimumWidth = options.minimumWidth ?? 140;
  const minimumHeight = options.minimumHeight ?? 64;

  return spec.nodes.map((node) => {
    const label = measureTextBlock(node.label, {
      fontSize,
      lineHeight,
      maxWidth: maxTextWidth
    });
    const description = node.description
      ? measureTextBlock(node.description, {
          fontSize: descriptionFontSize,
          lineHeight,
          maxWidth: maxTextWidth
        })
      : undefined;
    const measuredTextWidth = Math.max(label.width, description?.width ?? 0);
    const measuredTextHeight =
      label.height + (description ? labelDescriptionGap + description.height : 0);
    const width = Math.max(
      node.minimumWidth ?? minimumWidth,
      measuredTextWidth + horizontalPadding * 2
    );
    const height = Math.max(
      node.minimumHeight ?? minimumHeight,
      measuredTextHeight + verticalPadding * 2
    );
    const descriptionLines = description?.lines ?? [];

    return {
      nodeId: node.id,
      width: Number(width.toFixed(3)),
      height: Number(height.toFixed(3)),
      measuredTextWidth: Number(measuredTextWidth.toFixed(3)),
      measuredTextHeight: Number(measuredTextHeight.toFixed(3)),
      lines: [...label.lines, ...descriptionLines],
      labelLines: label.lines,
      descriptionLines
    };
  });
}
