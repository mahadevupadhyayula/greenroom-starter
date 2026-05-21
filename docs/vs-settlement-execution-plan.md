# Vs Settlement Execution Plan

This document defines a gated, stage-by-stage execution framework for the Vs settlement prototype. It is intentionally procedural and validation-first.

## Operating Rules

- Implement only one stage at a time.
- Add or update tests for that stage before proceeding.
- Run the stage validation commands.
- Fix failures before marking the stage complete.
- Update `docs/vs-settlement-prototype-notes.md` with what changed and validation outcomes.
- Stop after the stage is complete and wait for approval.

---

## Stage 0 — Test harness and documentation skeleton
### Goal
Establish a repeatable validation workflow and documentation scaffolding before introducing product logic.
### Files to add
- `docs/vs-settlement-prototype-notes.md`
- `tests/helpers/assertSettlement.ts`
### Files to modify
- `package.json`
- `README.md`
### Implementation scope
- Add staged test scripts using existing `tsx` tooling.
- Add the prototype notes skeleton.
- Add README links to execution and prototype notes docs.
- Do not implement parser, comparison, classification, settlement, UI, or integration logic.
### Tests to add
- No product tests yet; only test command scaffolding.
### Validation commands
- `npm run lint`
- `npm run build`
### Stop condition
- Docs exist and README links resolve.
- Test scripts are present.
- Lint and build pass.
### Do not proceed
Do not begin Stage 1 until Stage 0 has been reviewed and approved.

## Stage 1 — Deal notes parser
### Goal
Build a deterministic rule-based parser that extracts settlement attributes from `dealNotesFreetext`.
### Files to add
- `lib/dealNotesParser.ts`
- `tests/dealNotesParser.test.ts`
- `tests/fixtures/dealNotesParserCases.ts`
### Files to modify
- `docs/vs-settlement-prototype-notes.md`
### Implementation scope
- Extract key attributes (guarantee, percentage, basis, caps, non-standard terms, ambiguity).
- Include confidence, evidence, source, and blocker metadata.
- Prefer explicit ambiguity/manual-review signals over guesses.
### Tests to add
- Comprehensive parser fixtures across variants and ambiguity/conflict cases.
### Validation commands
- `npm run test:parser`
- `npm run lint`
- `npm run build`
### Stop condition
- Parser fixtures pass and required categories are covered.
- Ambiguous inputs are flagged, not guessed.
- Non-standard terms produce blockers/warnings.
### Do not proceed
Do not begin Stage 2 until Stage 1 has been reviewed and approved.

## Stage 2 — Structured-vs-notes comparison
### Goal
Compare extracted note attributes to structured fields and produce explicit comparison statuses and severities.
### Files to add
- `lib/dealAttributeComparison.ts`
- `tests/dealAttributeComparison.test.ts`
### Files to modify
- `docs/vs-settlement-prototype-notes.md`
### Implementation scope
- Compare `guaranteeAmount`, `percentage`, `percentageBasis`, `expenseCap`, and `hospitalityCap`.
- Return comparison statuses and severities.
- Elevate core mismatches to blockers.
### Tests to add
- Match/mismatch/absence/ambiguity cases, including percentage normalization checks.
### Validation commands
- `npm run test:comparison`
- `npm run test:parser`
- `npm run lint`
- `npm run build`
### Stop condition
- Comparison tests pass.
- Severity mapping follows gating rules.
- Ambiguity and assumptions are explicit.
### Do not proceed
Do not begin Stage 3 until Stage 2 has been reviewed and approved.

## Stage 3 — Vs deal classification
### Goal
Classify Vs deals as supported standard Vs vs manual review paths.
### Files to add
- `lib/vsDealClassification.ts`
- `tests/vsDealClassification.test.ts`
### Files to modify
- `docs/vs-settlement-prototype-notes.md`
### Implementation scope
- Output supported or manual-review classifications.
- Aggregate risks, assumptions, blockers, and reason strings.
### Tests to add
- Standard supported scenarios, non-standard term routing, conflict routing, and insufficient-data routing.
### Validation commands
- `npm run test:classification`
- `npm run test:comparison`
- `npm run test:parser`
- `npm run lint`
- `npm run build`
### Stop condition
- Classification tests pass.
- Non-standard and conflict scenarios route to manual review.
### Do not proceed
Do not begin Stage 4 until Stage 3 has been reviewed and approved.

## Stage 4 — Standard Vs settlement calculation
### Goal
Calculate payout for supported standard Vs deals only.
### Files to add
- `lib/vsSettlement.ts`
- `tests/vsSettlementCalculation.test.ts`
### Files to modify
- `docs/vs-settlement-prototype-notes.md`
### Implementation scope
- Preserve current `flat` and `percentage_of_gross` behavior.
- Compute settlement math and audit trail for supported standard Vs deals.
- Return non-calculating manual-review results when unsupported.
### Tests to add
- Guarantee/percentage winner, normalization, expense behavior, caps, negative base floor, manual-review non-calculation, and audit trail coverage.
### Validation commands
- `npm run test:calculation`
- `npm run test:classification`
- `npm run test:comparison`
- `npm run test:parser`
- `npm run lint`
- `npm run build`
### Stop condition
- Calculation tests pass and support/manual-review branches behave correctly.
### Do not proceed
Do not begin Stage 5 until Stage 4 has been reviewed and approved.

## Stage 5 — UI components
### Goal
Implement standalone Vs settlement UI components (without page integration yet).
### Files to add
- `components/settlement/VsSettlementWorksheet.tsx`
- `components/settlement/DealAttributeComparison.tsx`
- `components/settlement/SettlementFlags.tsx`
- `components/settlement/SettlementAuditTrail.tsx`
### Files to modify
- `docs/vs-settlement-prototype-notes.md`
### Implementation scope
- Render supported and manual-review UI states.
### Tests to add
- Prefer compile-time and lint validation unless UI test infra is intentionally introduced.
### Validation commands
- `npm run test:all`
- `npm run lint`
- `npm run build`
### Stop condition
- Components compile cleanly and required states are represented.
### Do not proceed
Do not begin Stage 6 until Stage 5 has been reviewed and approved.

## Stage 6 — Settlement page integration
### Goal
Integrate Vs worksheet and calculation path into the settlement page while preserving existing paths.
### Files to add
- None required.
### Files to modify
- `app/shows/[id]/settle/page.tsx`
- `docs/vs-settlement-prototype-notes.md`
### Implementation scope
- Add Vs-specific branch and render `VsSettlementWorksheet` for Vs deals.
- Preserve existing non-Vs supported/unsupported flows.
### Tests to add
- Reuse stage suite and add integration checks if needed.
### Validation commands
- `npm run test:all`
- `npm run lint`
- `npm run build`
- `npm run db:reset`
- `npm run dev` (manual validation)
### Stop condition
- Existing deal types remain intact.
- Standard Vs calculates and renders.
- Non-standard Vs routes to manual review.
### Do not proceed
Do not begin Stage 7 until Stage 6 has been reviewed and approved.

## Stage 7 — Final documentation and demo script
### Goal
Finalize reviewer-facing documentation and validation history.
### Files to add
- None required.
### Files to modify
- `docs/vs-settlement-prototype-notes.md`
- `README.md`
### Implementation scope
- Summarize all repo changes and document behavior, limitations, exclusions, and demo flow.
### Tests to add
- No new product tests required unless behavior changes.
### Validation commands
- `npm run test:all`
- `npm run lint`
- `npm run build`
### Stop condition
- Documentation is complete, consistent, and reviewer-ready.
### Do not proceed
Do not continue further stages after completion; the execution plan ends here.
