import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, TrendingDown, Clock, PiggyBank } from "lucide-react";
import { useDebtStore } from "../../store";
import { compareStrategies } from "../../calculations";
import { formatCurrency } from "@/lib/utils";

export function WhatIfSimulator() {
  const { debts, monthlyBudget } = useDebtStore();
  const [extraPayment, setExtraPayment] = useState(0);

  const currentProjection = useMemo(
    () => compareStrategies(debts, monthlyBudget),
    [debts, monthlyBudget],
  );

  const whatIfProjection = useMemo(
    () => compareStrategies(debts, monthlyBudget + extraPayment),
    [debts, monthlyBudget, extraPayment],
  );

  const monthsSaved = currentProjection.avalanche.monthsToPayoff - whatIfProjection.avalanche.monthsToPayoff;
  const interestSaved = Math.round(
    (currentProjection.avalanche.totalInterestPaid - whatIfProjection.avalanche.totalInterestPaid) * 100,
  ) / 100;

  const whatIfPayoffDate = whatIfProjection.avalanche.payoffDate
    ? new Date(whatIfProjection.avalanche.payoffDate + "-01").toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "N/A";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          What If?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="extra">What if I paid this much extra per month?</Label>
          <div className="relative">
            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="extra"
              type="number"
              step="25"
              min="0"
              className="pl-9 font-mono text-lg h-12"
              placeholder="0"
              value={extraPayment || ""}
              onChange={(e) => setExtraPayment(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            {[25, 50, 100, 200].map((amount) => (
              <Badge
                key={amount}
                variant={extraPayment === amount ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setExtraPayment(amount)}
              >
                +£{amount}
              </Badge>
            ))}
          </div>
        </div>

        {extraPayment > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">Months saved</span>
                </div>
                <p className="text-xl font-bold font-mono tabular-nums text-primary">
                  {monthsSaved}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span className="text-xs">Interest saved</span>
                </div>
                <p className="text-xl font-bold font-mono tabular-nums text-primary">
                  {formatCurrency(interestSaved)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-xs">New debt-free date</span>
                </div>
                <p className="text-sm font-bold font-mono tabular-nums">
                  {whatIfPayoffDate}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              New total budget: {formatCurrency(monthlyBudget + extraPayment)}/mo
              (currently {formatCurrency(monthlyBudget)}/mo)
            </p>
          </>
        )}

        {extraPayment === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Enter an amount above to see how extra payments accelerate your payoff.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
