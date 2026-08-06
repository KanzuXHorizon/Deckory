export type NumericClaimChange = {
  introducedValue?: string;
  removedValue?: string;
};

export type SemanticClaimChange = {
  kind: "direction" | "certainty" | "limitation" | "polarity" | "temporal-scope";
  value: string;
  change: "introduced" | "removed";
};

export type ClaimPreservationReport = {
  originalClaims: string[];
  resultingClaims: string[];
  introducedClaims: string[];
  removedClaims: string[];
  numericChanges: NumericClaimChange[];
  certaintyChanges: SemanticClaimChange[];
  limitationChanges: SemanticClaimChange[];
  polarityChanges: SemanticClaimChange[];
  temporalScopeChanges: SemanticClaimChange[];
  removedPhrases: string[];
  warnings: string[];
  preserved: boolean;
};

export type CopyTransformSuccess = {
  ok: true;
  text: string;
  report: ClaimPreservationReport;
};

export type CopyTransformFailure = {
  ok: false;
  code: "evidence-required" | "claim-preservation-failed" | "unsupported-transform";
  message: string;
  report: ClaimPreservationReport;
};

export type CopyTransformResult = CopyTransformSuccess | CopyTransformFailure;

const DIRECTION_GROUPS: ReadonlyArray<{ key: string; pattern: RegExp }> = [
  { key: "increase", pattern: /\b(?:tăng|nâng|tăng trưởng|increase|grow|improve)\b/giu },
  { key: "decrease", pattern: /\b(?:giảm|hạ|suy giảm|decrease|decline|reduce)\b/giu }
];

const CERTAINTY_TERMS = [
  "chắc chắn",
  "luôn",
  "bảo đảm",
  "có thể",
  "có khả năng",
  "ước tính",
  "guaranteed",
  "always",
  "may",
  "might",
  "estimated"
] as const;

const POLARITY_GROUPS: ReadonlyArray<{ key: string; pattern: RegExp }> = [
  {
    key: "positive",
    pattern: /(?:^|[^\p{L}\p{N}_])(?:thích|hài lòng|tốt|hiệu quả|positive|satisfied|like)(?=$|[^\p{L}\p{N}_])/giu
  },
  {
    key: "negative",
    pattern: /(?:^|[^\p{L}\p{N}_])(?:ghét|không hài lòng|kém|xấu|negative|dissatisfied|dislike)(?=$|[^\p{L}\p{N}_])/giu
  }
];

const TEMPORAL_SCOPE_TERMS = [
  "hiện tại",
  "đến nay",
  "currently",
  "to date"
] as const;

const LIMITATION_TERMS = [
  "nhưng",
  "chưa",
  "không",
  "giới hạn",
  "hạn chế",
  "minh hoạ",
  "illustrative",
  "however",
  "not yet",
  "limitation"
] as const;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").replace(/\s+([,.;:!?])/gu, "$1").trim();
}

function capitalizeSentence(value: string): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length === 0) return normalized;
  return `${normalized.charAt(0).toLocaleUpperCase("vi-VN")}${normalized.slice(1)}`;
}

function ensureTerminalPeriod(value: string): string {
  const normalized = normalizeWhitespace(value).replace(/[.!?]+$/u, "");
  return normalized.length > 0 ? `${normalized}.` : normalized;
}

function splitClaims(value: string): string[] {
  return value
    .split(/[.!?\n]+/u)
    .map(normalizeWhitespace)
    .filter(Boolean);
}

function extractNumbers(value: string): string[] {
  return [...value.matchAll(/[-+]?\d+(?:[.,]\d+)?(?:\s?%)?/gu)].map((match) =>
    match[0].replace(/\s+/gu, "")
  );
}

function extractDirections(value: string): string[] {
  const found: string[] = [];
  for (const group of DIRECTION_GROUPS) {
    group.pattern.lastIndex = 0;
    if (group.pattern.test(value)) found.push(group.key);
  }
  return found;
}

function extractGroupedSignals(
  value: string,
  groups: ReadonlyArray<{ key: string; pattern: RegExp }>
): string[] {
  const found: string[] = [];
  for (const group of groups) {
    group.pattern.lastIndex = 0;
    if (group.pattern.test(value)) found.push(group.key);
  }
  return found;
}

