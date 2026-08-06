import { describe, expect, it } from "vitest";

import { formatChartValue } from "./chart-format";

describe("formatChartValue", () => {
  it("formats decimal values with an explicit unit", () => {
    expect(
      formatChartValue(84, {
        style: "decimal",
        maximumFractionDigits: 0,
        suffix: " điểm"
      }, "vi-VN")
    ).toBe("84 điểm");
  });

  it("formats ratio values as percentages without changing source data", () => {
    expect(
      formatChartValue(0.84, {
        style: "percent",
        maximumFractionDigits: 0
      }, "vi-VN")
    ).toBe("84%");
  });

  it("formats compact and currency values deterministically", () => {
    expect(
      formatChartValue(1_250_000, {
        style: "compact",
        maximumFractionDigits: 1
      }, "en-US")
    ).toBe("1.3M");
    expect(
      formatChartValue(1250, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }, "en-US")
    ).toBe("$1,250");
  });

  it("returns the declared missing-value label", () => {
    expect(
      formatChartValue(null, {
        style: "decimal",
        maximumFractionDigits: 0,
        missingLabel: "Không có dữ liệu"
      }, "vi-VN")
    ).toBe("Không có dữ liệu");
  });
});
