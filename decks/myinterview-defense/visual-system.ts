import type {
  BackgroundStack,
  DeckThemeV2,
  ElementStyle,
  Frame,
  SceneElement,
  SceneSlide
} from "@deckory/schema";
import type {
  MyInterviewCriterion,
  MyInterviewLayer,
  MyInterviewMediaItem,
  MyInterviewPanel,
  MyInterviewSlideSpec,
  MyInterviewStatus,
  MyInterviewStep,
  MyInterviewTone
} from "./content";

export const myInterviewVisualSystem: DeckThemeV2 = {
  id: "myinterview-defense",
  tokens: {
    visualWorld: "institutional-editorial-tech",
    canvas: "#f4f1ea",
    surface: "#ffffff",
    ink: "#101827",
    muted: "#536172",
    cobalt: "#3156d9",
    teal: "#0f8f82",
    amber: "#f36f21",
    line: "#d8d7d0",
    radius: 18,
    grid: 8,
    typography: {
      ui: "Be Vietnam Pro",
      display: "Be Vietnam Pro",
      data: "Geist Mono"
    }
  }
};

const color = {
  paper: "#f4f1ea",
  paper2: "#ece8df",
  surface: "#ffffff",
  ink: "#101827",
  ink2: "#1e293b",
  muted: "#536172",
  line: "#d8d7d0",
  lineDark: "#364152",
  cobalt: "#3156d9",
  cobaltSoft: "#e9edff",
  teal: "#0f8f82",
  tealSoft: "#e3f4f0",
  amber: "#f36f21",
  amberSoft: "#fff0e6",
  white: "#ffffff",
  whiteSoft: "#dbe3ef"
} as const;

const toneMap: Record<MyInterviewTone, { strong: string; soft: string; text: string }> = {
  ink: { strong: color.ink, soft: "#e9edf2", text: color.ink },
  cobalt: { strong: color.cobalt, soft: color.cobaltSoft, text: "#233ea5" },
  teal: { strong: color.teal, soft: color.tealSoft, text: "#096b63" },
  amber: { strong: color.amber, soft: color.amberSoft, text: "#a6410f" },
  paper: { strong: "#81796d", soft: color.paper2, text: color.ink }
};

function shape(
  id: string,
  name: string,
  frame: Frame,
  options: { fill: string; stroke?: string; strokeWidth?: number; radius?: number; zIndex?: number; shadow?: boolean; opacity?: number }
): SceneElement {
  return {
    id,
    name,
    kind: "shape",
    frame,
    zIndex: options.zIndex ?? 1,
    ...(options.opacity === undefined ? {} : { opacity: options.opacity }),
    content: { shape: "rectangle" },
    style: {
      fill: options.fill,
      ...(options.stroke ? { stroke: options.stroke } : {}),
      ...(options.strokeWidth === undefined ? {} : { strokeWidth: options.strokeWidth }),
      borderRadius: options.radius ?? 18,
      ...(options.shadow ? { shadow: { x: 0, y: 18, blur: 48, spread: 0, color: "rgba(16,24,39,.16)" } } : {})
    },
    accessibility: { decorative: true }
  };
}

function text(
  id: string,
  name: string,
  value: string,
  frame: Frame,
  options: ElementStyle & { order?: number; zIndex?: number; label?: string }
): SceneElement {
  const { order, zIndex, label, ...style } = options;
  return {
    id,
    name,
    kind: "text",
    frame,
    zIndex: zIndex ?? 4,
    content: { text: value },
    style,
    accessibility: {
      label: label ?? value.slice(0, 500),
      ...(order === undefined ? {} : { readingOrder: order })
    }
  };
}

function image(
  id: string,
  name: string,
  assetId: string,
  alt: string,
  frame: Frame,
  options: { fit?: "contain" | "cover"; focalY?: number; radius?: number; zIndex?: number }
): SceneElement {
  return {
    id,
    name,
    kind: "image",
    frame,
    zIndex: options.zIndex ?? 3,
    content: { assetId, alt },
    style: {
      objectFit: options.fit ?? "cover",
      focalPoint: { x: 0.5, y: options.focalY ?? 0.5 },
      borderRadius: options.radius ?? 18
    },
    accessibility: { label: alt }
  };
}

function line(id: string, frame: Frame, stroke: string, zIndex = 2): SceneElement {
  const safeFrame = { ...frame, height: Math.max(1, frame.height) };
  return {
    id,
    name: `${id} line`,
    kind: "line",
    frame: safeFrame,
    zIndex,
    content: { x2: safeFrame.width, y2: frame.height <= 1 ? 0 : safeFrame.height },
    style: { color: stroke, strokeWidth: 2 },
    accessibility: { decorative: true }
  };
}

