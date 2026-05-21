import type { DealNotesParseResult } from "@/lib/dealNotesParser";

export type ComparisonStatus = "match" | "mismatch" | "missing_structured" | "missing_notes" | "ambiguous";
export type ComparisonSeverity = "none" | "warning" | "blocker";

export type FieldComparison<T> = {
  field: "guaranteeAmount" | "percentage" | "percentageBasis" | "expenseCap" | "hospitalityCap";
  status: ComparisonStatus;
  severity: ComparisonSeverity;
  structuredValue: T | null;
  notesValue: T | null;
  reason: string;
};

export type DealAttributeComparisonResult = {
  comparisons: {
    guaranteeAmount: FieldComparison<number>;
    percentage: FieldComparison<number>;
    percentageBasis: FieldComparison<"gross" | "net">;
    expenseCap: FieldComparison<number>;
    hospitalityCap: FieldComparison<number>;
  };
  blockers: string[];
  warnings: string[];
};

export type StructuredDealAttributes = {
  guaranteeAmount: number | null;
  percentage: number | null;
  percentageBasis: "gross" | "net" | null;
  expenseCap: number | null;
  hospitalityCap: number | null;
};

function normalizePercentage(value: number | null): number | null {
  if (value === null) return null;
  if (value > 0 && value <= 1) return Number((value * 100).toFixed(4));
  return Number(value.toFixed(4));
}

function compareField<T>(input: {
  field: FieldComparison<T>["field"];
  structuredValue: T | null;
  notesValue: T | null;
  notesAmbiguous: boolean;
  coreField: boolean;
  equals: (a: T, b: T) => boolean;
}): FieldComparison<T> {
  const { field, structuredValue, notesValue, notesAmbiguous, coreField, equals } = input;

  if (notesAmbiguous) {
    return {
      field,
      status: "ambiguous",
      severity: coreField ? "blocker" : "warning",
      structuredValue,
      notesValue,
      reason: `${field} is ambiguous in notes`,
    };
  }

  if (structuredValue === null && notesValue === null) {
    return {
      field,
      status: "match",
      severity: "none",
      structuredValue,
      notesValue,
      reason: `${field} absent in both structured fields and notes`,
    };
  }

  if (structuredValue === null) {
    return {
      field,
      status: "missing_structured",
      severity: coreField ? "blocker" : "warning",
      structuredValue,
      notesValue,
      reason: `${field} present in notes but missing in structured fields`,
    };
  }

  if (notesValue === null) {
    return {
      field,
      status: "missing_notes",
      severity: coreField ? "blocker" : "warning",
      structuredValue,
      notesValue,
      reason: `${field} present in structured fields but missing in notes`,
    };
  }

  if (equals(structuredValue, notesValue)) {
    return {
      field,
      status: "match",
      severity: "none",
      structuredValue,
      notesValue,
      reason: `${field} matches`,
    };
  }

  return {
    field,
    status: "mismatch",
    severity: coreField ? "blocker" : "warning",
    structuredValue,
    notesValue,
    reason: `${field} mismatch between structured fields and notes`,
  };
}

export function compareStructuredToNotes(
  structured: StructuredDealAttributes,
  parsedNotes: DealNotesParseResult,
): DealAttributeComparisonResult {
  const normalizedStructuredPct = normalizePercentage(structured.percentage);
  const normalizedNotesPct = normalizePercentage(parsedNotes.percentage.value);

  const comparisons = {
    guaranteeAmount: compareField<number>({
      field: "guaranteeAmount",
      structuredValue: structured.guaranteeAmount,
      notesValue: parsedNotes.guarantee.value,
      notesAmbiguous: parsedNotes.guarantee.ambiguous,
      coreField: true,
      equals: (a, b) => a === b,
    }),
    percentage: compareField<number>({
      field: "percentage",
      structuredValue: normalizedStructuredPct,
      notesValue: normalizedNotesPct,
      notesAmbiguous: parsedNotes.percentage.ambiguous,
      coreField: true,
      equals: (a, b) => a === b,
    }),
    percentageBasis: compareField<"gross" | "net">({
      field: "percentageBasis",
      structuredValue: structured.percentageBasis,
      notesValue: parsedNotes.percentageBasis.value,
      notesAmbiguous: parsedNotes.percentageBasis.ambiguous,
      coreField: true,
      equals: (a, b) => a === b,
    }),
    expenseCap: compareField<number>({
      field: "expenseCap",
      structuredValue: structured.expenseCap,
      notesValue: parsedNotes.expenseCap.value,
      notesAmbiguous: parsedNotes.expenseCap.ambiguous,
      coreField: false,
      equals: (a, b) => a === b,
    }),
    hospitalityCap: compareField<number>({
      field: "hospitalityCap",
      structuredValue: structured.hospitalityCap,
      notesValue: parsedNotes.hospitalityCap.value,
      notesAmbiguous: parsedNotes.hospitalityCap.ambiguous,
      coreField: false,
      equals: (a, b) => a === b,
    }),
  };

  const allComparisons = Object.values(comparisons);
  const blockers = allComparisons.filter((c) => c.severity === "blocker").map((c) => c.reason);
  const warnings = allComparisons.filter((c) => c.severity === "warning").map((c) => c.reason);

  return { comparisons, blockers, warnings };
}
