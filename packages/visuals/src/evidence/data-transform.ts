import {
  DatasetSchema,
  type DataRow,
  type Dataset,
  type DatasetColumn,
  type DatasetLineage,
  type DataValue
} from "./domain";

export type { Dataset } from "./domain";

export type SelectTransform = {
  id: string;
  version: 1;
  type: "select";
  fields: readonly string[];
};

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "in";

export type FilterTransform = {
  id: string;
  version: 1;
  type: "filter";
  predicate: {
    field: string;
    operator: FilterOperator;
    value: DataValue | readonly DataValue[];
  };
};

export type SortTransform = {
  id: string;
  version: 1;
  type: "sort";
  by: readonly {
    field: string;
    direction: "asc" | "desc";
  }[];
};

export type DeriveOperand =
  | { kind: "field"; field: string }
  | { kind: "literal"; value: DataValue };

export type DeriveExpression = {
  operator: "add" | "subtract" | "multiply" | "divide" | "concat";
  left: DeriveOperand;
  right: DeriveOperand;
};

export type DeriveTransform = {
  id: string;
  version: 1;
  type: "derive";
  fields: readonly {
    output: string;
    label: string;
    expression: DeriveExpression;
  }[];
};

export type AggregateOperation = "count" | "sum" | "mean" | "min" | "max";

export type GroupAggregateTransform = {
  id: string;
  version: 1;
  type: "group-aggregate";
  groupBy: readonly string[];
  measures: readonly {
    field: string;
    operation: AggregateOperation;
    output: string;
    label: string;
  }[];
};

export type PivotTransform = {
  id: string;
  version: 1;
  type: "pivot";
  index: readonly string[];
  column: string;
  value: string;
  operation: "first" | "sum" | "mean" | "count";
};

export type DataTransform =
  | SelectTransform
  | FilterTransform
  | SortTransform
  | DeriveTransform
  | GroupAggregateTransform
  | PivotTransform;

export type DataTransformDiagnosticCode =
  | "invalid-dataset"
  | "duplicate-transform-id"
  | "unknown-field"
  | "invalid-operand"
  | "non-finite-result"
  | "duplicate-output-field"
  | "empty-transform"
  | "invalid-pivot-key";

export type DataTransformDiagnostic = {
  code: DataTransformDiagnosticCode;
  transformId: string;
  message: string;
  recommendation: string;
  rowIndex?: number;
  field?: string;
};

export type DataTransformSuccess = {
  ok: true;
  dataset: Dataset;
  lineage: DatasetLineage;
};

export type DataTransformFailure = {
  ok: false;
  diagnostics: DataTransformDiagnostic[];
};

export type DataTransformResult = DataTransformSuccess | DataTransformFailure;

function cloneDataset(dataset: Dataset): Dataset {
  return {
    ...dataset,
    sourceIds: [...dataset.sourceIds],
    columns: dataset.columns.map((column) => ({ ...column })),
    rows: dataset.rows.map((row) => ({ ...row })),
    ...(dataset.lineage
      ? {
          lineage: {
            ...dataset.lineage,
            sourceIds: [...dataset.lineage.sourceIds],
            transforms: dataset.lineage.transforms.map((step) => ({ ...step }))
          }
        }
      : {})
  };
}

function fail(
  transform: DataTransform,
  code: DataTransformDiagnosticCode,
  message: string,
  recommendation: string,
  details: { rowIndex?: number; field?: string } = {}
): DataTransformFailure {
  return {
    ok: false,
    diagnostics: [
      {
        code,
        transformId: transform.id,
        message,
        recommendation,
        ...details
      }
    ]
  };
}

function columnMap(dataset: Dataset): Map<string, DatasetColumn> {
  return new Map(dataset.columns.map((column) => [column.key, column]));
}

function requireFields(
  dataset: Dataset,
  transform: DataTransform,
  fields: readonly string[]
): DataTransformFailure | undefined {
  const available = columnMap(dataset);
  const missing = fields.find((field) => !available.has(field));
  if (!missing) return undefined;
  return fail(
    transform,
    "unknown-field",
    `Transform ${transform.id} tham chiếu field không tồn tại: ${missing}.`,
    "Chọn field có trong dataset columns hoặc thêm derive transform trước bước này.",
    { field: missing }
  );
}

