import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Target, Flame, Trophy, AlertTriangle } from "lucide-react";
import { useDebtStore } from "../../store";
import { getDebtSummary, compareStrategies } from "../../calculations";
import { formatCurrency } from "@/lib/utils";

export function InsightsPanel() {
  const { debts, monthlyBudget, payments } = useDebtStore();
  const summary = useMemo(() => getDebtSummary(debts), [debts]);
  const comparison = useMemo(
    () => compareStrategies(debts, monthlyBudget),
    [debts, monthlyBudget],
  );

  const totalPaidSoFar = payments.reduce((sum, p) => sum + p.amount, 0);
  const monthsLeft = comparison.avalanche.monthsToPayoff;

  const now = new Date();
  const payoffDate = comparison.avalanche.payoffDate;
  const targetDate = payoffDate ? new Date(payoffDate + "-01") : null;
  const daysLeft = targetDate
    ? Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const milestones = [
    { threshold: 25, label: "25% done" },
    { threshold: 50, label: "Halfway" },
    { threshold: 75, label: "75% done" },
    { threshold: 100, label: "Debt free!" },
  ];

  const nextMilestone = milestones.find((m) => summary.percentPaid < m.threshold);
  const percentToNextMilestone = nextMilestone
    ? Math.min(100, (summary.percentPaid / nextMilestone.threshold) * 100)
    : 100;

  const yearlyInterestBurn = summary.monthlyInterestAccruing * 12;

  return (
    <div className="card-elevated rounded-2xl p-6 space-y-5 flex flex-col">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Insights</h3>
          <p className="text-xs text-muted-foreground">Key metrics at a glance</p>
        </div>
      </div>

      {/* Countdown */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Debt-free countdown</p>
        <div className="flex items-baseline justify-center gap-4">
          <div>
            <span className="text-3xl font-bold font-mono tabular-nums">{monthsLeft}</span>
            <span className="text-xs text-muted-foreground ml-1">mo</span>
          </div>
          <span className="text-border">·</span>
          <div>
            <span className="text-3xl font-bold font-mono tabular-nums">{daysLeft}</span>
            <span className="text-xs text-muted-foreground ml-1">days</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {/* Next milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Trophy className="h-3 w-3 text-primary" />
                {nextMilestone.label}
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {Math.round(summary.percentPaid)}%
              </span>
            </div>
            <Progress value={percentToNextMilestone} className="h-1.5 bg-white/5" />
          </div>
        )}

        <Separator className="bg-border/30" />

        {/* Stats */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total paid</span>
            <span className="font-mono tabular-nums font-semibold">{formatCurrency(totalPaidSoFar)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payments made</span>
            <span className="font-mono tabular-nums font-semibold">{payments.length}</span>
          </div>
        </div>

        {/* Warnings */}
        {summary.monthlyInterestAccruing > 0 && (
          <div className="flex items-start gap-2.5 rounded-lg bg-destructive/5 border border-destructive/10 p-3">
            <Flame className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">
                {formatCurrency(yearlyInterestBurn)}/yr in interest
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatCurrency(summary.monthlyInterestAccruing)}/mo added to your balance
              </p>
            </div>
          </div>
        )}

        {monthlyBudget < summary.monthlyMinimums && (
          <div className="flex items-start gap-2.5 rounded-lg bg-destructive/5 border border-destructive/10 p-3">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">Below minimums</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Need {formatCurrency(summary.monthlyMinimums)}/mo minimum
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
