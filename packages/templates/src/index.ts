export {
  assertCatalogIntegrity,
  deckBlueprintById,
  deckBlueprints,
  slideRecipeById,
  slideRecipes,
  visualStyleById,
  visualStyles
} from "./catalog/index";
export {
  createDeckFromTemplate,
  getDeckBlueprint,
  getSlideRecipe,
  getVisualStyle
} from "./instantiate";
export { recommendTemplate } from "./recommend";
export { searchSlideRecipes } from "./search";
export { createTeamShowcaseSlides } from "./team-showcase";
export { validateTemplateInput } from "./validate-input";
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
} from "./types";
export type {
  CreateTeamShowcaseSlidesInput,
  TeamShowcaseMember,
  TeamShowcaseRosterVariant,
  TeamShowcaseSlideMode
} from "./team-showcase";
