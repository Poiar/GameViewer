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
