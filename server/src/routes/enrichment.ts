import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { masterGames, masterGameGenres, genres } from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { enrichGame } from "../services/enrichment.js";
import { eq, and, isNull, sql } from "drizzle-orm";

const router = Router();

async function updateGame(gameId: number, enrichment: Awaited<ReturnType<typeof enrichGame>>) {
  const setData: Record<string, unknown> = {
    igdbId: enrichment.igdbId ?? undefined,
    opencriticId: enrichment.opencriticId ?? undefined,
    hltbId: enrichment.hltbId ?? undefined,
    hltbTime: enrichment.hltbTime ?? undefined,
    criticScore: enrichment.opencriticScore ?? undefined,
    summary: enrichment.igdbSummary ?? undefined,
    screenshots: enrichment.igdbScreenshots?.length ? enrichment.igdbScreenshots : undefined,
    gameModes: enrichment.igdbGameModes?.length ? enrichment.igdbGameModes : undefined,
    playerPerspectives: enrichment.igdbPlayerPerspectives?.length ? enrichment.igdbPlayerPerspectives : undefined,
    ageRating: enrichment.igdbAgeRating ?? undefined,
    trailerUrl: enrichment.igdbTrailerUrl ?? undefined,
    franchise: enrichment.igdbFranchise ?? undefined,
    steamAppId: enrichment.igdbSteamAppId ?? undefined,
    updatedAt: new Date(),
  };
  // Use IGDB cover if no cover exists
  if (enrichment.igdbCoverUrl && !enrichment.igdbCoverUrl.includes("nocover")) {
    // Only set cover if game doesn't already have one — check first
    const [existing] = await db.select({ cover: masterGames.coverImageUrl }).from(masterGames).where(eq(masterGames.id, gameId)).limit(1);
    if (!existing?.cover) {
      setData["coverImageUrl"] = enrichment.igdbCoverUrl;
    }
  }
  await db.update(masterGames).set(setData as any).where(eq(masterGames.id, gameId));

  // Link IGDB genres if game has no genres yet
  if (enrichment.igdbGenres?.length) {
    const existing = await db
      .select({ id: masterGameGenres.genreId })
      .from(masterGameGenres)
      .where(eq(masterGameGenres.gameId, gameId));

    if (!existing.length) {
      // Find matching local genres
      const localGenres = await db.select().from(genres);
      const toLink: number[] = [];

      for (const igdbName of enrichment.igdbGenres) {
        const match = localGenres.find(
          (g) => g.name.toLowerCase() === igdbName.toLowerCase(),
        );
        if (match) toLink.push(match.id);
      }

      if (toLink.length > 0) {
        await db
          .insert(masterGameGenres)
          .values(toLink.map((genreId) => ({ gameId, genreId })));
      }
    }
  }
}

// POST /batch — Batch enrich games without external IDs (MUST be before /:id)
router.post("/batch", authenticate, async (req: Request, res: Response) => {
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
        await updateGame(g.id, enrichment);
      }
      results.push({ id: g.id, title: g.title, ...enrichment });
      await new Promise((r) => setTimeout(r, 300));
    }

    const enriched = results.filter((r) => r.igdbId || r.opencriticId || r.hltbId).length;
    res.json({ data: { enriched, total: games.length, results }, error: null });
  } catch (error) {
    console.error("Batch enrich error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to batch enrich" } });
  }
});

// POST /:id — Enrich a single game from external sources
router.post("/:id", authenticate, async (req: Request, res: Response) => {
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

    await updateGame(id, enrichment);
    res.json({ data: { game: game.title, ...enrichment }, error: null });
  } catch (error) {
    console.error("Enrich game error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to enrich game" } });
  }
});

export default router;
