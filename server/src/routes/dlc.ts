import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import {
  dlcs,
  dlcReleases,
  dlcReleaseCompatibility,
  releases,
  providers,
  mediaFormats,
  masterGames,
  ownedInstances,
} from "../db/schema.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { eq, and, desc, asc, count, sql, inArray, ilike, isNotNull } from "drizzle-orm";
import { importSteamDlcs } from "../services/steam-storefront.js";

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createDlcSchema = z.object({
  title: z.string().min(1).max(255),
  firstReleaseYear: z.number().int().optional().nullable(),
  dlcType: z.string().max(50),
  masterGameId: z.number().int(),
});

const updateDlcSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  firstReleaseYear: z.number().int().optional().nullable(),
  dlcType: z.string().max(50).optional(),
  masterGameId: z.number().int().optional(),
});

const createDlcReleaseSchema = z.object({
  dlcId: z.number().int(),
  providerId: z.number().int(),
  mediaFormatId: z.number().int(),
  releaseDate: z.string().optional().nullable(),
  onDiscForConsoleOnly: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — List DLCs with filtering and pagination. Auth optional.
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const gameId = parseInt(req.query.gameId as string) || undefined;
    const search = (req.query.search as string)?.trim();

    const conditions: ReturnType<typeof eq>[] = [];
    if (gameId) {
      conditions.push(eq(dlcs.masterGameId, gameId));
    }
    if (search) {
      conditions.push(ilike(dlcs.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count: total }] = await db.select({ count: count() }).from(dlcs).where(whereClause);

    const rows = await db
      .select({
        id: dlcs.id,
        title: dlcs.title,
        firstReleaseYear: dlcs.firstReleaseYear,
        dlcType: dlcs.dlcType,
        masterGameId: dlcs.masterGameId,
        createdAt: dlcs.createdAt,
        gameTitle: masterGames.title,
        gameSlug: masterGames.slug,
        releaseCount: sql<number>`(
          SELECT COUNT(*) FROM ${dlcReleases}
          WHERE ${dlcReleases.dlcId} = ${dlcs.id}
        )`,
      })
      .from(dlcs)
      .innerJoin(masterGames, eq(dlcs.masterGameId, masterGames.id))
      .where(whereClause)
      .orderBy(desc(dlcs.createdAt))
      .limit(limit)
      .offset(offset);

    // Batch check DLC release ownership
    const ownedDlcIds = new Set<number>();
    if (req.user && rows.length > 0) {
      const dlcIds = rows.map((r) => r.id);
      const dlcReleaseRows = await db
        .select({ id: dlcReleases.id, dlcId: dlcReleases.dlcId })
        .from(dlcReleases)
        .where(inArray(dlcReleases.dlcId, dlcIds));
      const dlcReleaseIds = dlcReleaseRows.map((dr) => dr.id);
      if (dlcReleaseIds.length > 0) {
        const owned = await db
          .select({ dlcReleaseId: ownedInstances.dlcReleaseId })
          .from(ownedInstances)
          .where(
            and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.dlcReleaseId, dlcReleaseIds)),
          );
        const ownedDrIds = new Set(owned.map((o) => o.dlcReleaseId!).filter(Boolean));
        for (const dr of dlcReleaseRows) {
          if (ownedDrIds.has(dr.id)) ownedDlcIds.add(dr.dlcId);
        }
      }
    }

    const data = rows.map((r) => ({ ...r, userOwns: ownedDlcIds.has(r.id) }));

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
    console.error("List DLCs error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch DLCs" },
    });
  }
});

