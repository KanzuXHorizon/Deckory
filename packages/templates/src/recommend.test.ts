import { describe, expect, it } from "vitest";
import { recommendTemplate } from "./recommend.js";

describe("recommendTemplate", () => {
  it("selects the academic defense narrative and visual system for a defense request", () => {
    const result = recommendTemplate({
      scenario: "academic",
      audience: "academic",
      evidenceLevel: "defense",
      tone: "academic"
    });

    expect(result.blueprint.id).toBe("academic-defense");
    expect(result.style.id).toBe("academic-defense");
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it("selects technical precision for a deep engineering review", () => {
    const result = recommendTemplate({
      scenario: "technical",
      audience: "technical",
      technicalDepth: "high",
      tone: "analytical"
    });

    expect(result.blueprint.id).toBe("technical-architecture-review");
    expect(result.style.id).toBe("technical-precision");
  });

  it("selects data briefing for a leadership QBR and stays deterministic", () => {
    const request = { scenario: "qbr", audience: "leadership", dataIntensity: "high" } as const;
    const first = recommendTemplate(request);
    const second = recommendTemplate(request);

    expect(first.blueprint.id).toBe("quarterly-business-review");
    expect(first.style.id).toBe("data-briefing");
    expect(second).toEqual(first);
  });
});
