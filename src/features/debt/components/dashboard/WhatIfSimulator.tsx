import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PoundSterling, Clock, TrendingDown, Sparkles, Calendar } from "lucide-react";
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

  const currentPayoffDate = currentProjection.avalanche.payoffDate
    ? new Date(currentProjection.avalanche.payoffDate + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "—";

  const whatIfPayoffDate = whatIfProjection.avalanche.payoffDate
    ? new Date(whatIfProjection.avalanche.payoffDate + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "—";

  const hasExtra = extraPayment > 0;
  const amounts = [25, 50, 100, 200, 500];

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

      {/* Input + quick select */}
      <div className="space-y-3">
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
          {amounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setExtraPayment(extraPayment === amount ? 0 : amount)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                extraPayment === amount
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-background/50 text-muted-foreground border border-border/50 hover:border-border hover:text-foreground"
              }`}
            >
              +£{amount}
            </button>
          ))}
        </div>
      </div>

      {/* Results — always visible, shows current baseline or what-if impact */}
      <div className="mt-auto">
        <Separator className="bg-border/30 mb-5" />
        <AnimatePresence mode="wait">
          <motion.div
            key={hasExtra ? "whatif" : "baseline"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-3 gap-4"
          >
            {hasExtra ? (
              <>
                <Stat
                  icon={<Clock className="h-3 w-3" />}
                  label="Saved"
                  value={String(monthsSaved)}
                  sub="months"
                  color="text-primary"
                />
                <Stat
                  icon={<TrendingDown className="h-3 w-3" />}
                  label="Interest"
                  value={formatCurrency(interestSaved)}
                  sub="saved"
                  color="text-positive"
                />
                <Stat
                  icon={<Calendar className="h-3 w-3" />}
                  label="Free by"
                  value={whatIfPayoffDate}
                  sub={`was ${currentPayoffDate}`}
                  color="text-foreground"
                />
              </>
            ) : (
              <>
                <Stat
                  icon={<Clock className="h-3 w-3" />}
                  label="Current"
                  value={String(currentProjection.avalanche.monthsToPayoff)}
                  sub="months left"
                  color="text-foreground"
                />
                <Stat
                  icon={<TrendingDown className="h-3 w-3" />}
                  label="Interest"
                  value={formatCurrency(currentProjection.avalanche.totalInterestPaid)}
                  sub="total cost"
                  color="text-destructive"
                />
                <Stat
                  icon={<Calendar className="h-3 w-3" />}
                  label="Free by"
                  value={currentPayoffDate}
                  sub="current pace"
                  color="text-foreground"
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {hasExtra && (
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            {formatCurrency(monthlyBudget)} → {formatCurrency(monthlyBudget + extraPayment)}/mo
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className={`text-xl font-bold font-mono tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
