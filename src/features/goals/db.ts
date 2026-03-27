import { query, execute } from "@/lib/database";
import type { Goal, GoalFormData, GoalMilestone, GoalUpdate } from "./types";

// --- Goals ---

export async function getAllGoals(): Promise<Goal[]> {
  return query<Goal>(
    "SELECT * FROM goals WHERE archived = 0 ORDER BY sort_order ASC, created_at DESC",
  );
}

export async function createGoal(data: GoalFormData): Promise<number> {
  const maxOrder = await query<{ m: number | null }>(
    "SELECT MAX(sort_order) as m FROM goals",
  );
  const nextOrder = (maxOrder[0]?.m ?? -1) + 1;

  const result = await execute(
    `INSERT INTO goals (name, description, category, icon, color, target_type, target_value, current_value, unit, target_date, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.description || null,
      data.category,
      data.icon,
      data.color,
      data.target_type,
      data.target_type === "boolean" ? 1 : data.target_value,
      0,
      data.unit || null,
      data.target_date || null,
      nextOrder,
    ],
  );
  return result.lastInsertId ?? 0;
}

export async function updateGoal(id: number, data: Partial<GoalFormData>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description || null); }
  if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
  if (data.icon !== undefined) { fields.push("icon = ?"); values.push(data.icon); }
  if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }
  if (data.target_type !== undefined) { fields.push("target_type = ?"); values.push(data.target_type); }
  if (data.target_value !== undefined) { fields.push("target_value = ?"); values.push(data.target_value); }
  if (data.unit !== undefined) { fields.push("unit = ?"); values.push(data.unit || null); }
  if (data.target_date !== undefined) { fields.push("target_date = ?"); values.push(data.target_date || null); }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await execute(`UPDATE goals SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteGoal(id: number): Promise<void> {
  await execute("DELETE FROM goal_updates WHERE goal_id = ?", [id]);
  await execute("DELETE FROM goal_milestones WHERE goal_id = ?", [id]);
  await execute("DELETE FROM goals WHERE id = ?", [id]);
}

export async function archiveGoal(id: number): Promise<void> {
  await execute(
    "UPDATE goals SET archived = 1, updated_at = datetime('now') WHERE id = ?",
    [id],
  );
}

export async function completeGoal(id: number): Promise<void> {
  await execute(
    "UPDATE goals SET completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
    [id],
  );
}

// --- Progress Updates ---

export async function updateProgress(
  goalId: number,
  newValue: number,
  notes?: string,
): Promise<void> {
  // Get current value
  const goals = await query<{ current_value: number }>(
    "SELECT current_value FROM goals WHERE id = ?",
    [goalId],
  );
  const previousValue = goals[0]?.current_value ?? 0;

  // Record the update
  await execute(
    `INSERT INTO goal_updates (goal_id, previous_value, new_value, notes) VALUES (?, ?, ?, ?)`,
    [goalId, previousValue, newValue, notes ?? null],
  );

  // Update the goal's current value
  await execute(
    "UPDATE goals SET current_value = ?, updated_at = datetime('now') WHERE id = ?",
    [newValue, goalId],
  );

  // Auto-complete milestones
  await execute(
    "UPDATE goal_milestones SET completed_at = datetime('now') WHERE goal_id = ? AND target_value <= ? AND completed_at IS NULL",
    [goalId, newValue],
  );
}

// --- Milestones ---

export async function getMilestones(goalId: number): Promise<GoalMilestone[]> {
  return query<GoalMilestone>(
    "SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY target_value ASC",
    [goalId],
  );
}

export async function addMilestone(
  goalId: number,
  name: string,
  targetValue: number,
): Promise<number> {
  const maxOrder = await query<{ m: number | null }>(
    "SELECT MAX(sort_order) as m FROM goal_milestones WHERE goal_id = ?",
    [goalId],
  );
  const nextOrder = (maxOrder[0]?.m ?? -1) + 1;

  const result = await execute(
    "INSERT INTO goal_milestones (goal_id, name, target_value, sort_order) VALUES (?, ?, ?, ?)",
    [goalId, name, targetValue, nextOrder],
  );
  return result.lastInsertId ?? 0;
}

export async function deleteMilestone(id: number): Promise<void> {
  await execute("DELETE FROM goal_milestones WHERE id = ?", [id]);
}

// --- Updates History ---

export async function getGoalUpdates(goalId: number): Promise<GoalUpdate[]> {
  return query<GoalUpdate>(
    "SELECT * FROM goal_updates WHERE goal_id = ? ORDER BY created_at DESC",
    [goalId],
  );
}

export async function getAllMilestones(): Promise<GoalMilestone[]> {
  return query<GoalMilestone>(
    "SELECT * FROM goal_milestones ORDER BY target_value ASC",
  );
}
