import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import {
  releases,
  releaseGroups,
  masterGames,
  providers,
  mediaFormats,
  editionTypes,
  dlcReleaseCompatibility,
  ownedInstances,
} from "../db/schema.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { eq, and, like, ilike, desc, asc, count, sql, inArray } from "drizzle-orm";

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createReleaseSchema = z.object({
  releaseGroupId: z.number().int(),
  title: z.string().max(255).optional().nullable(),
  providerId: z.number().int(),
  mediaFormatId: z.number().int(),
  intendedFor: z.array(z.string()).optional(),
  playableOn: z.array(z.string()).optional(),
  barcode: z.string().max(50).optional().nullable(),
  catalogNumber: z.string().max(100).optional().nullable(),
  publisher: z.string().max(255).optional().nullable(),
  region: z.string().max(50).optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  controllerSupport: z.string().max(20).optional(),
  localMultiplayer: z.string().max(20).optional(),
  onlineMultiplayer: z.string().max(20).optional(),
  versionImageUrl: z.string().url().max(500).optional().nullable(),
});

const updateReleaseSchema = z.object({
  releaseGroupId: z.number().int().optional(),
  title: z.string().max(255).optional().nullable(),
  providerId: z.number().int().optional(),
  mediaFormatId: z.number().int().optional(),
  intendedFor: z.array(z.string()).optional(),
  playableOn: z.array(z.string()).optional(),
  barcode: z.string().max(50).optional().nullable(),
  catalogNumber: z.string().max(100).optional().nullable(),
  publisher: z.string().max(255).optional().nullable(),
  region: z.string().max(50).optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  controllerSupport: z.string().max(20).optional(),
  localMultiplayer: z.string().max(20).optional(),
  onlineMultiplayer: z.string().max(20).optional(),
  versionImageUrl: z.string().url().max(500).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — List releases with filtering and pagination
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const gameId = parseInt(req.query.gameId as string) || undefined;
    const releaseGroupId = parseInt(req.query.releaseGroupId as string) || undefined;
    const platformSlug = (req.query.platform as string)?.trim();
    const providerSlug = (req.query.provider as string)?.trim();

    const conditions: (ReturnType<typeof eq> | ReturnType<typeof like> | ReturnType<typeof sql>)[] = [];

    if (releaseGroupId) {
      conditions.push(eq(releases.releaseGroupId, releaseGroupId));
    }

    if (providerSlug) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${providers} p
          WHERE p.id = ${releases.providerId} AND p.slug = ${providerSlug}
        )`,
      );
    }

    if (platformSlug) {
      // platformSlug filters on `playableOn` JSONB field
      conditions.push(sql`${releases.playableOn}::text ILIKE ${`%"${platformSlug}"%`}`);
    }

    // If filtering by game, we need to join through releaseGroups
    if (gameId) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${releaseGroups} rg
          WHERE rg.id = ${releases.releaseGroupId} AND rg.master_game_id = ${gameId}
        )`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const [{ count: total }] = await db.select({ count: count() }).from(releases).where(whereClause);

    // Fetch releases with relations via joins
    const rows = await db
      .select({
        id: releases.id,
        title: releases.title,
        barcode: releases.barcode,
        catalogNumber: releases.catalogNumber,
        publisher: releases.publisher,
        region: releases.region,
        releaseDate: releases.releaseDate,
        controllerSupport: releases.controllerSupport,
        localMultiplayer: releases.localMultiplayer,
        onlineMultiplayer: releases.onlineMultiplayer,
        intendedFor: releases.intendedFor,
        playableOn: releases.playableOn,
        versionImageUrl: releases.versionImageUrl,
        createdAt: releases.createdAt,
        releaseGroup: {
          id: releaseGroups.id,
          editionName: releaseGroups.editionName,
          releaseYear: releaseGroups.releaseYear,
          masterGameId: releaseGroups.masterGameId,
          editionTypeId: releaseGroups.editionTypeId,
        },
        masterGame: {
          id: masterGames.id,
          title: masterGames.title,
          slug: masterGames.slug,
        },
        editionType: {
          id: editionTypes.id,
          name: editionTypes.name,
          slug: editionTypes.slug,
        },
        provider: {
          id: providers.id,
          name: providers.name,
          slug: providers.slug,
        },
        mediaFormat: {
          id: mediaFormats.id,
          name: mediaFormats.name,
          slug: mediaFormats.slug,
        },
      })
      .from(releases)
      .innerJoin(releaseGroups, eq(releases.releaseGroupId, releaseGroups.id))
      .innerJoin(masterGames, eq(releaseGroups.masterGameId, masterGames.id))
      .leftJoin(editionTypes, eq(releaseGroups.editionTypeId, editionTypes.id))
      .leftJoin(providers, eq(releases.providerId, providers.id))
      .leftJoin(mediaFormats, eq(releases.mediaFormatId, mediaFormats.id))
      .where(whereClause)
      .orderBy(desc(releases.createdAt))
      .limit(limit)
      .offset(offset);

    // Batch check ownership
    const ownedReleaseIds = new Set<number>();
    if (req.user && rows.length > 0) {
      const rIds = rows.map((r) => r.id);
      const owned = await db
        .select({ releaseId: ownedInstances.releaseId })
        .from(ownedInstances)
        .where(
          and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.releaseId, rIds)),
        );
      for (const o of owned) { if (o.releaseId) ownedReleaseIds.add(o.releaseId); }
    }

    const data = rows.map((r) => ({ ...r, userOwns: ownedReleaseIds.has(r.id) }));

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
    console.error("List releases error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch releases" },
    });
  }
});

