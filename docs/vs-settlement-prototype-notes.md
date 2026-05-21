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
