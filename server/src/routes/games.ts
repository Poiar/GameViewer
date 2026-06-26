import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import {
  masterGames,
  masterGameGenres,
  genres,
  series,
  releaseGroups,
  releases,
  editionTypes,
  dlcs,
  dlcReleases,
  dlcReleaseCompatibility,
  providers,
  mediaFormats,
  ownedInstances,
} from "../db/schema.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { config } from "../config.js";
import { enrichGame } from "../services/enrichment.js";
import { importSteamDlcs } from "../services/steam-storefront.js";
import { fetchSchemaForGame, fetchGlobalAchievementPercentages, searchSteamStorefront } from "../services/steam-webapi.js";
import { searchGames } from "../services/rawg.js";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { eq, and, or, ilike, like, desc, asc, count, sql, inArray } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: path.join(__dirname, "..", "..", "scans") });

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

const createGameSchema = z.object({
  title: z.string().min(1).max(255),
  firstReleaseYear: z.number().int().min(1900).max(2100),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().url().max(500).optional().nullable(),
  seriesId: z.number().int().optional().nullable(),
  alternativeTitles: z.array(z.string()).optional(),
  genreIds: z.array(z.number().int()).optional(),
});

const updateGameSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  firstReleaseYear: z.number().int().min(1900).max(2100).optional(),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().url().max(500).optional().nullable(),
  seriesId: z.number().int().optional().nullable(),
  alternativeTitles: z.array(z.string()).optional(),
  genreIds: z.array(z.number().int()).optional(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — List master games with search, filters, pagination. Auth is optional; when
// present each game includes a summary of the releases the user owns.
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(2500, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string)?.trim();
    const genreSlug = (req.query.genre as string)?.trim();
    const seriesId = parseInt(req.query.seriesId as string) || undefined;
    const platformSlug = (req.query.platform as string)?.trim();
    const providerSlug = (req.query.provider as string)?.trim();
    const format = (req.query.format as string)?.trim();
    const hasPrice = req.query.hasPrice === "true";
    const hasAchievements = req.query.hasAchievements === "true";
    const sortBy = (req.query.sort as string) || "name";
    const order = (req.query.order as string)?.toLowerCase() === "desc" ? "desc" : "asc";

    // Build dynamic WHERE conditions
    const conditions: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof sql>)[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(masterGames.title, `%${search}%`),
          sql`${masterGames.alternativeTitles}::text ILIKE ${`%${search}%`}`,
        )!,
      );
    }

    if (genreSlug) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${masterGameGenres} mgg
          JOIN ${genres} g ON g.id = mgg.genre_id
          WHERE mgg.game_id = ${masterGames.id} AND g.slug = ${genreSlug}
        )`,
      );
    }

    if (seriesId) {
      conditions.push(eq(masterGames.seriesId, seriesId));
    }

    if (platformSlug) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${releaseGroups} rg
          JOIN ${releases} r ON r.release_group_id = rg.id
          WHERE rg.master_game_id = ${masterGames.id}
          AND ${releases.playableOn}::text ILIKE ${`%\"${platformSlug}\"%`}
        )`,
      );
    }

    if (providerSlug) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${releaseGroups} rg
          JOIN ${releases} r ON r.release_group_id = rg.id
          JOIN ${providers} p ON p.id = r.provider_id
          WHERE rg.master_game_id = ${masterGames.id} AND p.slug = ${providerSlug}
        )`,
      );
    }

    if (format === "physical") {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${releaseGroups} rg
          JOIN ${releases} r ON r.release_group_id = rg.id
          LEFT JOIN ${mediaFormats} mf ON r.media_format_id = mf.id
          WHERE rg.master_game_id = ${masterGames.id}
          AND (r.provider_id = 1 OR mf.slug IN ('dvd', 'cd', 'blu-ray'))
        )`,
      );
    } else if (format === "digital") {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${releaseGroups} rg
          JOIN ${releases} r ON r.release_group_id = rg.id
          WHERE rg.master_game_id = ${masterGames.id}
          AND r.media_format_id = 2
          AND r.provider_id != 1
        )`,
      );
    }

    if (hasPrice) {
      conditions.push(sql`${masterGames.itadCurrentPrice} IS NOT NULL`);
    }

    if (hasAchievements) {
      conditions.push(sql`${masterGames.steamAppId} IS NOT NULL`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const [{ count: total }] = await db.select({ count: count() }).from(masterGames).where(whereClause);

    // Determine sort
    let orderByClause;
    switch (sortBy) {
      case "year":
        orderByClause = order === "desc" ? desc(masterGames.firstReleaseYear) : asc(masterGames.firstReleaseYear);
        break;
      default: // "name"
        orderByClause = order === "desc" ? desc(masterGames.title) : asc(masterGames.title);
    }

    // Fetch paginated games with series name
    const gameRows = await db
      .select({
        id: masterGames.id,
        title: masterGames.title,
        slug: masterGames.slug,
        firstReleaseYear: masterGames.firstReleaseYear,
        description: masterGames.description,
        coverImageUrl: masterGames.coverImageUrl,
        seriesId: masterGames.seriesId,
        seriesName: series.name,
        alternativeTitles: masterGames.alternativeTitles,
        steamAppId: masterGames.steamAppId,
        itadCurrentPrice: masterGames.itadCurrentPrice,
        itadCurrentShop: masterGames.itadCurrentShop,
        scanModelUrl: masterGames.scanModelUrl,
        createdAt: masterGames.createdAt,
      })
      .from(masterGames)
      .leftJoin(series, eq(masterGames.seriesId, series.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const gameIds = gameRows.map((g) => g.id);

    // Batch fetch genres for all returned games
    const genreMap: Record<number, { id: number; name: string; slug: string }[]> = {};

    if (gameIds.length > 0) {
      const genreRows = await db
        .select({
          gameId: masterGameGenres.gameId,
          id: genres.id,
          name: genres.name,
          slug: genres.slug,
        })
        .from(masterGameGenres)
        .innerJoin(genres, eq(masterGameGenres.genreId, genres.id))
        .where(inArray(masterGameGenres.gameId, gameIds))
        .orderBy(asc(genres.name));

      for (const row of genreRows) {
        if (!genreMap[row.gameId]) {
          genreMap[row.gameId] = [];
        }
        genreMap[row.gameId].push({ id: row.id, name: row.name, slug: row.slug });
      }
    }

    // Batch fetch release group counts
    const rgCountMap: Record<number, number> = {};

    if (gameIds.length > 0) {
      const rgCounts = await db
        .select({
          gameId: releaseGroups.masterGameId,
          count: count(),
        })
        .from(releaseGroups)
        .where(inArray(releaseGroups.masterGameId, gameIds))
        .groupBy(releaseGroups.masterGameId);

      for (const row of rgCounts) {
        rgCountMap[row.gameId] = Number(row.count);
      }
    }

    // Batch fetch owned release summaries (when user is authenticated)
    const ownedMap: Record<number, { platforms: string[]; formats: string[] }[]> = {};

    if (req.user && gameIds.length > 0) {
      // Get all release IDs that belong to games in this page
      const pageReleaseIds: { id: number; gameId: number }[] = await db
        .select({ id: releases.id, gameId: releaseGroups.masterGameId })
        .from(releases)
        .innerJoin(releaseGroups, eq(releases.releaseGroupId, releaseGroups.id))
        .where(inArray(releaseGroups.masterGameId, gameIds));

      const releaseToGame = new Map(pageReleaseIds.map((r) => [r.id, r.gameId]));
      const allReleaseIds = [...releaseToGame.keys()];

      if (allReleaseIds.length > 0) {
        // Get owned instances for current user
        const owned = await db
          .select({
            releaseId: ownedInstances.releaseId,
          })
          .from(ownedInstances)
          .where(
            and(eq(ownedInstances.userId, req.user!.userId), inArray(ownedInstances.releaseId, allReleaseIds)),
          );

        const ownedReleaseIds = new Set(owned.map((o) => o.releaseId!).filter(Boolean));

        if (ownedReleaseIds.size > 0) {
          // Fetch release details (platforms, format) for owned releases
          const ownedReleases = await db
            .select({
              id: releases.id,
              playableOn: releases.playableOn,
              mediaFormatName: mediaFormats.name,
            })
            .from(releases)
            .leftJoin(mediaFormats, eq(releases.mediaFormatId, mediaFormats.id))
            .where(inArray(releases.id, [...ownedReleaseIds]));

          for (const rel of ownedReleases) {
            const gameId = releaseToGame.get(rel.id);
            if (!gameId) continue;
            if (!ownedMap[gameId]) ownedMap[gameId] = [];
            ownedMap[gameId].push({
              platforms: (rel.playableOn as string[]) ?? [],
              formats: rel.mediaFormatName ? [rel.mediaFormatName] : [],
            });
          }
        }
      }
    }

    // Assemble response
    const data = gameRows.map((g) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      firstReleaseYear: g.firstReleaseYear,
      description: g.description,
      coverImageUrl: g.coverImageUrl,
      series: g.seriesId ? { id: g.seriesId, name: g.seriesName } : null,
      alternativeTitles: g.alternativeTitles,
      steamAppId: g.steamAppId ?? null,
      itadCurrentPrice: g.itadCurrentPrice ?? null,
      itadCurrentShop: g.itadCurrentShop ?? null,
      scanModelUrl: g.scanModelUrl ?? null,
      genres: genreMap[g.id] || [],
      releaseGroupsCount: rgCountMap[g.id] || 0,
      ownedReleases: ownedMap[g.id] || [],
      createdAt: g.createdAt,
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
    console.error("List games error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch games" },
    });
  }
});

