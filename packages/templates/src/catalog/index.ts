import { SUPPORTED_COMPONENT_TYPES, SUPPORTED_LAYOUTS, DeckThemeSchema } from "@deckory/schema";
import type { DeckBlueprint, SlideRecipe, VisualStylePreset } from "../types";
import { deckBlueprints } from "./blueprints";
import { slideRecipes } from "./recipes";
import { visualStyles } from "./styles";

export { deckBlueprints, slideRecipes, visualStyles };

export const visualStyleById = new Map<string, VisualStylePreset>(visualStyles.map((item) => [item.id, item]));
export const slideRecipeById = new Map<string, SlideRecipe>(slideRecipes.map((item) => [item.id, item]));
export const deckBlueprintById = new Map<string, DeckBlueprint>(deckBlueprints.map((item) => [item.id, item]));

const stableId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const layoutComponents: Record<SlideRecipe["layout"], ReadonlySet<SlideRecipe["components"][number]["type"]>> = {
  cover: new Set(["heading", "evidence-footer"]),
  statement: new Set(["statement", "heading", "evidence-footer"]),
  split: new Set(["heading", "metric-grid", "code", "insight", "evidence-footer"]),
  dashboard: new Set(["heading", "metric-grid", "chart", "table", "insight", "evidence-footer"]),
  comparison: new Set(["heading", "comparison", "table", "evidence-footer"]),
  process: new Set(["heading", "process", "evidence-footer"]),
  architecture: new Set(["heading", "architecture", "code", "insight", "evidence-footer"]),
  data: new Set(["heading", "chart", "table", "code", "metric-grid", "insight", "evidence-footer"]),
  closing: new Set(["heading", "statement", "evidence-footer"])
};

export function assertCatalogIntegrity(): void {
  assertUniqueIds("visual style", visualStyles);
  assertUniqueIds("slide recipe", slideRecipes);
  assertUniqueIds("deck blueprint", deckBlueprints);

  for (const style of visualStyles) {
    if (!DeckThemeSchema.safeParse(style.theme).success) {
      throw new Error(`Visual style ${style.id} uses an unsupported DeckTheme.`);
    }
    for (const [dial, value] of Object.entries(style.dials)) {
      if (!Number.isInteger(value) || value < 1 || value > 10) {
        throw new Error(`Visual style ${style.id} has invalid ${dial}: ${value}.`);
      }
    }
    if (style.compositionGuidance.length < 3 || style.prohibitedPatterns.length < 3) {
      throw new Error(`Visual style ${style.id} needs complete composition and anti-pattern guidance.`);
    }
  }

  for (const recipe of slideRecipes) {
    if (!(SUPPORTED_LAYOUTS as readonly string[]).includes(recipe.layout)) {
      throw new Error(`Slide recipe ${recipe.id} references unsupported layout ${recipe.layout}.`);
    }
    const slotIds = new Set(recipe.slots.map((slot) => slot.id));
    assertUniqueIds(`slot in recipe ${recipe.id}`, recipe.slots);
    assertUniqueIds(`component in recipe ${recipe.id}`, recipe.components);

    let lastSequence = 0;
    for (const component of recipe.components) {
      if (!(SUPPORTED_COMPONENT_TYPES as readonly string[]).includes(component.type)) {
        throw new Error(`Slide recipe ${recipe.id} references unsupported component ${component.type}.`);
      }
      if (!layoutComponents[recipe.layout].has(component.type)) {
        throw new Error(`Slide recipe ${recipe.id} cannot use ${component.type} with ${recipe.layout}.`);
      }
      if (!slotIds.has(component.slotId)) {
        throw new Error(`Slide recipe ${recipe.id} component ${component.id} references missing slot ${component.slotId}.`);
      }
      if (component.sequence !== undefined) {
        if (component.sequence <= lastSequence) {
          throw new Error(`Slide recipe ${recipe.id} has a non-increasing reveal sequence.`);
        }
        lastSequence = component.sequence;
      }
    }

    if (recipe.evidence === "required" && !recipe.slots.some((slot) => slot.kind === "evidence" && slot.required)) {
      throw new Error(`Slide recipe ${recipe.id} requires evidence but has no required evidence slot.`);
    }
  }

  const recipeById = new Map(slideRecipes.map((recipe) => [recipe.id, recipe]));
  for (const blueprint of deckBlueprints) {
    if (blueprint.steps.length < 6 || blueprint.steps.length > 12) {
      throw new Error(`Deck blueprint ${blueprint.id} must contain between 6 and 12 steps.`);
    }
    assertUniqueIds(`step in blueprint ${blueprint.id}`, blueprint.steps);

    for (const step of blueprint.steps) {
      const recipe = recipeById.get(step.recipeId);
      if (!recipe) throw new Error(`Deck blueprint ${blueprint.id} references missing recipe ${step.recipeId}.`);
      const minRepeats = step.minRepeats ?? (step.required ? 1 : 0);
      const maxRepeats = step.maxRepeats ?? 1;
      if (minRepeats < 0 || maxRepeats < minRepeats || maxRepeats > 4) {
        throw new Error(`Deck blueprint ${blueprint.id} step ${step.id} has invalid repeat limits.`);
      }
      if (step.required && maxRepeats === 0) {
        throw new Error(`Deck blueprint ${blueprint.id} required step ${step.id} cannot have maxRepeats 0.`);
      }
    }

    const firstRecipe = recipeById.get(blueprint.steps[0]!.recipeId)!;
    const lastRecipe = recipeById.get(blueprint.steps.at(-1)!.recipeId)!;
    if (firstRecipe.category !== "opening") {
      throw new Error(`Deck blueprint ${blueprint.id} must begin with an opening recipe.`);
    }
    if (!(lastRecipe.layout === "closing" || lastRecipe.id === "recommendation" || lastRecipe.id === "closing-action")) {
      throw new Error(`Deck blueprint ${blueprint.id} must end with a resolution or action recipe.`);
    }
  }
}

function assertUniqueIds(label: string, values: readonly { id: string }[]): void {
  const ids = new Set<string>();
  for (const item of values) {
    if (!stableId.test(item.id)) throw new Error(`${label} ID ${item.id} is not stable kebab-case.`);
    if (ids.has(item.id)) throw new Error(`Duplicate ${label} ID: ${item.id}.`);
    ids.add(item.id);
  }
}

assertCatalogIntegrity();