function extractTerms(value: string, terms: readonly string[]): string[] {
  const normalized = value.toLocaleLowerCase("vi-VN");
  return terms.filter((term) => normalized.includes(term.toLocaleLowerCase("vi-VN")));
}

function difference(left: readonly string[], right: readonly string[]): string[] {
  const rightCounts = new Map<string, number>();
  for (const item of right) rightCounts.set(item, (rightCounts.get(item) ?? 0) + 1);

  const remaining: string[] = [];
  for (const item of left) {
    const count = rightCounts.get(item) ?? 0;
    if (count > 0) {
      rightCounts.set(item, count - 1);
    } else {
      remaining.push(item);
    }
  }
  return remaining;
}

export function analyzeClaimPreservation(
  originalText: string,
  resultingText: string,
  removedPhrases: readonly string[] = []
): ClaimPreservationReport {
  const originalNumbers = extractNumbers(originalText);
  const resultingNumbers = extractNumbers(resultingText);
  const introducedNumbers = difference(resultingNumbers, originalNumbers);
  const removedNumbers = difference(originalNumbers, resultingNumbers);
  const originalDirections = extractDirections(originalText);
  const resultingDirections = extractDirections(resultingText);
  const introducedDirections = difference(resultingDirections, originalDirections);
  const removedDirections = difference(originalDirections, resultingDirections);
  const discountedCertainty = removedPhrases.flatMap((phrase) =>
    extractTerms(phrase, CERTAINTY_TERMS)
  );
  const discountedLimitations = removedPhrases.flatMap((phrase) =>
    extractTerms(phrase, LIMITATION_TERMS)
  );
  const discountedPolarity = removedPhrases.flatMap((phrase) =>
    extractGroupedSignals(phrase, POLARITY_GROUPS)
  );
  const discountedTemporalScope = removedPhrases.flatMap((phrase) =>
    extractTerms(phrase, TEMPORAL_SCOPE_TERMS)
  );
  const originalCertainty = difference(
    extractTerms(originalText, CERTAINTY_TERMS),
    discountedCertainty
  );
  const resultingCertainty = extractTerms(resultingText, CERTAINTY_TERMS);
  const introducedCertainty = difference(resultingCertainty, originalCertainty);
  const removedCertainty = difference(originalCertainty, resultingCertainty);
  const originalLimitations = difference(
    extractTerms(originalText, LIMITATION_TERMS),
    discountedLimitations
  );
  const resultingLimitations = extractTerms(resultingText, LIMITATION_TERMS);
  const originalPolarity = difference(
    extractGroupedSignals(originalText, POLARITY_GROUPS),
    discountedPolarity
  );
  const resultingPolarity = extractGroupedSignals(resultingText, POLARITY_GROUPS);
  const originalTemporalScope = difference(
    extractTerms(originalText, TEMPORAL_SCOPE_TERMS),
    discountedTemporalScope
  );
  const resultingTemporalScope = extractTerms(resultingText, TEMPORAL_SCOPE_TERMS);
  const introducedLimitations = difference(resultingLimitations, originalLimitations);
  const removedLimitations = difference(originalLimitations, resultingLimitations);
  const introducedPolarity = difference(resultingPolarity, originalPolarity);
  const removedPolarity = difference(originalPolarity, resultingPolarity);
  const introducedTemporalScope = difference(resultingTemporalScope, originalTemporalScope);
  const removedTemporalScope = difference(originalTemporalScope, resultingTemporalScope);

  const numericChanges: NumericClaimChange[] = [
    ...introducedNumbers.map((introducedValue) => ({ introducedValue })),
    ...removedNumbers.map((removedValue) => ({ removedValue }))
  ];
  const certaintyChanges: SemanticClaimChange[] = [
    ...introducedCertainty.map((value) => ({
      kind: "certainty" as const,
      value,
      change: "introduced" as const
    })),
    ...removedCertainty.map((value) => ({
      kind: "certainty" as const,
      value,
      change: "removed" as const
    }))
  ];
  const limitationChanges: SemanticClaimChange[] = [
    ...introducedLimitations.map((value) => ({
      kind: "limitation" as const,
      value,
      change: "introduced" as const
    })),
    ...removedLimitations.map((value) => ({
      kind: "limitation" as const,
      value,
      change: "removed" as const
    }))
  ];
  const polarityChanges: SemanticClaimChange[] = [
    ...introducedPolarity.map((value) => ({
      kind: "polarity" as const,
      value,
      change: "introduced" as const
    })),
    ...removedPolarity.map((value) => ({
      kind: "polarity" as const,
      value,
      change: "removed" as const
    }))
  ];
  const temporalScopeChanges: SemanticClaimChange[] = [
    ...introducedTemporalScope.map((value) => ({
      kind: "temporal-scope" as const,
      value,
      change: "introduced" as const
    })),
    ...removedTemporalScope.map((value) => ({
      kind: "temporal-scope" as const,
      value,
      change: "removed" as const
    }))
  ];
  const directionChanges: SemanticClaimChange[] = [
    ...introducedDirections.map((value) => ({
      kind: "direction" as const,
      value,
      change: "introduced" as const
    })),
    ...removedDirections.map((value) => ({
      kind: "direction" as const,
      value,
      change: "removed" as const
    }))
  ];
  const preserved =
    numericChanges.length === 0 &&
    certaintyChanges.length === 0 &&
    limitationChanges.length === 0 &&
    polarityChanges.length === 0 &&
    temporalScopeChanges.length === 0 &&
    directionChanges.length === 0;
  const warnings = directionChanges.map(
    (change) => `Hướng thay đổi ${change.change === "introduced" ? "được thêm" : "bị xoá"}: ${change.value}.`
  );

  return {
    originalClaims: splitClaims(originalText),
    resultingClaims: splitClaims(resultingText),
    introducedClaims: preserved ? [] : splitClaims(resultingText),
    removedClaims: preserved ? [] : splitClaims(originalText),
    numericChanges,
    certaintyChanges,
    limitationChanges,
    polarityChanges,
    temporalScopeChanges,
    removedPhrases: [...removedPhrases],
    warnings,
    preserved
  };
}

