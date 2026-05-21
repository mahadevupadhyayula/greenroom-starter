import type { Deal } from "@/db/schema";
import type { DealAttributeComparisonResult } from "@/lib/dealAttributeComparison";
import type { DealNotesParseResult } from "@/lib/dealNotesParser";
import type { VsDealClassificationResult } from "@/lib/vsDealClassification";

export type VsSettlementInput = {
  classification: VsDealClassificationResult;
  comparison: DealAttributeComparisonResult;
  parsedNotes: DealNotesParseResult;
  grossBoxOffice: number;
  totalExpenses: number;
};

export type VsSettlementResult =
  | {
      settlementState: "calculated";
      payout: number;
      guaranteeAmount: number;
      percentageRate: number;
      percentageBasis: "gross" | "net";
      percentageBase: number;
      percentagePayout: number;
      winner: "guarantee" | "percentage";
      auditTrail: string[];
    }
  | {
      settlementState: "manual_review";
      payout: null;
      reason: string;
      blockers: string[];
      warnings: string[];
      auditTrail: string[];
    };

function toDecimalRate(percentageValue: number): number {
  return percentageValue > 1 ? percentageValue / 100 : percentageValue;
}

export function calculateStandardVsSettlement(input: VsSettlementInput): VsSettlementResult {
  const { classification, comparison, parsedNotes, grossBoxOffice, totalExpenses } = input;

  if (classification.classification !== "supported") {
    return {
      settlementState: "manual_review",
      payout: null,
      reason: "Deal is not classified as supported standard Vs.",
      blockers: classification.blockers,
      warnings: classification.warnings,
      auditTrail: ["Skipped calculation because classification is manual_review."],
    };
  }

  const guaranteeAmount = comparison.comparisons.guaranteeAmount.structuredValue;
  const percentageValue = comparison.comparisons.percentage.structuredValue;
  const percentageBasis = comparison.comparisons.percentageBasis.structuredValue;

  if (guaranteeAmount == null || percentageValue == null || percentageBasis == null) {
    return {
      settlementState: "manual_review",
      payout: null,
      reason: "Required Vs fields are incomplete for calculation.",
      blockers: [
        ...classification.blockers,
        "Missing guarantee, percentage, or percentage basis for supported Vs calculation.",
      ],
      warnings: classification.warnings,
      auditTrail: ["Skipped calculation because required fields were missing."],
    };
  }

  const pctRate = toDecimalRate(percentageValue);
  const expenseCap = parsedNotes.expenseCap.value;
  const allowedExpenses = expenseCap == null ? totalExpenses : Math.min(totalExpenses, expenseCap);
  const uncappedNetBase = grossBoxOffice - allowedExpenses;
  const percentageBase = Math.max(0, percentageBasis === "net" ? uncappedNetBase : grossBoxOffice);
  const percentagePayout = Number((percentageBase * pctRate).toFixed(2));
  const payout = Number(Math.max(guaranteeAmount, percentagePayout).toFixed(2));

  const winner: "guarantee" | "percentage" = guaranteeAmount >= percentagePayout ? "guarantee" : "percentage";

  const auditTrail = [
    `Gross box office: ${grossBoxOffice.toFixed(2)}`,
    `Total expenses submitted: ${totalExpenses.toFixed(2)}`,
    `Expense cap from notes: ${expenseCap == null ? "none" : expenseCap.toFixed(2)}`,
    `Expenses used for net basis: ${allowedExpenses.toFixed(2)}`,
    `Percentage basis: ${percentageBasis}`,
    `Percentage rate normalized to decimal: ${pctRate.toFixed(4)}`,
    `Percentage base after floor: ${percentageBase.toFixed(2)}`,
    `Percentage payout: ${percentagePayout.toFixed(2)}`,
    `Guarantee amount: ${guaranteeAmount.toFixed(2)}`,
    `Winning branch: ${winner}`,
    `Final payout: ${payout.toFixed(2)}`,
  ];

  return {
    settlementState: "calculated",
    payout,
    guaranteeAmount,
    percentageRate: pctRate,
    percentageBasis,
    percentageBase,
    percentagePayout,
    winner,
    auditTrail,
  };
}

export function canReuseLegacySettlement(dealType: Deal["dealType"]): boolean {
  return dealType === "flat" || dealType === "percentage_of_gross";
}
