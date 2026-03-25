import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useDebtStore } from "../../store";
import { getUpcomingPayments, ordinal, type UpcomingPayment } from "../../notifications";
import { formatCurrency } from "@/lib/utils";

export function UpcomingPayments() {
  const { debts } = useDebtStore();

  const upcoming = useMemo(() => getUpcomingPayments(debts), [debts]);

  const hasDebtsWithoutDueDay = debts.some((d) => d.due_day === null && d.current_balance > 0);

  if (upcoming.length === 0) {
    if (!hasDebtsWithoutDueDay) return null;
    return (
      <div className="card-elevated rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Upcoming Payments</h3>
            <p className="text-xs text-muted-foreground">
              Add a due day to your debts to see payment reminders here
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasUrgent = upcoming.some((p) => p.status === "overdue" || p.status === "due-today" || p.status === "due-soon");

  return (
    <div className={`rounded-2xl p-5 space-y-4 ${hasUrgent ? "card-hero" : "card-elevated"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Upcoming Payments</h3>
            <p className="text-xs text-muted-foreground">This month's schedule</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {upcoming.map((payment) => (
          <PaymentRow key={payment.debt.id} payment={payment} />
        ))}
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: UpcomingPayment }) {
  const { debt, daysUntilDue, status } = payment;

  const statusConfig = {
    overdue: {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      badge: "Overdue",
      badgeClass: "bg-destructive/15 text-destructive border-destructive/20",
      dotClass: "bg-destructive",
      timeText: `${Math.abs(daysUntilDue)}d overdue`,
      timeClass: "text-destructive",
    },
    "due-today": {
      icon: <Clock className="h-3.5 w-3.5" />,
      badge: "Today",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      dotClass: "bg-amber-400",
      timeText: "Due today",
      timeClass: "text-amber-400",
    },
    "due-soon": {
      icon: <Clock className="h-3.5 w-3.5" />,
      badge: `${daysUntilDue}d`,
      badgeClass: "bg-primary/10 text-primary border-primary/20",
      dotClass: "bg-primary",
      timeText: `in ${daysUntilDue} days`,
      timeClass: "text-primary",
    },
    upcoming: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      badge: `${daysUntilDue}d`,
      badgeClass: "bg-muted text-muted-foreground border-border/30",
      dotClass: "bg-muted-foreground/30",
      timeText: `in ${daysUntilDue} days`,
      timeClass: "text-muted-foreground",
    },
  };

  const config = statusConfig[status];
  const dueDay = debt.due_day!;
  const ordSuffix = ordinal(dueDay);

  return (
    <div className="flex items-center justify-between rounded-xl bg-background/30 border border-border/20 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${config.dotClass}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{debt.name}</span>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${config.badgeClass}`}>
              {config.badge}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Due {dueDay}{ordSuffix} · <span className={config.timeClass}>{config.timeText}</span>
          </p>
        </div>
      </div>
      <span className="font-mono tabular-nums font-semibold text-sm">
        {formatCurrency(debt.minimum_payment)}
      </span>
    </div>
  );
}