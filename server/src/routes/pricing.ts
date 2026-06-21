import crypto from "crypto";
import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { masterGames } from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { getCheapSharkPrices, batchGetCheapSharkPrices } from "../services/cheapshark.js";
import {
  enrichGameWithPrices as itadEnrichGameWithPrices,
  lookupSteamAppIds,
  getPriceOverview,
  generateCodeVerifier,
  buildAuthorizeUrl,
  exchangeCode,
} from "../services/itad.js";
import { eq, and, isNotNull, isNull, sql, inArray } from "drizzle-orm";

const router = Router();

// ---------------------------------------------------------------------------
// OAuth PKCE flow
// ---------------------------------------------------------------------------

// In-memory store for the PKCE verifier (ephemeral — only needed during redirect)
const pkceStore = new Map<string, { verifier: string; expires: number }>();

// GET /authorize — Redirect user to ITAD to authorize the app
router.get("/authorize", (_req: Request, res: Response) => {
  const state = crypto.randomUUID();
  const verifier = generateCodeVerifier();
  const url = buildAuthorizeUrl(verifier);

  pkceStore.set(state, { verifier, expires: Date.now() + 10 * 60 * 1000 });
  // Clean up stale entries
  for (const [k, v] of pkceStore) {
    if (v.expires < Date.now()) pkceStore.delete(k);
  }

  res.redirect(url);
});

// GET /oauth-callback — ITAD redirects here after user authorizes
router.get("/oauth-callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.status(400).send(`<h2>Authorization failed</h2><p>${error}</p><p>You can close this tab.</p>`);
    return;
  }

  if (!code) {
    res.status(400).send("<h2>Missing authorization code</h2><p>You can close this tab.</p>");
    return;
  }

  // Find verifier by state (or use first available if state is wrong)
  let verifier = "";
  if (state && pkceStore.has(state)) {
    verifier = pkceStore.get(state)!.verifier;
    pkceStore.delete(state);
  } else {
    // Try to use the last stored verifier as fallback
    const entries = [...pkceStore.entries()];
    if (entries.length) {
      verifier = entries[0][1].verifier;
      pkceStore.delete(entries[0][0]);
    }
  }

  if (!verifier) {
    res.status(400).send("<h2>No PKCE verifier found — please start again from /api/pricing/authorize</h2>");
    return;
  }

  const ok = await exchangeCode(code, verifier);
  if (ok) {
    res.send(`<h2>✅ ITAD OAuth authorized successfully!</h2><p>You can close this tab and use pricing features now.</p>`);
  } else {
    res.status(500).send(`<h2>❌ Token exchange failed</h2><p>Check the server logs for details.</p>`);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function updateGamePrices(
  gameId: number,
  result: {
    currentPrice: string | null;
    currentShop: string | null;
    currentUrl: string | null;
    lowestPrice: string | null;
    lowestAt: Date | null;
    itadPlain?: string | null;
  },
) {
  if (!result.currentPrice && !result.lowestPrice && !result.itadPlain) return;

  const setData: Record<string, unknown> = {
    itadCurrentPrice: result.currentPrice ?? undefined,
    itadCurrentShop: result.currentShop ?? undefined,
    itadCurrentUrl: result.currentUrl ?? undefined,
    itadLowestPrice: result.lowestPrice ?? undefined,
    itadLowestAt: result.lowestAt ?? undefined,
    itadPricesAt: new Date(),
    updatedAt: new Date(),
  };
  if (result.itadPlain) {
    setData["itadPlain"] = result.itadPlain;
  }

  await db
    .update(masterGames)
    .set(setData as any)
    .where(eq(masterGames.id, gameId));
}

/** CheapShark-first pricing pipeline, falls back to ITAD. */
async function enrichGameWithPrices(steamAppId: number) {
  // Try CheapShark first (free, no auth, works immediately)
  const cs = await getCheapSharkPrices(steamAppId);
  if (cs.currentPrice || cs.lowestPrice) {
    return cs;
  }

  // Fallback: try ITAD
  const itad = await itadEnrichGameWithPrices(steamAppId);
  if (itad.itadPlain || itad.currentPrice || itad.lowestPrice) {
    return itad;
  }

  // Return whatever CheapShark gave (might be partial but is our best effort)
  return cs;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// POST /batch — Batch fetch prices for games with steamAppId but no ITAD data
// MUST be before /:id
router.post("/batch", authenticate, async (req: Request, res: Response) => {
  try {
    const { limit } = req.body as { limit?: number };
    const batchLimit = Math.min(limit ?? 10, 50);

    const games = await db
      .select({ id: masterGames.id, title: masterGames.title, steamAppId: masterGames.steamAppId })
      .from(masterGames)
      .where(
        and(
          isNotNull(masterGames.steamAppId),
          sql`${masterGames.itadPricesAt} IS NULL`,
        ),
      )
      .orderBy(sql`RANDOM()`)
      .limit(batchLimit);

    if (!games.length) {
      res.json({ data: { message: "All priced games already have ITAD data", total: 0, updated: 0 }, error: null });
      return;
    }

    // Filter out null steamAppIds (TypeScript guard)
    const validGames = games.filter((g): g is typeof g & { steamAppId: number } => g.steamAppId != null);
    if (!validGames.length) {
      res.json({ data: { message: "No games with Steam App IDs found", total: games.length, updated: 0 }, error: null });
      return;
    }

    const steamAppIds = validGames.map((g) => g.steamAppId);

    // Use CheapShark batch (runs sequentially with built-in delay)
    const priceMap = await batchGetCheapSharkPrices(steamAppIds);

    // Update games
    let updated = 0;
    for (const game of validGames) {
      const price = priceMap.get(game.steamAppId);
      if (!price?.currentPrice && !price?.lowestPrice) continue;

      await updateGamePrices(game.id, price);
      updated++;
    }

    res.json({
      data: {
        message: `Updated prices for ${updated}/${validGames.length} games (via CheapShark)`,
        total: validGames.length,
        updated,
      },
      error: null,
    });
  } catch (error) {
    console.error("[ITAD] Batch pricing error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to batch fetch prices" },
    });
  }
});

