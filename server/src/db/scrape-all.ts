// Long-running enrichment scraper — OpenCritic + HLTB.
// Runs for ~10 hours with random 10–60s delays between requests to avoid
// rate limiting and bot detection patterns.
//
// Both OpenCritic and HLTB use Playwright browser context (page.evaluate)
// so that Client Hints, cookies, and SPA auth are handled by the browser.
//
// Usage: npx tsx src/db/scrape-all.ts  (run from server/ directory)
//   Set MAX_HOURS env var to override duration (default 10).
//   Set SCRAPE_OC=false to skip OpenCritic.
//   Set SCRAPE_HLTB=false to skip HLTB.

import "dotenv/config";
import { db } from "./index.js";
import { masterGames } from "./schema.js";
import { eq, and, isNull, sql } from "drizzle-orm";
import { chromium } from "playwright";

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------

const MAX_HOURS = parseFloat(process.env.SCRAPE_MAX_HOURS ?? "10");
const SCRAPE_OC = process.env.SCRAPE_OC !== "false";
const SCRAPE_HLTB = process.env.SCRAPE_HLTB === "true"; // Cloudflare-blocked — opt-in only
const SCRAPE_STEAM = process.env.SCRAPE_STEAM !== "false";
const OC_BEARER = "R2tBRkdvUU9WSHpoUXpaSXVYa2g5cGU5NEFsWUgyeXQ=";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function delay(): Promise<void> {
  const ms = rand(10_000, 60_000);
  process.stdout.write(`  ⏳ ${Math.round(ms / 1000)}s... `);
  return new Promise((r) => setTimeout(r, ms));
}

// --------------------------------------------------------------------------
// Scrapers — both use page.evaluate() from browser context
// --------------------------------------------------------------------------

async function scrapeOpenCritic(page: any, title: string): Promise<{
  opencriticId?: number;
  criticScore?: number;
} | null> {
  try {
    return await page.evaluate(async ({ gameTitle, bearer }: { gameTitle: string; bearer: string }) => {
      const headers = {
        Authorization: `Bearer ${bearer}`,
        Accept: "application/json",
        Origin: "https://opencritic.com",
        Referer: "https://opencritic.com/search",
      };

      // Step 1: search
      const metaUrl = `https://api.opencritic.com/api/meta/search?criteria=${encodeURIComponent(gameTitle)}`;
      const metaRes = await fetch(metaUrl, { headers });
      if (!metaRes.ok) return null as any;
      const hits = (await metaRes.json()) as { id: number; name: string; relation: string; dist: number }[];
      const games = hits.filter((h: any) => h.relation === "game");
      if (!games.length) return null as any;

      const exact = games.find((g: any) => g.name.toLowerCase() === gameTitle.toLowerCase());
      const match = exact ?? games[0];

      // Step 2: rating
      const ratingUrl = `https://api.opencritic.com/api/ratings/game/${match.id}`;
      const ratingRes = await fetch(ratingUrl, {
        headers: {
          Authorization: `Bearer ${bearer}`,
          Accept: "application/json",
          Origin: "https://opencritic.com",
          Referer: "https://opencritic.com/",
        },
      });
      let score: number | undefined;
      if (ratingRes.ok) {
        const rating = (await ratingRes.json()) as { median?: number };
        score = rating.median;
      }
      return { opencriticId: match.id, criticScore: score } as any;
    }, { gameTitle: title, bearer: OC_BEARER }) as Promise<{ opencriticId?: number; criticScore?: number } | null>;
  } catch {
    return null;
  }
}

