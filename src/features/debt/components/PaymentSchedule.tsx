import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useDebtStore } from "../store";
import { calculatePayoffProjection } from "../calculations";
import type { PayoffStrategy } from "../types";
import { formatCurrency } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export function PaymentSchedule() {
  const { debts, monthlyBudget } = useDebtStore();
  const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche");

  const projection = useMemo(
    () => calculatePayoffProjection(debts, monthlyBudget, strategy),
    [debts, monthlyBudget, strategy],
  );

  // Show first 12 months or until payoff
  const monthsToShow = Math.min(projection.months.length, 12);
  const visibleMonths = projection.months.slice(0, monthsToShow);

  // Current month label
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <motion.div
      className="space-y-8"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeIn} className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            Payment Plan
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Your <span className="text-gradient">schedule</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exactly what to pay, to whom, each month.
          </p>
        </div>
        <Tabs value={strategy} onValueChange={(v) => setStrategy(v as PayoffStrategy)}>
          <TabsList className="h-9 bg-card">
            <TabsTrigger value="avalanche" className="text-xs px-4">Avalanche</TabsTrigger>
            <TabsTrigger value="snowball" className="text-xs px-4">Snowball</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Summary bar */}
      <motion.div variants={fadeIn} className="card-hero rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-primary/60 uppercase tracking-widest font-semibold">Monthly budget</p>
            <p className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(monthlyBudget)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-primary/60 uppercase tracking-widest font-semibold">Debt-free in</p>
            <p className="text-2xl font-bold font-mono tabular-nums">{projection.monthsToPayoff} months</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-primary/60 uppercase tracking-widest font-semibold">Total interest</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-destructive">{formatCurrency(projection.totalInterestPaid)}</p>
          </div>
        </div>
      </motion.div>

      {/* Monthly breakdown */}
      {visibleMonths.length === 0 ? (
        <motion.div variants={fadeIn} className="card-elevated rounded-2xl py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-positive/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">You're debt free!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {visibleMonths.map((month) => {
            const [y, m] = month.date.split("-");
            const monthLabel = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            });
            const isCurrentMonth = month.date === currentMonthKey;
            const activeDebts = month.debts.filter((d) => d.payment > 0);

            return (
              <motion.div
                key={month.date}
                variants={fadeIn}
                className={`rounded-2xl overflow-hidden ${isCurrentMonth ? "card-hero" : "card-elevated"}`}
              >
                {/* Month header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/20">
                  <div className="flex items-center gap-2.5">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{monthLabel}</span>
                    {isCurrentMonth && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-0">This month</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                    <span className="text-muted-foreground">
                      Pay: <span className="text-foreground font-semibold">{formatCurrency(month.totalPayment)}</span>
                    </span>
                    {month.totalInterest > 0 && (
                      <span className="text-destructive/70">
                        Interest: {formatCurrency(month.totalInterest)}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      Remaining: <span className="text-foreground">{formatCurrency(month.totalBalance)}</span>
                    </span>
                  </div>
                </div>

                {/* Debt payments */}
                <div className="divide-y divide-border/10">
                  {activeDebts.map((debtMonth) => {
                    const debt = debts.find((d) => d.id === debtMonth.id);
                    const isExtra = debtMonth.payment > (debt?.minimum_payment ?? 0);

                    return (
                      <div key={debtMonth.id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${debtMonth.balance <= 0.01 ? "bg-positive" : "bg-primary/40"}`} />
                          <span className="text-sm">{debtMonth.name}</span>
                          {debtMonth.balance <= 0.01 && (
                            <Badge variant="outline" className="text-[10px] text-positive border-positive/30">
                              Paid off!
                            </Badge>
                          )}
                          {isExtra && debtMonth.balance > 0.01 && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                              Priority
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-xs font-mono tabular-nums">
                          <span className="text-muted-foreground w-20 text-right">
                            {formatCurrency(debtMonth.interest)} int
                          </span>
                          <span className="font-semibold w-20 text-right">
                            {formatCurrency(debtMonth.payment)}
                          </span>
                          <span className={`w-24 text-right ${debtMonth.balance <= 0.01 ? "text-positive" : "text-muted-foreground"}`}>
                            {debtMonth.balance <= 0.01 ? "£0.00" : formatCurrency(debtMonth.balance)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          {projection.months.length > monthsToShow && (
            <motion.div variants={fadeIn} className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                + {projection.months.length - monthsToShow} more months until debt-free
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
