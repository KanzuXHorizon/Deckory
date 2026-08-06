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
