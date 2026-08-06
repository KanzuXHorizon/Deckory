import { describe, expect, it } from "vitest";
import { alignElements, alignmentActionAvailability, createAlignmentCommand, distributeElements, tryDistributeElements } from "./alignment";

const elements = [
  { id: "a", frame: { x: 20, y: 40, width: 80, height: 60 } },
  { id: "b", frame: { x: 150, y: 80, width: 100, height: 50 } },
  { id: "c", frame: { x: 330, y: 20, width: 70, height: 90 } }
];

describe("scene alignment", () => {
  it("aligns selected elements to the left edge of their selection bounds", () => {
    expect(alignElements(elements, "left").map((change) => change.frame.x)).toEqual([20, 20, 20]);
  });

  it("distributes three elements with equal horizontal gaps", () => {
    const result = distributeElements(elements, "horizontal");
    const firstGap = result[1]!.frame.x - (result[0]!.frame.x + result[0]!.frame.width);
    const secondGap = result[2]!.frame.x - (result[1]!.frame.x + result[1]!.frame.width);
    expect(firstGap).toBe(secondGap);
    expect(result[0]!.frame.x).toBe(20);
    expect(result[2]!.frame.x).toBe(330);
  });

  it("uses the actual outer edge when a wider middle element extends furthest", () => {
    const result = tryDistributeElements([
      { id: "a", frame: { x: 0, y: 0, width: 20, height: 40 } },
      { id: "b", frame: { x: 50, y: 0, width: 120, height: 40 } },
      { id: "c", frame: { x: 100, y: 0, width: 20, height: 40 } }
    ], "horizontal");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((change) => [change.elementId, change.frame.x])).toEqual([
      ["a", 0],
      ["b", 25],
      ["c", 150]
    ]);
  });

  it("provides explicit disabled reasons for toolbar actions", () => {
    expect(alignmentActionAvailability({ type: "align", mode: "left" }, 1)).toEqual({
      enabled: false,
      reason: "Căn chỉnh cần ít nhất 2 thành phần."
    });
    expect(alignmentActionAvailability({ type: "distribute", axis: "horizontal" }, 2)).toEqual({
      enabled: false,
      reason: "Phân bố cần ít nhất 3 thành phần."
    });
    expect(alignmentActionAvailability({ type: "align", mode: "left" }, 2)).toEqual({ enabled: true });
  });

  it("maps one toolbar action to one transform-elements command", () => {
    const command = createAlignmentCommand("cover", elements, { type: "align", mode: "middle" });
    expect(command.type).toBe("transform-elements");
    expect(command.changes).toHaveLength(3);
  });

  it("rejects distribution when the outer span cannot contain declared sizes", () => {
    const result = tryDistributeElements([
      { id: "a", frame: { x: 0, y: 0, width: 160, height: 40 } },
      { id: "b", frame: { x: 80, y: 0, width: 160, height: 40 } },
      { id: "c", frame: { x: 200, y: 0, width: 160, height: 40 } }
    ], "horizontal");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.code).toBe("distribution-does-not-fit");
      expect(result.diagnostics[0]?.recommendation).toMatch(/mở rộng vùng chọn|giảm kích thước/i);
    }
  });
});
