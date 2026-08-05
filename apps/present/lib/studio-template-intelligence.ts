import type {
  DeckDocument,
  DeckTheme,
  Slide,
  SlideComponent
} from "@deckory/schema";
import type {
  SlideRecipe,
  SlideRecipeCategory,
  VisualStylePreset
} from "@deckory/templates";
import { createComponent } from "./component-catalog";

const DEFAULT_THEME: DeckTheme = {
  preset: "editorial-light",
  accent: "cobalt",
  typography: "editorial",
  density: "comfortable"
};

export function filterStudioRecipes(
  recipes: readonly SlideRecipe[],
  query: string,
  category: SlideRecipeCategory | "all" = "all"
): SlideRecipe[] {
  const normalizedQuery = expandAliases(normalize(query));
  const terms = normalizedQuery.split(" ").filter(Boolean);

  return recipes.filter((recipe) => {
    if (category !== "all" && recipe.category !== category) return false;
    if (terms.length === 0) return true;

    const haystack = normalize([
      recipe.id,
      recipe.name,
      recipe.category,
      recipe.purpose,
      ...recipe.tags,
      ...recipe.useWhen,
      ...recipe.avoidWhen
    ].join(" "));

    return terms.every((term) => haystack.includes(term));
  });
}

export function createSlideFromRecipe(
  recipe: SlideRecipe,
  existingSlideIds: readonly string[]
): Slide {
  const components = recipe.components.map((spec) => {
    const created = createComponent(spec.type, spec.id);
    const component = applyRecipeDefaults(created, recipe);

    return {
      ...component,
      ...(spec.sequence !== undefined ? { sequence: spec.sequence } : {}),
      ...(spec.effect ? { effect: { ...spec.effect } } : {}),
      ...(spec.morphId ? { morphId: spec.morphId } : {})
    } as SlideComponent;
  });

  return {
    id: nextStableId(recipe.id, existingSlideIds),
    layout: recipe.layout,
    ...(recipe.variant ? { variant: recipe.variant } : {}),
    ...(recipe.transition ? { transition: { ...recipe.transition } } : {}),
    notes: buildRecipeNotes(recipe),
    components
  };
}

export function applyVisualStyle(
  deck: DeckDocument,
  style: VisualStylePreset
): DeckDocument {
  return {
    ...deck,
    themeId: style.id,
    theme: { ...style.theme }
  };
}

export function customizeDeckTheme(
  deck: DeckDocument,
  patch: Partial<DeckTheme>
): DeckDocument {
  const theme = { ...(deck.theme ?? DEFAULT_THEME), ...patch };
  const baseThemeId = deck.themeId.replace(/-custom$/, "");

  return {
    ...deck,
    themeId: `${baseThemeId}-custom`,
    theme
  };
}

function applyRecipeDefaults(component: SlideComponent, recipe: SlideRecipe): SlideComponent {
  switch (component.type) {
    case "heading":
      return {
        ...component,
        props: {
          ...component.props,
          eyebrow: `CÔNG THỨC / ${categoryLabel(recipe.category).toLocaleUpperCase("vi-VN")}`,
          title: recipe.name,
          description: recipe.purpose
        }
      };
    case "statement":
      return {
        ...component,
        props: {
          quote: recipe.purpose,
          byline: `Công thức ${recipe.name}`
        }
      };
    case "chart":
      return {
        ...component,
        props: {
          ...component.props,
          title: recipe.name,
          unit: "Dữ liệu minh hoạ",
          variant: chartVariantFor(recipe)
        }
      };
    case "insight":
      return {
        ...component,
        props: {
          ...component.props,
          label: "KẾT LUẬN",
          title: recipe.purpose,
          description: "Thay nội dung minh hoạ bằng kết luận dựa trên dữ liệu và nguồn đã kiểm chứng."
        }
      };
    case "evidence-footer":
      return {
        ...component,
        props: {
          ...component.props,
          source: `Nguồn cần bổ sung · ${recipe.name}`
        }
      };
    default:
      return component;
  }
}

function chartVariantFor(recipe: SlideRecipe): Extract<SlideComponent, { type: "chart" }>["props"]["variant"] {
  const tags = new Set(recipe.tags.map((tag) => normalize(tag)));
  if (recipe.id === "trend-over-time" || tags.has("line") || tags.has("trend")) return "line";
  if (recipe.id === "part-to-whole" || tags.has("donut") || tags.has("share")) return "donut";
  return "bar";
}

function buildRecipeNotes(recipe: SlideRecipe): string {
  const useWhen = recipe.useWhen[0] ?? recipe.purpose;
  const avoidWhen = recipe.avoidWhen[0] ?? "Khi chưa có đủ nội dung hoặc bằng chứng phù hợp.";
  return `Công thức ${recipe.name}. Dùng khi: ${useWhen} Tránh khi: ${avoidWhen}`;
}

function nextStableId(seed: string, existingIds: readonly string[]): string {
  const ids = new Set(existingIds);
  if (!ids.has(seed)) return seed;

  let suffix = 2;
  while (ids.has(`${seed}-${suffix}`)) suffix += 1;
  return `${seed}-${suffix}`;
}

function categoryLabel(category: SlideRecipeCategory): string {
  const labels: Record<SlideRecipeCategory, string> = {
    opening: "Mở đầu",
    narrative: "Mạch kể",
    business: "Kinh doanh",
    data: "Dữ liệu",
    comparison: "So sánh",
    process: "Quy trình",
    technical: "Kỹ thuật",
    academic: "Học thuật",
    product: "Sản phẩm"
  };
  return labels[category];
}

function expandAliases(value: string): string {
  return value
    .replace(/\bxu huong\b/g, "trend")
    .replace(/\bdu lieu\b/g, "data")
    .replace(/\bkien truc\b/g, "architecture")
    .replace(/\bquy trinh\b/g, "process")
    .replace(/\bso sanh\b/g, "comparison")
    .replace(/\bmo dau\b/g, "opening");
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
