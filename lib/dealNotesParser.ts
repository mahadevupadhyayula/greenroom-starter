export type ParserConfidence = "high" | "medium" | "low";

export type ExtractedField<T> = {
  value: T | null;
  confidence: ParserConfidence;
  evidence: string[];
  source: "dealNotesFreetext";
  ambiguous: boolean;
  blockers: string[];
  warnings: string[];
};

export type DealNotesParseResult = {
  guarantee: ExtractedField<number>;
  percentage: ExtractedField<number>;
  percentageBasis: ExtractedField<"gross" | "net">;
  expenseCap: ExtractedField<number>;
  hospitalityCap: ExtractedField<number>;
  nonStandardTerms: string[];
  ambiguityFlags: string[];
  blockers: string[];
  warnings: string[];
};

const moneyPattern = /(\$\s?\d[\d,]*(?:\.\d{1,2})?|\d[\d,]*(?:\.\d{1,2})?\s?(?:usd|dollars))/gi;
const moneyToken = "(?:\\$\\s?\\d[\\d,]*(?:\\.\\d{1,2})?|\\d[\\d,]*(?:\\.\\d{1,2})?)";

function parseMoney(value: string): number {
  return Number(value.replace(/usd|dollars|\$|\s|,/gi, ""));
}

function createField<T>(value: T | null): ExtractedField<T> {
  return {
    value,
    confidence: value === null ? "low" : "high",
    evidence: [],
    source: "dealNotesFreetext",
    ambiguous: false,
    blockers: [],
    warnings: [],
  };
}

