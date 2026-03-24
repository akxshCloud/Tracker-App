import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, Wallet, Calendar, Flame } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { getDebtSummary, compareStrategies } from "../../calculations";

interface OverviewCardsProps {
  summary: ReturnType<typeof getDebtSummary>;
  monthlyBudget: number;
  comparison: ReturnType<typeof compareStrategies>;
}

export function OverviewCards({ summary, monthlyBudget, comparison }: OverviewCardsProps) {
  const payoffDate = comparison.avalanche.payoffDate;
  const payoffDateFormatted = payoffDate
    ? new Date(payoffDate + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "N/A";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Debt</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums">
            {formatCurrency(summary.totalDebt)}
          </p>
          <Progress value={summary.percentPaid} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {summary.percentPaid}% paid off
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium uppercase tracking-wider">Interest / Month</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-destructive">
            {formatCurrency(summary.monthlyInterestAccruing)}
          </p>
          <p className="text-xs text-muted-foreground">
            Being added to your balance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider">Monthly Budget</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums">
            {formatCurrency(monthlyBudget)}
          </p>
          <p className={`text-xs ${monthlyBudget < summary.monthlyMinimums ? "text-destructive" : "text-muted-foreground"}`}>
            {monthlyBudget >= summary.monthlyMinimums
              ? `${formatCurrency(monthlyBudget - summary.monthlyMinimums)} extra / mo`
              : `${formatCurrency(summary.monthlyMinimums - monthlyBudget)} short of minimums`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Debt-Free By</span>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums">
            {payoffDateFormatted}
          </p>
          <p className="text-xs text-muted-foreground">
            {comparison.avalanche.monthsToPayoff} months (avalanche)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
