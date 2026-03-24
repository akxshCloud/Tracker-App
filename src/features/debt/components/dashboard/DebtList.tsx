import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDebtStore } from "../../store";
import { DEBT_CATEGORIES } from "../../types";
import { formatCurrency } from "@/lib/utils";

export function DebtList() {
  const { debts } = useDebtStore();

  if (debts.length === 0) return null;

  return (
    <div className="card-elevated rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Your Debts</h3>
        <p className="text-xs text-muted-foreground">{debts.length} active {debts.length === 1 ? "debt" : "debts"}</p>
      </div>

      <div className="space-y-3">
        {debts.map((debt) => {
          const percentPaid = debt.original_balance > 0
            ? ((debt.original_balance - debt.current_balance) / debt.original_balance) * 100
            : 0;

          return (
            <div
              key={debt.id}
              className="rounded-xl bg-background/50 border border-border/50 p-4 space-y-3 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{debt.name}</span>
                    <Badge variant="outline" className="text-[10px] font-medium border-border/50">
                      {DEBT_CATEGORIES.find((c) => c.value === debt.category)?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {debt.interest_rate > 0 && (
                      <span className="text-destructive font-medium">{debt.interest_rate}% APR</span>
                    )}
                    {debt.interest_rate === 0 && (
                      <span className="text-positive font-medium">0% interest</span>
                    )}
                    {debt.minimum_payment > 0 && (
                      <span>Min: {formatCurrency(debt.minimum_payment)}/mo</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono tabular-nums font-bold text-sm">
                    {formatCurrency(debt.current_balance)}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                    of {formatCurrency(debt.original_balance)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={percentPaid} className="h-1.5 flex-1 bg-white/5" />
                <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-10 text-right">
                  {Math.round(percentPaid)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
