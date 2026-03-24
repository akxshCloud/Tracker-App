import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingDown, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { compareStrategies } from "../../calculations";

interface StrategyComparisonProps {
  comparison: ReturnType<typeof compareStrategies>;
}

export function StrategyComparison({ comparison }: StrategyComparisonProps) {
  const { avalanche, snowball, interestSaved } = comparison;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Strategy Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avalanche */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="font-medium">Avalanche</span>
              <Badge className="text-xs">Recommended</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pay highest interest first. Saves the most money.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Months" value={String(avalanche.monthsToPayoff)} />
            <Stat label="Total Interest" value={formatCurrency(avalanche.totalInterestPaid)} />
            <Stat label="Total Paid" value={formatCurrency(avalanche.totalPaid)} />
          </div>
        </div>

        {/* Snowball */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Snowball</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Pay smallest balance first. Quick wins for motivation.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Months" value={String(snowball.monthsToPayoff)} />
            <Stat label="Total Interest" value={formatCurrency(snowball.totalInterestPaid)} />
            <Stat label="Total Paid" value={formatCurrency(snowball.totalPaid)} />
          </div>
        </div>

        {interestSaved > 0 && (
          <>
            <Separator />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-primary">
                Avalanche saves you {formatCurrency(interestSaved)}
              </p>
              <p className="text-xs text-muted-foreground">
                in total interest compared to snowball
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold font-mono tabular-nums">{value}</p>
    </div>
  );
}
