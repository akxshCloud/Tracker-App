import { create } from "zustand";
import type { BankAccount, Transaction, BudgetCategory } from "./types";
import * as db from "./db";
import { isBankConnected } from "./truelayer";

interface BudgetStore {
  accounts: BankAccount[];
  transactions: Transaction[];
  isConnected: boolean;
  isLoading: boolean;
  selectedMonth: { year: number; month: number };
  breakdown: { category: BudgetCategory; total: number; count: number }[];

  initialize: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadBreakdown: () => Promise<void>;
  setMonth: (year: number, month: number) => void;
  recategorise: (id: string, category: BudgetCategory) => Promise<void>;
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

    initialize: async () => {
      set({ isLoading: true });
      const connected = await isBankConnected();
      const accounts = await db.getBankAccounts();

      if (connected && accounts.length > 0) {
        set({ isConnected: true, accounts });
        await get().loadTransactions();
        await get().loadBreakdown();
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
      set({ transactions });
    },

    loadBreakdown: async () => {
      const { year, month } = get().selectedMonth;
      const breakdown = await db.getMonthlyBreakdown(year, month);
      set({ breakdown });
    },

    setMonth: (year, month) => {
      set({ selectedMonth: { year, month } });
      get().loadTransactions();
      get().loadBreakdown();
    },

    recategorise: async (id, category) => {
      await db.updateTransactionCategory(id, category);
      await get().loadTransactions();
      await get().loadBreakdown();
    },
  };
});
