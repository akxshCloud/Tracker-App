import { query, execute } from "@/lib/database";
import type { BudgetCategory } from "./types";

interface CategorisationResult {
  category: BudgetCategory;
  confidence: number; // 0-1
  source: "user-rule" | "keyword" | "amount-heuristic" | "default";
}

// User-defined rules learned from manual categorisation
// Stored in SQLite: category_rules table
interface UserRule {
  pattern: string; // normalised merchant/description
  category: BudgetCategory;
}

/**
 * Categorise a transaction using multiple strategies in priority order:
 * 1. User-defined rules (from past corrections) — highest confidence
 * 2. Keyword matching against expanded UK merchant database
 * 3. Amount + type heuristics (large credits = income, etc.)
 * 4. Default to uncategorised
 */
export async function categoriseTransaction(
  description: string,
  merchantName: string | null,
  amount: number,
  transactionType: "DEBIT" | "CREDIT",
  cachedRules?: UserRule[],
): Promise<CategorisationResult> {
  const text = normalise(`${merchantName ?? ""} ${description}`);

  // 1. Check user-defined rules first
  const userRule = await matchUserRule(text, cachedRules);
  if (userRule) {
    return { category: userRule.category, confidence: 1.0, source: "user-rule" };
  }

  // 2. Keyword matching
  const keywordMatch = matchKeywords(text);
  if (keywordMatch) {
    return keywordMatch;
  }

  // 3. Amount/type heuristics
  if (transactionType === "CREDIT" && amount > 500) {
    return { category: "income", confidence: 0.7, source: "amount-heuristic" };
  }
  if (transactionType === "CREDIT" && amount > 50) {
    return { category: "income", confidence: 0.5, source: "amount-heuristic" };
  }

  // 4. Default
  return { category: "uncategorised", confidence: 0, source: "default" };
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*#\-_\.\/\\]/g, " ")  // Replace special chars with spaces
    .replace(/\b[a-z]*\d{6,}[a-z\d]*\b/g, "") // Remove reference codes with 6+ consecutive digits
    .replace(/\s+/g, " ")
    .trim();
}

// --- User Rules ---

async function loadUserRules(): Promise<UserRule[]> {
  return query<UserRule>("SELECT pattern, category FROM category_rules ORDER BY LENGTH(pattern) DESC");
}

async function matchUserRule(text: string, cachedRules?: UserRule[]): Promise<UserRule | null> {
  const rules = cachedRules ?? await loadUserRules();

  for (const rule of rules) {
    if (text.includes(rule.pattern)) {
      return rule;
    }
  }
  return null;
}

/**
 * Learn from a user's manual categorisation.
 * Extracts a normalised pattern from the transaction and stores it.
 */
export async function learnFromCorrection(
  description: string,
  merchantName: string | null,
  category: BudgetCategory,
): Promise<void> {
  const text = normalise(`${merchantName ?? ""} ${description}`);

  // Extract the most distinctive part (first 2-3 words, skip numbers)
  const words = text.split(" ").filter((w) => w.length >= 3 && !/^\d+$/.test(w));
  const pattern = words.slice(0, 3).join(" ");

  // Minimum pattern quality: at least 6 chars and 2 meaningful words
  if (!pattern || pattern.length < 6 || words.filter((w) => w.length >= 3).length < 2) return;

  await execute(
    "INSERT OR REPLACE INTO category_rules (pattern, category) VALUES (?, ?)",
    [pattern, category],
  );
}

// --- Keyword Database ---

interface KeywordRule {
  patterns: string[];
  category: BudgetCategory;
  confidence: number;
}