function baseLineage(dataset: Dataset): DatasetLineage {
  return dataset.lineage
    ? {
        ...dataset.lineage,
        sourceIds: [...dataset.lineage.sourceIds],
        transforms: dataset.lineage.transforms.map((step) => ({ ...step }))
      }
    : {
        sourceDatasetId: dataset.id,
        sourceIds: [...dataset.sourceIds],
        transforms: []
      };
}

function finish(
  source: Dataset,
  transform: DataTransform,
  columns: DatasetColumn[],
  rows: DataRow[]
): DataTransformSuccess {
  const lineage = baseLineage(source);
  lineage.transforms.push({
    transformId: transform.id,
    type: transform.type,
    version: transform.version,
    inputRowCount: source.rows.length,
    outputRowCount: rows.length
  });
  const dataset: Dataset = {
    ...source,
    id: `${source.id}--${transform.id}`,
    label: `${source.label} — ${transform.id}`,
    columns,
    rows,
    sourceIds: [...source.sourceIds],
    lineage
  };
  return { ok: true, dataset, lineage };
}

function selectTransform(dataset: Dataset, transform: SelectTransform): DataTransformResult {
  if (transform.fields.length === 0) {
    return fail(
      transform,
      "empty-transform",
      "Select transform phải giữ ít nhất một field.",
      "Khai báo fields theo thứ tự cần xuất."
    );
  }
  const duplicateField = transform.fields.find(
    (field, index) => transform.fields.indexOf(field) !== index
  );
  if (duplicateField) {
    return fail(
      transform,
      "duplicate-output-field",
      `Select transform khai báo field trùng: ${duplicateField}.`,
      "Mỗi field chỉ được xuất hiện một lần trong select fields.",
      { field: duplicateField }
    );
  }
  const missing = requireFields(dataset, transform, transform.fields);
  if (missing) return missing;
  const columnsByKey = columnMap(dataset);
  const columns = transform.fields.map((field) => ({ ...columnsByKey.get(field)! }));
  const rows = dataset.rows.map((row) =>
    Object.fromEntries(transform.fields.map((field) => [field, row[field] ?? null]))
  );
  return finish(dataset, transform, columns, rows);
}

function compareValues(left: DataValue, right: DataValue): number {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }
  return String(left).localeCompare(String(right), "vi", {
    numeric: true,
    sensitivity: "base"
  });
}

function filterMatches(
  value: DataValue,
  operator: FilterOperator,
  expected: DataValue | readonly DataValue[]
): boolean {
  switch (operator) {
    case "eq":
      return value === expected;
    case "neq":
      return value !== expected;
    case "gt":
      return !Array.isArray(expected) && compareValues(value, expected as DataValue) > 0;
    case "gte":
      return !Array.isArray(expected) && compareValues(value, expected as DataValue) >= 0;
    case "lt":
      return !Array.isArray(expected) && compareValues(value, expected as DataValue) < 0;
    case "lte":
      return !Array.isArray(expected) && compareValues(value, expected as DataValue) <= 0;
    case "contains":
      return (
        typeof value === "string" &&
        !Array.isArray(expected) &&
        typeof expected === "string" &&
        value.toLocaleLowerCase("vi-VN").includes(expected.toLocaleLowerCase("vi-VN"))
      );
    case "in":
      return Array.isArray(expected) && expected.includes(value);
  }
}

function filterTransform(dataset: Dataset, transform: FilterTransform): DataTransformResult {
  const expectsArray = transform.predicate.operator === "in";
  const receivedArray = Array.isArray(transform.predicate.value);
  if (expectsArray !== receivedArray) {
    return fail(
      transform,
      "invalid-operand",
      expectsArray
        ? "Filter operator in yêu cầu một mảng giá trị."
        : `Filter operator ${transform.predicate.operator} yêu cầu một giá trị đơn.`,
      "Đổi predicate value đúng với operator đã chọn.",
      { field: transform.predicate.field }
    );
  }
  const missing = requireFields(dataset, transform, [transform.predicate.field]);
  if (missing) return missing;
  const rows = dataset.rows
    .filter((row) =>
      filterMatches(
        row[transform.predicate.field] ?? null,
        transform.predicate.operator,
        transform.predicate.value
      )
    )
    .map((row) => ({ ...row }));
  return finish(
    dataset,
    transform,
    dataset.columns.map((column) => ({ ...column })),
    rows
  );
}

