import { describe, expect, it } from "vitest";
import { deckBlueprintById, slideRecipeById } from "./catalog/index.js";
import type { CreateDeckFromTemplateInput, SlideRecipe, TemplateSlideInput } from "./types.js";
import { validateTemplateInput } from "./validate-input.js";

describe("validateTemplateInput", () => {
  it("returns actionable not-found diagnostics for unknown catalog references", () => {
    const result = validateTemplateInput({
      id: "unknown-template",
      title: "Deck lỗi",
      blueprintId: "missing-blueprint",
      styleId: "missing-style",
      slides: []
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === "not-found")).toHaveLength(2);
  });

  it("reports every missing required step and evidence slot in one pass", () => {
    const blueprint = deckBlueprintById.get("professional-presentation")!;
    const opening = blueprint.steps[0]!;
    const result = validateTemplateInput({
      id: "incomplete-deck",
      title: "Deck chưa đủ",
      blueprintId: blueprint.id,
      styleId: "modern-professional",
      slides: [{ stepId: opening.id, slots: slotsFor(slideRecipeById.get(opening.recipeId)!, false) }]
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "missing-step")).toBe(true);
    expect(result.diagnostics.some((item) => item.code === "missing-slot" || item.code === "evidence-required")).toBe(true);
  });

  it("rejects repeat-limit overflow and invalid slot shapes", () => {
    const blueprint = deckBlueprintById.get("professional-presentation")!;
    const evidenceStep = blueprint.steps.find((step) => step.id === "evidence")!;
    const repeated = Array.from({ length: 3 }, (_, index) => ({
      stepId: evidenceStep.id,
      id: `evidence-${index + 1}`,
      slots: { heading: { title: "Tín hiệu" }, chart: "not-a-chart", insight: { label: "KẾT LUẬN", title: "Tín hiệu", description: "Mô tả" }, evidence: { source: "Fixture" } }
    }));

    const result = validateTemplateInput({
      ...completeInput("professional-presentation", "modern-professional"),
      slides: [...completeInput("professional-presentation", "modern-professional").slides, ...repeated]
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "repeat-limit" && item.stepId === evidenceStep.id)).toBe(true);
    expect(result.diagnostics.some((item) => item.code === "invalid-slot" && item.slotId === "chart")).toBe(true);
  });

  it("resolves a complete blueprint into concrete recipe and step references", () => {
    const input = completeInput("professional-presentation", "modern-professional");
    const result = validateTemplateInput(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.blueprint.id).toBe(input.blueprintId);
    expect(result.value.style.id).toBe(input.styleId);
    expect(result.value.slides.length).toBeGreaterThanOrEqual(6);
    expect(result.value.slides.every((slide) => slide.recipe.id.length > 0 && slide.step.id.length > 0)).toBe(true);
  });
});

function completeInput(blueprintId: string, styleId: string): CreateDeckFromTemplateInput {
  const blueprint = deckBlueprintById.get(blueprintId)!;
  const slides: TemplateSlideInput[] = [];
  for (const step of blueprint.steps) {
    const count = step.minRepeats ?? (step.required ? 1 : 0);
    for (let index = 0; index < count; index += 1) {
      slides.push({
        stepId: step.id,
        ...(count > 1 ? { id: `${step.id}-${index + 1}` } : {}),
        slots: slotsFor(slideRecipeById.get(step.recipeId)!, true),
        notes: `Trình bày vai trò ${step.role}`
      });
    }
  }
  return { id: `${blueprintId}-fixture`, title: `Fixture ${blueprintId}`, blueprintId, styleId, slides };
}

function slotsFor(recipe: SlideRecipe, includeEvidence: boolean): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const slot of recipe.slots) {
    if (slot.kind === "evidence" && !includeEvidence) continue;
    result[slot.id] = valueFor(slot.kind);
  }
  return result;
}

function valueFor(kind: SlideRecipe["slots"][number]["kind"]): unknown {
  switch (kind) {
    case "heading": return { eyebrow: "DECKORY", title: "Một kết luận rõ ràng", description: "Nội dung fixture minh hoạ." };
    case "statement": return { quote: "Một thông điệp đủ ngắn để ghi nhớ.", byline: "Deckory fixture" };
    case "metrics": return [{ value: "92%", label: "Mức độ sẵn sàng", note: "Dữ liệu fixture minh hoạ", tone: "cobalt" }];
    case "comparison": return { left: { eyebrow: "TRƯỚC", title: "Hiện trạng", points: ["Thủ công"] }, right: { eyebrow: "SAU", title: "Mục tiêu", points: ["Có cấu trúc"] } };
    case "process-steps": return [{ title: "Chuẩn bị", note: "Xác định đầu vào", icon: "data" }, { title: "Kiểm tra", note: "Xác minh contract", icon: "system" }];
    case "architecture-layers": return [{ label: "INPUT", items: ["Nguồn dữ liệu"] }, { label: "OUTPUT", items: ["Presentation"], accent: true }];
    case "chart": return { title: "Tín hiệu chất lượng", unit: "điểm / 100", values: [{ label: "Cấu trúc", value: 92, highlight: true }] };
    case "table": return { title: "So sánh", columns: ["Tiêu chí", "Kết quả"], rows: [{ cells: ["Cấu trúc", "Đạt"] }], note: "Dữ liệu fixture minh hoạ" };
    case "code": return { title: "Validation", language: "typescript", code: "const result = validateDeck(deck);", caption: "Contract được kiểm tra trước Presenter." };
    case "insight": return { label: "KẾT LUẬN", title: "Cấu trúc giúp giảm lỗi", description: "Dữ liệu fixture minh hoạ.", metric: "+32%", tone: "teal" };
    case "evidence": return { source: "Dữ liệu fixture minh hoạ / Deckory template validation" };
  }
}
