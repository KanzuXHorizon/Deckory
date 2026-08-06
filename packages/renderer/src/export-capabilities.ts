import type { DeckDocumentV2, SceneElement } from "@deckory/schema/v2";

export const exportTargets = ["html", "svg", "png", "pdf", "pptx"] as const;
export type ExportTarget = (typeof exportTargets)[number];
export type ExportCapabilityState = "native" | "native-editable" | "fallback" | "unsupported";

export type ExportFallback = {
  type: "svg" | "png";
  assetId: string;
};

export type ExportCapabilityRegistry = {
  resolveComponent(input: {
    componentId: string;
    version: string;
  }): {
    componentId: string;
    version: string;
    exportCapabilities: readonly ExportTarget[];
    editableExportCapabilities?: readonly ExportTarget[];
  } | undefined;
};

export type ElementExportResolution = {
  elementId: string;
  elementName: string;
  kind: SceneElement["kind"];
  html: ExportCapabilityState;
  svg: ExportCapabilityState;
  png: ExportCapabilityState;
  pdf: ExportCapabilityState;
  pptx: ExportCapabilityState;
  fallback?: ExportFallback;
  responsible: {
    type: "deckory-native" | "component" | "web-block" | "element-policy";
    id: string;
    version?: string;
  };
  reasons: Partial<Record<ExportTarget, string>>;
  warnings: string[];
};

export type ExportTargetSummary = {
  native: number;
  nativeEditable: number;
  fallback: number;
  unsupported: number;
};

export type DeckExportReport = {
  deckId: string;
  revision: number;
  slideCount: number;
  elementCount: number;
  targets: Record<ExportTarget, ExportTargetSummary>;
  elements: ElementExportResolution[];
  warnings: string[];
};

const editablePptxKinds = new Set<SceneElement["kind"]>([
  "group",
  "stack",
  "grid",
  "text",
  "image",
  "shape",
  "line",
  "connector"
]);

const nativeSvgKinds = new Set<SceneElement["kind"]>([
  "group",
  "stack",
  "grid",
  "text",
  "rich-text",
  "image",
  "icon",
  "shape",
  "line",
  "connector",
  "svg",
  "chart",
  "table",
  "diagram",
  "evidence-footer"
]);

function webBlockFallback(element: Extract<SceneElement, { kind: "web-block" }>): ExportFallback | undefined {
  const manifest = element.content.manifest;
  const value = manifest.staticFallback;
  if (!value || typeof value !== "object") return undefined;
  const fallback = value as Record<string, unknown>;
  if ((fallback.type !== "svg" && fallback.type !== "png") || typeof fallback.assetId !== "string" || !fallback.assetId.trim()) {
    return undefined;
  }
  return { type: fallback.type, assetId: fallback.assetId };
}

function declaredFallback(element: SceneElement): ExportFallback | undefined {
  if (element.kind === "web-block") {
    const fallback = webBlockFallback(element);
    if (fallback) return fallback;
  }
  const assetId = element.exportPolicy?.fallbackAssetId;
  return assetId ? { type: "png", assetId } : undefined;
}

function nativeState(element: SceneElement, target: ExportTarget): ExportCapabilityState {
  if (target === "html") return element.kind === "media" ? "native" : "native";
  if (target === "png" || target === "pdf") return "native";
  if (target === "svg") return nativeSvgKinds.has(element.kind) ? "native" : "unsupported";
  return editablePptxKinds.has(element.kind) ? "native-editable" : "unsupported";
}

function policyState(element: SceneElement, target: ExportTarget): ExportCapabilityState | undefined {
  const value = element.exportPolicy?.[target];
  if (!value) return undefined;
  return value;
}

