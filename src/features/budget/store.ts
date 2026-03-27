import { create } from "zustand";
import type { BankAccount, Transaction, BudgetCategory } from "./types";
import * as db from "./db";
import { isBankConnected } from "./truelayer";
import { learnFromCorrection, recategoriseAll } from "./categoriser";

interface BudgetLimit {
  category: BudgetCategory;
  monthly_limit: number;
}

interface BudgetStore {
  accounts: BankAccount[];
  transactions: Transaction[];
  isConnected: boolean;
  isLoading: boolean;
  selectedMonth: { year: number; month: number };
  breakdown: { category: BudgetCategory; total: number; count: number }[];
  uncategorisedCount: number;
  budgetLimits: BudgetLimit[];

  initialize: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadBreakdown: () => Promise<void>;
  loadBudgetLimits: () => Promise<void>;
  setMonth: (year: number, month: number) => void;
  recategorise: (tx: Transaction, category: BudgetCategory) => Promise<void>;
  setBudgetLimit: (category: BudgetCategory, limit: number) => Promise<void>;
  smartRecategorise: () => Promise<number>;
}

export const useBudgetStore = create<BudgetStore>((set, get) => {
  const now = new Date();

  return {
    accounts: [],
    transactions: [],
    isConnected: false,
    isLoading: true,
    selectedMonth: { year: now.getFullYear(), month: now.getMonth() + 1 },
    breakdown: [],
    uncategorisedCount: 0,
    budgetLimits: [],

    initialize: async () => {
      set({ isLoading: true });
      const connected = await isBankConnected();
      const accounts = await db.getBankAccounts();

      if (connected && accounts.length > 0) {
        set({ isConnected: true, accounts });
        await get().loadTransactions();
        await get().loadBreakdown();
        await get().loadBudgetLimits();
      }

      set({ isLoading: false });
    },

    loadTransactions: async () => {
      const { year, month } = get().selectedMonth;
      const from = `${year}-${String(month).padStart(2, "0")}-01`;
      const toMonth = month === 12 ? 1 : month + 1;
      const toYear = month === 12 ? year + 1 : year;
      const to = `${toYear}-${String(toMonth).padStart(2, "0")}-01`;

      const transactions = await db.getTransactions(from, to);
      const uncategorisedCount = transactions.filter((t) => t.budget_category === "uncategorised").length;
      set({ transactions, uncategorisedCount });
    },

    loadBreakdown: async () => {
      const { year, month } = get().selectedMonth;
      const breakdown = await db.getMonthlyBreakdown(year, month);
      set({ breakdown });
    },

    loadBudgetLimits: async () => {
      const { query: dbQuery } = await import("@/lib/database");
      const limits = await dbQuery<BudgetLimit>("SELECT category, monthly_limit FROM budget_limits");
      set({ budgetLimits: limits });
    },

    setMonth: (year, month) => {
      set({ selectedMonth: { year, month } });
      get().loadTransactions();
      get().loadBreakdown();
    },

    recategorise: async (tx, category) => {
      await db.updateTransactionCategory(tx.id, category);
      // Learn from this correction for future transactions
      await learnFromCorrection(tx.description, tx.merchant_name, category);
      await get().loadTransactions();
      await get().loadBreakdown();
    },

    setBudgetLimit: async (category, limit) => {
      const { execute: dbExecute } = await import("@/lib/database");
      await dbExecute(
        "INSERT OR REPLACE INTO budget_limits (category, monthly_limit) VALUES (?, ?)",
        [category, limit],
      );
      await get().loadBudgetLimits();
    },

    smartRecategorise: async () => {
      const count = await recategoriseAll();
      if (count > 0) {
        await get().loadTransactions();
        await get().loadBreakdown();
      }
      return count;
    },
  };
});
