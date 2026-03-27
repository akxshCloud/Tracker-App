import type { Goal } from "./types";
import { formatCurrency } from "@/lib/utils";

export function getProgressPercentage(goal: Goal): number {
  if (goal.target_type === "boolean") {
    return goal.current_value >= 1 ? 100 : 0;
  }
  if (goal.target_value <= 0) return 0;
  return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
}

export function getProgressLabel(goal: Goal): string {
  if (goal.target_type === "boolean") {
    return goal.current_value >= 1 ? "Done" : "Not done";
  }
  if (goal.target_type === "percentage") {
    return `${Math.round(goal.current_value)}%`;
  }
  if (goal.target_type === "currency") {
    return formatCurrency(goal.current_value);
  }
  // numeric
  const unit = goal.unit ? ` ${goal.unit}` : "";
  return `${goal.current_value}${unit}`;
}

export function getTargetLabel(goal: Goal): string {
  if (goal.target_type === "boolean") return "";
  if (goal.target_type === "percentage") return "100%";
  if (goal.target_type === "currency") return formatCurrency(goal.target_value);
  const unit = goal.unit ? ` ${goal.unit}` : "";
  return `${goal.target_value}${unit}`;
}

export function getDaysRemaining(goal: Goal): number | null {
  if (!goal.target_date) return null;
  const [y, m, d] = goal.target_date.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getCountdownLabel(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const overdue = Math.abs(daysRemaining);
    if (overdue === 1) return "1 day overdue";
    if (overdue < 90) return `${overdue} days overdue`;
    const months = Math.round(overdue / 30);
    return `${months} month${months !== 1 ? "s" : ""} overdue`;
  }
  if (daysRemaining === 0) return "Due today";
  if (daysRemaining === 1) return "1 day left";
  if (daysRemaining < 90) return `${daysRemaining} days left`;
  if (daysRemaining < 365) {
    const months = Math.round(daysRemaining / 30);
    return `${months} month${months !== 1 ? "s" : ""} left`;
  }
  const years = (daysRemaining / 365).toFixed(1);
  return `${years} years left`;
}

export function isGoalComplete(goal: Goal): boolean {
  if (goal.completed_at) return true;
  if (goal.target_type === "boolean") return goal.current_value >= 1;
  return goal.current_value >= goal.target_value;
}
