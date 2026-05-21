# Vs Settlement Prototype Notes

## Problem Being Solved
- The existing settlement flow handled flat and `% of gross` deals well enough, but Vs deals were inconsistently represented in structured fields and often encoded as freeform notes, causing calculation errors, reviewer confusion, and manual reconciliation risk.
- The prototype goal was to make Vs settlement behavior explicit and safe: calculate only truly standard Vs deals and route everything ambiguous or non-standard to a reviewer-first manual-review path.

## MVP Scope
- Parse `dealNotesFreetext` into settlement-relevant attributes with confidence/evidence metadata.
- Compare notes-derived attributes against structured deal fields and produce field-level status/severity.
- Classify Vs deals into `supported` vs `manual_review` with explicit reasons, blockers, warnings, and assumptions.
- Calculate settlement only for supported standard Vs deals, including traceable audit output.
- Render reviewer-facing UI states for both supported and manual-review outcomes.
- Integrate Vs logic into `/shows/[id]/settle` while preserving non-Vs behavior.

## Implementation Phases
- Stage 1: deterministic notes parser + fixtures/tests.
- Stage 2: structured-vs-notes comparator + severity routing.
- Stage 3: Vs classification gate (supported/manual review).
- Stage 4: standard Vs calculator + audit trail.
- Stage 5: standalone Vs settlement UI components.
- Stage 6: settlement page integration.
- Stage 7: final documentation, validation history, and demo script.

## Validation Gates
- Stage validation was run sequentially per plan and recorded in the validation log below.
- Core quality bar across stages: parser/comparison/classification/calculation correctness, lint/build health, and safe manual-review routing for unsupported cases.

## Files Added
- `lib/dealNotesParser.ts`
- `tests/dealNotesParser.test.ts`
- `tests/fixtures/dealNotesParserCases.ts`
- `lib/dealAttributeComparison.ts`
- `tests/dealAttributeComparison.test.ts`
- `lib/vsDealClassification.ts`
- `tests/vsDealClassification.test.ts`
- `lib/vsSettlement.ts`
- `tests/vsSettlementCalculation.test.ts`
- `components/settlement/VsSettlementWorksheet.tsx`
- `components/settlement/DealAttributeComparison.tsx`
- `components/settlement/SettlementFlags.tsx`
- `components/settlement/SettlementAuditTrail.tsx`

## Files Modified
- `package.json` (staged test scripts, including `test:all`)
- `README.md` (prototype-doc links and reviewer guidance)
- `app/shows/[id]/settle/page.tsx` (Vs integration branch)
- `docs/vs-settlement-prototype-notes.md` (implementation + validation log)
- `app/layout.tsx` (Google font dependency removal for offline-safe builds)

## Parser Behavior
- Rule-based extraction for guarantee, percentage, percentage basis, expense cap, and hospitality cap.
- Emits ambiguity signals and non-standard term blockers instead of guessing.
- Attaches confidence/evidence/source metadata for reviewer transparency.

## Structured-vs-Notes Comparison
- Compares core fields (`guaranteeAmount`, `percentage`, `percentageBasis`) and cap fields (`expenseCap`, `hospitalityCap`).
- Emits explicit statuses: `match`, `mismatch`, `missing_structured`, `missing_notes`, `ambiguous`.
- Maps core mismatches to blockers and cap mismatches to warnings.
- Normalizes percentage representations (`0.85` and `85`) before comparison.

## Classification Logic
- `supported` only when inputs are sufficiently complete, non-conflicting, and standard.
- Routes to `manual_review` when any non-standard terms, ambiguity, or structured-vs-notes blockers are present.
- Aggregates reasons, blockers, warnings, and assumptions for clear reviewer context.

## Settlement Calculation
- For supported standard Vs deals, computes guarantee-vs-percentage winner with explicit math steps.
- Floors negative net calculation inputs at zero to avoid invalid payouts.
- Includes expense-cap-aware behavior and percentage normalization.
- Produces an audit trail suitable for settlement review.

## Manual Review Logic
- Unsupported/non-standard/ambiguous Vs deals return a non-calculating manual-review result.
- Manual-review responses include blockers and contextual flags so reviewers can resolve without hidden logic.

