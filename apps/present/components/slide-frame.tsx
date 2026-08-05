import type { CSSProperties, ReactNode } from "react";
import {
  BarChart3,
  Check,
  Code2,
  Database,
  FileCode2,
  Layers3,
  Lightbulb,
  Sparkles,
  Table2,
  UsersRound
} from "lucide-react";
import { motion } from "motion/react";
import type { Slide, SlideComponent } from "@deckory/schema";
import { getElementMotion, getMorphLayoutId } from "./motion-system";
import { SemanticVisualizer, TeamShowcase as SemanticTeamShowcase } from "./semantic-visuals";

type ComponentOf<Type extends SlideComponent["type"]> = Extract<SlideComponent, { type: Type }>;
type HeadingProps = ComponentOf<"heading">["props"];
type StatementProps = ComponentOf<"statement">["props"];
type MetricGridProps = ComponentOf<"metric-grid">["props"];
type ChartProps = ComponentOf<"chart">["props"];
type TableProps = ComponentOf<"table">["props"];
type CodeProps = ComponentOf<"code">["props"];
type ComparisonProps = ComponentOf<"comparison">["props"];
type ProcessProps = ComponentOf<"process">["props"];
type ArchitectureProps = ComponentOf<"architecture">["props"];
type InsightProps = ComponentOf<"insight">["props"];
type TeamShowcaseProps = ComponentOf<"team-showcase">["props"];
type VisualizerProps = ComponentOf<"visualizer">["props"];
type EvidenceProps = ComponentOf<"evidence-footer">["props"];

export function SlideFrame({
  slide,
  sequenceStep,
  reducedMotion,
  deckId,
  motionDisabled = false
}: {
  slide: Slide;
  sequenceStep: number;
  reducedMotion: boolean;
  deckId?: string;
  motionDisabled?: boolean;
}) {
  const variant = slide.variant ?? "default";

  return (
    <article
      className={`slide slide--${slide.layout} slide--${variant}`}
      data-slide-id={slide.id}
      data-motion-disabled={motionDisabled ? "true" : undefined}
    >
      <SlideContent
        components={slide.components}
        sequenceStep={sequenceStep}
        reducedMotion={reducedMotion}
        deckId={deckId}
        motionDisabled={motionDisabled}
      />
    </article>
  );
}

function SlideContent({
  components,
  sequenceStep,
  reducedMotion,
  deckId,
  motionDisabled
}: {
  components: SlideComponent[];
  sequenceStep: number;
  reducedMotion: boolean;
  deckId: string | undefined;
  motionDisabled: boolean;
}) {
  return (
    <>
      {components.map((component) => (
        <Reveal
          key={component.id}
          component={component}
          sequenceStep={sequenceStep}
          reducedMotion={reducedMotion}
          deckId={deckId}
          motionDisabled={motionDisabled}
        >
          <Component component={component} reducedMotion={reducedMotion} motionDisabled={motionDisabled} />
        </Reveal>
      ))}
    </>
  );
}

function Reveal({
  component,
  sequenceStep,
  reducedMotion,
  deckId,
  motionDisabled,
  children
}: {
  component: SlideComponent;
  sequenceStep: number;
  reducedMotion: boolean;
  deckId: string | undefined;
  motionDisabled: boolean;
  children: ReactNode;
}) {
  const visible = motionDisabled
    || reducedMotion
    || component.sequence === undefined
    || sequenceStep >= component.sequence;
  const elementMotion = getElementMotion(component.effect, visible, reducedMotion || motionDisabled);
  const layoutId = getMorphLayoutId(deckId, component.morphId);

  return (
    <motion.div
      className={`component-slot component-slot--${component.type}`}
      data-component-id={component.id}
      data-effect={component.effect?.type ?? "rise"}
      data-morph-id={layoutId}
      data-visible={visible ? "true" : "false"}
      {...(layoutId ? { layoutId } : {})}
      initial={false}
      animate={elementMotion.animate}
      transition={elementMotion.transition}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      aria-hidden={!visible}
    >
      {children}
    </motion.div>
  );
}

function Component({
  component,
  reducedMotion,
  motionDisabled
}: {
  component: SlideComponent;
  reducedMotion: boolean;
  motionDisabled: boolean;
}) {
  switch (component.type) {
    case "heading":
      return <Heading {...component.props} />;
    case "statement":
      return <Statement {...component.props} />;
    case "metric-grid":
      return <MetricGrid {...component.props} />;
    case "chart":
      return <Chart {...component.props} />;
    case "table":
      return <DataTable {...component.props} />;
    case "code":
      return <CodeSnippet {...component.props} />;
    case "comparison":
      return <Comparison {...component.props} />;
    case "process":
      return <Process {...component.props} />;
    case "architecture":
      return <Architecture {...component.props} />;
    case "insight":
      return <Insight {...component.props} />;
    case "team-showcase":
      return <SemanticTeamShowcase {...component.props} reducedMotion={reducedMotion} motionDisabled={motionDisabled} />;
    case "visualizer":
      return <SemanticVisualizer {...component.props} reducedMotion={reducedMotion} motionDisabled={motionDisabled} />;
    case "evidence-footer":
      return <EvidenceFooter {...component.props} />;
  }
}