function applyRestrictivePolicy(input: {
  baseline: ExportCapabilityState;
  explicit: ExportCapabilityState | undefined;
  fallback: ExportFallback | undefined;
  target: ExportTarget;
  owner: string;
  reasons: Partial<Record<ExportTarget, string>>;
  warnings: string[];
}): ExportCapabilityState {
  const { baseline, explicit, fallback, target, owner, reasons, warnings } = input;
  if (!explicit) return baseline;
  if (explicit === "unsupported") {
    reasons[target] = `${owner} chủ động tắt ${target} bằng exportPolicy.`;
    return "unsupported";
  }
  if (explicit === "fallback") {
    if (fallback) {
      reasons[target] = `${owner} chủ động dùng fallback cho ${target}.`;
      return "fallback";
    }
    reasons[target] = `${owner} yêu cầu fallback nhưng không có fallback asset hợp lệ.`;
    warnings.push(`${owner} khai báo fallback cho ${target} nhưng thiếu fallback asset.`);
    return "unsupported";
  }
  if (explicit === "native-editable") {
    if (baseline === "native-editable") {
      reasons[target] = `${owner} giữ capability native-editable đã được trusted resolver xác nhận.`;
      return baseline;
    }
    reasons[target] = `${owner} không thể nâng ${target} từ ${baseline} lên native-editable bằng document policy.`;
    warnings.push(`${owner} không được nâng ${target} từ ${baseline} lên native-editable.`);
    return baseline;
  }
  if (baseline === "native" || baseline === "native-editable") {
    reasons[target] = `${owner} giới hạn ${target} ở native.`;
    return "native";
  }
  reasons[target] = `${owner} không thể nâng ${target} từ ${baseline} lên native bằng document policy.`;
  warnings.push(`${owner} không được nâng ${target} từ ${baseline} lên native.`);
  return baseline;
}

function resolveStandardElement(element: SceneElement): ElementExportResolution {
  const fallback = declaredFallback(element);
  const reasons: Partial<Record<ExportTarget, string>> = {};
  const warnings: string[] = [];
  const states = Object.fromEntries(exportTargets.map((target) => {
    const baseline = nativeState(element, target);
    reasons[target] = `Deckory native renderer xử lý ${element.kind} cho ${target} ở mức ${baseline}.`;
    const state = applyRestrictivePolicy({
      baseline,
      explicit: policyState(element, target),
      fallback,
      target,
      owner: `${element.name} (${element.id})`,
      reasons,
      warnings
    });
    return [target, state];
  })) as Record<ExportTarget, ExportCapabilityState>;

  return {
    elementId: element.id,
    elementName: element.name,
    kind: element.kind,
    ...states,
    ...(fallback ? { fallback } : {}),
    responsible: {
      type: element.exportPolicy ? "element-policy" : "deckory-native",
      id: element.kind
    },
    reasons,
    warnings
  };
}

function resolveComponentElement(
  element: Extract<SceneElement, { kind: "component-instance" }>,
  registry: ExportCapabilityRegistry
): ElementExportResolution {
  const definition = registry.resolveComponent({
    componentId: element.content.componentId,
    version: element.content.version
  });
  const fallback = declaredFallback(element);
  const reasons: Partial<Record<ExportTarget, string>> = {};
  const warnings: string[] = [];
  const owner = `Component ${element.content.componentId}@${element.content.version}`;
  const states = Object.fromEntries(exportTargets.map((target) => {
    let baseline: ExportCapabilityState;
    if (!definition) {
      baseline = fallback ? "fallback" : "unsupported";
      reasons[target] = `Không tìm thấy ${owner}; capability gốc là ${baseline}.`;
    } else if (definition.exportCapabilities.includes(target)) {
      baseline = definition.editableExportCapabilities?.includes(target)
        ? "native-editable"
        : "native";
      reasons[target] = `${owner} được trusted registry xác nhận ${baseline} cho ${target}.`;
    } else {
      baseline = fallback ? "fallback" : "unsupported";
      reasons[target] = `${owner} không khai báo hỗ trợ ${target}; capability gốc là ${baseline}.`;
    }
    const state = applyRestrictivePolicy({
      baseline,
      explicit: policyState(element, target),
      fallback,
      target,
      owner,
      reasons,
      warnings
    });
    return [target, state];
  })) as Record<ExportTarget, ExportCapabilityState>;

  if (!definition) warnings.push(`Không tìm thấy component ${element.content.componentId}@${element.content.version}; export chỉ có thể dùng fallback đã khai báo.`);
  return {
    elementId: element.id,
    elementName: element.name,
    kind: element.kind,
    ...states,
    ...(fallback ? { fallback } : {}),
    responsible: {
      type: "component",
      id: element.content.componentId,
      version: element.content.version
    },
    reasons,
    warnings
  };
}

