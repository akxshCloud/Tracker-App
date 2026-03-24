import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, TrendingDown, Calendar } from "lucide-react";
import { useDebtStore } from "../../store";
import { compareStrategies, getDebtSummary } from "../../calculations";
import { DEBT_CATEGORIES } from "../../types";
import { formatCurrency } from "@/lib/utils";

interface ReviewStepProps {
  onBack: () => void;
}

export function ReviewStep({ onBack }: ReviewStepProps) {
  const { debts, monthlyBudget, completeOnboarding } = useDebtStore();
  const summary = getDebtSummary(debts);
  const comparison = compareStrategies(debts, monthlyBudget);

  async function handleFinish() {
    await completeOnboarding();
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Your Debt Snapshot
        </CardTitle>
        <p className="text-muted-foreground">
          Here's where you stand. Let's get this sorted.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Total Debt"
            value={formatCurrency(summary.totalDebt)}
            sublabel={`${summary.debtCount} ${summary.debtCount === 1 ? "debt" : "debts"}`}
          />
          <StatCard
            label="Monthly Budget"
            value={formatCurrency(monthlyBudget)}
            sublabel={`${formatCurrency(monthlyBudget - summary.monthlyMinimums)} extra/mo`}
          />
        </div>

        {summary.highInterestDebt > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="High Interest"
              value={formatCurrency(summary.highInterestDebt)}
              sublabel={`${formatCurrency(summary.monthlyInterestAccruing)}/mo in interest`}
              variant="destructive"
            />
            <StatCard
              label="No Interest"
              value={formatCurrency(summary.noInterestDebt)}
              sublabel="Not costing you extra"
            />
          </div>
        )}

        <Separator />

        {/* Debt list */}
        <div className="space-y-2">
          {debts.map((debt) => (
            <div key={debt.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{debt.name}</span>
                <Badge variant="outline" className="text-xs">
                  {DEBT_CATEGORIES.find((c) => c.value === debt.category)?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span>{formatCurrency(debt.current_balance)}</span>
                {debt.interest_rate > 0 && (
                  <span className="text-destructive text-xs">{debt.interest_rate}%</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Strategy comparison */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Payoff Strategy Preview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Avalanche</span>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums">
                {comparison.avalanche.monthsToPayoff} months
              </p>
              <p className="text-xs text-muted-foreground">
                Interest paid: {formatCurrency(comparison.avalanche.totalInterestPaid)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Snowball</span>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums">
                {comparison.snowball.monthsToPayoff} months
              </p>
              <p className="text-xs text-muted-foreground">
                Interest paid: {formatCurrency(comparison.snowball.totalInterestPaid)}
              </p>
            </div>
          </div>
          {comparison.interestSaved > 0 && (
            <p className="text-sm text-center text-primary">
              Avalanche saves you {formatCurrency(comparison.interestSaved)} in interest
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button size="lg" onClick={handleFinish} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  variant,
}: {
  label: string;
  value: string;
  sublabel: string;
  variant?: "destructive";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold font-mono tabular-nums ${variant === "destructive" ? "text-destructive" : ""}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}