function footer(spec: MyInterviewSlideSpec, dark: boolean): SceneElement {
  return {
    id: "evidence-footer",
    name: "Evidence footer",
    kind: "evidence-footer",
    frame: { x: 72, y: 668, width: 1136, height: 28 },
    zIndex: 20,
    content: {
      source: `${spec.source} · ${spec.section === "appendix" ? "phụ lục" : "graduation defense"}`,
      page: spec.page,
      brandLabel: "FPT Polytechnic Đồng Nai · Cơ sở 2"
    },
    style: {
      color: dark ? "#cbd5e1" : color.muted,
      fontSize: 11,
      fontWeight: 560,
      letterSpacing: 0.15
    },
    accessibility: { label: `Nguồn: ${spec.source}. Trang ${spec.page}.`, readingOrder: 99 }
  };
}

function backgroundFor(spec: MyInterviewSlideSpec, index: number): BackgroundStack {
  const dark = spec.kind === "cover" || spec.kind === "closing" || spec.section === "demo";
  if (dark) {
    return {
      layers: [
        { id: "base", type: "solid", color: color.ink, opacity: 1 },
        { id: "cobalt-glow", type: "glow", color: "rgba(49,86,217,.52)", opacity: 0.34, blur: 36, position: { x: 78, y: 20 } },
        { id: "teal-glow", type: "glow", color: "rgba(15,143,130,.42)", opacity: 0.26, blur: 42, position: { x: 14, y: 88 } },
        { id: "vignette", type: "vignette", color: "rgba(3,7,18,.52)", opacity: 0.5 },
        { id: "grain", type: "noise", opacity: 0.035, seed: 1300 + index, scale: 2.4 }
      ]
    };
  }
  const accent = spec.section === "team"
    ? index % 2 === 0 ? color.cobalt : color.teal
    : spec.section === "problem"
      ? color.amber
      : spec.section === "solution" || spec.section === "decision"
        ? color.teal
        : spec.section === "appendix"
          ? color.cobalt
          : color.cobalt;
  return {
    layers: [
      { id: "base", type: "solid", color: color.paper, opacity: 1 },
      { id: "grid", type: "grid", color: "rgba(16,24,39,.055)", opacity: spec.section === "appendix" || spec.kind === "architecture" ? 0.7 : 0.25, data: { size: 32 } },
      { id: "accent-glow", type: "glow", color: accent, opacity: 0.18, blur: 34, position: { x: index % 2 === 0 ? 88 : 12, y: 8 } },
      { id: "accent-overlay", type: "radial-gradient", colors: [`color-mix(in srgb, ${accent} 16%, transparent)`, "transparent"], opacity: 0.28, position: { x: index % 2 === 0 ? 92 : 8, y: 12 } },
      { id: "grain", type: "noise", opacity: 0.022, seed: 2200 + index, scale: 3 }
    ]
  };
}

function titleSize(value: string, width: number): number {
  const estimatedLines = Math.ceil((value.length * 0.56 * 44) / Math.max(1, width));
  if (value.length > 90 || estimatedLines > 3) return 30;
  if (value.length > 72 || estimatedLines > 2) return 35;
  if (value.length > 50) return 42;
  return 48;
}

function heading(spec: MyInterviewSlideSpec, dark: boolean): SceneElement[] {
  const descriptionColumn = Boolean(spec.description) && spec.kind !== "profile";
  const titleWidth = descriptionColumn ? 770 : 1080;
  return [
    text("eyebrow", "Eyebrow", spec.eyebrow, { x: 72, y: 46, width: 760, height: 25 }, {
      color: dark ? "#9ee7dc" : toneMap[spec.section === "problem" ? "amber" : "teal"].strong,
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: 1.25,
      lineHeight: 1.2,
      order: 1
    }),
    text("title", "Slide title", spec.title, { x: 72, y: 78, width: titleWidth, height: 120 }, {
      color: dark ? color.white : color.ink,
      fontSize: titleSize(spec.title, titleWidth),
      fontWeight: 790,
      lineHeight: 1.08,
      letterSpacing: -0.8,
      order: 2
    }),
    ...(descriptionColumn && spec.description ? [
      text("description", "Slide description", spec.description, { x: 884, y: 76, width: 324, height: 104 }, {
        color: dark ? color.whiteSoft : color.muted,
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.45,
        order: 3
      })
    ] : [])
  ];
}

function bulletElements(prefix: string, points: readonly string[], frame: Frame, tone: MyInterviewTone, order: number): SceneElement[] {
  const rowHeight = Math.min(62, frame.height / Math.max(1, points.length));
  return points.flatMap((point, index) => {
    const y = frame.y + index * rowHeight;
    return [
      shape(`${prefix}-bullet-${index + 1}`, `${prefix} bullet ${index + 1}`, { x: frame.x, y: y + 7, width: 22, height: 22 }, {
        fill: toneMap[tone].soft,
        stroke: toneMap[tone].strong,
        strokeWidth: 1,
        radius: 11,
        zIndex: 4
      }),
      text(`${prefix}-bullet-mark-${index + 1}`, `${prefix} bullet mark ${index + 1}`, "✓", { x: frame.x + 5, y: y + 8, width: 13, height: 18 }, {
        color: toneMap[tone].strong,
        fontSize: 12,
        fontWeight: 900,
        textAlign: "center",
        zIndex: 5,
        label: `Điểm ${index + 1}`
      }),
      text(`${prefix}-point-${index + 1}`, `${prefix} point ${index + 1}`, point, { x: frame.x + 34, y, width: frame.width - 34, height: rowHeight - 4 }, {
        color: color.ink2,
        fontSize: 17,
        fontWeight: 560,
        lineHeight: 1.35,
        order: order + index,
        zIndex: 5
      })
    ];
  });
}

