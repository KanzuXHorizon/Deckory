import type { CSSProperties, ReactNode } from "react";

export type RichTextRenderMarks = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  emphasis?: "primary" | "secondary" | "positive" | "warning" | "critical";
  link?: { href: string; label?: string };
};

export type RichTextRenderParagraph = {
  id: string;
  runs: readonly { text: string; marks?: RichTextRenderMarks }[];
  list?: { kind: "bullet" | "number"; level: number; ordinal?: number };
  style?: {
    role?: string;
    align?: "left" | "center" | "right" | "justify";
    lineHeight?: number;
    tracking?: number;
    spacingBefore?: number;
    spacingAfter?: number;
  };
};

export type RichTextRenderDocument = {
  paragraphs: readonly RichTextRenderParagraph[];
  verticalAlign: "top" | "center" | "bottom";
  readingOrder: readonly string[];
  plainText: string;
};

function safeLink(href: string): string | undefined {
  const trimmed = href.trim();
  if (trimmed.startsWith("#") ||
      (trimmed.startsWith("/") && !trimmed.startsWith("//")) ||
      trimmed.startsWith("./") ||
      trimmed.startsWith("../") ||
      /^https?:\/\//i.test(trimmed) ||
      /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

function safeColor(color: string): boolean {
  const value = color.trim();
  return /^[a-z][a-z0-9-]*$/i.test(value) || /^#[0-9a-f]{3,8}$/i.test(value);
}

function renderRun(run: RichTextRenderParagraph["runs"][number], key: number): ReactNode {
  const marks = run.marks;
  const unsafeColor = Boolean(marks?.color && !safeColor(marks.color));
  let node: ReactNode = run.text;
  if (marks?.bold) node = <strong>{node}</strong>;
  if (marks?.italic) node = <em>{node}</em>;
  if (marks?.underline) node = <u>{node}</u>;
  if (marks?.strike) node = <s>{node}</s>;
  if (marks?.link) {
    const href = safeLink(marks.link.href);
    node = href ? <a href={href} aria-label={marks.link.label}>{node}</a> : <span data-rich-text-error="unsafe-link">{node}</span>;
  }
  const style: CSSProperties | undefined = marks?.color && !unsafeColor
    ? { color: `var(--deckory-color-${marks.color}, ${marks.color})` }
    : undefined;
  return (
    <span
      key={key}
      data-emphasis={marks?.emphasis}
      data-rich-text-error={unsafeColor ? "unsafe-color" : undefined}
      style={style}
    >
      {node}
    </span>
  );
}

function paragraphStyle(paragraph: RichTextRenderParagraph): CSSProperties {
  return {
    textAlign: paragraph.style?.align,
    lineHeight: paragraph.style?.lineHeight,
    letterSpacing: paragraph.style?.tracking,
    marginBlockStart: paragraph.style?.spacingBefore,
    marginBlockEnd: paragraph.style?.spacingAfter
  };
}

function renderParagraph(paragraph: RichTextRenderParagraph): ReactNode {
  return (
    <p
      key={paragraph.id}
      data-paragraph-id={paragraph.id}
      data-text-role={paragraph.style?.role}
      style={paragraphStyle(paragraph)}
    >
      {paragraph.runs.map(renderRun)}
    </p>
  );
}

function renderList(paragraphs: readonly RichTextRenderParagraph[]): ReactNode {
  const first = paragraphs[0]!;
  const list = first.list!;
  const paddingInlineStart = `${1.25 + list.level * 1.25}em`;
  const items = paragraphs.map((paragraph) => (
    <li
      key={paragraph.id}
      data-paragraph-id={paragraph.id}
      data-text-role={paragraph.style?.role}
      value={paragraph.list?.kind === "number" ? paragraph.list.ordinal : undefined}
      style={paragraphStyle(paragraph)}
    >
      {paragraph.runs.map(renderRun)}
    </li>
  ));

  if (list.kind === "bullet") {
    return <ul key={first.id} data-list-level={list.level} style={{ paddingInlineStart }}>{items}</ul>;
  }
  return (
    <ol key={first.id} data-list-level={list.level} start={list.ordinal} style={{ paddingInlineStart }}>
      {items}
    </ol>
  );
}

function renderBlocks(paragraphs: readonly RichTextRenderParagraph[]): ReactNode[] {
  const blocks: ReactNode[] = [];
  for (let index = 0; index < paragraphs.length;) {
    const paragraph = paragraphs[index]!;
    if (!paragraph.list) {
      blocks.push(renderParagraph(paragraph));
      index += 1;
      continue;
    }

    const group: RichTextRenderParagraph[] = [paragraph];
    let cursor = index + 1;
    while (cursor < paragraphs.length) {
      const candidate = paragraphs[cursor]!;
      if (!candidate.list || candidate.list.kind !== paragraph.list.kind || candidate.list.level !== paragraph.list.level) break;
      group.push(candidate);
      cursor += 1;
    }
    blocks.push(renderList(group));
    index = cursor;
  }
  return blocks;
}

export function RichTextRenderer({ document }: { document: RichTextRenderDocument }) {
  const justifyContent = document.verticalAlign === "center"
    ? "center"
    : document.verticalAlign === "bottom"
      ? "flex-end"
      : "flex-start";
  return (
    <div
      className="deckory-rich-text"
      data-reading-order={document.readingOrder.join(" ")}
      aria-label={document.plainText}
      style={{ display: "flex", flexDirection: "column", justifyContent, width: "100%", height: "100%" }}
    >
      {renderBlocks(document.paragraphs)}
    </div>
  );
}
