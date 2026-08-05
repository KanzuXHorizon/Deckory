import { describe, expect, it } from "vitest";
import {
  decodeWeightSimulatorInteraction,
  encodeWeightSimulatorInteraction,
  getComponentInteractionKey,
  resolveLocalWeightSimulatorState
} from "./interaction-state";

describe("component interaction state", () => {
  it("scopes component state by slide to prevent repeated IDs from colliding", () => {
    expect(getComponentInteractionKey("team-overview", "team")).toBe("team-overview::team");
    expect(getComponentInteractionKey("delivery-team", "team")).not.toBe(getComponentInteractionKey("team-overview", "team"));
  });
});

describe("weight simulator interaction state", () => {
  const dimensionIds = ["quality", "speed"] as const;
  const presetIds = ["balanced", "quality-first"] as const;

  it("round-trips a custom weighting without losing decimal values", () => {
    const encoded = encodeWeightSimulatorInteraction({
      presetId: "custom",
      weights: { quality: 64.5, speed: 35.5 }
    });

    expect(decodeWeightSimulatorInteraction(encoded, dimensionIds, presetIds)).toEqual({
      presetId: "custom",
      weights: { quality: 64.5, speed: 35.5 }
    });
  });

  it("accepts a known preset and rejects unknown dimensions or malformed payloads", () => {
    const encoded = encodeWeightSimulatorInteraction({
      presetId: "quality-first",
      weights: { quality: 75, speed: 25 }
    });

    expect(decodeWeightSimulatorInteraction(encoded, dimensionIds, presetIds)).toEqual({
      presetId: "quality-first",
      weights: { quality: 75, speed: 25 }
    });
    expect(decodeWeightSimulatorInteraction('{"presetId":"custom","weights":{"unknown":100}}', dimensionIds, presetIds)).toBeNull();
    expect(decodeWeightSimulatorInteraction("not-json", dimensionIds, presetIds)).toBeNull();
  });

  it("rejects non-finite, out-of-range and oversized interaction values", () => {
    expect(decodeWeightSimulatorInteraction('{"presetId":"custom","weights":{"quality":101,"speed":0}}', dimensionIds, presetIds)).toBeNull();
    expect(decodeWeightSimulatorInteraction('{"presetId":"custom","weights":{"quality":-1,"speed":101}}', dimensionIds, presetIds)).toBeNull();
    expect(decodeWeightSimulatorInteraction("x".repeat(4_097), dimensionIds, presetIds)).toBeNull();
  });

  it("resolves the latest preset values after Studio edits and repairs custom dimensions", () => {
    const dimensions = [
      { id: "quality", weight: 60 },
      { id: "speed", weight: 40 }
    ];
    const presets = [
      { id: "balanced", weights: { quality: 55, speed: 45 } }
    ];

    expect(resolveLocalWeightSimulatorState("balanced", { quality: 10, speed: 90 }, dimensions, presets)).toEqual({
      presetId: "balanced",
      weights: { quality: 55, speed: 45 }
    });
    expect(resolveLocalWeightSimulatorState("custom", { quality: 64, removed: 36 }, dimensions, presets)).toEqual({
      presetId: "custom",
      weights: { quality: 64, speed: 40 }
    });
  });
});
