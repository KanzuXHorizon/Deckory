import { z } from "zod";
import type { DeckComponentDefinition } from "./component-registry";

export type InspectorPathSegment = string | number;
export type InspectorPath = readonly InspectorPathSegment[];

interface InspectorFieldBase {
  id: string;
  label: string;
  path: InspectorPath;
  help?: string;
  required?: boolean;
}

export interface InspectorTextField extends InspectorFieldBase {
  type: "text" | "multiline";
  placeholder?: string;
  maxLength?: number;
}

export interface InspectorNumberField extends InspectorFieldBase {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

export interface InspectorBooleanField extends InspectorFieldBase { type: "boolean"; }
export interface InspectorOption { label: string; value: string; }
export interface InspectorChoiceField extends InspectorFieldBase {
  type: "select" | "segmented";
  options: readonly InspectorOption[];
}
export interface InspectorColorTokenField extends InspectorFieldBase {
  type: "color-token";
  allowedTokens?: readonly string[];
}
export interface InspectorAssetField extends InspectorFieldBase {
  type: "asset";
  acceptedTypes?: readonly string[];
}
export interface InspectorDataTableField extends InspectorFieldBase {
  type: "data-table";
  columns: readonly { id: string; label: string }[];
}
export interface InspectorListField extends InspectorFieldBase {
  type: "list";
  item: InspectorField;
  minItems?: number;
  maxItems?: number;
}
export interface InspectorObjectGroupField extends InspectorFieldBase {
  type: "object-group";
  fields: readonly InspectorField[];
}

export type InspectorField =
  | InspectorTextField
  | InspectorNumberField
  | InspectorBooleanField
  | InspectorChoiceField
  | InspectorColorTokenField
  | InspectorAssetField
  | InspectorDataTableField
  | InspectorListField
  | InspectorObjectGroupField;

export type InspectorSchema = readonly InspectorField[];

const stableId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nonEmpty = z.string().trim().min(1);
const pathSchema = z.array(z.union([nonEmpty, z.number().int().nonnegative()])).min(1).max(32);
const common = {
  id: stableId,
  label: nonEmpty.max(160),
  path: pathSchema,
  help: z.string().trim().min(1).max(500).optional(),
  required: z.boolean().optional()
};

const optionSchema = z.object({ label: nonEmpty.max(120), value: nonEmpty.max(160) }).strict();
let inspectorFieldSchema: z.ZodType<InspectorField>;
inspectorFieldSchema = z.lazy(() => z.discriminatedUnion("type", [
  z.object({ ...common, type: z.literal("text"), placeholder: z.string().max(300).optional(), maxLength: z.number().int().positive().optional() }).strict(),
  z.object({ ...common, type: z.literal("multiline"), placeholder: z.string().max(300).optional(), maxLength: z.number().int().positive().optional() }).strict(),
  z.object({ ...common, type: z.literal("number"), min: z.number().finite().optional(), max: z.number().finite().optional(), step: z.number().finite().positive().optional() }).strict(),
  z.object({ ...common, type: z.literal("boolean") }).strict(),
  z.object({ ...common, type: z.literal("select"), options: z.array(optionSchema).min(1).max(100) }).strict(),
  z.object({ ...common, type: z.literal("segmented"), options: z.array(optionSchema).min(1).max(12) }).strict(),
  z.object({ ...common, type: z.literal("color-token"), allowedTokens: z.array(nonEmpty).max(256).optional() }).strict(),
  z.object({ ...common, type: z.literal("asset"), acceptedTypes: z.array(nonEmpty).max(32).optional() }).strict(),
  z.object({ ...common, type: z.literal("data-table"), columns: z.array(z.object({ id: stableId, label: nonEmpty.max(120) }).strict()).min(1).max(128) }).strict(),
  z.object({ ...common, type: z.literal("list"), item: inspectorFieldSchema, minItems: z.number().int().nonnegative().optional(), maxItems: z.number().int().positive().optional() }).strict(),
  z.object({ ...common, type: z.literal("object-group"), fields: z.array(inspectorFieldSchema).min(1).max(128) }).strict()
])) as z.ZodType<InspectorField>;

export const InspectorFieldSchema = inspectorFieldSchema;
export const InspectorSchemaSchema = z.array(InspectorFieldSchema).max(256);

const unsafePathSegments = new Set(["__proto__", "prototype", "constructor"]);

function assertSafePath(path: InspectorPath): void {
  if (path.length === 0) throw new TypeError("Inspector path không được rỗng.");
  for (const segment of path) {
    if (typeof segment === "string" && unsafePathSegments.has(segment)) {
      throw new TypeError(`Inspector path chứa segment không an toàn: ${segment}.`);
    }
  }
}

function freezeDeep<T>(value: T, seen = new Set<object>()): T {
  if (value === null || typeof value !== "object") return value;
  const objectValue = value as object;
  if (seen.has(objectValue)) return value;
  seen.add(objectValue);
  for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child, seen);
  return Object.freeze(value);
}

