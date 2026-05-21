import type { DealAttributeComparisonResult } from "@/lib/dealAttributeComparison";
import type { DealNotesParseResult } from "@/lib/dealNotesParser";

export type VsDealClassification = "supported" | "manual_review";

export type VsDealClassificationResult = {
  classification: VsDealClassification;
  reasons: string[];
  blockers: string[];
  warnings: string[];
  assumptions: string[];
};

export function classifyVsDeal(input: {
  parsedNotes: DealNotesParseResult;
  comparison: DealAttributeComparisonResult;
}): VsDealClassificationResult {
  const { parsedNotes, comparison } = input;

  const blockers = [
    ...parsedNotes.blockers,
    ...comparison.blockers,
    ...parsedNotes.nonStandardTerms.map((term) => `Non-standard term requires manual review: ${term}`),
  ];

  const warnings = [
    ...parsedNotes.warnings,
    ...comparison.warnings,
  ];

  const assumptions: string[] = [];

  if (comparison.comparisons.expenseCap.status === "match" && comparison.comparisons.expenseCap.notesValue === null) {
    assumptions.push("No expense cap applies.");
  }

  if (comparison.comparisons.hospitalityCap.status === "match" && comparison.comparisons.hospitalityCap.notesValue === null) {
    assumptions.push("No hospitality cap applies.");
  }

  if (comparison.comparisons.guaranteeAmount.status === "match" && comparison.comparisons.percentage.status === "match") {
    assumptions.push("Guarantee and percentage terms are aligned between structured fields and notes.");
  }

  const reasons = blockers.length > 0
    ? ["Manual review required due to blockers or unsupported terms."]
    : ["Deal is standard Vs and eligible for automated settlement."];

  return {
    classification: blockers.length > 0 ? "manual_review" : "supported",
    reasons,
    blockers,
    warnings,
    assumptions,
  };
}