// GET /:slug — Get master game by slug with full detail. Auth optional; when
// present, each release includes whether the user owns it.
router.get("/:slug", optionalAuth, async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const game = await db.query.masterGames.findFirst({
      where: eq(masterGames.slug, slug),
      with: {
        series: true,
        genres: {
          with: {
            genre: true,
          },
        },
        releaseGroups: {
          with: {
            editionType: true,
            releases: {
              with: {
                provider: true,
                mediaFormat: true,
              },
            },
          },
        },
        dlcs: {
          with: {
            dlcReleases: {
              with: {
                provider: true,
                mediaFormat: true,
                compatibility: {
                  with: {
                    release: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!game) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Game not found" },
      });
      return;
    }

    // Collect all release IDs + DLC release IDs from this game
    const allReleaseIds: number[] = [];
    const allDlcReleaseIds: number[] = [];
    for (const rg of game.releaseGroups) {
      for (const r of rg.releases) {
        allReleaseIds.push(r.id);
      }
    }
    for (const dlc of game.dlcs) {
      for (const dr of dlc.dlcReleases) {
        allDlcReleaseIds.push(dr.id);
      }
    }

    // If user is authenticated, fetch owned instance details
    const ownedReleaseMap = new Map<number, { id: number; condition: string | null; location: string | null; purchasePrice: string | null; acquiredDate: string | null }>();
    const ownedDlcReleaseMap = new Map<number, { id: number; condition: string | null; location: string | null; purchasePrice: string | null; acquiredDate: string | null }>();
    if (req.user) {
      if (allReleaseIds.length > 0) {
        const owned = await db
          .select({
            id: ownedInstances.id,
            releaseId: ownedInstances.releaseId,
            condition: ownedInstances.condition,
            location: ownedInstances.location,
            purchasePrice: ownedInstances.purchasePrice,
            acquiredDate: ownedInstances.acquiredDate,
          })
          .from(ownedInstances)
          .where(
            and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.releaseId, allReleaseIds)),
          );
        for (const o of owned) {
          if (o.releaseId) ownedReleaseMap.set(o.releaseId, {
            id: o.id,
            condition: o.condition,
            location: o.location,
            purchasePrice: o.purchasePrice,
            acquiredDate: o.acquiredDate,
          });
        }
      }
      if (allDlcReleaseIds.length > 0) {
        const ownedDlc = await db
          .select({
            id: ownedInstances.id,
            dlcReleaseId: ownedInstances.dlcReleaseId,
            condition: ownedInstances.condition,
            location: ownedInstances.location,
            purchasePrice: ownedInstances.purchasePrice,
            acquiredDate: ownedInstances.acquiredDate,
          })
          .from(ownedInstances)
          .where(
            and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.dlcReleaseId, allDlcReleaseIds)),
          );
        for (const o of ownedDlc) {
          if (o.dlcReleaseId) ownedDlcReleaseMap.set(o.dlcReleaseId, {
            id: o.id,
            condition: o.condition,
            location: o.location,
            purchasePrice: o.purchasePrice,
            acquiredDate: o.acquiredDate,
          });
        }
      }
    }

    // Shape the response: flatten genres, ensure sort orders
    const data = {
      id: game.id,
      title: game.title,
      slug: game.slug,
      firstReleaseYear: game.firstReleaseYear,
      description: game.description,
      coverImageUrl: game.coverImageUrl,
      alternativeTitles: game.alternativeTitles,
      series: game.series ?? null,
      genres: game.genres.map((g) => g.genre).sort((a, b) => a.name.localeCompare(b.name)),
      igdbId: game.igdbId ?? null,
      opencriticId: game.opencriticId ?? null,
      hltbId: game.hltbId ?? null,
      hltbTime: game.hltbTime ?? null,
      criticScore: game.criticScore ?? null,
      summary: game.summary ?? null,
      screenshots: game.screenshots ?? [],
      gameModes: game.gameModes ?? [],
      playerPerspectives: game.playerPerspectives ?? [],
      ageRating: game.ageRating ?? null,
      trailerUrl: game.trailerUrl ?? null,
      franchise: game.franchise ?? null,
      steamAppId: game.steamAppId ?? null,
      steamPlayers: game.steamPlayers ?? null,
      steamPlayersAt: game.steamPlayersAt ?? null,
      scanModelUrl: game.scanModelUrl ?? null,
      itadPlain: game.itadPlain ?? null,
      itadCurrentPrice: game.itadCurrentPrice ?? null,
      itadCurrentShop: game.itadCurrentShop ?? null,
      itadCurrentUrl: game.itadCurrentUrl ?? null,
      itadLowestPrice: game.itadLowestPrice ?? null,
      itadLowestAt: game.itadLowestAt ?? null,
      itadPricesAt: game.itadPricesAt ?? null,
      releaseGroups: game.releaseGroups
        .sort((a, b) => (a.releaseYear ?? 0) - (b.releaseYear ?? 0))
        .map((rg) => ({
          id: rg.id,
          editionName: rg.editionName,
          releaseYear: rg.releaseYear,
          editionType: rg.editionType ?? null,
          createdAt: rg.createdAt,
          releases: rg.releases
            .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
            .map((r) => ({
              id: r.id,
              title: r.title,
              barcode: r.barcode,
              catalogNumber: r.catalogNumber,
              publisher: r.publisher,
              region: r.region,
              releaseDate: r.releaseDate,
              controllerSupport: r.controllerSupport,
              localMultiplayer: r.localMultiplayer,
              onlineMultiplayer: r.onlineMultiplayer,
              intendedFor: r.intendedFor,
              playableOn: r.playableOn,
              versionImageUrl: r.versionImageUrl,
              provider: r.provider ?? null,
              mediaFormat: r.mediaFormat ?? null,
              userOwns: ownedReleaseMap.get(r.id) ?? null,
            })),
        })),
      dlcs: game.dlcs.map((dlc) => ({
        id: dlc.id,
        title: dlc.title,
        firstReleaseYear: dlc.firstReleaseYear,
        dlcType: dlc.dlcType,
        createdAt: dlc.createdAt,
        releases: dlc.dlcReleases.map((dr) => ({
          id: dr.id,
          releaseDate: dr.releaseDate,
          onDiscForConsoleOnly: dr.onDiscForConsoleOnly,
          provider: dr.provider ?? null,
          mediaFormat: dr.mediaFormat ?? null,
          userOwns: ownedDlcReleaseMap.get(dr.id) ?? null,
          compatibleWith: dr.compatibility.map((c) => ({
            releaseId: c.release?.id,
            releaseTitle: c.release?.title,
          })),
        })),
      })),
      createdAt: game.createdAt,
    };

    // ── Steam Achievements ──
    if (game.steamAppId) {
      const [schema, percentages] = await Promise.all([
        fetchSchemaForGame(game.steamAppId),
        fetchGlobalAchievementPercentages(game.steamAppId),
      ]);

      if (schema && schema.length > 0) {
        const pctMap = new Map(
          (percentages ?? []).map((p: { name: string; percent: number }) => [p.name, p.percent]),
        );
        (data as Record<string, unknown>).achievements = schema
          .map((a) => ({
            name: a.name,
            displayName: a.displayName,
            description: a.description ?? null,
            icon: a.icon ?? null,
            iconGray: a.icongray ?? null,
            hidden: a.hidden === 1,
            percent: pctMap.get(a.name) ?? null,
          }))
          .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
      }
    }

    res.json({ data, error: null });
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch game" },
    });
  }
});