function resolveWebBlockElement(element: Extract<SceneElement, { kind: "web-block" }>): ElementExportResolution {
  const fallback = webBlockFallback(element);
  const manifest = element.content.manifest;
  const manifestId = typeof manifest.id === "string" ? manifest.id : element.id;
  const manifestVersion = typeof manifest.version === "string" ? manifest.version : undefined;
  const reasons: Partial<Record<ExportTarget, string>> = {};
  const warnings: string[] = [];
  const owner = `Web Block ${manifestId}${manifestVersion ? `@${manifestVersion}` : ""}`;
  const states = Object.fromEntries(exportTargets.map((target) => {
    const baseline: ExportCapabilityState = fallback ? "fallback" : "unsupported";
    reasons[target] = fallback
      ? `${owner} dùng static fallback ${fallback.type} cho ${target}.`
      : `${owner} không có staticFallback hợp lệ.`;
    const state = applyRestrictivePolicy({
      baseline,
      explicit: policyState(element, target),
      fallback,
      target,
      owner,
      reasons,
      warnings
    });
    return [target, state];
  })) as Record<ExportTarget, ExportCapabilityState>;
  if (!fallback) warnings.push(`Web Block ${manifestId} không có static fallback hợp lệ.`);

  return {
    elementId: element.id,
    elementName: element.name,
    kind: element.kind,
    ...states,
    ...(fallback ? { fallback } : {}),
    responsible: {
      type: "web-block",
      id: manifestId,
      ...(manifestVersion ? { version: manifestVersion } : {})
    },
    reasons,
    warnings
  };
}

export function resolveElementExportCapability(
  element: SceneElement,
  registry: ExportCapabilityRegistry
): ElementExportResolution {
  if (element.kind === "component-instance") return withTargetWarnings(resolveComponentElement(element, registry));
  if (element.kind === "web-block") return withTargetWarnings(resolveWebBlockElement(element));
  return withTargetWarnings(resolveStandardElement(element));
}

function withTargetWarnings(resolution: ElementExportResolution): ElementExportResolution {
  const warnings = [...resolution.warnings];
  for (const target of exportTargets) {
    const state = resolution[target];
    if (state === "unsupported") {
      warnings.push(`${resolution.elementName} (${resolution.elementId}) không hỗ trợ ${target}.`);
    } else if (state === "fallback") {
      warnings.push(`${resolution.elementName} (${resolution.elementId}) dùng fallback cho ${target}.`);
    }
  }
  return { ...resolution, warnings };
}

function emptyTargetSummary(): ExportTargetSummary {
  return { native: 0, nativeEditable: 0, fallback: 0, unsupported: 0 };
}

export function resolveDeckExportReport(
  deck: DeckDocumentV2,
  registry: ExportCapabilityRegistry
): DeckExportReport {
  const elements = deck.slides.flatMap((slide) =>
    slide.elements.map((element) => resolveElementExportCapability(element, registry))
  );
  const targets = Object.fromEntries(exportTargets.map((target) => [target, emptyTargetSummary()])) as Record<ExportTarget, ExportTargetSummary>;
  for (const element of elements) {
    for (const target of exportTargets) {
      const state = element[target];
      if (state === "native") targets[target].native += 1;
      else if (state === "native-editable") targets[target].nativeEditable += 1;
      else if (state === "fallback") targets[target].fallback += 1;
      else targets[target].unsupported += 1;
    }
  }
  return {
    deckId: deck.id,
    revision: deck.revision,
    slideCount: deck.slides.length,
    elementCount: elements.length,
    targets,
    elements,
    warnings: [...new Set(elements.flatMap((element) => element.warnings))]
  };
}
