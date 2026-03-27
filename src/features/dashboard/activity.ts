import { query } from "@/lib/database";

export interface ActivityItem {
  type: "habit" | "payment" | "goal";
  description: string;
  timestamp: string;
  color: string;
}

interface HabitCompletionRow {
  habit_name: string;
  habit_color: string;
  created_at: string;
}

interface PaymentRow {
  debt_name: string;
  amount: number;
  created_at: string;
}

interface GoalUpdateRow {
  goal_name: string;
  goal_color: string;
  previous_value: number;
  new_value: number;
  target_type: string;
  unit: string | null;
  created_at: string;
}

function formatValue(value: number, targetType: string, unit: string | null): string {
  if (targetType === "currency") {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
  }
  if (targetType === "percentage") return `${Math.round(value)}%`;
  const u = unit ? ` ${unit}` : "";
  return `${value}${u}`;
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const [completions, payments, goalUpdates] = await Promise.all([
    query<HabitCompletionRow>(
      `SELECT h.name as habit_name, h.color as habit_color, hc.created_at
       FROM habit_completions hc
       JOIN habits h ON h.id = hc.habit_id
       ORDER BY hc.created_at DESC LIMIT ?`,
      [limit],
    ),
    query<PaymentRow>(
      `SELECT d.name as debt_name, p.amount, p.created_at
       FROM payments p
       JOIN debts d ON d.id = p.debt_id
       ORDER BY p.created_at DESC LIMIT ?`,
      [limit],
    ),
    query<GoalUpdateRow>(
      `SELECT g.name as goal_name, g.color as goal_color, g.target_type, g.unit,
              gu.previous_value, gu.new_value, gu.created_at
       FROM goal_updates gu
       JOIN goals g ON g.id = gu.goal_id
       ORDER BY gu.created_at DESC LIMIT ?`,
      [limit],
    ),
  ]);

  const items: ActivityItem[] = [
    ...completions.map((c) => ({
      type: "habit" as const,
      description: `Completed "${c.habit_name}"`,
      timestamp: c.created_at,
      color: c.habit_color,
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      description: `Paid ${new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p.amount)} to ${p.debt_name}`,
      timestamp: p.created_at,
      color: "blue",
    })),
    ...goalUpdates.map((g) => ({
      type: "goal" as const,
      description: `Updated "${g.goal_name}": ${formatValue(g.previous_value, g.target_type, g.unit)} → ${formatValue(g.new_value, g.target_type, g.unit)}`,
      timestamp: g.created_at,
      color: g.goal_color,
    })),
  ];

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, limit);
}
