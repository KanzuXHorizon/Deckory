import {
  DeckDocumentV2Schema,
  type DeckAssetV2,
  type DeckDocument,
  type DeckDocumentV2,
  type Frame,
  type SceneElement,
  type SceneSlide,
  type Slide,
  type SlideComponent
} from "@deckory/schema";

export type V2MigrationDiagnostic = {
  code: "v2-schema-invalid" | "unsupported-component" | "missing-asset";
  severity: "error" | "warning";
  message: string;
  remediation: string;
  slideId?: string;
  componentId?: string;
  propertyPath?: string;
};

export type V2MigrationResult =
  | { ok: true; deck: DeckDocumentV2; diagnostics: V2MigrationDiagnostic[] }
  | { ok: false; diagnostics: V2MigrationDiagnostic[] };

type MigrationContext = {
  deck: DeckDocument;
  slide: Slide;
  slideIndex: number;
  assets: Map<string, DeckAssetV2>;
  diagnostics: V2MigrationDiagnostic[];
  datasets: NonNullable<NonNullable<DeckDocumentV2["visualIntelligence"]>["evidence"]>["datasets"];
  visualBindings: NonNullable<NonNullable<DeckDocumentV2["visualIntelligence"]>["evidence"]>["visualBindings"];
};

const SOURCE_ID = "legacy-migration-source";
const CANVAS = { width: 1280 as const, height: 720 as const, unit: "px" as const };
const ACCENTS = ["#5147e8", "#0f8b8d", "#c77700", "#243b73"] as const;

