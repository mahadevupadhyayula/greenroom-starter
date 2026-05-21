import assert from "node:assert/strict";

import { classifyVsDeal } from "@/lib/vsDealClassification";
import { compareStructuredToNotes } from "@/lib/dealAttributeComparison";
import { parseDealNotes } from "@/lib/dealNotesParser";

{
  const notes = parseDealNotes("Vs guarantee $2500 vs 85% gross. Expense cap $400. Hospitality cap $150.");
  const comparison = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 85,
      percentageBasis: "gross",
      expenseCap: 400,
      hospitalityCap: 150,
    },
    notes,
  );

  const result = classifyVsDeal({ parsedNotes: notes, comparison });
  assert.equal(result.classification, "supported");
  assert.equal(result.blockers.length, 0);
  assert.ok(result.reasons.some((reason) => reason.includes("standard Vs")));
}

{
  const notes = parseDealNotes("Vs guarantee $2500 vs 85% gross with backend bonus.");
  const comparison = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 85,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: null,
    },
    notes,
  );

  const result = classifyVsDeal({ parsedNotes: notes, comparison });
  assert.equal(result.classification, "manual_review");
  assert.ok(result.blockers.some((blocker) => blocker.includes("Non-standard term")));
}

{
  const notes = parseDealNotes("Vs guarantee $3000 vs 85% gross.");
  const comparison = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 85,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: null,
    },
    notes,
  );

  const result = classifyVsDeal({ parsedNotes: notes, comparison });
  assert.equal(result.classification, "manual_review");
  assert.ok(result.blockers.some((blocker) => blocker.includes("guaranteeAmount mismatch")));
}

{
  const notes = parseDealNotes("Vs terms maybe 80% or 85% net. Confirm later.");
  const comparison = compareStructuredToNotes(
    {
      guaranteeAmount: 2500,
      percentage: 85,
      percentageBasis: "gross",
      expenseCap: null,
      hospitalityCap: null,
    },
    notes,
  );

  const result = classifyVsDeal({ parsedNotes: notes, comparison });
  assert.equal(result.classification, "manual_review");
  assert.ok(result.blockers.length > 0);
  assert.ok(result.reasons.some((reason) => reason.includes("Manual review required")));
}

console.log("Classification tests passed.");
