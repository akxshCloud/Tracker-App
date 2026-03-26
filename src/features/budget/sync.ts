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
 * Start the bank connection flow:
 * 1. Open the auth link in the user's browser
 * 2. Start a temporary local server to capture the callback
 * 3. Verify state parameter (CSRF protection)
 * 4. Exchange the code for tokens
 * 5. Fetch and store accounts
 */
export async function startBankConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const authLink = await getAuthLink();

    await openUrl(authLink);

    const result = await waitForCallback();

    if (!result.code) {
      return { success: false, error: "No authorization code received. Did you complete the bank login?" };
    }

    // Verify OAuth state to prevent CSRF
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
 * Wait for the OAuth callback by starting a one-shot HTTP server.
 */
async function waitForCallback(): Promise<CallbackResult> {
  const { Command } = await import("@tauri-apps/plugin-shell");

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ code: null, state: null }), 120000);

    const serverScript = `
import http.server
import urllib.parse
import html as html_module

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        code = params.get('code', [None])[0]
        state = params.get('state', [None])[0]

        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()

        if code:
            page = '<html><body style="background:#0a0a0f;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Connected!</h1><p>You can close this tab and return to Life Tracker.</p></div></body></html>'
            self.wfile.write(page.encode())
            state_str = state if state else ''
            print(f"CODE:{code}|STATE:{state_str}", flush=True)
        else:
            error = params.get('error', ['unknown'])[0]
            safe_error = html_module.escape(error)
            page = f'<html><body style="background:#0a0a0f;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Error</h1><p>{safe_error}</p></div></body></html>'
            self.wfile.write(page.encode())
            print(f"ERROR:{safe_error}", flush=True)

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
        const parts = line.replace("CODE:", "").trim();
        const [code, statePart] = parts.split("|STATE:");
        resolve({ code: code.trim(), state: statePart?.trim() ?? null });
      } else if (line.startsWith("ERROR:")) {
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
