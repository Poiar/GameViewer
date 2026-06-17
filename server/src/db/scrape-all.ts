// Long-running enrichment scraper — OpenCritic + HLTB + IGDB + Steam.
// Runs for ~10 hours with random 10–60s delays between requests to avoid
// rate limiting and bot detection patterns.
//
// OpenCritic uses page.evaluate() with a Bearer token for API calls.
// HLTB intercepts the page's own API responses after a UI search.
// IGDB is called directly (Twitch API).
// Steam calls the public ISteamUserStats endpoint.
//
// Usage: npx tsx src/db/scrape-all.ts  (run from server/ directory)
//   Set MAX_HOURS env var to override duration (default 10).
//   Set SCRAPE_OC=false to skip OpenCritic.
//   Set SCRAPE_HLTB=false to skip HLTB.
//   Set SCRAPE_STEAM=false to skip Steam.

import "dotenv/config";
import { db } from "./index.js";
import { masterGames } from "./schema.js";
import { eq, and, isNull, sql } from "drizzle-orm";
import { chromium } from "playwright";
import { searchIgdb, getIgdbCoverUrl } from "../services/enrichment.js";

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------

const MAX_HOURS = parseFloat(process.env.SCRAPE_MAX_HOURS ?? "10");
const SCRAPE_OC = process.env.SCRAPE_OC !== "false";
const SCRAPE_HLTB = process.env.SCRAPE_HLTB === "true"; // Cloudflare-blocked — opt-in
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
    // Navigate to a fresh HLTB page so Cloudflare cookies are current
    await page.goto("https://howlongtobeat.com/", { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForTimeout(2500);

    // Eavesdrop on the page's own /api/bleed POST responses.
    // The page's JS has a valid Cloudflare clearance, so its API calls succeed.
    const captured: Promise<any> = new Promise((resolve) => {
      let settled = false;
      const done = (data: any) => { if (settled) return; settled = true; resolve(data); };
      const timer = setTimeout(() => done(null), 10_000);

      const handler = (resp: any) => {
        if (settled) return;
        if (!resp.url().includes("/api/bleed")) return;
        if (resp.request().method() !== "POST") return;
        resp.json()
          .then((j: any) => { if (j?.data?.length) done(j); })
          .catch(() => {});
      };

      page.on("response", handler);

      // Trigger the search in the page UI
      page.locator('input[type="text"]').first()
        .fill(title)
        .then(() => page.keyboard.press("Enter"))
        .catch(() => done(null));

      // Cleanup after resolution
      captured.then(() => {
        clearTimeout(timer);
        page.off("response", handler);
      });
    });

    const json = await captured;
    if (!json?.data?.length) return null;

    const exact = json.data.find(
      (g: any) => g.game_name?.toLowerCase() === title.toLowerCase(),
    );
    const match = exact ?? json.data[0];
    return {
      hltbId: match.game_id as number,
      hltbTime: match.comp_main ? Math.round((match.comp_main as number) / 3600) : undefined,
    };
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

  let ocCount = 0, hltbCount = 0, igdbCount = 0, steamCount = 0;

  // Track repeated OC failures — blacklist after 3 consecutive misses
  const ocFails = new Map<number, number>();
  const ocBlacklist = new Set<number>();
  const OC_MAX_FAILS = 3;

  // ------------------------------------------------------------------
  // Build per-source conditions (evaluated once — static SQL fragments)
  // ------------------------------------------------------------------

  const enrichConditions: ReturnType<typeof isNull>[] = [];
  if (SCRAPE_OC) enrichConditions.push(isNull(masterGames.opencriticId));
  if (SCRAPE_HLTB) enrichConditions.push(isNull(masterGames.hltbId));
  // Always include IGDB-missing games (no API key needed — uses Twitch creds)
  enrichConditions.push(isNull(masterGames.igdbId));

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
          igdbId: masterGames.igdbId,
          summary: masterGames.summary,
          coverImageUrl: masterGames.coverImageUrl,
          screenshots: masterGames.screenshots,
        })
        .from(masterGames)
        .where(
          ocBlacklist.size
            ? and(enrichWhere!, sql`${masterGames.id} NOT IN (${[...ocBlacklist].join(",")})`)
            : enrichWhere!
        )
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
            ocFails.delete(g.id);
            label += ` OC✓${oc.criticScore != null ? "(" + oc.criticScore + ")" : ""}`;
          } else {
            const f = (ocFails.get(g.id) ?? 0) + 1;
            ocFails.set(g.id, f);
            if (f >= OC_MAX_FAILS) {
              ocBlacklist.add(g.id);
              label += ` OC✗🚫`;
            } else {
              label += ` OC✗(${f})`;
            }
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

        // IGDB enrichment (Twitch API — no browser needed)
        if (!g.igdbId) {
          const igdb = await searchIgdb(g.title);
          if (igdb) {
            sets.igdbId = igdb.id;
            if (igdb.summary && !g.summary) sets.summary = igdb.summary;
            if (!g.coverImageUrl) {
              const cover = getIgdbCoverUrl(igdb.cover?.url);
              if (cover) sets.coverImageUrl = cover;
            }
            sets.gameModes = igdb.game_modes?.map((m) => m.name).filter(Boolean) ?? [];
            sets.playerPerspectives = igdb.player_perspectives?.map((p) => p.name).filter(Boolean) ?? [];
            // Age rating
            const ar = igdb.age_ratings?.[0];
            if (ar) {
              const catMap: Record<number, string> = { 1: "ESRB", 2: "PEGI" };
              const ratingMap: Record<number, string> = { 6: "RP", 7: "EC", 8: "E", 9: "E10+", 10: "T", 11: "M", 12: "AO" };
              sets.ageRating = `${catMap[ar.category] ?? ""} ${ratingMap[ar.rating] ?? ar.rating}`.trim();
            }
            // Trailer
            if (igdb.videos?.length) {
              sets.trailerUrl = `https://www.youtube.com/watch?v=${igdb.videos[0].video_id}`;
            }
            // Franchise
            if (igdb.franchise?.name) sets.franchise = igdb.franchise.name;
            // Steam AppID
            const steamExt = igdb.external_games?.find((e) => e.external_game_source === 1);
            if (steamExt) sets.steamAppId = parseInt(steamExt.uid, 10) || undefined;
            // Screenshots
            if (!(g.screenshots as any)?.length && igdb.screenshots?.length) {
              sets.screenshots = igdb.screenshots
                .map((s) => s.url?.startsWith("//") ? "https:" + s.url.replace("t_thumb", "t_screenshot_big") : s.url)
                .filter((u): u is string => !!u && !u.includes("nocover"));
            }
            igdbCount++;
            label += " IGDB✓";
          }
        }

        if (Object.keys(sets).length > 1) {
          await db.update(masterGames).set(sets as any).where(eq(masterGames.id, g.id));
          didWork = true;
        }
        console.log(`${label}  [OC:${ocCount} HLTB:${hltbCount} IGDB:${igdbCount} ST:${steamCount}]`);
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
          console.log(` Steam✓(${st.steamPlayers})  [OC:${ocCount} HLTB:${hltbCount} IGDB:${igdbCount} ST:${steamCount}]`);
        } else {
          console.log(` Steam✗  [OC:${ocCount} HLTB:${hltbCount} IGDB:${igdbCount} ST:${steamCount}]`);
        }
      }
    }

    // ── Progress heartbeat ────────────────────────────────────────

    if (!didWork) {
      // Both pools empty — enrichment is done, Steam within its 1h TTL.
      // Exit cleanly rather than spinning. Restart scraper later if needed.
      console.log("\n[scrape-all] All enrichment caught up + Steam refreshed. Nothing left — exiting.");
      break;
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
