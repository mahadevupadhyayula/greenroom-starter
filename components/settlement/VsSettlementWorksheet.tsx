import { Card, CardContent, CardDescription, CardHeader, CardTitle, Field } from "@/components/ui/card";
import { PlainBadge } from "@/components/ui/badge";
import { DealAttributeComparison } from "@/components/settlement/DealAttributeComparison";
import { SettlementAuditTrail } from "@/components/settlement/SettlementAuditTrail";
import { SettlementFlags } from "@/components/settlement/SettlementFlags";
import type { DealAttributeComparisonResult } from "@/lib/dealAttributeComparison";
import { formatMoney } from "@/lib/format";
import type { VsSettlementResult } from "@/lib/vsSettlement";
import type { VsDealClassificationResult } from "@/lib/vsDealClassification";

type VsSettlementWorksheetProps = {
  classification: VsDealClassificationResult;
  comparison: DealAttributeComparisonResult;
  settlement: VsSettlementResult;
};

export function VsSettlementWorksheet({ classification, comparison, settlement }: VsSettlementWorksheetProps) {
  const isCalculated = settlement.settlementState === "calculated";

  return (
    <div className="space-y-4">
      <Card accent={isCalculated ? "brand" : "amber"}>
        <CardHeader>
          <div>
            <CardTitle>Vs Settlement Worksheet</CardTitle>
            <CardDescription>
              {isCalculated
                ? "Automated settlement is supported for this deal."
                : "Manual review is required before payout can be finalized."}
            </CardDescription>
          </div>
          <PlainBadge variant={isCalculated ? "brand" : "amber"}>
            {isCalculated ? "Supported" : "Manual review"}
          </PlainBadge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Classification" value={classification.classification} />
          <Field label="Settlement state" value={settlement.settlementState} />
          <Field label="Payout" value={formatMoney(settlement.payout)} mono />
          {isCalculated ? (
            <Field label="Winning branch" value={settlement.winner} />
          ) : (
            <Field label="Reason" value={settlement.reason} />
          )}
        </CardContent>
      </Card>

      {isCalculated && (
        <Card>
          <CardHeader>
            <CardTitle>Calculated Terms</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Guarantee" value={formatMoney(settlement.guaranteeAmount)} mono />
            <Field label="Percentage" value={`${(settlement.percentageRate * 100).toFixed(2)}%`} mono />
            <Field label="Basis" value={settlement.percentageBasis} />
            <Field label="Percentage base" value={formatMoney(settlement.percentageBase)} mono />
            <Field label="Percentage payout" value={formatMoney(settlement.percentagePayout)} mono />
            <Field label="Final payout" value={formatMoney(settlement.payout)} mono />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Structured vs Notes Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <DealAttributeComparison comparison={comparison} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <SettlementFlags
            blockers={classification.blockers}
            warnings={classification.warnings}
            assumptions={classification.assumptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <SettlementAuditTrail steps={settlement.auditTrail} />
        </CardContent>
      </Card>
    </div>
  );
}
