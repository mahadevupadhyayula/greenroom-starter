# Vs Settlement Prototype Notes

## Problem Being Solved

## MVP Scope

## Implementation Phases

## Validation Gates

## Files Added

## Files Modified

## Parser Behavior

## Structured-vs-Notes Comparison

## Classification Logic

## Settlement Calculation

## Manual Review Logic

## UX States

## Known Limitations

## What Is Deliberately Excluded

## Test Commands

## Demo Script

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
