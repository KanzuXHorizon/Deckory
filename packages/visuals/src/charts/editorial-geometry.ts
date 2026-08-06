import { formatChartValue } from "./chart-format";
import {
  editorialChartVariants,
  type ChartDatum,
  type ChartSpec,
  type ChartVariant
} from "./chart-spec";

export { editorialChartVariants } from "./chart-spec";

export type ChartGeometryBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ChartGeometryMark = {
  kind: "rect" | "circle" | "line" | "area";
  datumId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  radius?: number;
  points?: readonly { x: number; y: number }[];
  primaryHighlight: boolean;
  direction?: "negative" | "positive" | "neutral";
  startValue?: number;
  endValue?: number;
};

export type ChartGeometryLabel = {
  datumId: string;
  role: "category" | "value" | "annotation";
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  primaryHighlight: boolean;
};

export type ChartGeometryDiagnostic = {
  code:
    | "unsupported-editorial-variant"
    | "empty-numeric-data"
    | "missing-value-gap"
    | "label-density-warning";
  message: string;
  datumId?: string;
  recommendation: string;
};

export type ChartBaseline = {
  orientation: "horizontal" | "vertical";
  x: number;
  y: number;
  length: number;
};

export type EditorialGeometrySuccess = {
  ok: true;
  marks: ChartGeometryMark[];
  labels: ChartGeometryLabel[];
  baseline: ChartBaseline;
  diagnostics: ChartGeometryDiagnostic[];
  domain: { min: number; max: number };
};

export type EditorialGeometryFailure = {
  ok: false;
  diagnostics: ChartGeometryDiagnostic[];
};

export type EditorialGeometryResult =
  | EditorialGeometrySuccess
  | EditorialGeometryFailure;

type NumericDatum = {
  datum: ChartDatum;
  value: number;
};

function isEditorialVariant(variant: ChartVariant): boolean {
  return (editorialChartVariants as readonly ChartVariant[]).includes(variant);
}

function primaryHighlightIds(spec: ChartSpec): ReadonlySet<string> {
  return new Set(
    spec.highlights
      .filter((highlight) => highlight.level === "primary")
      .map((highlight) => highlight.datumId)
  );
}

function resolveNumericData(
  spec: ChartSpec,
  diagnostics: ChartGeometryDiagnostic[]
): NumericDatum[] {
  const resolved: NumericDatum[] = [];
  for (const datum of spec.data) {
    if (datum.value === null || datum.value === undefined) {
      if (spec.missingValuePolicy === "zero") {
        resolved.push({ datum, value: 0 });
      } else {
        if (spec.missingValuePolicy === "gap") {
          diagnostics.push({
            code: "missing-value-gap",
            datumId: datum.id,
            message: `Datum ${datum.id} được giữ là gap; không chuyển thành 0.`,
            recommendation: "Bổ sung dữ liệu hoặc đổi missingValuePolicy có chủ đích."
          });
        }
      }
      continue;
    }
    resolved.push({ datum, value: datum.value });
  }
  return resolved;
}

function extent(values: readonly number[], includeZero: boolean): { min: number; max: number } {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === max) {
    const padding = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1;
    min -= padding;
    max += padding;
  }
  return { min, max };
}

function linearScale(
  domain: { min: number; max: number },
  rangeStart: number,
  rangeEnd: number
): (value: number) => number {
  const span = domain.max - domain.min;
  return (value) => rangeStart + ((value - domain.min) / span) * (rangeEnd - rangeStart);
}

function direction(value: number): "negative" | "positive" | "neutral" {
  return value < 0 ? "negative" : value > 0 ? "positive" : "neutral";
}

function addDirectLabels(
  spec: ChartSpec,
  labels: ChartGeometryLabel[],
  datum: ChartDatum,
  value: number,
  categoryPosition: { x: number; y: number; anchor: "start" | "middle" | "end" },
  valuePosition: { x: number; y: number; anchor: "start" | "middle" | "end" },
  highlighted: boolean
): void {
  if (spec.labels.mode !== "direct") return;
  if (datum.category) {
    labels.push({
      datumId: datum.id,
      role: "category",
      text: datum.category,
      ...categoryPosition,
      primaryHighlight: highlighted
    });
  }
  if (spec.labels.showValues) {
    labels.push({
      datumId: datum.id,
      role: "value",
      text: formatChartValue(value, spec.numberFormat),
      ...valuePosition,
      primaryHighlight: highlighted
    });
  }
}