type InspectorPathPatternSegment = InspectorPathSegment | "*";
type InspectorPathPattern = readonly InspectorPathPatternSegment[];

function visitFields(
  fields: readonly InspectorField[],
  parentPath: InspectorPathPattern,
  callback: (field: InspectorField, effectivePath: InspectorPathPattern) => void
): void {
  for (const field of fields) {
    const effectivePath = [...parentPath, ...field.path];
    callback(field, effectivePath);
    if (field.type === "object-group") visitFields(field.fields, effectivePath, callback);
    if (field.type === "list") visitFields([field.item], [...effectivePath, "*"], callback);
  }
}

function inspectorPathPatterns(fields: readonly InspectorField[]): readonly InspectorPathPattern[] {
  const patterns: InspectorPathPattern[] = [];
  visitFields(fields, [], (_field, effectivePath) => patterns.push(effectivePath));
  return patterns;
}

function matchesInspectorPath(pattern: InspectorPathPattern, path: InspectorPath): boolean {
  if (pattern.length !== path.length) return false;
  return pattern.every((segment, index) => segment === "*"
    ? typeof path[index] === "number"
    : segment === path[index]);
}

export function createInspectorSchema(fields: readonly InspectorField[]): InspectorSchema {
  const parsed = InspectorSchemaSchema.parse(fields);
  const ids = new Set<string>();
  const paths = new Set<string>();
  visitFields(parsed, [], (field, effectivePath) => {
    assertSafePath(field.path);
    if (ids.has(field.id)) throw new TypeError(`ID Inspector "${field.id}" bị trùng.`);
    ids.add(field.id);
    const pathKey = JSON.stringify(effectivePath);
    if (paths.has(pathKey)) throw new TypeError(`Inspector path "${effectivePath.join(".")}" bị trùng.`);
    paths.add(pathKey);

    if (field.type === "number" && field.min !== undefined && field.max !== undefined && field.min > field.max) {
      throw new TypeError(`Inspector field ${field.id} yêu cầu min không lớn hơn max.`);
    }
    if (field.type === "list" && field.minItems !== undefined && field.maxItems !== undefined && field.minItems > field.maxItems) {
      throw new TypeError(`Inspector field ${field.id} yêu cầu minItems không lớn hơn maxItems.`);
    }
    if (field.type === "select" || field.type === "segmented") {
      const values = new Set<string>();
      for (const option of field.options) {
        if (values.has(option.value)) throw new TypeError(`Inspector option "${option.value}" bị trùng trong field ${field.id}.`);
        values.add(option.value);
      }
    }
    if (field.type === "data-table") {
      const columns = new Set<string>();
      for (const column of field.columns) {
        if (columns.has(column.id)) throw new TypeError(`Inspector column "${column.id}" bị trùng trong field ${field.id}.`);
        columns.add(column.id);
      }
    }
  });
  return freezeDeep(parsed);
}

export function getInspectorValue(source: unknown, path: InspectorPath): unknown {
  assertSafePath(path);
  let current = source;
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[segment];
  }
  return current;
}

function cloneContainer(value: unknown, nextSegment: InspectorPathSegment): Record<string | number, unknown> | unknown[] {
  if (Array.isArray(value)) return [...value];
  if (value !== null && typeof value === "object") return { ...(value as Record<string, unknown>) };
  return typeof nextSegment === "number" ? [] : {};
}

function setInspectorValue(source: unknown, path: InspectorPath, value: unknown): unknown {
  assertSafePath(path);
  const root = cloneContainer(source, path[0] ?? "root");
  let cursor = root as Record<string | number, unknown>;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index]!;
    const nextSegment = path[index + 1]!;
    const next = cloneContainer(cursor[segment], nextSegment);
    cursor[segment] = next;
    cursor = next as Record<string | number, unknown>;
  }
  cursor[path[path.length - 1]!] = value;
  return root;
}

export type ComponentPropsPatchResult<Props> =
  | { ok: true; props: Props }
  | { ok: false; issues: readonly { path: readonly PropertyKey[]; message: string }[] };

export function patchComponentProps<Props>(
  definition: DeckComponentDefinition<Props>,
  currentProps: Props,
  path: InspectorPath,
  value: unknown
): ComponentPropsPatchResult<Props> {
  assertSafePath(path);
  const declared = inspectorPathPatterns(definition.inspector).some((pattern) => matchesInspectorPath(pattern, path));
  if (!declared) {
    throw new TypeError(`Inspector path "${path.join(".")}" không được khai báo cho component ${definition.id}@${definition.version}.`);
  }
  const candidate = setInspectorValue(currentProps, path, value);
  const parsed = definition.propsSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message }))
    };
  }
  return { ok: true, props: parsed.data as Props };
}