function sortTransform(dataset: Dataset, transform: SortTransform): DataTransformResult {
  if (transform.by.length === 0) {
    return fail(
      transform,
      "empty-transform",
      "Sort transform phải có ít nhất một sort key.",
      "Khai báo by với field và direction rõ ràng."
    );
  }
  const missing = requireFields(
    dataset,
    transform,
    transform.by.map((item) => item.field)
  );
  if (missing) return missing;
  const rows = dataset.rows
    .map((row, index) => ({ row: { ...row }, index }))
    .sort((left, right) => {
      for (const sort of transform.by) {
        const comparison = compareValues(
          left.row[sort.field] ?? null,
          right.row[sort.field] ?? null
        );
        if (comparison !== 0) return sort.direction === "asc" ? comparison : -comparison;
      }
      return left.index - right.index;
    })
    .map((item) => item.row);
  return finish(
    dataset,
    transform,
    dataset.columns.map((column) => ({ ...column })),
    rows
  );
}

function operandFields(operand: DeriveOperand): string[] {
  return operand.kind === "field" ? [operand.field] : [];
}

function operandValue(row: DataRow, operand: DeriveOperand): DataValue {
  return operand.kind === "field" ? (row[operand.field] ?? null) : operand.value;
}

function evaluateExpression(
  expression: DeriveExpression,
  row: DataRow
): { ok: true; value: DataValue; type: DatasetColumn["type"] } | { ok: false; nonFinite: boolean } {
  const left = operandValue(row, expression.left);
  const right = operandValue(row, expression.right);
  if (expression.operator === "concat") {
    return {
      ok: true,
      value: `${left ?? ""}${right ?? ""}`,
      type: "string"
    };
  }
  if (typeof left !== "number" || typeof right !== "number") {
    return { ok: false, nonFinite: false };
  }
  const value =
    expression.operator === "add"
      ? left + right
      : expression.operator === "subtract"
        ? left - right
        : expression.operator === "multiply"
          ? left * right
          : left / right;
  if (!Number.isFinite(value)) return { ok: false, nonFinite: true };
  return { ok: true, value, type: "number" };
}

function deriveTransform(dataset: Dataset, transform: DeriveTransform): DataTransformResult {
  if (transform.fields.length === 0) {
    return fail(
      transform,
      "empty-transform",
      "Derive transform phải khai báo ít nhất một output field.",
      "Thêm field với expression khai báo, không dùng executable handler."
    );
  }
  const allInputFields = transform.fields.flatMap((field) => [
    ...operandFields(field.expression.left),
    ...operandFields(field.expression.right)
  ]);
  const missing = requireFields(dataset, transform, allInputFields);
  if (missing) return missing;
  const outputs = new Set<string>();
  for (const field of transform.fields) {
    if (outputs.has(field.output)) {
      return fail(
        transform,
        "duplicate-output-field",
        `Derive transform khai báo output trùng: ${field.output}.`,
        "Mỗi output field phải có stable key duy nhất.",
        { field: field.output }
      );
    }
    outputs.add(field.output);
  }

  const outputTypes = new Map<string, DatasetColumn["type"]>();
  const rows: DataRow[] = [];
  for (const [rowIndex, sourceRow] of dataset.rows.entries()) {
    const row = { ...sourceRow };
    for (const field of transform.fields) {
      const evaluated = evaluateExpression(field.expression, row);
      if (!evaluated.ok) {
        return fail(
          transform,
          evaluated.nonFinite ? "non-finite-result" : "invalid-operand",
          evaluated.nonFinite
            ? `Derive ${field.output} tạo kết quả không hữu hạn tại row ${rowIndex}.`
            : `Derive ${field.output} yêu cầu operands phù hợp với operator ${field.expression.operator}.`,
          evaluated.nonFinite
            ? "Kiểm tra phép chia cho 0 và dữ liệu đầu vào trước khi derive."
            : "Dùng number operands cho phép toán số hoặc concat cho chuỗi.",
          { rowIndex, field: field.output }
        );
      }
      row[field.output] = evaluated.value;
      outputTypes.set(field.output, evaluated.type);
    }
    rows.push(row);
  }

  const existingKeys = new Set(dataset.columns.map((column) => column.key));
  const columns = dataset.columns.map((column) => ({ ...column }));
  for (const field of transform.fields) {
    const nextColumn: DatasetColumn = {
      key: field.output,
      label: field.label,
      type: outputTypes.get(field.output) ?? "string"
    };
    if (existingKeys.has(field.output)) {
      const index = columns.findIndex((column) => column.key === field.output);
      columns[index] = nextColumn;
    } else {
      columns.push(nextColumn);
    }
  }
  return finish(dataset, transform, columns, rows);
}

