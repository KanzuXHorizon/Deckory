import type {
  DeckDocument,
  DeckTheme,
  ElementEffect,
  Slide,
  SlideBackground,
  SlideComponent,
  SlideTransition
} from "@deckory/schema";

export type TemplateScenario =
  | "general"
  | "executive"
  | "pitch"
  | "product"
  | "qbr"
  | "technical"
  | "academic"
  | "training"
  | "case-study"
  | "proposal";

export type TemplateAudience =
  | "general"
  | "leadership"
  | "investor"
  | "customer"
  | "technical"
  | "academic"
  | "student"
  | "team";

export type EvidenceLevel = "illustrative" | "internal" | "sourced" | "defense";
export type ContentIntensity = "low" | "medium" | "high";
export type TemplateTone = "restrained" | "professional" | "analytical" | "bold" | "academic";

export type TemplateSlotKind =
  | "heading"
  | "statement"
  | "metrics"
  | "comparison"
  | "process-steps"
  | "architecture-layers"
  | "chart"
  | "table"
  | "code"
  | "insight"
  | "diagram"
  | "evidence";

export type TemplateSlot = {
  id: string;
  label: string;
  kind: TemplateSlotKind;
  required: boolean;
  maxItems?: number;
  maxLength?: number;
};

export type RecipeComponentType =
  | "heading"
  | "statement"
  | "metric-grid"
  | "comparison"
  | "process"
  | "architecture"
  | "chart"
  | "table"
  | "code"
  | "insight"
  | "team-showcase"
  | "media-showcase"
  | "diagram"
  | "evidence-footer";

export type RecipeComponentSpec = {
  id: string;
  type: RecipeComponentType;
  slotId: string;
  sequence?: number;
  effect?: ElementEffect;
  morphId?: string;
};

export type VisualStylePreset = {
  id: string;
  name: string;
  description: string;
  theme: DeckTheme;
  scenarios: readonly TemplateScenario[];
  audiences: readonly TemplateAudience[];
  tones: readonly TemplateTone[];
  dials: {
    narrativeVariance: number;
    motionIntensity: number;
    visualDensity: number;
    evidenceRigor: number;
  };
  compositionGuidance: readonly string[];
  prohibitedPatterns: readonly string[];
};

export type SlideCompositionFamily =
  | "hero"
  | "cinematic"
  | "editorial"
  | "asymmetric"
  | "evidence"
  | "flow"
  | "system"
  | "gallery"
  | "decision"
  | "closing";

export type SlideMasterDensity = "sparse" | "balanced" | "dense";

export type SlideMasterPreset = {
  id: string;
  name: string;
  description: string;
  role: string;
  layout: Slide["layout"];
  variant: NonNullable<Slide["variant"]>;
  background: SlideBackground;
  transition: SlideTransition;
  compositionFamily: SlideCompositionFamily;
  density: SlideMasterDensity;
  componentEffects: Readonly<Partial<Record<SlideComponent["type"], ElementEffect>>>;
  safeArea: {
    horizontal: number;
    vertical: number;
    footer: number;
  };
  useWhen: readonly string[];
  avoidWhen: readonly string[];
};

export type SlideMasterRecommendation = {
  master: SlideMasterPreset;
  reasons: readonly string[];
  score: number;
};

export type SlideRecipeCategory =
  | "opening"
  | "narrative"
  | "business"
  | "data"
  | "comparison"
  | "process"
  | "technical"
  | "academic"
  | "product";

export type SlideRecipe = {
  id: string;
  name: string;
  category: SlideRecipeCategory;
  purpose: string;
  layout: Slide["layout"];
  variant?: Slide["variant"];
  transition?: SlideTransition;
  components: readonly RecipeComponentSpec[];
  slots: readonly TemplateSlot[];
  tags: readonly string[];
  evidence: "none" | "recommended" | "required";
  useWhen: readonly string[];
  avoidWhen: readonly string[];
};

export type BlueprintStep = {
  id: string;
  recipeId: string;
  role: string;
  required: boolean;
  minRepeats?: number;
  maxRepeats?: number;
};

export type DeckBlueprint = {
  id: string;
  name: string;
  description: string;
  scenario: TemplateScenario;
  audiences: readonly TemplateAudience[];
  durationMinutes: readonly [number, number];
  steps: readonly BlueprintStep[];
};

export type TemplateRequest = {
  scenario?: TemplateScenario;
  audience?: TemplateAudience;
  evidenceLevel?: EvidenceLevel;
  dataIntensity?: ContentIntensity;
  technicalDepth?: ContentIntensity;
  tone?: TemplateTone;
  durationMinutes?: number;
};

export type TemplateRecommendation = {
  blueprint: DeckBlueprint;
  style: VisualStylePreset;
  reasons: readonly string[];
  score: number;
};

export type TemplateSlideInput = {
  stepId: string;
  recipeId?: string;
  id?: string;
  slots: Readonly<Record<string, unknown>>;
  notes?: string;
};

export type CreateDeckFromTemplateInput = {
  id: string;
  title: string;
  blueprintId: string;
  styleId: string;
  slides: readonly TemplateSlideInput[];
};

export type TemplateDiagnosticCode =
  | "not-found"
  | "missing-step"
  | "repeat-limit"
  | "missing-slot"
  | "invalid-slot"
  | "evidence-required"
  | "deck-invalid";

export type TemplateDiagnostic = {
  code: TemplateDiagnosticCode;
  message: string;
  remediation: string;
  blueprintId?: string;
  recipeId?: string;
  stepId?: string;
  slideId?: string;
  slotId?: string;
};

export type TemplateResult<T> =
  | { ok: true; value: T; diagnostics: readonly TemplateDiagnostic[] }
  | { ok: false; diagnostics: readonly TemplateDiagnostic[] };

export type ResolvedTemplateSlide = TemplateSlideInput & {
  recipe: SlideRecipe;
  step: BlueprintStep;
};

export type ResolvedTemplateInput = {
  input: CreateDeckFromTemplateInput;
  blueprint: DeckBlueprint;
  style: VisualStylePreset;
  slides: readonly ResolvedTemplateSlide[];
};

export type CreatedTemplateDeck = DeckDocument;