function horizontalBars(
  spec: ChartSpec,
  bounds: ChartGeometryBounds,
  data: readonly NumericDatum[],
  diagnostics: ChartGeometryDiagnostic[]
): EditorialGeometrySuccess {
  const highlights = primaryHighlightIds(spec);
  const left = bounds.x + Math.min(180, bounds.width * 0.3);
  const right = bounds.x + bounds.width - 48;
  const top = bounds.y + 20;
  const bottom = bounds.y + bounds.height - 24;
  const domainValues = data.flatMap((item) =>
    spec.variant === "bullet" && item.datum.target !== undefined && item.datum.target !== null
      ? [item.value, item.datum.target]
      : [item.value]
  );
  const domain = extent(
    domainValues,
    spec.encoding.zeroBaseline === true
  );
  const scale = linearScale(domain, left, right);
  const baselineX = scale(0);
  const bandHeight = (bottom - top) / Math.max(1, data.length);
  const barHeight = Math.max(4, Math.min(36, bandHeight * 0.56));
  const marks: ChartGeometryMark[] = [];
  const labels: ChartGeometryLabel[] = [];

  if (bandHeight < 22 && spec.labels.mode === "direct") {
    diagnostics.push({
      code: "label-density-warning",
      message: `Band height ${bandHeight.toFixed(1)}px có nguy cơ va chạm direct labels.`,
      recommendation: "Giảm số danh mục, tăng chiều cao chart hoặc chuyển phần phụ sang appendix."
    });
  }

  data.forEach(({ datum, value }, index) => {
    const centerY = top + bandHeight * index + bandHeight / 2;
    const valueX = scale(value);
    const highlighted = highlights.has(datum.id);
    marks.push({
      kind: "rect",
      datumId: datum.id,
      x: Math.min(baselineX, valueX),
      y: centerY - barHeight / 2,
      width: Math.max(0, Math.abs(valueX - baselineX)),
      height: barHeight,
      primaryHighlight: highlighted,
      direction: direction(value),
      startValue: 0,
      endValue: value
    });
    addDirectLabels(
      spec,
      labels,
      datum,
      value,
      { x: bounds.x, y: centerY, anchor: "start" },
      {
        x: value >= 0 ? valueX + 8 : valueX - 8,
        y: centerY,
        anchor: value >= 0 ? "start" : "end"
      },
      highlighted
    );
    if (spec.variant === "bullet" && datum.target !== undefined && datum.target !== null) {
      const targetX = scale(datum.target);
      marks.push({
        kind: "line",
        datumId: `${datum.id}:target`,
        x: targetX,
        y: centerY - barHeight * 0.8,
        x2: targetX,
        y2: centerY + barHeight * 0.8,
        primaryHighlight: false,
        startValue: datum.target,
        endValue: datum.target
      });
    }
  });

  return {
    ok: true,
    marks,
    labels,
    baseline: {
      orientation: "vertical",
      x: baselineX,
      y: top,
      length: bottom - top
    },
    diagnostics,
    domain
  };
}

function standardVerticalBars(
  spec: ChartSpec,
  bounds: ChartGeometryBounds,
  data: readonly NumericDatum[],
  diagnostics: ChartGeometryDiagnostic[]
): EditorialGeometrySuccess {
  const highlights = primaryHighlightIds(spec);
  const left = bounds.x + 52;
  const right = bounds.x + bounds.width - 24;
  const top = bounds.y + 20;
  const bottom = bounds.y + bounds.height - 56;
  const domain = extent(
    data.map((item) => item.value),
    spec.encoding.zeroBaseline === true
  );
  const scale = linearScale(domain, bottom, top);
  const baselineY = scale(0);
  const bandWidth = (right - left) / Math.max(1, data.length);
  const barWidth = Math.max(4, Math.min(48, bandWidth * 0.58));
  const marks: ChartGeometryMark[] = [];
  const labels: ChartGeometryLabel[] = [];

  if (bandWidth < 34 && spec.labels.mode === "direct") {
    diagnostics.push({
      code: "label-density-warning",
      message: `Band width ${bandWidth.toFixed(1)}px có nguy cơ va chạm direct labels.`,
      recommendation: "Giảm số danh mục hoặc dùng horizontal bar cho nhãn dài."
    });
  }

  data.forEach(({ datum, value }, index) => {
    const centerX = left + bandWidth * index + bandWidth / 2;
    const valueY = scale(value);
    const highlighted = highlights.has(datum.id);
    marks.push({
      kind: "rect",
      datumId: datum.id,
      x: centerX - barWidth / 2,
      y: Math.min(baselineY, valueY),
      width: barWidth,
      height: Math.max(0, Math.abs(valueY - baselineY)),
      primaryHighlight: highlighted,
      direction: direction(value),
      startValue: 0,
      endValue: value
    });
    addDirectLabels(
      spec,
      labels,
      datum,
      value,
      { x: centerX, y: bottom + 20, anchor: "middle" },
      {
        x: centerX,
        y: value >= 0 ? valueY - 8 : valueY + 16,
        anchor: "middle"
      },
      highlighted
    );
  });

  return {
    ok: true,
    marks,
    labels,
    baseline: {
      orientation: "horizontal",
      x: left,
      y: baselineY,
      length: right - left
    },
    diagnostics,
    domain
  };
}

