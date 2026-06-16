// Game enrichment from external sources: IGDB, OpenCritic, HowLongToBeat
import { config } from "../config.js";

// ---------------------------------------------------------------------------
// IGDB (Twitch API v4)
// ---------------------------------------------------------------------------

interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  first_release_date?: number;
  cover?: { id: number; url: string };
  genres?: { id: number; name: string }[];
}

async function igdbQuery<T>(endpoint: string, body: string): Promise<T | null> {
  if (!config.igdbClientId || !config.igdbAccessToken) return null;
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": config.igdbClientId,
      "Authorization": `Bearer ${config.igdbAccessToken}`,
      "Content-Type": "text/plain",
    },
    body,
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function searchIgdb(title: string): Promise<IgdbGame | null> {
  const results = await igdbQuery<IgdbGame[]>("games", `search "${title}"; fields name,slug,summary,first_release_date,cover.url,genres.name; limit 3;`);
  if (!results?.length) return null;
  // Best match: exact title match preferred
  const exact = results.find((g) => g.name.toLowerCase() === title.toLowerCase());
  return exact ?? results[0];
}

// ---------------------------------------------------------------------------
// OpenCritic
// ---------------------------------------------------------------------------

interface OpenCriticResult {
  id: number;
  name: string;
  score?: number;
  reviewCount?: number;
  url?: string;
}

export async function searchOpenCritic(title: string): Promise<OpenCriticResult | null> {
  try {
    const res = await fetch(`https://api.opencritic.com/api/game/search?criteria=${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as any[];
    if (!data?.length) return null;
    const exact = data.find((g: any) => g.name?.toLowerCase() === title.toLowerCase());
    const match = exact ?? data[0];
    return {
      id: match.id,
      name: match.name,
      score: match.topCriticScore != null ? Math.round(match.topCriticScore) : undefined,
      reviewCount: match.reviewCount,
      url: `https://opencritic.com/game/${match.id}`,
    };
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// HowLongToBeat
// ---------------------------------------------------------------------------

interface HltbResult {
  id: number;
  name: string;
  mainTime?: number; // hours
}

export async function searchHltb(title: string): Promise<HltbResult | null> {
  try {
    const res = await fetch("https://howlongtobeat.com/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Referer": "https://howlongtobeat.com" },
      body: JSON.stringify({
        searchType: "games",
        searchTerms: title.split(" "),
        searchPage: 1,
        size: 5,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const data = json.data;
    if (!data?.length) return null;
    const exact = data.find((g: any) => g.game_name?.toLowerCase() === title.toLowerCase());
    const match = exact ?? data[0];
    return {
      id: match.game_id,
      name: match.game_name,
      mainTime: match.comp_main ? Math.round(match.comp_main / 3600) : undefined,
    };
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Full enrichment pipeline
// ---------------------------------------------------------------------------

export interface EnrichmentResult {
  igdbId?: number;
  igdbUrl?: string;
  opencriticId?: number;
  opencriticScore?: number;
  hltbId?: number;
  hltbTime?: number;
}

export async function enrichGame(title: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {};

  // IGDB
  const igdb = await searchIgdb(title);
  if (igdb) {
    result.igdbId = igdb.id;
    result.igdbUrl = `https://www.igdb.com/games/${igdb.slug}`;
  }

  // OpenCritic (only makes sense for games with reviews)
  // Skip for very old games or obscure titles
  const oc = await searchOpenCritic(title);
  if (oc) {
    result.opencriticId = oc.id;
    result.opencriticScore = oc.score;
  }

  // HLTB
  const hltb = await searchHltb(title);
  if (hltb) {
    result.hltbId = hltb.id;
    result.hltbTime = hltb.mainTime;
  }

  return result;
}