const KEYWORD_DB: KeywordRule[] = [
  // INCOME — salary, benefits, refunds
  { patterns: ["salary", "wages", "payroll", "hmrc", "dwp", "universal credit", "pension", "tax refund", "bacs", "faster payment received", "standing order received"], category: "income", confidence: 0.9 },
  { patterns: ["refund", "cashback", "rebate", "compensation", "reimburs"], category: "income", confidence: 0.7 },

  // NEEDS — Housing
  { patterns: ["rent", "mortgage", "council tax", "rightmove", "zoopla", "openrent", "letting agent"], category: "needs", confidence: 0.95 },

  // NEEDS — Utilities & Bills
  { patterns: ["british gas", "octopus energy", "eon", "edf", "scottish power", "bulb", "ovo energy", "shell energy", "utility warehouse", "thames water", "anglian water", "united utilities", "severn trent", "welsh water", "southern water", "ocl octopus", "octopus"], category: "needs", confidence: 0.95 },
  { patterns: ["bt ", "sky ", "virgin media", "talktalk", "plusnet", "vodafone", "ee ", "three ", "o2 ", "giffgaff", "broadband", "mobile bill", "sim only"], category: "needs", confidence: 0.9 },
  { patterns: ["tv licen", "bbc licence"], category: "needs", confidence: 0.95 },
  { patterns: ["insurance", "aviva", "admiral", "direct line", "compare the market", "moneysupermarket", "axa", "nhs"], category: "needs", confidence: 0.9 },

  // NEEDS — Groceries
  { patterns: ["tesco", "sainsbury", "asda", "aldi", "lidl", "morrisons", "co op", "coop", "waitrose", "m&s food", "marks spencer food", "iceland", "farmfoods", "ocado", "getir", "gorillas", "amazon fresh", "groceries"], category: "needs", confidence: 0.9 },

  // NEEDS — Transport
  { patterns: ["tfl", "oyster", "transport for london", "trainline", "national rail", "avanti", "gwr", "lner", "southeastern", "southern rail", "northern rail", "scotrail", "arriva", "stagecoach", "petrol", "shell garage", "bp ", "esso", "texaco", "parking", "ncp", "apcoa", "congestion charge", "ulez", "dart charge", "grab"], category: "needs", confidence: 0.85 },
  { patterns: ["uber", "bolt", "taxi", "cab ", "minicab"], category: "needs", confidence: 0.7 },

  // NEEDS — Healthcare
  { patterns: ["pharmacy", "boots pharmacy", "lloyds pharmacy", "superdrug", "specsavers", "dentist", "doctor", "gp ", "hospital", "optician", "vision express"], category: "needs", confidence: 0.9 },

  // WANTS — Food & Drink out
  { patterns: ["uber eats", "deliveroo", "just eat", "mcdonald", "burger king", "kfc", "subway", "domino", "pizza hut", "papa john", "nando", "wagamama", "greggs", "pret", "starbucks", "costa", "caffe nero", "coffee", "cafe", "restaurant", "dining", "kitchen", "grill", "sushi", "thai", "indian", "chinese", "pizza", "burger", "chicken", "kebab", "bakery", "pub ", "bar ", "tavern", "wetherspoon", "taproom", "brew", "kpay", "eats"], category: "wants", confidence: 0.85 },

  // WANTS — Entertainment
  { patterns: ["netflix", "spotify", "apple music", "youtube premium", "disney", "amazon prime", "now tv", "hbo", "paramount", "crunchyroll", "audible", "cinema", "odeon", "cineworld", "vue cinema", "curzon", "theatre", "concert", "ticketmaster", "eventbrite", "stubhub", "gaming", "playstation", "xbox", "nintendo", "steam"], category: "wants", confidence: 0.9 },

  // WANTS — Shopping
  { patterns: ["amazon", "ebay", "asos", "nike", "adidas", "primark", "h&m", "zara", "uniqlo", "next ", "john lewis", "tk maxx", "argos", "currys", "ikea", "muji", "shein", "boohoo", "apple store", "whsmith", "waterstones", "hmv"], category: "wants", confidence: 0.8 },

  // WANTS — Fitness & Wellbeing
  { patterns: ["gym", "puregym", "virgin active", "david lloyd", "the gym", "fitness first", "class pass", "peloton", "spa ", "salon", "barber", "hairdress"], category: "wants", confidence: 0.8 },

  // WANTS — Subscriptions
  { patterns: ["subscription", "patreon", "substack", "notion", "icloud", "google storage", "microsoft 365", "adobe", "canva"], category: "wants", confidence: 0.85 },

  // SAVINGS
  { patterns: ["savings", "isa ", "investment", "vanguard", "trading 212", "freetrade", "nutmeg", "wealthify", "hargreaves", "aj bell", "fidelity", "moneybox"], category: "savings", confidence: 0.9 },

  // DEBT
  { patterns: ["credit card payment", "loan payment", "paypal credit", "klarna", "clearpay", "afterpay", "buy now pay later", "bnpl", "amex", "american exp", "barclaycard", "debt payment"], category: "debt", confidence: 0.85 },
];

function matchKeywords(text: string): CategorisationResult | null {
  let bestMatch: CategorisationResult | null = null;
  let bestLength = 0;

  for (const rule of KEYWORD_DB) {
    for (const pattern of rule.patterns) {
      if (text.includes(pattern) && pattern.length > bestLength) {
        bestMatch = {
          category: rule.category,
          confidence: rule.confidence,
          source: "keyword",
        };
        bestLength = pattern.length;
      }
    }
  }

  return bestMatch;
}

/**
 * Re-categorise all uncategorised transactions using the latest rules.
 */
export async function recategoriseAll(): Promise<number> {
  const uncategorised = await query<{
    id: string;
    description: string;
    merchant_name: string | null;
    amount: number;
    transaction_type: string;
  }>("SELECT id, description, merchant_name, amount, transaction_type FROM transactions WHERE budget_category = 'uncategorised' AND user_categorised = 0");

  // Load rules ONCE before the loop to avoid N+1 queries
  const rules = await loadUserRules();
  let updated = 0;

  for (const tx of uncategorised) {
    const result = await categoriseTransaction(
      tx.description,
      tx.merchant_name,
      tx.amount,
      tx.transaction_type as "DEBIT" | "CREDIT",
      rules,
    );

    if (result.category !== "uncategorised") {
      await execute(
        "UPDATE transactions SET budget_category = ? WHERE id = ?",
        [result.category, tx.id],
      );
      updated++;
    }
  }

  return updated;
}
