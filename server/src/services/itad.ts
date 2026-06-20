// Is There Any Deal price API
import { config } from "../config.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// OAuth 2.0 PKCE token management
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(__dirname, "..", ".itad-token.json");

interface ItadToken {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix ms
  token_type: string;
}

function getToken(): ItadToken | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8")) as ItadToken;
    }
  } catch { /* ignore */ }
  return null;
}

function saveToken(token: ItadToken): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2));
}

function hasOAuthCredentials(): boolean {
  return !!(config.itadClientId && config.itadClientSecret);
}

/**
 * Generate PKCE code_verifier (128 chars of unreserved chars).
 */
export function generateCodeVerifier(): string {
  const unreserved = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.randomBytes(128);
  return Array.from(bytes).map((b) => unreserved[b % unreserved.length]).join("");
}

/**
 * Derive PKCE code_challenge (S256) from a code_verifier.
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

/**
 * Build the ITAD OAuth authorize URL with PKCE.
 */
export function buildAuthorizeUrl(verifier: string): string {
  const challenge = generateCodeChallenge(verifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.itadClientId,
    redirect_uri: "http://localhost:3001/api/pricing/oauth-callback",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `https://isthereanydeal.com/oauth/authorize/?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens via the token endpoint.
 */
export async function exchangeCode(code: string, verifier: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://localhost:3001/api/pricing/oauth-callback",
      client_id: config.itadClientId,
      client_secret: config.itadClientSecret,
      code_verifier: verifier,
    });

    const res = await fetch("https://isthereanydeal.com/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[ITAD] Token exchange failed:", res.status, text);
      return false;
    }

    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    };

    saveToken({
      access_token: json.access_token,
      refresh_token: json.refresh_token ?? "",
      expires_at: Date.now() + (json.expires_in ?? 3600) * 1000,
      token_type: json.token_type ?? "Bearer",
    });

    console.log("[ITAD] OAuth token obtained successfully");
    return true;
  } catch (err) {
    console.error("[ITAD] Token exchange error:", err);
    return false;
  }
}

/**
 * Refresh the access token using the stored refresh token.
 */
async function refreshToken(): Promise<ItadToken | null> {
  const stored = getToken();
  if (!stored?.refresh_token) return null;

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
      client_id: config.itadClientId,
      client_secret: config.itadClientSecret,
    });

    const res = await fetch("https://isthereanydeal.com/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
    };

    const token: ItadToken = {
      access_token: json.access_token,
      refresh_token: json.refresh_token ?? stored.refresh_token,
      expires_at: Date.now() + (json.expires_in ?? 3600) * 1000,
      token_type: json.token_type ?? "Bearer",
    };
    saveToken(token);
    return token;
  } catch {
    return null;
  }
}

/**
 * Get a valid Bearer token, auto-refreshing if expired.
 */
async function getBearerToken(): Promise<string | null> {
  if (!hasOAuthCredentials()) return null;

  let token = getToken();
  if (!token) return null;

  // Refresh if expired or expiring within 5 minutes
  if (token.expires_at < Date.now() + 5 * 60 * 1000) {
    token = await refreshToken();
  }

  return token?.access_token ?? null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItadLookupResponse {
  [shopId: string]: string; // "app/236850" -> "itad-uuid"
}

interface ItadPriceEntry {
  price: Record<string, { amount: number; amountInt: number; currency: string }>;
  shop: { id: number; name: string };
  url: string;
  /** ISO date when the deal was added/found */
  added: string;
}

interface ItadCurrent {
  prices: ItadPriceEntry[];
}

interface ItadLowest {
  price: string; // numeric string, e.g. "4.99"
  added: string; // ISO timestamp
  shop?: { id: number; name: string };
}

interface ItadOverviewGame {
  title: string;
  plain: string;
  current: ItadCurrent;
  lowest: ItadLowest;
  bundles: number;
  urls: {
    game: string;
    history: string;
  };
}

interface ItadOverviewResponse {
  [uuid: string]: ItadOverviewGame | null;
}

// ---------------------------------------------------------------------------
// Shops: Steam is shop ID 61
// ---------------------------------------------------------------------------

const STEAM_SHOP_ID = 61;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apiKey(): string | null {
  if (!config.itadApiKey) return null;
  return config.itadApiKey;
}

// ---------------------------------------------------------------------------
// Lookup: Steam App ID → ITAD UUID
// ---------------------------------------------------------------------------

/**
 * Look up one or more Steam App IDs to get their ITAD UUIDs.
 * Returns a map of steamAppId → itadUuid for matched games.
 */
export async function lookupSteamAppIds(
  steamAppIds: number[],
): Promise<Map<number, string>> {
  const key = apiKey();
  if (!key || !steamAppIds.length) return new Map();

  try {
    const body = steamAppIds.map((id) => `app/${id}`);

    const res = await fetch(
      `https://api.isthereanydeal.com/lookup/id/shop/${STEAM_SHOP_ID}/v1`,
      {
        method: "POST",
        headers: {
          "ITAD-API-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      console.warn(`[ITAD] Lookup failed (${res.status})`);
      return new Map();
    }

    const data = (await res.json()) as ItadLookupResponse;
    const result = new Map<number, string>();

    for (const [shopKey, itadUuid] of Object.entries(data)) {
      // shopKey is "app/{steamAppId}"
      const match = shopKey.match(/^app\/(\d+)$/);
      if (match) {
        result.set(parseInt(match[1], 10), itadUuid);
      }
    }

    return result;
  } catch (err) {
    console.warn("[ITAD] Lookup error:", err);
    return new Map();
  }
}

// ---------------------------------------------------------------------------
// Price overview: ITAD UUID → current prices + historical low
// ---------------------------------------------------------------------------

export interface PriceOverview {
  itadPlain: string;
  currentPrice: string | null; // best price, as numeric string
  currentShop: string | null;  // shop name for best price
  currentUrl: string | null;   // affiliate URL for best deal
  lowestPrice: string | null;  // historical lowest price
  lowestAt: Date | null;       // when that low was seen
  gameUrl: string;             // ITAD game page
  historyUrl: string;          // ITAD price history page
}

/**
 * Fetch price overview for one or more ITAD UUIDs.
 * Returns a map of uuid → PriceOverview.
 */
export async function getPriceOverview(
  itadUuids: string[],
): Promise<Map<string, PriceOverview>> {
  if (!itadUuids.length) return new Map();

  try {
    // Try Bearer token first (OAuth), fall back to API key
    let bearerToken: string | null = null;
    let apiKeyFallback = false;

    bearerToken = await getBearerToken();
    if (!bearerToken) {
      // No OAuth token yet — try API key
      const key = apiKey();
      if (!key) return new Map();
      apiKeyFallback = true;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (bearerToken) {
      headers["Authorization"] = `Bearer ${bearerToken}`;
    } else {
      headers["ITAD-API-Key"] = apiKey()!;
    }

    const res = await fetch(
      `https://api.isthereanydeal.com/games/overview/v2`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(itadUuids),
      },
    );

    if (!res.ok) {
      if (apiKeyFallback) {
        console.warn(`[ITAD] Overview failed (${res.status}) — try the /api/pricing/authorize route to set up OAuth`);
      } else {
        console.warn(`[ITAD] Overview failed (${res.status}) — token may be expired, re-authorize at /api/pricing/authorize`);
      }
      return new Map();
    }

    const data = (await res.json()) as ItadOverviewResponse;
    const result = new Map<string, PriceOverview>();

    for (const [uuid, game] of Object.entries(data)) {
      if (!game) continue;

      // Find the cheapest current price
      let bestPrice: string | null = null;
      let bestShop: string | null = null;
      let bestUrl: string | null = null;

      if (game.current?.prices?.length) {
        const sorted = [...game.current.prices].sort(
          (a, b) =>
            (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity),
        );
        const cheapest = sorted[0];
        if (cheapest.price?.amount != null) {
          bestPrice = cheapest.price.amount.toFixed(2);
          bestShop = cheapest.shop?.name ?? null;
          bestUrl = cheapest.url ?? null;
        }
      }

      result.set(uuid, {
        itadPlain: game.plain,
        currentPrice: bestPrice,
        currentShop: bestShop,
        currentUrl: bestUrl,
        lowestPrice: game.lowest?.price ?? null,
        lowestAt: game.lowest?.added ? new Date(game.lowest.added) : null,
        gameUrl: game.urls?.game ?? "",
        historyUrl: game.urls?.history ?? "",
      });
    }

    return result;
  } catch (err) {
    console.warn("[ITAD] Overview error:", err);
    return new Map();
  }
}

// ---------------------------------------------------------------------------
// Pipeline: Steam App ID → price data (combined lookup + overview)
// ---------------------------------------------------------------------------

export interface ItadEnrichmentResult {
  itadPlain: string | null;
  currentPrice: string | null;
  currentShop: string | null;
  currentUrl: string | null;
  lowestPrice: string | null;
  lowestAt: Date | null;
}

/**
 * Full pipeline: look up ITAD UUID by Steam App ID, then fetch price overview.
 */
export async function enrichGameWithPrices(
  steamAppId: number,
): Promise<ItadEnrichmentResult> {
  const empty: ItadEnrichmentResult = {
    itadPlain: null,
    currentPrice: null,
    currentShop: null,
    currentUrl: null,
    lowestPrice: null,
    lowestAt: null,
  };

  if (!apiKey()) return empty;

  const lookupMap = await lookupSteamAppIds([steamAppId]);
  const itadUuid = lookupMap.get(steamAppId);
  if (!itadUuid) return empty;

  const overviewMap = await getPriceOverview([itadUuid]);
  const overview = overviewMap.get(itadUuid);

  // Always return the UUID even when overview fails — it's still useful data
  if (!overview) {
    return { ...empty, itadPlain: itadUuid };
  }

  return {
    itadPlain: overview.itadPlain,
    currentPrice: overview.currentPrice,
    currentShop: overview.currentShop,
    currentUrl: overview.currentUrl,
    lowestPrice: overview.lowestPrice,
    lowestAt: overview.lowestAt,
  };
}
