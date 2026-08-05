import { describe, expect, it } from "vitest";
import { validateDeck, type DeckDocument, type SlideComponent } from "@deckory/schema";
import {
  assertCatalogIntegrity,
  deckBlueprints,
  slideRecipes,
  visualStyles
} from "./index.js";

const stableIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sampleProps(type: SlideComponent["type"]): SlideComponent["props"] {
  switch (type) {
    case "heading":
      return { title: "Kết luận rõ ràng" };
    case "statement":
      return { quote: "Một thông điệp có thể kiểm chứng." };
    case "metric-grid":
      return { metrics: [{ value: "92%", label: "Mức hoàn thành", note: "Dữ liệu fixture minh hoạ" }] };
    case "comparison":
      return {
        left: { eyebrow: "TRƯỚC", title: "Trạng thái cũ", points: ["Điểm A"] },
        right: { eyebrow: "SAU", title: "Trạng thái mới", points: ["Điểm B"] }
      };
    case "process":
      return { steps: [{ title: "Bước 1", note: "Mô tả", icon: "data" }, { title: "Bước 2", note: "Mô tả", icon: "system" }] };
    case "architecture":
      return { layers: [{ label: "INPUT", items: ["Nguồn"] }, { label: "OUTPUT", items: ["Kết quả"] }] };
    case "chart":
      return { title: "Tín hiệu", unit: "điểm", values: [{ label: "A", value: 72 }] };
    case "table":
      return { title: "So sánh", columns: ["Tiêu chí", "Giá trị"], rows: [{ cells: ["A", "B"] }] };
    case "code":
      return { title: "Contract", language: "ts", code: "const value = 1;" };
    case "insight":
      return { label: "KẾT LUẬN", title: "Insight", description: "Diễn giải có ý nghĩa." };
    case "team-showcase":
      return { members: [{ id: "member-one", name: "Nguyễn Văn A", role: "Product Designer" }] };
    case "visualizer":
      return { variant: "network", items: [{ id: "source", label: "Nguồn" }, { id: "result", label: "Kết quả", parentId: "source" }] };
    case "evidence-footer":
      return { source: "Dữ liệu fixture minh hoạ" };
  }
}

describe("template catalog integrity", () => {
  it("provides the complete initial catalog", () => {
    expect(visualStyles).toHaveLength(6);
    expect(slideRecipes.length).toBeGreaterThanOrEqual(30);
    expect(deckBlueprints).toHaveLength(10);
  });

  it("uses stable unique IDs", () => {
    for (const collection of [visualStyles, slideRecipes, deckBlueprints]) {
      const ids = collection.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => stableIdPattern.test(id))).toBe(true);
    }
  });

  it("passes the fail-fast integrity assertion", () => {
    expect(() => assertCatalogIntegrity()).not.toThrow();
  });

  it("maps every recipe to a Deckory-valid layout/component composition", () => {
    for (const recipe of slideRecipes) {
      const deck: DeckDocument = {
        id: `recipe-${recipe.id}`,
        version: 1,
        title: recipe.name,
        locale: "vi-VN",
        themeId: "catalog-test",
        slides: [{
          id: "sample",
          layout: recipe.layout,
          ...(recipe.variant === undefined ? {} : { variant: recipe.variant }),
          components: recipe.components.map((component) => ({
            id: component.id,
            type: component.type,
            props: sampleProps(component.type),
            ...(component.sequence === undefined ? {} : { sequence: component.sequence })
          } as SlideComponent))
        }]
      };
      const result = validateDeck(deck);
      expect(result.ok, `${recipe.id}: ${result.diagnostics.map((item) => item.message).join("; ")}`).toBe(true);
    }
  });

  it("references only existing recipes from blueprints", () => {
    const recipeIds = new Set(slideRecipes.map((recipe) => recipe.id));
    for (const blueprint of deckBlueprints) {
      expect(blueprint.steps.length).toBeGreaterThanOrEqual(6);
      expect(blueprint.steps.length).toBeLessThanOrEqual(12);
      expect(blueprint.steps.every((step) => recipeIds.has(step.recipeId))).toBe(true);
    }
  });
});