// GET /:id — Get single release with full context
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid release ID" },
      });
      return;
    }

    const row = await db.query.releases.findFirst({
      where: eq(releases.id, id),
      with: {
        releaseGroup: {
          with: {
            masterGame: true,
            editionType: true,
          },
        },
        provider: true,
        mediaFormat: true,
      },
    });

    if (!row) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Release not found" },
      });
      return;
    }

    // Also fetch DLC compatibility info
    const compatRows = await db.select().from(dlcReleaseCompatibility).where(eq(dlcReleaseCompatibility.releaseId, id));

    const data = {
      ...row,
      dlcCompatibility: compatRows.map((c) => c.dlcReleaseId),
    };

    res.json({ data, error: null });
  } catch (error) {
    console.error("Get release error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch release" },
    });
  }
});

// POST / — Create release (auth required)
router.post("/", authenticate, validate(createReleaseSchema), async (req: Request, res: Response) => {
  try {
    const {
      releaseGroupId,
      title,
      providerId,
      mediaFormatId,
      intendedFor,
      playableOn,
      barcode,
      catalogNumber,
      publisher,
      region,
      releaseDate,
      controllerSupport,
      localMultiplayer,
      onlineMultiplayer,
      versionImageUrl,
    } = req.body;

    // Validate release group exists
    const [rg] = await db
      .select({ id: releaseGroups.id })
      .from(releaseGroups)
      .where(eq(releaseGroups.id, releaseGroupId))
      .limit(1);

    if (!rg) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_RELEASE_GROUP", message: "Release group not found" },
      });
      return;
    }

    const [created] = await db
      .insert(releases)
      .values({
        releaseGroupId,
        title: title ?? null,
        providerId,
        mediaFormatId,
        intendedFor: intendedFor ?? [],
        playableOn: playableOn ?? [],
        barcode: barcode ?? null,
        catalogNumber: catalogNumber ?? null,
        publisher: publisher ?? null,
        region: region ?? null,
        releaseDate: releaseDate ?? null,
        controllerSupport: controllerSupport ?? "unknown",
        localMultiplayer: localMultiplayer ?? "unknown",
        onlineMultiplayer: onlineMultiplayer ?? "unknown",
        versionImageUrl: versionImageUrl ?? null,
      })
      .returning();

    // Fetch the newly created release with context
    const full = await db.query.releases.findFirst({
      where: eq(releases.id, created.id),
      with: {
        releaseGroup: { with: { masterGame: true, editionType: true } },
        provider: true,
        mediaFormat: true,
      },
    });

    res.status(201).json({ data: full, error: null });
  } catch (error) {
    console.error("Create release error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to create release" },
    });
  }
});

// PUT /:id — Update release (auth required)
router.put("/:id", authenticate, validate(updateReleaseSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid release ID" },
      });
      return;
    }

    const [existing] = await db.select({ id: releases.id }).from(releases).where(eq(releases.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Release not found" },
      });
      return;
    }

    const {
      releaseGroupId,
      title,
      providerId,
      mediaFormatId,
      intendedFor,
      playableOn,
      barcode,
      catalogNumber,
      publisher,
      region,
      releaseDate,
      controllerSupport,
      localMultiplayer,
      onlineMultiplayer,
      versionImageUrl,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    if (releaseGroupId !== undefined) updateData.releaseGroupId = releaseGroupId;
    if (title !== undefined) updateData.title = title ?? null;
    if (providerId !== undefined) updateData.providerId = providerId;
    if (mediaFormatId !== undefined) updateData.mediaFormatId = mediaFormatId;
    if (intendedFor !== undefined) updateData.intendedFor = intendedFor;
    if (playableOn !== undefined) updateData.playableOn = playableOn;
    if (barcode !== undefined) updateData.barcode = barcode ?? null;
    if (catalogNumber !== undefined) updateData.catalogNumber = catalogNumber ?? null;
    if (publisher !== undefined) updateData.publisher = publisher ?? null;
    if (region !== undefined) updateData.region = region ?? null;
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate ?? null;
    if (controllerSupport !== undefined) updateData.controllerSupport = controllerSupport;
    if (localMultiplayer !== undefined) updateData.localMultiplayer = localMultiplayer;
    if (onlineMultiplayer !== undefined) updateData.onlineMultiplayer = onlineMultiplayer;
    if (versionImageUrl !== undefined) updateData.versionImageUrl = versionImageUrl ?? null;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        data: null,
        error: { code: "NO_CHANGES", message: "No fields to update" },
      });
      return;
    }

    await db.update(releases).set(updateData).where(eq(releases.id, id));

    // Return updated release with context
    const updated = await db.query.releases.findFirst({
      where: eq(releases.id, id),
      with: {
        releaseGroup: { with: { masterGame: true, editionType: true } },
        provider: true,
        mediaFormat: true,
      },
    });

    res.json({ data: updated, error: null });
  } catch (error) {
    console.error("Update release error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to update release" },
    });
  }
});

// DELETE /:id — Delete release (auth required)
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid release ID" },
      });
      return;
    }

    const [existing] = await db.select({ id: releases.id }).from(releases).where(eq(releases.id, id)).limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Release not found" },
      });
      return;
    }

    await db.delete(releases).where(eq(releases.id, id));

    res.json({ data: { message: "Release deleted successfully" }, error: null });
  } catch (error) {
    console.error("Delete release error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete release" },
    });
  }
});

export default router;