## UX States
- Supported state: full worksheet with comparison table, settlement result, flags, and audit trail.
- Manual-review state: prominent review routing with blockers/warnings/assumptions and non-calculating trace output.
- Non-Vs flows remain unchanged from prior behavior.

## Known Limitations
- Parser is deterministic and pattern-based; unseen phrasing variants may require additional rules.
- Non-standard Vs constructs (walkout pots, ratchets, vs-gross hybrids) intentionally route to manual review rather than partial automation.
- Validation emphasizes unit/integration logic and build/lint checks; there is no dedicated browser automation suite in this prototype.

## What Is Deliberately Excluded
- No attempt to auto-settle non-standard Vs deals.
- No schema redesign to fully normalize all historical deal-note variants.
- No changes to non-Vs settlement algorithms beyond preservation of existing behavior.
- No workflow/state-machine redesign beyond Vs worksheet integration.

## Test Commands
- `npm run test:parser`
- `npm run test:comparison`
- `npm run test:classification`
- `npm run test:calculation`
- `npm run test:all`
- `npm run lint`
- `npm run build`
- `npm run db:reset`

## Demo Script
1. Open `/shows/show_0003/settle` (Vs deal) and show the Vs worksheet renders.
2. Walk through structured-vs-notes comparison statuses and highlight blocker/warning semantics.
3. Show supported standard Vs case calculation path and audit trail line items.
4. Show a manual-review Vs case to demonstrate non-calculating fallback and explicit blocker reasons.
5. Open a non-Vs show settlement page to confirm legacy flow remains intact.
6. Close by summarizing prototype guardrails: calculate only when safe, otherwise manual review.

## Validation Log

### 2026-05-21 — Stage 1 (Deal notes parser)
- Added deterministic `parseDealNotes` parser with explicit extraction for guarantee, percentage, basis, expense cap, hospitality cap, plus ambiguity/blocker/warning metadata.
- Added fixture-driven parser test coverage for standard, ambiguity, conflict, and non-standard term cases.
- Added `npm run test:parser` script.
- Validation results:
  - `npm run test:parser` ✅ passed (6/6 cases)
  - `npm run lint` ✅ passed with pre-existing warnings in `db/seed.ts` (unused vars)
  - `npm run build` ✅ passed after removing Google font network dependency from `app/layout.tsx`

### 2026-05-21 — Stage 2 (Structured-vs-notes comparison)
- Added `compareStructuredToNotes` comparison module with explicit field-level statuses: `match`, `mismatch`, `missing_structured`, `missing_notes`, and `ambiguous`.
- Added severity mapping by field criticality: core fields (`guaranteeAmount`, `percentage`, `percentageBasis`) escalate to blockers; cap fields map to warnings.
- Added percentage normalization to support structured percentages represented as either decimal fractions (e.g. `0.85`) or whole percent values (e.g. `85`).
- Added Stage 2 test coverage for match/mismatch/missing/ambiguous paths and cap warning behavior.
- Validation results:
  - `npm run test:comparison` ✅ passed
  - `npm run test:parser` ✅ passed (6/6 cases)
  - `npm run lint` ✅ passed with pre-existing warnings in `db/seed.ts` (unused vars)
  - `npm run build` ✅ passed

### 2026-05-21 — Stage 3 (Vs deal classification)
- Added `classifyVsDeal` classification module to route deals to `supported` vs `manual_review` with aggregated `reasons`, `blockers`, `warnings`, and `assumptions`.
- Implemented manual-review routing for non-standard terms, structured-vs-notes conflicts, and insufficient/ambiguous note data by consuming Stage 1 parser blockers and Stage 2 comparison blockers.
- Added Stage 3 coverage for supported standard scenarios, non-standard term routing, conflict routing, and insufficient-data routing.
- Added `npm run test:classification` script.
- Validation results:
  - `npm run test:classification` ✅ passed
  - `npm run test:comparison` ✅ passed
  - `npm run test:parser` ✅ passed (6/6 cases)
  - `npm run lint` ✅ passed with pre-existing warnings in `db/seed.ts` (unused vars)
  - `npm run build` ✅ passed

