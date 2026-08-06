export const visualIntents = [
  "single-claim",
  "comparison",
  "before-after",
  "trade-off",
  "ranking",
  "magnitude",
  "trend",
  "distribution",
  "part-to-whole",
  "chronology",
  "process",
  "journey",
  "lifecycle",
  "roadmap",
  "hierarchy",
  "architecture",
  "dependency",
  "network",
  "causality",
  "geography",
  "ownership",
  "evidence-chain",
  "risk",
  "prioritization",
  "implementation-proof",
  "decision",
  "action"
] as const;

export type VisualIntent = (typeof visualIntents)[number];

export type ExtractedClaimKind =
  | "factual"
  | "numeric"
  | "comparative"
  | "procedural";

export type ExtractedClaim = {
  text: string;
  kind: ExtractedClaimKind;
};

export type ExtractedSide = {
  label: string;
  text: string;
};

export type NumericClaimRole = "value" | "date" | "identifier" | "ordinal";

export type NumericClaim = {
  raw: string;
  value: number;
  role: NumericClaimRole;
  unit?: string;
  context: string;
};

export type StructuredRelationship = {
  source: string;
  target: string;
};

export type VisualIntentHints = {
  intent?: VisualIntent;
  steps?: readonly string[];
  sides?: readonly ExtractedSide[];
  entities?: readonly string[];
  categories?: readonly string[];
  series?: readonly string[];
  dates?: readonly string[];
  relationships?: readonly StructuredRelationship[];
  geographies?: readonly string[];
  evidenceIds?: readonly string[];
};

export type VisualIntentInput = {
  text: string;
  locale?: string;
  hints?: VisualIntentHints;
};

export type VisualIntentAnalysis = {
  primary: VisualIntent;
  secondary: VisualIntent[];
  extractedClaims: ExtractedClaim[];
  extractedSteps: string[];
  sides: ExtractedSide[];
  entities: string[];
  numericClaims: NumericClaim[];
  signals: string[];
  inputAvailability: {
    steps: number;
    sides: number;
    entities: number;
    categories: number;
    series: number;
    numericData: number;
    dates: number;
    relationships: number;
    geography: number;
    evidence: number;
  };
};

const PROCESS_VERBS = [
  "thiết lập",
  "tạo",
  "thực hành",
  "nhận",
  "thu thập",
  "kiểm tra",
  "phân tích",
  "trình bày",
  "chuẩn bị",
  "xuất bản",
  "configure",
  "create",
  "collect",
  "validate",
  "analyze",
  "publish"
] as const;

