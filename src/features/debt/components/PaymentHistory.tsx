import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Receipt } from "lucide-react";
import { useDebtStore } from "../store";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PaymentHistory() {
  const { payments, debts } = useDebtStore();

  const enrichedPayments = useMemo(() => {
    return payments.map((p) => ({
      ...p,
      debtName: debts.find((d) => d.id === p.debt_id)?.name ?? "Deleted debt",
    }));
  }, [payments, debts]);

  // Group by month
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof enrichedPayments>();
    for (const payment of enrichedPayments) {
      const monthKey = payment.payment_date.slice(0, 7); // YYYY-MM
      const existing = groups.get(monthKey) ?? [];
      existing.push(payment);
      groups.set(monthKey, existing);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [enrichedPayments]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <History className="h-8 w-8" />
          Payment History
        </h1>
        <p className="text-muted-foreground">
          Every payment you've made, all in one place.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</p>
            <p className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Payments Made</p>
            <p className="text-2xl font-bold font-mono tabular-nums">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment list */}
      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No payments recorded yet.</p>
            <p className="text-sm text-muted-foreground">
              Use the "Record Payment" button on the Debt Dashboard to log payments.
            </p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([monthKey, monthPayments]) => {
          const [year, month] = monthKey.split("-");
          const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          });
          const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);

          return (
            <Card key={monthKey}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{monthLabel}</CardTitle>
                  <span className="text-sm font-mono tabular-nums text-muted-foreground">
                    {formatCurrency(monthTotal)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{payment.debtName}</span>
                          {payment.notes && (
                            <Badge variant="outline" className="text-xs">
                              {payment.notes}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-primary">
                        -{formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