### 2026-05-21 — Stage 4 (Standard Vs settlement calculation)
- Added `calculateStandardVsSettlement` in `lib/vsSettlement.ts` to compute payout for supported standard Vs deals only, with explicit manual-review non-calculating fallbacks.
- Preserved existing `flat` and `percentage_of_gross` behavior by isolating Stage 4 logic in a new module and adding `canReuseLegacySettlement` helper.
- Implemented settlement math coverage for guarantee-vs-percentage winner selection, percentage normalization, expense cap handling, and negative-net floor-at-zero behavior.
- Added audit-trail output for calculation traceability and reviewer verification.
- Added `tests/vsSettlementCalculation.test.ts` and `npm run test:calculation` script for Stage 4 validation coverage.
- Validation results:
  - `npm run test:calculation` ✅ passed
  - `npm run test:classification` ✅ passed
  - `npm run test:comparison` ✅ passed
  - `npm run test:parser` ✅ passed (6/6 cases)
  - `npm run lint` ✅ passed with pre-existing warnings in `db/seed.ts` (unused vars)
  - `npm run build` ✅ passed

### 2026-05-21 — Stage 5 (UI components)
- Added standalone Vs settlement UI components under `components/settlement/`:
  - `VsSettlementWorksheet` for supported and manual-review rendering states.
  - `DealAttributeComparison` table view for structured-vs-notes field status output.
  - `SettlementFlags` section for blockers, warnings, and assumptions.
  - `SettlementAuditTrail` section for reviewer-facing calculation/manual-review trace steps.
- Added `npm run test:all` script to satisfy Stage 5 validation gate and run all existing Vs prototype test suites in sequence.
- Validation results:
  - `npm run test:all` ✅ passed
  - `npm run lint` ✅ passed with pre-existing warnings in `db/seed.ts` (unused vars)
  - `npm run build` ✅ passed

### 2026-05-21 — Stage 6 (Settlement page integration)
- Integrated a Vs-specific settlement branch into `app/shows/[id]/settle/page.tsx`.
- Added page-level Vs pipeline wiring to parse notes, compare structured-vs-notes attributes, classify support/manual-review, and compute standard Vs settlement outcomes.
- Rendered `VsSettlementWorksheet` for `dealType === "vs"` while preserving existing supported and unsupported flows for all non-Vs deal types.
- Validation results:
  - `npm run test:all` ✅ passed
  - `npm run lint` ✅ passed with pre-existing warnings in `db/seed.ts` (unused vars)
  - `npm run build` ✅ passed
  - `npm run db:reset` ✅ passed
  - `npm run dev` ✅ started successfully; manually validated `/shows/show_0003/settle` renders Vs settlement content


### 2026-05-21 — Parser robustness update (Phase A + B hardening)
- Added text normalization in `parseDealNotes` to standardize unicode dashes, canonicalize shorthand forms (`g'tee`/`gtee`, `hosp`), and collapse whitespace before extraction.
- Replaced single-pattern guarantee/cap matching with candidate-based extraction across ordered phrase variants (amount-before-label, label-before-amount, leading amount before `vs`, `expenses capped`, `expenses to`, bare `hospitality $X`, etc.).
- Added duplicate-candidate deduplication to avoid repeated evidence from overlapping regex patterns.
- Added ambiguity handling for guarantee/expense/hospitality fields when distinct numeric candidates are present.
- Added parser fixture regressions for representative real-world variants:
  - `$2,447 guarantee vs 85% ... Expenses capped $1200 ... Hospitality cap $500`
  - `7,130 g'tee vs 75% ... Expenses to 3550 ... Hospitality $600`
- Validation results:
  - `npm run test:parser` ✅ passed (8/8 cases)
  - `npm run test:all` ✅ passed
### 2026-05-21 — Stage 7 (Final documentation and demo script)
- Completed reviewer-facing documentation across problem framing, MVP scope, implementation summary, behavior notes, limitations, exclusions, and demo flow.
- Added a consolidated artifact inventory (files added/modified) and explicit command list for reproducible validation.
- Updated README with a dedicated Vs settlement prototype section linking the execution plan and prototype notes for reviewers.
- Validation results:
  - `npm run test:all` ✅ passed
  - `npm run lint` ✅ passed with pre-existing warnings in `db/seed.ts` (unused vars)
  - `npm run build` ✅ passed
