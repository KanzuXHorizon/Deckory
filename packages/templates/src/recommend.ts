import { deckBlueprints, visualStyles } from "./catalog/index";
import type {
  DeckBlueprint,
  TemplateRecommendation,
  TemplateRequest,
  VisualStylePreset
} from "./types";

export function recommendTemplate(request: TemplateRequest): TemplateRecommendation {
  const blueprint = rankBlueprints(request)[0] ?? deckBlueprints[0]!;
  const style = rankStyles(request)[0] ?? visualStyles[0]!;

  return {
    blueprint,
    style,
    reasons: buildReasons(request, blueprint, style),
    score: blueprintScore(blueprint, request) + styleScore(style, request)
  };
}

function rankBlueprints(request: TemplateRequest): DeckBlueprint[] {
  return [...deckBlueprints].sort((left, right) =>
    blueprintScore(right, request) - blueprintScore(left, request) || left.id.localeCompare(right.id)
  );
}

function rankStyles(request: TemplateRequest): VisualStylePreset[] {
  return [...visualStyles].sort((left, right) =>
    styleScore(right, request) - styleScore(left, request) || left.id.localeCompare(right.id)
  );
}

function blueprintScore(blueprint: DeckBlueprint, request: TemplateRequest): number {
  let score = 0;
  if (request.scenario === blueprint.scenario) score += 80;
  if (request.audience && blueprint.audiences.includes(request.audience)) score += 30;
  if (request.durationMinutes !== undefined) {
    const [minimum, maximum] = blueprint.durationMinutes;
    if (request.durationMinutes >= minimum && request.durationMinutes <= maximum) score += 10;
  }
  if (request.technicalDepth === "high" && blueprint.scenario === "technical") score += 25;
  if (request.evidenceLevel === "defense" && blueprint.scenario === "academic") score += 25;
  if (request.dataIntensity === "high" && blueprint.scenario === "qbr") score += 20;
  return score;
}

function styleScore(style: VisualStylePreset, request: TemplateRequest): number {
  let score = 0;
  if (request.scenario && style.scenarios.includes(request.scenario)) score += 60;
  if (request.audience && style.audiences.includes(request.audience)) score += 25;
  if (request.tone && style.tones.includes(request.tone)) score += 25;
  if (request.evidenceLevel === "defense") score += style.dials.evidenceRigor * 2;
  if (request.dataIntensity === "high") score += style.dials.visualDensity;
  if (request.technicalDepth === "high" && style.id === "technical-precision") score += 30;
  if (request.scenario === "qbr" && style.id === "data-briefing") score += 30;
  if (request.scenario === "academic" && style.id === "academic-defense") score += 30;
  return score;
}

function buildReasons(
  request: TemplateRequest,
  blueprint: DeckBlueprint,
  style: VisualStylePreset
): readonly string[] {
  const reasons = [
    `Blueprint “${blueprint.name}” phù hợp với kịch bản ${request.scenario ?? "chuyên nghiệp tổng quát"}.`,
    `Visual style “${style.name}” phù hợp với đối tượng ${request.audience ?? "khán giả chung"}.`,
    `Mức evidence rigor ${style.dials.evidenceRigor}/10 hỗ trợ yêu cầu bằng chứng và khả năng review.`
  ];

  if (request.technicalDepth === "high") reasons.push("Ưu tiên architecture, code và boundary rõ cho review kỹ thuật sâu.");
  if (request.dataIntensity === "high") reasons.push("Ưu tiên mật độ visual đủ cao cho KPI, xu hướng và insight.");
  if (request.evidenceLevel === "defense") reasons.push("Ưu tiên mạch lập luận có nguồn, giới hạn và kết luận bảo vệ được.");

  return reasons;
}
