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

function mergeOverrides(
  target: Record<string, unknown>,
  fallback: Record<string, unknown>,
  overrides: Record<string, unknown>,
  diagnostics: ThemeDiagnostic[],
  prefix = "",
  root: Record<string, unknown> = target
): void {
  for (const [key, override] of Object.entries(overrides)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!(key in target)) {
      diagnostics.push({
        code: "theme-token-unknown",
        path,
        value: override,
        message: `Không có theme token ${path}; giá trị override đã bị bỏ qua.`
      });
      continue;
    }

    const current = target[key];
    const original = fallback[key];

    if (isPlainObject(override) && isPlainObject(current) && isPlainObject(original)) {
      mergeOverrides(current, original, override, diagnostics, path, root);
      continue;
    }

    if (typeof override === "string" && override.startsWith("$")) {
      const referencePath = override.slice(1);
      const resolved = readPath(root, referencePath);
      if (resolved === undefined || isPlainObject(resolved)) {
        target[key] = cloneValue(original);
        diagnostics.push({
          code: "theme-token-unknown",
          path,
          reference: override,
          message: `Không thể resolve ${override} cho ${path}; giữ nguyên giá trị visual world.`
        });
      } else {
        target[key] = cloneValue(resolved);
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

    if (typeof current !== typeof override && !(Array.isArray(current) && Array.isArray(override))) {
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
  const fallback = cloneValue(base);
  const diagnostics: ThemeDiagnostic[] = [];

  for (const overrides of overrideSets) {
    if (!overrides) continue;
    mergeOverrides(
      tokens as unknown as Record<string, unknown>,
      fallback as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
      diagnostics
    );
  }

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
