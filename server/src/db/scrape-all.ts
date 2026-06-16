// Long-running enrichment scraper — OpenCritic + HLTB.
// Runs for ~10 hours with random 10–60s delays between requests to avoid
// rate limiting and bot detection patterns.
//
// OpenCritic: headless fetch with SPA Bearer token.
// HLTB: Playwright browser context (requires Client Hints).
//
// Usage: npx tsx server/src/db/scrape-all.ts
//   Set MAX_HOURS env var to override duration (default 10).
//   Set SCRAPE_OC=false to skip OpenCritic.
//   Set SCRAPE_HLTB=false to skip HLTB.

import "dotenv/config"; // loads server/.env from cwd — run from server/ or set DOTENV_CONFIG_PATH
import { db } from "./index.js";
import { masterGames } from "./schema.js";
import { eq, and, isNull, sql } from "drizzle-orm";
import { chromium } from "playwright";

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------

const MAX_HOURS = parseFloat(process.env.SCRAPE_MAX_HOURS ?? "10");
const SCRAPE_OC = process.env.SCRAPE_OC !== "false";
const SCRAPE_HLTB = process.env.SCRAPE_HLTB !== "false";
const OC_BEARER = "Bearer R2tBRkdvUU9WSHpoUXpaSXVYa2g5cGU5NEFsWUgyeXQ=";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function delay(): Promise<void> {
  const ms = rand(10_000, 60_000);
  process.stdout.write(`  ⏳ ${Math.round(ms / 1000)}s... `);
  return new Promise((r) => setTimeout(r, ms));
}

// --------------------------------------------------------------------------
// OpenCritic scraper (headless)
// --------------------------------------------------------------------------