// POST / — Create master game (auth required)
router.post("/", authenticate, validate(createGameSchema), async (req: Request, res: Response) => {
  try {
    const { title, firstReleaseYear, description, coverImageUrl, seriesId, alternativeTitles, genreIds } = req.body;
    const slug = slugify(title);

    // Check slug uniqueness
    const [existing] = await db
      .select({ id: masterGames.id })
      .from(masterGames)
      .where(eq(masterGames.slug, slug))
      .limit(1);

    if (existing) {
      res.status(409).json({
        data: null,
        error: { code: "SLUG_TAKEN", message: `A game with the slug "${slug}" already exists` },
      });
      return;
    }

    const [created] = await db
      .insert(masterGames)
      .values({
        title,
        slug,
        firstReleaseYear,
        description: description ?? null,
        coverImageUrl: coverImageUrl ?? null,
        seriesId: seriesId ?? null,
        alternativeTitles: alternativeTitles ?? [],
      })
      .returning();

    // Insert genre associations
    if (genreIds && genreIds.length > 0) {
      await db.insert(masterGameGenres).values(
        genreIds.map((genreId: number) => ({
          gameId: created.id,
          genreId,
        })),
      );
    }

    // Fetch the full created game with relations
    const game = await db.query.masterGames.findFirst({
      where: eq(masterGames.id, created.id),
      with: {
        series: true,
        genres: { with: { genre: true } },
      },
    });

    const data = game
      ? {
          ...game,
          genres: game.genres.map((g) => g.genre),
        }
      : created;

    res.status(201).json({ data, error: null });

    // Fire-and-forget enrichment
    enrichGame(title).then((enrichment) => {
      if (enrichment.igdbId || enrichment.opencriticId || enrichment.hltbId) {
        const setData: Record<string, unknown> = {
          igdbId: enrichment.igdbId ?? undefined,
          opencriticId: enrichment.opencriticId ?? undefined,
          hltbId: enrichment.hltbId ?? undefined,
          hltbTime: enrichment.hltbTime ?? undefined,
          criticScore: enrichment.opencriticScore ?? undefined,
          summary: enrichment.igdbSummary ?? undefined,
          screenshots: enrichment.igdbScreenshots?.length ? enrichment.igdbScreenshots : undefined,
          updatedAt: new Date(),
        };
        if (enrichment.igdbCoverUrl && !enrichment.igdbCoverUrl.includes("nocover")) {
          setData["coverImageUrl"] = enrichment.igdbCoverUrl;
        }
        db.update(masterGames).set(setData as any).where(eq(masterGames.id, created.id)).execute()
          .catch((e) => console.error("Auto-enrich update failed:", e));
      }
    }).catch((e) => console.error("Auto-enrich search failed:", e));
  } catch (error) {
    console.error("Create game error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to create game" },
    });
  }
});