function Heading({ eyebrow, title, description, emphasis }: HeadingProps) {
  return (
    <header className="slide-heading">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>
        <span>{title}</span>
        {emphasis && <em>{emphasis}</em>}
      </h1>
      {description && <p>{description}</p>}
    </header>
  );
}

function Statement({ quote, byline }: StatementProps) {
  return (
    <div className="statement">
      <span className="statement-mark" aria-hidden="true">“</span>
      <blockquote>{quote}</blockquote>
      {byline && <p>{byline}</p>}
    </div>
  );
}

function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="metric-grid">
      {metrics.map((metric) => (
        <section className={`metric metric--${metric.tone ?? "cobalt"}`} key={`${metric.label}-${metric.value}`}>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
          <small>{metric.note}</small>
        </section>
      ))}
    </div>
  );
}

function Chart({ title, unit, values, variant = "bar", showValues = true }: ChartProps) {
  const summary = values.map((item) => `${item.label}: ${item.value}`).join("; ");

  return (
    <section
      className={`bar-chart chart chart--${variant}`}
      data-chart-variant={variant}
      role="img"
      aria-label={`${title}. ${summary}. ${unit}`}
    >
      <div className="chart-caption" aria-hidden="true">
        <div>
          <BarChart3 size={18} />
          <span>{title}</span>
        </div>
        <small>{unit}</small>
      </div>
      {variant === "bar" && <BarChart values={values} showValues={showValues} />}
      {(variant === "line" || variant === "area") && (
        <CartesianChart values={values} variant={variant} showValues={showValues} />
      )}
      {variant === "donut" && <DonutChart values={values} showValues={showValues} />}
      <span className="sr-only">{summary}</span>
    </section>
  );
}