const NORMALIZED_SIGNAL_RULES: ReadonlyArray<{
  intent: VisualIntent;
  signals: readonly RegExp[];
}> = [
  {
    intent: "before-after",
    signals: [
      /(?:^|\s)cách cũ(?:\s|[,:;]).*cách mới(?:\s|[,:;.]|$)/iu,
      /(?:^|\s)trước(?:\s|[,:;]).*sau(?:\s|[,:;.]|$)/iu,
      /\bbefore\b.*\bafter\b/iu,
      /\bas[- ]is\b.*\bto[- ]be\b/iu
    ]
  },
  {
    intent: "trade-off",
    signals: [/đánh đổi|trade[- ]?off|đổi lại|ưu điểm.*nhược điểm|pros?.*cons?/iu]
  },
  {
    intent: "trend",
    signals: [
      /\btăng\b|\bgiảm\b|\btăng trưởng\b|\bsuy giảm\b/iu,
      /\bfrom\b.*\bto\b|\bover time\b|\btrend\b|\bgrowth\b|\bdecline\b/iu,
      /\bqua\s+(?:\d+|một|hai|ba|bốn|năm)\b/iu
    ]
  },
  {
    intent: "ranking",
    signals: [/xếp hạng|cao nhất|thấp nhất|top\s+\d+|rank(?:ing)?/iu]
  },
  {
    intent: "distribution",
    signals: [/phân bố|phân phối|histogram|percentile|quartile|độ lệch/iu]
  },
  {
    intent: "part-to-whole",
    signals: [/tỷ trọng|cơ cấu|chiếm\s+\d|part[- ]to[- ]whole|share of total/iu]
  },
  {
    intent: "chronology",
    signals: [/dòng thời gian|timeline|theo thời gian|năm\s+\d{4}|quý\s+[1-4]/iu]
  },
  {
    intent: "roadmap",
    signals: [/roadmap|lộ trình|milestone|cột mốc/iu]
  },
  {
    intent: "hierarchy",
    signals: [/phân cấp|cấp trên|cấp dưới|hierarch|org chart|sơ đồ tổ chức/iu]
  },
  {
    intent: "architecture",
    signals: [/kiến trúc|architecture|service|gateway|database|frontend|backend/iu]
  },
  {
    intent: "dependency",
    signals: [/phụ thuộc|dependency|depends on|blocked by/iu]
  },
  {
    intent: "network",
    signals: [/mạng lưới|network|ecosystem|kết nối nhiều chiều/iu]
  },
  {
    intent: "causality",
    signals: [/dẫn đến|gây ra|nguyên nhân|hệ quả|caus|therefore|because/iu]
  },
  {
    intent: "geography",
    signals: [/khu vực|tỉnh|thành phố|quốc gia|geograph|region|country/iu]
  },
  {
    intent: "ownership",
    signals: [/chịu trách nhiệm|phụ trách|owner|ownership|raci|team/iu]
  },
  {
    intent: "evidence-chain",
    signals: [/bằng chứng|evidence|nguồn|source|claim/iu]
  },
  {
    intent: "risk",
    signals: [/rủi ro|risk|xác suất|tác động/iu]
  },
  {
    intent: "prioritization",
    signals: [/ưu tiên|priority|impact.*effort|tác động.*nỗ lực/iu]
  },
  {
    intent: "implementation-proof",
    signals: [/test passed|kiểm thử|triển khai thành công|build passed|release evidence/iu]
  },
  {
    intent: "decision",
    signals: [/quyết định|decision|phê duyệt|approve|lựa chọn/iu]
  },
  {
    intent: "action",
    signals: [/hành động tiếp theo|next action|next step|cần thực hiện/iu]
  },
  {
    intent: "comparison",
    signals: [/so với|so sánh|versus|\bvs\.?\b|khác biệt/iu]
  }
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function cleanSegment(value: string): string {
  return normalizeWhitespace(
    value.replace(/^\s*(?:[-*•]|\d+[.)]|bước\s+\d+\s*[:.)-]?|step\s+\d+\s*[:.)-]?)\s*/iu, "")
  ).replace(/[.;:!?]+$/u, "");
}

function splitStatements(text: string): string[] {
  const numbered = text
    .split(/(?=\b(?:bước|step)\s+\d+\s*[:.)-]?)/iu)
    .map(cleanSegment)
    .filter(Boolean);

  if (numbered.length >= 2) return numbered;

  const statements: string[] = [];
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const previous = text[index - 1];
    const next = text[index + 1];
    const numericSeparator =
      character === "." && /\d/u.test(previous ?? "") && /\d/u.test(next ?? "");
    const boundary =
      character === "!" ||
      character === "?" ||
      character === "\n" ||
      (character === "." && !numericSeparator);
    if (!boundary) continue;
    statements.push(text.slice(start, index));
    start = index + 1;
  }
  statements.push(text.slice(start));
  return statements.map(cleanSegment).filter(Boolean);
}

function extractSteps(text: string, hints?: VisualIntentHints): string[] {
  if (hints?.steps && hints.steps.length > 0) {
    return hints.steps.map(cleanSegment).filter(Boolean);
  }

  const statements = splitStatements(text);
  const processLikeCount = statements.filter((statement) => {
    const normalized = statement.toLocaleLowerCase("vi-VN");
    return PROCESS_VERBS.some((verb) => normalized.startsWith(verb));
  }).length;
  const hasNumberedSteps = /\b(?:bước|step)\s+\d+/iu.test(text);
  const hasArrows = /(?:→|->|=>)/u.test(text);

  if (hasArrows) {
    return text
      .split(/(?:→|->|=>)/u)
      .map(cleanSegment)
      .filter(Boolean);
  }

  if (hasNumberedSteps || (statements.length >= 3 && processLikeCount >= 2)) {
    return statements;
  }

  return [];
}

