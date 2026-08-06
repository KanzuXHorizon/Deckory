import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
import { motion, type MotionStyle } from "motion/react";
import { resolveDeckAsset, type DeckAsset, type Slide, type SlideComponent } from "@deckory/schema";
import {
  decodeWeightSimulatorInteraction,
  encodeWeightSimulatorInteraction,
  getComponentInteractionKey,
  resolveLocalWeightSimulatorState,
  type WeightSimulatorInteractionState
} from "./interaction-state";
import { getElementMotion, getMorphLayoutId } from "./motion-system";
import { SemanticDiagram } from "./semantic-diagrams";
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
type WeightSimulatorProps = ComponentOf<"weight-simulator">["props"];
type CriterionGridProps = ComponentOf<"criterion-grid">["props"];
type MediaShowcaseProps = ComponentOf<"media-showcase">["props"];
type EvidenceProps = ComponentOf<"evidence-footer">["props"];

export function SlideFrame({
  slide,
  sequenceStep,
  reducedMotion,
  deckId,
  assets,
  motionDisabled = false,
  interactionState,
  onInteractionChange
}: {
  slide: Slide;
  sequenceStep: number;
  reducedMotion: boolean;
  deckId?: string;
  assets?: readonly DeckAsset[] | undefined;
  motionDisabled?: boolean;
  interactionState?: Record<string, string>;
  onInteractionChange?: (componentId: string, selectedId: string) => void;
}) {
  const variant = slide.variant ?? "default";

  return (
    <article
      className={`slide slide--${slide.layout} slide--${variant}`}
      data-slide-id={slide.id}
      data-deck-id={deckId}
      data-background={slide.background ?? "editorial"}
      data-motion-disabled={motionDisabled ? "true" : undefined}
    >
      <SlideContent
        slideId={slide.id}
        components={slide.components}
        sequenceStep={sequenceStep}
        reducedMotion={reducedMotion}
        deckId={deckId}
        assets={assets}
        motionDisabled={motionDisabled}
        interactionState={interactionState}
        onInteractionChange={onInteractionChange}
      />
    </article>
  );
}

