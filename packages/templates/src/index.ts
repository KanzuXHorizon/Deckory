export {
  assertCatalogIntegrity,
  deckBlueprintById,
  deckBlueprints,
  slideRecipeById,
  slideRecipes,
  visualStyleById,
  visualStyles
} from "./catalog/index.js";
export { recommendTemplate } from "./recommend.js";
export { searchSlideRecipes } from "./search.js";
export { validateTemplateInput } from "./validate-input.js";
export type {
  BlueprintStep,
  ContentIntensity,
  CreateDeckFromTemplateInput,
  CreatedTemplateDeck,
  DeckBlueprint,
  EvidenceLevel,
  RecipeComponentSpec,
  RecipeComponentType,
  ResolvedTemplateInput,
  ResolvedTemplateSlide,
  SlideRecipe,
  SlideRecipeCategory,
  TemplateAudience,
  TemplateDiagnostic,
  TemplateDiagnosticCode,
  TemplateRecommendation,
  TemplateRequest,
  TemplateResult,
  TemplateScenario,
  TemplateSlideInput,
  TemplateSlot,
  TemplateSlotKind,
  TemplateTone,
  VisualStylePreset
} from "./types.js";
