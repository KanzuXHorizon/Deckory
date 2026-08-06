import { describe, expect, it } from "vitest";

import { classifyVisualIntent } from "./intent";

describe("classifyVisualIntent", () => {
  it("classifies ordered operational text as process without inventing values", () => {
    const result = classifyVisualIntent({
      text: "Thiết lập hồ sơ. Tạo phiên. Thực hành. Nhận phản hồi.",
      locale: "vi-VN"
    });

    expect(result.primary).toBe("process");
    expect(result.extractedSteps).toEqual([
      "Thiết lập hồ sơ",
      "Tạo phiên",
      "Thực hành",
      "Nhận phản hồi"
    ]);
    expect(result.numericClaims).toHaveLength(0);
  });

  it("classifies a two-sided argument as before-after", () => {
    const result = classifyVisualIntent({
      text: "Cách cũ phụ thuộc thao tác thủ công; cách mới tự động hóa và có audit trail.",
      locale: "vi-VN"
    });

    expect(result.primary).toBe("before-after");
    expect(result.sides).toEqual([
      expect.objectContaining({ label: "Cách cũ" }),
      expect.objectContaining({ label: "Cách mới" })
    ]);
  });

  it("extracts only numeric claims explicitly present in the text", () => {
    const result = classifyVisualIntent({
      text: "Điểm tăng từ 62 lên 84 sau ba vòng luyện tập.",
      locale: "vi-VN"
    });

    expect(result.primary).toBe("trend");
    expect(result.numericClaims).toEqual([
      expect.objectContaining({ raw: "62", value: 62 }),
      expect.objectContaining({ raw: "84", value: 84 })
    ]);
    expect(result.extractedClaims.map((claim) => claim.text)).toContain(
      "Điểm tăng từ 62 lên 84 sau ba vòng luyện tập"
    );
  });

  it("does not treat a calendar year as numeric chart evidence", () => {
    const result = classifyVisualIntent({
      text: "Lộ trình năm 2026 gồm ba giai đoạn triển khai.",
      locale: "vi-VN"
    });

    expect(result.numericClaims).toEqual([
      expect.objectContaining({ raw: "2026", role: "date" })
    ]);
    expect(result.inputAvailability.numericData).toBe(0);
    expect(result.inputAvailability.dates).toBe(1);
  });

  it("keeps structured relationship, geography and evidence availability explicit", () => {
    const result = classifyVisualIntent({
      text: "Phân tích rủi ro theo khu vực.",
      locale: "vi-VN",
      hints: {
        entities: ["Miền Bắc", "Miền Nam"],
        relationships: [{ source: "Miền Bắc", target: "Miền Nam" }],
        geographies: ["VN-HN", "VN-HCM"],
        evidenceIds: ["evidence-risk-register"]
      }
    });

    expect(result.inputAvailability).toMatchObject({
      entities: 2,
      relationships: 1,
      geography: 2,
      evidence: 1
    });
  });

  it("returns byte-for-byte stable analysis for repeated input", () => {
    const input = {
      text: "Bước 1: Chuẩn bị dữ liệu. Bước 2: Kiểm tra. Bước 3: Xuất bản.",
      locale: "vi-VN" as const
    };

    expect(JSON.stringify(classifyVisualIntent(input))).toBe(
      JSON.stringify(classifyVisualIntent(input))
    );
  });
});
