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

function isMainlineTitle(title: string): boolean {
  // Not mainline if it matches DLC/expansion/bonus/re-release patterns
  return !/(season pass| [Dd][Ll][Cc] |demo |bonus content|freefall|\.\.\.|\(HD\)|\(HD2\)|Remaster|Definitive Edition|GOTY|Game of the Year|Online Mode)/.test(title);
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

// GET / — List series with game count, covers, mainline count, and owned count
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string)?.trim();
    const sortBy = (req.query.sort as string) || "name";
    const order = (req.query.order as string)?.toLowerCase() === "desc" ? "desc" : "asc";

    const conditions = [];
    if (search) conditions.push(ilike(series.name, `%${search}%`));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count: total }] = await db.select({ count: count() }).from(series).where(whereClause);

    let orderByClause;
    if (sortBy === "name") {
      orderByClause = order === "desc" ? desc(series.name) : asc(series.name);
    } else {
      const gc = sql<number>`(SELECT COUNT(*) FROM master_games WHERE master_games.series_id = series.id)`;
      orderByClause = order === "desc" ? desc(gc) : asc(gc);
    }

    const rows = await db
      .select({
        id: series.id, name: series.name, slug: series.slug,
        description: series.description, createdAt: series.createdAt, updatedAt: series.updatedAt,
        gameCount: sql<number>`(SELECT COUNT(*) FROM master_games WHERE master_games.series_id = series.id)`,
      })
      .from(series).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset);

    const seriesIds = rows.map((r) => r.id);

    // ── Batch: all games for these series ──
    const coverMap: Record<number, string[]> = {};
    const mainlineMap: Record<number, number> = {};
    const seriesGamesMap: Record<number, number[]> = {}; // seriesId → gameIds

    if (seriesIds.length > 0) {
      const allGames = await db
        .select({ id: masterGames.id, seriesId: masterGames.seriesId, title: masterGames.title, coverImageUrl: masterGames.coverImageUrl, firstReleaseYear: masterGames.firstReleaseYear })
        .from(masterGames)
        .where(inArray(masterGames.seriesId, seriesIds))
        .orderBy(asc(masterGames.firstReleaseYear));

      for (const g of allGames) {
        if (!g.seriesId) continue;
        if (!seriesGamesMap[g.seriesId]) seriesGamesMap[g.seriesId] = [];
        seriesGamesMap[g.seriesId].push(g.id);
        if (!mainlineMap[g.seriesId]) mainlineMap[g.seriesId] = 0;
        if (isMainlineTitle(g.title)) mainlineMap[g.seriesId]++;
        if (g.coverImageUrl && (!coverMap[g.seriesId] || coverMap[g.seriesId].length < 4)) {
          if (!coverMap[g.seriesId]) coverMap[g.seriesId] = [];
          coverMap[g.seriesId].push(g.coverImageUrl);
        }
      }
    }

    // ── Batch: ownership per series (count distinct GAMES owned, not release instances) ──
    const ownedMap: Record<number, number> = {};
    if (req.user && seriesIds.length > 0 && Object.keys(seriesGamesMap).length > 0) {
      const sidList = Object.keys(seriesGamesMap).map(Number);
      const ownedPerSeries = await db
        .select({
          seriesId: masterGames.seriesId,
          gameCount: sql<number>`COUNT(DISTINCT ${masterGames.id})::int`,
        })
        .from(ownedInstances)
        .innerJoin(releases, eq(ownedInstances.releaseId, releases.id))
        .innerJoin(releaseGroups, eq(releases.releaseGroupId, releaseGroups.id))
        .innerJoin(masterGames, eq(releaseGroups.masterGameId, masterGames.id))
        .where(and(eq(ownedInstances.userId, req.user.userId), inArray(masterGames.seriesId, sidList)))
        .groupBy(masterGames.seriesId);
      for (const row of ownedPerSeries) {
        if (row.seriesId && Number(row.gameCount) > 0) {
          ownedMap[row.seriesId] = Number(row.gameCount);
        }
      }
    }

    const data = rows.map((r) => ({
      ...r,
      covers: coverMap[r.id] ?? [],
      mainlineCount: mainlineMap[r.id] ?? 0,
      ownedCount: ownedMap[r.id] ?? 0,
    }));

    res.json({ data, meta: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) }, error: null });
  } catch (error) {
    console.error("List series error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to fetch series" } });
  }
});