function groupedBars(
  spec: ChartSpec,
  bounds: ChartGeometryBounds,
  data: readonly NumericDatum[],
  diagnostics: ChartGeometryDiagnostic[]
): EditorialGeometrySuccess {
  const categories = [...new Set(data.map((item) => item.datum.category ?? ""))];
  const series = [...new Set(data.map((item) => item.datum.series ?? ""))];
  const left = bounds.x + 52;
  const right = bounds.x + bounds.width - 24;
  const top = bounds.y + 20;
  const bottom = bounds.y + bounds.height - 56;
  const domain = extent(data.map((item) => item.value), spec.encoding.zeroBaseline === true);
  const scale = linearScale(domain, bottom, top);
  const baselineY = scale(0);
  const categoryBand = (right - left) / Math.max(1, categories.length);
  const barWidth = Math.max(3, Math.min(30, (categoryBand * 0.72) / Math.max(1, series.length)));
  const highlights = primaryHighlightIds(spec);
  const marks: ChartGeometryMark[] = [];
  const labels: ChartGeometryLabel[] = [];

  data.forEach(({ datum, value }) => {
    const categoryIndex = categories.indexOf(datum.category ?? "");
    const seriesIndex = series.indexOf(datum.series ?? "");
    const groupStart = left + categoryIndex * categoryBand + categoryBand * 0.14;
    const x = groupStart + seriesIndex * barWidth;
    const valueY = scale(value);
    const highlighted = highlights.has(datum.id);
    marks.push({
      kind: "rect",
      datumId: datum.id,
      x,
      y: Math.min(baselineY, valueY),
      width: barWidth,
      height: Math.abs(valueY - baselineY),
      primaryHighlight: highlighted,
      direction: direction(value),
      startValue: 0,
      endValue: value
    });
    if (spec.labels.showValues && spec.labels.mode === "direct") {
      labels.push({
        datumId: datum.id,
        role: "value",
        text: formatChartValue(value, spec.numberFormat),
        x: x + barWidth / 2,
        y: value >= 0 ? valueY - 6 : valueY + 14,
        anchor: "middle",
        primaryHighlight: highlighted
      });
    }
  });
  categories.forEach((category, index) => {
    labels.push({
      datumId: `category:${category}`,
      role: "category",
      text: category,
      x: left + index * categoryBand + categoryBand / 2,
      y: bottom + 20,
      anchor: "middle",
      primaryHighlight: false
    });
  });

  return {
    ok: true,
    marks,
    labels,
    baseline: { orientation: "horizontal", x: left, y: baselineY, length: right - left },
    diagnostics,
    domain
  };
}

