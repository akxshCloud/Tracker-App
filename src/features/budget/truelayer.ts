import { invoke } from "@tauri-apps/api/core";
import { getSetting, setSetting } from "@/features/debt/db";
import { CATEGORY_RULES, type BudgetCategory } from "./types";

const API_BASE = "https://api.truelayer.com/data/v1";
const REDIRECT_PORT = 19876;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const SCOPES = "info accounts balance transactions offline_access";

/**
 * Generate the TrueLayer auth link.
 */
export async function getAuthLink(): Promise<string> {
  const clientId = await getSetting("truelayer_client_id");
  if (!clientId) throw new Error("TrueLayer client ID not configured");

  const state = crypto.randomUUID();
  await setSetting("truelayer_oauth_state", state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    providers: "uk-ob-all uk-oauth-all",
    state,
  });

  return `https://auth.truelayer.com/?${params.toString()}`;
}

/**
 * Exchange auth code for tokens — via Rust command (bypasses CSP).
 */
export async function exchangeCode(code: string): Promise<void> {
  const clientId = await getSetting("truelayer_client_id");
  const clientSecret = await getSetting("truelayer_client_secret");

  if (!clientId || !clientSecret) throw new Error("TrueLayer credentials not configured");

  const data = await invoke<{
    access_token: string;
    refresh_token: string | null;
    expires_in: number;
  }>("exchange_truelayer_token", {
    clientId,
    clientSecret,
    code,
    redirectUri: REDIRECT_URI,
  });

  await setSetting("truelayer_access_token", data.access_token);
  if (data.refresh_token) {
    await setSetting("truelayer_refresh_token", data.refresh_token);
  }
  await setSetting("truelayer_token_expires", String(Date.now() + data.expires_in * 1000));
}

/**
 * Refresh the access token — via Rust command.
 */
async function refreshAccessToken(): Promise<string> {
  const clientId = await getSetting("truelayer_client_id");
  const clientSecret = await getSetting("truelayer_client_secret");
  const refreshToken = await getSetting("truelayer_refresh_token");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing credentials or refresh token — reconnect your bank");
  }

  const data = await invoke<{
    access_token: string;
    refresh_token: string | null;
    expires_in: number;
  }>("refresh_truelayer_token", {
    clientId,
    clientSecret,
    refreshToken,
  });

  await setSetting("truelayer_access_token", data.access_token);
  if (data.refresh_token) {
    await setSetting("truelayer_refresh_token", data.refresh_token);
  }
  await setSetting("truelayer_token_expires", String(Date.now() + data.expires_in * 1000));

  return data.access_token;
}

/**
 * Get a valid access token, refreshing if expired.
 */
export async function getAccessToken(): Promise<string> {
  const token = await getSetting("truelayer_access_token");
  const expiresStr = await getSetting("truelayer_token_expires");

  if (!token) throw new Error("Not connected — connect your bank first");

  const expires = expiresStr ? parseInt(expiresStr) : 0;
  if (Date.now() > expires - 60000) {
    return refreshAccessToken();
  }

  return token;
}

/**
 * Fetch accounts — via Rust command (bypasses CSP).
 */
export async function fetchAccounts(): Promise<{
  account_id: string;
  display_name: string;
  account_type: string;
  currency: string;
  provider: { display_name: string };
}[]> {
  const token = await getAccessToken();
  const raw = await invoke<string>("truelayer_api_get", {
    url: `${API_BASE}/accounts`,
    accessToken: token,
  });

  const data = JSON.parse(raw);
  return data.results;
}

/**
 * Fetch transactions — via Rust command (bypasses CSP).
 */
export async function fetchTransactions(
  accountId: string,
  from: string,
  to: string,
): Promise<{
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: "DEBIT" | "CREDIT";
  transaction_category: string;
  merchant_name?: string;
}[]> {
  const token = await getAccessToken();
  const raw = await invoke<string>("truelayer_api_get", {
    url: `${API_BASE}/accounts/${accountId}/transactions?from=${from}&to=${to}`,
    accessToken: token,
  });

  const data = JSON.parse(raw);
  return data.results;
}

/**
 * Auto-categorise a transaction.
 */
export function autoCategorise(description: string, merchantName: string | null): BudgetCategory {
  const searchText = `${description} ${merchantName ?? ""}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => searchText.includes(kw))) {
      return rule.category;
    }
  }

  return "uncategorised";
}

export async function isBankConnected(): Promise<boolean> {
  const token = await getSetting("truelayer_access_token");
  return !!token;
}

export async function disconnectBank(): Promise<void> {
  const { execute } = await import("@/lib/database");
  await execute("DELETE FROM settings WHERE key IN (?, ?, ?, ?)", [
    "truelayer_access_token",
    "truelayer_refresh_token",
    "truelayer_token_expires",
    "truelayer_oauth_state",
  ]);
}

export { REDIRECT_PORT };