// PUT /:id — Update master game (auth required)
router.put("/:id", authenticate, validate(updateGameSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid game ID" },
      });
      return;
    }

    const [existing] = await db.select({ id: masterGames.id }).from(masterGames).where(eq(masterGames.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Game not found" },
      });
      return;
    }

    const { title, firstReleaseYear, description, coverImageUrl, seriesId, alternativeTitles, genreIds } = req.body;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      const slug = slugify(title);

      const [slugConflict] = await db
        .select({ id: masterGames.id })
        .from(masterGames)
        .where(and(eq(masterGames.slug, slug), sql`${masterGames.id} != ${id}`))
        .limit(1);

      if (slugConflict) {
        res.status(409).json({
          data: null,
          error: { code: "SLUG_TAKEN", message: `A game with the slug "${slug}" already exists` },
        });
        return;
      }

      updateData.title = title;
      updateData.slug = slug;
    }

    if (firstReleaseYear !== undefined) updateData.firstReleaseYear = firstReleaseYear;
    if (description !== undefined) updateData.description = description ?? null;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl ?? null;
    if (seriesId !== undefined) updateData.seriesId = seriesId ?? null;
    if (alternativeTitles !== undefined) updateData.alternativeTitles = alternativeTitles;

    if (Object.keys(updateData).length > 0) {
      await db.update(masterGames).set(updateData).where(eq(masterGames.id, id));
    }

    // Update genre associations if provided
    if (genreIds !== undefined) {
      // Remove existing genre associations
      await db.delete(masterGameGenres).where(eq(masterGameGenres.gameId, id));

      // Insert new genre associations
      if (genreIds.length > 0) {
        await db.insert(masterGameGenres).values(
          genreIds.map((genreId: number) => ({
            gameId: id,
            genreId,
          })),
        );
      }
    }

    // Fetch updated game with relations
    const game = await db.query.masterGames.findFirst({
      where: eq(masterGames.id, id),
      with: {
        series: true,
        genres: { with: { genre: true } },
      },
    });

    const data = game
      ? {
          ...game,
          genres: game.genres.map((g) => g.genre),
        }
      : null;

    res.json({ data, error: null });
  } catch (error) {
    console.error("Update game error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to update game" },
    });
  }
});

