import type { ReactNode } from "react";
import { z } from "zod";
import type { InspectorSchema } from "./inspector-schema";
import { createInspectorSchema } from "./inspector-schema";
import type { ExportCapability } from "./primitives";

const stableIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semanticVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
const allowedExportCapabilities = new Set<ExportCapability>(["html", "svg", "png", "pdf", "pptx"]);

type StrictObjectSchema = z.ZodObject<any>;

export interface DeckComponentRenderContext<Props> {
  props: Props;
  mode: "final" | "thumbnail" | "studio" | "export";
}

export interface DeckComponentMigrationContext {
  fromVersion: string;
  toVersion: string;
  props: unknown;
}

export interface DeckComponentDefinition<
  Props = unknown,
  Schema extends StrictObjectSchema = StrictObjectSchema
> {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly purpose?: string;
  readonly propsSchema: Schema;
  readonly defaultFrame: Readonly<{ width: number; height: number }>;
  readonly inspector: InspectorSchema;
  readonly renderer: (context: DeckComponentRenderContext<Props>) => ReactNode;
  readonly accessibleSummary: (props: Props) => string;
  readonly exportCapabilities: readonly ExportCapability[];
  readonly migrateProps?: (context: DeckComponentMigrationContext) => unknown | undefined;
}

export interface RegisterDeckComponentInput<Schema extends StrictObjectSchema> {
  id: string;
  version: string;
  displayName?: string;
  purpose?: string;
  propsSchema: Schema;
  defaultFrame: Readonly<{ width: number; height: number }>;
  inspector: InspectorSchema;
  renderer: (context: DeckComponentRenderContext<z.output<Schema>>) => ReactNode;
  accessibleSummary: (props: z.output<Schema>) => string;
  exportCapabilities: readonly ExportCapability[];
  migrateProps?: (context: DeckComponentMigrationContext) => unknown | undefined;
}

