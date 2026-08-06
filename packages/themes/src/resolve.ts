import { validateVisualWorld } from "./themes";
import type {
  ThemeDiagnostic,
  ThemeResolution,
  ThemeTokenOverrides,
  ThemeTokens,
  VisualWorld
} from "./types";

const bounds: Readonly<Record<string, { minimum: number; maximum: number }>> = {
  "depth.shadow.blur": { minimum: 0, maximum: 48 },
  "depth.shadow.spread": { minimum: -32, maximum: 32 },
  "depth.shadow.opacity": { minimum: 0, maximum: 0.4 },
  "depth.glow.blur": { minimum: 0, maximum: 56 },
  "depth.glow.opacity": { minimum: 0, maximum: 0.4 },
  "imagery.effects.blur": { minimum: 0, maximum: 16 },
  "imagery.effects.grain": { minimum: 0, maximum: 0.3 },
  "imagery.effects.vignette": { minimum: 0, maximum: 0.4 },
  "imagery.overlay.opacity": { minimum: 0, maximum: 0.65 },
  "backgrounds.grain.opacity": { minimum: 0, maximum: 0.2 },
  "motion.durationFast": { minimum: 0, maximum: 2 },
  "motion.durationStandard": { minimum: 0, maximum: 3 },
  "motion.durationDeliberate": { minimum: 0, maximum: 5 },
  "motion.stagger": { minimum: 0, maximum: 1 },
  "motion.travel": { minimum: 0, maximum: 160 }
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => cloneValue(entry)) as T;
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)])) as T;
  }
  return value;
}

