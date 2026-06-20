// RAWG.io game database API — free, needs API key from rawg.io/register
import { config } from "../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawgGameResult {
  id: number;
  name: string;
  slug: string;
  metacritic: number | null;
  esrbRating: { name: string; slug: string } | null;
  tags: Array<{ id: number; name: string; slug: string }>;
  stores: Array<{
    id: number;
    store: { id: number; name: string; slug: string };
  }>;
  description: string | null;
  released: string | null;
  genres: Array<{ id: number; name: string; slug: string }>;
  platforms: Array<{
    platform: { id: number; name: string; slug: string };
    released_at: string | null;
  }>;
}

interface RawgSearchResult {
  count: number;
  results: RawgGameResult[];
}

interface RawgGameDetail extends RawgGameResult {
  description_raw?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function rawgFetch<T>(endpoint: string): Promise<T | null> {
  if (!config.rawgApiKey) {
    console.warn("[RAWG] No RAWG_API_KEY configured");
    return null;
  }
  try {
    const separator = endpoint.includes("?") ? "&" : "?";
    const res = await fetch(
      `https://api.rawg.io/api/${endpoint}${separator}key=${config.rawgApiKey}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      console.warn(`[RAWG] Request failed (${res.status}): ${endpoint}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn("[RAWG] Error:", err);
    return null;
  }
}

function mapGame(raw: RawgGameResult): RawgGameResult {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    metacritic: raw.metacritic ?? null,
    esrbRating: raw.esrbRating ?? null,
    tags: raw.tags ?? [],
    stores: raw.stores ?? [],
    description: (raw as RawgGameDetail).description_raw ?? null,
    released: raw.released ?? null,
    genres: raw.genres ?? [],
    platforms: raw.platforms ?? [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search games on RAWG by title.
 */
export async function searchGames(
  title: string,
): Promise<RawgGameResult[] | null> {
  const data = await rawgFetch<RawgSearchResult>(
    `games?search=${encodeURIComponent(title)}&page_size=5`,
  );
  if (!data?.results?.length) return null;
  return data.results.map(mapGame);
}

/**
 * Get full game details from RAWG by ID.
 */
export async function getGameDetails(
  id: number,
): Promise<RawgGameResult | null> {
  const data = await rawgFetch<RawgGameDetail>(`games/${id}`);
  if (!data) return null;
  return mapGame(data);
}
