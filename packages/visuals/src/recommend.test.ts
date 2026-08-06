import { describe, expect, it } from "vitest";

import { visualCatalog } from "./catalog";
import { classifyVisualIntent } from "./intent";
import { recommendVisuals } from "./recommend";

describe("recommendVisuals", () => {
  it("returns process alternatives with reasons and required inputs", () => {
    const intent = classifyVisualIntent({
      text: "Thu thập dữ liệu. Kiểm tra dữ liệu. Phân tích. Trình bày kết quả.",
      locale: "vi-VN"
    });

    const recommendations = recommendVisuals(intent, visualCatalog);

    expect(recommendations[0]).toMatchObject({
      componentId: "linear-process",
      family: "diagram",
      reasons: expect.arrayContaining([expect.stringMatching(/thứ tự/i)]),
      requiredInputs: expect.arrayContaining([
        expect.objectContaining({ kind: "steps" })
      ])
    });
    expect(recommendations[0]?.alternatives.length).toBeGreaterThan(0);
  });

  it("does not recommend a chart without numeric evidence", () => {
    const intent = classifyVisualIntent({
      text: "Thu thập dữ liệu. Kiểm tra dữ liệu. Trình bày kết quả.",
      locale: "vi-VN"
    });

    expect(
      recommendVisuals(intent, visualCatalog).some((item) => item.family === "chart")
    ).toBe(false);
  });

  it("recommends a trend chart only when explicit numeric evidence exists", () => {
    const intent = classifyVisualIntent({
      text: "Điểm tăng từ 62 lên 84 qua ba vòng luyện tập.",
      locale: "vi-VN"
    });

    const recommendations = recommendVisuals(intent, visualCatalog);

    expect(recommendations[0]).toMatchObject({
      componentId: "line-chart",
      family: "chart",
      evidenceRequirements: expect.arrayContaining([
        expect.objectContaining({ kind: "numeric-evidence", required: true })
      ])
    });
  });

  it("does not recommend a numeric chart from a year-only roadmap", () => {
    const intent = classifyVisualIntent({
      text: "Lộ trình năm 2026 gồm ba giai đoạn triển khai.",
      locale: "vi-VN"
    });

    const recommendations = recommendVisuals(intent, visualCatalog);

    expect(recommendations.some((item) => item.family === "chart")).toBe(false);
    expect(recommendations).toContainEqual(
      expect.objectContaining({ componentId: "timeline" })
    );
  });

  it("reports structured geography as missing until actual geography keys are supplied", () => {
    const unstructured = classifyVisualIntent({
      text: "Kết quả khác nhau theo khu vực.",
      locale: "vi-VN"
    });
    const structured = classifyVisualIntent({
      text: "Kết quả khác nhau theo khu vực.",
      locale: "vi-VN",
      hints: { geographies: ["VN-HN", "VN-HCM"] }
    });

    expect(recommendVisuals(unstructured, visualCatalog)[0]).toMatchObject({
      componentId: "geographic-map",
      requiredInputs: expect.arrayContaining([
        expect.objectContaining({ kind: "geography", status: "missing" })
      ])
    });
    expect(recommendVisuals(structured, visualCatalog)[0]).toMatchObject({
      componentId: "geographic-map",
      requiredInputs: expect.arrayContaining([
        expect.objectContaining({ kind: "geography", status: "available" })
      ])
    });
  });

  it("exposes missing inputs and density warnings instead of fabricating them", () => {
    const intent = classifyVisualIntent({
      text: "Doanh thu tăng 12%.",
      locale: "vi-VN"
    });

    const [recommendation] = recommendVisuals(intent, visualCatalog);

    expect(recommendation?.requiredInputs).toContainEqual(
      expect.objectContaining({ kind: "categories", status: "missing" })
    );
    expect(recommendation?.warnings).toContainEqual(expect.stringMatching(/thiếu/i));
  });

  it("returns deterministic ranking and explanations across repeated runs", () => {
    const intent = classifyVisualIntent({
      text: "Cách cũ mất 8 giờ; cách mới mất 2 giờ.",
      locale: "vi-VN"
    });

    expect(JSON.stringify(recommendVisuals(intent, visualCatalog))).toBe(
      JSON.stringify(recommendVisuals(intent, visualCatalog))
    );
  });
});
