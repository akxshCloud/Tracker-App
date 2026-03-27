import { query, execute } from "@/lib/database";
import type { BankAccount, Transaction, BudgetCategory } from "./types";

// --- Bank Accounts ---

export async function saveBankAccount(account: BankAccount): Promise<void> {
  await execute(
    `INSERT OR REPLACE INTO bank_accounts (id, name, account_type, currency, provider, connected_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [account.id, account.name, account.account_type, account.currency, account.provider, account.connected_at],
  );
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  return query<BankAccount>("SELECT * FROM bank_accounts ORDER BY connected_at DESC");
}

export async function deleteBankAccounts(): Promise<void> {
  await execute("DELETE FROM transactions");
  await execute("DELETE FROM bank_accounts");
}

// --- Transactions ---

export async function saveTransaction(tx: {
  id: string;
  bank_account_id: string;
  amount: number;
  currency: string;
  description: string;
  merchant_name: string | null;
  transaction_type: string;
  transaction_date: string;
  budget_category: BudgetCategory;
}): Promise<void> {
  // Use INSERT OR IGNORE so we don't overwrite user-categorised transactions
  await execute(
    `INSERT OR IGNORE INTO transactions (id, bank_account_id, amount, currency, description, merchant_name, transaction_type, transaction_date, budget_category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tx.id, tx.bank_account_id, tx.amount, tx.currency, tx.description, tx.merchant_name, tx.transaction_type, tx.transaction_date, tx.budget_category],
  );
}

export async function getTransactions(
  from?: string,
  to?: string,
): Promise<Transaction[]> {
  let sql = "SELECT * FROM transactions";
  const params: string[] = [];

  if (from && to) {
    sql += " WHERE transaction_date >= ? AND transaction_date < ?";
    params.push(from, to);
  } else if (from) {
    sql += " WHERE transaction_date >= ?";
    params.push(from);
  } else if (to) {
    sql += " WHERE transaction_date <= ?";
    params.push(to);
  }

  sql += " ORDER BY transaction_date DESC";

  return query<Transaction>(sql, params);
}

export async function updateTransactionCategory(
  id: string,
  category: BudgetCategory,
): Promise<void> {
  await execute(
    "UPDATE transactions SET budget_category = ?, user_categorised = 1 WHERE id = ?",
    [category, id],
  );
}

export async function getMonthlyBreakdown(
  year: number,
  month: number,
): Promise<{ category: BudgetCategory; total: number; count: number }[]> {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const toMonth = month === 12 ? 1 : month + 1;
  const toYear = month === 12 ? year + 1 : year;
  const to = `${toYear}-${String(toMonth).padStart(2, "0")}-01`;

  return query<{ category: BudgetCategory; total: number; count: number }>(
    `SELECT budget_category as category, SUM(amount) as total, COUNT(*) as count
     FROM transactions
     WHERE transaction_date >= ? AND transaction_date < ?
     GROUP BY budget_category
     ORDER BY total DESC`,
    [from, to],
  );
}
