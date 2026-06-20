// CheapShark price API — no API key required
// Tracks prices across Steam, GOG, Humble, Epic, Fanatical, and 30+ other stores.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheapSharkGame {
  gameID: string;
  steamAppID: string;
  cheapest: string; // "14.99"
  cheapestDealID: string;
  external: string;
  internalName: string;
  thumb: string;
}

interface CheapSharkDeal {
  gameInfo: {
    storeID: string;
    gameID: string;
    name: string;
    steamAppID: string;
    salePrice: string;
    retailPrice: string;
    steamRatingText: string;
    steamRatingPercent: string;
    steamRatingCount: string;
    metacriticScore: string;
    releaseDate: number;
    thumb: string;
  };
  cheaperStores: Array<{
    storeID: string;
    dealID: string;
    salePrice: string;
    retailPrice: string;
  }>;
  cheapestPrice: {
    price: string;
    date: number; // unix timestamp
  };
}

interface CheapSharkStore {
  storeID: string;
  storeName: string;
  isActive: number;
}

// Map storeID to store name for display
let storeNames: Record<string, string> | null = null;

async function loadStoreNames(): Promise<Record<string, string>> {
  if (storeNames) return storeNames;
  try {
    const res = await fetch("https://www.cheapshark.com/api/1.0/stores");
    if (res.ok) {
      const stores = (await res.json()) as CheapSharkStore[];
      storeNames = Object.fromEntries(
        stores.filter((s) => s.isActive).map((s) => [s.storeID, s.storeName]),
      );
    }
  } catch { /* ignore */ }
  return storeNames ?? {};
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CheapSharkPriceResult {
  currentPrice: string | null;   // best price as string
  currentShop: string | null;    // store name
  currentUrl: string | null;     // cheapshark deal URL
  retailPrice: string | null;    // original MSRP
  lowestPrice: string | null;    // historical lowest
  lowestAt: Date | null;         // when that low was seen
  steamRating: string | null;    // e.g. "98%"
  steamRatingCount: number | null;
  metacriticScore: number | null;
}

/**
 * Look up price data for a Steam App ID.
 */
export async function getCheapSharkPrices(
  steamAppId: number,
): Promise<CheapSharkPriceResult> {
  const empty: CheapSharkPriceResult = {
    currentPrice: null,
    currentShop: null,
    currentUrl: null,
    retailPrice: null,
    lowestPrice: null,
    lowestAt: null,
    steamRating: null,
    steamRatingCount: null,
    metacriticScore: null,
  };

  try {
    // Step 1: Search for the game to get CheapShark gameID
    const searchRes = await fetch(
      `https://www.cheapshark.com/api/1.0/games?steamAppID=${steamAppId}`,
    );

    if (!searchRes.ok) return empty;
    const games = (await searchRes.json()) as CheapSharkGame[];
    if (!games?.length) return empty;

    const gameId = games[0].gameID;
    const cheapest = games[0].cheapest;
    const cheapestDealId = games[0].cheapestDealID;

    // Step 2: Get deal details for historical low and store info
    let lowestPrice: string | null = cheapest || null;
    let lowestAt: Date | null = null;
    let storeName: string | null = null;
    let retailPrice: string | null = null;
    let steamRating: string | null = null;
    let steamRatingCount: number | null = null;
    let metacriticScore: number | null = null;

    if (cheapestDealId) {
      const dealRes = await fetch(
        `https://www.cheapshark.com/api/1.0/deals?id=${cheapestDealId}`,
      );
      if (dealRes.ok) {
        const deal = (await dealRes.json()) as CheapSharkDeal;
        const info = deal.gameInfo;

        retailPrice = info.retailPrice || null;
        steamRating = info.steamRatingPercent
          ? `${info.steamRatingPercent}%`
          : null;
        steamRatingCount = info.steamRatingCount
          ? parseInt(info.steamRatingCount, 10)
          : null;
        metacriticScore = info.metacriticScore
          ? parseInt(info.metacriticScore, 10)
          : null;

        // Get store name
        const names = await loadStoreNames();
        storeName = names[info.storeID] ?? null;

        // Historical cheapest
        if (deal.cheapestPrice?.price) {
          lowestPrice = deal.cheapestPrice.price;
          if (deal.cheapestPrice.date) {
            lowestAt = new Date(deal.cheapestPrice.date * 1000);
          }
        }
      }
    }

    return {
      currentPrice: cheapest || null,
      currentShop: storeName,
      currentUrl: cheapestDealId
        ? `https://www.cheapshark.com/redirect?dealID=${cheapestDealId}`
        : null,
      retailPrice,
      lowestPrice,
      lowestAt,
      steamRating,
      steamRatingCount,
      metacriticScore,
    };
  } catch (err) {
    console.warn("[CheapShark] Error:", err);
    return empty;
  }
}

/**
 * Batch lookup for multiple Steam App IDs (runs sequentially with delay).
 * Returns a map of steamAppId → CheapSharkPriceResult.
 */
export async function batchGetCheapSharkPrices(
  steamAppIds: number[],
): Promise<Map<number, CheapSharkPriceResult>> {
  const results = new Map<number, CheapSharkPriceResult>();
  for (let i = 0; i < steamAppIds.length; i++) {
    const id = steamAppIds[i];
    const price = await getCheapSharkPrices(id);
    results.set(id, price);
    if (i < steamAppIds.length - 1) {
      await new Promise((r) => setTimeout(r, 200)); // rate limiting
    }
  }
  return results;
}
