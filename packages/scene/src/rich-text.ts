export type RichTextMarks = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  emphasis?: "primary" | "secondary" | "positive" | "warning" | "critical";
  link?: { href: string; label?: string };
};

export type RichTextRun = {
  text: string;
  marks?: RichTextMarks;
};

export type RichTextList = {
  kind: "bullet" | "number";
  level: number;
  ordinal?: number;
};

export type RichTextParagraphStyle = {
  role?: "display" | "title" | "subtitle" | "body" | "caption" | "data" | "mono";
  align?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  tracking?: number;
  spacingBefore?: number;
  spacingAfter?: number;
};

export type RichTextParagraph = {
  id: string;
  runs: readonly RichTextRun[];
  list?: RichTextList;
  style?: RichTextParagraphStyle;
};

export type RichTextDocumentInput = {
  paragraphs: readonly RichTextParagraph[];
  verticalAlign?: "top" | "center" | "bottom";
};

export type NormalizedRichTextDocument = {
  paragraphs: readonly RichTextParagraph[];
  verticalAlign: "top" | "center" | "bottom";
  readingOrder: readonly string[];
  plainText: string;
};

function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").normalize("NFC");
}

function isSafeLinkHref(href: string): boolean {
  const value = href.trim();
  return value.startsWith("#") ||
    (value.startsWith("/") && !value.startsWith("//")) ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    /^https?:\/\//i.test(value) ||
    /^mailto:/i.test(value);
}

function isSafeRichTextColor(color: string): boolean {
  const value = color.trim();
  return /^[a-z][a-z0-9-]*$/i.test(value) || /^#[0-9a-f]{3,8}$/i.test(value);
}

function normalizeMarks(marks: RichTextMarks | undefined): RichTextMarks | undefined {
  if (!marks) return undefined;
  const normalized: RichTextMarks = {};
  if (marks.bold) normalized.bold = true;
  if (marks.italic) normalized.italic = true;
  if (marks.underline) normalized.underline = true;
  if (marks.strike) normalized.strike = true;
  if (marks.color?.trim()) {
    const color = marks.color.trim();
    if (!isSafeRichTextColor(color)) throw new Error(`Unsafe rich-text color: ${color}`);
    normalized.color = color;
  }
  if (marks.emphasis) normalized.emphasis = marks.emphasis;
  if (marks.link?.href.trim()) {
    const href = marks.link.href.trim();
    if (!isSafeLinkHref(href)) {
      throw new Error(`Unsafe rich-text link URL: ${href}`);
    }
    normalized.link = marks.link.label?.trim()
      ? { href, label: marks.link.label.trim() }
      : { href };
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function marksKey(marks: RichTextMarks | undefined): string {
  return JSON.stringify(marks ?? null);
}

function finiteMetric(value: number | undefined, label: string, options: { minimum?: number; maximum?: number } = {}): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) throw new Error(`Rich-text ${label} must be finite`);
  if (options.minimum !== undefined && value < options.minimum) {
    throw new Error(`Rich-text ${label} must be at least ${options.minimum}`);
  }
  if (options.maximum !== undefined && value > options.maximum) {
    throw new Error(`Rich-text ${label} must be at most ${options.maximum}`);
  }
  return value;
}

function normalizeParagraphStyle(style: RichTextParagraphStyle | undefined): RichTextParagraphStyle | undefined {
  if (!style) return undefined;
  return {
    ...(style.role ? { role: style.role } : {}),
    ...(style.align ? { align: style.align } : {}),
    ...(style.lineHeight === undefined ? {} : { lineHeight: finiteMetric(style.lineHeight, "lineHeight", { minimum: 0.5, maximum: 4 })! }),
    ...(style.tracking === undefined ? {} : { tracking: finiteMetric(style.tracking, "tracking", { minimum: -20, maximum: 100 })! }),
    ...(style.spacingBefore === undefined ? {} : { spacingBefore: finiteMetric(style.spacingBefore, "spacingBefore", { minimum: 0, maximum: 720 })! }),
    ...(style.spacingAfter === undefined ? {} : { spacingAfter: finiteMetric(style.spacingAfter, "spacingAfter", { minimum: 0, maximum: 720 })! })
  };
}

function normalizeParagraph(paragraph: RichTextParagraph): RichTextParagraph {
  if (!paragraph.id.trim()) throw new Error("Expected a non-empty paragraph ID");
  const runs: RichTextRun[] = [];

  for (const sourceRun of paragraph.runs) {
    const text = normalizeText(sourceRun.text);
    if (text.length === 0) continue;
    const marks = normalizeMarks(sourceRun.marks);
    const previous = runs.at(-1);
    if (previous && marksKey(previous.marks) === marksKey(marks)) {
      previous.text += text;
    } else {
      runs.push(marks ? { text, marks } : { text });
    }
  }

  let list: RichTextList | undefined;
  if (paragraph.list) {
    if (!Number.isFinite(paragraph.list.level) || paragraph.list.level < 0 || paragraph.list.level > 8) {
      throw new Error("Rich-text list level must be a finite number between 0 and 8");
    }
    if (paragraph.list.ordinal !== undefined && (!Number.isFinite(paragraph.list.ordinal) || paragraph.list.ordinal < 1)) {
      throw new Error("Rich-text list ordinal must be a finite positive number");
    }
    list = {
      kind: paragraph.list.kind,
      level: Math.trunc(paragraph.list.level),
      ...(paragraph.list.ordinal === undefined ? {} : { ordinal: Math.trunc(paragraph.list.ordinal) })
    };
  }

  const style = normalizeParagraphStyle(paragraph.style);
  return {
    id: paragraph.id.trim(),
    runs: runs.length > 0 ? runs : [{ text: "" }],
    ...(list ? { list } : {}),
    ...(style ? { style } : {})
  };
}

function paragraphPlainText(paragraph: RichTextParagraph): string {
  const text = paragraph.runs.map((run) => run.text).join("");
  if (!paragraph.list) return text;
  const indent = "  ".repeat(paragraph.list.level);
  const marker = paragraph.list.kind === "bullet"
    ? "•"
    : `${paragraph.list.ordinal ?? 1}.`;
  return `${indent}${marker} ${text}`;
}

export function richTextToPlainText(document: Pick<NormalizedRichTextDocument, "paragraphs">): string {
  return document.paragraphs.map(paragraphPlainText).join("\n");
}

export function normalizeRichText(document: RichTextDocumentInput): NormalizedRichTextDocument {
  const paragraphs = document.paragraphs.map(normalizeParagraph);
  const ids = new Set<string>();
  for (const paragraph of paragraphs) {
    if (ids.has(paragraph.id)) throw new Error(`Duplicate paragraph ID: ${paragraph.id}`);
    ids.add(paragraph.id);
  }

  const normalized = {
    paragraphs,
    verticalAlign: document.verticalAlign ?? "top",
    readingOrder: paragraphs.map((paragraph) => paragraph.id)
  } as const;

  return { ...normalized, plainText: richTextToPlainText(normalized) };
}