function BarChart({ values, showValues }: { values: ChartProps["values"]; showValues: boolean }) {
  const max = Math.max(1, ...values.map((item) => item.value));

  return (
    <div className="bars" aria-hidden="true">
      {values.map((item) => {
        const width = `${Math.max(4, (item.value / max) * 100)}%`;
        const style = { "--bar-size": width } as CSSProperties;

        return (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <i className={item.highlight ? "is-highlight" : ""} style={style}>
                {showValues && <b>{item.value}</b>}
              </i>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CartesianChart({
  values,
  variant,
  showValues
}: {
  values: ChartProps["values"];
  variant: "line" | "area";
  showValues: boolean;
}) {
  const max = Math.max(1, ...values.map((item) => item.value));
  const denominator = Math.max(1, values.length - 1);
  const points = values.map((item, index) => ({
    ...item,
    x: 30 + (index / denominator) * 540,
    y: 185 - (item.value / max) * 145
  }));
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `30,190 ${linePoints} 570,190`;

  return (
    <div className="cartesian-chart" aria-hidden="true">
      <svg viewBox="0 0 600 220" preserveAspectRatio="none">
        <line className="chart-grid-line" x1="30" y1="190" x2="570" y2="190" />
        <line className="chart-grid-line" x1="30" y1="115" x2="570" y2="115" />
        <line className="chart-grid-line" x1="30" y1="40" x2="570" y2="40" />
        {variant === "area" && <polygon className="area-fill" points={areaPoints} />}
        <polyline className="line-stroke" points={linePoints} />
        {points.map((point) => (
          <g key={point.label}>
            <circle className={point.highlight ? "chart-point is-highlight" : "chart-point"} cx={point.x} cy={point.y} r={point.highlight ? 6 : 4} />
            {showValues && <text className="chart-value" x={point.x} y={point.y - 13} textAnchor="middle">{point.value}</text>}
          </g>
        ))}
      </svg>
      <div className="chart-axis-labels" style={{ "--chart-columns": values.length } as CSSProperties}>
        {values.map((item) => <span key={item.label}>{item.label}</span>)}
      </div>
    </div>
  );
}

function DonutChart({ values, showValues }: { values: ChartProps["values"]; showValues: boolean }) {
  const total = Math.max(1, values.reduce((sum, item) => sum + item.value, 0));
  const palette = ["var(--accent)", "var(--teal)", "var(--amber)", "#8c87ee", "#77b7b8", "#d6a557", "#4a4e55", "#b9bcc1"];
  let cursor = 0;
  const stops = values.map((item, index) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    return `${palette[index % palette.length]} ${start}% ${cursor}%`;
  });
  const style = { background: `conic-gradient(${stops.join(", ")})` } as CSSProperties;

  return (
    <div className="donut-layout" aria-hidden="true">
      <div className="donut" style={style}>
        <div><strong>{total}</strong><span>Tổng</span></div>
      </div>
      <div className="donut-legend">
        {values.map((item, index) => (
          <div key={item.label}>
            <i style={{ background: palette[index % palette.length] }} />
            <span>{item.label}</span>
            {showValues && <strong>{item.value}</strong>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({ title, columns, rows, note }: TableProps) {
  const summary = rows.map((row) => row.cells.join(": ")).join("; ");

  return (
    <section className="data-table" aria-label={title}>
      <header className="data-table-heading">
        <div><Table2 size={18} aria-hidden="true" /><span>{title}</span></div>
        <small>{rows.length} hàng · {columns.length} cột</small>
      </header>
      <div className="data-table-viewport">
        <table>
          <caption className="sr-only">{title}. {summary}{note ? `. ${note}` : ""}</caption>
          <thead>
            <tr>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr className={`data-table-row ${row.highlight ? "is-highlighted" : ""}`} key={`${row.cells.join("-")}-${rowIndex}`}>
                {row.cells.map((cell, cellIndex) => cellIndex === 0
                  ? <th scope="row" key={`${cell}-${cellIndex}`}>{cell}</th>
                  : <td key={`${cell}-${cellIndex}`}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="data-table-note">{note}</p>}
    </section>
  );
}

function CodeSnippet({
  title,
  language,
  code,
  caption,
  showLineNumbers = true,
  highlightLines = []
}: CodeProps) {
  const lines = code.split(/\r?\n/);
  const highlighted = new Set(highlightLines);

  return (
    <section
      className="code-snippet"
      data-language={language}
      data-line-numbers={showLineNumbers ? "true" : "false"}
      aria-label={`${title}. Ngôn ngữ ${language}. ${lines.length} dòng.`}
    >
      <header className="code-snippet-heading">
        <div><FileCode2 size={18} aria-hidden="true" /><span>{title}</span></div>
        <small>{language}</small>
      </header>
      <pre tabIndex={0}><code>{lines.map((line, index) => {
        const lineNumber = index + 1;
        const isHighlighted = highlighted.has(lineNumber);
        return (
          <span className="code-line" data-highlighted={isHighlighted ? "true" : "false"} key={`${lineNumber}-${line}`}>
            {showLineNumbers && <i aria-hidden="true">{String(lineNumber).padStart(2, "0")}</i>}
            <b>{line || " "}</b>
          </span>
        );
      })}</code></pre>
      {caption && <p className="code-snippet-caption">{caption}</p>}
    </section>
  );
}

function Comparison({ left, right }: ComparisonProps) {
  return (
    <div className="comparison">
      <CompareSide {...left} tone="muted" />
      <div className="comparison-divider" aria-hidden="true">→</div>
      <CompareSide {...right} tone="strong" />
    </div>
  );
}

function CompareSide({
  eyebrow,
  title,
  points,
  tone
}: ComparisonProps["left"] & { tone: "muted" | "strong" }) {
  return (
    <section className={`compare-side compare-side--${tone}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <ul>
        {points.map((point) => (
          <li key={point}>
            <Check size={16} aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Process({ steps }: ProcessProps) {
  const icons = { data: Database, system: Layers3, people: UsersRound, sparkle: Sparkles };

  return (
    <ol className="process">
      {steps.map((step, index) => {
        const Icon = icons[step.icon];
        return (
          <li key={`${step.title}-${index}`}>
            <div className="process-icon" aria-hidden="true"><Icon size={22} /></div>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
            <p>{step.note}</p>
          </li>
        );
      })}
    </ol>
  );
}

function Architecture({ layers }: ArchitectureProps) {
  return (
    <section className="architecture" aria-label="Sơ đồ kiến trúc">
      {layers.map((layer) => (
        <div className={`architecture-layer ${layer.accent ? "is-accent" : ""}`} key={layer.label}>
          <span>{layer.label}</span>
          <div>
            {layer.items.map((item) => (
              <b key={item}><Code2 size={14} aria-hidden="true" />{item}</b>
            ))}
          </div>
        </div>
      ))}
      <div className="architecture-legend">Cấu trúc có thể đọc, kiểm tra và mở rộng.</div>
    </section>
  );
}

function Insight({ label, title, description, metric, tone = "cobalt" }: InsightProps) {
  return (
    <aside className={`insight insight--${tone}`} role="note" aria-label={`${label}: ${title}`}>
      <div className="insight-label"><Lightbulb size={16} aria-hidden="true" /><span>{label}</span></div>
      {metric && <strong>{metric}</strong>}
      <h2>{title}</h2>
      <p>{description}</p>
    </aside>
  );
}

function EvidenceFooter({ source, page }: EvidenceProps) {
  return (
    <footer className="evidence">
      <span>DECKORY / {page ?? "01"}</span>
      <span>{source}</span>
    </footer>
  );
}
