export type BudgetCategory =
  | "income"
  | "needs"
  | "wants"
  | "savings"
  | "debt"
  | "uncategorised";

export const BUDGET_CATEGORIES: { value: BudgetCategory; label: string; color: string }[] = [
  { value: "income", label: "Income", color: "text-positive" },
  { value: "needs", label: "Needs", color: "text-foreground" },
  { value: "wants", label: "Wants", color: "text-primary" },
  { value: "savings", label: "Savings", color: "text-positive" },
  { value: "debt", label: "Debt", color: "text-destructive" },
  { value: "uncategorised", label: "Uncategorised", color: "text-muted-foreground" },
];

export interface BankAccount {
  id: string;
  name: string;
  account_type: string;
  currency: string;
  provider: string | null;
  connected_at: string;
}

export interface Transaction {
  id: string;
  bank_account_id: string;
  amount: number;
  currency: string;
  description: string;
  merchant_name: string | null;
  transaction_type: "DEBIT" | "CREDIT";
  transaction_date: string;
  budget_category: BudgetCategory;
  user_categorised: number;
  created_at: string;
}

// Auto-categorisation rules based on merchant/description keywords
export const CATEGORY_RULES: { keywords: string[]; category: BudgetCategory }[] = [
  // Income
  { keywords: ["salary", "wages", "payroll", "hmrc", "tax refund", "refund"], category: "income" },
  // Needs
  { keywords: ["rent", "mortgage", "council tax", "water", "electric", "gas", "energy", "broadband", "internet", "mobile", "phone", "insurance", "nhs", "pharmacy", "doctor", "dentist", "tesco", "sainsbury", "asda", "aldi", "lidl", "morrisons", "co-op", "waitrose", "groceries", "petrol", "diesel", "tfl", "transport", "rail", "train", "bus", "parking"], category: "needs" },
  // Wants
  { keywords: ["netflix", "spotify", "amazon prime", "disney", "youtube", "apple music", "subscription", "uber eats", "deliveroo", "just eat", "mcdonald", "nando", "kfc", "starbucks", "costa", "greggs", "pub", "bar", "restaurant", "cinema", "gym", "nike", "adidas", "asos", "amazon", "ebay", "primark", "h&m", "zara"], category: "wants" },
  // Savings
  { keywords: ["savings", "investment", "isa", "pension", "vanguard", "trading 212", "freetrade"], category: "savings" },
  // Debt
  { keywords: ["credit card", "loan payment", "paypal credit", "klarna", "clearpay", "afterpay", "buy now pay later"], category: "debt" },
];