function stackedBars(
  spec: ChartSpec,
  bounds: ChartGeometryBounds,
  data: readonly NumericDatum[],
  diagnostics: ChartGeometryDiagnostic[]
): EditorialGeometrySuccess {
  const categories = [...new Set(data.map((item) => item.datum.category ?? ""))];
  const totals = categories.flatMap((category) => {
    const values = data.filter((item) => item.datum.category === category).map((item) => item.value);
    return [
      values.filter((value) => value > 0).reduce((sum, value) => sum + value, 0),
      values.filter((value) => value < 0).reduce((sum, value) => sum + value, 0)
    ];
  });
  const left = bounds.x + 52;
  const right = bounds.x + bounds.width - 24;
  const top = bounds.y + 20;
  const bottom = bounds.y + bounds.height - 56;
  const domain = extent(totals, true);
  const scale = linearScale(domain, bottom, top);
  const baselineY = scale(0);
  const categoryBand = (right - left) / Math.max(1, categories.length);
  const barWidth = Math.max(8, Math.min(54, categoryBand * 0.55));
  const highlights = primaryHighlightIds(spec);
  const marks: ChartGeometryMark[] = [];
  const labels: ChartGeometryLabel[] = [];

  categories.forEach((category, categoryIndex) => {
    let positive = 0;
    let negative = 0;
    const x = left + categoryIndex * categoryBand + categoryBand / 2 - barWidth / 2;
    for (const { datum, value } of data.filter((item) => item.datum.category === category)) {
      const startValue = value >= 0 ? positive : negative;
      const endValue = startValue + value;
      if (value >= 0) positive = endValue;
      else negative = endValue;
      const startY = scale(startValue);
      const endY = scale(endValue);
      const highlighted = highlights.has(datum.id);
      marks.push({
        kind: "rect",
        datumId: datum.id,
        x,
        y: Math.min(startY, endY),
        width: barWidth,
        height: Math.abs(endY - startY),
        primaryHighlight: highlighted,
        direction: direction(value),
        startValue,
        endValue
      });
    }
    labels.push({
      datumId: `category:${category}`,
      role: "category",
      text: category,
      x: x + barWidth / 2,
      y: bottom + 20,
      anchor: "middle",
      primaryHighlight: false
    });
  });

  return {
    ok: true,
    marks,
    labels,
    baseline: { orientation: "horizontal", x: left, y: baselineY, length: right - left },
    diagnostics,
    domain
  };
}

function waterfallGeometry(
  spec: ChartSpec,
  bounds: ChartGeometryBounds,
  data: readonly NumericDatum[],
  diagnostics: ChartGeometryDiagnostic[]
): EditorialGeometrySuccess {
  const cumulative: Array<NumericDatum & { startValue: number; endValue: number }> = [];
  let current = 0;
  for (const item of data) {
    const isTotal = item.datum.role === "total";
    const startValue = isTotal ? 0 : current;
    const endValue = isTotal ? item.value : current + item.value;
    if (!isTotal) current = endValue;
    else current = item.value;
    cumulative.push({ ...item, startValue, endValue });
  }
  const domain = extent(
    cumulative.flatMap((item) => [item.startValue, item.endValue]),
    true
  );
  const left = bounds.x + 52;
  const right = bounds.x + bounds.width - 24;
  const top = bounds.y + 20;
  const bottom = bounds.y + bounds.height - 56;
  const scale = linearScale(domain, bottom, top);
  const baselineY = scale(0);
  const bandWidth = (right - left) / Math.max(1, cumulative.length);
  const barWidth = Math.max(8, Math.min(52, bandWidth * 0.56));
  const highlights = primaryHighlightIds(spec);
  const marks: ChartGeometryMark[] = [];
  const labels: ChartGeometryLabel[] = [];

  cumulative.forEach((item, index) => {
    const centerX = left + index * bandWidth + bandWidth / 2;
    const startY = scale(item.startValue);
    const endY = scale(item.endValue);
    const highlighted = highlights.has(item.datum.id);
    marks.push({
      kind: "rect",
      datumId: item.datum.id,
      x: centerX - barWidth / 2,
      y: Math.min(startY, endY),
      width: barWidth,
      height: Math.abs(endY - startY),
      primaryHighlight: highlighted,
      direction: direction(item.endValue - item.startValue),
      startValue: item.startValue,
      endValue: item.endValue
    });
    addDirectLabels(
      spec,
      labels,
      item.datum,
      item.value,
      { x: centerX, y: bottom + 20, anchor: "middle" },
      { x: centerX, y: endY - 8, anchor: "middle" },
      highlighted
    );
  });

  return {
    ok: true,
    marks,
    labels,
    baseline: { orientation: "horizontal", x: left, y: baselineY, length: right - left },
    diagnostics,
    domain
  };
}

