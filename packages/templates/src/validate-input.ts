import { validateDeck, type SlideComponent } from "@deckory/schema";
import {
  deckBlueprintById,
  slideRecipeById,
  visualStyleById
} from "./catalog/index.js";
import type {
  CreateDeckFromTemplateInput,
  ResolvedTemplateInput,
  TemplateDiagnostic,
  TemplateResult,
  TemplateSlideInput
} from "./types.js";

export function validateTemplateInput(input: CreateDeckFromTemplateInput): TemplateResult<ResolvedTemplateInput> {
  const diagnostics: TemplateDiagnostic[] = [];
  const blueprint = deckBlueprintById.get(input.blueprintId);
  const style = visualStyleById.get(input.styleId);

  if (!blueprint) diagnostics.push(notFound("blueprint", input.blueprintId));
  if (!style) diagnostics.push(notFound("visual style", input.styleId));
  if (!blueprint || !style) return { ok: false, diagnostics };

  const stepById = new Map(blueprint.steps.map((step) => [step.id, step]));
  const grouped = new Map<string, TemplateSlideInput[]>();

  for (const slide of input.slides) {
    const step = stepById.get(slide.stepId);
    if (!step) {
      diagnostics.push({
        code: "not-found",
        message: `Không tìm thấy step ${slide.stepId} trong blueprint ${blueprint.id}.`,
        remediation: "Chọn một stepId có trong blueprint.",
        blueprintId: blueprint.id,
        stepId: slide.stepId,
        ...(slide.id ? { slideId: slide.id } : {})
      });
      continue;
    }
    grouped.set(step.id, [...(grouped.get(step.id) ?? []), slide]);
  }

  for (const step of blueprint.steps) {
    const count = grouped.get(step.id)?.length ?? 0;
    const minimum = step.minRepeats ?? (step.required ? 1 : 0);
    const maximum = step.maxRepeats ?? 1;
    if (count < minimum) {
      diagnostics.push({
        code: "missing-step",
        message: `Step ${step.id} cần ít nhất ${minimum} slide nhưng hiện có ${count}.`,
        remediation: `Bổ sung slide dùng recipe ${step.recipeId}.`,
        blueprintId: blueprint.id,
        recipeId: step.recipeId,
        stepId: step.id
      });
    }
    if (count > maximum) {
      diagnostics.push({
        code: "repeat-limit",
        message: `Step ${step.id} vượt giới hạn ${maximum} slide.`,
        remediation: "Giảm số slide hoặc chuyển nội dung sang step phù hợp khác.",
        blueprintId: blueprint.id,
        recipeId: step.recipeId,
        stepId: step.id
      });
    }
  }

  const resolvedSlides: ResolvedTemplateInput["slides"][number][] = [];
  for (const [index, slide] of input.slides.entries()) {
    const step = stepById.get(slide.stepId);
    if (!step) continue;
    const recipe = slideRecipeById.get(slide.recipeId ?? step.recipeId);
    if (!recipe) {
      diagnostics.push({
        code: "not-found",
        message: `Không tìm thấy recipe ${slide.recipeId ?? step.recipeId}.`,
        remediation: "Chọn recipe tồn tại trong catalog.",
        blueprintId: blueprint.id,
        recipeId: slide.recipeId ?? step.recipeId,
        stepId: step.id,
        ...(slide.id ? { slideId: slide.id } : {})
      });
      continue;
    }

    for (const slot of recipe.slots) {
      const value = slide.slots[slot.id];
      if (slot.required && value === undefined) {
        diagnostics.push({
          code: "missing-slot",
          message: `Thiếu nội dung bắt buộc cho slot ${slot.label}.`,
          remediation: `Cung cấp dữ liệu cho slot ${slot.id}.`,
          blueprintId: blueprint.id,
          recipeId: recipe.id,
          stepId: step.id,
          ...(slide.id ? { slideId: slide.id } : {}),
          slotId: slot.id
        });
      }
    }

    const components = recipe.components.flatMap((component) => {
      const value = slide.slots[component.slotId];
      if (value === undefined) return [];
      const candidate = toComponent(component, value);
      return candidate ? [candidate] : [];
    });

    const headingDiagnostic = validateHeadingVisualBudget({
      blueprintId: blueprint.id,
      recipe,
      stepId: step.id,
      slide,
      componentCount: components.length
    });
    if (headingDiagnostic) diagnostics.push(headingDiagnostic);

    if (components.length > 0) {
      const validation = validateDeck({
        id: input.id,
        version: 1,
        title: input.title,
        locale: "vi-VN",
        themeId: style.id,
        theme: style.theme,
        slides: [{
          id: slide.id ?? `slide-${index + 1}`,
          layout: recipe.layout,
          ...(recipe.variant ? { variant: recipe.variant } : {}),
          ...(recipe.transition ? { transition: recipe.transition } : {}),
          ...(slide.notes ? { notes: slide.notes } : {}),
          components
        }]
      });
      if (!validation.ok) {
        for (const item of validation.diagnostics) {
          diagnostics.push({
            code: "invalid-slot",
            message: item.message,
            remediation: item.remediation,
            blueprintId: blueprint.id,
            recipeId: recipe.id,
            stepId: step.id,
            ...(slide.id ? { slideId: slide.id } : {}),
            ...(() => {
              const slotId = recipe.components.find((component) => item.componentId === component.id)?.slotId;
              return slotId ? { slotId } : {};
            })()
          });
        }
      }
    }

    resolvedSlides.push({ ...slide, recipe, step });
  }

  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return {
    ok: true,
    value: { input, blueprint, style, slides: resolvedSlides },
    diagnostics
  };
}