// DELETE /:id — Delete master game (auth required)
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid game ID" },
      });
      return;
    }

    const [existing] = await db.select({ id: masterGames.id }).from(masterGames).where(eq(masterGames.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Game not found" },
      });
      return;
    }

    // Cascade delete is handled by DB foreign keys (ON DELETE CASCADE)
    await db.delete(masterGames).where(eq(masterGames.id, id));

    res.json({ data: { message: "Game deleted successfully" }, error: null });
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete game" },
    });
  }
});

// POST /:id/cover — Fetch cover art from SteamGridDB (auth required)
router.post("/:id/cover", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ data: null, error: { code: "INVALID_ID", message: "Invalid game ID" } });
      return;
    }

    const [game] = await db
      .select({ id: masterGames.id, title: masterGames.title })
      .from(masterGames)
      .where(eq(masterGames.id, id))
      .limit(1);

    if (!game) {
      res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Game not found" } });
      return;
    }

    // Dynamic import so the route file works even without SGDB
    const { fetchCoverUrl } = await import("../services/steamgriddb.js");
    const coverUrl = await fetchCoverUrl(game.title);

    if (!coverUrl) {
      res.status(404).json({
        data: null,
        error: { code: "COVER_NOT_FOUND", message: `No cover found for "${game.title}"` },
      });
      return;
    }

    // Store in DB
    await db.update(masterGames).set({ coverImageUrl: coverUrl, updatedAt: new Date() }).where(eq(masterGames.id, id));

    res.json({ data: { id, coverImageUrl: coverUrl }, error: null });
  } catch (error) {
    console.error("Cover fetch error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to fetch cover" } });
  }
});