function readPath(root: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cursor: unknown = root;
  for (const part of parts) {
    if (!isPlainObject(cursor) || !(part in cursor)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function validOptionalTokenValue(path: string, candidate: unknown): boolean {
  return path === "imagery.duotone" &&
    Array.isArray(candidate) &&
    candidate.length === 2 &&
    candidate.every((entry) => typeof entry === "string" && /^#[0-9a-f]{6}$/i.test(entry));
}

function compatibleValueTypes(current: unknown, candidate: unknown, path: string): boolean {
  if (current === undefined) return validOptionalTokenValue(path, candidate);
  if (Array.isArray(current) || Array.isArray(candidate)) {
    if (!Array.isArray(current) || !Array.isArray(candidate)) return false;
    if (path === "imagery.duotone") return validOptionalTokenValue(path, candidate);
    const sample = current.find((entry) => entry !== undefined);
    return sample === undefined || candidate.every((entry) => typeof entry === typeof sample);
  }
  if (isPlainObject(current) || isPlainObject(candidate)) return false;
  return typeof current === typeof candidate;
}

type MergePhase = "literal" | "reference";

function mergeOverrides(
  target: Record<string, unknown>,
  fallback: Record<string, unknown>,
  overrides: Record<string, unknown>,
  diagnostics: ThemeDiagnostic[],
  phase: MergePhase,
  prefix = "",
  root: Record<string, unknown> = target,
  blockedReferences: ReadonlySet<string> = new Set()
): void {
  for (const [key, override] of Object.entries(overrides)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const isReference = typeof override === "string" && override.startsWith("$");
    if (!(key in target)) {
      if ((phase === "reference") === isReference) {
        diagnostics.push({
          code: "theme-token-unknown",
          path,
          value: override,
          message: `Không có theme token ${path}; giá trị override đã bị bỏ qua.`
        });
      }
      continue;
    }

    const current = target[key];
    const original = fallback[key];

    if (isPlainObject(override) && isPlainObject(current) && isPlainObject(original)) {
      mergeOverrides(current, original, override, diagnostics, phase, path, root, blockedReferences);
      continue;
    }

    if (phase === "literal" && isReference) continue;
    if (phase === "reference" && !isReference) continue;
    if (isReference && blockedReferences.has(path)) continue;

    if (isReference) {
      const referencePath = override.slice(1);
      const resolved = readPath(root, referencePath);
      if (resolved === undefined) {
        target[key] = cloneValue(original);
        diagnostics.push({
          code: "theme-token-unknown",
          path,
          reference: override,
          message: `Không thể resolve ${override} cho ${path}; giữ nguyên giá trị ở lớp trước.`
        });
      } else if (!compatibleValueTypes(current, resolved, path)) {
        target[key] = cloneValue(original);
        diagnostics.push({
          code: "theme-value-invalid",
          path,
          reference: override,
          value: resolved,
          message: `Theme reference ${override} không tương thích với kiểu token ${path}; giữ nguyên giá trị ở lớp trước.`
        });
      } else {
        const constraint = bounds[path];
        if (constraint && typeof resolved === "number" &&
            (!Number.isFinite(resolved) || resolved < constraint.minimum || resolved > constraint.maximum)) {
          target[key] = cloneValue(original);
          diagnostics.push({
            code: "theme-value-out-of-bounds",
            path,
            reference: override,
            value: resolved,
            message: `${override} resolve thành giá trị ngoài [${constraint.minimum}, ${constraint.maximum}] cho ${path}; giữ nguyên giá trị ở lớp trước.`
          });
        } else {
          target[key] = cloneValue(resolved);
        }
      }
      continue;
    }

    const constraint = bounds[path];
    if (constraint && typeof override === "number") {
      if (!Number.isFinite(override) || override < constraint.minimum || override > constraint.maximum) {
        target[key] = cloneValue(original);
        diagnostics.push({
          code: "theme-value-out-of-bounds",
          path,
          value: override,
          message: `${path} phải nằm trong [${constraint.minimum}, ${constraint.maximum}]; giữ nguyên giá trị visual world.`
        });
        continue;
      }
    }

    if (!compatibleValueTypes(current, override, path)) {
      target[key] = cloneValue(original);
      diagnostics.push({
        code: "theme-value-invalid",
        path,
        value: override,
        message: `Kiểu giá trị override tại ${path} không tương thích với theme token gốc.`
      });
      continue;
    }

    target[key] = cloneValue(override);
  }
}

function collectReferences(
  value: unknown,
  prefix = "",
  references: Map<string, string> = new Map()
): Map<string, string> {
  if (!isPlainObject(value)) return references;
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof entry === "string" && entry.startsWith("$")) {
      references.set(path, entry.slice(1));
    } else if (isPlainObject(entry)) {
      collectReferences(entry, path, references);
    }
  }
  return references;
}

function findReferenceCycles(references: ReadonlyMap<string, string>): Set<string> {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const cyclic = new Set<string>();

  const visit = (path: string) => {
    if (visited.has(path)) return;
    if (visiting.has(path)) {
      const start = stack.indexOf(path);
      for (const member of stack.slice(Math.max(0, start))) cyclic.add(member);
      cyclic.add(path);
      return;
    }

    visiting.add(path);
    stack.push(path);
    const dependency = references.get(path);
    if (dependency && references.has(dependency)) visit(dependency);
    stack.pop();
    visiting.delete(path);
    visited.add(path);
  };

  for (const path of [...references.keys()].sort()) visit(path);
  return cyclic;
}

function resolvedTokenDiagnostics(tokens: ThemeTokens): ThemeDiagnostic[] {
  return validateVisualWorld({
    id: "resolved-theme",
    name: "Resolved theme",
    description: "Resolved Deckory theme tokens.",
    ...tokens
  });
}

function toTokens(world: VisualWorld): ThemeTokens {
  return {
    colors: cloneValue(world.colors),
    typography: cloneValue(world.typography),
    spacing: cloneValue(world.spacing),
    radii: cloneValue(world.radii),
    depth: cloneValue(world.depth),
    charts: cloneValue(world.charts),
    diagrams: cloneValue(world.diagrams),
    imagery: cloneValue(world.imagery),
    backgrounds: cloneValue(world.backgrounds),
    density: cloneValue(world.density),
    safeArea: cloneValue(world.safeArea),
    motion: cloneValue(world.motion)
  };
}

function resolveFromBase(base: ThemeTokens, overrideSets: readonly (ThemeTokenOverrides | undefined)[]): ThemeResolution {
  const tokens = cloneValue(base);
  const diagnostics: ThemeDiagnostic[] = [];

  for (const overrides of overrideSets) {
    if (!overrides) continue;
    const fallback = cloneValue(tokens);
    const target = tokens as unknown as Record<string, unknown>;
    const original = fallback as unknown as Record<string, unknown>;
    const layer = overrides as unknown as Record<string, unknown>;
    mergeOverrides(target, original, layer, diagnostics, "literal");

    const references = collectReferences(layer);
    const cyclicReferences = findReferenceCycles(references);
    for (const path of [...cyclicReferences].sort()) {
      const reference = references.get(path);
      diagnostics.push({
        code: "theme-reference-cycle",
        path,
        ...(reference ? { reference: `$${reference}` } : {}),
        message: `Theme reference cycle tại ${path}; giữ nguyên giá trị ở lớp trước.`
      });
    }

    for (let pass = 0; pass < references.size; pass += 1) {
      const passDiagnostics = pass === references.size - 1 ? diagnostics : [];
      mergeOverrides(target, original, layer, passDiagnostics, "reference", "", target, cyclicReferences);
    }
  }

  diagnostics.push(...resolvedTokenDiagnostics(tokens));
  return { tokens, diagnostics };
}

export function resolveThemeTokens(
  world: VisualWorld,
  deckOverrides?: ThemeTokenOverrides,
  slideOverrides?: ThemeTokenOverrides
): ThemeResolution {
  return resolveFromBase(toTokens(world), [deckOverrides, slideOverrides]);
}

export function resolveElementTokens(
  resolvedTheme: ThemeTokens,
  elementOverrides?: ThemeTokenOverrides
): ThemeResolution {
  return resolveFromBase(resolvedTheme, [elementOverrides]);
}
