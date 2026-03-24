export interface Debt {
  id: number;
  name: string;
  category: DebtCategory;
  original_balance: number;
  current_balance: number;
  interest_rate: number; // Annual percentage rate (APR)
  minimum_payment: number;
  due_day: number | null; // Day of month (1-31)
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  debt_id: number;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export type DebtCategory =
  | "credit_card"
  | "personal_loan"
  | "student_loan"
  | "car_finance"
  | "overdraft"
  | "buy_now_pay_later"
  | "store_credit"
  | "other";

export const DEBT_CATEGORIES: { value: DebtCategory; label: string }[] = [
  { value: "credit_card", label: "Credit Card" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "student_loan", label: "Student Loan" },
  { value: "car_finance", label: "Car Finance" },
  { value: "overdraft", label: "Overdraft" },
  { value: "buy_now_pay_later", label: "Buy Now Pay Later" },
  { value: "store_credit", label: "Store Credit" },
  { value: "other", label: "Other" },
];

export interface DebtFormData {
  name: string;
  category: DebtCategory;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number;
  due_day: number | null;
  notes: string;
}

export type PayoffStrategy = "avalanche" | "snowball";

export interface PayoffMonth {
  month: number;
  date: string; // YYYY-MM
  debts: {
    id: number;
    name: string;
    balance: number;
    payment: number;
    interest: number;
    principalPaid: number;
  }[];
  totalBalance: number;
  totalPayment: number;
  totalInterest: number;
}

export interface PayoffProjection {
  strategy: PayoffStrategy;
  months: PayoffMonth[];
  totalInterestPaid: number;
  totalPaid: number;
  payoffDate: string;
  monthsToPayoff: number;
}
