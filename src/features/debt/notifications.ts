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

      // Figure out the next due date
      let dueDate = new Date(currentYear, currentMonth, dueDay);

      // If the due date has passed this month, it's either overdue or next month
      if (dueDay < currentDay) {
        // Check if it's within the overdue window (past 3 days)
        const daysPast = currentDay - dueDay;
        if (daysPast <= 7) {
          // Still show as overdue this month
          dueDate = new Date(currentYear, currentMonth, dueDay);
        } else {
          // Move to next month
          dueDate = new Date(currentYear, currentMonth + 1, dueDay);
        }
      }

      const diffTime = dueDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
  // Check permission
  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  if (!granted) return;

  const upcoming = getUpcomingPayments(debts);

  // Only notify for overdue and due-today/due-soon
  const urgent = upcoming.filter((p) => p.status === "overdue" || p.status === "due-today" || p.status === "due-soon");

  if (urgent.length === 0) return;

  // Check if we already notified today (store in localStorage)
  const today = new Date().toISOString().split("T")[0];
  const lastNotified = localStorage.getItem("last_notification_date");
  if (lastNotified === today) return;

  // Send notifications
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

    sendNotification({ title, body });
  }

  localStorage.setItem("last_notification_date", today);
}
