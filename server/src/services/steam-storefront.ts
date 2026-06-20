// Steam Storefront API — public, no key required
// https://steamcommunity.com/dev
// https://partner.steamgames.com/doc/store/getapplist

interface SteamAppData {
  name: string;
  type: string; // "game", "dlc", "music", "video", "demo", etc.
  release_date?: { date: string; coming_soon: boolean };
  price_overview?: {
    currency: string;
    final: number;
    final_formatted: string;
    discount_percent: number;
  };
  short_description?: string;
  developers?: string[];
  publishers?: string[];
  genres?: Array<{ id: number; description: string }>;
  platforms?: Record<string, boolean>;
  about_the_game?: string;
  dlc?: number[]; // array of Steam App IDs
}

interface SteamApiResponse {
  [appId: string]: {
    success: boolean;
    data?: SteamAppData;
  };
}

// ---------------------------------------------------------------------------
// Fetch game details from Steam Storefront
// ---------------------------------------------------------------------------

async function fetchAppDetails(appId: number): Promise<SteamAppData | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=US&l=en`,
      { headers: { "Accept": "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as SteamApiResponse;
    const entry = json[String(appId)];
    if (!entry?.success || !entry?.data) return null;
    return entry.data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// DLC import helpers
// ---------------------------------------------------------------------------

export interface SteamDlcInfo {
  steamAppId: number;
  title: string;
  dlcType: string; // "dlc", "music", "video"
  releaseYear: number | null;
  description: string | null;
}

/**
 * Fetch the list of DLC Steam App IDs for a game.
 */
export async function fetchSteamDlcIds(gameSteamAppId: number): Promise<number[]> {
  const data = await fetchAppDetails(gameSteamAppId);
  if (!data?.dlc?.length) return [];
  return data.dlc;
}

/**
 * Fetch details for a single DLC app.
 */
export async function fetchSteamDlcDetails(dlcAppId: number): Promise<SteamDlcInfo | null> {
  const data = await fetchAppDetails(dlcAppId);
  if (!data) return null;

  return {
    steamAppId: dlcAppId,
    title: data.name,
    dlcType: data.type || "dlc",
    releaseYear: data.release_date?.date
      ? parseInt(data.release_date.date.split(" ").pop() || "0", 10) || null
      : null,
    description: data.short_description || data.about_the_game || null,
  };
}

/**
 * Full pipeline: fetch DLC IDs → fetch each DLC's details.
 * Returns a map of steamAppId → SteamDlcInfo.
 */
export async function importSteamDlcs(
  gameSteamAppId: number,
): Promise<Map<number, SteamDlcInfo>> {
  const dlcIds = await fetchSteamDlcIds(gameSteamAppId);
  if (!dlcIds.length) return new Map();

  const results = new Map<number, SteamDlcInfo>();
  for (const id of dlcIds) {
    const info = await fetchSteamDlcDetails(id);
    if (info) results.set(id, info);
    await new Promise((r) => setTimeout(r, 200)); // rate limit
  }
  return results;
}
