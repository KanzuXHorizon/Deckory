import { validateDeck, type DeckDocument, type Slide, type SlideComponent } from "@deckory/schema";
import { deckBlueprintById, slideRecipeById, visualStyleById } from "./catalog/index";
import type {
  CreateDeckFromTemplateInput,
  TemplateDiagnostic,
  TemplateResult
} from "./types";
import { validateTemplateInput } from "./validate-input";

function slug(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "slide";
}

function uniqueStableId(base: string, counts: Map<string, number>): string {
  const stableBase = slug(base);
  const count = (counts.get(stableBase) ?? 0) + 1;
  counts.set(stableBase, count);
  return count === 1 ? stableBase : `${stableBase}-${count}`;
}

function componentFromSlot(
  id: string,
  type: SlideComponent["type"],
  value: unknown,
  sequence: number | undefined,
  effect: SlideComponent["effect"],
  morphId: string | undefined
): SlideComponent {
  const props = (() => {
    switch (type) {
      case "metric-grid": return { metrics: value };
      case "process": return { steps: value };
      case "architecture": return { layers: value };
      default: return value;
    }
  })();

  return {
    id,
    type,
    props,
    ...(sequence === undefined || type === "evidence-footer" ? {} : { sequence }),
    ...(effect === undefined ? {} : { effect }),
    ...(morphId === undefined ? {} : { morphId })
  } as SlideComponent;
}

function deckDiagnostic(item: { slideId?: string; componentId?: string; propertyPath: string; message: string; remediation: string }): TemplateDiagnostic {
  return {
    code: "deck-invalid",
    message: `${item.propertyPath}: ${item.message}`,
    remediation: item.remediation,
    ...(item.slideId ? { slideId: item.slideId } : {})
  };
}

export function createDeckFromTemplate(input: CreateDeckFromTemplateInput): TemplateResult<DeckDocument> {
  const validated = validateTemplateInput(input);
  if (!validated.ok) return validated;

  const slideIdCounts = new Map<string, number>();
  const slides: Slide[] = validated.value.slides.map((slideInput) => {
    const slideId = uniqueStableId(slideInput.id ?? slideInput.stepId, slideIdCounts);
    const componentIdCounts = new Map<string, number>();
    const components = slideInput.recipe.components.flatMap((componentSpec) => {
      const value = slideInput.slots[componentSpec.slotId];
      if (value === undefined) return [];
      return [componentFromSlot(
        uniqueStableId(componentSpec.id, componentIdCounts),
        componentSpec.type,
        value,
        componentSpec.sequence,
        componentSpec.effect,
        componentSpec.morphId
      )];
    });

    return {
      id: slideId,
      layout: slideInput.recipe.layout,
      ...(slideInput.recipe.variant === undefined ? {} : { variant: slideInput.recipe.variant }),
      ...(slideInput.recipe.transition === undefined ? {} : { transition: slideInput.recipe.transition }),
      ...(slideInput.notes === undefined ? {} : { notes: slideInput.notes }),
      components
    };
  });

  const deck: DeckDocument = {
    id: slug(input.id),
    version: 1,
    title: input.title.trim(),
    locale: "vi-VN",
    themeId: validated.value.style.id,
    theme: validated.value.style.theme,
    slides
  };
  const deckValidation = validateDeck(deck);
  if (!deckValidation.ok) {
    return { ok: false, diagnostics: deckValidation.diagnostics.map(deckDiagnostic) };
  }
  return { ok: true, value: deckValidation.deck, diagnostics: [] };
}

export function getVisualStyle(id: string) {
  return visualStyleById.get(id);
}

export function getSlideRecipe(id: string) {
  return slideRecipeById.get(id);
}

export function getDeckBlueprint(id: string) {
  return deckBlueprintById.get(id);
}
