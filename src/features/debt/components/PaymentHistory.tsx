import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { useDebtStore } from "../store";
import { formatCurrency, formatDate } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export function PaymentHistory() {
  const { payments, debts } = useDebtStore();

  const enrichedPayments = useMemo(() => {
    return payments.map((p) => ({
      ...p,
      debtName: debts.find((d) => d.id === p.debt_id)?.name ?? "Deleted debt",
    }));
  }, [payments, debts]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof enrichedPayments>();
    for (const payment of enrichedPayments) {
      const monthKey = payment.payment_date.slice(0, 7);
      const existing = groups.get(monthKey) ?? [];
      existing.push(payment);
      groups.set(monthKey, existing);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [enrichedPayments]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <motion.div
      className="space-y-8"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeIn}>
        <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          Payments
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          Payment <span className="text-gradient">History</span>
        </h1>
      </motion.div>

      {/* Summary */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 gap-4">
        <div className="card-hero rounded-2xl p-6 space-y-1">
          <p className="text-[10px] text-primary/60 uppercase tracking-widest font-semibold">Total Paid</p>
          <p className="text-3xl font-bold font-mono tabular-nums">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card-elevated rounded-2xl p-6 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Payments Made</p>
          <p className="text-3xl font-bold font-mono tabular-nums">{payments.length}</p>
        </div>
      </motion.div>

      {/* Payment list */}
      {grouped.length === 0 ? (
        <motion.div variants={fadeIn} className="card-elevated rounded-2xl py-16 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No payments yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Record your first payment from the Debt Dashboard.
          </p>
        </motion.div>
      ) : (
        grouped.map(([monthKey, monthPayments]) => {
          const [year, month] = monthKey.split("-");
          const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          });
          const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);

          return (
            <motion.div key={monthKey} variants={fadeIn} className="card-elevated rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                <span className="text-sm font-semibold">{monthLabel}</span>
                <span className="text-sm font-mono tabular-nums text-muted-foreground">
                  {formatCurrency(monthTotal)}
                </span>
              </div>
              <div className="divide-y divide-border/20">
                {monthPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{payment.debtName}</span>
                        {payment.notes && (
                          <Badge variant="outline" className="text-[10px] border-border/30">
                            {payment.notes}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-sm text-positive">
                      -{formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
}