// POST /bulk-cover — Fetch covers for games without one (batch, auth required)
router.post("/bulk-cover", authenticate, async (req: Request, res: Response) => {
  try {
    const { limit } = req.body as { limit?: number };
    const batchLimit = Math.min(limit ?? 10, 25);

    // Find games without cover art
    const gamesNeedingCovers = await db
      .select({ id: masterGames.id, title: masterGames.title })
      .from(masterGames)
      .where(or(sql`${masterGames.coverImageUrl} IS NULL`, eq(masterGames.coverImageUrl, "")))
      .orderBy(sql`RANDOM()`)
      .limit(batchLimit);

    if (gamesNeedingCovers.length === 0) {
      res.json({ data: { fetched: 0, message: "All games already have covers" }, error: null });
      return;
    }

    const { fetchCoverUrl } = await import("../services/steamgriddb.js");

    const results: Array<{ id: number; title: string; coverImageUrl: string | null }> = [];
    for (const game of gamesNeedingCovers) {
      // Small delay to respect SGDB rate limits
      await new Promise((r) => setTimeout(r, 200));
      const coverUrl = await fetchCoverUrl(game.title);
      if (coverUrl) {
        await db
          .update(masterGames)
          .set({ coverImageUrl: coverUrl, updatedAt: new Date() })
          .where(eq(masterGames.id, game.id));
      }
      results.push({ id: game.id, title: game.title, coverImageUrl: coverUrl });
    }

    const found = results.filter((r) => r.coverImageUrl).length;
    res.json({ data: { fetched: found, total: gamesNeedingCovers.length, results }, error: null });
  } catch (error) {
    console.error("Bulk cover fetch error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to fetch covers" } });
  }
});

// ---------------------------------------------------------------------------
// Steam DLC Import
// ---------------------------------------------------------------------------

// POST /:id/import-steam-dlc — Import DLCs from Steam for a single game
router.post("/:id/import-steam-dlc", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ data: null, error: { code: "INVALID_ID", message: "Invalid game ID" } });
      return;
    }

    const [game] = await db
      .select({ id: masterGames.id, title: masterGames.title, steamAppId: masterGames.steamAppId })
      .from(masterGames)
      .where(eq(masterGames.id, id))
      .limit(1);

    if (!game) {
      res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Game not found" } });
      return;
    }

    if (!game.steamAppId) {
      res.json({ data: { message: "No Steam App ID — enrich the game first", imported: 0 }, error: null });
      return;
    }

    const dlcMap = await importSteamDlcs(game.steamAppId);
    if (!dlcMap.size) {
      res.json({ data: { message: "No DLCs found on Steam for this game", imported: 0 }, error: null });
      return;
    }

    const existingDlcs = await db
      .select({ title: dlcs.title })
      .from(dlcs)
      .where(eq(dlcs.masterGameId, id));
    const existingTitles = new Set(existingDlcs.map((d) => d.title.toLowerCase()));

    const STEAM_PROVIDER_ID = 2;
    const DIGITAL_FORMAT_ID = 2;

    let imported = 0;
    for (const [, info] of dlcMap) {
      if (existingTitles.has(info.title.toLowerCase())) continue;

      const [created] = await db
        .insert(dlcs)
        .values({
          title: info.title,
          firstReleaseYear: info.releaseYear ?? undefined,
          dlcType: info.dlcType || "dlc",
          masterGameId: id,
        })
        .returning();

      if (created) {
        await db.insert(dlcReleases).values({
          dlcId: created.id,
          providerId: STEAM_PROVIDER_ID,
          mediaFormatId: DIGITAL_FORMAT_ID,
          releaseDate: info.releaseYear ? `${info.releaseYear}-01-01` : null,
        });
        imported++;
      }
    }

    res.json({
      data: {
        message: `Imported ${imported} DLC${imported !== 1 ? "s" : ""} from Steam`,
        total: dlcMap.size,
        imported,
      },
      error: null,
    });
  } catch (error) {
    console.error("Steam DLC import error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to import Steam DLCs" },
    });
  }
});

