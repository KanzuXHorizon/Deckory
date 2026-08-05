import { deckBlueprintById, slideRecipeById } from "./catalog/index.js";
import type {
  CreateDeckFromTemplateInput,
  SlideRecipe,
  TemplateSlotKind
} from "./types.js";

export function createCompleteTemplateInput(
  blueprintId: string,
  styleId: string
): CreateDeckFromTemplateInput {
  const blueprint = deckBlueprintById.get(blueprintId);
  if (!blueprint) throw new Error(`Unknown blueprint fixture ${blueprintId}`);
  const slides = [];

  for (const step of blueprint.steps) {
    const count = step.minRepeats ?? (step.required ? 1 : 0);
    for (let index = 0; index < count; index += 1) {
      const recipe = slideRecipeById.get(step.recipeId);
      if (!recipe) throw new Error(`Unknown recipe fixture ${step.recipeId}`);
      slides.push({
        stepId: step.id,
        ...(count > 1 ? { id: `${step.id}-${index + 1}` } : {}),
        slots: fixtureSlots(recipe),
        notes: `Chuyển vào slide bằng vai trò: ${step.role} Chốt một ý chính và dẫn sang bước tiếp theo.`
      });
    }
  }

  return {
    id: `${blueprintId}-fixture`,
    title: `Deck fixture — ${blueprint.name}`,
    blueprintId,
    styleId,
    slides
  };
}

export function fixtureSlots(recipe: SlideRecipe): Record<string, unknown> {
  return Object.fromEntries(recipe.slots.map((slot) => [slot.id, fixtureValue(slot.kind)]));
}

export function fixtureValue(kind: TemplateSlotKind): unknown {
  switch (kind) {
    case "heading":
      return { eyebrow: "DECKORY TEMPLATE", title: "Một kết luận rõ ràng dẫn dắt quyết định", description: "Nội dung fixture dùng để kiểm chứng template, không phải số liệu sản phẩm thực tế." };
    case "statement":
      return { quote: "Một câu chuyện tốt chỉ giữ lại điều giúp khán giả hiểu và quyết định.", byline: "Deckory template fixture" };
    case "metrics":
      return [
        { value: "92%", label: "Cấu trúc hợp lệ", note: "Dữ liệu fixture minh hoạ", tone: "cobalt" },
        { value: "0", label: "Lỗi clipping chấp nhận", note: "Mục tiêu quality gate", tone: "teal" }
      ];
    case "comparison":
      return {
        left: { eyebrow: "HIỆN TRẠNG", title: "Rời rạc", points: ["Nội dung khó review", "Lỗi chỉ thấy ở cuối"] },
        right: { eyebrow: "MỤC TIÊU", title: "Có cấu trúc", points: ["Contract dùng chung", "Validation trước Presenter"] }
      };
    case "process-steps":
      return [
        { title: "Khai báo", note: "Đưa nội dung vào semantic slot.", icon: "data" },
        { title: "Kiểm tra", note: "Xác minh contract và evidence.", icon: "system" },
        { title: "Trình chiếu", note: "Dùng cùng renderer đã kiểm chứng.", icon: "sparkle" }
      ];
    case "architecture-layers":
      return [
        { label: "AUTHORING", items: ["Template input", "Typed slots"] },
        { label: "SOURCE OF TRUTH", items: ["DeckDocument"], accent: true },
        { label: "OUTPUT", items: ["Studio", "Presenter"] }
      ];
    case "chart":
      return {
        title: "Mức độ sẵn sàng của deck fixture",
        unit: "điểm / 100",
        variant: "bar",
        showValues: true,
        values: [
          { label: "Cấu trúc", value: 92, highlight: true },
          { label: "Khả năng đọc", value: 88 },
          { label: "Khả năng tiếp cận", value: 96, highlight: true }
        ]
      };
    case "table":
      return {
        title: "So sánh contract",
        columns: ["Tiêu chí", "Trước", "Sau"],
        rows: [
          { cells: ["Schema", "Record tự do", "Typed union"], highlight: true },
          { cells: ["Validation", "Muộn", "Trước Presenter"] }
        ],
        note: "Dữ liệu fixture minh hoạ / Deckory template validation"
      };
    case "code":
      return {
        title: "Kiểm tra document trước Presenter",
        language: "typescript",
        code: "const result = validateDeck(deck);\nif (!result.ok) return result.diagnostics;",
        caption: "Validation là ranh giới trước khi trình chiếu.",
        showLineNumbers: true,
        highlightLines: [1, 2]
      };
    case "insight":
      return { label: "KẾT LUẬN", title: "Contract giảm sai khác giữa các bề mặt", description: "Studio, Preview và Presenter cùng đọc một nguồn dữ liệu đã validate.", metric: "1 AST", tone: "teal" };
    case "evidence":
      return { source: "Dữ liệu fixture minh hoạ / Deckory template validation" };
  }
}