// GET /:id — Get DLC with releases and compatibility. Auth optional.
router.get("/:id", optionalAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid DLC ID" },
      });
      return;
    }

    const dlc = await db.query.dlcs.findFirst({
      where: eq(dlcs.id, id),
      with: {
        masterGame: {
          columns: { id: true, title: true, slug: true },
        },
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
    });

    if (!dlc) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "DLC not found" },
      });
      return;
    }

    // Check ownership per DLC release
    const ownedDlcReleaseMap = new Map<number, { id: number; condition: string | null; location: string | null; purchasePrice: string | null }>();
    if (req.user && dlc.dlcReleases.length > 0) {
      const drIds = dlc.dlcReleases.map((dr) => dr.id);
      const owned = await db
        .select({
          id: ownedInstances.id,
          dlcReleaseId: ownedInstances.dlcReleaseId,
          condition: ownedInstances.condition,
          location: ownedInstances.location,
          purchasePrice: ownedInstances.purchasePrice,
        })
        .from(ownedInstances)
        .where(
          and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.dlcReleaseId, drIds)),
        );
      for (const o of owned) {
        if (o.dlcReleaseId) ownedDlcReleaseMap.set(o.dlcReleaseId, {
          id: o.id,
          condition: o.condition,
          location: o.location,
          purchasePrice: o.purchasePrice,
        });
      }
    }

    const data = {
      ...dlc,
      dlcReleases: dlc.dlcReleases.map((dr) => ({
        ...dr,
        userOwns: ownedDlcReleaseMap.get(dr.id) ?? null,
      })),
    };

    res.json({ data, error: null });
  } catch (error) {
    console.error("Get DLC error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch DLC" },
    });
  }
});

// POST / — Create DLC (auth required)
router.post("/", authenticate, validate(createDlcSchema), async (req: Request, res: Response) => {
  try {
    const { title, firstReleaseYear, dlcType, masterGameId } = req.body;

    // Validate master game exists
    const [game] = await db
      .select({ id: masterGames.id })
      .from(masterGames)
      .where(eq(masterGames.id, masterGameId))
      .limit(1);

    if (!game) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_GAME", message: "Master game not found" },
      });
      return;
    }

    const [created] = await db
      .insert(dlcs)
      .values({ title, firstReleaseYear: firstReleaseYear ?? null, dlcType, masterGameId })
      .returning();

    // Return with game info
    const data = await db.query.dlcs.findFirst({
      where: eq(dlcs.id, created.id),
      with: {
        masterGame: {
          columns: { id: true, title: true, slug: true },
        },
      },
    });

    res.status(201).json({ data, error: null });
  } catch (error) {
    console.error("Create DLC error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to create DLC" },
    });
  }
});

// PUT /:id — Update DLC (auth required)
router.put("/:id", authenticate, validate(updateDlcSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid DLC ID" },
      });
      return;
    }

    const [existing] = await db.select({ id: dlcs.id }).from(dlcs).where(eq(dlcs.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "DLC not found" },
      });
      return;
    }

    const { title, firstReleaseYear, dlcType, masterGameId } = req.body;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (firstReleaseYear !== undefined) updateData.firstReleaseYear = firstReleaseYear ?? null;
    if (dlcType !== undefined) updateData.dlcType = dlcType;
    if (masterGameId !== undefined) {
      // Validate master game exists
      const [game] = await db
        .select({ id: masterGames.id })
        .from(masterGames)
        .where(eq(masterGames.id, masterGameId))
        .limit(1);

      if (!game) {
        res.status(400).json({
          data: null,
          error: { code: "INVALID_GAME", message: "Master game not found" },
        });
        return;
      }
      updateData.masterGameId = masterGameId;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        data: null,
        error: { code: "NO_CHANGES", message: "No fields to update" },
      });
      return;
    }

    await db.update(dlcs).set(updateData).where(eq(dlcs.id, id));

    const updated = await db.query.dlcs.findFirst({
      where: eq(dlcs.id, id),
      with: {
        masterGame: {
          columns: { id: true, title: true, slug: true },
        },
      },
    });

    res.json({ data: updated, error: null });
  } catch (error) {
    console.error("Update DLC error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to update DLC" },
    });
  }
});

// DELETE /:id — Delete DLC (auth required)
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid DLC ID" },
      });
      return;
    }

    const [existing] = await db.select({ id: dlcs.id }).from(dlcs).where(eq(dlcs.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "DLC not found" },
      });
      return;
    }

    await db.delete(dlcs).where(eq(dlcs.id, id));

    res.json({ data: { message: "DLC deleted successfully" }, error: null });
  } catch (error) {
    console.error("Delete DLC error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete DLC" },
    });
  }
});