function validateHeadingVisualBudget({
  blueprintId,
  recipe,
  stepId,
  slide,
  componentCount
}: {
  blueprintId: string;
  recipe: ResolvedTemplateInput["slides"][number]["recipe"];
  stepId: string;
  slide: TemplateSlideInput;
  componentCount: number;
}): TemplateDiagnostic | undefined {
  const headingSpec = recipe.components.find((component) => component.type === "heading");
  if (!headingSpec) return undefined;
  const value = slide.slots[headingSpec.slotId];
  if (typeof value !== "object" || value === null || !("title" in value) || typeof value.title !== "string") return undefined;

  const visibleComponents = recipe.components.filter((component) => component.type !== "evidence-footer").length;
  const layoutBudget = recipe.layout === "cover" || recipe.layout === "closing"
    ? 96
    : recipe.layout === "statement"
      ? 92
      : 88;
  const compositionBudget = visibleComponents >= 3 ? 84 : visibleComponents === 2 ? 112 : 180;
  const characterBudget = Math.min(layoutBudget, compositionBudget);
  const normalizedTitle = value.title.trim().replace(/\s+/g, " ");
  if (normalizedTitle.length <= characterBudget) return undefined;

  return {
    code: "invalid-slot",
    message: `Heading dài ${normalizedTitle.length} ký tự, vượt ngân sách ${characterBudget} ký tự của slide có ${componentCount} component.`,
    remediation: "Rút heading về một kết luận ngắn hơn hoặc tách nội dung sang slide tiếp theo để giữ chart, insight và visual trong safe area.",
    blueprintId,
    recipeId: recipe.id,
    stepId,
    ...(slide.id ? { slideId: slide.id } : {}),
    slotId: headingSpec.slotId
  };
}

function toComponent(
  spec: ResolvedTemplateInput["slides"][number]["recipe"]["components"][number],
  value: unknown
): SlideComponent | undefined {
  const props = (() => {
    switch (spec.type) {
      case "metric-grid": return { metrics: value };
      case "process": return { steps: value };
      case "architecture": return { layers: value };
      default: return value;
    }
  })();

  if (typeof props !== "object" || props === null) return undefined;
  return {
    id: spec.id,
    type: spec.type,
    props,
    ...(spec.sequence === undefined ? {} : { sequence: spec.sequence }),
    ...(spec.effect === undefined ? {} : { effect: spec.effect }),
    ...(spec.morphId === undefined ? {} : { morphId: spec.morphId })
  } as SlideComponent;
}

function notFound(kind: string, id: string): TemplateDiagnostic {
  return {
    code: "not-found",
    message: `Không tìm thấy ${kind} ${id}.`,
    remediation: `Chọn ${kind} tồn tại trong catalog.`
  };
}