// POST /refresh-all — Price ALL games with Steam App IDs
router.post("/refresh-all", authenticate, async (req: Request, res: Response) => {
  try {
    const games = await db
      .select({ id: masterGames.id, title: masterGames.title, steamAppId: masterGames.steamAppId })
      .from(masterGames)
      .where(isNotNull(masterGames.steamAppId))
      .orderBy(sql`RANDOM()`);

    if (!games.length) {
      res.json({ data: { message: "No games with Steam App IDs found", total: 0, updated: 0 }, error: null });
      return;
    }

    const validGames = games.filter((g): g is typeof g & { steamAppId: number } => g.steamAppId != null);
    const total = validGames.length;
    let updated = 0;
    const skipped: string[] = [];

    // Process in batches of 50 to avoid overwhelming CheapShark
    const BATCH_SIZE = 50;
    for (let i = 0; i < validGames.length; i += BATCH_SIZE) {
      const batch = validGames.slice(i, i + BATCH_SIZE);
      const steamAppIds = batch.map((g) => g.steamAppId);

      const priceMap = await batchGetCheapSharkPrices(steamAppIds);

      for (const game of batch) {
        const price = priceMap.get(game.steamAppId);
        if (!price?.currentPrice && !price?.lowestPrice) {
          skipped.push(game.title);
          continue;
        }
        await updateGamePrices(game.id, price);
        updated++;
      }

      // Delay between batches
      if (i + BATCH_SIZE < validGames.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    res.json({
      data: {
        message: `Priced ${updated}/${total} games${skipped.length ? ` (${skipped.length} had no price data)` : ""}`,
        total,
        updated,
        skipped: skipped.length,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Pricing] Refresh-all error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to refresh all prices" },
    });
  }
});

// POST /:id — Fetch prices for a single game by its internal DB id
router.post("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid game ID" },
      });
      return;
    }

    const [game] = await db
      .select({ id: masterGames.id, title: masterGames.title, steamAppId: masterGames.steamAppId })
      .from(masterGames)
      .where(eq(masterGames.id, id))
      .limit(1);

    if (!game) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Game not found" },
      });
      return;
    }

    if (!game.steamAppId) {
      res.json({
        data: { game: game.title, message: "No Steam App ID — cannot look up prices" },
        error: null,
      });
      return;
    }

    const result = await enrichGameWithPrices(game.steamAppId);
    await updateGamePrices(id, result);

    res.json({
      data: {
        game: game.title,
        steamAppId: game.steamAppId,
        ...result,
        lowestAt: result.lowestAt?.toISOString() ?? null,
      },
      error: null,
    });
  } catch (error) {
    console.error("[ITAD] Single pricing error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch prices" },
    });
  }
});

// GET /:id — Read cached ITAD price data for a game
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid game ID" },
      });
      return;
    }

    const [game] = await db
      .select({
        id: masterGames.id,
        title: masterGames.title,
        steamAppId: masterGames.steamAppId,
        itadPlain: masterGames.itadPlain,
        itadCurrentPrice: masterGames.itadCurrentPrice,
        itadCurrentShop: masterGames.itadCurrentShop,
        itadCurrentUrl: masterGames.itadCurrentUrl,
        itadLowestPrice: masterGames.itadLowestPrice,
        itadLowestAt: masterGames.itadLowestAt,
        itadPricesAt: masterGames.itadPricesAt,
      })
      .from(masterGames)
      .where(eq(masterGames.id, id))
      .limit(1);

    if (!game) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Game not found" },
      });
      return;
    }

    res.json({ data: game, error: null });
  } catch (error) {
    console.error("[ITAD] Get cached prices error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch cached prices" },
    });
  }
});

export default router;
