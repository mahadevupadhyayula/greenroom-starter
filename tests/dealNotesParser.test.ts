import assert from "node:assert/strict";

import { parseDealNotes } from "@/lib/dealNotesParser";
import { parserCases } from "@/tests/fixtures/dealNotesParserCases";

for (const testCase of parserCases) {
  const result = parseDealNotes(testCase.notes);

  assert.equal(result.guarantee.value, testCase.expected.guarantee, `${testCase.name}: guarantee`);
  assert.equal(result.percentage.value, testCase.expected.percentage, `${testCase.name}: percentage`);
  assert.equal(result.percentageBasis.value, testCase.expected.basis, `${testCase.name}: basis`);
  assert.equal(result.expenseCap.value, testCase.expected.expenseCap, `${testCase.name}: expenseCap`);
  assert.equal(result.hospitalityCap.value, testCase.expected.hospitalityCap, `${testCase.name}: hospitalityCap`);
  assert.equal(result.ambiguityFlags.length > 0, testCase.expected.hasAmbiguity, `${testCase.name}: ambiguity`);
  assert.equal(result.blockers.length > 0, testCase.expected.hasBlocker, `${testCase.name}: blockers`);
  assert.equal(result.nonStandardTerms.length > 0, testCase.expected.hasNonStandard, `${testCase.name}: non-standard`);
}

console.log(`Parser tests passed: ${parserCases.length} cases.`);
