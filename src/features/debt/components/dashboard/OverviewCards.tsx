import { Progress } from "@/components/ui/progress";
import { TrendingDown, Wallet, Calendar, Flame } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EditBudgetDialog } from "./EditBudgetDialog";
import type { getDebtSummary, compareStrategies } from "../../calculations";

interface OverviewCardsProps {
  summary: ReturnType<typeof getDebtSummary>;
  monthlyBudget: number;
  comparison: ReturnType<typeof compareStrategies>;
}

export function OverviewCards({ summary, monthlyBudget, comparison }: OverviewCardsProps) {
  const payoffDate = comparison.avalanche.payoffDate;
  const payoffDateFormatted = payoffDate
    ? new Date(payoffDate + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Hero — Total Debt */}
      <div className="col-span-2 card-hero rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2 text-primary/70">
          <Wallet className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Total Remaining</span>
        </div>
        <p className="text-5xl font-bold font-mono tabular-nums tracking-tight">
          {formatCurrency(summary.totalDebt)}
        </p>
        <div className="space-y-2">
          <Progress value={summary.percentPaid} className="h-1.5 bg-white/5" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{summary.percentPaid}% paid off</span>
            <span className="text-muted-foreground">
              {formatCurrency(summary.totalPaid)} of {formatCurrency(summary.totalOriginal)}
            </span>
          </div>
        </div>
      </div>

      {/* Right column — stacked stats */}
      <div className="col-span-2 grid grid-rows-2 gap-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Interest burn */}
          <div className="card-elevated rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-destructive/70" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Interest / mo</span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-destructive">
              {formatCurrency(summary.monthlyInterestAccruing)}
            </p>
          </div>

          {/* Debt-free date */}
          <div className="card-elevated rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Debt-free</span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums">
              {payoffDateFormatted}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {comparison.avalanche.monthsToPayoff} months
            </p>
          </div>
        </div>

        {/* Monthly budget */}
        <div className="card-elevated rounded-xl p-4 space-y-1.5 group relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-primary/70" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Monthly budget</span>
            </div>
            <EditBudgetDialog />
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-xl font-bold font-mono tabular-nums">
              {formatCurrency(monthlyBudget)}
            </p>
            <p className={`text-xs font-mono tabular-nums ${monthlyBudget < summary.monthlyMinimums ? "text-destructive" : "text-positive"}`}>
              {monthlyBudget >= summary.monthlyMinimums
                ? `+${formatCurrency(monthlyBudget - summary.monthlyMinimums)} extra`
                : `${formatCurrency(summary.monthlyMinimums - monthlyBudget)} short`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
