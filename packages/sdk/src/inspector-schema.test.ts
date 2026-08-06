import { describe, expect, it } from "vitest";
import { z } from "zod";
import { registerDeckComponent } from "./component-registry";
import {
  createInspectorSchema,
  getInspectorValue,
  patchComponentProps
} from "./inspector-schema";

const inspector = createInspectorSchema([
  { id: "title", type: "text", label: "Tiêu đề", path: ["title"], maxLength: 80 },
  { id: "description", type: "multiline", label: "Mô tả", path: ["description"] },
  { id: "score", type: "number", label: "Điểm", path: ["score"], min: 0, max: 100 },
  { id: "visible", type: "boolean", label: "Hiển thị", path: ["visible"] },
  { id: "tone", type: "select", label: "Sắc thái", path: ["tone"], options: [{ label: "Tốt", value: "good" }] },
  { id: "density", type: "segmented", label: "Mật độ", path: ["density"], options: [{ label: "Gọn", value: "compact" }] },
  { id: "accent", type: "color-token", label: "Màu nhấn", path: ["accent"] },
  { id: "asset", type: "asset", label: "Tài nguyên", path: ["assetId"], acceptedTypes: ["image", "svg"] },
  { id: "rows", type: "data-table", label: "Dữ liệu", path: ["rows"], columns: [{ id: "label", label: "Nhãn" }] },
  { id: "items", type: "list", label: "Danh sách", path: ["items"], item: { id: "item-label", type: "text", label: "Nhãn", path: ["label"] } },
  { id: "layout", type: "object-group", label: "Bố cục", path: ["layout"], fields: [{ id: "gap", type: "number", label: "Khoảng cách", path: ["gap"], min: 0 }] }
]);

const definition = registerDeckComponent({
  id: "inspector-fixture",
  version: "1.0.0",
  displayName: "Inspector fixture",
  propsSchema: z.object({
    title: z.string().max(80),
    description: z.string(),
    score: z.number().min(0).max(100),
    visible: z.boolean(),
    tone: z.enum(["good"]),
    density: z.enum(["compact"]),
    accent: z.string(),
    assetId: z.string(),
    rows: z.array(z.record(z.string(), z.unknown())),
    items: z.array(z.object({ label: z.string() }).strict()),
    layout: z.object({ gap: z.number().nonnegative() }).strict()
  }).strict(),
  defaultFrame: { width: 400, height: 300 },
  inspector,
  renderer: () => null,
  accessibleSummary: ({ title }) => title,
  exportCapabilities: ["html"]
});

const props = {
  title: "Deckory",
  description: "SDK",
  score: 80,
  visible: true,
  tone: "good" as const,
  density: "compact" as const,
  accent: "accent.cobalt",
  assetId: "hero-image",
  rows: [{ label: "A" }],
  items: [{ label: "First" }],
  layout: { gap: 16 }
};

describe("Inspector metadata contracts", () => {
  it("supports the complete initial field catalog", () => {
    expect(inspector.map((field) => field.type)).toEqual([
      "text", "multiline", "number", "boolean", "select", "segmented",
      "color-token", "asset", "data-table", "list", "object-group"
    ]);
    expect(Object.isFrozen(inspector)).toBe(true);
  });

  it("rejects duplicate field IDs and duplicate update paths", () => {
    expect(() => createInspectorSchema([
      { id: "title", type: "text", label: "A", path: ["title"] },
      { id: "title", type: "text", label: "B", path: ["subtitle"] }
    ])).toThrow(/ID.*title.*trùng/i);

    expect(() => createInspectorSchema([
      { id: "title", type: "text", label: "A", path: ["title"] },
      { id: "subtitle", type: "text", label: "B", path: ["title"] }
    ])).toThrow(/path.*title.*trùng/i);
  });

  it("reads stable nested values without evaluating code", () => {
    expect(getInspectorValue(props, ["layout", "gap"])).toBe(16);
    expect(getInspectorValue(props, ["items", 0, "label"])).toBe("First");
  });

  it("patches immutably and validates the complete props object", () => {
    const valid = patchComponentProps(definition, props, ["score"], 95);
    expect(valid).toMatchObject({ ok: true, props: { score: 95 } });
    expect(props.score).toBe(80);

    const invalid = patchComponentProps(definition, props, ["score"], 120);
    expect(invalid).toMatchObject({ ok: false });
  });

  it("rejects prototype-pollution update paths", () => {
    expect(() => getInspectorValue(props, ["__proto__", "polluted"])).toThrow(/không an toàn/i);
    expect(() => patchComponentProps(definition, props, ["constructor", "prototype"], true)).toThrow(/không an toàn/i);
  });
});