function panelElements(prefix: string, panel: MyInterviewPanel, frame: Frame, order: number): SceneElement[] {
  return [
    shape(`${prefix}-surface`, `${panel.title} surface`, frame, {
      fill: color.surface,
      stroke: toneMap[panel.tone].strong,
      strokeWidth: panel.tone === "ink" ? 1 : 2,
      radius: 22,
      shadow: panel.tone !== "ink"
    }),
    shape(`${prefix}-rail`, `${panel.title} accent`, { x: frame.x, y: frame.y, width: 10, height: frame.height }, {
      fill: toneMap[panel.tone].strong,
      radius: 6,
      zIndex: 2
    }),
    text(`${prefix}-eyebrow`, `${panel.title} eyebrow`, panel.eyebrow, { x: frame.x + 34, y: frame.y + 28, width: frame.width - 68, height: 22 }, {
      color: toneMap[panel.tone].strong,
      fontSize: 12,
      fontWeight: 820,
      letterSpacing: 1.1,
      order,
      zIndex: 4
    }),
    text(`${prefix}-title`, `${panel.title} title`, panel.title, { x: frame.x + 34, y: frame.y + 62, width: frame.width - 68, height: 72 }, {
      color: color.ink,
      fontSize: panel.title.length > 30 ? 27 : 31,
      fontWeight: 760,
      lineHeight: 1.15,
      order: order + 1,
      zIndex: 4
    }),
    ...bulletElements(prefix, panel.points, { x: frame.x + 34, y: frame.y + 150, width: frame.width - 68, height: frame.height - 178 }, panel.tone, order + 2)
  ];
}

function buildCover(spec: Extract<MyInterviewSlideSpec, { kind: "cover" }>): SceneElement[] {
  return [
    shape("cover-kicker", "Cover kicker surface", { x: 72, y: 54, width: 580, height: 36 }, { fill: "rgba(255,255,255,.08)", stroke: "rgba(255,255,255,.16)", strokeWidth: 1, radius: 18 }),
    text("cover-eyebrow", "Cover eyebrow", spec.eyebrow, { x: 92, y: 62, width: 540, height: 20 }, {
      color: "#bdeee7", fontSize: 12, fontWeight: 820, letterSpacing: 1.1, order: 1, zIndex: 5
    }),
    text("cover-title", "Cover title", spec.title, { x: 72, y: 126, width: 740, height: 102 }, {
      color: color.white, fontSize: 56, fontWeight: 820, lineHeight: 1, letterSpacing: -1.4, order: 2
    }),
    text("cover-brand", "Product name", "MyInterview", { x: 72, y: 230, width: 650, height: 78 }, {
      color: color.amber, fontSize: 58, fontWeight: 760, lineHeight: 1, letterSpacing: -1.2, order: 3
    }),
    text("cover-description", "Cover description", spec.description ?? "", { x: 72, y: 330, width: 620, height: 96 }, {
      color: color.whiteSoft, fontSize: 20, fontWeight: 500, lineHeight: 1.5, order: 4
    }),
    shape("cover-statement-surface", "Cover statement surface", { x: 72, y: 472, width: 620, height: 112 }, {
      fill: "rgba(255,255,255,.07)", stroke: "rgba(255,255,255,.16)", strokeWidth: 1, radius: 20
    }),
    text("cover-statement", "Cover statement", spec.statement, { x: 98, y: 496, width: 568, height: 68 }, {
      color: color.white, fontSize: 20, fontWeight: 620, lineHeight: 1.45, order: 5
    }),
    shape("cover-visual-surface", "Product visual surface", { x: 812, y: 116, width: 396, height: 452 }, {
      fill: "rgba(255,255,255,.96)", stroke: "rgba(255,255,255,.4)", strokeWidth: 1, radius: 26, shadow: true
    }),
    image("cover-product", "MyInterview product visual", "product-dashboard", "Bảng điều khiển MyInterview", { x: 832, y: 138, width: 356, height: 306 }, { fit: "cover", radius: 17 }),
    text("cover-proof-label", "Cover proof label", "GRADUATION CORE", { x: 836, y: 466, width: 178, height: 24 }, {
      color: color.cobalt, fontSize: 11, fontWeight: 840, letterSpacing: 1.2, order: 6
    }),
    text("cover-proof-copy", "Cover proof copy", "CV → JD → Interview → Evidence → Retry", { x: 836, y: 500, width: 330, height: 42 }, {
      color: color.ink, fontSize: 17, fontWeight: 700, lineHeight: 1.25, order: 7
    }),
    image("cover-logo", "FPT Polytechnic logo", "fpt-polytechnic-logo", "Logo FPT Polytechnic", { x: 925, y: 34, width: 283, height: 66 }, { fit: "contain", radius: 0, zIndex: 5 })
  ];
}

