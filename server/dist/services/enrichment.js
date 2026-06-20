// Game enrichment from external sources: IGDB, OpenCritic, HowLongToBeat
import { config } from "../config.js";
async function igdbQuery(endpoint, body) {
    if (!config.igdbClientId || !config.igdbAccessToken)
        return null;
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
        method: "POST",
        headers: {
            "Client-ID": config.igdbClientId,
            "Authorization": `Bearer ${config.igdbAccessToken}`,
            "Content-Type": "text/plain",
        },
        body,
    });
    if (!res.ok)
        return null;
    return (await res.json());
}
export function getIgdbCoverUrl(coverUrl) {
    if (!coverUrl)
        return undefined;
    // IGDB cover URLs: //images.igdb.com/igdb/image/upload/t_thumb/co2r2r.jpg
    // Replace t_thumb with t_cover_big for high-res
    return coverUrl.startsWith("//") ? "https:" + coverUrl.replace("t_thumb", "t_cover_big") : coverUrl;
}
export async function searchIgdb(title) {
    const results = await igdbQuery("games", `search "${title}"; fields name,slug,summary,first_release_date,cover.url,genres.name,screenshots.url,game_modes.name,player_perspectives.name,age_ratings.category,age_ratings.rating,videos.video_id,videos.name,franchise.name,external_games.uid,external_games.external_game_source,total_rating,total_rating_count; limit 3;`);
    if (!results?.length)
        return null;
    const exact = results.find((g) => g.name.toLowerCase() === title.toLowerCase());
    return exact ?? results[0];
}
// ---------------------------------------------------------------------------
// OpenCritic public API (Bearer token extracted from SPA, no RapidAPI needed).
// ---------------------------------------------------------------------------
const OC_BEARER = "Bearer R2tBRkdvUU9WSHpoUXpaSXVYa2g5cGU5NEFsWUgyeXQ=";
export async function searchOpenCritic(title) {
    try {
        // Step 1: Search by title
        const metaUrl = `https://api.opencritic.com/api/meta/search?criteria=${encodeURIComponent(title)}`;
        const metaRes = await fetch(metaUrl, {
            headers: {
                Authorization: OC_BEARER,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Accept: "application/json",
                Origin: "https://opencritic.com",
                Referer: "https://opencritic.com/search",
            },
        });
        if (!metaRes.ok)
            return null;
        const hits = (await metaRes.json());
        const games = hits.filter((h) => h.relation === "game");
        if (!games.length)
            return null;
        const exact = games.find((g) => g.name.toLowerCase() === title.toLowerCase());
        const match = exact ?? games[0];
        // Step 2: Get critic score
        const ratingUrl = `https://api.opencritic.com/api/ratings/game/${match.id}`;
        const ratingRes = await fetch(ratingUrl, {
            headers: {
                Authorization: OC_BEARER,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Accept: "application/json",
                Origin: "https://opencritic.com",
                Referer: "https://opencritic.com/",
            },
        });
        let score;
        let reviewCount;
        if (ratingRes.ok) {
            const rating = (await ratingRes.json());
            score = rating.median;
            reviewCount = rating.count;
        }
        return {
            id: match.id,
            name: match.name,
            score,
            reviewCount,
            url: `https://opencritic.com/game/${match.id}`,
        };
    }
    catch {
        return null;
    }
}
export async function searchHltb(title) {
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
        if (!initRes.ok)
            return null;
        const initData = (await initRes.json());
        if (!initData.token)
            return null;
        // Step 2: Search with the token
        const searchBody = {
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
        if (initData.hpKey) {
            searchBody[initData.hpKey] = initData.hpVal;
        }
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
        if (!res.ok)
            return null;
        const json = (await res.json());
        const data = json.data;
        if (!data?.length)
            return null;
        const exact = data.find((g) => g.game_name?.toLowerCase() === title.toLowerCase());
        const match = exact ?? data[0];
        return {
            id: match.game_id,
            name: match.game_name,
            mainTime: match.comp_main ? Math.round(match.comp_main / 3600) : undefined,
        };
    }
    catch {
        return null;
    }
}
export async function enrichGame(title) {
    const result = {};
    // IGDB
    const igdb = await searchIgdb(title);
    if (igdb) {
        result.igdbId = igdb.id;
        result.igdbUrl = `https://www.igdb.com/games/${igdb.slug}`;
        result.igdbCoverUrl = getIgdbCoverUrl(igdb.cover?.url);
        result.igdbSummary = igdb.summary ?? undefined;
        result.igdbGenres = igdb.genres?.map((g) => g.name).filter((n) => !!n);
        result.igdbScreenshots = igdb.screenshots
            ?.map((s) => s.url?.startsWith("//") ? "https:" + s.url.replace("t_thumb", "t_screenshot_big") : s.url)
            .filter((u) => !!u && !u.includes("nocover"));
        result.igdbGameModes = igdb.game_modes?.map((m) => m.name).filter(Boolean);
        result.igdbPlayerPerspectives = igdb.player_perspectives?.map((p) => p.name).filter(Boolean);
        result.igdbTotalRating = igdb.total_rating ? Math.round(igdb.total_rating) : undefined;
        result.igdbTotalRatingCount = igdb.total_rating_count ?? undefined;
        // Age rating — convert IGDB category enum to human-readable label
        if (igdb.age_ratings?.length) {
            const catMap = { 1: "ESRB", 2: "PEGI" };
            const ratingMap = {
                6: "RP", 7: "EC", 8: "E", 9: "E10+", 10: "T", 11: "M", 12: "AO",
            };
            const ar = igdb.age_ratings[0];
            const cat = catMap[ar.category] ?? "";
            const rating = ratingMap[ar.rating] ?? `${ar.rating}`;
            result.igdbAgeRating = cat ? `${cat} ${rating}` : rating;
        }
        // Trailer / video
        if (igdb.videos?.length) {
            const vid = igdb.videos[0];
            result.igdbTrailerUrl = `https://www.youtube.com/watch?v=${vid.video_id}`;
        }
        // Franchise
        result.igdbFranchise = igdb.franchise?.name;
        // Steam AppID from external_games
        const steam = igdb.external_games?.find((e) => e.external_game_source === 1); // 1 = Steam
        if (steam)
            result.igdbSteamAppId = parseInt(steam.uid, 10) || undefined;
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
// ---------------------------------------------------------------------------
// Steam concurrent player counts (public API, no auth needed)
// ---------------------------------------------------------------------------
export async function fetchSteamPlayers(steamAppId) {
    try {
        const res = await fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${steamAppId}`);
        if (!res.ok)
            return null;
        const json = (await res.json());
        const players = json?.response?.player_count;
        if (typeof players !== "number")
            return null;
        return { players, asOf: new Date() };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=enrichment.js.map