async function scrapeHltb(page: any, title: string): Promise<{
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
// Steam concurrent players (public API, no auth needed)
// --------------------------------------------------------------------------

async function scrapeSteam(steamAppId: number): Promise<{
  steamPlayers?: number;
  steamPlayersAt?: Date;
} | null> {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${steamAppId}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const players = json?.response?.player_count;
    if (typeof players !== "number") return null;
    return { steamPlayers: players, steamPlayersAt: new Date() };
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
  console.log(`[scrape-all] OC: ${SCRAPE_OC ? "ON" : "OFF"} | HLTB: ${SCRAPE_HLTB ? "ON" : "OFF"} | Steam: ${SCRAPE_STEAM ? "ON" : "OFF"}`);

  // Launch one browser, two tabs — one per site
  const browser = await chromium.launch({ headless: true });

  let ocPage: any = null;
  if (SCRAPE_OC) {
    ocPage = await browser.newPage();
    await ocPage.goto("https://opencritic.com", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 3000));
    console.log("[scrape-all] OpenCritic browser ready");
  }

  let hltbPage: any = null;
  if (SCRAPE_HLTB) {
    hltbPage = await browser.newPage();
    await hltbPage.goto("https://howlongtobeat.com", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 3000));
    console.log("[scrape-all] HLTB browser ready");
  }

  let ocCount = 0, hltbCount = 0, steamCount = 0;

  // ------------------------------------------------------------------
  // Build per-source conditions (evaluated once — static SQL fragments)
  // ------------------------------------------------------------------

  const enrichConditions: ReturnType<typeof isNull>[] = [];
  if (SCRAPE_OC) enrichConditions.push(isNull(masterGames.opencriticId));
  if (SCRAPE_HLTB) enrichConditions.push(isNull(masterGames.hltbId));

  const hasEnrich = enrichConditions.length > 0;
  const enrichWhere = hasEnrich
    ? enrichConditions.length === 1
      ? enrichConditions[0]
      : sql`(${sql.join(enrichConditions, sql`) OR (`)})`
    : null;

  const steamWhere = SCRAPE_STEAM
    ? and(
        sql`${masterGames.steamAppId} IS NOT NULL`,
        sql`(${masterGames.steamPlayers} IS NULL OR ${masterGames.steamPlayersAt} < NOW() - INTERVAL '1 hour')`,
      )
    : null;

  const hasSteam = steamWhere !== null;

  if (!hasEnrich && !hasSteam) {
    console.log("[scrape-all] No scrapers enabled — exiting.");
    await browser.close();
    process.exit(0);
  }

  // ------------------------------------------------------------------
  // Main loop — two independent passes per iteration
  // ------------------------------------------------------------------

  while (Date.now() < deadline) {
    let didWork = false;

    // ── Enrichment pass (OC / HLTB) ──────────────────────────────

    if (hasEnrich) {
      const games = await db
        .select({
          id: masterGames.id,
          title: masterGames.title,
          opencriticId: masterGames.opencriticId,
          hltbId: masterGames.hltbId,
        })
        .from(masterGames)
        .where(enrichWhere!)
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (games.length) {
        const g = games[0];
        const sets: Record<string, unknown> = { updatedAt: new Date() };
        let label = "";

        if (SCRAPE_OC && !g.opencriticId && ocPage) {
          process.stdout.write(`[OC] "${g.title.slice(0, 40)}"`);
          await delay();
          const oc = await scrapeOpenCritic(ocPage, g.title);
          if (oc?.opencriticId) {
            sets.opencriticId = oc.opencriticId;
            if (oc.criticScore != null) sets.criticScore = oc.criticScore;
            ocCount++;
            label += ` OC✓${oc.criticScore != null ? "(" + oc.criticScore + ")" : ""}`;
          } else {
            label += " OC✗";
          }
        }

        if (SCRAPE_HLTB && !g.hltbId && hltbPage) {
          process.stdout.write(`[HLTB] "${g.title.slice(0, 40)}"`);
          await delay();
          const hltb = await scrapeHltb(hltbPage, g.title);
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
          didWork = true;
        }
        console.log(`${label}  [OC:${ocCount} HLTB:${hltbCount} ST:${steamCount}]`);
      }
    }

    // ── Steam pass (concurrent players via public API) ────────────

    if (hasSteam) {
      const games = await db
        .select({
          id: masterGames.id,
          title: masterGames.title,
          steamAppId: masterGames.steamAppId,
        })
        .from(masterGames)
        .where(steamWhere)
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (games.length) {
        const g = games[0];
        process.stdout.write(`[ST] "${g.title.slice(0, 40)}"`);
        const st = await scrapeSteam(g.steamAppId!);
        if (st?.steamPlayers != null) {
          await db
            .update(masterGames)
            .set({
              steamPlayers: st.steamPlayers,
              steamPlayersAt: st.steamPlayersAt as any,
              updatedAt: new Date(),
            } as any)
            .where(eq(masterGames.id, g.id));
          steamCount++;
          didWork = true;
          console.log(` Steam✓(${st.steamPlayers})  [OC:${ocCount} HLTB:${hltbCount} ST:${steamCount}]`);
        } else {
          console.log(` Steam✗  [OC:${ocCount} HLTB:${hltbCount} ST:${steamCount}]`);
        }
      }
    }

    // ── Progress heartbeat ────────────────────────────────────────

    if (!didWork) {
      // Enrichment is drained and Steam is caught up — brief nap
      await new Promise((r) => setTimeout(r, 5_000));
    }

    if (Date.now() >= deadline) break;
    const remaining = Math.round((deadline - Date.now()) / 1000 / 60);
    if (remaining % 15 === 0 && didWork) {
      console.log(`  ⏱ ${remaining}min remaining  [OC:${ocCount} HLTB:${hltbCount} ST:${steamCount}]`);
    }
  }

  console.log(`\n[scrape-all] Finished! OC:${ocCount} HLTB:${hltbCount} Steam:${steamCount}`);
  await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[scrape-all] Fatal:", err);
  process.exit(1);
});