function buildProfile(spec: Extract<MyInterviewSlideSpec, { kind: "profile" }>, slideIndex: number): SceneElement[] {
  const member = spec.member;
  const tone = toneMap[member.tone];
  const mirrored = slideIndex % 2 === 0;
  const portraitX = mirrored ? 852 : 72;
  const profileX = mirrored ? 72 : 458;
  const contentX = profileX + 34;
  const elements: SceneElement[] = [
    ...heading(spec, false),
    shape("portrait-surface", "Portrait surface", { x: portraitX, y: 205, width: 356, height: 420 }, { fill: color.surface, stroke: color.line, strokeWidth: 1, radius: 24, shadow: true }),
    image("portrait", `Ảnh ${member.name}`, member.assetId, `Ảnh thành viên ${member.name}`, { x: portraitX + 16, y: 221, width: 324, height: 324 }, { fit: "cover", focalY: 0.24, radius: 17 }),
    shape("member-id-surface", "Student ID surface", { x: portraitX + 24, y: 564, width: 148, height: 38 }, { fill: tone.soft, stroke: tone.strong, strokeWidth: 1, radius: 19, zIndex: 4 }),
    text("member-id", "Student ID", member.studentId, { x: portraitX + 40, y: 574, width: 116, height: 20 }, { color: tone.text, fontSize: 13, fontWeight: 800, letterSpacing: 0.8, order: 4, zIndex: 5 }),
    text("member-project", "Project label", "NEXUS · MYINTERVIEW", { x: portraitX + 172, y: 574, width: 160, height: 20 }, { color: color.muted, fontSize: 10, fontWeight: 760, letterSpacing: 0.55, textAlign: "right", order: 5 }),
    shape("profile-surface", "Profile surface", { x: profileX, y: 205, width: 750, height: 420 }, { fill: "rgba(255,255,255,.84)", stroke: color.line, strokeWidth: 1, radius: 24 }),
    text("profile-role", "Member role", member.role, { x: contentX, y: 236, width: 680, height: 32 }, { color: tone.strong, fontSize: 15, fontWeight: 820, letterSpacing: 0.4, order: 6 }),
    text("profile-summary", "Member summary", member.summary, { x: contentX, y: 284, width: 680, height: 76 }, { color: color.ink, fontSize: 22, fontWeight: 650, lineHeight: 1.4, order: 7 }),
    text("skills-label", "Skills label", "NĂNG LỰC CHÍNH", { x: contentX, y: 386, width: 190, height: 20 }, { color: color.muted, fontSize: 11, fontWeight: 820, letterSpacing: 1.1, order: 8 })
  ];
  member.skills.forEach((skill, index) => {
    const width = Math.max(126, skill.length * 9 + 34);
    const x = contentX + member.skills.slice(0, index).reduce((sum, item) => sum + Math.max(126, item.length * 9 + 34) + 10, 0);
    elements.push(
      shape(`skill-${index + 1}-surface`, `${skill} surface`, { x, y: 418, width, height: 38 }, { fill: tone.soft, stroke: tone.strong, strokeWidth: 1, radius: 19, zIndex: 3 }),
      text(`skill-${index + 1}`, `Skill ${skill}`, skill, { x: x + 14, y: 428, width: width - 28, height: 18 }, { color: tone.text, fontSize: 12, fontWeight: 720, textAlign: "center", order: 9 + index, zIndex: 5 })
    );
  });
  elements.push(text("contribution-label", "Contribution label", "ĐÓNG GÓP TIÊU BIỂU", { x: contentX, y: 482, width: 220, height: 20 }, { color: color.muted, fontSize: 11, fontWeight: 820, letterSpacing: 1.1, order: 13 }));
  member.contributions.forEach((contribution, index) => {
    const frame = { x: contentX + index * 224, y: 518, width: 210, height: 78 };
    elements.push(
      shape(`contribution-${index + 1}-surface`, `Contribution ${index + 1} surface`, frame, { fill: index === 0 ? tone.soft : color.surface, stroke: index === 0 ? tone.strong : color.line, strokeWidth: 1, radius: 15, zIndex: 2 }),
      text(`contribution-${index + 1}`, `Contribution ${index + 1}`, contribution, { x: frame.x + 14, y: frame.y + 12, width: frame.width - 28, height: frame.height - 24 }, { color: color.ink2, fontSize: 13, fontWeight: 620, lineHeight: 1.35, order: 14 + index, zIndex: 5 })
    );
  });
  return elements;
}

