import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { Debt } from "./types";
import { formatCurrency } from "@/lib/utils";

export interface UpcomingPayment {
  debt: Debt;
  dueDate: Date;
  daysUntilDue: number;
  status: "overdue" | "due-today" | "due-soon" | "upcoming";
}

/**
 * Compare two dates by calendar day only (DST-safe).
 * Returns the number of days from `from` to `to`.
 */
function daysBetween(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export { ordinal };

/**
 * Get upcoming payments for the current month, sorted by urgency.
 */
export function getUpcomingPayments(debts: Debt[]): UpcomingPayment[] {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return debts
    .filter((d) => d.due_day !== null && d.current_balance > 0)
    .map((debt) => {
      const dueDay = debt.due_day!;

      let dueDate = new Date(currentYear, currentMonth, dueDay);

      if (dueDay < currentDay) {
        const daysPast = currentDay - dueDay;
        if (daysPast <= 7) {
          dueDate = new Date(currentYear, currentMonth, dueDay);
        } else {
          dueDate = new Date(currentYear, currentMonth + 1, dueDay);
        }
      }

      const daysUntilDue = daysBetween(now, dueDate);

      let status: UpcomingPayment["status"];
      if (daysUntilDue < 0) {
        status = "overdue";
      } else if (daysUntilDue === 0) {
        status = "due-today";
      } else if (daysUntilDue <= 3) {
        status = "due-soon";
      } else {
        status = "upcoming";
      }

      return { debt, dueDate, daysUntilDue, status };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

/**
 * Check and send native macOS notifications for upcoming/overdue payments.
 * Called once on app launch.
 */
export async function checkAndNotify(debts: Debt[]): Promise<void> {
  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  if (!granted) return;

  const upcoming = getUpcomingPayments(debts);
  const urgent = upcoming.filter((p) => p.status === "overdue" || p.status === "due-today" || p.status === "due-soon");

  if (urgent.length === 0) return;

  // Only notify once per day
  const today = new Date().toISOString().split("T")[0];
  const lastNotified = localStorage.getItem("last_notification_date");
  if (lastNotified === today) return;

  let sentCount = 0;

  for (const payment of urgent) {
    const { debt, daysUntilDue, status } = payment;

    let title: string;
    let body: string;

    if (status === "overdue") {
      title = `Overdue: ${debt.name}`;
      body = `Payment of ${formatCurrency(debt.minimum_payment)} was due ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} ago`;
    } else if (status === "due-today") {
      title = `Due today: ${debt.name}`;
      body = `${formatCurrency(debt.minimum_payment)} payment due today`;
    } else {
      title = `Payment due soon: ${debt.name}`;
      body = `${formatCurrency(debt.minimum_payment)} due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`;
    }

    try {
      await sendNotification({ title, body });
      sentCount++;
    } catch (err) {
      console.debug("Failed to send notification:", err);
    }
  }

  // Only mark as notified if at least one notification was sent
  if (sentCount > 0) {
    localStorage.setItem("last_notification_date", today);
  }
}
