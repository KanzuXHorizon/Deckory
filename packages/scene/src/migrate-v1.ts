import {
  DeckDocumentV2Schema,
  type DeckDocument,
  type DeckDocumentV2,
  type SceneElement,
  type Slide,
  type SlideComponent
} from "@deckory/schema";
import { assignV1LayoutFrames } from "./v1-layout-frames.js";

export type DeckMigrationDiagnostic = {
  code: "migration-review-required" | "migration-invalid-result";
  severity: "warning" | "error";
  slideId?: string;
  componentId?: string;
  message: string;
};

export type DeckMigrationResult =
  | { ok: true; deck: DeckDocumentV2; diagnostics: DeckMigrationDiagnostic[] }
  | { ok: false; diagnostics: DeckMigrationDiagnostic[] };

function cloneRecord(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function componentSummary(component: SlideComponent): string {
  const props = component.props as Record<string, unknown>;
  for (const key of ["title", "quote", "label", "description", "summary", "project"]) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return `${component.type}: ${component.id}`;
}

function legacyProps(component: SlideComponent): Record<string, unknown> {
  return {
    ...cloneRecord(component.props),
    ...(component.sequence === undefined ? {} : { __legacySequence: component.sequence }),
    ...(component.effect === undefined ? {} : { __legacyEffect: cloneRecord(component.effect) }),
    ...(component.morphId === undefined ? {} : { __legacyMorphId: component.morphId })
  };
}

function elementFromComponent(component: SlideComponent, order: number): SceneElement {
  if (component.type === "evidence-footer") {
    return {
      id: component.id,
      name: "Evidence footer",
      kind: "evidence-footer",
      frame: { x: 72, y: 660, width: 1136, height: 28 },
      zIndex: order,
      content: {
        source: component.props.source,
        page: component.props.page,
        brandLabel: component.props.brandLabel
      },
      accessibility: { label: `Nguồn: ${component.props.source}`, readingOrder: order }
    };
  }

  return {
    id: component.id,
    name: componentSummary(component),
    kind: "component-instance",
    frame: { x: 72, y: 222, width: 1136, height: 398 },
    zIndex: order,
    content: {
      componentId: `legacy-${component.type}`,
      version: "1.0.0",
      props: legacyProps(component)
    },
    accessibility: { label: componentSummary(component), readingOrder: order },
    semantic: { purpose: `legacy-${component.type}` },
    exportPolicy: { html: "native", svg: "fallback", png: "native", pdf: "native", pptx: "fallback" }
  };
}

function migrateSlide(slide: Slide, diagnostics: DeckMigrationDiagnostic[]) {
  const elements = assignV1LayoutFrames(
    slide.layout,
    slide.components.map((component, index) => elementFromComponent(component, index + 1))
  );
  const evidenceComponent = slide.components.find((component) => component.type === "evidence-footer");

  for (const component of slide.components) {
    const requiresReview = component.sequence !== undefined
      || component.effect !== undefined
      || component.morphId !== undefined
      || component.type === "visualizer"
      || component.type === "weight-simulator";
    if (requiresReview) {
      diagnostics.push({
        code: "migration-review-required",
        severity: "warning",
        slideId: slide.id,
        componentId: component.id,
        message: `Thành phần "${component.id}" giữ nguyên payload V1 nhưng cần review interaction hoặc motion trong V2.`
      });
    }
  }

  const isDark = slide.layout === "cover" || slide.layout === "closing" || slide.variant === "cinematic";
  return {
    id: slide.id,
    name: componentSummary(slide.components[0]!),
    purpose: slide.layout,
    masterId: slide.masterId,
    background: {
      layers: [{
        id: "base",
        type: "solid" as const,
        color: isDark ? "#15171a" : "#ffffff",
        opacity: 1
      }]
    },
    transition: slide.transition,
    notes: slide.notes,
    evidence: evidenceComponent?.type === "evidence-footer"
      ? { source: evidenceComponent.props.source, status: "unverified" as const }
      : undefined,
    elements
  };
}

export function migrateDeckV1ToV2(deck: DeckDocument): DeckMigrationResult {
  const diagnostics: DeckMigrationDiagnostic[] = [];
  const candidate = {
    schemaVersion: 2 as const,
    id: deck.id,
    revision: 1,
    title: deck.title,
    locale: deck.locale,
    canvas: { width: 1280 as const, height: 720 as const, unit: "px" as const },
    theme: {
      id: deck.themeId,
      tokens: {
        ...(deck.theme ? cloneRecord(deck.theme) : {}),
        legacyThemeId: deck.themeId
      }
    },
    assets: (deck.assets ?? []).map((asset) => ({
      id: asset.id,
      type: "image" as const,
      src: asset.src,
      mediaType: asset.mediaType,
      width: asset.width,
      height: asset.height,
      source: asset.source
    })),
    slides: deck.slides.map((slide) => migrateSlide(slide, diagnostics))
  };

  const parsed = DeckDocumentV2Schema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      diagnostics: [
        ...diagnostics,
        ...parsed.error.issues.map((issue) => ({
          code: "migration-invalid-result" as const,
          severity: "error" as const,
          message: `Migration tạo tài liệu không hợp lệ tại ${issue.path.join(".") || "document"}: ${issue.message}`
        }))
      ]
    };
  }

  return { ok: true, deck: parsed.data, diagnostics };
}