function extractSides(text: string, hints?: VisualIntentHints): ExtractedSide[] {
  if (hints?.sides && hints.sides.length > 0) {
    return hints.sides.map((side) => ({
      label: normalizeWhitespace(side.label),
      text: normalizeWhitespace(side.text)
    }));
  }

  const oldNew = text.match(/(?:^|\s)cách cũ\s*([^;.!?]*).*?(?:^|\s)cách mới\s*([^;.!?]*)/iu);
  if (oldNew) {
    return [
      { label: "Cách cũ", text: cleanSegment(oldNew[1] ?? "") },
      { label: "Cách mới", text: cleanSegment(oldNew[2] ?? "") }
    ];
  }

  const beforeAfter = text.match(/(?:^|\s)trước\s*([^;.!?]*).*?(?:^|\s)sau\s*([^;.!?]*)/iu);
  if (beforeAfter) {
    return [
      { label: "Trước", text: cleanSegment(beforeAfter[1] ?? "") },
      { label: "Sau", text: cleanSegment(beforeAfter[2] ?? "") }
    ];
  }

  return [];
}

function classifyNumericRole(
  statement: string,
  value: number,
  raw: string,
  matchIndex: number
): NumericClaimRole {
  if (raw.trim().endsWith("%")) return "value";
  const before = statement.slice(Math.max(0, matchIndex - 32), matchIndex);
  const normalizedBefore = before.toLocaleLowerCase("vi-VN");
  if (
    Number.isInteger(value) &&
    value >= 1900 &&
    value <= 2100 &&
    /(?:năm|year)\s*$/iu.test(normalizedBefore)
  ) {
    return "date";
  }
  if (/(?:phiên bản|version|\bv|\bid)\s*$/iu.test(normalizedBefore)) {
    return "identifier";
  }
  if (/(?:bước|step|giai đoạn|phase|vòng|round|thứ)\s*$/iu.test(normalizedBefore)) {
    return "ordinal";
  }
  return "value";
}

function extractNumericUnit(statement: string, matchEnd: number, raw: string): string | undefined {
  if (raw.trim().endsWith("%")) return "%";
  const trailing = statement.slice(matchEnd, matchEnd + 16);
  const match = trailing.match(/^\s*(điểm|giờ|phút|giây|ms|usd|vnd|triệu|tỷ|người)\b/iu);
  return match?.[1];
}

function chooseDecimalSeparator(core: string, locale: string): "," | "." | undefined {
  const commaParts = core.split(",");
  const dotParts = core.split(".");
  const hasComma = commaParts.length > 1;
  const hasDot = dotParts.length > 1;
  if (hasComma && hasDot) {
    return core.lastIndexOf(",") > core.lastIndexOf(".") ? "," : ".";
  }
  const separator = hasComma ? "," : hasDot ? "." : undefined;
  if (!separator) return undefined;
  const parts = core.split(separator);
  const allTrailingGroups = parts.slice(1).every((part) => part.length === 3);
  if (parts.length > 2) return allTrailingGroups ? undefined : separator;
  const localeUsesCommaDecimal = locale.toLocaleLowerCase("en-US").startsWith("vi");
  const fractionalLength = parts[1]?.length ?? 0;
  if (separator === "," && localeUsesCommaDecimal) return ",";
  if (separator === "." && !localeUsesCommaDecimal) return ".";
  return fractionalLength === 3 ? undefined : separator;
}