function failure(
  code: CopyTransformFailure["code"],
  message: string,
  originalText: string,
  resultingText = "",
  removedPhrases: readonly string[] = []
): CopyTransformFailure {
  return {
    ok: false,
    code,
    message,
    report: analyzeClaimPreservation(originalText, resultingText, removedPhrases)
  };
}

function success(
  originalText: string,
  resultingText: string,
  removedPhrases: readonly string[] = []
): CopyTransformResult {
  const report = analyzeClaimPreservation(originalText, resultingText, removedPhrases);
  if (!report.preserved) {
    return {
      ok: false,
      code: "claim-preservation-failed",
      message: "Bản viết lại làm thay đổi số liệu, hướng thay đổi, mức độ chắc chắn hoặc giới hạn.",
      report
    };
  }
  return { ok: true, text: resultingText, report };
}

function topicFromHeading(heading: string): string {
  const topic = normalizeWhitespace(heading)
    .replace(/^(?:kết quả|hiệu quả|tổng quan|phân tích|results?|overview)\s*/iu, "")
    .trim();
  return topic.length > 0 ? topic.toLocaleLowerCase("vi-VN") : "kết quả";
}

function createConclusionFromEvidence(heading: string, evidenceText: string): string {
  const evidence = normalizeWhitespace(evidenceText).replace(/[.!?]+$/u, "");
  const change = evidence.match(
    /^(.+?)\s+(tăng|giảm)\s+từ\s+([-+]?\d+(?:[.,]\d+)?%?)\s+(lên|xuống|đến)\s+([-+]?\d+(?:[.,]\d+)?%?)\s+sau\s+(.+)$/iu
  );

  if (change) {
    const sourceSubject = normalizeWhitespace(change[1] ?? "").toLocaleLowerCase("vi-VN");
    const direction = (change[2] ?? "").toLocaleLowerCase("vi-VN");
    const from = change[3] ?? "";
    const connector = direction === "giảm" ? "xuống" : "lên";
    const to = change[5] ?? "";
    const timePhrase = capitalizeSentence(change[6] ?? "");
    const topic = topicFromHeading(heading);
    const subject = topic === "kết quả" ? sourceSubject : `${sourceSubject} ${topic}`;
    const verb = direction === "giảm" ? "giảm" : "nâng";
    return ensureTerminalPeriod(
      `${timePhrase} ${verb} ${subject} từ ${from} ${connector} ${to}`
    );
  }

  return ensureTerminalPeriod(capitalizeSentence(evidence));
}

