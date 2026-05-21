import assert from "node:assert/strict";

import { compareStructuredToNotes } from "@/lib/dealAttributeComparison";
import { parseDealNotes } from "@/lib/dealNotesParser";

{
  const notes = parseDealNotes("Vs guarantee $2500 vs 85% gross. Expense cap $400. Hospitality cap $150.");
  const result = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 85,
      percentageBasis: "gross",
      expenseCap: 400,
      hospitalityCap: 150,
    },
    notes,
  );

  assert.equal(result.comparisons.guaranteeAmount.status, "match");
  assert.equal(result.comparisons.percentage.status, "match");
  assert.equal(result.comparisons.percentageBasis.status, "match");
  assert.equal(result.blockers.length, 0);
}

{
  const notes = parseDealNotes("Guarantee $3000 vs 80% gross.");
  const result = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 80,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: null,
    },
    notes,
  );

  assert.equal(result.comparisons.guaranteeAmount.status, "mismatch");
  assert.equal(result.comparisons.guaranteeAmount.severity, "blocker");
  assert.ok(result.blockers.some((b) => b.includes("guaranteeAmount")));
}

{
  const notes = parseDealNotes("Guarantee $2500 vs 85% gross.");
  const result = compareStructuredToNotes(
    {
      guaranteeAmount: null,
      percentage: 85,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: null,
    },
    notes,
  );

  assert.equal(result.comparisons.guaranteeAmount.status, "missing_structured");
  assert.equal(result.comparisons.guaranteeAmount.severity, "blocker");
}

{
  const notes = parseDealNotes("Guarantee $2500 vs 85% gross.");
  const result = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 0.85,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: null,
    },
    notes,
  );

  assert.equal(result.comparisons.percentage.status, "match");
}

{
  const notes = parseDealNotes("Guarantee $2500 vs 80% or 85% gross.");
  const result = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 85,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: null,
    },
    notes,
  );

  assert.equal(result.comparisons.percentage.status, "ambiguous");
  assert.equal(result.comparisons.percentage.severity, "blocker");
}

{
  const notes = parseDealNotes("Guarantee $2500 vs 85% gross.");
  const result = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 85,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: 100,
    },
    notes,
  );

  assert.equal(result.comparisons.hospitalityCap.status, "missing_notes");
  assert.equal(result.comparisons.hospitalityCap.severity, "warning");
  assert.equal(result.blockers.length, 0);
  assert.ok(result.warnings.some((w) => w.includes("hospitalityCap")));
}

console.log("Comparison tests passed.");