// GET /:slug — Get series by slug with all its games. Auth optional.
router.get("/:slug", optionalAuth, async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const [s] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
    if (!s) {
      res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Series not found" } });
      return;
    }
    const games = await db
      .select({ id: masterGames.id, title: masterGames.title, slug: masterGames.slug, firstReleaseYear: masterGames.firstReleaseYear, coverImageUrl: masterGames.coverImageUrl })
      .from(masterGames).where(eq(masterGames.seriesId, s.id)).orderBy(desc(masterGames.firstReleaseYear));

    const ownedGameIds = new Set<number>();
    if (req.user && games.length > 0) {
      const gameIds = games.map((g) => g.id);
      const gameReleases = await db
        .select({ id: releases.id, gameId: releaseGroups.masterGameId })
        .from(releases).innerJoin(releaseGroups, eq(releases.releaseGroupId, releaseGroups.id))
        .where(inArray(releaseGroups.masterGameId, gameIds));
      const rgMap = new Map(gameReleases.map((r) => [r.id, r.gameId]));
      if (rgMap.size > 0) {
        const owned = await db.select({ releaseId: ownedInstances.releaseId }).from(ownedInstances)
          .where(and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.releaseId, [...rgMap.keys()])));
        for (const o of owned) { const gid = o.releaseId ? rgMap.get(o.releaseId) : undefined; if (gid) ownedGameIds.add(gid); }
      }
    }
    res.json({ data: { ...s, games: games.map((g) => ({ ...g, userOwns: ownedGameIds.has(g.id) })) }, error: null });
  } catch (error) {
    console.error("Get series error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to fetch series" } });
  }
});

// POST / — Create series (auth required)
router.post("/", authenticate, validate(createSeriesSchema), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(name);
    const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.slug, slug)).limit(1);
    if (existing) { res.status(409).json({ data: null, error: { code: "SLUG_TAKEN", message: `A series with the slug "${slug}" already exists` } }); return; }
    const [created] = await db.insert(series).values({ name, slug, description: description ?? null }).returning();
    res.status(201).json({ data: created, error: null });
  } catch (error) { console.error("Create series error:", error); res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to create series" } }); }
});

// PUT /:id — Update series (auth required)
router.put("/:id", authenticate, validate(updateSeriesSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ data: null, error: { code: "INVALID_ID", message: "Invalid series ID" } }); return; }
    const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.id, id)).limit(1);
    if (!existing) { res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Series not found" } }); return; }
    const { name, description } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) { const slug = slugify(name); const [sc] = await db.select({ id: series.id }).from(series).where(and(eq(series.slug, slug), sql`${series.id} != ${id}`)).limit(1); if (sc) { res.status(409).json({ data: null, error: { code: "SLUG_TAKEN", message: `A series with the slug "${slug}" already exists` } }); return; } updateData.name = name; updateData.slug = slug; }
    if (description !== undefined) updateData.description = description ?? null;
    if (Object.keys(updateData).length === 0) { res.status(400).json({ data: null, error: { code: "NO_CHANGES", message: "No fields to update" } }); return; }
    const [updated] = await db.update(series).set(updateData).where(eq(series.id, id)).returning();
    res.json({ data: updated, error: null });
  } catch (error) { console.error("Update series error:", error); res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to update series" } }); }
});

// DELETE /:id — Delete series (auth required)
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ data: null, error: { code: "INVALID_ID", message: "Invalid series ID" } }); return; }
    const [existing] = await db.select({ id: series.id }).from(series).where(eq(series.id, id)).limit(1);
    if (!existing) { res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Series not found" } }); return; }
    await db.delete(series).where(eq(series.id, id));
    res.json({ data: { message: "Series deleted successfully" }, error: null });
  } catch (error) { console.error("Delete series error:", error); res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to delete series" } }); }
});

export default router;