// POST /import-steam-dlc-batch — Batch import DLCs for games with steamAppId
router.post("/import-steam-dlc-batch", authenticate, async (req: Request, res: Response) => {
  try {
    const { limit } = req.body as { limit?: number };
    const batchLimit = Math.min(limit ?? 10, 30);

    const games = await db
      .select({ id: masterGames.id, title: masterGames.title, steamAppId: masterGames.steamAppId })
      .from(masterGames)
      .where(
        and(
          sql`${masterGames.steamAppId} IS NOT NULL`,
          sql`NOT EXISTS (SELECT 1 FROM ${dlcs} WHERE ${dlcs.masterGameId} = ${masterGames.id})`,
        ),
      )
      .orderBy(sql`RANDOM()`)
      .limit(batchLimit);

    if (!games.length) {
      res.json({ data: { message: "No games found that need DLC imports", total: 0, imported: 0 }, error: null });
      return;
    }

    const STEAM_PROVIDER_ID = 2;
    const DIGITAL_FORMAT_ID = 2;
    let totalImported = 0;
    let totalDlcFound = 0;
    const results: Array<{ id: number; title: string; imported: number; total: number }> = [];

    for (const game of games) {
      if (!game.steamAppId) continue;

      const dlcMap = await importSteamDlcs(game.steamAppId);

      const existingDlcs = await db
        .select({ title: dlcs.title })
        .from(dlcs)
        .where(eq(dlcs.masterGameId, game.id));
      const existingTitles = new Set(existingDlcs.map((d) => d.title.toLowerCase()));

      let imported = 0;
      for (const [, info] of dlcMap) {
        if (existingTitles.has(info.title.toLowerCase())) continue;

        const [created] = await db
          .insert(dlcs)
          .values({
            title: info.title,
            firstReleaseYear: info.releaseYear ?? undefined,
            dlcType: info.dlcType || "dlc",
            masterGameId: game.id,
          })
          .returning();

        if (created) {
          await db.insert(dlcReleases).values({
            dlcId: created.id,
            providerId: STEAM_PROVIDER_ID,
            mediaFormatId: DIGITAL_FORMAT_ID,
            releaseDate: info.releaseYear ? `${info.releaseYear}-01-01` : null,
          });
          imported++;
        }
      }

      totalImported += imported;
      totalDlcFound += dlcMap.size;
      results.push({ id: game.id, title: game.title, imported, total: dlcMap.size });

      if (imported > 0) await new Promise((r) => setTimeout(r, 300));
    }

    res.json({
      data: {
        message: `Imported ${totalImported} DLCs across ${games.length} games`,
        total: totalDlcFound,
        imported: totalImported,
        games: results,
      },
      error: null,
    });
  } catch (error) {
    console.error("Batch Steam DLC import error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to batch import Steam DLCs" },
    });
  }
});

// ---------------------------------------------------------------------------
// 3D Scan Upload
// ---------------------------------------------------------------------------

