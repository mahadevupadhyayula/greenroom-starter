import type { DealAttributeComparisonResult, FieldComparison } from "@/lib/dealAttributeComparison";
import { formatMoney } from "@/lib/format";

type DealAttributeComparisonProps = {
  comparison: DealAttributeComparisonResult;
};

function formatFieldValue(field: FieldComparison<unknown>["field"], value: unknown): string {
  if (value == null) return "—";
  if (field === "guaranteeAmount" || field === "expenseCap" || field === "hospitalityCap") {
    return formatMoney(value as number);
  }
  if (field === "percentage") {
    return `${value}%`;
  }
  return String(value);
}

function statusTone(status: FieldComparison<unknown>["status"]): string {
  switch (status) {
    case "match":
      return "text-brand-700";
    case "mismatch":
    case "ambiguous":
      return "text-rose-700";
    default:
      return "text-amber-700";
  }
}

export function DealAttributeComparison({ comparison }: DealAttributeComparisonProps) {
  const fields = Object.values(comparison.comparisons);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left border-b border-ink-100 text-ink-500">
            <th className="py-2 pr-3">Field</th>
            <th className="py-2 pr-3">Structured</th>
            <th className="py-2 pr-3">Notes</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2">Reason</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.field} className="border-b border-ink-100/70 align-top">
              <td className="py-2 pr-3 font-medium text-ink-800">{field.field}</td>
              <td className="py-2 pr-3 text-ink-700">{formatFieldValue(field.field, field.structuredValue)}</td>
              <td className="py-2 pr-3 text-ink-700">{formatFieldValue(field.field, field.notesValue)}</td>
              <td className={`py-2 pr-3 font-medium ${statusTone(field.status)}`}>{field.status}</td>
              <td className="py-2 text-ink-600">{field.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
