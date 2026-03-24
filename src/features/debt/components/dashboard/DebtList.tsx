import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDebtStore } from "../../store";
import { DEBT_CATEGORIES } from "../../types";
import { formatCurrency } from "@/lib/utils";

export function DebtList() {
  const { debts } = useDebtStore();

  if (debts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Debts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {debts.map((debt) => {
            const percentPaid = debt.original_balance > 0
              ? ((debt.original_balance - debt.current_balance) / debt.original_balance) * 100
              : 0;

            return (
              <div key={debt.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{debt.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {DEBT_CATEGORIES.find((c) => c.value === debt.category)?.label}
                    </Badge>
                    {debt.interest_rate > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {debt.interest_rate}% APR
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono tabular-nums font-semibold">
                      {formatCurrency(debt.current_balance)}
                    </p>
                    {debt.minimum_payment > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Min: {formatCurrency(debt.minimum_payment)}/mo
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={percentPaid} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground font-mono tabular-nums w-12 text-right">
                    {Math.round(percentPaid)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