function parseVersion(version: string): readonly [number, number, number] {
  const match = semanticVersionPattern.exec(version);
  if (!match) throw new TypeError(`Phiên bản component "${version}" không phải semantic version hợp lệ.`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return left.localeCompare(right);
}

function majorVersion(version: string): number {
  return parseVersion(version)[0];
}

function isStrictObjectSchema(schema: StrictObjectSchema): boolean {
  const definition = (schema as unknown as {
    _def?: {
      unknownKeys?: unknown;
      catchall?: { type?: unknown; _def?: { typeName?: unknown } };
    };
  })._def;
  return definition?.unknownKeys === "strict" ||
    definition?.catchall?.type === "never" ||
    definition?.catchall?._def?.typeName === "ZodNever";
}

function assertDefinitionMetadata(definition: {
  id: string;
  version: string;
  propsSchema: StrictObjectSchema;
  defaultFrame: Readonly<{ width: number; height: number }>;
  renderer: unknown;
  accessibleSummary: unknown;
  exportCapabilities: readonly ExportCapability[];
}): void {
  if (!stableIdPattern.test(definition.id)) {
    throw new TypeError(`Component id "${definition.id}" phải là stable kebab-case ID.`);
  }
  parseVersion(definition.version);
  if (!isStrictObjectSchema(definition.propsSchema)) {
    throw new TypeError(`Component ${definition.id}@${definition.version} phải dùng propsSchema strict.`);
  }
  if (!Number.isFinite(definition.defaultFrame.width) || definition.defaultFrame.width <= 0 ||
      !Number.isFinite(definition.defaultFrame.height) || definition.defaultFrame.height <= 0) {
    throw new TypeError(`Component ${definition.id}@${definition.version} có defaultFrame không hợp lệ.`);
  }
  if (typeof definition.renderer !== "function") {
    throw new TypeError(`Component ${definition.id}@${definition.version} thiếu renderer tin cậy.`);
  }
  if (typeof definition.accessibleSummary !== "function") {
    throw new TypeError(`Component ${definition.id}@${definition.version} thiếu accessibleSummary.`);
  }
  for (const capability of definition.exportCapabilities) {
    if (!allowedExportCapabilities.has(capability)) {
      throw new TypeError(`Export capability không được hỗ trợ: ${String(capability)}.`);
    }
  }
}

export function registerDeckComponent<Schema extends StrictObjectSchema>(
  definition: RegisterDeckComponentInput<Schema>
): DeckComponentDefinition<z.output<Schema>, Schema> {
  assertDefinitionMetadata(definition);
  const normalized: DeckComponentDefinition<z.output<Schema>, Schema> = {
    id: definition.id,
    version: definition.version,
    displayName: definition.displayName?.trim() || definition.id,
    ...(definition.purpose ? { purpose: definition.purpose.trim() } : {}),
    propsSchema: definition.propsSchema,
    defaultFrame: Object.freeze({ ...definition.defaultFrame }),
    inspector: createInspectorSchema(definition.inspector),
    renderer: definition.renderer,
    accessibleSummary: definition.accessibleSummary,
    exportCapabilities: Object.freeze([...new Set(definition.exportCapabilities)]),
    ...(definition.migrateProps ? { migrateProps: definition.migrateProps } : {})
  };
  return Object.freeze(normalized);
}

export type ResolvedComponentInstance<Props = unknown> =
  | {
      status: "ready";
      componentId: string;
      requestedVersion: string;
      resolvedVersion: string;
      migrated: boolean;
      definition: DeckComponentDefinition<Props, any>;
      props: Props;
    }
  | {
      status: "missing";
      componentId: string;
      requestedVersion: string;
      accessibleSummary: string;
    };

export class ComponentRegistry {
  readonly #definitions = new Map<string, DeckComponentDefinition<any, any>>();
  #sealed = false;

  constructor(definitions: readonly DeckComponentDefinition<any, any>[] = []) {
    definitions.forEach((definition) => this.register(definition));
  }

  register<Props, Schema extends StrictObjectSchema>(definition: DeckComponentDefinition<Props, Schema>): this {
    if (this.#sealed) throw new Error("ComponentRegistry đã khóa cho Presenter và không nhận đăng ký mới.");
    const key = `${definition.id}@${definition.version}`;
    if (this.#definitions.has(key)) throw new Error(`Component ${key} đã đăng ký.`);
    this.#definitions.set(key, definition);
    return this;
  }

  seal(): void {
    this.#sealed = true;
  }

  get sealed(): boolean {
    return this.#sealed;
  }

  resolve<Props = unknown>(id: string, version: string): DeckComponentDefinition<Props, any> | undefined {
    return this.#definitions.get(`${id}@${version}`) as DeckComponentDefinition<Props, any> | undefined;
  }

  parseProps<Props = unknown>(id: string, version: string, props: unknown): Props {
    const definition = this.resolve<Props>(id, version);
    if (!definition) throw new Error(`Không tìm thấy component ${id}@${version}.`);
    return definition.propsSchema.parse(props) as Props;
  }

  resolveInstance(id: string, requestedVersion: string, props: unknown): ResolvedComponentInstance<any> {
    const exact = this.resolve<any>(id, requestedVersion);
    if (exact) {
      return {
        status: "ready",
        componentId: id,
        requestedVersion,
        resolvedVersion: requestedVersion,
        migrated: false,
        definition: exact,
        props: exact.propsSchema.parse(props)
      };
    }

    const requestedMajor = majorVersion(requestedVersion);
    const candidates = [...this.#definitions.values()]
      .filter((definition) => definition.id === id && majorVersion(definition.version) === requestedMajor && definition.migrateProps)
      .sort((left, right) => compareVersions(right.version, left.version));

    for (const definition of candidates) {
      const migrated = definition.migrateProps?.({
        fromVersion: requestedVersion,
        toVersion: definition.version,
        props
      });
      if (migrated === undefined) continue;
      return {
        status: "ready",
        componentId: id,
        requestedVersion,
        resolvedVersion: definition.version,
        migrated: true,
        definition,
        props: definition.propsSchema.parse(migrated)
      };
    }

    return {
      status: "missing",
      componentId: id,
      requestedVersion,
      accessibleSummary: `Không thể tải component ${id} phiên bản ${requestedVersion}.`
    };
  }

  list(): readonly DeckComponentDefinition<any, any>[] {
    return Object.freeze([...this.#definitions.values()]);
  }
}

export function resolveDeckComponent<Props = unknown>(
  registry: ComponentRegistry,
  id: string,
  version: string
): DeckComponentDefinition<Props, any> | undefined {
  return registry.resolve<Props>(id, version);
}
