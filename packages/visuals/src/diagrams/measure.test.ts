import { describe, expect, it } from "vitest";

import { DiagramSpecSchema } from "./diagram-spec";
import { measureDiagramNodes, measureTextBlock } from "./measure";

describe("diagram measurement", () => {
  it("measures long Vietnamese labels before layout", () => {
    const spec = DiagramSpecSchema.parse({
      question: "How is interview evidence processed?",
      title: "Evidence moves through measured architecture nodes",
      accessibleSummary: "The system validates and processes Vietnamese interview evidence.",
      intent: "architecture",
      layout: "tree",
      direction: "left-to-right",
      nodes: [
        {
          id: "evaluation-service",
          label: "Dịch vụ đánh giá câu trả lời phỏng vấn tiếng Việt có cấu trúc",
          description: "Chuẩn hóa bằng chứng và tính điểm theo tiêu chí đã khai báo.",
          kind: "service",
          ports: []
        }
      ],
      edges: [],
      generatedLayout: null,
      manualOverrides: [],
      accessibleTraversalOrder: ["evaluation-service"],
      edgeRouting: "orthogonal",
      evidence: { status: "verified", sourceIds: ["architecture-doc"], label: "Architecture documentation" }
    });

    const result = measureDiagramNodes(spec, {
      fontSize: 18,
      lineHeight: 1.25,
      maxTextWidth: 260,
      horizontalPadding: 24,
      verticalPadding: 18
    });

    expect(result[0]).toMatchObject({ nodeId: "evaluation-service" });
    expect(result[0]!.width).toBeGreaterThanOrEqual(result[0]!.measuredTextWidth);
    expect(result[0]!.height).toBeGreaterThan(result[0]!.measuredTextHeight);
    expect(result[0]!.lines.length).toBeGreaterThan(1);
  });

  it("treats combining marks as part of the preceding glyph", () => {
    const composed = measureTextBlock("đánh giá", { fontSize: 18, maxWidth: 300 });
    const decomposed = measureTextBlock("đánh giá", { fontSize: 18, maxWidth: 300 });

    expect(Math.abs(composed.width - decomposed.width)).toBeLessThan(1);
  });

  it("returns deterministic line wrapping", () => {
    const options = { fontSize: 16, maxWidth: 180, lineHeight: 1.3 };
    const first = measureTextBlock(
      "Kết quả đánh giá phải giữ đầy đủ dấu tiếng Việt.",
      options
    );
    const second = measureTextBlock(
      "Kết quả đánh giá phải giữ đầy đủ dấu tiếng Việt.",
      options
    );

    expect(first).toEqual(second);
  });
});