function lineGeometry(
  spec: ChartSpec,
  bounds: ChartGeometryBounds,
  data: readonly NumericDatum[],
  diagnostics: ChartGeometryDiagnostic[]
): EditorialGeometrySuccess {
  const left = bounds.x + 52;
  const right = bounds.x + bounds.width - 28;
  const top = bounds.y + 20;
  const bottom = bounds.y + bounds.height - 50;
  const domain = extent(data.map((item) => item.value), spec.encoding.zeroBaseline === true);
  const yScale = linearScale(domain, bottom, top);
  const xFor = (index: number) =>
    data.length === 1 ? (left + right) / 2 : left + (index / (data.length - 1)) * (right - left);
  const baselineY = spec.encoding.zeroBaseline === true ? yScale(0) : bottom;
  const highlights = primaryHighlightIds(spec);
  const marks: ChartGeometryMark[] = [];
  const labels: ChartGeometryLabel[] = [];
  const points = data.map((item, index) => ({ x: xFor(index), y: yScale(item.value) }));

  if (spec.variant === "area") {
    marks.push({
      kind: "area",
      datumId: "area-series",
      x: left,
      y: top,
      points: [
        { x: points[0]?.x ?? left, y: baselineY },
        ...points,
        { x: points.at(-1)?.x ?? right, y: baselineY }
      ],
      primaryHighlight: false
    });
  }
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current) continue;
    marks.push({
      kind: "line",
      datumId: `segment:${data[index - 1]?.datum.id ?? index - 1}:${data[index]?.datum.id ?? index}`,
      x: previous.x,
      y: previous.y,
      x2: current.x,
      y2: current.y,
      primaryHighlight: false
    });
  }
  data.forEach((item, index) => {
    const point = points[index]!;
    const highlighted = highlights.has(item.datum.id);
    marks.push({
      kind: "circle",
      datumId: item.datum.id,
      x: point.x,
      y: point.y,
      radius: highlighted ? 6 : 4,
      primaryHighlight: highlighted,
      direction: direction(item.value),
      startValue: item.value,
      endValue: item.value
    });
    addDirectLabels(
      spec,
      labels,
      item.datum,
      item.value,
      { x: point.x, y: bottom + 18, anchor: "middle" },
      { x: point.x, y: point.y - 10, anchor: "middle" },
      highlighted
    );
  });
  return {
    ok: true,
    marks,
    labels,
    baseline: { orientation: "horizontal", x: left, y: baselineY, length: right - left },
    diagnostics,
    domain
  };
}

function slopeGeometry(
  spec: ChartSpec,
  bounds: ChartGeometryBounds,
  data: readonly NumericDatum[],
  diagnostics: ChartGeometryDiagnostic[]
): EditorialGeometrySuccess {
  const left = bounds.x + 52;
  const right = bounds.x + bounds.width - 28;
  const top = bounds.y + 20;
  const bottom = bounds.y + bounds.height - 50;
  const domain = extent(
    data.map((item) => item.value),
    spec.encoding.zeroBaseline === true
  );
  const yScale = linearScale(domain, bottom, top);
  const baselineY = spec.encoding.zeroBaseline === true ? yScale(0) : bottom;
  const categories = [...new Set(data.map((item) => item.datum.category ?? ""))];
  const xForCategory = (category: string): number => {
    const index = categories.indexOf(category);
    return categories.length === 1
      ? (left + right) / 2
      : left + (index / Math.max(1, categories.length - 1)) * (right - left);
  };
  const seriesNames = [...new Set(data.map((item) => item.datum.series ?? ""))].sort(
    (a, b) => a.localeCompare(b, "en")
  );
  const highlights = primaryHighlightIds(spec);
  const marks: ChartGeometryMark[] = [];
  const labels: ChartGeometryLabel[] = [];

  for (const series of seriesNames) {
    const seriesData = data
      .filter((item) => item.datum.series === series)
      .sort(
        (leftItem, rightItem) =>
          categories.indexOf(leftItem.datum.category ?? "") -
          categories.indexOf(rightItem.datum.category ?? "")
      );
    for (let index = 1; index < seriesData.length; index += 1) {
      const previous = seriesData[index - 1];
      const current = seriesData[index];
      if (!previous || !current) continue;
      marks.push({
        kind: "line",
        datumId: `slope:${series}:${previous.datum.id}:${current.datum.id}`,
        x: xForCategory(previous.datum.category ?? ""),
        y: yScale(previous.value),
        x2: xForCategory(current.datum.category ?? ""),
        y2: yScale(current.value),
        primaryHighlight: false
      });
    }
    for (const item of seriesData) {
      const highlighted = highlights.has(item.datum.id);
      const x = xForCategory(item.datum.category ?? "");
      const y = yScale(item.value);
      marks.push({
        kind: "circle",
        datumId: item.datum.id,
        x,
        y,
        radius: highlighted ? 6 : 4,
        primaryHighlight: highlighted,
        direction: direction(item.value),
        startValue: item.value,
        endValue: item.value
      });
      if (spec.labels.mode === "direct" && spec.labels.showValues) {
        labels.push({
          datumId: item.datum.id,
          role: "value",
          text: `${series}: ${formatChartValue(item.value, spec.numberFormat)}`,
          x,
          y: y - 10,
          anchor: "middle",
          primaryHighlight: highlighted
        });
      }
    }
  }

  if (spec.labels.mode === "direct") {
    categories.forEach((category) => {
      labels.push({
        datumId: `category:${category}`,
        role: "category",
        text: category,
        x: xForCategory(category),
        y: bottom + 18,
        anchor: "middle",
        primaryHighlight: false
      });
    });
  }

  if (seriesNames.some((series) => data.filter((item) => item.datum.series === series).length < 2)) {
    diagnostics.push({
      code: "label-density-warning",
      message: "Slope series cần ít nhất hai mốc để thể hiện hướng thay đổi.",
      recommendation: "Bổ sung mốc còn thiếu hoặc dùng dot plot nếu mỗi series chỉ có một giá trị."
    });
  }

  return {
    ok: true,
    marks,
    labels,
    baseline: { orientation: "horizontal", x: left, y: baselineY, length: right - left },
    diagnostics,
    domain
  };
}

