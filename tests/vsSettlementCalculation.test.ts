import assert from "node:assert/strict";

import { compareStructuredToNotes } from "@/lib/dealAttributeComparison";
import { parseDealNotes } from "@/lib/dealNotesParser";
import { calculateStandardVsSettlement } from "@/lib/vsSettlement";
import { classifyVsDeal } from "@/lib/vsDealClassification";

function buildSupportedContext(notesText: string, structured: {
  guaranteeAmount: number | null;
  percentage: number | null;
  percentageBasis: "gross" | "net" | null;
  expenseCap: number | null;
  hospitalityCap: number | null;
}) {
  const parsedNotes = parseDealNotes(notesText);
  const comparison = compareStructuredToNotes(structured, parsedNotes);
  const classification = classifyVsDeal({ parsedNotes, comparison });
  return { parsedNotes, comparison, classification };
}

{
  const ctx = buildSupportedContext("Vs guarantee $2500 vs 85% gross.", {
    guaranteeAmount: 2500,
    percentage: 85,
    percentageBasis: "gross",
    expenseCap: null,
    hospitalityCap: null,
  });

  const result = calculateStandardVsSettlement({
    ...ctx,
    grossBoxOffice: 2000,
    totalExpenses: 300,
  });

  assert.equal(result.settlementState, "calculated");
  if (result.settlementState === "calculated") {
    assert.equal(result.winner, "guarantee");
    assert.equal(result.payout, 2500);
  }
}

{
  const ctx = buildSupportedContext("Vs guarantee $2500 vs 85% gross.", {
    guaranteeAmount: 2500,
    percentage: 0.85,
    percentageBasis: "gross",
    expenseCap: null,
    hospitalityCap: null,
  });

  const result = calculateStandardVsSettlement({
    ...ctx,
    grossBoxOffice: 4000,
    totalExpenses: 300,
  });

  assert.equal(result.settlementState, "calculated");
  if (result.settlementState === "calculated") {
    assert.equal(result.winner, "percentage");
    assert.equal(result.percentageRate, 0.85);
    assert.equal(result.payout, 3400);
  }
}

{
  const ctx = buildSupportedContext("Vs guarantee $2000 vs 90% net. Expense cap $500.", {
    guaranteeAmount: 2000,
    percentage: 90,
    percentageBasis: "net",
    expenseCap: 500,
    hospitalityCap: null,
  });

  const result = calculateStandardVsSettlement({
    ...ctx,
    grossBoxOffice: 5000,
    totalExpenses: 900,
  });

  assert.equal(result.settlementState, "calculated");
  if (result.settlementState === "calculated") {
    assert.equal(result.percentageBase, 4500);
    assert.equal(result.percentagePayout, 4050);
    assert.equal(result.winner, "percentage");
  }
}

{
  const ctx = buildSupportedContext("Vs guarantee $1500 vs 80% net.", {
    guaranteeAmount: 1500,
    percentage: 80,
    percentageBasis: "net",
    expenseCap: null,
    hospitalityCap: null,
  });

  const result = calculateStandardVsSettlement({
    ...ctx,
    grossBoxOffice: 1000,
    totalExpenses: 1800,
  });

  assert.equal(result.settlementState, "calculated");
  if (result.settlementState === "calculated") {
    assert.equal(result.percentageBase, 0);
    assert.equal(result.percentagePayout, 0);
    assert.equal(result.winner, "guarantee");
    assert.equal(result.payout, 1500);
  }
}

{
  const parsedNotes = parseDealNotes("Vs guarantee $2500 vs 80% gross with backend bonus.");
  const comparison = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 80,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: null,
    },
    parsedNotes,
  );
  const classification = classifyVsDeal({ parsedNotes, comparison });

  const result = calculateStandardVsSettlement({
    classification,
    comparison,
    parsedNotes,
    grossBoxOffice: 5000,
    totalExpenses: 1000,
  });

  assert.equal(result.settlementState, "manual_review");
  if (result.settlementState === "manual_review") {
    assert.equal(result.payout, null);
    assert.ok(result.blockers.length > 0);
  }
}

{
  const ctx = buildSupportedContext("Vs guarantee $2500 vs 85% gross. Expense cap $400.", {
    guaranteeAmount: 2500,
    percentage: 85,
    percentageBasis: "gross",
    expenseCap: 400,
    hospitalityCap: null,
  });

  const result = calculateStandardVsSettlement({
    ...ctx,
    grossBoxOffice: 3000,
    totalExpenses: 900,
  });

  assert.equal(result.settlementState, "calculated");
  if (result.settlementState === "calculated") {
    assert.ok(result.auditTrail.length >= 8);
    assert.ok(result.auditTrail.some((line) => line.includes("Winning branch")));
  }
}

console.log("Vs settlement calculation tests passed.");