function stableId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function idFactory(slide: Slide) {
  const used = new Set<string>();
  return (value: string) => {
    const base = stableId(value);
    let id = base;
    let suffix = 2;
    while (used.has(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(id);
    return id;
  };
}

function textElement(
  id: string,
  name: string,
  text: string,
  frame: Frame,
  options: {
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    fontFamily?: string;
    lineHeight?: number;
    textAlign?: "left" | "center" | "right" | "justify";
    zIndex?: number;
    readingOrder?: number;
  } = {}
): SceneElement {
  return {
    id,
    name,
    kind: "text",
    frame,
    zIndex: options.zIndex ?? 2,
    content: { text },
    style: {
      color: options.color ?? "#25282d",
      fontSize: options.fontSize ?? fittedFontSize(text, frame),
      fontWeight: options.fontWeight ?? 520,
      lineHeight: options.lineHeight ?? 1.25,
      ...(options.fontFamily ? { fontFamily: options.fontFamily } : {}),
      ...(options.textAlign ? { textAlign: options.textAlign } : {})
    },
    accessibility: {
      label: text.slice(0, 500),
      ...(options.readingOrder === undefined ? {} : { readingOrder: options.readingOrder })
    }
  };
}

function cardElements(
  id: string,
  text: string,
  frame: Frame,
  accent: string,
  order: number,
  options: { fontFamily?: string; textAlign?: "left" | "center" | "right" } = {}
): SceneElement[] {
  return [
    {
      id: `${id}-surface`,
      name: `${id} surface`,
      kind: "shape",
      frame,
      zIndex: 1,
      content: { shape: "rectangle" },
      style: { fill: "#ffffff", stroke: "#d9dad6", strokeWidth: 1, borderRadius: 16 },
      accessibility: { decorative: true }
    },
    textElement(
      `${id}-text`,
      `${id} text`,
      text,
      inset(frame, 22, 18),
      {
        readingOrder: order,
        color: "#25282d",
        ...(options.fontFamily ? { fontFamily: options.fontFamily } : {}),
        ...(options.textAlign ? { textAlign: options.textAlign } : {})
      }
    ),
    {
      id: `${id}-accent`,
      name: `${id} accent`,
      kind: "shape",
      frame: { x: frame.x + 16, y: frame.y + 14, width: 42, height: 4 },
      zIndex: 3,
      content: { shape: "rectangle" },
      style: { fill: accent, borderRadius: 2 },
      accessibility: { decorative: true }
    }
  ];
}

function inset(frame: Frame, horizontal: number, vertical: number): Frame {
  return {
    x: frame.x + horizontal,
    y: frame.y + vertical,
    width: Math.max(1, frame.width - horizontal * 2),
    height: Math.max(1, frame.height - vertical * 2)
  };
}

function fittedFontSize(text: string, frame: Frame): number {
  const candidates = [28, 23, 19, 16, 13] as const;
  for (const fontSize of candidates) {
    const charactersPerLine = Math.max(8, Math.floor(frame.width / (fontSize * 0.55)));
    const estimatedLines = text.split(/\r?\n/u).reduce((total, line) =>
      total + Math.max(1, Math.ceil(line.length / charactersPerLine)), 0);
    const estimatedHeight = estimatedLines * fontSize * 1.25;
    if (estimatedHeight <= Math.max(1, frame.height - 4)) return fontSize;
  }
  return 13;
}

function fittedHeadingFontSize(text: string, frame: Frame, maximum: number): number {
  const candidates = [42, 38, 34, 32, 30, 28, 26].filter((size) => size <= maximum);
  for (const fontSize of candidates) {
    const charactersPerLine = Math.max(12, Math.floor(frame.width / (fontSize * 0.6)));
    const estimatedLines = text.split(/\r?\n/u).reduce((total, line) =>
      total + Math.max(1, Math.ceil(line.length / charactersPerLine)), 0);
    const estimatedHeight = estimatedLines * fontSize * 1.08 + 12;
    if (estimatedHeight <= frame.height) return fontSize;
  }
  return 26;
}

function contentFrames(count: number, slideIndex: number): Frame[] {
  const area = { x: 72, y: 168, width: 1136, height: 446 };
  if (count <= 0) return [];
  if (count === 1) {
    const variant = slideIndex % 4;
    if (variant === 1) return [{ x: area.x, y: area.y, width: 760, height: area.height }];
    if (variant === 2) return [{ x: area.x + 330, y: area.y, width: 806, height: area.height }];
    if (variant === 3) return [{ x: area.x + 126, y: area.y + 28, width: 884, height: area.height - 56 }];
    return [area];
  }
  if (count === 2) {
    if (slideIndex % 3 === 1) {
      return [
        { x: area.x, y: area.y, width: area.width, height: 205 },
        { x: area.x, y: area.y + 229, width: area.width, height: 217 }
      ];
    }
    const firstWidth = slideIndex % 3 === 2 ? 690 : 548;
    return [
      { x: area.x, y: area.y, width: firstWidth, height: area.height },
      { x: area.x + firstWidth + 24, y: area.y, width: area.width - firstWidth - 24, height: area.height }
    ];
  }
  if (count === 3 && slideIndex % 2 === 1) {
    return [
      { x: area.x, y: area.y, width: 650, height: area.height },
      { x: area.x + 674, y: area.y, width: 462, height: 211 },
      { x: area.x + 674, y: area.y + 235, width: 462, height: 211 }
    ];
  }
  return gridFrames(area, count, count <= 3 ? count : Math.min(3, Math.ceil(Math.sqrt(count))));
}

function gridFrames(frame: Frame, count: number, columns: number): Frame[] {
  const gap = 18;
  const rows = Math.ceil(count / columns);
  const width = (frame.width - gap * (columns - 1)) / columns;
  const height = (frame.height - gap * (rows - 1)) / rows;
  return Array.from({ length: count }, (_, index) => ({
    x: frame.x + (index % columns) * (width + gap),
    y: frame.y + Math.floor(index / columns) * (height + gap),
    width,
    height
  }));
}

function backgroundFor(slide: Slide, index: number): SceneSlide["background"] {
  const base = slide.background === "spotlight" ? "#f2f0ff" : slide.background === "grid" ? "#f4f7f6" : "#f7f7f4";
  const layers: SceneSlide["background"]["layers"] = [{ id: `background-${index + 1}`, type: "solid", color: base, opacity: 1 }];
  if (slide.background === "grid") layers.push({ id: `grid-${index + 1}`, type: "grid", color: "#c8cfcc", opacity: 0.2, data: { size: 32, lineWidth: 1 } });
  if (slide.background === "spotlight") layers.push({ id: `glow-${index + 1}`, type: "glow", color: ACCENTS[index % ACCENTS.length], opacity: 0.14, position: { x: 76, y: 18 }, blur: 36 });
  return { layers };
}

function headingText(component: Extract<SlideComponent, { type: "heading" }>): string {
  return [component.props.title, component.props.emphasis].filter(Boolean).join(" ");
}

function conclusionFor(slide: Slide): string {
  for (const component of slide.components) {
    if (component.type === "heading") return headingText(component);
    if (component.type === "statement") return component.props.quote;
    if (component.type === "insight") return component.props.title;
    if (component.type === "diagram") return component.props.title;
    if (component.type === "chart") return component.props.title;
  }
  return `Slide ${slide.id} giữ vai trò ${slide.layout} trong mạch trình bày.`;
}

function componentSummary(component: SlideComponent): string {
  switch (component.type) {
    case "statement": return [component.props.quote, component.props.byline].filter(Boolean).join("\n\n");
    case "code": return [component.props.title, component.props.code, component.props.caption].filter(Boolean).join("\n\n");
    case "insight": return [component.props.label, component.props.title, component.props.metric, component.props.description].filter(Boolean).join("\n");
    case "weight-simulator": return [
      component.props.title,
      component.props.description,
      ...component.props.dimensions.map((item) => `${item.label}: ${item.score} · trọng số ${item.weight}%`),
      component.props.disclaimer
    ].join("\n");
    default: return JSON.stringify(component.props, null, 2);
  }
}

function subcardText(component: SlideComponent): string[] | undefined {
  switch (component.type) {
    case "metric-grid": return component.props.metrics.map((item) => `${item.value}\n${item.label}\n${item.note}`);
    case "comparison": return [
      `${component.props.left.eyebrow}\n${component.props.left.title}\n${component.props.left.points.map((point) => `• ${point}`).join("\n")}`,
      `${component.props.right.eyebrow}\n${component.props.right.title}\n${component.props.right.points.map((point) => `• ${point}`).join("\n")}`
    ];
    case "process": return component.props.steps.map((item, index) => `${index + 1}. ${item.title}\n${item.note}`);
    case "architecture": return component.props.layers.map((item) => `${item.label}\n${item.items.map((value) => `• ${value}`).join("\n")}`);
    case "criterion-grid": return component.props.items.map((item) => `${item.label}\n${item.question}\n→ ${item.output}`);
    case "visualizer": return component.props.items.map((item) => `${item.label}${item.value ? ` · ${item.value}` : ""}\n${item.description ?? ""}`.trim());
    case "diagram": return component.props.items.map((item) => `${item.label}${item.value ? ` · ${item.value}` : ""}\n${item.description ?? ""}`.trim());
    case "team-showcase": return component.props.members.map((member) => [
      member.name,
      member.role,
      member.studentId,
      member.summary,
      member.skills?.length ? `Kỹ năng: ${member.skills.join(", ")}` : undefined,
      member.contributions?.length ? `Đóng góp: ${member.contributions.join("; ")}` : undefined
    ].filter(Boolean).join("\n"));
    default: return undefined;
  }
}

function componentElements(
  component: SlideComponent,
  frame: Frame,
  order: number,
  makeId: (value: string) => string,
  context: MigrationContext
): SceneElement[] {
  const accent = ACCENTS[(context.slideIndex + order) % ACCENTS.length] ?? ACCENTS[0];
  if (component.type === "chart") {
    const elementId = makeId(component.id);
    const datasetId = `${context.slide.id}-${component.id}-dataset`;
    const values = component.props.values;
    context.datasets.push({
      id: datasetId,
      label: `${component.props.title} · migrated V1 data`,
      sourceIds: [SOURCE_ID],
      status: "illustrative",
      illustrativeLabel: "Dữ liệu chuyển đổi từ deck V1; cần xác minh trước khi dùng như số liệu thực.",
      columns: [
        { key: "category", label: "Danh mục", type: "string" },
        { key: "value", label: "Giá trị", type: "number" }
      ],
      rows: values.map((item) => ({ category: item.label, value: item.value }))
    });
    context.visualBindings.push({ id: `${context.slide.id}-${elementId}-binding`, kind: "chart", slideId: context.slide.id, elementId, datasetId, claimIds: [`claim-${context.slide.id}`] });
    return [{
      id: elementId,
      name: component.props.title,
      kind: "chart",
      frame,
      zIndex: 2,
      content: {
        chart: {
          question: `Các giá trị trong ${component.props.title} khác nhau như thế nào?`,
          title: component.props.title,
          accessibleSummary: values.map((item) => `${item.label} ${item.value}`).join(", "),
          variant: component.props.variant === "line" ? "line" : component.props.variant === "area" ? "area" : "horizontal-bar",
          data: values.map((item) => ({ id: stableId(item.label), category: item.label, value: item.value })),
          encoding: { categoryField: "category", valueField: "value", zeroBaseline: component.props.variant !== "line" && component.props.variant !== "area" },
          unit: component.props.unit,
          numberFormat: { style: "decimal", maximumFractionDigits: 1 },
          labels: { mode: "direct", showValues: component.props.showValues ?? true, collisionPolicy: "diagnose" },
          highlights: values.flatMap((item) => item.highlight ? [{ datumId: stableId(item.label), level: "primary" as const }] : []),
          annotations: [],
          referenceLines: [],
          evidence: { status: "illustrative", sourceIds: [], label: "Dữ liệu migration từ deck V1 · illustrative" },
          missingValuePolicy: "gap",
          animation: { mode: component.props.variant === "line" || component.props.variant === "area" ? "trace" : "zero-to-value", durationMs: 600 }
        }
      },
      style: { color: accent },
      accessibility: { label: values.map((item) => `${item.label} ${item.value}`).join(", "), readingOrder: order }
    }];
  }

  if (component.type === "table") {
    return [{
      id: makeId(component.id),
      name: component.props.title,
      kind: "table",
      frame,
      zIndex: 2,
      content: { columns: component.props.columns, rows: component.props.rows.map((row) => row.cells) },
      accessibility: { label: `${component.props.title}. ${component.props.rows.length} hàng dữ liệu.`, readingOrder: order }
    }];
  }

  if (component.type === "evidence-footer") {
    const footer: SceneElement = {
      id: makeId(component.id),
      name: "Evidence footer",
      kind: "evidence-footer",
      frame: { x: component.props.logoAssetId ? 156 : 72, y: 664, width: component.props.logoAssetId ? 1052 : 1136, height: 28 },
      zIndex: 6,
      content: { source: component.props.source, ...(component.props.page ? { page: component.props.page } : {}), ...(component.props.brandLabel ? { brandLabel: component.props.brandLabel } : {}) },
      accessibility: { label: `Nguồn: ${component.props.source}`, readingOrder: 99 }
    };
    if (!component.props.logoAssetId) return [footer];
    const logo = context.assets.get(component.props.logoAssetId);
    if (!logo) {
      context.diagnostics.push({
        code: "missing-asset",
        severity: "warning",
        slideId: context.slide.id,
        componentId: component.id,
        message: `Không tìm thấy logo asset ${component.props.logoAssetId}.`,
        remediation: "Khôi phục logo local trước khi dùng deck V2."
      });
      return [footer];
    }
    return [{
      id: makeId(`${component.id}-logo`),
      name: "Evidence logo",
      kind: "image",
      frame: { x: 72, y: 654, width: 70, height: 38 },
      zIndex: 6,
      content: { assetId: logo.id, alt: component.props.brandLabel ?? "Logo nguồn" },
      style: { objectFit: "contain" },
      accessibility: { label: component.props.brandLabel ?? "Logo nguồn", readingOrder: 98 }
    }, footer];
  }

  if (component.type === "team-showcase") {
    const members = component.props.members;
    const frames = members.length === 1
      ? [frame]
      : gridFrames(frame, members.length, Math.min(3, members.length));
    return members.flatMap((member, index) => {
      const memberFrame = frames[index]!;
      const assetId = member.image?.assetId;
      const asset = assetId ? context.assets.get(assetId) : undefined;
      const memberText = [
        member.name,
        member.role,
        member.studentId,
        member.summary,
        member.skills?.length ? `Kỹ năng: ${member.skills.join(", ")}` : undefined,
        member.contributions?.length ? `Đóng góp: ${member.contributions.join("; ")}` : undefined
      ].filter(Boolean).join("\n");
      if (!asset) {
        if (assetId) {
          context.diagnostics.push({
            code: "missing-asset",
            severity: "warning",
            slideId: context.slide.id,
            componentId: component.id,
            message: `Không tìm thấy ảnh thành viên ${assetId}.`,
            remediation: "Khôi phục ảnh local hoặc cập nhật member image reference."
          });
        }
        return cardElements(makeId(`${component.id}-${member.id}`), memberText, memberFrame, accent, order + index);
      }
      if (members.length === 1) {
        const imageFrame = { x: memberFrame.x, y: memberFrame.y, width: Math.min(360, memberFrame.width * 0.34), height: memberFrame.height };
        const textFrame = {
          x: imageFrame.x + imageFrame.width + 28,
          y: memberFrame.y,
          width: memberFrame.width - imageFrame.width - 28,
          height: memberFrame.height
        };
        return [
          {
            id: makeId(`${component.id}-${member.id}-image`),
            name: `${member.name} image`,
            kind: "image",
            frame: imageFrame,
            zIndex: 2,
            content: { assetId: asset.id, alt: member.image?.alt ?? member.name },
            style: { objectFit: "cover", focalPoint: { x: 0.5, y: member.image?.position === "top" ? 0.25 : member.image?.position === "bottom" ? 0.75 : 0.5 }, borderRadius: 18 },
            accessibility: { label: member.image?.alt ?? member.name, readingOrder: order + index * 2 }
          },
          ...cardElements(makeId(`${component.id}-${member.id}`), memberText, textFrame, accent, order + index * 2 + 1)
        ];
      }
      const imageHeight = Math.max(96, memberFrame.height * 0.48);
      return [
        {
          id: makeId(`${component.id}-${member.id}-image`),
          name: `${member.name} image`,
          kind: "image",
          frame: { x: memberFrame.x, y: memberFrame.y, width: memberFrame.width, height: imageHeight },
          zIndex: 2,
          content: { assetId: asset.id, alt: member.image?.alt ?? member.name },
          style: { objectFit: "cover", focalPoint: { x: 0.5, y: member.image?.position === "top" ? 0.25 : member.image?.position === "bottom" ? 0.75 : 0.5 }, borderRadius: 16 },
          accessibility: { label: member.image?.alt ?? member.name, readingOrder: order + index * 2 }
        },
        ...cardElements(makeId(`${component.id}-${member.id}`), memberText, {
          x: memberFrame.x,
          y: memberFrame.y + imageHeight + 10,
          width: memberFrame.width,
          height: memberFrame.height - imageHeight - 10
        }, accent, order + index * 2 + 1)
      ];
    });
  }

  if (component.type === "media-showcase") {
    const frames = gridFrames(frame, component.props.items.length, component.props.items.length);
    return component.props.items.flatMap((item, index) => {
      const asset = context.assets.get(item.assetId);
      if (!asset) {
        context.diagnostics.push({
          code: "missing-asset",
          severity: "warning",
          slideId: context.slide.id,
          componentId: component.id,
          message: `Không tìm thấy asset ${item.assetId}.`,
          remediation: "Khôi phục local asset hoặc thay bằng placeholder được gắn nhãn."
        });
        return cardElements(makeId(`${component.id}-${item.assetId}`), `${item.title}\n${item.caption ?? item.alt}`, frames[index]!, accent, order + index);
      }
      const imageFrame = { ...frames[index]!, height: Math.max(100, frames[index]!.height - 58) };
      return [
        {
          id: makeId(`${component.id}-${item.assetId}-image`),
          name: item.title,
          kind: "image",
          frame: imageFrame,
          zIndex: 2,
          content: { assetId: item.assetId, alt: item.alt },
          style: { objectFit: "cover", focalPoint: { x: 0.5, y: 0.5 } },
          accessibility: { label: item.alt, readingOrder: order + index }
        },
        textElement(makeId(`${component.id}-${item.assetId}-caption`), `${item.title} caption`, [item.eyebrow, item.title, item.caption].filter(Boolean).join(" · "), {
          x: frames[index]!.x,
          y: imageFrame.y + imageFrame.height + 8,
          width: frames[index]!.width,
          height: 50
        }, { fontSize: 14, fontWeight: 600, readingOrder: order + index })
      ];
    });
  }

  const cards = subcardText(component);
  if (cards) {
    const frames = gridFrames(frame, cards.length, Math.min(cards.length, cards.length > 4 ? 3 : 2));
    return cards.flatMap((text, index) => cardElements(makeId(`${component.id}-${index + 1}`), text, frames[index]!, accent, order + index));
  }

  return cardElements(
    makeId(component.id),
    componentSummary(component),
    frame,
    accent,
    order,
    component.type === "code" ? { fontFamily: "Cascadia Mono" } : component.type === "statement" ? { textAlign: "center" } : {}
  );
}

function migrateSlide(
  deck: DeckDocument,
  slide: Slide,
  slideIndex: number,
  assets: Map<string, DeckAssetV2>,
  diagnostics: V2MigrationDiagnostic[],
  datasets: MigrationContext["datasets"],
  visualBindings: MigrationContext["visualBindings"]
): SceneSlide {
  const makeId = idFactory(slide);
  const heading = slide.components.find((component): component is Extract<SlideComponent, { type: "heading" }> => component.type === "heading");
  const content = slide.components.filter((component) => component.type !== "heading" && component.type !== "evidence-footer");
  const footer = slide.components.find((component) => component.type === "evidence-footer");
  const frames = contentFrames(content.length, slideIndex);
  const elements: SceneElement[] = [];

  if (heading) {
    if (heading.props.eyebrow) {
      elements.push(textElement(makeId(`${heading.id}-eyebrow`), "Eyebrow", heading.props.eyebrow, { x: 72, y: 48, width: 760, height: 28 }, { fontSize: 14, fontWeight: 760, color: ACCENTS[slideIndex % ACCENTS.length] ?? ACCENTS[0], readingOrder: 1 }));
    }
    const title = headingText(heading);
    const headingFrame = { x: 72, y: 78, width: heading.props.description ? 730 : 1080, height: 82 };
    const headingFontSize = fittedHeadingFontSize(title, headingFrame, heading.props.description ? 38 : 42);
    elements.push(textElement(makeId(heading.id), "Heading", title, headingFrame, { fontSize: headingFontSize, fontWeight: 760, lineHeight: 1.08, color: "#17191c", readingOrder: 2 }));
    if (heading.props.description) {
      elements.push(textElement(makeId(`${heading.id}-description`), "Heading description", heading.props.description, { x: 850, y: 54, width: 358, height: 88 }, { fontSize: 16, color: "#555b63", readingOrder: 3 }));
    }
  } else {
    const title = conclusionFor(slide);
    const titleFrame = { x: 72, y: 58, width: 1136, height: 88 };
    const titleFontSize = fittedHeadingFontSize(title, titleFrame, 38);
    elements.push(textElement(makeId("slide-title"), "Slide title", title, titleFrame, { fontSize: titleFontSize, fontWeight: 760, lineHeight: 1.08, color: "#17191c", readingOrder: 1 }));
  }

  const context: MigrationContext = { deck, slide, slideIndex, assets, diagnostics, datasets, visualBindings };
  content.forEach((component, index) => elements.push(...componentElements(component, frames[index]!, 10 + index * 10, makeId, context)));
  if (footer) elements.push(...componentElements(footer, { x: 72, y: 664, width: 1136, height: 28 }, 99, makeId, context));
  else elements.push({
    id: makeId("migration-evidence-footer"),
    name: "Migration evidence footer",
    kind: "evidence-footer",
    frame: { x: 72, y: 664, width: 1136, height: 28 },
    zIndex: 6,
    content: { source: "Deckory V1 migration · illustrative", page: String(slideIndex + 1).padStart(2, "0") },
    accessibility: { label: "Nguồn: Deckory V1 migration, illustrative.", readingOrder: 99 }
  });

  return {
    id: slide.id,
    name: conclusionFor(slide).slice(0, 140),
    purpose: `Migrate V1 ${slide.layout} slide while preserving semantic content.`,
    conclusion: conclusionFor(slide).slice(0, 500),
    notes: slide.notes ?? `Nêu kết luận của slide ${slide.id}; mọi dữ liệu migration chưa có nguồn độc lập phải được trình bày là minh hoạ.`,
    background: backgroundFor(slide, slideIndex),
    transition: slide.transition,
    evidence: { source: "Deckory V1 source deck", status: "illustrative", sourceIds: [SOURCE_ID] },
    elements
  };
}

function narrativeSections(slides: readonly SceneSlide[]) {
  const count = slides.length;
  const firstEnd = Math.max(1, Math.ceil(count * 0.25));
  const middleEnd = Math.max(firstEnd + 1, Math.ceil(count * 0.78));
  return [
    { id: "setup", role: "context" as const, objective: "Thiết lập bối cảnh, vấn đề và tiêu chí quyết định.", slideIds: slides.slice(0, firstEnd).map((slide) => slide.id) },
    { id: "proof", role: "proof" as const, objective: "Trình bày giải pháp, bằng chứng, kiến trúc và kết quả.", slideIds: slides.slice(firstEnd, middleEnd).map((slide) => slide.id) },
    { id: "decision", role: "decision" as const, objective: "Tổng hợp quyết định, kế hoạch và kết luận.", slideIds: slides.slice(middleEnd).map((slide) => slide.id) }
  ].filter((section) => section.slideIds.length > 0);
}

function migrateAssets(deck: DeckDocument): Map<string, DeckAssetV2> {
  return new Map((deck.assets ?? []).map((asset) => [asset.id, {
    id: asset.id,
    type: "image" as const,
    src: asset.src,
    mediaType: asset.mediaType,
    ...(asset.width === undefined ? {} : { width: asset.width }),
    ...(asset.height === undefined ? {} : { height: asset.height }),
    ...(asset.source ? { source: asset.source } : {})
  }]));
}

export function migrateDeckV1ToV2(deck: DeckDocument): V2MigrationResult {
  const diagnostics: V2MigrationDiagnostic[] = [];
  const assets = migrateAssets(deck);
  const datasets: MigrationContext["datasets"] = [];
  const visualBindings: MigrationContext["visualBindings"] = [];
  const slides = deck.slides.map((slide, index) => migrateSlide(deck, slide, index, assets, diagnostics, datasets, visualBindings));
  const claims = slides.map((slide) => ({
    id: `claim-${slide.id}`,
    text: slide.conclusion ?? slide.name,
    slideId: slide.id,
    elementId: slide.elements.find((element) => element.kind === "text")?.id,
    evidenceIds: [],
    status: "illustrative" as const
  }));

  const migrated: DeckDocumentV2 = {
    schemaVersion: 2,
    id: `${deck.id}-v2`,
    revision: 1,
    title: `${deck.title} · Scene V2`,
    locale: "vi-VN",
    canvas: CANVAS,
    theme: {
      id: `migrated-${deck.theme?.preset ?? "editorial-light"}`,
      tokens: {
        accent: deck.theme?.accent ?? "cobalt",
        typography: deck.theme?.typography ?? "editorial",
        density: deck.theme?.density ?? "comfortable"
      }
    },
    assets: [...assets.values()],
    visualIntelligence: {
      narrative: {
        audience: {
          role: deck.id.includes("myinterview") ? "Hội đồng bảo vệ dự án" : "Người xem deck Deckory",
          knowledgeLevel: "informed",
          needs: ["Kết luận rõ", "Nội dung có thể kiểm tra", "Visual không làm mất dữ liệu gốc"]
        },
        decisionOrOutcome: `Hiểu và đánh giá đầy đủ câu chuyện của ${deck.title}.`,
        timeBudgetMinutes: Math.max(4, Math.round(slides.length * 0.65)),
        thesis: slides[0]?.conclusion ?? deck.title,
        sections: narrativeSections(slides),
        unresolvedQuestions: ["Các claim và số liệu migration cần được thay bằng nguồn verified trước khi công bố như dữ liệu thực."]
      },
      evidence: {
        sources: [{
          id: SOURCE_ID,
          kind: "document",
          label: `Deck V1 source: ${deck.title}`,
          status: "illustrative",
          illustrativeLabel: "Nội dung được chuyển đổi tự động từ deck V1; chưa phải evidence độc lập.",
          notes: "Giữ nguyên nội dung nguồn để review migration; xác minh claim riêng trước production use."
        }],
        evidence: [],
        claims,
        datasets,
        visualBindings
      }
    },
    slides
  };

  const parsed = DeckDocumentV2Schema.safeParse(migrated);
  if (!parsed.success) {
    return {
      ok: false,
      diagnostics: parsed.error.issues.map((issue) => ({
        code: "v2-schema-invalid",
        severity: "error",
        message: issue.message,
        remediation: "Sửa migration output theo property path và chạy lại schema validation.",
        propertyPath: issue.path.join(".")
      }))
    };
  }
  return { ok: true, deck: parsed.data, diagnostics };
}
