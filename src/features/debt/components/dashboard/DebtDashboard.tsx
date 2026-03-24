import { useMemo } from "react";
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
import { EditBudgetDialog } from "./EditBudgetDialog";

export function DebtDashboard() {
  const { debts, monthlyBudget } = useDebtStore();

  const summary = useMemo(() => getDebtSummary(debts), [debts]);
  const comparison = useMemo(
    () => compareStrategies(debts, monthlyBudget),
    [debts, monthlyBudget],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debt Dashboard</h1>
          <p className="text-muted-foreground">
            Your path to being debt-free.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EditBudgetDialog />
          <AddDebtDialog />
          <RecordPaymentDialog />
        </div>
      </div>

      <OverviewCards summary={summary} monthlyBudget={monthlyBudget} comparison={comparison} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PayoffChart comparison={comparison} />
        <StrategyComparison comparison={comparison} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhatIfSimulator />
        <InsightsPanel />
      </div>

      <DebtList />
    </div>
  );
}