// POST /:id/upload-scan — Upload a .glb 3D scan for a game
router.post("/:id/upload-scan", authenticate, upload.single("scan"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ data: null, error: { code: "INVALID_ID", message: "Invalid game ID" } });
      return;
    }

    const [game] = await db
      .select({ id: masterGames.id, title: masterGames.title, slug: masterGames.slug })
      .from(masterGames)
      .where(eq(masterGames.id, id))
      .limit(1);

    if (!game) {
      res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Game not found" } });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ data: null, error: { code: "NO_FILE", message: "No file uploaded" } });
      return;
    }

    // Check extension
    if (!file.originalname.toLowerCase().endsWith(".glb")) {
      res.status(400).json({ data: null, error: { code: "INVALID_FILE", message: "Only .glb files are accepted" } });
      return;
    }

    const fs = await import("fs/promises");
    const filename = `${game.slug || `game-${game.id}`}.glb`;
    const targetPath = path.join(__dirname, "..", "..", "scans", filename);

    // Move the uploaded file to the proper name
    await fs.rename(file.path, targetPath);

    const scanUrl = `/scans/${filename}`;

    await db.update(masterGames).set({ scanModelUrl: scanUrl, updatedAt: new Date() }).where(eq(masterGames.id, id));

    res.json({ data: { scanModelUrl: scanUrl }, error: null });
  } catch (error) {
    console.error("Scan upload error:", error);
    res.status(500).json({ data: null, error: { code: "INTERNAL_ERROR", message: "Failed to upload scan" } });
  }
});

// ---------------------------------------------------------------------------
// Steam ID Batch Sweep
// ---------------------------------------------------------------------------

// POST /batch-steam-id — Backfill Steam App IDs for games missing them
router.post("/batch-steam-id", authenticate, async (req: Request, res: Response) => {
  try {
    const { limit } = req.body as { limit?: number };
    const batchLimit = Math.min(limit ?? 25, 50);

    // Find games with igdbId but no steamAppId
    const games = await db
      .select({ id: masterGames.id, title: masterGames.title, igdbId: masterGames.igdbId })
      .from(masterGames)
      .where(and(sql`${masterGames.steamAppId} IS NULL`, sql`${masterGames.igdbId} IS NOT NULL`))
      .orderBy(sql`RANDOM()`)
      .limit(batchLimit);

    if (!games.length) {
      res.json({ data: { message: "All games already have Steam App IDs", total: 0, updated: 0 }, error: null });
      return;
    }

    const results: Array<{ id: number; title: string; steamAppId: number | null; source: string }> = [];
    let updated = 0;

    for (const game of games) {
      let steamAppId: number | null = null;
      let source = "";

      // 1. Try IGDB re-fetch to get external_games
      try {
        const igdbRes = await fetch("https://api.igdb.com/v4/games", {
          method: "POST",
          headers: {
            "Client-ID": config.igdbClientId,
            Authorization: `Bearer ${config.igdbAccessToken}`,
            "Content-Type": "text/plain",
          },
          body: `fields external_games.uid,external_games.external_game_source; where id = ${game.igdbId};`,
        });
        if (igdbRes.ok) {
          const igdbData = (await igdbRes.json()) as Array<{
            external_games?: Array<{ uid: string; external_game_source: number }>;
          }>;
          if (igdbData?.length) {
            const steam = igdbData[0].external_games?.find((e) => e.external_game_source === 1); // 1 = Steam
            if (steam) {
              steamAppId = parseInt(steam.uid, 10);
              if (!isNaN(steamAppId)) source = "IGDB";
            }
          }
        }
      } catch { /* fall through */ }

      // 2. Try RAWG
      if (!steamAppId) {
        try {
          const rawgResults = await searchGames(game.title);
          if (rawgResults?.length) {
            for (const store of rawgResults[0].stores) {
              if (store.store?.slug === "steam") {
                steamAppId = store.store.id;
                source = "RAWG";
                // RAWG store IDs are NOT Steam App IDs — use Steam Storefront instead
                break;
              }
            }
            // RAWG doesn't directly give Steam App ID — skip to Steam Storefront
          }
        } catch { /* fall through */ }
      }

      // 3. Try Steam Storefront search
      if (!steamAppId) {
        steamAppId = await searchSteamStorefront(game.title);
        if (steamAppId) source = "Steam Storefront";
      }

      // Update the DB if found
      if (steamAppId) {
        await db.update(masterGames).set({ steamAppId, updatedAt: new Date() }).where(eq(masterGames.id, game.id));
        updated++;
      }

      results.push({ id: game.id, title: game.title, steamAppId, source });
      await new Promise((r) => setTimeout(r, 300));
    }

    res.json({
      data: {
        message: `Found ${updated}/${games.length} Steam App IDs`,
        total: games.length,
        updated,
        results,
      },
      error: null,
    });
  } catch (error) {
    console.error("Batch Steam ID error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to batch find Steam IDs" },
    });
  }
});

export default router;
