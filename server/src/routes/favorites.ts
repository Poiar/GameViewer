import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { userFavorites, masterGames } from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET / — List current user's favorites
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Total count
    const [{ count: total }] = await db
      .select({ count: count() })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));

    // Paginated favorites with game info
    const favorites = await db
      .select({
        favoritedAt: userFavorites.createdAt,
        game: {
          id: masterGames.id,
          title: masterGames.title,
          slug: masterGames.slug,
          firstReleaseYear: masterGames.firstReleaseYear,
          coverImageUrl: masterGames.coverImageUrl,
        },
      })
      .from(userFavorites)
      .innerJoin(masterGames, eq(userFavorites.masterGameId, masterGames.id))
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    // Shape the response
    const data = favorites.map((f) => ({
      ...f.game,
      favoritedAt: f.favoritedAt,
    }));

    res.json({
      data,
      meta: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
      error: null,
    });
  } catch (error) {
    console.error("List favorites error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch favorites" },
    });
  }
});

// POST /:gameId — Add game to favorites (idempotent)
router.post("/:gameId", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const gameId = parseInt(req.params.gameId as string, 10);

    if (isNaN(gameId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_GAME_ID", message: "Invalid game ID" },
      });
      return;
    }

    // Check game exists
    const [game] = await db
      .select({ id: masterGames.id })
      .from(masterGames)
      .where(eq(masterGames.id, gameId))
      .limit(1);

    if (!game) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Game not found" },
      });
      return;
    }

    // Idempotent insert — ignore if already exists
    await db
      .insert(userFavorites)
      .values({ userId, masterGameId: gameId })
      .onConflictDoNothing();

    res.status(201).json({
      data: { message: "Game added to favorites" },
      error: null,
    });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to add favorite" },
    });
  }
});

// DELETE /:gameId — Remove game from favorites (idempotent)
router.delete("/:gameId", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const gameId = parseInt(req.params.gameId as string, 10);

    if (isNaN(gameId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_GAME_ID", message: "Invalid game ID" },
      });
      return;
    }

    await db
      .delete(userFavorites)
      .where(
        and(eq(userFavorites.userId, userId), eq(userFavorites.masterGameId, gameId)),
      );

    res.json({
      data: { message: "Game removed from favorites" },
      error: null,
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to remove favorite" },
    });
  }
});

export default router;
