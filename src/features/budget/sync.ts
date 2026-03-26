import { openUrl } from "@tauri-apps/plugin-opener";
import {
  getAuthLink,
  exchangeCode,
  fetchAccounts,
  fetchTransactions,
  autoCategorise,
  REDIRECT_PORT,
} from "./truelayer";
import { saveBankAccount, saveTransaction, deleteBankAccounts } from "./db";

/**
 * Start the bank connection flow:
 * 1. Open the auth link in the user's browser
 * 2. Start a temporary local server to capture the callback
 * 3. Exchange the code for tokens
 * 4. Fetch and store accounts
 */
export async function startBankConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const authLink = await getAuthLink();

    // Open auth link in default browser
    await openUrl(authLink);

    // Wait for the callback — we'll poll a simple approach
    // The user will be redirected to localhost:PORT/callback?code=XXX
    // We need to capture that code
    const code = await waitForCallback();

    if (!code) {
      return { success: false, error: "No authorization code received. Did you complete the bank login?" };
    }

    // Exchange code for tokens
    await exchangeCode(code);

    // Fetch and store accounts
    await syncAccounts();

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Wait for the OAuth callback by polling localhost.
 * Uses a simple approach: the redirect lands on a page that stores the code.
 */
async function waitForCallback(): Promise<string | null> {
  // We'll use a different approach for Tauri desktop:
  // Start a tiny HTTP server via Tauri shell to capture the redirect
  const { Command } = await import("@tauri-apps/plugin-shell");

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 120000); // 2 min timeout

    // Start a one-shot HTTP server that captures the code and responds with a success page
    const serverScript = `
import http.server
import urllib.parse
import sys

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        code = params.get('code', [None])[0]

        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()

        if code:
            html = '<html><body style="background:#0a0a0f;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Connected!</h1><p>You can close this tab and return to Life Tracker.</p></div></body></html>'
            self.wfile.write(html.encode())
            print(f"CODE:{code}", flush=True)
        else:
            error = params.get('error', ['unknown'])[0]
            html = f'<html><body style="background:#0a0a0f;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Error</h1><p>{error}</p></div></body></html>'
            self.wfile.write(html.encode())
            print(f"ERROR:{error}", flush=True)

    def log_message(self, format, *args):
        pass

server = http.server.HTTPServer(('localhost', ${REDIRECT_PORT}), Handler)
server.timeout = 120
server.handle_request()
`;

    const cmd = Command.create("python3", ["-c", serverScript]);

    cmd.stdout.on("data", (line: string) => {
      if (line.startsWith("CODE:")) {
        clearTimeout(timeout);
        resolve(line.replace("CODE:", "").trim());
      } else if (line.startsWith("ERROR:")) {
        clearTimeout(timeout);
        resolve(null);
      }
    });

    cmd.on("error", () => {
      clearTimeout(timeout);
      resolve(null);
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
 * Sync transactions for all connected accounts.
 * Fetches last 90 days by default.
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
      const txDate = tx.timestamp.split("T")[0]; // YYYY-MM-DD

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