export function rewriteConclusionHeading(input: {
  heading: string;
  evidenceText: string;
  proposedText?: string;
}): CopyTransformResult {
  const evidence = normalizeWhitespace(input.evidenceText);
  if (evidence.length === 0) {
    return failure(
      "evidence-required",
      "Cần bằng chứng hiện có trước khi viết conclusion heading.",
      ""
    );
  }

  const text = input.proposedText
    ? ensureTerminalPeriod(input.proposedText)
    : createConclusionFromEvidence(input.heading, evidence);
  return success(evidence, text);
}

function removePhrasesConservatively(
  text: string,
  phrases: readonly RegExp[]
): { text: string; removed: string[] } {
  let result = text;
  const removed: string[] = [];
  for (const pattern of phrases) {
    result = result.replace(pattern, (match) => {
      removed.push(normalizeWhitespace(match));
      return " ";
    });
  }
  return { text: capitalizeSentence(normalizeWhitespace(result)), removed };
}

export function removeTechnicalFiller(text: string): CopyTransformSuccess {
  const transformed = removePhrasesConservatively(text, [
    /^\s*theo như implementation hiện tại\s*,?\s*/iu,
    /^\s*theo như hệ thống hiện tại\s*,?\s*/iu,
    /\bở góc độ technical\b\s*,?\s*/giu,
    /\bthe agent will\b\s*/giu
  ]);
  const normalized = ensureTerminalPeriod(transformed.text);
  const report = analyzeClaimPreservation(text, normalized, transformed.removed);
  return { ok: true, text: normalized, report };
}

export function shortenCopy(text: string): CopyTransformResult {
  const transformed = removePhrasesConservatively(text, [
    /^\s*về cơ bản\s*,?\s*/iu,
    /(?:^|\s)thực sự(?=\s|[,.;:!?]|$)\s*/giu,
    /(?:^|\s)có thể nói rằng(?=\s|[,.;:!?]|$)\s*/giu,
    /^\s*in summary\s*,?\s*/iu
  ]);
  return success(text, ensureTerminalPeriod(transformed.text), transformed.removed);
}

export function simplifyProfessionalVietnamese(text: string): CopyTransformResult {
  const replacements: ReadonlyArray<[RegExp, string]> = [
    [/\btiến hành thực hiện\b/giu, "thực hiện"],
    [/\bnhằm mục đích\b/giu, "để"],
    [/\btrong trường hợp mà\b/giu, "khi"],
    [/\bcó khả năng hỗ trợ\b/giu, "có khả năng hỗ trợ"]
  ];
  let result = text;
  const removed: string[] = [];
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, (match) => {
      if (normalizeWhitespace(match) !== replacement) removed.push(normalizeWhitespace(match));
      return replacement;
    });
  }
  return success(text, ensureTerminalPeriod(capitalizeSentence(result)), removed);
}

export function parallelizeList(items: readonly string[]): {
  items: string[];
  report: ClaimPreservationReport;
} {
  const normalizedItems = items.map((item) => ensureTerminalPeriod(capitalizeSentence(item)));
  const original = items.join("\n");
  const resulting = normalizedItems.join("\n");
  return {
    items: normalizedItems,
    report: analyzeClaimPreservation(original, resulting)
  };
}

export function splitDenseCopy(
  text: string,
  options: { maxSentencesPerBlock?: number } = {}
): { blocks: string[]; report: ClaimPreservationReport } {
  const maxSentencesPerBlock = Math.max(1, options.maxSentencesPerBlock ?? 2);
  const sentences = splitClaims(text).map(ensureTerminalPeriod);
  const blocks: string[] = [];
  for (let index = 0; index < sentences.length; index += maxSentencesPerBlock) {
    blocks.push(sentences.slice(index, index + maxSentencesPerBlock).join(" "));
  }
  return {
    blocks,
    report: analyzeClaimPreservation(text, blocks.join(" "))
  };
}

export function draftSpeakerNotes(claims: readonly string[]): CopyTransformSuccess {
  const normalizedClaims = claims.map((claim) => ensureTerminalPeriod(claim));
  const original = normalizedClaims.join(" ");
  const text = normalizedClaims.map((claim) => `• ${claim}`).join("\n");
  return {
    ok: true,
    text,
    report: analyzeClaimPreservation(original, text)
  };
}
