// Enrichment via direct HTML/API scraping (no RapidAPI dependency).
// OpenCritic: public API at api.opencritic.com — no auth needed.
// HLTB: requires browser fingerprinting; use via Playwright or skip.
//
// Rate limiting: random 10-60s delays between requests to avoid bot flags.

import { config } from "../config.js";

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function delay(ms?: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms ?? rand(10_000, 60_000)));
}

// ---------------------------------------------------------------------------
// OpenCritic — public API (no auth required)
// ---------------------------------------------------------------------------

interface OcSearchHit {
  id: number;
  name: string;
  dist: number;
  relation: "game" | "critic" | "publication";
}

interface OcRating {
  _id: number;
  median: number;
  count: number;
}

export async function searchOpenCriticScrape(title: string): Promise<{
  id: number;
  name: string;
  score?: number;
  reviewCount?: number;
} | null> {
  try {
    const q = encodeURIComponent(title);
    const metaUrl = `https://api.opencritic.com/api/meta/search?criteria=${q}`;
    const metaRes = await fetch(metaUrl, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!metaRes.ok) return null;
    const hits = (await metaRes.json()) as OcSearchHit[];
    const games = hits.filter((h) => h.relation === "game");
    if (!games.length) return null;

    // Prefer exact title match, fall back to closest
    const exact = games.find((g) => g.name.toLowerCase() === title.toLowerCase());
    const match = exact ?? games[0];
    if (!match) return null;

    // Get rating
    const ratingUrl = `https://api.opencritic.com/api/ratings/game/${match.id}`;
    const ratingRes = await fetch(ratingUrl, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!ratingRes.ok) return { id: match.id, name: match.name };
    const rating = (await ratingRes.json()) as OcRating;
    return {
      id: match.id,
      name: match.name,
      score: rating.median ?? undefined,
      reviewCount: rating.count ?? undefined,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// HLTB — requires browser fingerprinting via Playwright page.evaluate()
// The init → search flow works from a real browser but not from node fetch.
// ---------------------------------------------------------------------------

export interface HltbScrapeResult {
  id: number;
  name: string;
  mainTime?: number;
}

/**
 * Run HLTB search inside a Playwright page context (which has proper
 * browser fingerprinting). The caller must provide a Playwright `page` object
 * that is already navigated to https://howlongtobeat.com.
 */
export async function searchHltbScrape(
  page: { evaluate: (fn: Function, arg: any) => Promise<any> },
  title: string,
): Promise<HltbScrapeResult | null> {
  try {
    return await page.evaluate(async (gameTitle: string) => {
      const headers = {
        Referer: "https://howlongtobeat.com/",
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // Init
      const initRes = await fetch(`https://howlongtobeat.com/api/bleed/init?t=${Date.now()}`, { headers });
      if (!initRes.ok) return null as any;
      const initData = (await initRes.json()) as { token?: string; hpKey?: string; hpVal?: string };
      if (!initData.token) return null as any;

      const body: Record<string, unknown> = {
        searchType: "games",
        searchTerms: gameTitle.split(" "),
        searchPage: 1,
        size: 5,
        searchOptions: {
          games: {
            userId: 0, platform: "", sortCategory: "popular", rangeCategory: "main",
            rangeTime: { min: null, max: null },
            gameplay: { perspective: "", flow: "", genre: "", difficulty: "" },
            rangeYear: { min: "", max: "" }, modifier: "",
          },
          users: { sortCategory: "postcount" },
          lists: { sortCategory: "follows" },
          filter: "", sort: 0, randomizer: 0,
        },
        useCache: true,
      };
      if (initData.hpKey) body[initData.hpKey] = initData.hpVal;

      const searchRes = await fetch("https://howlongtobeat.com/api/bleed", {
        method: "POST",
        headers: { ...headers, "x-auth-token": initData.token, ...(initData.hpKey && initData.hpVal ? { "x-hp-key": initData.hpKey, "x-hp-val": initData.hpVal } : {}) },
        body: JSON.stringify(body),
      });
      if (!searchRes.ok) return null as any;
      const json = (await searchRes.json()) as any;
      const data = json.data as any[];
      if (!data?.length) return null as any;

      const exact = data.find((g: any) => g.game_name?.toLowerCase() === gameTitle.toLowerCase());
      const match = exact ?? data[0];
      return {
        id: match.game_id as number,
        name: match.game_name as string,
        mainTime: match.comp_main ? Math.round((match.comp_main as number) / 3600) : undefined,
      } as any;
    }, title) as Promise<HltbScrapeResult | null>;
  } catch {
    return null;
  }
}
