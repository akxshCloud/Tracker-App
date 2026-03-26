import { openUrl } from "@tauri-apps/plugin-opener";
import { getSetting } from "@/features/debt/db";
import {
  getAuthLink,
  exchangeCode,
  fetchAccounts,
  fetchTransactions,
  autoCategorise,
  REDIRECT_PORT,
} from "./truelayer";
import { saveBankAccount, saveTransaction, deleteBankAccounts } from "./db";

interface CallbackResult {
  code: string | null;
  state: string | null;
}

/**
 * Start the bank connection flow.
 */
export async function startBankConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const authLink = await getAuthLink();

    // Start the callback server FIRST, then open the browser
    const callbackPromise = waitForCallback();
    await new Promise((r) => setTimeout(r, 500));
    await openUrl(authLink);

    const result = await callbackPromise;

    if (!result.code) {
      return { success: false, error: "No authorization code received. Did you complete the bank login?" };
    }

    const expectedState = await getSetting("truelayer_oauth_state");
    if (!expectedState || result.state !== expectedState) {
      return { success: false, error: "Security check failed — OAuth state mismatch. Please try again." };
    }

    await exchangeCode(result.code);
    await syncAccounts();

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Wait for the OAuth callback using a Node.js one-shot HTTP server via bash.
 */
async function waitForCallback(): Promise<CallbackResult> {
  const { Command } = await import("@tauri-apps/plugin-shell");

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ code: null, state: null }), 300000);

    // Use Node.js instead of Python — guaranteed to be installed since the app was built with npm
    const serverScript = `
const http = require('http');
const url = require('url');
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const code = parsed.query.code || null;
  const state = parsed.query.state || null;
  const error = parsed.query.error || null;

  res.writeHead(200, {'Content-Type': 'text/html'});
  if (code) {
    res.end('<html><body style="background:#0a0a0f;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Connected!</h1><p>You can close this tab and return to Life Tracker.</p></div></body></html>');
    console.log('CODE:' + code + '|STATE:' + (state || ''));
  } else {
    const safeError = (error || 'unknown').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.end('<html><body style="background:#0a0a0f;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Error</h1><p>' + safeError + '</p></div></body></html>');
    console.log('ERROR:' + safeError);
  }
  server.close();
});
server.listen(${REDIRECT_PORT}, 'localhost', () => {
  console.log('LISTENING');
});
server.setTimeout(300000);
`;

    const cmd = Command.create("bash", ["-c", `node -e '${serverScript.replace(/'/g, "'\\''")}'`]);

    cmd.stdout.on("data", (line: string) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("CODE:")) {
        clearTimeout(timeout);
        const parts = trimmed.replace("CODE:", "");
        const [code, statePart] = parts.split("|STATE:");
        resolve({ code: code.trim(), state: statePart?.trim() ?? null });
      } else if (trimmed.startsWith("ERROR:")) {
        clearTimeout(timeout);
        resolve({ code: null, state: null });
      }
    });

    cmd.on("error", () => {
      clearTimeout(timeout);
      resolve({ code: null, state: null });
    });

    cmd.spawn();
  });
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
      const category = autoCategorise(tx.description, tx.merchant_name ?? null);
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
