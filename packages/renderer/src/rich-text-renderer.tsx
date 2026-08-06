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
  if (trimmed.startsWith("#") || trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

function renderRun(run: RichTextRenderParagraph["runs"][number], key: number): ReactNode {
  const marks = run.marks;
  let node: ReactNode = run.text;
  if (marks?.bold) node = <strong>{node}</strong>;
  if (marks?.italic) node = <em>{node}</em>;
  if (marks?.underline) node = <u>{node}</u>;
  if (marks?.strike) node = <s>{node}</s>;
  if (marks?.link) {
    const href = safeLink(marks.link.href);
    node = href ? <a href={href} aria-label={marks.link.label}>{node}</a> : <span data-rich-text-error="unsafe-link">{node}</span>;
  }
  const style: CSSProperties | undefined = marks?.color
    ? { color: `var(--deckory-color-${marks.color}, ${marks.color})` }
    : undefined;
  return <span key={key} data-emphasis={marks?.emphasis} style={style}>{node}</span>;
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
  const content = paragraph.runs.map(renderRun);
  const style = paragraphStyle(paragraph);
  if (paragraph.list?.kind === "bullet") {
    return (
      <ul key={paragraph.id} data-paragraph-id={paragraph.id} data-list-level={paragraph.list.level} style={{ ...style, paddingInlineStart: `${1.25 + paragraph.list.level * 1.25}em` }}>
        <li>{content}</li>
      </ul>
    );
  }
  if (paragraph.list?.kind === "number") {
    return (
      <ol key={paragraph.id} data-paragraph-id={paragraph.id} data-list-level={paragraph.list.level} start={paragraph.list.ordinal} style={{ ...style, paddingInlineStart: `${1.25 + paragraph.list.level * 1.25}em` }}>
        <li>{content}</li>
      </ol>
    );
  }
  return <p key={paragraph.id} data-paragraph-id={paragraph.id} data-text-role={paragraph.style?.role} style={style}>{content}</p>;
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
      {document.paragraphs.map(renderParagraph)}
    </div>
  );
}
