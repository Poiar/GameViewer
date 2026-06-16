import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { masterGames } from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { enrichGame } from "../services/enrichment.js";
import { eq, and, isNull, sql } from "drizzle-orm";

const router = Router();

// POST /enrich/:id — Enrich a single game from external sources
router.post("/enrich/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ data: null, error: { code: "INVALID_ID", message: "Invalid game ID" } }); return; }

    const [game] = await db.select({ id: masterGames.id, title: masterGames.title }).from(masterGames).where(eq(masterGames.id, id)).limit(1);
    if (!game) { res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Game not found" } }); return; }

    const enrichment = await enrichGame(game.title);
    if (!enrichment.igdbId && !enrichment.opencriticId && !enrichment.hltbId) {
      res.json({ data: { message: "No matches found", game: game.title }, error: null });
      return;
    }

    await db.update(masterGames).set({
      igdbId: enrichment.igdbId ?? undefined,
      opencriticId: enrichment.opencriticId ?? undefined,
      hltbId: enrichment.hltbId ?? undefined,
      criticScore: enrichment.opencriticScore ?? undefined,
      updatedAt: new Date(),
    } as any).where(eq(masterGames.id, id));

    res.json({ data: { game: game.title, ...enrichment }, error: null });
  } catch (error) {
    console.error("Enrich game error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to enrich game" } });
  }
});

// POST /enrich/batch — Batch enrich games without external IDs
router.post("/enrich/batch", authenticate, async (req: Request, res: Response) => {
  try {
    const { limit } = req.body as { limit?: number };
    const batchLimit = Math.min(limit ?? 5, 25);

    const games = await db
      .select({ id: masterGames.id, title: masterGames.title })
      .from(masterGames)
      .where(and(isNull(masterGames.igdbId), isNull(masterGames.opencriticId)))
      .orderBy(sql`RANDOM()`)
      .limit(batchLimit);

    if (!games.length) { res.json({ data: { message: "All games already enriched" }, error: null }); return; }

    const results = [];
    for (const g of games) {
      const enrichment = await enrichGame(g.title);
      if (enrichment.igdbId || enrichment.opencriticId || enrichment.hltbId) {
        await db.update(masterGames).set({
          igdbId: enrichment.igdbId ?? undefined,
          opencriticId: enrichment.opencriticId ?? undefined,
          hltbId: enrichment.hltbId ?? undefined,
          criticScore: enrichment.opencriticScore ?? undefined,
          updatedAt: new Date(),
        } as any).where(eq(masterGames.id, g.id));
      }
      results.push({ id: g.id, title: g.title, ...enrichment });
      await new Promise((r) => setTimeout(r, 300)); // Rate limit
    }

    const enriched = results.filter((r) => r.igdbId || r.opencriticId || r.hltbId).length;
    res.json({ data: { enriched, total: games.length, results }, error: null });
  } catch (error) {
    console.error("Batch enrich error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to batch enrich" } });
  }
});

export default router;
