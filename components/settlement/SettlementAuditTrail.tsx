type SettlementAuditTrailProps = {
  steps: string[];
};

export function SettlementAuditTrail({ steps }: SettlementAuditTrailProps) {
  if (steps.length === 0) {
    return <p className="text-xs text-ink-500">No audit trail available.</p>;
  }

  return (
    <ol className="list-decimal pl-4 space-y-1.5">
      {steps.map((step, index) => (
        <li key={`${index}-${step}`} className="text-xs text-ink-700 leading-relaxed">
          {step}
        </li>
      ))}
    </ol>
  );
}
