import { query, execute } from "@/lib/database";
import type { Debt, DebtFormData, Payment } from "./types";

// --- Debts ---

export async function getAllDebts(): Promise<Debt[]> {
  return query<Debt>("SELECT * FROM debts ORDER BY interest_rate DESC, current_balance ASC");
}

export async function getDebt(id: number): Promise<Debt | null> {
  const results = await query<Debt>("SELECT * FROM debts WHERE id = ?", [id]);
  return results[0] ?? null;
}

export async function createDebt(data: DebtFormData): Promise<number> {
  const result = await execute(
    `INSERT INTO debts (name, category, original_balance, current_balance, interest_rate, minimum_payment, due_day, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.category,
      data.current_balance, // original = current at creation time
      data.current_balance,
      data.interest_rate,
      data.minimum_payment,
      data.due_day,
      data.notes || null,
    ],
  );
  return result.lastInsertId ?? 0;
}

export async function updateDebt(id: number, data: Partial<DebtFormData>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
  if (data.current_balance !== undefined) {
    fields.push("current_balance = ?"); values.push(data.current_balance);
    // Keep original_balance >= current_balance so progress tracking stays valid
    fields.push("original_balance = MAX(original_balance, ?)"); values.push(data.current_balance);
  }
  if (data.interest_rate !== undefined) { fields.push("interest_rate = ?"); values.push(data.interest_rate); }
  if (data.minimum_payment !== undefined) { fields.push("minimum_payment = ?"); values.push(data.minimum_payment); }
  if (data.due_day !== undefined) { fields.push("due_day = ?"); values.push(data.due_day); }
  if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes || null); }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await execute(`UPDATE debts SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteDebt(id: number): Promise<void> {
  await execute("DELETE FROM payments WHERE debt_id = ?", [id]);
  await execute("DELETE FROM debts WHERE id = ?", [id]);
}

// --- Payments ---

export async function getPaymentsForDebt(debtId: number): Promise<Payment[]> {
  return query<Payment>(
    "SELECT * FROM payments WHERE debt_id = ? ORDER BY payment_date DESC",
    [debtId],
  );
}

export async function getAllPayments(): Promise<Payment[]> {
  return query<Payment>("SELECT * FROM payments ORDER BY payment_date DESC");
}

export async function recordPayment(
  debtId: number,
  amount: number,
  date?: string,
  notes?: string,
): Promise<void> {
  await execute(
    `INSERT INTO payments (debt_id, amount, payment_date, notes) VALUES (?, ?, ?, ?)`,
    [debtId, amount, date ?? new Date().toISOString().split("T")[0], notes ?? null],
  );

  // Update the debt's current balance
  await execute(
    `UPDATE debts SET current_balance = MAX(0, current_balance - ?), updated_at = datetime('now') WHERE id = ?`,
    [amount, debtId],
  );
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
  const results = await query<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return results[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value],
  );
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await getSetting("onboarding_complete");
  return value === "true";
}

export async function markOnboardingComplete(): Promise<void> {
  await setSetting("onboarding_complete", "true");
}
