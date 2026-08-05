"use client";

import type { KeyboardEvent } from "react";
import { useId, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Database,
  ExternalLink,
  Layers3,
  Leaf,
  Mail,
  Network,
  Orbit,
  Sparkles,
  Sprout,
  UsersRound
} from "lucide-react";
import { motion, type MotionStyle } from "motion/react";
import { resolveTeamImageSource, type DeckAsset, type SlideComponent } from "@deckory/schema";
import {
  getVisualizerMotion,
  resolveSemanticMotion,
  shouldPulseVisualizerNode
} from "./semantic-motion";

type TeamShowcaseProps = Extract<SlideComponent, { type: "team-showcase" }> ["props"];
type TeamMember = TeamShowcaseProps["members"][number];
type VisualizerProps = Extract<SlideComponent, { type: "visualizer" }> ["props"];
type VisualizerItem = VisualizerProps["items"][number];
type Point = { x: number; y: number };

type VisualMotionContext = {
  reducedMotion: boolean;
  motionDisabled: boolean;
  active: boolean;
  selectedId: string | undefined;
  onSelectedIdChange: ((selectedId: string) => void) | undefined;
};

export function TeamShowcase({
  title,
  subtitle,
  project,
  variant = "editorial",
  members,
  assets,
  reducedMotion,
  motionDisabled,
  active,
  selectedId: controlledSelectedId,
  onSelectedIdChange
}: TeamShowcaseProps & VisualMotionContext & { assets?: readonly DeckAsset[] | undefined }) {
  const detailId = useId();
  const initialMember = members.find((member) => member.featured) ?? members[0]!;
  const [localSelectedId, setLocalSelectedId] = useState(initialMember.id);
  const selectedId = controlledSelectedId ?? localSelectedId;
  const setSelectedId = (nextId: string) => {
    setLocalSelectedId(nextId);
    onSelectedIdChange?.(nextId);
  };
  const selectedMember = members.find((member) => member.id === selectedId) ?? initialMember;
  const motionOff = reducedMotion || motionDisabled;
  const interactive = active
    && !motionDisabled
    && (controlledSelectedId === undefined || onSelectedIdChange !== undefined);
  const summary = members.map((member) => [member.name, member.role, member.studentId].filter(Boolean).join(", ")).join("; ");
  const detailMotion = resolveSemanticMotion({
    active,
    motionOff,
    hidden: { opacity: 0, x: 18, filter: "blur(6px)" },
    shown: { opacity: 1, x: 0, filter: "blur(0px)" },
    duration: 0.32,
    delay: 0.08
  });

  if (variant === "profile") {
    return (
      <TeamProfileShowcase
        {...(title ? { title } : {})}
        {...(subtitle ? { subtitle } : {})}
        {...(project ? { project } : {})}
        member={selectedMember}
        assets={assets}
        motionOff={motionOff}
        motionDisabled={motionDisabled}
        active={active}
        summary={summary}
      />
    );
  }

  return (
    <section
      className={`team-showcase team-showcase--${variant}`}
      data-deck-interactive
      data-motion-off={motionOff ? "true" : "false"}
      data-static={motionDisabled ? "true" : "false"}
      data-active={active ? "true" : "false"}
      aria-label={`${title ?? "Đội ngũ"}. ${summary}`}
      onKeyDown={interactive ? (event) => handleInteractiveKeyDown(event, () => setSelectedId(initialMember.id)) : undefined}
    >
      {(title || subtitle || project) && (
        <header className="team-showcase-heading">
          <div>
            {project && <span>{project}</span>}
            {title && <h2>{title}</h2>}
          </div>
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}

      <div className="team-showcase-layout">
        <div className="team-member-list" data-member-count={members.length} role="group" aria-label="Danh sách thành viên">
          {members.map((member, index) => {
            const selected = member.id === selectedMember.id;
            const memberMotion = resolveSemanticMotion({
              active,
              motionOff,
              hidden: { opacity: 0, y: 18, clipPath: "inset(0 0 100% 0)" },
              shown: { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" },
              duration: 0.42,
              delay: Math.min(index * 0.07, 0.28)
            });
            const content = (
              <>
                <MemberAvatar member={member} assets={assets} decorative={false} />
                <span className="team-member-copy">
                  <strong>{member.name}</strong>
                  {member.role && <span>{member.role}</span>}
                  {member.studentId && <small>{member.studentId}</small>}
                </span>
                {member.featured && <i>Lead</i>}
              </>
            );

            return interactive ? (
              <motion.button
                type="button"
                className={`team-member team-member--${member.accent ?? "neutral"} ${selected ? "is-selected" : ""}`}
                key={member.id}
                aria-pressed={selected}
                aria-controls={detailId}
                aria-label={`Xem thông tin ${member.name}${member.role ? `, ${member.role}` : ""}`}
                onClick={() => setSelectedId(member.id)}
                initial={memberMotion.initial}
                animate={memberMotion.animate}
                transition={memberMotion.transition}
              >
                {content}
              </motion.button>
            ) : (
              <motion.div
                className={`team-member team-member--${member.accent ?? "neutral"} ${selected ? "is-selected" : ""}`}
                key={member.id}
                initial={memberMotion.initial}
                animate={memberMotion.animate}
                transition={memberMotion.transition}
              >
                {content}
              </motion.div>
            );
          })}
        </div>

        <motion.aside
          className={`team-member-detail team-member-detail--${selectedMember.accent ?? "neutral"}`}
          id={detailId}
          key={selectedMember.id}
          aria-live="polite"
          initial={detailMotion.initial}
          animate={detailMotion.animate}
          transition={detailMotion.transition}
        >
          <div className="team-member-detail-identity">
            <MemberAvatar member={selectedMember} assets={assets} decorative />
            <div>
              <span>{selectedMember.role ?? "Thành viên dự án"}</span>
              <h3>{selectedMember.name}</h3>
              {selectedMember.studentId && <small>MSSV · {selectedMember.studentId}</small>}
            </div>
          </div>
          {selectedMember.summary && <p className="team-member-summary">{selectedMember.summary}</p>}
          {selectedMember.skills && selectedMember.skills.length > 0 && (
            <div className="team-member-skills" aria-label="Kỹ năng">
              {selectedMember.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          )}
          {selectedMember.contributions && selectedMember.contributions.length > 0 && (
            <ul className="team-member-contributions">
              {selectedMember.contributions.map((contribution) => <li key={contribution}>{contribution}</li>)}
            </ul>
          )}
          {selectedMember.links && selectedMember.links.length > 0 && (
            <div className="team-member-links" aria-label={`Liên kết của ${selectedMember.name}`}>
              {selectedMember.links.map((link) => {
                const LinkIcon = resolveLinkIcon(link.label, link.href);
                if (!interactive) {
                  return (
                    <span key={`${link.label}-${link.href}`}>
                      <LinkIcon size={14} aria-hidden="true" />
                      <span>{link.label}</span>
                    </span>
                  );
                }
                return (
                  <a key={`${link.label}-${link.href}`} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>
                    <LinkIcon size={14} aria-hidden="true" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </motion.aside>
      </div>
      <span className="sr-only">{summary}</span>
    </section>
  );
}

function TeamProfileShowcase({
  title,
  subtitle,
  project,
  member,
  assets,
  motionOff,
  motionDisabled,
  active,
  summary
}: {
  title?: string;
  subtitle?: string;
  project?: string;
  member: TeamMember;
  assets: readonly DeckAsset[] | undefined;
  motionOff: boolean;
  motionDisabled: boolean;
  active: boolean;
  summary: string;
}) {
  const interactive = active && !motionDisabled;
  const mediaMotion = resolveSemanticMotion({
    active,
    motionOff,
    hidden: { opacity: 0, x: -18, clipPath: "inset(0 100% 0 0)" },
    shown: { opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" },
    duration: 0.46
  });
  const contentMotion = resolveSemanticMotion({
    active,
    motionOff,
    hidden: { opacity: 0, x: 20, filter: "blur(6px)" },
    shown: { opacity: 1, x: 0, filter: "blur(0px)" },
    duration: 0.38,
    delay: 0.08
  });
  return (
    <section
      className="team-showcase team-showcase--profile"
      data-deck-interactive
      data-motion-off={motionOff ? "true" : "false"}
      data-static={motionDisabled ? "true" : "false"}
      data-active={active ? "true" : "false"}
      data-has-heading={title || subtitle ? "true" : "false"}
      aria-label={`${title ?? "Hồ sơ thành viên"}. ${summary}`}
    >
      {(title || subtitle) && (
        <header className="team-showcase-heading">
          <div>
            {project && <span>{project}</span>}
            {title && <h2>{title}</h2>}
          </div>
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}
      <div className="team-profile-layout">
        <motion.div
          className={`team-profile-media team-profile-media--${member.accent ?? "neutral"}`}
          initial={mediaMotion.initial}
          animate={mediaMotion.animate}
          transition={mediaMotion.transition}
        >
          <MemberAvatar member={member} assets={assets} decorative={false} />
          <div className="team-profile-media-caption">
            <span>{project ?? "Team profile"}</span>
            <strong>{member.role ?? "Thành viên dự án"}</strong>
          </div>
        </motion.div>
        <motion.article
          className={`team-profile-content team-profile-content--${member.accent ?? "neutral"}`}
          initial={contentMotion.initial}
          animate={contentMotion.animate}
          transition={contentMotion.transition}
        >
          <div className="team-profile-identity">
            <span>{member.role ?? "Thành viên dự án"}</span>
            <h3>{member.name}</h3>
            {member.studentId && <small>MSSV · {member.studentId}</small>}
          </div>
          {member.summary && <p className="team-member-summary">{member.summary}</p>}
          {member.skills && member.skills.length > 0 && (
            <div className="team-member-skills" aria-label="Kỹ năng">
              {member.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          )}
          {member.contributions && member.contributions.length > 0 && (
            <ul className="team-member-contributions">
              {member.contributions.map((contribution) => <li key={contribution}>{contribution}</li>)}
            </ul>
          )}
          {member.links && member.links.length > 0 && (
            <div className="team-member-links" aria-label={`Liên kết của ${member.name}`}>
              {member.links.map((link) => {
                const LinkIcon = resolveLinkIcon(link.label, link.href);
                if (!interactive) {
                  return <span key={`${link.label}-${link.href}`}><LinkIcon size={14} aria-hidden="true" /><span>{link.label}</span></span>;
                }
                return <a key={`${link.label}-${link.href}`} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}><LinkIcon size={14} aria-hidden="true" /><span>{link.label}</span></a>;
              })}
            </div>
          )}
        </motion.article>
      </div>
      <span className="sr-only">{summary}</span>
    </section>
  );
}

function MemberAvatar({
  member,
  assets,
  decorative
}: {
  member: TeamMember;
  assets: readonly DeckAsset[] | undefined;
  decorative: boolean;
}) {
  const source = resolveTeamImageSource(assets, member.image);
  if (member.image && source) {
    return (
      <span className="team-member-avatar" data-image-position={member.image.position ?? "center"} data-qa-allow-clip>
        <img src={source} alt={decorative ? "" : member.image.alt} aria-hidden={decorative || undefined} />
      </span>
    );
  }

  return (
    <span className="team-member-avatar team-member-avatar--monogram" aria-hidden={decorative || undefined} data-qa-allow-clip>
      {initials(member.name)}
    </span>
  );
}

export function SemanticVisualizer({
  title,
  summary,
  center,
  variant,
  interaction = "inspect",
  animation = "draw",
  items,
  reducedMotion,
  motionDisabled,
  active,
  selectedId: controlledSelectedId,
  onSelectedIdChange
}: VisualizerProps & VisualMotionContext) {
  const detailId = useId();
  const positions = useMemo(() => createPositions(variant, items.length), [items.length, variant]);
  const initialIndex = Math.max(0, items.findIndex((item) => item.featured));
  const [localSelectedId, setLocalSelectedId] = useState(items[initialIndex]?.id ?? items[0]!.id);
  const selectedId = controlledSelectedId ?? localSelectedId;
  const setSelectedId = (nextId: string) => {
    setLocalSelectedId(nextId);
    onSelectedIdChange?.(nextId);
  };
  const selectedIndex = Math.max(0, items.findIndex((item) => item.id === selectedId));
  const selectedItem = items[selectedIndex] ?? items[0]!;
  const motionOff = reducedMotion || motionDisabled || animation === "none";
  const interactive = active
    && !motionDisabled
    && interaction !== "none"
    && (controlledSelectedId === undefined || onSelectedIdChange !== undefined);
  const accessibleSummary = items.map((item) => `${item.label}${item.value ? `: ${item.value}` : ""}${item.description ? `. ${item.description}` : ""}`).join("; ");
  const edges = createEdges(items, positions, variant);
  const trunkMotion = getVisualizerMotion(animation, "path", { active, motionOff, trunk: true });
  const centerMotion = getVisualizerMotion(animation, "center", { active, motionOff });
  const detailMotion = getVisualizerMotion(animation, "detail", { active, motionOff });

  const selectStep = (nextIndex: number) => {
    const normalized = (nextIndex + items.length) % items.length;
    setSelectedId(items[normalized]!.id);
  };

  return (
    <section
      className={`visualizer visualizer--${variant} semantic-visualizer semantic-visualizer--${variant}`}
      data-deck-interactive
      data-animation={animation}
      data-interaction={interaction}
      data-motion-off={motionOff ? "true" : "false"}
      data-static={motionDisabled ? "true" : "false"}
      data-active={active ? "true" : "false"}
      aria-label={`${title ?? "Visual hóa"}. ${accessibleSummary}`}
      onKeyDown={interactive ? (event) => {
        const key = event.key;
        if (interaction === "step" && (key === "ArrowRight" || key === "ArrowDown")) {
          event.preventDefault();
          event.stopPropagation();
          selectStep(selectedIndex + 1);
        } else if (interaction === "step" && (key === "ArrowLeft" || key === "ArrowUp")) {
          event.preventDefault();
          event.stopPropagation();
          selectStep(selectedIndex - 1);
        } else {
          handleInteractiveKeyDown(event, () => setSelectedId(items[initialIndex]?.id ?? items[0]!.id));
        }
      } : undefined}
    >
      {(title || summary) && (
        <header className="semantic-visualizer-heading">
          {title && <h2>{title}</h2>}
          {summary && <p>{summary}</p>}
        </header>
      )}

      <div className="semantic-visualizer-layout">
        <div className="visual-canvas" data-qa-allow-clip>
          <svg className="visual-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {variant === "growth-tree" && (
              <motion.path
                className="visual-trunk"
                d="M50 98 C50 82 48 71 50 58 C52 44 50 30 50 12"
                initial={trunkMotion.initial}
                animate={trunkMotion.animate}
                transition={trunkMotion.transition}
              />
            )}
            {edges.map((edge, index) => {
              const edgeMotion = getVisualizerMotion(animation, "path", { active, motionOff, index });
              return (
                <motion.path
                  className="visual-edge"
                  key={edge.id}
                  d={edge.path}
                  initial={edgeMotion.initial}
                  animate={edgeMotion.animate}
                  transition={edgeMotion.transition}
                />
              );
            })}
          </svg>

          {center && (
            <motion.div
              className="visual-center"
              initial={centerMotion.initial}
              animate={centerMotion.animate}
              transition={centerMotion.transition}
            >
              {variant === "orbit" ? <Orbit size={20} /> : variant === "network" ? <Network size={20} /> : <Leaf size={20} />}
              <span>{center}</span>
            </motion.div>
          )}

          {items.map((item, index) => {
            const position = positions[index]!;
            const selected = item.id === selectedItem.id;
            const ItemIcon = visualIcons[item.icon ?? defaultIconForVariant(variant)];
            const style = { "--visual-x": `${position.x}%`, "--visual-y": `${position.y}%` } as MotionStyle;
            const nodeMotion = getVisualizerMotion(animation, "node", { active, motionOff, index });
            const pulse = shouldPulseVisualizerNode(animation, active, motionOff, selected);
            return (
              <motion.div
                role={interactive ? "button" : undefined}
                className={`visual-node visualizer-node visual-node--${item.tone ?? "neutral"} ${selected ? "is-selected" : ""} ${pulse ? "is-pulse-target" : ""}`}
                key={item.id}
                data-parent-id={item.parentId}
                style={style}
                aria-pressed={interactive ? selected : undefined}
                aria-controls={interactive ? detailId : undefined}
                aria-label={`Xem ${item.label}${item.value ? `, ${item.value}` : ""}`}
                tabIndex={interactive ? 0 : -1}
                onClick={interactive ? () => setSelectedId(item.id) : undefined}
                onKeyDown={interactive ? (event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  setSelectedId(item.id);
                } : undefined}
                initial={nodeMotion.initial}
                animate={nodeMotion.animate}
                transition={nodeMotion.transition}
              >
                <span><ItemIcon size={17} aria-hidden="true" /></span>
                <strong>{item.label}</strong>
                {item.value && <small>{item.value}</small>}
              </motion.div>
            );
          })}
        </div>

        <motion.aside
          className={`visual-detail visual-detail--${selectedItem.tone ?? "neutral"}`}
          id={detailId}
          key={selectedItem.id}
          aria-live="polite"
          initial={detailMotion.initial}
          animate={detailMotion.animate}
          transition={detailMotion.transition}
        >
          <span>{String(selectedIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
          {selectedItem.value && <strong>{selectedItem.value}</strong>}
          <h3>{selectedItem.label}</h3>
          {selectedItem.description && <p>{selectedItem.description}</p>}
          {interaction === "step" && interactive && (
            <div className="visual-step-controls" aria-label="Điều hướng các bước">
              <button type="button" onClick={() => selectStep(selectedIndex - 1)} aria-label="Bước trước"><ArrowLeft size={16} /></button>
              <button type="button" onClick={() => selectStep(selectedIndex + 1)} aria-label="Bước tiếp theo"><ArrowRight size={16} /></button>
            </div>
          )}
        </motion.aside>
      </div>
      <span className="sr-only">{accessibleSummary}</span>
    </section>
  );
}

function handleInteractiveKeyDown(event: KeyboardEvent<HTMLElement>, reset: () => void) {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) {
    event.stopPropagation();
  }
  if (event.key === "Escape") {
    event.stopPropagation();
    reset();
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

function resolveLinkIcon(label: string, href: string) {
  const normalized = `${label} ${href}`.toLowerCase();
  if (normalized.includes("github")) return Code2;
  if (normalized.includes("linkedin")) return UsersRound;
  if (href.startsWith("mailto:")) return Mail;
  return ExternalLink;
}

const visualIcons = {
  seed: Sprout,
  leaf: Leaf,
  data: Database,
  system: Layers3,
  people: UsersRound,
  sparkle: Sparkles,
  code: Code2
} as const;

function defaultIconForVariant(variant: VisualizerProps["variant"]): keyof typeof visualIcons {
  if (variant === "growth-tree") return "leaf";
  if (variant === "network") return "system";
  if (variant === "orbit") return "sparkle";
  return "data";
}

function createPositions(variant: VisualizerProps["variant"], count: number): Point[] {
  if (variant === "growth-tree") {
    const positions: Point[] = [
      { x: 50, y: 76 },
      { x: 35, y: 62 },
      { x: 65, y: 62 },
      { x: 22, y: 43 },
      { x: 42, y: 42 },
      { x: 59, y: 39 },
      { x: 78, y: 44 },
      { x: 50, y: 24 }
    ];
    return positions.slice(0, count);
  }

  if (variant === "timeline-path") {
    return Array.from({ length: count }, (_, index) => ({
      x: count === 1 ? 50 : 16 + (index / (count - 1)) * 68,
      y: index % 2 === 0 ? 39 : 63
    }));
  }

  if (variant === "orbit") {
    return Array.from({ length: count }, (_, index) => {
      const angle = (-Math.PI / 2) + (index / count) * Math.PI * 2;
      return { x: 50 + Math.cos(angle) * 36, y: 50 + Math.sin(angle) * 32 };
    });
  }

  const networkPositions: Point[] = [
    { x: 18, y: 28 },
    { x: 48, y: 18 },
    { x: 78, y: 30 },
    { x: 30, y: 55 },
    { x: 66, y: 56 },
    { x: 16, y: 78 },
    { x: 50, y: 82 },
    { x: 82, y: 76 }
  ];
  return networkPositions.slice(0, count);
}

function createEdges(items: VisualizerItem[], positions: Point[], variant: VisualizerProps["variant"]): Array<{ id: string; path: string }> {
  const byId = new Map(items.map((item, index) => [item.id, positions[index]!]));
  const edges: Array<{ id: string; path: string }> = [];

  items.forEach((item, index) => {
    const to = positions[index]!;
    let from: Point | undefined;

    if (item.parentId) from = byId.get(item.parentId);
    else if (variant === "orbit") from = { x: 50, y: 50 };
    else if (index > 0) from = positions[index - 1];
    else if (variant === "growth-tree") from = { x: 50, y: 98 };

    if (!from) return;
    const curveX = (from.x + to.x) / 2;
    const path = variant === "timeline-path"
      ? `M ${from.x} ${from.y} C ${curveX} ${from.y}, ${curveX} ${to.y}, ${to.x} ${to.y}`
      : `M ${from.x} ${from.y} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y}`;
    edges.push({ id: `${item.id}-${index}`, path });
  });

  return edges;
}
