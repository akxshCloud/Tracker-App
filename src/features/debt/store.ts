import { create } from "zustand";
import type { Debt, DebtFormData, Payment } from "./types";
import * as db from "./db";

interface DebtStore {
  debts: Debt[];
  payments: Payment[];
  monthlyBudget: number;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  // Initialization
  initialize: () => Promise<void>;

  // Debt CRUD
  loadDebts: () => Promise<void>;
  addDebt: (data: DebtFormData) => Promise<void>;
  updateDebt: (id: number, data: Partial<DebtFormData>) => Promise<void>;
  removeDebt: (id: number) => Promise<void>;

  // Payments
  loadPayments: () => Promise<void>;
  recordPayment: (debtId: number, amount: number, date?: string, notes?: string) => Promise<void>;

  // Settings
  setMonthlyBudget: (amount: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Reload data without showing loading spinner (for import)
  reload: () => Promise<void>;
}

export const useDebtStore = create<DebtStore>((set, get) => ({
  debts: [],
  payments: [],
  monthlyBudget: 0,
  isLoading: true,
  hasCompletedOnboarding: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const onboarded = await db.hasCompletedOnboarding();
      const budgetStr = await db.getSetting("monthly_budget");
      const budget = budgetStr ? parseFloat(budgetStr) : 0;

      if (onboarded) {
        const debts = await db.getAllDebts();
        const payments = await db.getAllPayments();
        set({ debts, payments, monthlyBudget: budget, hasCompletedOnboarding: true, isLoading: false });
      } else {
        set({ hasCompletedOnboarding: false, monthlyBudget: budget, isLoading: false });
      }
    } catch (err) {
      console.error("Debt store init failed:", err);
      set({ isLoading: false });
    }
  },

  loadDebts: async () => {
    const debts = await db.getAllDebts();
    set({ debts });
  },

  addDebt: async (data) => {
    await db.createDebt(data);
    await get().loadDebts();
  },

  updateDebt: async (id, data) => {
    await db.updateDebt(id, data);
    await get().loadDebts();
  },

  removeDebt: async (id) => {
    await db.deleteDebt(id);
    await get().loadDebts();
    await get().loadPayments();
  },

  loadPayments: async () => {
    const payments = await db.getAllPayments();
    set({ payments });
  },

  recordPayment: async (debtId, amount, date, notes) => {
    await db.recordPayment(debtId, amount, date, notes);
    await get().loadDebts();
    await get().loadPayments();
  },

  setMonthlyBudget: async (amount) => {
    await db.setSetting("monthly_budget", amount.toString());
    set({ monthlyBudget: amount });
  },

  completeOnboarding: async () => {
    await db.markOnboardingComplete();
    await get().loadDebts();
    await get().loadPayments();
    set({ hasCompletedOnboarding: true });
  },

  reload: async () => {
    const onboarded = await db.hasCompletedOnboarding();
    const budgetStr = await db.getSetting("monthly_budget");
    const budget = budgetStr ? parseFloat(budgetStr) : 0;
    const debts = await db.getAllDebts();
    const payments = await db.getAllPayments();
    set({ debts, payments, monthlyBudget: budget, hasCompletedOnboarding: onboarded });
  },
}));
