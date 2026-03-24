import { query } from "@/lib/database";
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

export async function importAllData(jsonStr: string): Promise<{ debts: number; payments: number }> {
  const data: ExportData = JSON.parse(jsonStr);

  if (data.version !== 1) {
    throw new Error(`Unsupported export version: ${data.version}`);
  }

  const { execute } = await import("@/lib/database");

  // Clear existing data
  await execute("DELETE FROM payments");
  await execute("DELETE FROM debts");
  await execute("DELETE FROM settings");

  // Import debts
  for (const debt of data.debts) {
    await execute(
      `INSERT INTO debts (id, name, category, original_balance, current_balance, interest_rate, minimum_payment, due_day, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [debt.id, debt.name, debt.category, debt.original_balance, debt.current_balance, debt.interest_rate, debt.minimum_payment, debt.due_day, debt.notes, debt.created_at, debt.updated_at],
    );
  }

  // Import payments
  for (const payment of data.payments) {
    await execute(
      `INSERT INTO payments (id, debt_id, amount, payment_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [payment.id, payment.debt_id, payment.amount, payment.payment_date, payment.notes, payment.created_at],
    );
  }

  // Import settings
  for (const setting of data.settings) {
    await execute(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [setting.key, setting.value],
    );
  }

  return { debts: data.debts.length, payments: data.payments.length };
}
