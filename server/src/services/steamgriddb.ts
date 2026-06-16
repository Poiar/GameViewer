import { config } from "../config.js";

const BASE = "https://www.steamgriddb.com/api/v2";

interface SgdbGame {
  id: number;
  name: string;
  types: string[];
  verified: boolean;
}

interface SgdbGrid {
  id: number;
  score: number;
  style: string;
  url: string;
  thumb: string;
  tags: string[];
  author: { name: string; steam64: string; avatar: string };
}

interface SgdbHero {
  id: number;
  score: number;
  style: string;
  url: string;
  thumb: string;
}

interface SgdbLogo {
  id: number;
  score: number;
  style: string;
  url: string;
  thumb: string;
}

async function sgdb<T>(path: string): Promise<T | null> {
  if (!config.sgdbApiKey) {
    console.warn("[SGDB] No API key configured — skipping request");
    return null;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${config.sgdbApiKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`[SGDB] HTTP ${res.status} for ${path}: ${text.slice(0, 200)}`);
    return null;
  }

  const json = await res.json();
  if (!json.success) return null;
  return json as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Search SteamGridDB for a game by name. Returns best match or null. */
export async function searchGame(
  title: string,
): Promise<SgdbGame | null> {
  // Clean the title: remove edition suffixes that hurt matching
  const cleaned = title
    .replace(/\s*\(HD\)\s*/gi, "")
    .replace(/\s*\(Remastered\)\s*/gi, "")
    .replace(/\s*\(GOTY\)\s*/gi, "")
    .replace(/\s*\(Definitive Edition\)\s*/gi, "")
    .replace(/\s*\(Enhanced\)\s*/gi, "")
    .replace(/\s*\(Demake\)\s*/gi, "")
    .trim();

  const encoded = encodeURIComponent(cleaned);
  const result = await sgdb<{ data: SgdbGame[] }>(
    `/search/autocomplete/${encoded}`,
  );
  if (!result?.data?.length) return null;

  // Pick best match: prefer verified, then exact name match, then first
  const exact = result.data.find(
    (g) => g.name.toLowerCase() === cleaned.toLowerCase(),
  );
  const verified = result.data.find((g) => g.verified);
  return exact ?? verified ?? result.data[0];
}

/** Fetch the best 600x900 cover grid for a SteamGridDB game ID. */
export async function getBestGrid(
  gameId: number,
): Promise<SgdbGrid | null> {
  const result = await sgdb<{ data: SgdbGrid[] }>(
    `/grids/game/${gameId}?dimensions=600x900&styles=alternate,white_logo,no_logo,material&limit=10`,
  );
  if (!result?.data?.length) return null;

  // Pick highest score
  return result.data.sort((a, b) => b.score - a.score)[0];
}

/** Fetch the best hero image for a SteamGridDB game ID. */
export async function getBestHero(
  gameId: number,
): Promise<SgdbHero | null> {
  const result = await sgdb<{ data: SgdbHero[] }>(
    `/heroes/game/${gameId}?styles=alternate,blurred&limit=5`,
  );
  if (!result?.data?.length) return null;
  return result.data.sort((a, b) => b.score - a.score)[0];
}

/** Fetch the best logo for a SteamGridDB game ID. */
export async function getBestLogo(
  gameId: number,
): Promise<SgdbLogo | null> {
  const result = await sgdb<{ data: SgdbLogo[] }>(
    `/logos/steam/${gameId}?limit=5`,
  );
  if (!result?.data?.length) return null;
  return result.data.sort((a, b) => b.score - a.score)[0];
}

/**
 * Full pipeline: search → get best 600x900 grid → return URL.
 * Returns the image URL or null if nothing found.
 */
export async function fetchCoverUrl(
  gameTitle: string,
): Promise<string | null> {
  const game = await searchGame(gameTitle);
  if (!game) return null;

  const grid = await getBestGrid(game.id);
  return grid?.url ?? null;
}