function aggregateValues(
  values: readonly DataValue[],
  operation: AggregateOperation
): DataValue | undefined {
  if (operation === "count") return values.length;
  const numericValues = values.filter((value): value is number => typeof value === "number");
  if (numericValues.length !== values.length || numericValues.length === 0) return undefined;
  if (operation === "sum") return numericValues.reduce((sum, value) => sum + value, 0);
  if (operation === "mean") {
    return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  }
  if (operation === "min") return Math.min(...numericValues);
  return Math.max(...numericValues);
}

function groupAggregateTransform(
  dataset: Dataset,
  transform: GroupAggregateTransform
): DataTransformResult {
  if (transform.groupBy.length === 0 || transform.measures.length === 0) {
    return fail(
      transform,
      "empty-transform",
      "Group-aggregate cần groupBy và measures.",
      "Khai báo ít nhất một group key và một measure."
    );
  }
  const missing = requireFields(dataset, transform, [
    ...transform.groupBy,
    ...transform.measures.map((measure) => measure.field)
  ]);
  if (missing) return missing;
  const outputKeys = new Set(transform.groupBy);
  for (const measure of transform.measures) {
    if (outputKeys.has(measure.output)) {
      return fail(
        transform,
        "duplicate-output-field",
        `Group-aggregate output ghi đè field đã tồn tại trong result: ${measure.output}.`,
        "Đặt output key duy nhất, khác groupBy và các measure khác.",
        { field: measure.output }
      );
    }
    outputKeys.add(measure.output);
  }
  const groups = new Map<string, DataRow[]>();
  for (const row of dataset.rows) {
    const key = JSON.stringify(transform.groupBy.map((field) => row[field] ?? null));
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  }

  const rows: DataRow[] = [];
  for (const key of [...groups.keys()].sort((a, b) => a.localeCompare(b, "en"))) {
    const groupRows = groups.get(key) ?? [];
    const row: DataRow = {};
    for (const field of transform.groupBy) row[field] = groupRows[0]?.[field] ?? null;
    for (const measure of transform.measures) {
      const value = aggregateValues(
        groupRows.map((groupRow) => groupRow[measure.field] ?? null),
        measure.operation
      );
      if (value === undefined || (typeof value === "number" && !Number.isFinite(value))) {
        return fail(
          transform,
          "invalid-operand",
          `Measure ${measure.output} không thể áp dụng ${measure.operation} cho field ${measure.field}.`,
          "Dùng field số cho sum/mean/min/max hoặc count cho mọi kiểu dữ liệu.",
          { field: measure.field }
        );
      }
      row[measure.output] = value;
    }
    rows.push(row);
  }

  const columnsByKey = columnMap(dataset);
  const columns: DatasetColumn[] = [
    ...transform.groupBy.map((field) => ({ ...columnsByKey.get(field)! })),
    ...transform.measures.map((measure) => ({
      key: measure.output,
      label: measure.label,
      type: "number" as const
    }))
  ];
  return finish(dataset, transform, columns, rows);
}

