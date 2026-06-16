import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { series, masterGames, releases, releaseGroups, ownedInstances } from "../db/schema.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { eq, like, ilike, desc, asc, count, sql, and, inArray } from "drizzle-orm";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createSeriesSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
});

const updateSeriesSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — List series with game count
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string)?.trim();
    const sortBy = (req.query.sort as string) || "name";
    const order = (req.query.order as string)?.toLowerCase() === "desc" ? "desc" : "asc";

    const conditions = [];
    if (search) {
      conditions.push(ilike(series.name, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const [{ count: total }] = await db.select({ count: count() }).from(series).where(whereClause);

    // Select series with game count via subquery
    let orderByClause;
    if (sortBy === "name") {
      orderByClause = order === "desc" ? desc(series.name) : asc(series.name);
    } else {
      // "games" — sort by the subquery value
      const gameCountSql = sql<number>`(SELECT COUNT(*) FROM ${masterGames} WHERE ${masterGames.seriesId} = ${series.id})`;
      orderByClause = order === "desc" ? desc(gameCountSql) : asc(gameCountSql);
    }

    const rows = await db
      .select({
        id: series.id,
        name: series.name,
        slug: series.slug,
        description: series.description,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
        gameCount: sql<number>`(SELECT COUNT(*) FROM ${masterGames} WHERE ${masterGames.seriesId} = ${series.id})`,
      })
      .from(series)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Batch fetch preview covers (first 4 games per series, ordered by year)
    const seriesIds = rows.map((r) => r.id);
    const coverMap: Record<number, string[]> = {};
    if (seriesIds.length > 0) {
      // Get first 4 game IDs per series (ordered by year)
      const previewGames = await db
        .select({
          seriesId: masterGames.seriesId,
          coverImageUrl: masterGames.coverImageUrl,
        })
        .from(masterGames)
        .where(and(inArray(masterGames.seriesId, seriesIds), sql`${masterGames.coverImageUrl} IS NOT NULL AND ${masterGames.coverImageUrl} != ''`))
        .orderBy(asc(masterGames.firstReleaseYear))
        .limit(seriesIds.length * 4);
      for (const g of previewGames) {
        if (!g.seriesId || !g.coverImageUrl) continue;
        if (!coverMap[g.seriesId]) coverMap[g.seriesId] = [];
        if (coverMap[g.seriesId].length < 4) coverMap[g.seriesId].push(g.coverImageUrl);
      }
    }

    const data = rows.map((r) => ({ ...r, covers: coverMap[r.id] ?? [] }));

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
    console.error("List series error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch series" },
    });
  }
});

// GET /:slug — Get series by slug with all its games
router.get("/:slug", optionalAuth, async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const [s] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);

    if (!s) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Series not found" },
      });
      return;
    }

    const games = await db
      .select({
        id: masterGames.id,
        title: masterGames.title,
        slug: masterGames.slug,
        firstReleaseYear: masterGames.firstReleaseYear,
        coverImageUrl: masterGames.coverImageUrl,
      })
      .from(masterGames)
      .where(eq(masterGames.seriesId, s.id))
      .orderBy(desc(masterGames.firstReleaseYear));

    // Batch check ownership per game
    const ownedGameIds = new Set<number>();
    if (req.user && games.length > 0) {
      const gameIds = games.map((g) => g.id);
      const gameReleases = await db
        .select({ id: releases.id, gameId: releaseGroups.masterGameId })
        .from(releases)
        .innerJoin(releaseGroups, eq(releases.releaseGroupId, releaseGroups.id))
        .where(inArray(releaseGroups.masterGameId, gameIds));
      const releaseIds = gameReleases.map((r) => r.id);
      if (releaseIds.length > 0) {
        const owned = await db
          .select({ releaseId: ownedInstances.releaseId })
          .from(ownedInstances)
          .where(
            and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.releaseId, releaseIds)),
          );
        const ownedReleaseIds = new Set(owned.map((o) => o.releaseId!).filter(Boolean));
        for (const gr of gameReleases) {
          if (ownedReleaseIds.has(gr.id)) ownedGameIds.add(gr.gameId);
        }
      }
    }

    res.json({
      data: {
        ...s,
        games: games.map((g) => ({ ...g, userOwns: ownedGameIds.has(g.id) })),
      },
      error: null,
    });
  } catch (error) {
    console.error("Get series error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch series" },
    });
  }
});

// POST / — Create series (auth required)
router.post("/", authenticate, validate(createSeriesSchema), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(name);

    // Check slug uniqueness
    const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.slug, slug)).limit(1);

    if (existing) {
      res.status(409).json({
        data: null,
        error: { code: "SLUG_TAKEN", message: `A series with the slug "${slug}" already exists` },
      });
      return;
    }

    const [created] = await db
      .insert(series)
      .values({ name, slug, description: description ?? null })
      .returning();

    res.status(201).json({ data: created, error: null });
  } catch (error) {
    console.error("Create series error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to create series" },
    });
  }
});

// PUT /:id — Update series (auth required)
router.put("/:id", authenticate, validate(updateSeriesSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid series ID" },
      });
      return;
    }

    const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Series not found" },
      });
      return;
    }

    const { name, description } = req.body;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      const slug = slugify(name);

      // Check slug uniqueness excluding current series
      const [slugConflict] = await db
        .select({ id: series.id })
        .from(series)
        .where(and(eq(series.slug, slug), sql`${series.id} != ${id}`))
        .limit(1);

      if (slugConflict) {
        res.status(409).json({
          data: null,
          error: { code: "SLUG_TAKEN", message: `A series with the slug "${slug}" already exists` },
        });
        return;
      }

      updateData.name = name;
      updateData.slug = slug;
    }

    if (description !== undefined) {
      updateData.description = description ?? null;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        data: null,
        error: { code: "NO_CHANGES", message: "No fields to update" },
      });
      return;
    }

    const [updated] = await db.update(series).set(updateData).where(eq(series.id, id)).returning();

    res.json({ data: updated, error: null });
  } catch (error) {
    console.error("Update series error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to update series" },
    });
  }
});

// DELETE /:id — Delete series (auth required)
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid series ID" },
      });
      return;
    }

    const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Series not found" },
      });
      return;
    }

    await db.delete(series).where(eq(series.id, id));

    res.json({ data: { message: "Series deleted successfully" }, error: null });
  } catch (error) {
    console.error("Delete series error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete series" },
    });
  }
});

export default router;
