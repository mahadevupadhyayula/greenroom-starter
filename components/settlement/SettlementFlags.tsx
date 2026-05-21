import { PlainBadge } from "@/components/ui/badge";

type SettlementFlagsProps = {
  blockers: string[];
  warnings: string[];
  assumptions: string[];
};

function FlagList({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "rose" | "amber" | "sky";
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-ink-800">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={`${title}-${item}`} className="flex items-start gap-2">
            <PlainBadge variant={variant} className="mt-0.5 shrink-0">
              {title.slice(0, -1)}
            </PlainBadge>
            <span className="text-xs text-ink-700 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SettlementFlags({ blockers, warnings, assumptions }: SettlementFlagsProps) {
  if (blockers.length === 0 && warnings.length === 0 && assumptions.length === 0) {
    return <p className="text-xs text-ink-500">No blockers, warnings, or assumptions.</p>;
  }

  return (
    <div className="space-y-4">
      <FlagList title="Blockers" items={blockers} variant="rose" />
      <FlagList title="Warnings" items={warnings} variant="amber" />
      <FlagList title="Assumptions" items={assumptions} variant="sky" />
    </div>
  );
}
