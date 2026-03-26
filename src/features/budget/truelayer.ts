import { getSetting, setSetting } from "@/features/debt/db";
import { CATEGORY_RULES, type BudgetCategory } from "./types";

const AUTH_BASE = "https://auth.truelayer.com";
const API_BASE = "https://api.truelayer.com/data/v1";
const REDIRECT_PORT = 19876;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const SCOPES = "info accounts balance transactions offline_access";

/**
 * Generate the TrueLayer auth link that opens in the browser.
 */
export async function getAuthLink(): Promise<string> {
  const clientId = await getSetting("truelayer_client_id");
  if (!clientId) throw new Error("TrueLayer client ID not configured");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    providers: "uk-ob-all uk-oauth-all",
  });

  return `${AUTH_BASE}/?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = await getSetting("truelayer_client_id");
  const clientSecret = await getSetting("truelayer_client_secret");

  if (!clientId || !clientSecret) throw new Error("TrueLayer credentials not configured");

  const response = await fetch(`${AUTH_BASE}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await response.json();

  // Store tokens
  await setSetting("truelayer_access_token", data.access_token);
  if (data.refresh_token) {
    await setSetting("truelayer_refresh_token", data.refresh_token);
  }
  await setSetting("truelayer_token_expires", String(Date.now() + data.expires_in * 1000));

  return data;
}

/**
 * Refresh the access token using the refresh token.
 */
export async function refreshAccessToken(): Promise<string> {
  const clientId = await getSetting("truelayer_client_id");
  const clientSecret = await getSetting("truelayer_client_secret");
  const refreshToken = await getSetting("truelayer_refresh_token");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing credentials or refresh token");
  }

  const response = await fetch(`${AUTH_BASE}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed — reconnect your bank");
  }

  const data = await response.json();
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
    // Token expired or expiring within 1 minute — refresh
    return refreshAccessToken();
  }

  return token;
}

/**
 * Fetch accounts from TrueLayer.
 */
export async function fetchAccounts(): Promise<{
  account_id: string;
  display_name: string;
  account_type: string;
  currency: string;
  provider: { display_name: string };
}[]> {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to fetch accounts");

  const data = await response.json();
  return data.results;
}

/**
 * Fetch transactions for an account from TrueLayer.
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
  const params = new URLSearchParams({ from, to });
  const response = await fetch(
    `${API_BASE}/accounts/${accountId}/transactions?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) throw new Error("Failed to fetch transactions");

  const data = await response.json();
  return data.results;
}

/**
 * Auto-categorise a transaction based on description/merchant.
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

/**
 * Check if a bank connection exists.
 */
export async function isBankConnected(): Promise<boolean> {
  const token = await getSetting("truelayer_access_token");
  return !!token;
}

/**
 * Disconnect the bank — clear all tokens.
 */
export async function disconnectBank(): Promise<void> {
  await setSetting("truelayer_access_token", "");
  await setSetting("truelayer_refresh_token", "");
  await setSetting("truelayer_token_expires", "");
}

export { REDIRECT_PORT };
