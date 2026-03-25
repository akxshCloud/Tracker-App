import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Clock, TrendingDown, Sparkles, Calendar } from "lucide-react";
import { useDebtStore } from "../../store";
import { compareStrategies } from "../../calculations";
import { formatCurrency } from "@/lib/utils";

const MAX_EXTRA = 500;
const STEP = 10;

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
    ? new Date(whatIfProjection.avalanche.payoffDate + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "—";

  const hasExtra = extraPayment > 0;

  return (
    <div className="card-elevated rounded-2xl p-6 h-full flex flex-col justify-between gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">What If?</h3>
          <p className="text-xs text-muted-foreground">Drag to see the impact</p>
        </div>
      </div>

      {/* Slider section */}
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Extra per month
          </p>
          <motion.p
            className={`text-3xl font-bold font-mono tabular-nums ${hasExtra ? "text-primary" : "text-muted-foreground/40"}`}
            key={extraPayment}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {hasExtra ? `+${formatCurrency(extraPayment)}` : "£0"}
          </motion.p>
        </div>

        <Slider
          value={[extraPayment]}
          onValueChange={([v]) => setExtraPayment(v)}
          max={MAX_EXTRA}
          step={STEP}
          className="py-2"
        />

        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>£0</span>
          <span>£{MAX_EXTRA}</span>
        </div>
      </div>

      {/* Results — always visible */}
      <div className="rounded-xl bg-background/40 border border-border/30 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            icon={<Clock className="h-3 w-3" />}
            label={hasExtra ? "Saved" : "Left"}
            value={hasExtra ? String(monthsSaved) : String(currentProjection.avalanche.monthsToPayoff)}
            sub={hasExtra ? "months faster" : "months"}
            color={hasExtra ? "text-primary" : "text-foreground"}
          />
          <Stat
            icon={<TrendingDown className="h-3 w-3" />}
            label={hasExtra ? "Saved" : "Interest"}
            value={hasExtra ? formatCurrency(interestSaved) : formatCurrency(currentProjection.avalanche.totalInterestPaid)}
            sub={hasExtra ? "in interest" : "total cost"}
            color={hasExtra ? "text-positive" : "text-destructive"}
          />
          <Stat
            icon={<Calendar className="h-3 w-3" />}
            label="Free by"
            value={whatIfPayoffDate}
            sub={hasExtra ? `+${formatCurrency(extraPayment)}/mo` : "current pace"}
            color="text-foreground"
          />
        </div>
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
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[9px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className={`text-lg font-bold font-mono tabular-nums ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{sub}</p>
    </div>
  );
}
