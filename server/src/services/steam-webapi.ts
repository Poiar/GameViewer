// Steam WebAPI service — public player counts, achievements, app list
import { config } from "../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AchievementPercent {
  name: string;
  percent: number;
}

export interface AchievementSchemaEntry {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
}

export interface SteamAppEntry {
  appid: number;
  name: string;
}

interface SteamAchievementPercentagesResponse {
  achievementpercentages?: {
    achievements?: AchievementPercent[];
  };
}

interface SteamSchemaForGameResponse {
  game?: {
    gameName?: string;
    availableGameStats?: {
      achievements?: AchievementSchemaEntry[];
    };
  };
}

interface SteamAppListResponse {
  applist?: {
    apps?: SteamAppEntry[];
  };
}

interface SteamStoreSearchResult {
  items?: Array<{
    id: number;
    name: string;
    type: string;
    price?: { final: number };
  }>;
}

// ---------------------------------------------------------------------------
// Public endpoints (no API key needed)
// ---------------------------------------------------------------------------

/**
 * Fetch global achievement percentages for a game (public, no key).
 */
export async function fetchGlobalAchievementPercentages(
  appId: number,
): Promise<AchievementPercent[] | null> {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}&format=json`,
    );
    if (!res.ok) {
      console.warn(`[Steam WebAPI] Achievement percentages failed (${res.status}) for app ${appId}`);
      return null;
    }
    const json = (await res.json()) as SteamAchievementPercentagesResponse;
    return json.achievementpercentages?.achievements ?? null;
  } catch (err) {
    console.warn("[Steam WebAPI] Achievement percentages error:", err);
    return null;
  }
}

/**
 * Fetch the full Steam app list (public, no key).
 */
export async function fetchSteamAppList(): Promise<SteamAppEntry[] | null> {
  try {
    const res = await fetch(
      "https://api.steampowered.com/ISteamApps/GetAppList/v2/",
    );
    if (!res.ok) {
      console.warn(`[Steam WebAPI] App list failed (${res.status})`);
      return null;
    }
    const json = (await res.json()) as SteamAppListResponse;
    return json.applist?.apps ?? null;
  } catch (err) {
    console.warn("[Steam WebAPI] App list error:", err);
    return null;
  }
}

/**
 * Search the Steam Storefront by title (public, no key).
 * Returns the first app ID match, or null.
 */
export async function searchSteamStorefront(title: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&cc=US&l=en`,
    );
    if (!res.ok) {
      console.warn(`[Steam WebAPI] Store search failed (${res.status}) for "${title}"`);
      return null;
    }
    const json = (await res.json()) as SteamStoreSearchResult;
    if (!json.items?.length) return null;

    // Prefer exact name match
    const exact = json.items.find(
      (item) => item.type === "game" && item.name.toLowerCase() === title.toLowerCase(),
    );
    if (exact) return exact.id;

    // Fall back to first game result
    const first = json.items.find((item) => item.type === "game");
    return first?.id ?? null;
  } catch (err) {
    console.warn("[Steam WebAPI] Store search error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Vanity URL → Steam ID resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a Steam vanity URL (e.g. "https://steamcommunity/id/gabelogannewell")
 * to a 64-bit Steam ID. Also accepts raw numeric IDs, returning them as-is.
 * Requires STEAM_WEB_API_KEY.
 */
export async function resolveSteamVanityUrl(input: string): Promise<string | null> {
  if (!config.steamWebApiKey) {
    console.warn("[Steam WebAPI] No STEAM_WEB_API_KEY configured");
    return null;
  }

  // Strip common URL prefixes
  let cleaned = input.trim()
    .replace(/^https?:\/\//, "")
    .replace(/^steamcommunity\.com\//, "")
    .replace(/^steamcommunity\.com\/profiles\//, "")
    .replace(/^steamcommunity\.com\/id\//, "")
    .replace(/\/+$/, "");

  // If it's already a numeric Steam ID (17 digits), return as-is
  if (/^\d{17}$/.test(cleaned)) {
    return cleaned;
  }

  // Resolve vanity URL
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${config.steamWebApiKey}&vanityurl=${encodeURIComponent(cleaned)}`,
    );
    if (!res.ok) {
      console.warn(`[Steam WebAPI] ResolveVanityURL failed (${res.status}) for "${cleaned}"`);
      return null;
    }
    const json = (await res.json()) as { response: { success: number; steamid?: string; message?: string } };
    if (json.response?.success === 1 && json.response?.steamid) {
      return json.response.steamid;
    }
    console.warn(`[Steam WebAPI] Vanity URL not found: "${cleaned}" — ${json.response?.message ?? "unknown"}`);
    return null;
  } catch (err) {
    console.warn("[Steam WebAPI] ResolveVanityURL error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Owned Games (user-specific, requires API key + user's Steam ID)
// ---------------------------------------------------------------------------

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url: string;
  img_logo_url: string;
  has_community_visible_stats?: boolean;
}

/**
 * Fetch a user's owned games from Steam (requires STEAM_WEB_API_KEY).
 * The user's Steam profile must have game details set to public.
 */
export async function fetchOwnedGames(
  steamId: string,
): Promise<SteamOwnedGame[] | null> {
  if (!config.steamWebApiKey) {
    console.warn("[Steam WebAPI] No STEAM_WEB_API_KEY configured");
    return null;
  }
  try {
    const res = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${config.steamWebApiKey}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=true`,
    );
    if (!res.ok) {
      console.warn(`[Steam WebAPI] GetOwnedGames failed (${res.status})`);
      return null;
    }
    const json = (await res.json()) as {
      response: { games?: SteamOwnedGame[] };
    };
    return json.response?.games ?? null;
  } catch (err) {
    console.warn("[Steam WebAPI] GetOwnedGames error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Key-required endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch achievement schema for a game (requires STEAM_WEB_API_KEY).
 */
export async function fetchSchemaForGame(
  appId: number,
): Promise<AchievementSchemaEntry[] | null> {
  if (!config.steamWebApiKey) {
    console.warn("[Steam WebAPI] No STEAM_WEB_API_KEY configured");
    return null;
  }
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${config.steamWebApiKey}&appid=${appId}`,
    );
    if (!res.ok) {
      console.warn(`[Steam WebAPI] Schema failed (${res.status}) for app ${appId}`);
      return null;
    }
    const json = (await res.json()) as SteamSchemaForGameResponse;
    return json.game?.availableGameStats?.achievements ?? null;
  } catch (err) {
    console.warn("[Steam WebAPI] Schema error:", err);
    return null;
  }
}
