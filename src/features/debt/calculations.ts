import type { Debt, PayoffMonth, PayoffProjection, PayoffStrategy } from "./types";

/**
 * Calculate monthly interest for a debt.
 * UK APR is divided by 12 for monthly rate.
 */
function monthlyInterest(balance: number, annualRate: number): number {
  return balance * (annualRate / 100 / 12);
}

/**
 * Sort debts according to the chosen payoff strategy.
 * - Avalanche: highest interest rate first (saves the most money)
 * - Snowball: lowest balance first (fastest psychological wins)
 */
function sortDebts(debts: Debt[], strategy: PayoffStrategy): Debt[] {
  const sorted = [...debts];
  if (strategy === "avalanche") {
    sorted.sort((a, b) => b.interest_rate - a.interest_rate || a.current_balance - b.current_balance);
  } else {
    sorted.sort((a, b) => a.current_balance - b.current_balance || b.interest_rate - a.interest_rate);
  }
  return sorted;
}

/**
 * Generate a full payoff projection given debts, a monthly budget, and a strategy.
 *
 * How it works:
 * 1. Each month, accrue interest on each remaining debt
 * 2. Pay minimum payments on all debts
 * 3. Remaining budget goes to the priority debt (per strategy)
 * 4. When a debt is paid off, its minimum rolls into the next priority debt
 * 5. Continue until all debts are at £0 or we hit a safety cap (600 months / 50 years)
 */
export function calculatePayoffProjection(
  debts: Debt[],
  monthlyBudget: number,
  strategy: PayoffStrategy,
): PayoffProjection {
  if (debts.length === 0) {
    return {
      strategy,
      months: [],
      totalInterestPaid: 0,
      totalPaid: 0,
      payoffDate: new Date().toISOString().slice(0, 7),
      monthsToPayoff: 0,
    };
  }

  const sortedDebts = sortDebts(debts, strategy);

  // Working balances keyed by debt id
  const balances = new Map<number, number>();
  for (const debt of sortedDebts) {
    balances.set(debt.id, debt.current_balance);
  }

  const months: PayoffMonth[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  const now = new Date();
  const MAX_MONTHS = 600;

  for (let month = 1; month <= MAX_MONTHS; month++) {
    const date = new Date(now.getFullYear(), now.getMonth() + month, 1);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    // Check if all debts are paid off
    const totalRemaining = Array.from(balances.values()).reduce((s, b) => s + b, 0);
    if (totalRemaining <= 0.01) break;

    let budgetRemaining = monthlyBudget;
    const monthDebts: PayoffMonth["debts"] = [];

    // Step 1: Accrue interest
    for (const debt of sortedDebts) {
      const balance = balances.get(debt.id) ?? 0;
      if (balance <= 0) continue;
      const interest = monthlyInterest(balance, debt.interest_rate);
      balances.set(debt.id, balance + interest);
    }

    // Step 2: Pay minimums on all active debts
    for (const debt of sortedDebts) {
      const balance = balances.get(debt.id) ?? 0;
      if (balance <= 0) continue;
      const minPayment = Math.min(debt.minimum_payment, balance);
      budgetRemaining -= minPayment;
      balances.set(debt.id, balance - minPayment);
    }

    // If budget can't cover minimums, we still track but flag it
    if (budgetRemaining < 0) budgetRemaining = 0;

    // Step 3: Extra payment to priority debt (per strategy order)
    for (const debt of sortedDebts) {
      if (budgetRemaining <= 0) break;
      const balance = balances.get(debt.id) ?? 0;
      if (balance <= 0) continue;
      const extra = Math.min(budgetRemaining, balance);
      balances.set(debt.id, balance - extra);
      budgetRemaining -= extra;
    }

    // Record this month's state
    let monthTotalPayment = 0;
    let monthTotalInterest = 0;

    for (const debt of sortedDebts) {
      const startOfMonth = months.length > 0
        ? months[months.length - 1].debts.find((d) => d.id === debt.id)?.balance ?? 0
        : debt.current_balance;
      const currentBalance = balances.get(debt.id) ?? 0;
      const interest = monthlyInterest(startOfMonth, debt.interest_rate);
      const payment = Math.max(0, startOfMonth + interest - currentBalance);
      const principalPaid = payment - interest;

      monthTotalPayment += payment;
      monthTotalInterest += interest;
      totalInterestPaid += interest;
      totalPaid += payment;

      monthDebts.push({
        id: debt.id,
        name: debt.name,
        balance: Math.max(0, currentBalance),
        payment: Math.round(payment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        principalPaid: Math.round(principalPaid * 100) / 100,
      });
    }

    months.push({
      month,
      date: dateStr,
      debts: monthDebts,
      totalBalance: Math.round(Array.from(balances.values()).reduce((s, b) => s + Math.max(0, b), 0) * 100) / 100,
      totalPayment: Math.round(monthTotalPayment * 100) / 100,
      totalInterest: Math.round(monthTotalInterest * 100) / 100,
    });
  }

  const lastMonth = months[months.length - 1];

  return {
    strategy,
    months,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    payoffDate: lastMonth?.date ?? dateStr(),
    monthsToPayoff: months.length,
  };
}

function dateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Compare avalanche vs snowball for the same debts and budget.
 */
export function compareStrategies(
  debts: Debt[],
  monthlyBudget: number,
): { avalanche: PayoffProjection; snowball: PayoffProjection; interestSaved: number } {
  const avalanche = calculatePayoffProjection(debts, monthlyBudget, "avalanche");
  const snowball = calculatePayoffProjection(debts, monthlyBudget, "snowball");
  const interestSaved = Math.round((snowball.totalInterestPaid - avalanche.totalInterestPaid) * 100) / 100;

  return { avalanche, snowball, interestSaved };
}

/**
 * Calculate minimum monthly budget needed to cover all minimum payments.
 */
export function minimumBudgetRequired(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.minimum_payment, 0);
}

/**
 * Get summary stats for the debt overview.
 */
export function getDebtSummary(debts: Debt[]) {
  const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_balance, 0);
  const totalPaid = totalOriginal - totalDebt;
  const percentPaid = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;
  const highInterestDebt = debts
    .filter((d) => d.interest_rate > 0)
    .reduce((sum, d) => sum + d.current_balance, 0);
  const noInterestDebt = debts
    .filter((d) => d.interest_rate === 0)
    .reduce((sum, d) => sum + d.current_balance, 0);
  const monthlyMinimums = debts.reduce((sum, d) => sum + d.minimum_payment, 0);
  const monthlyInterestAccruing = debts.reduce(
    (sum, d) => sum + monthlyInterest(d.current_balance, d.interest_rate),
    0,
  );

  return {
    totalDebt: Math.round(totalDebt * 100) / 100,
    totalOriginal: Math.round(totalOriginal * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    percentPaid: Math.round(percentPaid * 10) / 10,
    highInterestDebt: Math.round(highInterestDebt * 100) / 100,
    noInterestDebt: Math.round(noInterestDebt * 100) / 100,
    monthlyMinimums: Math.round(monthlyMinimums * 100) / 100,
    monthlyInterestAccruing: Math.round(monthlyInterestAccruing * 100) / 100,
    debtCount: debts.length,
  };
}
