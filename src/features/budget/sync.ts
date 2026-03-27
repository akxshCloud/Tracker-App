import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { getSetting } from "@/features/debt/db";
import {
  getAuthLink,
  exchangeCode,
  fetchAccounts,
  fetchTransactions,
  REDIRECT_PORT,
} from "./truelayer";
import { categoriseTransaction } from "./categoriser";
import { saveBankAccount, saveTransaction, deleteBankAccounts } from "./db";

interface OAuthCallback {
  code: string | null;
  state: string | null;
  error: string | null;
}

/**
 * Start the bank connection flow.
 */
export async function startBankConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const authLink = await getAuthLink();

    // Start the Rust-native TCP listener FIRST, then open the browser
    const callbackPromise = invoke<OAuthCallback>("wait_for_oauth_callback", {
      port: REDIRECT_PORT,
      timeoutSecs: 300,
    });

    // Small delay to ensure the listener is bound before opening the browser
    await new Promise((r) => setTimeout(r, 300));
    await openUrl(authLink);

    const result = await callbackPromise;

    if (!result.code) {
      return { success: false, error: result.error ?? "No authorization code received." };
    }

    // Verify OAuth state (CSRF protection)
    const expectedState = await getSetting("truelayer_oauth_state");
    if (!expectedState || result.state !== expectedState) {
      return { success: false, error: "Security check failed — OAuth state mismatch." };
    }

    await exchangeCode(result.code);
    await syncAccounts();

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Sync accounts from TrueLayer into local DB.
 */
async function syncAccounts(): Promise<void> {
  const accounts = await fetchAccounts();

  for (const account of accounts) {
    await saveBankAccount({
      id: account.account_id,
      name: account.display_name,
      account_type: account.account_type,
      currency: account.currency,
      provider: account.provider?.display_name ?? null,
      connected_at: new Date().toISOString(),
    });
  }
}

/**
 * Sync transactions for all connected accounts (last N days).
 */
export async function syncTransactions(days = 90): Promise<number> {
  const { getBankAccounts } = await import("./db");
  const accounts = await getBankAccounts();

  if (accounts.length === 0) {
    throw new Error("No bank accounts connected");
  }

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
  const toStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let totalSynced = 0;

  for (const account of accounts) {
    const transactions = await fetchTransactions(account.id, fromStr, toStr);

    for (const tx of transactions) {
      const result = await categoriseTransaction(
        tx.description,
        tx.merchant_name ?? null,
        tx.amount,
        tx.transaction_type,
      );
      const category = result.category;
      const txDate = tx.timestamp.split("T")[0];

      await saveTransaction({
        id: tx.transaction_id,
        bank_account_id: account.id,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        merchant_name: tx.merchant_name ?? null,
        transaction_type: tx.transaction_type,
        transaction_date: txDate,
        budget_category: category,
      });

      totalSynced++;
    }
  }

  return totalSynced;
}

/**
 * Disconnect bank — clear tokens, accounts, and transactions.
 */
export async function disconnectBankFull(): Promise<void> {
  const { disconnectBank } = await import("./truelayer");
  await disconnectBank();
  await deleteBankAccounts();
}