function parseLocalizedNumber(raw: string, locale: string): number | undefined {
  const core = raw.replace(/\s?%$/u, "").replace(/\s+/gu, "");
  const decimalSeparator = chooseDecimalSeparator(core, locale);
  let normalized = core;
  if (decimalSeparator) {
    const groupingSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized.split(groupingSeparator).join("");
    const decimalIndex = normalized.lastIndexOf(decimalSeparator);
    normalized =
      normalized.slice(0, decimalIndex).split(decimalSeparator).join("") +
      "." +
      normalized.slice(decimalIndex + 1);
  } else {
    normalized = normalized.replace(/[.,]/gu, "");
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

function extractNumericClaims(text: string, locale: string): NumericClaim[] {
  const statements = splitStatements(text);
  const claims: NumericClaim[] = [];
  const pattern = /[-+]?\d(?:[\d.,]*\d)?(?:\s?%)?/gu;

  for (const statement of statements) {
    for (const match of statement.matchAll(pattern)) {
      const raw = match[0];
      const value = parseLocalizedNumber(raw, locale);
      if (value === undefined) continue;
      const matchIndex = match.index ?? 0;
      const unit = extractNumericUnit(statement, matchIndex + raw.length, raw);
      claims.push({
        raw,
        value,
        role: classifyNumericRole(statement, value, raw, matchIndex),
        ...(unit ? { unit } : {}),
        context: statement
      });
    }
  }

  return claims;
}

function extractClaims(text: string): ExtractedClaim[] {
  return splitStatements(text).map((statement) => {
    const kind: ExtractedClaimKind = /\d/u.test(statement)
      ? "numeric"
      : /so với|versus|\bvs\.?\b|cách cũ|cách mới|trước|sau/iu.test(statement)
        ? "comparative"
        : PROCESS_VERBS.some((verb) => statement.toLocaleLowerCase("vi-VN").startsWith(verb))
          ? "procedural"
          : "factual";
    return { text: statement, kind };
  });
}

function classifyPrimary(
  text: string,
  steps: readonly string[],
  hints?: VisualIntentHints
): { primary: VisualIntent; signals: string[] } {
  if (hints?.intent) {
    return { primary: hints.intent, signals: ["structured-intent-hint"] };
  }

  for (const rule of NORMALIZED_SIGNAL_RULES) {
    const matched = rule.signals.find((signal) => signal.test(text));
    if (matched) {
      return { primary: rule.intent, signals: [`text-signal:${rule.intent}`] };
    }
  }

  if (steps.length >= 2) {
    return { primary: "process", signals: ["ordered-step-sequence"] };
  }

  return { primary: "single-claim", signals: ["single-claim-default"] };
}

function deriveSecondary(primary: VisualIntent, numericCount: number): VisualIntent[] {
  const secondary = new Set<VisualIntent>();
  if (primary === "before-after") secondary.add("comparison");
  if (primary === "trade-off") secondary.add("comparison");
  if (primary === "trend" && numericCount > 0) secondary.add("magnitude");
  if (primary === "roadmap") secondary.add("chronology");
  if (primary === "architecture") secondary.add("dependency");
  if (primary === "implementation-proof") secondary.add("evidence-chain");
  return [...secondary];
}

export function classifyVisualIntent(input: VisualIntentInput): VisualIntentAnalysis {
  const text = normalizeWhitespace(input.text);
  const extractedSteps = extractSteps(text, input.hints);
  const sides = extractSides(text, input.hints);
  const locale = input.locale ?? "vi-VN";
  const numericClaims = extractNumericClaims(text, locale);
  const numericValueCount = numericClaims.filter((claim) => claim.role === "value").length;
  const entities = [...(input.hints?.entities ?? [])].map(normalizeWhitespace).filter(Boolean);
  const classification = classifyPrimary(text, extractedSteps, input.hints);

  return {
    primary: classification.primary,
    secondary: deriveSecondary(classification.primary, numericValueCount),
    extractedClaims: extractClaims(text),
    extractedSteps,
    sides,
    entities,
    numericClaims,
    signals: classification.signals,
    inputAvailability: {
      steps: extractedSteps.length,
      sides: sides.length,
      entities: entities.length,
      categories: input.hints?.categories?.length ?? 0,
      series: input.hints?.series?.length ?? 0,
      numericData: numericClaims.filter((claim) => claim.role === "value").length,
      dates:
        numericClaims.filter((claim) => claim.role === "date").length +
        (input.hints?.dates?.length ?? 0),
      relationships: input.hints?.relationships?.length ?? 0,
      geography: input.hints?.geographies?.length ?? 0,
      evidence: input.hints?.evidenceIds?.length ?? 0
    }
  };
}