function mediaCard(prefix: string, item: MyInterviewMediaItem, frame: Frame, order: number): SceneElement[] {
  const featured = item.featured ?? false;
  return [
    shape(`${prefix}-surface`, `${item.title} surface`, frame, { fill: color.surface, stroke: featured ? color.teal : color.line, strokeWidth: featured ? 2 : 1, radius: 20, shadow: featured }),
    image(`${prefix}-image`, item.title, item.assetId, item.title, { x: frame.x + 14, y: frame.y + 14, width: frame.width - 28, height: frame.height * 0.61 }, { fit: "cover", radius: 13 }),
    text(`${prefix}-eyebrow`, `${item.title} eyebrow`, item.eyebrow, { x: frame.x + 18, y: frame.y + frame.height * 0.66, width: frame.width - 36, height: 20 }, { color: featured ? color.teal : color.cobalt, fontSize: 10, fontWeight: 840, letterSpacing: 1, order, zIndex: 5 }),
    text(`${prefix}-title`, `${item.title} title`, item.title, { x: frame.x + 18, y: frame.y + frame.height * 0.71, width: frame.width - 36, height: 52 }, { color: color.ink, fontSize: frame.width < 360 ? 17 : 20, fontWeight: 740, lineHeight: 1.2, order: order + 1, zIndex: 5 }),
    text(`${prefix}-caption`, `${item.title} caption`, item.caption, { x: frame.x + 18, y: frame.y + frame.height * 0.84, width: frame.width - 36, height: frame.height * 0.12 }, { color: color.muted, fontSize: frame.width < 360 ? 12 : 13, fontWeight: 500, lineHeight: 1.35, order: order + 2, zIndex: 5 })
  ];
}

function buildMedia(spec: Extract<MyInterviewSlideSpec, { kind: "media" }>): SceneElement[] {
  const elements = heading(spec, false);
  if (spec.items.length === 1) {
    const item = spec.items[0]!;
    elements.push(
      shape("insight-surface", "Insight surface", { x: 72, y: 224, width: 330, height: 356 }, { fill: color.ink, stroke: color.ink, strokeWidth: 1, radius: 22, shadow: true }),
      text("insight-label", "Insight label", "MOMENT OF TRUTH", { x: 104, y: 256, width: 260, height: 22 }, { color: "#8fe3d7", fontSize: 11, fontWeight: 840, letterSpacing: 1.2, order: 4 }),
      text("insight-copy", "Insight copy", spec.insight ?? item.title, { x: 104, y: 306, width: 266, height: 156 }, { color: color.white, fontSize: 27, fontWeight: 720, lineHeight: 1.25, order: 5 }),
      text("insight-note", "Insight note", item.caption, { x: 104, y: 488, width: 266, height: 62 }, { color: color.whiteSoft, fontSize: 14, fontWeight: 500, lineHeight: 1.45, order: 6 }),
      ...mediaCard("media-1", item, { x: 438, y: 204, width: 770, height: 422 }, 7)
    );
    return elements;
  }
  const count = spec.items.length;
  const gap = 18;
  const width = (1136 - gap * (count - 1)) / count;
  spec.items.forEach((item, index) => elements.push(...mediaCard(`media-${index + 1}`, item, { x: 72 + index * (width + gap), y: 204, width, height: 422 }, 4 + index * 3)));
  return elements;
}

function buildComparison(spec: Extract<MyInterviewSlideSpec, { kind: "comparison" }>): SceneElement[] {
  return [
    ...heading(spec, false),
    ...panelElements("left", spec.left, { x: 72, y: 214, width: 548, height: 408 }, 4),
    line("comparison-arrow-line", { x: 626, y: 417, width: 28, height: 0 }, color.lineDark, 3),
    shape("comparison-arrow", "Comparison arrow", { x: 642, y: 406, width: 24, height: 24 }, { fill: color.ink, radius: 12, zIndex: 4 }),
    text("comparison-arrow-mark", "Comparison direction", "→", { x: 645, y: 407, width: 18, height: 18 }, { color: color.white, fontSize: 14, fontWeight: 800, textAlign: "center", zIndex: 5, label: "Chuyển từ trạng thái trái sang trạng thái phải" }),
    ...panelElements("right", spec.right, { x: 660, y: 214, width: 548, height: 408 }, 10)
  ];
}

