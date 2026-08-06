import type { CSSProperties } from "react";
import type { SlideComponent } from "@deckory/schema";

type DiagramProps = Extract<SlideComponent, { type: "diagram" }>["props"];
type DiagramItem = DiagramProps["items"][number];

export function SemanticDiagram({
  title,
  summary,
  variant,
  center,
  xLabel,
  yLabel,
  items,
  active,
  reducedMotion
}: DiagramProps & { active: boolean; reducedMotion: boolean }) {
  const motionOff = reducedMotion || !active;

  return (
    <figure
      className={`semantic-diagram semantic-diagram--${variant}`}
      role="img"
      aria-label={`${title}. ${summary}`}
      data-motion-off={motionOff ? "true" : "false"}
      data-item-count={items.length}
    >
      <figcaption className="semantic-diagram__heading">
        <h2>{title}</h2>
        <p>{summary}</p>
      </figcaption>
      <div className="semantic-diagram__canvas">
        {variant === "timeline" && <Timeline items={items} />}
        {variant === "roadmap" && <Roadmap items={items} />}
        {variant === "funnel" && <StackDiagram items={items} variant="funnel" />}
        {variant === "pyramid" && <StackDiagram items={items} variant="pyramid" />}
        {variant === "cycle" && <Cycle items={items} center={center} />}
        {variant === "quadrant" && <Quadrant items={items} xLabel={xLabel} yLabel={yLabel} />}
      </div>
    </figure>
  );
}

function Timeline({ items }: { items: readonly DiagramItem[] }) {
  return (
    <ol className="diagram-timeline">
      {items.map((item, index) => <DiagramItemCard key={item.id} item={item} index={index} marker={item.value ?? String(index + 1).padStart(2, "0")} />)}
    </ol>
  );
}

function Roadmap({ items }: { items: readonly DiagramItem[] }) {
  return (
    <ol className="diagram-roadmap">
      {items.map((item, index) => (
        <li key={item.id} data-tone={item.tone ?? "neutral"} data-featured={item.featured ? "true" : "false"} style={{ "--item-index": index } as CSSProperties}>
          <span className="diagram-roadmap__phase">{item.value ?? `Giai đoạn ${index + 1}`}</span>
          <div><strong>{item.label}</strong>{item.description && <p>{item.description}</p>}</div>
        </li>
      ))}
    </ol>
  );
}

function StackDiagram({ items, variant }: { items: readonly DiagramItem[]; variant: "funnel" | "pyramid" }) {
  const ordered = variant === "pyramid" ? [...items].reverse() : items;
  return (
    <ol className={`diagram-stack diagram-stack--${variant}`}>
      {ordered.map((item, index) => {
        const width = 100 - index * (52 / Math.max(1, ordered.length - 1));
        return (
          <li
            key={item.id}
            data-tone={item.tone ?? "neutral"}
            data-featured={item.featured ? "true" : "false"}
            style={{ "--diagram-width": `${Math.max(48, width)}%`, "--item-index": index } as CSSProperties}
          >
            <div><strong>{item.label}</strong>{item.description && <p>{item.description}</p>}</div>
            {item.value && <span>{item.value}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Cycle({ items, center }: { items: readonly DiagramItem[]; center: string | undefined }) {
  return (
    <div className="diagram-cycle">
      <div className="diagram-cycle__center"><span>{center ?? "Chu trình"}</span></div>
      <ol>
        {items.map((item, index) => (
          <li
            key={item.id}
            data-tone={item.tone ?? "neutral"}
            data-featured={item.featured ? "true" : "false"}
            style={{ "--cycle-index": index, "--cycle-count": items.length } as CSSProperties}
          >
            <span>{item.value ?? String(index + 1).padStart(2, "0")}</span>
            <div><strong>{item.label}</strong>{item.description && <p>{item.description}</p>}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const DEFAULT_QUADRANT_POSITIONS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

function Quadrant({ items, xLabel, yLabel }: { items: readonly DiagramItem[]; xLabel: string | undefined; yLabel: string | undefined }) {
  return (
    <div className="diagram-quadrant">
      {yLabel && <span className="diagram-quadrant__axis diagram-quadrant__axis--y">{yLabel}</span>}
      {xLabel && <span className="diagram-quadrant__axis diagram-quadrant__axis--x">{xLabel}</span>}
      <div className="diagram-quadrant__grid">
        {items.map((item, index) => (
          <article
            key={item.id}
            data-position={item.position ?? DEFAULT_QUADRANT_POSITIONS[index]}
            data-tone={item.tone ?? "neutral"}
            data-featured={item.featured ? "true" : "false"}
            style={{ "--item-index": index, gridArea: item.position ?? DEFAULT_QUADRANT_POSITIONS[index] } as CSSProperties}
          >
            {item.value && <span>{item.value}</span>}
            <strong>{item.label}</strong>
            {item.description && <p>{item.description}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

function DiagramItemCard({ item, index, marker }: { item: DiagramItem; index: number; marker: string }) {
  return (
    <li data-tone={item.tone ?? "neutral"} data-featured={item.featured ? "true" : "false"} style={{ "--item-index": index } as CSSProperties}>
      <span className="diagram-timeline__marker">{marker}</span>
      <div>
        <small>{`Bước ${index + 1}`}</small>
        <strong>{item.label}</strong>
        {item.description && <p>{item.description}</p>}
      </div>
    </li>
  );
}
