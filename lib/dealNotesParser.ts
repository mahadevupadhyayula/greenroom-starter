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

export function parseDealNotes(dealNotesFreetext: string): DealNotesParseResult {
  const text = dealNotesFreetext.trim();
  const normalized = text.toLowerCase();

  const guarantee = createField<number>(null);
  const percentage = createField<number>(null);
  const percentageBasis = createField<"gross" | "net">(null);
  const expenseCap = createField<number>(null);
  const hospitalityCap = createField<number>(null);

  const nonStandardTerms: string[] = [];
  const ambiguityFlags: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  const guaranteeMatch = normalized.match(/(?:guarantee|vs\.?\s*guarantee|min(?:imum)?)\s*[:=-]?\s*(\$\s?\d[\d,]*(?:\.\d{1,2})?)/i);
  if (guaranteeMatch?.[1]) {
    guarantee.value = parseMoney(guaranteeMatch[1]);
    guarantee.evidence.push(guaranteeMatch[0]);
  }

  const pctMatches = [...normalized.matchAll(/(\d{1,2}(?:\.\d+)?)\s*%/g)].map((m) => Number(m[1]));
  const uniquePcts = [...new Set(pctMatches)];
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

  const hasGross = /\bgross\b/.test(normalized);
  const hasNet = /\bnet\b/.test(normalized);
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

  const expenseCapMatch = normalized.match(/(?:expense\s*cap|capped\s*expenses?)\s*[:=-]?\s*(\$\s?\d[\d,]*(?:\.\d{1,2})?)/i);
  if (expenseCapMatch?.[1]) {
    expenseCap.value = parseMoney(expenseCapMatch[1]);
    expenseCap.evidence.push(expenseCapMatch[0]);
  }

  const hospitalityCapMatch = normalized.match(/(?:hospitality\s*cap|hospitality\s*up\s*to)\s*[:=-]?\s*(\$\s?\d[\d,]*(?:\.\d{1,2})?)/i);
  if (hospitalityCapMatch?.[1]) {
    hospitalityCap.value = parseMoney(hospitalityCapMatch[1]);
    hospitalityCap.evidence.push(hospitalityCapMatch[0]);
  }

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

  if (/tbd|to be determined|confirm|maybe|approx|around/i.test(normalized)) {
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