async function scrapeOpenCritic(title: string): Promise<{
  opencriticId?: number;
  criticScore?: number;
} | null> {
  try {
    const q = encodeURIComponent(title);
    const metaRes = await fetch(`https://api.opencritic.com/api/meta/search?criteria=${q}`, {
      headers: { Authorization: OC_BEARER, "User-Agent": UA, Accept: "application/json", Origin: "https://opencritic.com", Referer: "https://opencritic.com/search" },
    });
    if (!metaRes.ok) return null;
    const hits = (await metaRes.json()) as { id: number; name: string; relation: string; dist: number }[];
    const games = hits.filter((h) => h.relation === "game");
    if (!games.length) return null;
    const exact = games.find((g) => g.name.toLowerCase() === title.toLowerCase());
    const match = exact ?? games[0];

    const ratingRes = await fetch(`https://api.opencritic.com/api/ratings/game/${match.id}`, {
      headers: { Authorization: OC_BEARER, "User-Agent": UA, Accept: "application/json", Origin: "https://opencritic.com", Referer: "https://opencritic.com/" },
    });
    let score: number | undefined;
    if (ratingRes.ok) {
      const rating = (await ratingRes.json()) as { median?: number };
      score = rating.median;
    }
    return { opencriticId: match.id, criticScore: score };
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// HLTB scraper (via Playwright browser — requires Client Hints)
// --------------------------------------------------------------------------

async function scrapeHltbBrowser(page: any, title: string): Promise<{
  hltbId?: number;
  hltbTime?: number;
} | null> {
  try {
    return await page.evaluate(async (gameTitle: string) => {
      const initRes = await fetch(`https://howlongtobeat.com/api/bleed/init?t=${Date.now()}`, {
        headers: { Referer: "https://howlongtobeat.com/", Accept: "application/json" },
      });
      if (!initRes.ok) return null as any;
      const initData = (await initRes.json()) as { token?: string; hpKey?: string; hpVal?: string };
      if (!initData.token) return null as any;

      const body: Record<string, unknown> = {
        searchType: "games", searchTerms: gameTitle.split(" "), searchPage: 1, size: 5,
        searchOptions: {
          games: { userId: 0, platform: "", sortCategory: "popular", rangeCategory: "main",
            rangeTime: { min: null, max: null },
            gameplay: { perspective: "", flow: "", genre: "", difficulty: "" },
            rangeYear: { min: "", max: "" }, modifier: "" },
          users: { sortCategory: "postcount" }, lists: { sortCategory: "follows" },
          filter: "", sort: 0, randomizer: 0,
        },
        useCache: true,
      };
      if (initData.hpKey) body[initData.hpKey] = initData.hpVal;

      const searchRes = await fetch("https://howlongtobeat.com/api/bleed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", Referer: "https://howlongtobeat.com/",
          Accept: "application/json", "x-auth-token": initData.token,
          ...(initData.hpKey && initData.hpVal ? { "x-hp-key": initData.hpKey, "x-hp-val": initData.hpVal } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!searchRes.ok) return null as any;
      const json = (await searchRes.json()) as any;
      if (!json.data?.length) return null as any;
      const exact = json.data.find((g: any) => g.game_name?.toLowerCase() === gameTitle.toLowerCase());
      const match = exact ?? json.data[0];
      return {
        hltbId: match.game_id as number,
        hltbTime: match.comp_main ? Math.round((match.comp_main as number) / 3600) : undefined,
      } as any;
    }, title) as Promise<{ hltbId?: number; hltbTime?: number } | null>;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// Main loop
// --------------------------------------------------------------------------

async function main() {
  const deadline = Date.now() + MAX_HOURS * 3600 * 1000;
  console.log(`[scrape-all] Starting — max ${MAX_HOURS}h, deadline ${new Date(deadline).toLocaleTimeString()}`);
  console.log(`[scrape-all] OpenCritic: ${SCRAPE_OC ? "ON" : "OFF"} | HLTB: ${SCRAPE_HLTB ? "ON" : "OFF"}`);

  let browser: any = null;
  let page: any = null;

  if (SCRAPE_HLTB) {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    // Navigate once to establish session/cookies/Client Hints
    await page.goto("https://howlongtobeat.com", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 3000));
    console.log("[scrape-all] HLTB browser ready");
  }

  let ocCount = 0, hltbCount = 0, skipped = 0;

  while (Date.now() < deadline) {
    // Fetch a batch of un-enriched games (randomize to avoid patterns)
    const games = await db
      .select({ id: masterGames.id, title: masterGames.title, opencriticId: masterGames.opencriticId, hltbId: masterGames.hltbId })
      .from(masterGames)
      .where(
        SCRAPE_OC && SCRAPE_HLTB ? and(isNull(masterGames.opencriticId), isNull(masterGames.hltbId)) :
        SCRAPE_OC ? isNull(masterGames.opencriticId) :
        isNull(masterGames.hltbId),
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!games.length) {
      console.log("\n[scrape-all] No more games to enrich — done!");
      break;
    }

    const g = games[0];
    const sets: Record<string, unknown> = { updatedAt: new Date() };
    let label = "";

    if (SCRAPE_OC && !g.opencriticId) {
      process.stdout.write(`[OC] "${g.title.slice(0, 40)}"`);
      await delay();
      const oc = await scrapeOpenCritic(g.title);
      if (oc?.opencriticId) {
        sets.opencriticId = oc.opencriticId;
        if (oc.criticScore != null) sets.criticScore = oc.criticScore;
        ocCount++;
        label += ` OC✓${oc.criticScore != null ? "(" + oc.criticScore + ")" : ""}`;
      } else {
        label += " OC✗";
      }
    }

    if (SCRAPE_HLTB && page && !g.hltbId) {
      process.stdout.write(`[HLTB] "${g.title.slice(0, 40)}"`);
      await delay();
      const hltb = await scrapeHltbBrowser(page, g.title);
      if (hltb?.hltbId) {
        sets.hltbId = hltb.hltbId;
        if (hltb.hltbTime != null) sets.hltbTime = hltb.hltbTime;
        hltbCount++;
        label += ` HLTB✓${hltb.hltbTime != null ? "(" + hltb.hltbTime + "h)" : ""}`;
      } else {
        label += " HLTB✗";
      }
    }

    if (Object.keys(sets).length > 1) {
      await db.update(masterGames).set(sets as any).where(eq(masterGames.id, g.id));
    }

    const remaining = Math.round((deadline - Date.now()) / 1000 / 60);
    console.log(`${label}  [OC:${ocCount} HLTB:${hltbCount}] ${remaining}min left`);
  }

  console.log(`\n[scrape-all] Finished! OC:${ocCount} HLTB:${hltbCount} skipped:${skipped}`);
  if (browser) await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[scrape-all] Fatal:", err);
  process.exit(1);
});