function dotGeometry(
  spec: ChartSpec,
  bounds: ChartGeometryBounds,
  data: readonly NumericDatum[],
  diagnostics: ChartGeometryDiagnostic[]
): EditorialGeometrySuccess {
  const result = horizontalBars(spec, bounds, data, diagnostics);
  const baselineX = result.baseline.x;
  result.marks = result.marks.flatMap((mark) => {
    const centerY = mark.y + (mark.height ?? 0) / 2;
    const valueX = mark.direction === "negative" ? mark.x : mark.x + (mark.width ?? 0);
    const point: ChartGeometryMark = {
      kind: "circle",
      datumId: mark.datumId,
      x: valueX,
      y: centerY,
      radius: mark.primaryHighlight ? 6 : 4,
      primaryHighlight: mark.primaryHighlight,
      ...(mark.direction ? { direction: mark.direction } : {}),
      ...(mark.startValue !== undefined ? { startValue: mark.startValue } : {}),
      ...(mark.endValue !== undefined ? { endValue: mark.endValue } : {})
    };
    if (spec.variant === "lollipop") {
      return [
        {
          kind: "line" as const,
          datumId: `${mark.datumId}:stem`,
          x: baselineX,
          y: centerY,
          x2: valueX,
          y2: centerY,
          primaryHighlight: false
        },
        point
      ];
    }
    return [point];
  });
  return result;
}

export function buildEditorialChartGeometry(
  spec: ChartSpec,
  bounds: ChartGeometryBounds
): EditorialGeometryResult {
  if (!isEditorialVariant(spec.variant)) {
    return {
      ok: false,
      diagnostics: [
        {
          code: "unsupported-editorial-variant",
          message: `${spec.variant} thuộc advanced chart adapter, không thuộc editorial geometry.`,
          recommendation: "Gửi spec qua ECharts adapter boundary hoặc chọn editorial variant."
        }
      ]
    };
  }
  const diagnostics: ChartGeometryDiagnostic[] = [];
  const data = resolveNumericData(spec, diagnostics);
  if (data.length === 0) {
    return {
      ok: false,
      diagnostics: [
        ...diagnostics,
        {
          code: "empty-numeric-data",
          message: "Chart không còn numeric datum sau khi áp dụng missing-value policy.",
          recommendation: "Bổ sung giá trị thật hoặc trình bày empty state thay vì vẽ chart."
        }
      ]
    };
  }

  switch (spec.variant) {
    case "horizontal-bar":
    case "bullet":
      return horizontalBars(spec, bounds, data, diagnostics);
    case "vertical-bar":
      return standardVerticalBars(spec, bounds, data, diagnostics);
    case "grouped-bar":
      return groupedBars(spec, bounds, data, diagnostics);
    case "stacked-bar":
      return stackedBars(spec, bounds, data, diagnostics);
    case "line":
    case "area":
      return lineGeometry(spec, bounds, data, diagnostics);
    case "slope":
      return slopeGeometry(spec, bounds, data, diagnostics);
    case "dot-plot":
    case "lollipop":
      return dotGeometry(spec, bounds, data, diagnostics);
    case "waterfall":
      return waterfallGeometry(spec, bounds, data, diagnostics);
    default:
      return {
        ok: false,
        diagnostics: [
          {
            code: "unsupported-editorial-variant",
            message: `${spec.variant} không có editorial geometry implementation.`,
            recommendation: "Dùng advanced adapter hoặc bổ sung focused geometry implementation cho variant này."
          }
        ]
      };
  }
}
