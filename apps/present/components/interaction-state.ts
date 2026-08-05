export type WeightSimulatorInteractionState = {
  presetId: string;
  weights: Record<string, number>;
};

const MAX_INTERACTION_VALUE_LENGTH = 4_096;

export function getComponentInteractionKey(slideId: string, componentId: string): string {
  return `${slideId}::${componentId}`;
}

export function resolveLocalWeightSimulatorState(
  selectedPresetId: string,
  customWeights: Record<string, number>,
  dimensions: readonly { id: string; weight: number }[],
  presets: readonly { id: string; weights: Record<string, number> }[]
): WeightSimulatorInteractionState {
  const baseWeights = Object.fromEntries(dimensions.map((dimension) => [dimension.id, dimension.weight]));
  if (selectedPresetId === "custom") {
    return {
      presetId: "custom",
      weights: Object.fromEntries(dimensions.map((dimension) => [
        dimension.id,
        customWeights[dimension.id] ?? dimension.weight
      ]))
    };
  }

  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId) ?? presets[0];
  return selectedPreset
    ? { presetId: selectedPreset.id, weights: selectedPreset.weights }
    : { presetId: "custom", weights: baseWeights };
}

export function encodeWeightSimulatorInteraction(state: WeightSimulatorInteractionState): string {
  return JSON.stringify({
    version: 1,
    presetId: state.presetId,
    weights: state.weights
  });
}

export function decodeWeightSimulatorInteraction(
  value: string | undefined,
  dimensionIds: readonly string[],
  presetIds: readonly string[]
): WeightSimulatorInteractionState | null {
  if (!value || value.length > MAX_INTERACTION_VALUE_LENGTH) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.presetId !== "string" || !isRecord(parsed.weights)) {
      return null;
    }

    if (parsed.presetId !== "custom" && !presetIds.includes(parsed.presetId)) return null;

    const allowedIds = new Set(dimensionIds);
    const entries = Object.entries(parsed.weights);
    if (entries.length !== allowedIds.size) return null;

    const weights: Record<string, number> = {};
    for (const [id, weight] of entries) {
      if (!allowedIds.has(id) || typeof weight !== "number" || !Number.isFinite(weight) || weight < 0 || weight > 100) {
        return null;
      }
      weights[id] = weight;
    }

    if (dimensionIds.some((id) => weights[id] === undefined)) return null;
    return { presetId: parsed.presetId, weights };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
