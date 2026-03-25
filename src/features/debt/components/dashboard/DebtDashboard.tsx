import { useMemo } from "react";
import { motion } from "framer-motion";
import { useDebtStore } from "../../store";
import { getDebtSummary, compareStrategies } from "../../calculations";
import { OverviewCards } from "./OverviewCards";
import { DebtList } from "./DebtList";
import { StrategyComparison } from "./StrategyComparison";
import { PayoffChart } from "./PayoffChart";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { InsightsPanel } from "./InsightsPanel";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { AddDebtDialog } from "./AddDebtDialog";
import { UpcomingPayments } from "./UpcomingPayments";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export function DebtDashboard() {
  const { debts, monthlyBudget } = useDebtStore();

  const summary = useMemo(() => getDebtSummary(debts), [debts]);
  const comparison = useMemo(
    () => compareStrategies(debts, monthlyBudget),
    [debts, monthlyBudget],
  );

  return (
    <motion.div
      className="space-y-8"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            Debt Tracker
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Your path to <span className="text-gradient">debt-free</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <AddDebtDialog />
          <RecordPaymentDialog />
        </div>
      </motion.div>

      {/* Overview cards */}
      <motion.div variants={fadeIn}>
        <OverviewCards summary={summary} monthlyBudget={monthlyBudget} comparison={comparison} />
      </motion.div>

      {/* Upcoming payments */}
      <motion.div variants={fadeIn}>
        <UpcomingPayments />
      </motion.div>

      {/* Charts row */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        <div className="lg:col-span-3 min-h-0">
          <PayoffChart comparison={comparison} />
        </div>
        <div className="lg:col-span-2 min-h-0">
          <StrategyComparison comparison={comparison} />
        </div>
      </motion.div>

      {/* Insights row */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        <div className="lg:col-span-3 min-h-0">
          <WhatIfSimulator />
        </div>
        <div className="lg:col-span-2 min-h-0">
          <InsightsPanel />
        </div>
      </motion.div>

      {/* Debt list */}
      <motion.div variants={fadeIn}>
        <DebtList />
      </motion.div>
    </motion.div>
  );
}
