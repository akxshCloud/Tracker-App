import { TrendingDown, Zap, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { compareStrategies } from "../../calculations";

interface StrategyComparisonProps {
  comparison: ReturnType<typeof compareStrategies>;
}

export function StrategyComparison({ comparison }: StrategyComparisonProps) {
  const { avalanche, snowball, interestSaved } = comparison;

  return (
    <div className="card-elevated rounded-2xl p-6 space-y-5 h-full flex flex-col">
      <div>
        <h3 className="text-sm font-semibold">Strategy Comparison</h3>
        <p className="text-xs text-muted-foreground">Avalanche vs Snowball</p>
      </div>

      <div className="flex-1 space-y-4">
        {/* Avalanche */}
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <TrendingDown className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold">Avalanche</span>
                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Best
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Months</p>
              <p className="text-lg font-bold font-mono tabular-nums">{avalanche.monthsToPayoff}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interest</p>
              <p className="text-lg font-bold font-mono tabular-nums">{formatCurrency(avalanche.totalInterestPaid)}</p>
            </div>
          </div>
        </div>

        {/* Snowball */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold">Snowball</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Months</p>
              <p className="text-lg font-bold font-mono tabular-nums">{snowball.monthsToPayoff}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interest</p>
              <p className="text-lg font-bold font-mono tabular-nums">{formatCurrency(snowball.totalInterestPaid)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Savings callout */}
      {interestSaved > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-positive/5 border border-positive/15 py-2.5 px-4">
          <ArrowDown className="h-3.5 w-3.5 text-positive" />
          <span className="text-xs font-semibold text-positive">
            Avalanche saves {formatCurrency(interestSaved)}
          </span>
        </div>
      )}
    </div>
  );
}