function pivotAggregate(
  values: readonly DataValue[],
  operation: PivotTransform["operation"]
): DataValue | undefined {
  if (operation === "first") return values[0] ?? null;
  if (operation === "count") return values.length;
  const numericValues = values.filter((value): value is number => typeof value === "number");
  if (numericValues.length !== values.length || numericValues.length === 0) return undefined;
  if (operation === "sum") return numericValues.reduce((sum, value) => sum + value, 0);
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function pivotTransform(dataset: Dataset, transform: PivotTransform): DataTransformResult {
  if (transform.index.length === 0) {
    return fail(
      transform,
      "empty-transform",
      "Pivot transform cần ít nhất một index field.",
      "Khai báo index để mỗi output row có stable identity."
    );
  }
  const missing = requireFields(dataset, transform, [
    ...transform.index,
    transform.column,
    transform.value
  ]);
  if (missing) return missing;
  const pivotKeys = new Set<string>();
  const grouped = new Map<string, DataRow[]>();
  for (const [rowIndex, row] of dataset.rows.entries()) {
    const rawPivotKey = row[transform.column];
    if (rawPivotKey === null || rawPivotKey === undefined) {
      return fail(
        transform,
        "invalid-pivot-key",
        `Pivot key rỗng tại row ${rowIndex}.`,
        "Lọc hoặc thay thế missing pivot key trước khi pivot.",
        { rowIndex, field: transform.column }
      );
    }
    pivotKeys.add(String(rawPivotKey));
    const groupKey = JSON.stringify(transform.index.map((field) => row[field] ?? null));
    const current = grouped.get(groupKey) ?? [];
    current.push(row);
    grouped.set(groupKey, current);
  }
  const orderedPivotKeys = [...pivotKeys].sort((a, b) =>
    a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" })
  );
  const indexKeys = new Set(transform.index);
  const collidingPivotKey = orderedPivotKeys.find((key) => indexKeys.has(key));
  if (collidingPivotKey) {
    return fail(
      transform,
      "invalid-pivot-key",
      `Pivot key ghi đè index field: ${collidingPivotKey}.`,
      "Đổi pivot category hoặc index field để output columns có key duy nhất.",
      { field: collidingPivotKey }
    );
  }
  const rows: DataRow[] = [];
  for (const groupKey of [...grouped.keys()].sort((a, b) => a.localeCompare(b, "en"))) {
    const groupRows = grouped.get(groupKey) ?? [];
    const output: DataRow = {};
    for (const field of transform.index) output[field] = groupRows[0]?.[field] ?? null;
    for (const pivotKey of orderedPivotKeys) {
      const values = groupRows
        .filter((row) => String(row[transform.column]) === pivotKey)
        .map((row) => row[transform.value] ?? null);
      if (values.length === 0) {
        output[pivotKey] = null;
        continue;
      }
      const value = pivotAggregate(values, transform.operation);
      if (value === undefined || (typeof value === "number" && !Number.isFinite(value))) {
        return fail(
          transform,
          "invalid-operand",
          `Pivot ${pivotKey} không thể áp dụng ${transform.operation} cho field ${transform.value}.`,
          "Dùng numeric value cho sum/mean hoặc first/count cho dữ liệu khác.",
          { field: transform.value }
        );
      }
      output[pivotKey] = value;
    }
    rows.push(output);
  }

  const columnsByKey = columnMap(dataset);
  const valueColumn = columnsByKey.get(transform.value)!;
  const columns: DatasetColumn[] = [
    ...transform.index.map((field) => ({ ...columnsByKey.get(field)! })),
    ...orderedPivotKeys.map((key) => ({
      key,
      label: key,
      type: transform.operation === "first" ? valueColumn.type : ("number" as const)
    }))
  ];
  return finish(dataset, transform, columns, rows);
}

export function applyDataTransform(
  sourceDataset: Dataset,
  transform: DataTransform
): DataTransformResult {
  const parsed = DatasetSchema.safeParse(sourceDataset);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(
      transform,
      "invalid-dataset",
      `Source dataset không hợp lệ: ${issue?.message ?? "unknown validation error"}`,
      "Sửa columns, rows, source IDs và lineage trước khi chạy transform."
    );
  }
  const dataset = cloneDataset(parsed.data);
  switch (transform.type) {
    case "select":
      return selectTransform(dataset, transform);
    case "filter":
      return filterTransform(dataset, transform);
    case "sort":
      return sortTransform(dataset, transform);
    case "derive":
      return deriveTransform(dataset, transform);
    case "group-aggregate":
      return groupAggregateTransform(dataset, transform);
    case "pivot":
      return pivotTransform(dataset, transform);
  }
}

export function applyDataTransforms(
  sourceDataset: Dataset,
  transforms: readonly DataTransform[]
): DataTransformResult {
  const seenTransformIds = new Set(
    sourceDataset.lineage?.transforms.map((step) => step.transformId) ?? []
  );
  for (const transform of transforms) {
    if (seenTransformIds.has(transform.id)) {
      return fail(
        transform,
        "duplicate-transform-id",
        `Transform ID bị lặp trong lineage: ${transform.id}.`,
        "Mỗi transform step phải có stable ID duy nhất trong toàn bộ lineage."
      );
    }
    seenTransformIds.add(transform.id);
  }
  if (transforms.length === 0) {
    const dataset = cloneDataset(sourceDataset);
    const lineage = baseLineage(dataset);
    return { ok: true, dataset: { ...dataset, lineage }, lineage };
  }
  let current = cloneDataset(sourceDataset);
  let latestResult: DataTransformSuccess | undefined;
  for (const transform of transforms) {
    const result = applyDataTransform(current, transform);
    if (!result.ok) return result;
    latestResult = result;
    current = result.dataset;
  }
  return latestResult!;
}
