import { query, execute } from "@/lib/database";
import type { Debt, Payment } from "@/features/debt/types";

interface ExportData {
  version: 1;
  exportedAt: string;
  debts: Debt[];
  payments: Payment[];
  settings: { key: string; value: string }[];
}

export async function exportAllData(): Promise<string> {
  const debts = await query<Debt>("SELECT * FROM debts ORDER BY id");
  const payments = await query<Payment>("SELECT * FROM payments ORDER BY id");
  const settings = await query<{ key: string; value: string }>("SELECT * FROM settings");

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    debts,
    payments,
    settings,
  };

  return JSON.stringify(data, null, 2);
}

function validateImportData(raw: unknown): ExportData {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid backup file: not a JSON object.");
  }

  const obj = raw as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new Error(`Unsupported backup version: ${obj.version}`);
  }
  if (!Array.isArray(obj.debts)) {
    throw new Error("Invalid backup file: missing debts array.");
  }
  if (!Array.isArray(obj.payments)) {
    throw new Error("Invalid backup file: missing payments array.");
  }
  if (!Array.isArray(obj.settings)) {
    throw new Error("Invalid backup file: missing settings array.");
  }

  // Validate each debt has required numeric fields
  for (const debt of obj.debts) {
    if (typeof debt.name !== "string" || !debt.name) {
      throw new Error(`Invalid debt: missing or empty name.`);
    }
    if (typeof debt.current_balance !== "number" || isNaN(debt.current_balance)) {
      throw new Error(`Invalid debt "${debt.name}": current_balance must be a number.`);
    }
    if (typeof debt.interest_rate !== "number" || isNaN(debt.interest_rate)) {
      throw new Error(`Invalid debt "${debt.name}": interest_rate must be a number.`);
    }
  }

  // Validate each payment has required fields
  for (const payment of obj.payments) {
    if (typeof payment.amount !== "number" || isNaN(payment.amount) || payment.amount <= 0) {
      throw new Error(`Invalid payment: amount must be a positive number.`);
    }
    if (typeof payment.debt_id !== "number") {
      throw new Error(`Invalid payment: debt_id must be a number.`);
    }
  }

  return obj as unknown as ExportData;
}

export async function importAllData(jsonStr: string): Promise<{ debts: number; payments: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  const data = validateImportData(parsed);

  // Wrap in a transaction so partial failures don't wipe data
  await execute("BEGIN TRANSACTION");
  try {
    await execute("DELETE FROM payments");
    await execute("DELETE FROM debts");
    await execute("DELETE FROM settings");

    for (const debt of data.debts) {
      await execute(
        `INSERT INTO debts (id, name, category, original_balance, current_balance, interest_rate, minimum_payment, due_day, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [debt.id, debt.name, debt.category, debt.original_balance, debt.current_balance, debt.interest_rate, debt.minimum_payment, debt.due_day, debt.notes, debt.created_at, debt.updated_at],
      );
    }

    for (const payment of data.payments) {
      await execute(
        `INSERT INTO payments (id, debt_id, amount, payment_date, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [payment.id, payment.debt_id, payment.amount, payment.payment_date, payment.notes, payment.created_at],
      );
    }

    for (const setting of data.settings) {
      await execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [setting.key, setting.value],
      );
    }

    await execute("COMMIT");
  } catch (err) {
    await execute("ROLLBACK");
    throw err;
  }

  return { debts: data.debts.length, payments: data.payments.length };
}
