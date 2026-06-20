// Enrichment via direct scraping — OpenCritic + HLTB.
// Both can run headless (Node.js fetch) or via Playwright browser context.
//
// OpenCritic: public API at api.opencritic.com — works headless with SPA Bearer token.
// HLTB: requires browser Client Hints — use page.evaluate() from a Playwright page
//   that has visited howlongtobeat.com.
//
// Rate limiting: random 10-60s delays between requests to avoid bot flags.
// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function delay(ms) {
    return new Promise((r) => setTimeout(r, ms ?? rand(10_000, 60_000)));
}
// ---------------------------------------------------------------------------
// OpenCritic
// ---------------------------------------------------------------------------
const OC_BEARER = "R2tBRkdvUU9WSHpoUXpaSXVYa2g5cGU5NEFsWUgyeXQ=";
/**
 * OpenCritic headless — uses SPA Bearer token, works from Node.js fetch.
 */
export async function searchOpenCritic(title) {
    try {
        const headers = {
            Authorization: `Bearer ${OC_BEARER}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
            Origin: "https://opencritic.com",
            Referer: "https://opencritic.com/search",
        };
        const q = encodeURIComponent(title);
        const metaRes = await fetch(`https://api.opencritic.com/api/meta/search?criteria=${q}`, { headers });
        if (!metaRes.ok)
            return null;
        const hits = (await metaRes.json());
        const games = hits.filter((h) => h.relation === "game");
        if (!games.length)
            return null;
        const exact = games.find((g) => g.name.toLowerCase() === title.toLowerCase());
        const match = exact ?? games[0];
        const ratingRes = await fetch(`https://api.opencritic.com/api/ratings/game/${match.id}`, {
            headers: { ...headers, Referer: "https://opencritic.com/" },
        });
        let score;
        let reviewCount;
        if (ratingRes.ok) {
            const rating = (await ratingRes.json());
            score = rating.median;
            reviewCount = rating.count;
        }
        return { id: match.id, name: match.name, score, reviewCount };
    }
    catch {
        return null;
    }
}
/**
 * OpenCritic via Playwright browser context — same API calls but executed
 * inside a page that has visited opencritic.com (inherits cookies, SPA auth).
 * The caller must provide a page already navigated to https://opencritic.com.
 */
export async function searchOpenCriticBrowser(page, title) {
    try {
        return await page.evaluate(async ({ gameTitle, bearer }) => {
            const h = {
                Authorization: `Bearer ${bearer}`,
                Accept: "application/json",
                Origin: "https://opencritic.com",
                Referer: "https://opencritic.com/search",
            };
            const metaUrl = `https://api.opencritic.com/api/meta/search?criteria=${encodeURIComponent(gameTitle)}`;
            const metaRes = await fetch(metaUrl, { headers: h });
            if (!metaRes.ok)
                return null;
            const hits = (await metaRes.json());
            const games = hits.filter((x) => x.relation === "game");
            if (!games.length)
                return null;
            const exact = games.find((x) => x.name.toLowerCase() === gameTitle.toLowerCase());
            const match = exact ?? games[0];
            const ratingRes = await fetch(`https://api.opencritic.com/api/ratings/game/${match.id}`, {
                headers: { ...h, Referer: "https://opencritic.com/" },
            });
            let score;
            if (ratingRes.ok) {
                const rating = (await ratingRes.json());
                score = rating.median;
            }
            return { opencriticId: match.id, criticScore: score };
        }, { gameTitle: title, bearer: OC_BEARER });
    }
    catch {
        return null;
    }
}
/**
 * Run HLTB search inside a Playwright page context (which has proper
 * browser fingerprinting). The caller must provide a Playwright `page` object
 * that is already navigated to https://howlongtobeat.com.
 */
export async function searchHltbBrowser(page, title) {
    try {
        return await page.evaluate(async (gameTitle) => {
            const initRes = await fetch(`https://howlongtobeat.com/api/bleed/init?t=${Date.now()}`, {
                headers: { Referer: "https://howlongtobeat.com/", Accept: "application/json" },
            });
            if (!initRes.ok)
                return null;
            const initData = (await initRes.json());
            if (!initData.token)
                return null;
            const body = {
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
            if (initData.hpKey)
                body[initData.hpKey] = initData.hpVal;
            const searchRes = await fetch("https://howlongtobeat.com/api/bleed", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", Referer: "https://howlongtobeat.com/",
                    Accept: "application/json", "x-auth-token": initData.token,
                    ...(initData.hpKey && initData.hpVal ? { "x-hp-key": initData.hpKey, "x-hp-val": initData.hpVal } : {}),
                },
                body: JSON.stringify(body),
            });
            if (!searchRes.ok)
                return null;
            const json = (await searchRes.json());
            if (!json.data?.length)
                return null;
            const exact = json.data.find((g) => g.game_name?.toLowerCase() === gameTitle.toLowerCase());
            const match = exact ?? json.data[0];
            return {
                id: match.game_id,
                name: match.game_name,
                mainTime: match.comp_main ? Math.round(match.comp_main / 3600) : undefined,
            };
        }, title);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=scrape-enrichment.js.map