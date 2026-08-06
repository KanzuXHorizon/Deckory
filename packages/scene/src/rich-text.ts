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

function normalizeMarks(marks: RichTextMarks | undefined): RichTextMarks | undefined {
  if (!marks) return undefined;
  const normalized: RichTextMarks = {};
  if (marks.bold) normalized.bold = true;
  if (marks.italic) normalized.italic = true;
  if (marks.underline) normalized.underline = true;
  if (marks.strike) normalized.strike = true;
  if (marks.color?.trim()) normalized.color = marks.color.trim();
  if (marks.emphasis) normalized.emphasis = marks.emphasis;
  if (marks.link?.href.trim()) {
    normalized.link = marks.link.label?.trim()
      ? { href: marks.link.href.trim(), label: marks.link.label.trim() }
      : { href: marks.link.href.trim() };
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function marksKey(marks: RichTextMarks | undefined): string {
  return JSON.stringify(marks ?? null);
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

  const list = paragraph.list
    ? {
        kind: paragraph.list.kind,
        level: Math.max(0, Math.trunc(paragraph.list.level)),
        ...(paragraph.list.ordinal === undefined ? {} : { ordinal: Math.max(1, Math.trunc(paragraph.list.ordinal)) })
      }
    : undefined;

  const style = paragraph.style ? { ...paragraph.style } : undefined;
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