function normalizeDealNotes(text: string): string {
  return text
    .replace(/[\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/\bg\s*['’-]?\s*tee\b/gi, "gtee")
    .replace(/\bhosp\b/gi, "hospitality")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCandidates(patterns: RegExp[], text: string): Array<{ value: number; evidence: string }> {
  const candidates: Array<{ value: number; evidence: string }> = [];
  const seen = new Set<string>();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const amount = match[1] ?? match[2];
      if (!amount) continue;
      const value = parseMoney(amount);
      const evidence = match[0].trim();
      const key = `${value}::${evidence.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({ value, evidence });
    }
  }
  return candidates;
}

function applyCandidateField(field: ExtractedField<number>, candidates: Array<{ value: number; evidence: string }>, label: string): void {
  if (candidates.length === 0) return;
  field.evidence.push(...candidates.map((c) => c.evidence));
  const uniqueValues = [...new Set(candidates.map((c) => c.value))];
  if (uniqueValues.length === 1) {
    field.value = uniqueValues[0];
    return;
  }

  field.ambiguous = true;
  field.confidence = "low";
  field.value = null;
  const msg = `Multiple ${label} candidates found: ${uniqueValues.join(", ")}`;
  field.blockers.push(msg);
}

export function parseDealNotes(dealNotesFreetext: string): DealNotesParseResult {
  const text = dealNotesFreetext.trim();
  const normalizedText = normalizeDealNotes(text);

  const guarantee = createField<number>(null);
  const percentage = createField<number>(null);
  const percentageBasis = createField<"gross" | "net">(null);
  const expenseCap = createField<number>(null);
  const hospitalityCap = createField<number>(null);

  const nonStandardTerms: string[] = [];
  const ambiguityFlags: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  const guaranteeCandidates = extractCandidates(
    [
      new RegExp(`(${moneyToken})\\s*(?:guarantee|gtee|min(?:imum)?)\\b`, "gi"),
      new RegExp(`(?:guarantee|gtee|min(?:imum)?)\\s*[:=-]?\\s*(${moneyToken})`, "gi"),
      new RegExp(`(?:^|\\bdeal\\s*:)\\s*(${moneyToken})\\s*vs\\b`, "gi"),
      new RegExp(`^\\s*(${moneyToken})\\s*vs\\b`, "gi"),
    ],
    normalizedText,
  );
  applyCandidateField(guarantee, guaranteeCandidates, "guarantee");
  if (guarantee.value !== null && guaranteeCandidates.some((c) => /\bdeal\s*:|\bvs\b/i.test(c.evidence) && !/\bguarantee|\bgtee|\bmin(?:imum)?/i.test(c.evidence))) {
    guarantee.confidence = "medium";
  }

  const pctMatches = [...normalizedText.matchAll(/(\d{1,2}(?:\.\d+)?)\s*%/g)].map((m) => Number(m[1]));
  const splitMatches = [...normalizedText.matchAll(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/g)].map((m) => Number(m[1]));
  const uniquePcts = [...new Set([...pctMatches, ...splitMatches])];
  if (uniquePcts.length === 1) {
    percentage.value = uniquePcts[0];
    percentage.evidence.push(`${uniquePcts[0]}%`);
  } else if (uniquePcts.length > 1) {
    percentage.ambiguous = true;
    percentage.confidence = "low";
    const msg = `Multiple percentages found: ${uniquePcts.join(", ")}`;
    percentage.blockers.push(msg);
    ambiguityFlags.push(msg);
    blockers.push(msg);
  }

  const hasGross = /\bgross\b/.test(normalizedText);
  const hasNet = /\bnet\b/.test(normalizedText) || /(?:\b\d{1,2}\s*\/\s*\d{1,2}\b|\b\d{1,2}(?:\.\d+)?%?)\s*(?:split\s+on\s+)?after expenses/.test(normalizedText);
  if (hasGross && hasNet) {
    const msg = "Both gross and net basis referenced";
    percentageBasis.ambiguous = true;
    percentageBasis.confidence = "low";
    percentageBasis.blockers.push(msg);
    ambiguityFlags.push(msg);
    blockers.push(msg);
  } else if (hasGross) {
    percentageBasis.value = "gross";
    percentageBasis.evidence.push("gross");
  } else if (hasNet) {
    percentageBasis.value = "net";
    percentageBasis.evidence.push("net");
  }

  const expenseCandidates = extractCandidates(
    [
      new RegExp(`(?:expense|expenses)\\s*cap(?:ped)?\\s*(?:at)?\\s*(${moneyToken})`, "gi"),
      new RegExp(`(?:expense|expenses)\\s*(?:to|up\\s*to)\\s*(${moneyToken})`, "gi"),
      new RegExp(`cap(?:ped)?\\s*(?:expense|expenses)\\s*(${moneyToken})`, "gi"),
    ],
    normalizedText,
  );
  applyCandidateField(expenseCap, expenseCandidates, "expense cap");

  const hospitalityCandidates = extractCandidates(
    [
      new RegExp(`(?:hospitality)\\s*cap(?:ped)?\\s*(?:at)?\\s*(${moneyToken})`, "gi"),
      new RegExp(`(?:hospitality)\\s*(?:to|up\\s*to)\\s*(${moneyToken})`, "gi"),
      new RegExp(`(?:hospitality)\\s*[:=-]?\\s*(${moneyToken})`, "gi"),
    ],
    normalizedText,
  );
  applyCandidateField(hospitalityCap, hospitalityCandidates, "hospitality cap");

  const nonStandardSignals: Array<[RegExp, string]> = [
    [/walkout/i, "Walkout term present"],
    [/tier(?:ed)?\s+ratchet/i, "Tier ratchet term present"],
    [/step(?:-)?up/i, "Step-up term present"],
    [/backend/i, "Backend term present"],
  ];

  nonStandardSignals.forEach(([pattern, label]) => {
    if (pattern.test(text)) {
      nonStandardTerms.push(label);
      warnings.push(label);
    }
  });

  if (/tbd|to be determined|confirm|maybe|approx|around|ambiguous|disputed/i.test(normalizedText)) {
    const msg = "Ambiguous language detected requiring manual review";
    ambiguityFlags.push(msg);
    blockers.push(msg);
  }

  const allMoneyMatches = [...text.matchAll(moneyPattern)].map((m) => m[0]);
  if (!guarantee.value && allMoneyMatches.length > 0 && /vs/i.test(text)) {
    const msg = "Money amounts present without explicit guarantee label";
    guarantee.warnings.push(msg);
    warnings.push(msg);
  }

  if (guarantee.blockers.length > 0) blockers.push(...guarantee.blockers);
  if (expenseCap.blockers.length > 0) blockers.push(...expenseCap.blockers);
  if (hospitalityCap.blockers.length > 0) blockers.push(...hospitalityCap.blockers);

  return {
    guarantee,
    percentage,
    percentageBasis,
    expenseCap,
    hospitalityCap,
    nonStandardTerms,
    ambiguityFlags,
    blockers,
    warnings,
  };
}