function SlideContent({
  slideId,
  components,
  sequenceStep,
  reducedMotion,
  deckId,
  assets,
  motionDisabled,
  interactionState,
  onInteractionChange
}: {
  slideId: string;
  components: SlideComponent[];
  sequenceStep: number;
  reducedMotion: boolean;
  deckId: string | undefined;
  assets: readonly DeckAsset[] | undefined;
  motionDisabled: boolean;
  interactionState: Record<string, string> | undefined;
  onInteractionChange: ((componentId: string, selectedId: string) => void) | undefined;
}) {
  return (
    <>
      {components.map((component) => {
        const active = component.sequence === undefined || sequenceStep >= component.sequence;
        const interactionKey = getComponentInteractionKey(slideId, component.id);
        return (
          <Reveal
            key={component.id}
            component={component}
            sequenceStep={sequenceStep}
            reducedMotion={reducedMotion}
            deckId={deckId}
            motionDisabled={motionDisabled}
          >
            <Component
              component={component}
              assets={assets}
              reducedMotion={reducedMotion}
              motionDisabled={motionDisabled}
              active={active}
              selectedId={interactionState?.[interactionKey]}
              onSelectedIdChange={onInteractionChange ? (selectedId) => onInteractionChange(interactionKey, selectedId) : undefined}
            />
          </Reveal>
        );
      })}
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
  const visible = component.sequence === undefined || sequenceStep >= component.sequence;
  const motionSuppressed = reducedMotion || motionDisabled;
  const elementMotion = getElementMotion(component.effect, visible, motionSuppressed);
  const morphDataId = getMorphLayoutId(deckId, component.morphId);
  const exposedMorphId = motionSuppressed && !visible ? undefined : morphDataId;
  const layoutId = motionSuppressed ? undefined : morphDataId;

  return (
    <motion.div
      className={`component-slot component-slot--${component.type}`}
      data-component-id={component.id}
      data-effect={component.effect?.type ?? "rise"}
      data-morph-id={exposedMorphId}
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
  assets,
  reducedMotion,
  motionDisabled,
  active,
  selectedId,
  onSelectedIdChange
}: {
  component: SlideComponent;
  assets: readonly DeckAsset[] | undefined;
  reducedMotion: boolean;
  motionDisabled: boolean;
  active: boolean;
  selectedId: string | undefined;
  onSelectedIdChange: ((selectedId: string) => void) | undefined;
}) {
  switch (component.type) {
    case "heading":
      return <Heading {...component.props} />;
    case "statement":
      return <Statement {...component.props} />;
    case "metric-grid":
      return <MetricGrid {...component.props} />;
    case "chart":
      return <Chart {...component.props} reducedMotion={reducedMotion} motionDisabled={motionDisabled} active={active} />;
    case "table":
      return <DataTable {...component.props} />;
    case "code":
      return <CodeSnippet {...component.props} motionDisabled={motionDisabled} />;
    case "comparison":
      return <Comparison {...component.props} />;
    case "process":
      return <Process {...component.props} active={active} reducedMotion={reducedMotion || motionDisabled} />;
    case "architecture":
      return <Architecture {...component.props} />;
    case "insight":
      return <Insight {...component.props} />;
    case "team-showcase":
      return <SemanticTeamShowcase {...component.props} assets={assets} reducedMotion={reducedMotion} motionDisabled={motionDisabled} active={active} selectedId={selectedId} onSelectedIdChange={onSelectedIdChange} />;
    case "visualizer":
      return <SemanticVisualizer {...component.props} reducedMotion={reducedMotion} motionDisabled={motionDisabled} active={active} selectedId={selectedId} onSelectedIdChange={onSelectedIdChange} />;
    case "weight-simulator":
      return <WeightSimulator {...component.props} interactionValue={selectedId} onInteractionChange={onSelectedIdChange} motionDisabled={motionDisabled} />;
    case "criterion-grid":
      return <CriterionGrid {...component.props} active={active} reducedMotion={reducedMotion || motionDisabled} />;
    case "media-showcase":
      return <MediaShowcase {...component.props} assets={assets} active={active} reducedMotion={reducedMotion || motionDisabled} />;
    case "diagram":
      return <SemanticDiagram {...component.props} active={active} reducedMotion={reducedMotion || motionDisabled} />;
    case "evidence-footer":
      return <EvidenceFooter {...component.props} assets={assets} />;
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

function CriterionGrid({ items, active, reducedMotion }: CriterionGridProps & { active: boolean; reducedMotion: boolean }) {
  return (
    <div className="criterion-grid" data-active={active ? "true" : "false"} data-motion-off={reducedMotion ? "true" : "false"}>
      {items.map((item, index) => (
        <motion.section
          className={`criterion-card criterion-card--${item.tone ?? "neutral"}${item.featured ? " is-featured" : ""}`}
          key={item.label}
          initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
          animate={active || reducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.985 }}
          transition={{ duration: 0.34, delay: reducedMotion ? 0 : index * 0.055, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="criterion-card__index">{String(index + 1).padStart(2, "0")}</div>
          <h2>{item.label}</h2>
          <p>{item.question}</p>
          <strong>{item.output}</strong>
        </motion.section>
      ))}
    </div>
  );
}

function MediaShowcase({
  title,
  summary,
  variant = "single",
  items,
  assets,
  active,
  reducedMotion
}: MediaShowcaseProps & {
  assets: readonly DeckAsset[] | undefined;
  active: boolean;
  reducedMotion: boolean;
}) {
  const accessibleSummary = items.map((item) => `${item.title}${item.caption ? `: ${item.caption}` : ""}`).join("; ");

  return (
    <section
      className={`media-showcase media-showcase--${variant}`}
      data-active={active ? "true" : "false"}
      data-motion-off={reducedMotion ? "true" : "false"}
      aria-label={`${title ?? "Bằng chứng giao diện"}. ${accessibleSummary}`}
    >
      {(title || summary) && (
        <header className="media-showcase__heading">
          {title && <h2>{title}</h2>}
          {summary && <p>{summary}</p>}
        </header>
      )}
      <div className="media-showcase__grid" data-item-count={items.length}>
        {items.map((item, index) => {
          const source = resolveDeckAsset(assets, item.assetId)?.src;
          return (
            <motion.figure
              className={`media-card${item.featured ? " is-featured" : ""}`}
              data-featured={item.featured ? "true" : "false"}
              key={`${item.assetId}-${item.title}`}
              initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.985 }}
              animate={active || reducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.985 }}
              transition={{ duration: 0.42, delay: reducedMotion ? 0 : index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="media-card__chrome" aria-hidden="true"><i /><i /><i /></div>
              <div className="media-card__viewport">
                {source && <img src={source} alt={item.alt} loading="eager" decoding="async" />}
              </div>
              <figcaption>
                {item.eyebrow && <span>{item.eyebrow}</span>}
                <strong>{item.title}</strong>
                {item.caption && <p>{item.caption}</p>}
              </figcaption>
            </motion.figure>
          );
        })}
      </div>
      <span className="sr-only">{accessibleSummary}</span>
    </section>
  );
}

function Chart({ title, unit, values, variant = "bar", showValues = true, reducedMotion, motionDisabled, active }: ChartProps & { reducedMotion: boolean; motionDisabled: boolean; active: boolean }) {
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
      {variant === "bar" && <BarChart values={values} showValues={showValues} animate={active && !reducedMotion && !motionDisabled} />}
      {(variant === "line" || variant === "area") && (
        <CartesianChart values={values} variant={variant} showValues={showValues} />
      )}
      {variant === "donut" && <DonutChart values={values} showValues={showValues} />}
      <span className="sr-only">{summary}</span>
    </section>
  );
}

function BarChart({ values, showValues, animate }: { values: ChartProps["values"]; showValues: boolean; animate: boolean }) {
  const highestValue = Math.max(1, ...values.map((item) => item.value));
  const scaleMax = Math.max(10, Math.ceil(highestValue / 10) * 10);

  return (
    <div className="bars" aria-hidden="true">
      {values.map((item, index) => {
        const width = `${Math.max(3, (item.value / scaleMax) * 100)}%`;
        const style = {
          "--bar-size": width,
          "--bar-index": index
        } as CSSProperties;

        return (
          <div className="bar-row" key={item.label} style={style}>
            <span>{item.label}</span>
            <div className="bar-track">
              <i className={item.highlight ? "is-highlight" : ""} />
              {showValues && <b><AnimatedNumber value={item.value} animate={animate} delay={360 + index * 70} /></b>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnimatedNumber({ value, animate, delay }: { value: number; animate: boolean; delay: number }) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }
    setDisplayValue(0);
    let frame = 0;
    let startTime = 0;
    const timeout = window.setTimeout(() => {
      const tick = (time: number) => {
        if (!startTime) startTime = time;
        const progress = Math.min(1, (time - startTime) / 620);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [animate, delay, value]);

  return <>{displayValue}</>;
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
  const revealId = `chart-reveal-${useId().replace(/:/g, "")}`;
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
        <defs>
          <clipPath id={revealId}>
            <rect className="chart-reveal-mask" x="24" y="24" width="552" height="176" />
          </clipPath>
        </defs>
        <line className="chart-grid-line" x1="30" y1="190" x2="570" y2="190" />
        <line className="chart-grid-line" x1="30" y1="115" x2="570" y2="115" />
        <line className="chart-grid-line" x1="30" y1="40" x2="570" y2="40" />
        <g clipPath={`url(#${revealId})`}>
          {variant === "area" && <polygon className="area-fill" points={areaPoints} />}
          <polyline className="line-stroke" points={linePoints} />
        </g>
        {points.map((point, index) => (
          <g
            className="chart-datum"
            key={point.label}
            style={{ "--datum-index": index } as CSSProperties}
          >
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
  const style = { "--donut-gradient": `conic-gradient(${stops.join(", ")})` } as CSSProperties;

  return (
    <div className="donut-layout" aria-hidden="true">
      <div className="donut" style={style}>
        <div><strong>{total}</strong><span>Tổng</span></div>
      </div>
      <div className="donut-legend">
        {values.map((item, index) => (
          <div key={item.label} style={{ "--legend-index": index } as CSSProperties}>
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

function highlightCodeLine(line: string): ReactNode[] {
  const tokenPattern = /(\/\/.*$|#[^\n]*$|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|new|class|interface|type|extends|implements|import|from|export|default|async|await|throw|try|catch|finally|switch|case|break|continue|true|false|null|undefined|SELECT|FROM|WHERE|JOIN|ON|AS|INSERT|UPDATE|DELETE|CREATE|TABLE|VALUES|AND|OR|NOT)\b|\b\d+(?:\.\d+)?\b|[{}[\]();,.<>:=+\-*/!?&|]+)/g;
  const parts = line.split(tokenPattern).filter((part) => part !== "");

  return parts.map((part, index) => {
    let token = "plain";
    if (/^(\/\/|#|\/\*)/.test(part)) token = "comment";
    else if (/^["'`]/.test(part)) token = "string";
    else if (/^\d/.test(part)) token = "number";
    else if (/^(const|let|var|function|return|if|else|for|while|new|class|interface|type|extends|implements|import|from|export|default|async|await|throw|try|catch|finally|switch|case|break|continue|true|false|null|undefined|SELECT|FROM|WHERE|JOIN|ON|AS|INSERT|UPDATE|DELETE|CREATE|TABLE|VALUES|AND|OR|NOT)$/.test(part)) token = "keyword";
    else if (/^[{}[\]();,.<>:=+\-*/!?&|]+$/.test(part)) token = "punctuation";
    return <span className={`code-token code-token--${token}`} key={`${part}-${index}`}>{part}</span>;
  });
}

function CodeSnippet({
  title,
  language,
  code,
  caption,
  showLineNumbers = true,
  highlightLines = [],
  motionDisabled
}: CodeProps & { motionDisabled: boolean }) {
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
      <pre tabIndex={motionDisabled ? undefined : 0}><code>{lines.map((line, index) => {
        const lineNumber = index + 1;
        const isHighlighted = highlighted.has(lineNumber);
        return (
          <span className="code-line" data-highlighted={isHighlighted ? "true" : "false"} key={`${lineNumber}-${line}`}>
            {showLineNumbers && <i aria-hidden="true">{String(lineNumber).padStart(2, "0")}</i>}
            <b>{line ? highlightCodeLine(line) : " "}</b>
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

function Process({ steps, active, reducedMotion }: ProcessProps & { active: boolean; reducedMotion: boolean }) {
  const icons = { data: Database, system: Layers3, people: UsersRound, sparkle: Sparkles };

  return (
    <ol className="process" data-active={active ? "true" : "false"} data-motion-off={reducedMotion ? "true" : "false"}>
      {steps.map((step, index) => {
        const Icon = icons[step.icon];
        return (
          <motion.li
            key={`${step.title}-${index}`}
            style={{ "--process-index": index } as MotionStyle}
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.42, delay: reducedMotion ? 0 : Math.min(index * 0.1, 0.3), ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="process-icon" aria-hidden="true"><Icon size={22} /></div>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
            <p>{step.note}</p>
          </motion.li>
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

function WeightSimulator({
  title,
  description,
  dimensions,
  presets,
  disclaimer,
  interactionValue,
  onInteractionChange,
  motionDisabled
}: WeightSimulatorProps & {
  interactionValue: string | undefined;
  onInteractionChange: ((value: string) => void) | undefined;
  motionDisabled: boolean;
}) {
  const baseWeights = useMemo(
    () => Object.fromEntries(dimensions.map((dimension) => [dimension.id, dimension.weight])),
    [dimensions]
  );
  const [localSelectedPresetId, setLocalSelectedPresetId] = useState(presets[0]?.id ?? "custom");
  const [localCustomWeights, setLocalCustomWeights] = useState<Record<string, number>>(() => baseWeights);
  const localState = resolveLocalWeightSimulatorState(
    localSelectedPresetId,
    localCustomWeights,
    dimensions,
    presets
  );
  const synchronizedState = decodeWeightSimulatorInteraction(
    interactionValue,
    dimensions.map((dimension) => dimension.id),
    presets.map((preset) => preset.id)
  );
  const currentState = synchronizedState ?? localState;
  const activeWeights = currentState.weights;
  const readOnly = motionDisabled || (interactionValue !== undefined && onInteractionChange === undefined);

  const totalWeight = useMemo(
    () => dimensions.reduce((sum, dimension) => sum + (activeWeights[dimension.id] ?? 0), 0),
    [activeWeights, dimensions]
  );
  const weightedScore = useMemo(() => {
    if (totalWeight <= 0) return 0;
    return dimensions.reduce(
      (sum, dimension) => sum + dimension.score * (activeWeights[dimension.id] ?? 0),
      0
    ) / totalWeight;
  }, [activeWeights, dimensions, totalWeight]);

  function commit(nextState: WeightSimulatorInteractionState) {
    if (readOnly) return;
    setLocalSelectedPresetId(nextState.presetId);
    if (nextState.presetId === "custom") setLocalCustomWeights(nextState.weights);
    onInteractionChange?.(encodeWeightSimulatorInteraction(nextState));
  }

  function selectPreset(presetId: string) {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    commit({ presetId, weights: preset.weights });
  }

  function updateWeight(id: string, value: number) {
    commit({ presetId: "custom", weights: { ...activeWeights, [id]: value } });
  }

  return (
    <section
      className="weight-simulator"
      aria-label={title}
      data-deck-interactive={readOnly ? undefined : "true"}
      data-read-only={readOnly ? "true" : "false"}
    >
      <div className="weight-simulator__header">
        <div>
          <span>MÔ PHỎNG TƯƠNG TÁC</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <output className="weight-simulator__score" aria-live="polite">
          <strong>{weightedScore.toFixed(1)}</strong>
          <span>/100</span>
          <small>{Math.abs(totalWeight - 100) < 0.01 ? "Tổng trọng số 100%" : `Tổng trọng số ${totalWeight.toFixed(0)}%`}</small>
        </output>
      </div>
      <div className="weight-simulator__presets" role="group" aria-label="Cấu hình trọng số">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset.id}
            data-active={currentState.presetId === preset.id ? "true" : "false"}
            onClick={() => selectPreset(preset.id)}
            disabled={readOnly}
            title={preset.description}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="weight-simulator__grid">
        {dimensions.map((dimension) => {
          const weight = activeWeights[dimension.id] ?? 0;
          return (
            <label className="weight-simulator__dimension" data-tone={dimension.tone ?? "neutral"} key={dimension.id}>
              <span><b>{dimension.label}</b><em>Điểm {dimension.score}</em></span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={weight}
                disabled={readOnly}
                aria-label={`Trọng số ${dimension.label}`}
                onChange={(event) => updateWeight(dimension.id, Number(event.currentTarget.value))}
              />
              <strong>{weight.toFixed(0)}%</strong>
            </label>
          );
        })}
      </div>
      <p className="weight-simulator__disclaimer">{disclaimer}</p>
    </section>
  );
}

function EvidenceFooter({
  source,
  page,
  logoAssetId,
  brandLabel,
  assets
}: EvidenceProps & { assets: readonly DeckAsset[] | undefined }) {
  const logo = logoAssetId ? assets?.find((asset) => asset.id === logoAssetId) : undefined;

  return (
    <footer className="evidence">
      <span className="evidence-brand">
        {logo?.src && <img src={logo.src} alt={brandLabel ?? "Logo thương hiệu"} />}
        <b>{brandLabel ?? "DECKORY"}</b>
        <i aria-hidden="true">/</i>
        <em>{page ?? "01"}</em>
      </span>
      <span>{source}</span>
    </footer>
  );
}
