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
  screenshots?: { id: number; url: string }[];
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

export function getIgdbCoverUrl(coverUrl: string | undefined): string | undefined {
  if (!coverUrl) return undefined;
  // IGDB cover URLs: //images.igdb.com/igdb/image/upload/t_thumb/co2r2r.jpg
  // Replace t_thumb with t_cover_big for high-res
  return coverUrl.startsWith("//") ? "https:" + coverUrl.replace("t_thumb", "t_cover_big") : coverUrl;
}

export async function searchIgdb(title: string): Promise<IgdbGame | null> {
  const results = await igdbQuery<IgdbGame[]>("games", `search "${title}"; fields name,slug,summary,first_release_date,cover.url,genres.name,screenshots.url; limit 3;`);
  if (!results?.length) return null;
  const exact = results.find((g) => g.name.toLowerCase() === title.toLowerCase());
  return exact ?? results[0];
}

// ---------------------------------------------------------------------------
// OpenCritic via RapidAPI — note: the gateway returns 500 errors (June 2026).
// If this persists, consider scraping opencritic.com/search directly.
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
    if (!config.rapidApiKey) return null;
    const res = await fetch(`https://opencritic-api.p.rapidapi.com/game/search?criteria=${encodeURIComponent(title)}`, {
      headers: {
        "X-RapidAPI-Key": config.rapidApiKey,
        "X-RapidAPI-Host": "opencritic-api.p.rapidapi.com",
      },
    });
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
    const hltbHeaders = {
      "Referer": "https://howlongtobeat.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Origin": "https://howlongtobeat.com",
    };

    // Step 1: Get auth token from init endpoint
    const initRes = await fetch(`https://howlongtobeat.com/api/bleed/init?t=${Date.now()}`, {
      headers: hltbHeaders,
    });
    if (!initRes.ok) return null;
    const initData = (await initRes.json()) as { token?: string; hpKey?: string; hpVal?: string };
    if (!initData.token) return null;

    // Step 2: Search with the token
    const searchBody: Record<string, unknown> = {
      searchType: "games",
      searchTerms: title.split(" "),
      searchPage: 1,
      size: 5,
      searchOptions: {
        games: { userId: 0, platform: "", sortCategory: "popular", rangeCategory: "main",
          rangeTime: { min: null, max: null },
          gameplay: { perspective: "", flow: "", genre: "", difficulty: "" },
          rangeYear: { min: "", max: "" }, modifier: "" },
        users: { sortCategory: "postcount" },
        lists: { sortCategory: "follows" },
        filter: "", sort: 0, randomizer: 0,
      },
      useCache: true,
    };
    if (initData.hpKey) { searchBody[initData.hpKey] = initData.hpVal; }

    const res = await fetch("https://howlongtobeat.com/api/bleed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...hltbHeaders,
        "x-auth-token": initData.token,
        ...(initData.hpKey && initData.hpVal ? {
          "x-hp-key": initData.hpKey,
          "x-hp-val": initData.hpVal,
        } : {}),
      },
      body: JSON.stringify(searchBody),
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
  igdbCoverUrl?: string;
  igdbSummary?: string;
  igdbGenres?: string[];
  igdbScreenshots?: string[];
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
    result.igdbCoverUrl = getIgdbCoverUrl(igdb.cover?.url);
    result.igdbSummary = igdb.summary ?? undefined;
    result.igdbGenres = igdb.genres?.map((g) => g.name).filter((n): n is string => !!n) as string[] | undefined;
    result.igdbScreenshots = igdb.screenshots
      ?.map((s) => s.url?.startsWith("//") ? "https:" + s.url.replace("t_thumb", "t_screenshot_big") : s.url)
      .filter((u): u is string => !!u && !u.includes("nocover"));
  }

  // OpenCritic
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
