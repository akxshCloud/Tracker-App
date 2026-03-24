import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const payoffDate = comparison.avalanche.payoffDate;
  const monthsLeft = comparison.avalanche.monthsToPayoff;

  // Calculate countdown
  const now = new Date();
  const targetDate = payoffDate ? new Date(payoffDate + "-01") : null;
  const daysLeft = targetDate
    ? Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Milestones
  const milestones = [
    { threshold: 25, label: "25% paid off", icon: "🎯" },
    { threshold: 50, label: "Halfway there", icon: "🔥" },
    { threshold: 75, label: "75% done", icon: "💪" },
    { threshold: 100, label: "Debt free!", icon: "🏆" },
  ];

  const nextMilestone = milestones.find((m) => summary.percentPaid < m.threshold);
  const percentToNextMilestone = nextMilestone
    ? ((summary.percentPaid / nextMilestone.threshold) * 100)
    : 100;

  // Monthly interest burn rate
  const yearlyInterestBurn = summary.monthlyInterestAccruing * 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Debt-free countdown */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Debt-free countdown</p>
          <div className="flex items-baseline justify-center gap-3">
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums">{monthsLeft}</span>
              <span className="text-sm text-muted-foreground ml-1">months</span>
            </div>
            <span className="text-muted-foreground">·</span>
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums">{daysLeft}</span>
              <span className="text-sm text-muted-foreground ml-1">days</span>
            </div>
          </div>
        </div>

        {/* Next milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Next milestone: {nextMilestone.label}
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {Math.round(summary.percentPaid)}%/{nextMilestone.threshold}%
              </span>
            </div>
            <Progress value={percentToNextMilestone} className="h-2" />
          </div>
        )}

        <Separator />

        {/* Key stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total paid so far</span>
            <span className="font-mono tabular-nums font-medium">
              {formatCurrency(totalPaidSoFar)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payments made</span>
            <span className="font-mono tabular-nums font-medium">
              {payments.length}
            </span>
          </div>

          {summary.monthlyInterestAccruing > 0 && (
            <>
              <Separator />
              <div className="flex items-start gap-3 text-sm">
                <Flame className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">
                    Interest is costing you {formatCurrency(yearlyInterestBurn)}/year
                  </p>
                  <p className="text-xs text-muted-foreground">
                    That's {formatCurrency(summary.monthlyInterestAccruing)} every month being added to your balance.
                    {comparison.interestSaved > 0 && (
                      <> Using avalanche saves you {formatCurrency(comparison.interestSaved)} vs snowball.</>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}

          {monthlyBudget < summary.monthlyMinimums && (
            <div className="flex items-start gap-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Budget below minimums</p>
                <p className="text-xs text-muted-foreground">
                  You need at least {formatCurrency(summary.monthlyMinimums)}/mo to cover all minimum payments.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
