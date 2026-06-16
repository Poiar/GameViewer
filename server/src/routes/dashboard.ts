import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import {
  masterGames,
  releases,
  series,
  collections,
  ownedInstances,
  userFavorites,
  masterGameGenres,
  genres,
  releaseGroups,
  collectionReleases,
  platforms,
  dlcReleases,
  dlcs,
} from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { eq, and, asc, desc, count, sql, isNotNull } from "drizzle-orm";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeNumber(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function safeFloat(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? parseFloat(val) : Number(val);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /stats — Dashboard stats (auth required)
router.get("/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // ── Global counts ──
    const [
      [{ count: totalGames }],
      [{ count: totalReleases }],
      [{ count: totalSeries }],
      [{ count: totalCollections }],
    ] = await Promise.all([
      db.select({ count: count() }).from(masterGames),
      db.select({ count: count() }).from(releases),
      db.select({ count: count() }).from(series),
      db.select({ count: count() }).from(collections),
    ]);

    // ── Enrichment coverage ──
    const [
      [{ count: enrichedIgdb }],
      [{ count: enrichedOpenCritic }],
      [{ count: enrichedHltb }],
      [{ count: gamesWithCovers }],
    ] = await Promise.all([
      db.select({ count: count() }).from(masterGames).where(isNotNull(masterGames.igdbId)),
      db.select({ count: count() }).from(masterGames).where(isNotNull(masterGames.opencriticId)),
      db.select({ count: count() }).from(masterGames).where(isNotNull(masterGames.hltbId)),
      db.select({ count: count() }).from(masterGames).where(isNotNull(masterGames.coverImageUrl)),
    ]);

    // ── User-specific counts ──
    const [[{ count: totalUserOwned }], [{ count: totalFavorites }]] = await Promise.all([
      db.select({ count: count() }).from(ownedInstances).where(eq(ownedInstances.userId, userId)),
      db.select({ count: count() }).from(userFavorites).where(eq(userFavorites.userId, userId)),
    ]);

    // ── Platform distribution ──
    // Use raw SQL with LATERAL join to unnest the JSONB playableOn array
    const platformRows = await db.execute<{
      slug: string;
      name: string;
      count: number;
    }>(
      sql`
        SELECT p.slug, p.name, COUNT(*)::int AS count
        FROM ${ownedInstances} oi
        JOIN ${releases} r ON oi.release_id = r.id
        JOIN LATERAL jsonb_array_elements_text(r.playable_on) AS plat(slug) ON TRUE
        JOIN ${platforms} p ON p.slug = plat.slug
        WHERE oi.user_id = ${userId}
        GROUP BY p.slug, p.name
        ORDER BY count DESC
      `,
    );

    const platformDistribution = platformRows.rows.map((r: Record<string, unknown>) => ({
      slug: r.slug as string,
      name: r.name as string,
      count: safeNumber(r.count),
    }));

    // ── Genre breakdown ──
    const genreBreakdown = await db
      .select({
        slug: genres.slug,
        name: genres.name,
        count: count(),
      })
      .from(userFavorites)
      .innerJoin(masterGameGenres, eq(userFavorites.masterGameId, masterGameGenres.gameId))
      .innerJoin(genres, eq(masterGameGenres.genreId, genres.id))
      .where(eq(userFavorites.userId, userId))
      .groupBy(genres.slug, genres.name)
      .orderBy(desc(count()));

    // ── Recently added (last 5 owned instances) ──
    // Fetch release-based instances
    const releaseInstances = await db
      .select({
        id: ownedInstances.id,
        condition: ownedInstances.condition,
        location: ownedInstances.location,
        acquiredDate: ownedInstances.acquiredDate,
        purchasePrice: ownedInstances.purchasePrice,
        createdAt: ownedInstances.createdAt,
        releaseTitle: releases.title,
        masterGameTitle: masterGames.title,
        masterGameSlug: masterGames.slug,
        masterGameCover: masterGames.coverImageUrl,
        playableOn: releases.playableOn,
        dlcTitle: sql<string | null>`NULL`,
        dlcType: sql<string | null>`NULL`,
      })
      .from(ownedInstances)
      .innerJoin(releases, eq(ownedInstances.releaseId, releases.id))
      .innerJoin(releaseGroups, eq(releases.releaseGroupId, releaseGroups.id))
      .innerJoin(masterGames, eq(releaseGroups.masterGameId, masterGames.id))
      .where(eq(ownedInstances.userId, userId))
      .orderBy(desc(ownedInstances.createdAt))
      .limit(5);

    // Fetch DLC-based instances
    const dlcInstances = await db
      .select({
        id: ownedInstances.id,
        condition: ownedInstances.condition,
        location: ownedInstances.location,
        acquiredDate: ownedInstances.acquiredDate,
        purchasePrice: ownedInstances.purchasePrice,
        createdAt: ownedInstances.createdAt,
        releaseTitle: sql<string | null>`NULL`,
        masterGameTitle: masterGames.title,
        masterGameSlug: masterGames.slug,
        masterGameCover: masterGames.coverImageUrl,
        playableOn: sql<string[] | null>`NULL`,
        dlcTitle: dlcs.title,
        dlcType: dlcs.dlcType,
      })
      .from(ownedInstances)
      .innerJoin(dlcReleases, eq(ownedInstances.dlcReleaseId, dlcReleases.id))
      .innerJoin(dlcs, eq(dlcReleases.dlcId, dlcs.id))
      .innerJoin(masterGames, eq(dlcs.masterGameId, masterGames.id))
      .where(eq(ownedInstances.userId, userId))
      .orderBy(desc(ownedInstances.createdAt))
      .limit(5);

    // Merge, sort by createdAt desc, take 5
    const allRecent = [...releaseInstances, ...dlcInstances]
      .sort((a, b) => {
        const aDate = a.createdAt?.getTime() ?? 0;
        const bDate = b.createdAt?.getTime() ?? 0;
        return bDate - aDate;
      })
      .slice(0, 5);

    const recentlyAdded = allRecent.map((r) => ({
      id: r.id,
      condition: r.condition,
      location: r.location,
      acquiredDate: r.acquiredDate,
      purchasePrice: r.purchasePrice,
      createdAt: r.createdAt,
      title: r.dlcTitle ?? r.releaseTitle,
      masterGameTitle: r.masterGameTitle,
      masterGameSlug: r.masterGameSlug,
      masterGameCover: r.masterGameCover,
      playableOn: r.playableOn,
      type: r.dlcTitle ? "dlc" : "game",
    }));

    // ── Total value (sum of purchase prices) ──
    const [valueResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${ownedInstances.purchasePrice}::numeric), 0)`,
      })
      .from(ownedInstances)
      .where(eq(ownedInstances.userId, userId));

    const totalValue = safeFloat(valueResult.total);

    // ── Collection completeness ──
    const collectionCompletenessData = await db
      .select({
        collectionId: collections.id,
        title: collections.title,
        totalReleases: sql<number>`(
          SELECT COUNT(*) FROM ${collectionReleases}
          WHERE ${collectionReleases.collectionId} = ${collections.id}
        )`,
      })
      .from(collections)
      .orderBy(asc(collections.title));

    const collectionCompleteness: {
      collectionId: number;
      title: string;
      owned: number;
      total: number;
    }[] = [];

    for (const cc of collectionCompletenessData) {
      const totalReleasesCount = safeNumber(cc.totalReleases);

      let ownedCount = 0;
      if (totalReleasesCount > 0) {
        const [{ count: ownedReleases }] = await db
          .select({ count: count() })
          .from(collectionReleases)
          .innerJoin(
            ownedInstances,
            and(eq(ownedInstances.releaseId, collectionReleases.releaseId), eq(ownedInstances.userId, userId)),
          )
          .where(eq(collectionReleases.collectionId, cc.collectionId));

        ownedCount = safeNumber(ownedReleases);
      }

      collectionCompleteness.push({
        collectionId: cc.collectionId,
        title: cc.title,
        owned: ownedCount,
        total: totalReleasesCount,
      });
    }

    // ── Assemble response ──
    res.json({
      data: {
        totalGames: safeNumber(totalGames),
        totalReleases: safeNumber(totalReleases),
        totalSeries: safeNumber(totalSeries),
        totalCollections: safeNumber(totalCollections),
        totalUserOwned: safeNumber(totalUserOwned),
        totalFavorites: safeNumber(totalFavorites),
        totalValue,
        platformDistribution,
        genreBreakdown,
        recentlyAdded,
        collectionCompleteness,
        enrichedIgdb: safeNumber(enrichedIgdb),
        enrichedOpenCritic: safeNumber(enrichedOpenCritic),
        enrichedHltb: safeNumber(enrichedHltb),
        gamesWithCovers: safeNumber(gamesWithCovers),
      },
      error: null,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch dashboard stats" },
    });
  }
});

export default router;
