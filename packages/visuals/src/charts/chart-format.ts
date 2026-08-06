import type { NumberFormatSpec } from "./chart-spec";

export function formatChartValue(
  value: number | null,
  spec: NumberFormatSpec,
  locale = "en-US"
): string {
  if (value === null) return spec.missingLabel ?? "—";

  const common: Intl.NumberFormatOptions = {
    minimumFractionDigits: spec.minimumFractionDigits,
    maximumFractionDigits: spec.maximumFractionDigits
  };
  let options: Intl.NumberFormatOptions;
  switch (spec.style) {
    case "decimal":
      options = { ...common, style: "decimal" };
      break;
    case "percent":
      options = { ...common, style: "percent" };
      break;
    case "currency":
      options = {
        ...common,
        style: "currency",
        currency: spec.currency ?? "USD",
        currencyDisplay: "symbol"
      };
      break;
    case "compact":
      options = {
        ...common,
        style: "decimal",
        notation: "compact",
        compactDisplay: "short"
      };
      break;
  }

  const formatted = new Intl.NumberFormat(locale, options)
    .format(value)
    .replace(/\u00a0/gu, " ")
    .replace(/\s+%/gu, "%");
  return `${spec.prefix ?? ""}${formatted}${spec.suffix ?? ""}`;
}
