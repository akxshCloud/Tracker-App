import { describe, it, expect } from "vitest";
import {
  calculatePayoffProjection,
  compareStrategies,
  getDebtSummary,
  minimumBudgetRequired,
} from "./calculations";
import type { Debt } from "./types";

const mockDebts: Debt[] = [
  {
    id: 1,
    name: "Credit Card",
    category: "credit_card",
    original_balance: 5000,
    current_balance: 5000,
    interest_rate: 24.9,
    minimum_payment: 100,
    due_day: 15,
    notes: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 2,
    name: "Buy Now Pay Later",
    category: "buy_now_pay_later",
    original_balance: 9000,
    current_balance: 9000,
    interest_rate: 0,
    minimum_payment: 150,
    due_day: 1,
    notes: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

describe("getDebtSummary", () => {
  it("calculates totals correctly", () => {
    const summary = getDebtSummary(mockDebts);
    expect(summary.totalDebt).toBe(14000);
    expect(summary.debtCount).toBe(2);
    expect(summary.highInterestDebt).toBe(5000);
    expect(summary.noInterestDebt).toBe(9000);
    expect(summary.monthlyMinimums).toBe(250);
    expect(summary.monthlyInterestAccruing).toBeGreaterThan(0);
  });

  it("returns zeros for empty debts", () => {
    const summary = getDebtSummary([]);
    expect(summary.totalDebt).toBe(0);
    expect(summary.debtCount).toBe(0);
  });
});

describe("minimumBudgetRequired", () => {
  it("sums all minimum payments", () => {
    expect(minimumBudgetRequired(mockDebts)).toBe(250);
  });
});

describe("calculatePayoffProjection", () => {
  it("returns empty projection for no debts", () => {
    const result = calculatePayoffProjection([], 500, "avalanche");
    expect(result.months).toHaveLength(0);
    expect(result.totalInterestPaid).toBe(0);
  });

  it("avalanche pays off debts eventually", () => {
    const result = calculatePayoffProjection(mockDebts, 500, "avalanche");
    expect(result.monthsToPayoff).toBeGreaterThan(0);
    expect(result.months[result.months.length - 1].totalBalance).toBeLessThanOrEqual(0.01);
  });

  it("snowball pays off debts eventually", () => {
    const result = calculatePayoffProjection(mockDebts, 500, "snowball");
    expect(result.monthsToPayoff).toBeGreaterThan(0);
    expect(result.months[result.months.length - 1].totalBalance).toBeLessThanOrEqual(0.01);
  });

  it("avalanche pays less interest than snowball for mixed-rate debts", () => {
    const comparison = compareStrategies(mockDebts, 500);
    expect(comparison.avalanche.totalInterestPaid).toBeLessThanOrEqual(
      comparison.snowball.totalInterestPaid,
    );
    expect(comparison.interestSaved).toBeGreaterThanOrEqual(0);
  });

  it("handles zero-interest-only debts", () => {
    const zeroOnly: Debt[] = [mockDebts[1]]; // BNPL at 0%
    const result = calculatePayoffProjection(zeroOnly, 300, "avalanche");
    expect(result.totalInterestPaid).toBe(0);
    expect(result.monthsToPayoff).toBe(30); // 9000 / 300 = 30 months
  });
});

describe("compareStrategies", () => {
  it("returns both strategies and interest saved", () => {
    const result = compareStrategies(mockDebts, 500);
    expect(result.avalanche.strategy).toBe("avalanche");
    expect(result.snowball.strategy).toBe("snowball");
    expect(typeof result.interestSaved).toBe("number");
  });
});
