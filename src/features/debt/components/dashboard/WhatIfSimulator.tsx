import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, Clock, TrendingDown, Sparkles } from "lucide-react";
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

  const monthsSaved = Math.max(0, currentProjection.avalanche.monthsToPayoff - whatIfProjection.avalanche.monthsToPayoff);
  const interestSaved = Math.max(0, Math.round(
    (currentProjection.avalanche.totalInterestPaid - whatIfProjection.avalanche.totalInterestPaid) * 100,
  ) / 100);

  const whatIfPayoffDate = whatIfProjection.avalanche.payoffDate
    ? new Date(whatIfProjection.avalanche.payoffDate + "-01").toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="card-elevated rounded-2xl p-6 space-y-5 h-full flex flex-col">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">What If?</h3>
          <p className="text-xs text-muted-foreground">See how extra payments accelerate payoff</p>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        <div className="relative">
          <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            step="25"
            min="0"
            className="pl-9 font-mono text-lg h-12 bg-background/50 border-border/50"
            placeholder="Extra per month..."
            value={extraPayment || ""}
            onChange={(e) => setExtraPayment(Math.max(0, parseFloat(e.target.value) || 0))}
          />
        </div>
        <div className="flex gap-1.5">
          {[25, 50, 100, 200, 500].map((amount) => (
            <Badge
              key={amount}
              variant={extraPayment === amount ? "default" : "outline"}
              className="cursor-pointer text-xs border-border/50 hover:border-border transition-colors"
              onClick={() => setExtraPayment(amount)}
            >
              +£{amount}
            </Badge>
          ))}
        </div>
      </div>

      {extraPayment > 0 && (
        <>
          <Separator className="bg-border/30" />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Saved</span>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums text-primary">{monthsSaved}</p>
              <p className="text-[10px] text-muted-foreground">months</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingDown className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Interest</span>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums text-positive">{formatCurrency(interestSaved)}</p>
              <p className="text-[10px] text-muted-foreground">saved</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Free by</span>
              <p className="text-lg font-bold font-mono tabular-nums">{whatIfPayoffDate}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