// ---------------------------------------------------------------------------
// DLC Release sub-routes
// ---------------------------------------------------------------------------

// POST /:dlcId/releases — Create a release for a DLC (auth required)
router.post("/:dlcId/releases", authenticate, validate(createDlcReleaseSchema), async (req: Request, res: Response) => {
  try {
    const dlcId = parseInt(req.params.dlcId as string, 10);
    if (isNaN(dlcId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_DLC_ID", message: "Invalid DLC ID" },
      });
      return;
    }

    const { providerId, mediaFormatId, releaseDate, onDiscForConsoleOnly } = req.body;

    // Validate DLC exists
    const [dlc] = await db.select({ id: dlcs.id }).from(dlcs).where(eq(dlcs.id, dlcId)).limit(1);

    if (!dlc) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "DLC not found" },
      });
      return;
    }

    const [created] = await db
      .insert(dlcReleases)
      .values({
        dlcId,
        providerId,
        mediaFormatId,
        releaseDate: releaseDate ?? null,
        onDiscForConsoleOnly: onDiscForConsoleOnly ?? false,
      })
      .returning();

    const full = await db.query.dlcReleases.findFirst({
      where: eq(dlcReleases.id, created.id),
      with: {
        provider: true,
        mediaFormat: true,
      },
    });

    res.status(201).json({ data: full, error: null });
  } catch (error) {
    console.error("Create DLC release error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to create DLC release" },
    });
  }
});

// POST /releases/:dlcReleaseId/compatibility — Add compatibility mapping
router.post("/releases/:dlcReleaseId/compatibility", authenticate, async (req: Request, res: Response) => {
  try {
    const dlcReleaseId = parseInt(req.params.dlcReleaseId as string, 10);
    if (isNaN(dlcReleaseId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid DLC release ID" },
      });
      return;
    }

    const { releaseId } = req.body;
    if (!releaseId || typeof releaseId !== "number") {
      res.status(400).json({
        data: null,
        error: { code: "VALIDATION_ERROR", message: "releaseId is required and must be a number" },
      });
      return;
    }

    await db.insert(dlcReleaseCompatibility).values({ dlcReleaseId, releaseId }).onConflictDoNothing();

    res.status(201).json({
      data: { message: "Compatibility mapping added" },
      error: null,
    });
  } catch (error) {
    console.error("Add compatibility error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to add compatibility mapping" },
    });
  }
});

// DELETE /releases/:dlcReleaseId/compatibility/:releaseId — Remove compatibility mapping
router.delete("/releases/:dlcReleaseId/compatibility/:releaseId", authenticate, async (req: Request, res: Response) => {
  try {
    const dlcReleaseId = parseInt(req.params.dlcReleaseId as string, 10);
    const releaseId = parseInt(req.params.releaseId as string, 10);

    if (isNaN(dlcReleaseId) || isNaN(releaseId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid DLC release ID or release ID" },
      });
      return;
    }

    await db
      .delete(dlcReleaseCompatibility)
      .where(
        and(eq(dlcReleaseCompatibility.dlcReleaseId, dlcReleaseId), eq(dlcReleaseCompatibility.releaseId, releaseId)),
      );

    res.json({
      data: { message: "Compatibility mapping removed" },
      error: null,
    });
  } catch (error) {
    console.error("Remove compatibility error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to remove compatibility mapping" },
    });
  }
});

// ---------------------------------------------------------------------------
// Batch Steam DLC import
// ---------------------------------------------------------------------------

// POST /batch — Import DLCs from Steam for games without any DLCs yet
router.post("/batch", authenticate, async (req: Request, res: Response) => {
  try {
    const { limit } = req.body as { limit?: number };
    const batchLimit = Math.min(limit ?? 10, 30);

    const games = await db
      .select({ id: masterGames.id, title: masterGames.title, steamAppId: masterGames.steamAppId })
      .from(masterGames)
      .where(
        and(
          isNotNull(masterGames.steamAppId),
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

export default router;
