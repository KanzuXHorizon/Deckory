import { describe, expect, it } from "vitest";
import { deckBlueprintById, slideRecipeById } from "./catalog/index.js";
import type { CreateDeckFromTemplateInput, SlideRecipe, TemplateSlot } from "./types.js";
import { validateTemplateInput } from "./validate-input.js";

function sampleFor(slot: TemplateSlot): unknown {
  switch (slot.kind) {
    case "heading":
      return { eyebrow: "DECKORY", title: "Một kết luận rõ ràng", description: "Nội dung fixture minh hoạ." };
    case "statement":
      return { quote: "Thông điệp có thể giải thích trong một lượt nói.", byline: "Deckory fixture" };
    case "metrics":
      return [{ value: "92%", label: "Mức hoàn thành", note: "Dữ liệu fixture minh hoạ", tone: "teal" }];
    case "comparison":
      return {
        left: { eyebrow: "TRƯỚC", title: "Trạng thái cũ", points: ["Friction cao"] },
        right: { eyebrow: "SAU", title: "Trạng thái mới", points: ["Luồng rõ ràng"] }
      };
    case "process-steps":
      return [
        { title: "Khám phá", note: "Xác định vấn đề", icon: "data" },
        { title: "Thực thi", note: "Kiểm định kết quả", icon: "system" }
      ];
    case "architecture-layers":
      return [
        { label: "INPUT", items: ["Nguồn dữ liệu"] },
        { label: "OUTPUT", items: ["Quyết định"], accent: true }
      ];
    case "chart":
      return { title: "Mức sẵn sàng", unit: "điểm", variant: "bar", values: [{ label: "Quality", value: 92, highlight: true }] };
    case "table":
      return { title: "So sánh", columns: ["Tiêu chí", "Kết quả"], rows: [{ cells: ["Quality", "Tốt"] }] };
    case "code":
      return { title: "Typed contract", language: "ts", code: "const ready = true;", showLineNumbers: true };
    case "insight":
      return { label: "KẾT LUẬN", title: "Quality gate đã rõ", description: "Mọi output đều được validate.", tone: "teal" };
    case "diagram":
      return {
        title: "Lộ trình production",
        summary: "Roadmap fixture gồm ba giai đoạn có thứ tự.",
        variant: "roadmap",
        items: [
          { id: "one", label: "Cấu trúc", value: "01", tone: "cobalt" },
          { id: "two", label: "Kiểm chứng", value: "02", tone: "teal", featured: true },
          { id: "three", label: "Production", value: "03", tone: "amber" }
        ]
      };
    case "evidence":
      return { source: "Dữ liệu fixture minh hoạ / Deckory template validation" };
  }
}

function completeSlots(recipe: SlideRecipe): Record<string, unknown> {
  return Object.fromEntries(recipe.slots.map((slot) => [slot.id, sampleFor(slot)]));
}

function validInput(): CreateDeckFromTemplateInput {
  const blueprint = deckBlueprintById.get("professional-presentation");
  if (!blueprint) throw new Error("Missing blueprint fixture");
  return {
    id: "professional-fixture",
    title: "Deck fixture chuyên nghiệp",
    blueprintId: blueprint.id,
    styleId: "modern-professional",
    slides: blueprint.steps
      .filter((step) => step.required)
      .flatMap((step) => {
        const recipe = slideRecipeById.get(step.recipeId);
        if (!recipe) throw new Error(`Missing recipe ${step.recipeId}`);
        const count = step.minRepeats ?? 1;
        return Array.from({ length: count }, () => ({ stepId: step.id, slots: completeSlots(recipe) }));
      })
  };
}

describe("validateTemplateInput", () => {
  it("resolves a complete template input", () => {
    const result = validateTemplateInput(validInput());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.blueprint.id).toBe("professional-presentation");
      expect(result.value.style.id).toBe("modern-professional");
      expect(result.value.slides.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("returns actionable not-found diagnostics", () => {
    const result = validateTemplateInput({ ...validInput(), blueprintId: "missing-blueprint", styleId: "missing-style" });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === "not-found")).toHaveLength(2);
  });

  it("reports missing required steps and slots together", () => {
    const input = validInput();
    const first = input.slides[0];
    if (!first) throw new Error("Missing slide fixture");
    const result = validateTemplateInput({
      ...input,
      slides: [{ ...first, slots: {} }]
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "missing-step")).toBe(true);
    expect(result.diagnostics.some((item) => item.code === "missing-slot")).toBe(true);
  });

  it("rejects repeat limits and invalid slot shapes", () => {
    const input = validInput();
    const blueprint = deckBlueprintById.get(input.blueprintId);
    const repeatable = blueprint?.steps.find((step) => (step.maxRepeats ?? 1) > 1);
    if (!repeatable) throw new Error("Missing repeatable step fixture");
    const recipe = slideRecipeById.get(repeatable.recipeId);
    if (!recipe) throw new Error("Missing recipe fixture");
    const repeated = Array.from({ length: (repeatable.maxRepeats ?? 1) + 1 }, () => ({
      stepId: repeatable.id,
      slots: { ...completeSlots(recipe), heading: { title: "" } }
    }));
    const result = validateTemplateInput({ ...input, slides: [...input.slides, ...repeated] });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "repeat-limit")).toBe(true);
    expect(result.diagnostics.some((item) => item.code === "invalid-slot")).toBe(true);
  });

  it("rejects headings that exceed the visual budget of a multi-component slide", () => {
    const input = validInput();
    const planIndex = input.slides.findIndex((slide) => slide.stepId === "plan");
    if (planIndex < 0) throw new Error("Missing plan slide fixture");
    const slides = [...input.slides];
    const planSlide = slides[planIndex];
    if (!planSlide) throw new Error("Missing plan slide fixture");
    slides[planIndex] = {
      ...planSlide,
      slots: {
        ...planSlide.slots,
        heading: {
          title: "Một heading quá dài vẫn có thể đúng schema nhưng sẽ chiếm quá nhiều dòng, đẩy chart và insight ra khỏi safe area của slide chuyên nghiệp."
        }
      }
    };

    const result = validateTemplateInput({ ...input, slides });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((item) => item.code === "invalid-slot" && item.slotId === "heading")).toBe(true);
  });
});
