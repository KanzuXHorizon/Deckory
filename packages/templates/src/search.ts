import { slideRecipes } from "./catalog/index.js";
import type { SlideRecipe } from "./types.js";

export function searchSlideRecipes(query: string, limit = 12): SlideRecipe[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery || limit <= 0) return [];
  const expandedQuery = expandAliases(normalizedQuery);
  const queryTerms = new Set(expandedQuery.split(/\s+/).filter((term) => term.length > 1));

  return slideRecipes
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, expandedQuery, queryTerms) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.recipe.id.localeCompare(right.recipe.id))
    .slice(0, limit)
    .map((entry) => entry.recipe);
}

function scoreRecipe(recipe: SlideRecipe, query: string, queryTerms: ReadonlySet<string>): number {
  const id = normalize(recipe.id);
  const name = normalize(recipe.name);
  const purpose = normalize(recipe.purpose);
  const category = normalize(recipe.category);
  const idTerms = tokenSet(id);
  const nameTerms = tokenSet(name);
  const purposeTerms = tokenSet(purpose);
  const tagTerms = tokenSet(recipe.tags.map(normalize).join(" "));
  const useWhenTerms = tokenSet(recipe.useWhen.map(normalize).join(" "));
  let score = 0;

  if (query === id) score += 100;
  else if (id.includes(query)) score += 45;
  if (query === name) score += 80;
  else if (name.includes(query)) score += 35;
  if (category === query || category.includes(query)) score += 20;

  for (const term of queryTerms) {
    if (idTerms.has(term)) score += 18;
    if (nameTerms.has(term)) score += 16;
    if (tagTerms.has(term)) score += 25;
    if (purposeTerms.has(term)) score += 8;
    if (useWhenTerms.has(term)) score += 4;
  }

  return score;
}

function tokenSet(value: string): ReadonlySet<string> {
  return new Set(value.split(/\s+/).filter((term) => term.length > 1));
}

function expandAliases(query: string): string {
  return query
    .replace(/\bkien truc\b/g, "architecture")
    .replace(/\bhe thong\b/g, "system")
    .replace(/\bdu lieu\b/g, "data")
    .replace(/\bquy trinh\b/g, "process")
    .replace(/\bso sanh\b/g, "comparison");
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
