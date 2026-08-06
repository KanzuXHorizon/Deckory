export {
  assertCatalogIntegrity,
  deckBlueprintById,
  deckBlueprints,
  slideMasterById,
  slideMasters,
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
export {
  compatibleSlideMasters,
  getSlideMaster,
  recommendSlideMaster
} from "./masters";
export { recommendTemplate } from "./recommend";
export { searchSlideRecipes } from "./search";
export { createTeamShowcaseSlides } from "./team-showcase";
export { validateTemplateInput } from "./validate-input";
export { createDeckV2FromTemplate } from "./v2/instantiate";
export { migrateDeckV1ToV2 } from "./v2/migrate";
export type { CreateDeckV2FromTemplateResult } from "./v2/instantiate";
export type { V2MigrationDiagnostic, V2MigrationResult } from "./v2/migrate";
export { evaluateV2MigrationAcceptance } from "./v2/migration-acceptance";
export type { MigrationAcceptanceIssue, MigrationAcceptanceReport } from "./v2/migration-acceptance";
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
  SlideCompositionFamily,
  SlideMasterDensity,
  SlideMasterPreset,
  SlideMasterRecommendation,
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