function buildArchitecture(spec: Extract<MyInterviewSlideSpec, { kind: "architecture" }>): SceneElement[] {
  const elements = heading(spec, false);
  const count = spec.layers.length;
  const gap = 10;
  const height = (412 - gap * (count - 1)) / count;
  spec.layers.forEach((layer: MyInterviewLayer, index) => {
    const frame = { x: 72, y: 208 + index * (height + gap), width: 1136, height };
    const tone = toneMap[layer.tone];
    elements.push(
      shape(`layer-${index + 1}-surface`, `${layer.label} surface`, frame, { fill: index % 2 === 0 ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.72)", stroke: tone.strong, strokeWidth: 1, radius: 14, zIndex: 1 }),
      shape(`layer-${index + 1}-label-surface`, `${layer.label} label surface`, { x: frame.x, y: frame.y, width: 210, height: frame.height }, { fill: tone.strong, radius: 14, zIndex: 2 }),
      text(`layer-${index + 1}-label`, `${layer.label} label`, layer.label, { x: frame.x + 20, y: frame.y + frame.height / 2 - 11, width: 170, height: 22 }, { color: color.white, fontSize: 12, fontWeight: 830, letterSpacing: 0.7, order: 4 + index * 5, zIndex: 5 })
    );
    const itemWidth = (frame.width - 250 - 12 * (layer.items.length - 1)) / layer.items.length;
    layer.items.forEach((item, itemIndex) => {
      const x = frame.x + 230 + itemIndex * (itemWidth + 12);
      elements.push(
        shape(`layer-${index + 1}-item-${itemIndex + 1}-surface`, `${item} surface`, { x, y: frame.y + 13, width: itemWidth, height: frame.height - 26 }, { fill: tone.soft, stroke: color.line, strokeWidth: 1, radius: 10, zIndex: 3 }),
        text(`layer-${index + 1}-item-${itemIndex + 1}`, `${item} item`, item, { x: x + 8, y: frame.y + frame.height / 2 - 11, width: itemWidth - 16, height: 24 }, { color: color.ink2, fontSize: item.length > 24 ? 11 : 12, fontWeight: 650, textAlign: "center", order: 5 + index * 5 + itemIndex, zIndex: 5 })
      );
    });
  });
  return elements;
}

function criterionCard(prefix: string, criterion: MyInterviewCriterion, frame: Frame, order: number): SceneElement[] {
  const tone = toneMap[criterion.tone];
  return [
    shape(`${prefix}-surface`, `${criterion.label} surface`, frame, { fill: criterion.featured ? tone.strong : color.surface, stroke: tone.strong, strokeWidth: criterion.featured ? 2 : 1, radius: 18, ...(criterion.featured ? { shadow: true } : {}) }),
    text(`${prefix}-index`, `${criterion.label} index`, prefix.split("-").at(-1) ?? "", { x: frame.x + 18, y: frame.y + 16, width: 32, height: 26 }, { color: criterion.featured ? color.white : tone.strong, fontSize: 11, fontWeight: 840, textAlign: "center", order, zIndex: 5 }),
    text(`${prefix}-label`, `${criterion.label} label`, criterion.label, { x: frame.x + 18, y: frame.y + 52, width: frame.width - 36, height: 52 }, { color: criterion.featured ? color.white : color.ink, fontSize: 21, fontWeight: 760, lineHeight: 1.2, order: order + 1, zIndex: 5 }),
    text(`${prefix}-question`, `${criterion.label} question`, criterion.question, { x: frame.x + 18, y: frame.y + 108, width: frame.width - 36, height: 40 }, { color: criterion.featured ? "#eef2ff" : color.muted, fontSize: 13, fontWeight: 520, lineHeight: 1.35, order: order + 2, zIndex: 5 }),
    shape(`${prefix}-output-surface`, `${criterion.label} output surface`, { x: frame.x + 18, y: frame.y + frame.height - 52, width: frame.width - 36, height: 34 }, { fill: criterion.featured ? "rgba(255,255,255,.13)" : tone.soft, radius: 10, zIndex: 3 }),
    text(`${prefix}-output`, `${criterion.label} output`, criterion.output, { x: frame.x + 28, y: frame.y + frame.height - 43, width: frame.width - 56, height: 18 }, { color: criterion.featured ? color.white : tone.text, fontSize: 11, fontWeight: 760, textAlign: "center", order: order + 3, zIndex: 5 })
  ];
}

function buildCriteria(spec: Extract<MyInterviewSlideSpec, { kind: "criteria" }>): SceneElement[] {
  const elements = heading(spec, false);
  const gap = 16;
  const width = (1136 - gap * 2) / 3;
  const height = (420 - gap) / 2;
  spec.criteria.forEach((criterion, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    elements.push(...criterionCard(`criterion-${index + 1}`, criterion, { x: 72 + column * (width + gap), y: 204 + row * (height + gap), width, height }, 4 + index * 4));
  });
  return elements;
}

function statusCard(prefix: string, status: MyInterviewStatus, frame: Frame, order: number): SceneElement[] {
  const tone = toneMap[status.tone];
  return [
    shape(`${prefix}-surface`, `${status.label} surface`, frame, { fill: color.surface, stroke: tone.strong, strokeWidth: 1, radius: 20, shadow: status.tone === "teal" }),
    shape(`${prefix}-status-surface`, `${status.value} surface`, { x: frame.x + 22, y: frame.y + 20, width: Math.min(frame.width - 44, status.value.length * 11 + 44), height: 36 }, { fill: tone.soft, stroke: tone.strong, strokeWidth: 1, radius: 18, zIndex: 3 }),
    text(`${prefix}-status`, `${status.value} status`, status.value, { x: frame.x + 34, y: frame.y + 30, width: Math.min(frame.width - 68, status.value.length * 11 + 20), height: 18 }, { color: tone.text, fontSize: 11, fontWeight: 860, letterSpacing: 0.8, order, zIndex: 5 }),
    text(`${prefix}-label`, `${status.label} label`, status.label, { x: frame.x + 22, y: frame.y + 76, width: frame.width - 44, height: 44 }, { color: color.ink, fontSize: 24, fontWeight: 760, lineHeight: 1.2, order: order + 1, zIndex: 5 }),
    text(`${prefix}-note`, `${status.label} note`, status.note, { x: frame.x + 22, y: frame.y + 132, width: frame.width - 44, height: frame.height - 154 }, { color: color.muted, fontSize: 15, fontWeight: 520, lineHeight: 1.45, order: order + 2, zIndex: 5 })
  ];
}

function buildStatus(spec: Extract<MyInterviewSlideSpec, { kind: "status" }>): SceneElement[] {
  const elements = heading(spec, false);
  const gap = 18;
  const width = (1136 - gap) / 2;
  const height = (418 - gap) / 2;
  spec.statuses.forEach((status, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    elements.push(...statusCard(`status-${index + 1}`, status, { x: 72 + column * (width + gap), y: 206 + row * (height + gap), width, height }, 4 + index * 3));
  });
  return elements;
}

function buildTable(spec: Extract<MyInterviewSlideSpec, { kind: "table" }>): SceneElement[] {
  return [
    ...heading(spec, false),
    shape("table-surface", "Evidence table surface", { x: 72, y: 204, width: 1136, height: 388 }, { fill: color.surface, stroke: color.line, strokeWidth: 1, radius: 20, shadow: true }),
    {
      id: "evidence-table",
      name: "Evidence table",
      kind: "table",
      frame: { x: 92, y: 224, width: 1096, height: 306 },
      zIndex: 4,
      content: { columns: [...spec.columns], rows: spec.rows.map((row) => [...row]) },
      style: { color: color.ink2, fontSize: spec.rows.length > 5 ? 12 : 13, lineHeight: 1.35 },
      accessibility: { label: `${spec.title}. ${spec.rows.map((row) => row.join(": ")).join("; ")}`, readingOrder: 4 }
    },
    shape("table-note-surface", "Table note surface", { x: 92, y: 542, width: 1096, height: 34 }, { fill: color.tealSoft, radius: 10, zIndex: 3 }),
    text("table-note", "Table note", spec.note, { x: 106, y: 551, width: 1068, height: 18 }, { color: toneMap.teal.text, fontSize: 11, fontWeight: 700, textAlign: "center", order: 5, zIndex: 5 })
  ];
}

function stepCard(prefix: string, step: MyInterviewStep, frame: Frame, order: number, index: number, vertical: boolean): SceneElement[] {
  const tone = toneMap[step.tone];
  return [
    shape(`${prefix}-surface`, `${step.label} surface`, frame, { fill: step.featured ? tone.strong : color.surface, stroke: tone.strong, strokeWidth: step.featured ? 2 : 1, radius: 18, ...(step.featured ? { shadow: true } : {}) }),
    shape(`${prefix}-index-surface`, `${step.label} index surface`, { x: frame.x + 18, y: frame.y + 18, width: 38, height: 38 }, { fill: step.featured ? "rgba(255,255,255,.15)" : tone.soft, stroke: step.featured ? "rgba(255,255,255,.3)" : tone.strong, strokeWidth: 1, radius: 19, zIndex: 3 }),
    text(`${prefix}-index`, `${step.label} index`, String(index + 1).padStart(2, "0"), { x: frame.x + 24, y: frame.y + 28, width: 26, height: 18 }, { color: step.featured ? color.white : tone.text, fontSize: 11, fontWeight: 840, textAlign: "center", order, zIndex: 5 }),
    ...(step.value ? [text(`${prefix}-value`, `${step.label} value`, step.value, { x: frame.x + 70, y: frame.y + 24, width: frame.width - 88, height: 20 }, { color: step.featured ? "#eaf2ff" : tone.strong, fontSize: 10, fontWeight: 840, letterSpacing: 1, order: order + 1, zIndex: 5 })] : []),
    text(`${prefix}-label`, `${step.label} label`, step.label, {
      x: frame.x + (step.value ? 18 : 70),
      y: frame.y + (step.value ? 56 : 26),
      width: frame.width - (step.value ? 36 : 88),
      height: vertical ? 54 : 48
    }, { color: step.featured ? color.white : color.ink, fontSize: vertical ? 20 : 21, fontWeight: 760, lineHeight: 1.2, order: order + 2, zIndex: 5 }),
    text(`${prefix}-description`, `${step.label} description`, step.description, { x: frame.x + 18, y: frame.y + (vertical ? 128 : 92), width: frame.width - 36, height: frame.height - (vertical ? 148 : 112) }, { color: step.featured ? "#eef2ff" : color.muted, fontSize: vertical ? 13 : 14, fontWeight: 520, lineHeight: 1.4, order: order + 3, zIndex: 5 })
  ];
}

function buildSteps(spec: Extract<MyInterviewSlideSpec, { kind: "roadmap" | "process" }>): SceneElement[] {
  const elements = heading(spec, false);
  const count = spec.steps.length;
  if (spec.kind === "roadmap" || count <= 4) {
    const gap = 16;
    const width = (1136 - gap * (count - 1)) / count;
    spec.steps.forEach((step, index) => {
      const frame = { x: 72 + index * (width + gap), y: 224, width, height: 366 };
      if (index < count - 1) elements.push(line(`step-line-${index + 1}`, { x: frame.x + frame.width, y: 405, width: gap, height: 0 }, color.lineDark, 2));
      elements.push(...stepCard(`step-${index + 1}`, step, frame, 4 + index * 4, index, true));
    });
    return elements;
  }
  const gap = 14;
  const width = (1136 - gap * (count - 1)) / count;
  spec.steps.forEach((step, index) => {
    const frame = { x: 72 + index * (width + gap), y: 250, width, height: 300 };
    if (index < count - 1) elements.push(line(`step-line-${index + 1}`, { x: frame.x + frame.width, y: 399, width: gap, height: 0 }, color.lineDark, 2));
    elements.push(...stepCard(`step-${index + 1}`, step, frame, 4 + index * 4, index, true));
  });
  return elements;
}

function buildClosing(spec: Extract<MyInterviewSlideSpec, { kind: "closing" }>): SceneElement[] {
  return [
    text("closing-eyebrow", "Closing eyebrow", spec.eyebrow, { x: 72, y: 66, width: 540, height: 24 }, { color: "#9ee7dc", fontSize: 13, fontWeight: 840, letterSpacing: 1.2, order: 1 }),
    text("closing-title", "Closing title", spec.title, { x: 72, y: 126, width: 940, height: 156 }, { color: color.white, fontSize: 58, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.4, order: 2 }),
    text("closing-description", "Closing description", spec.description ?? "", { x: 76, y: 310, width: 760, height: 84 }, { color: color.whiteSoft, fontSize: 19, fontWeight: 500, lineHeight: 1.5, order: 3 }),
    shape("closing-statement-surface", "Closing statement surface", { x: 72, y: 446, width: 1136, height: 142 }, { fill: "rgba(255,255,255,.08)", stroke: "rgba(255,255,255,.18)", strokeWidth: 1, radius: 24, shadow: true }),
    text("closing-statement", "Closing statement", spec.statement, { x: 108, y: 478, width: 900, height: 68 }, { color: color.amber, fontSize: 42, fontWeight: 820, lineHeight: 1.15, letterSpacing: -0.6, order: 4 }),
    text("closing-byline", "Closing byline", spec.byline, { x: 930, y: 552, width: 238, height: 24 }, { color: color.whiteSoft, fontSize: 12, fontWeight: 720, letterSpacing: 0.35, textAlign: "right", order: 5 }),
    image("closing-logo", "FPT Polytechnic logo", "fpt-polytechnic-logo", "Logo FPT Polytechnic", { x: 930, y: 58, width: 278, height: 66 }, { fit: "contain", radius: 0, zIndex: 5 })
  ];
}

export function buildMyInterviewSlide(spec: MyInterviewSlideSpec, index: number): SceneSlide {
  const dark = spec.kind === "cover" || spec.kind === "closing" || spec.section === "demo";
  let elements: SceneElement[];
  switch (spec.kind) {
    case "cover":
      elements = buildCover(spec);
      break;
    case "profile":
      elements = buildProfile(spec, index);
      break;
    case "media":
      elements = buildMedia(spec);
      break;
    case "comparison":
      elements = buildComparison(spec);
      break;
    case "architecture":
      elements = buildArchitecture(spec);
      break;
    case "criteria":
      elements = buildCriteria(spec);
      break;
    case "status":
      elements = buildStatus(spec);
      break;
    case "table":
      elements = buildTable(spec);
      break;
    case "roadmap":
    case "process":
      elements = buildSteps(spec);
      break;
    case "closing":
      elements = buildClosing(spec);
      break;
  }
  return {
    id: spec.id,
    name: spec.title.slice(0, 140),
    purpose: spec.kind === "profile"
      ? "Giới thiệu trách nhiệm và đóng góp của thành viên."
      : spec.section === "appendix"
        ? "Trả lời câu hỏi kỹ thuật bằng bằng chứng có cấu trúc."
        : `Truyền đạt kết luận chính của phần ${spec.section}.`,
    conclusion: spec.title,
    background: backgroundFor(spec, index),
    transition: { type: index % 4 === 0 ? "fade" : index % 4 === 1 ? "slide" : index % 4 === 2 ? "wipe" : "zoom", duration: 0.38, easing: "emphasized" },
    notes: spec.notes,
    evidence: { source: spec.source, status: "illustrative", sourceIds: ["myinterview-defense-source"] },
    elements: [...elements, footer(spec, dark)]
  };
}
