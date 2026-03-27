import { query, execute } from "@/lib/database";
import type { Habit, HabitFormData, HabitCompletion } from "./types";

// --- Habits ---

export async function getAllHabits(): Promise<Habit[]> {
  return query<Habit>(
    "SELECT * FROM habits WHERE archived = 0 ORDER BY sort_order ASC, created_at ASC",
  );
}

export async function createHabit(data: HabitFormData): Promise<number> {
  const maxOrder = await query<{ m: number | null }>(
    "SELECT MAX(sort_order) as m FROM habits",
  );
  const nextOrder = (maxOrder[0]?.m ?? -1) + 1;

  const result = await execute(
    `INSERT INTO habits (name, description, icon, color, frequency_type, frequency_value, category, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.description || null,
      data.icon,
      data.color,
      data.frequency_type,
      data.frequency_value,
      data.category,
      nextOrder,
    ],
  );
  return result.lastInsertId ?? 0;
}

export async function updateHabit(id: number, data: Partial<HabitFormData>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description || null); }
  if (data.icon !== undefined) { fields.push("icon = ?"); values.push(data.icon); }
  if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }
  if (data.frequency_type !== undefined) { fields.push("frequency_type = ?"); values.push(data.frequency_type); }
  if (data.frequency_value !== undefined) { fields.push("frequency_value = ?"); values.push(data.frequency_value); }
  if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await execute(`UPDATE habits SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteHabit(id: number): Promise<void> {
  await execute("DELETE FROM habit_completions WHERE habit_id = ?", [id]);
  await execute("DELETE FROM habits WHERE id = ?", [id]);
}

export async function archiveHabit(id: number): Promise<void> {
  await execute(
    "UPDATE habits SET archived = 1, updated_at = datetime('now') WHERE id = ?",
    [id],
  );
}

// --- Completions ---

export async function getCompletionsForRange(
  from: string,
  to: string,
): Promise<HabitCompletion[]> {
  return query<HabitCompletion>(
    "SELECT * FROM habit_completions WHERE completed_date >= ? AND completed_date <= ? ORDER BY completed_date ASC",
    [from, to],
  );
}

export async function toggleCompletion(
  habitId: number,
  date: string,
): Promise<boolean> {
  // Check if already completed
  const existing = await query<{ id: number }>(
    "SELECT id FROM habit_completions WHERE habit_id = ? AND completed_date = ?",
    [habitId, date],
  );

  if (existing.length > 0) {
    // Remove completion
    await execute(
      "DELETE FROM habit_completions WHERE habit_id = ? AND completed_date = ?",
      [habitId, date],
    );
    return false; // now uncompleted
  } else {
    // Add completion
    await execute(
      "INSERT INTO habit_completions (habit_id, completed_date) VALUES (?, ?)",
      [habitId, date],
    );
    return true; // now completed
  }
}

export async function getCompletionsForHabit(
  habitId: number,
  from: string,
  to: string,
): Promise<string[]> {
  const results = await query<{ completed_date: string }>(
    "SELECT completed_date FROM habit_completions WHERE habit_id = ? AND completed_date >= ? AND completed_date <= ?",
    [habitId, from, to],
  );
  return results.map((r) => r.completed_date);
}
