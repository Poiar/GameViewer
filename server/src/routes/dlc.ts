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
} from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { eq, and, desc, asc, count, sql, inArray } from "drizzle-orm";

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

// GET / — List DLCs with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const gameId = parseInt(req.query.gameId as string) || undefined;

    const conditions: ReturnType<typeof eq>[] = [];
    if (gameId) {
      conditions.push(eq(dlcs.masterGameId, gameId));
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

    res.json({
      data: rows,
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

// GET /:id — Get DLC with releases and compatibility
router.get("/:id", async (req: Request, res: Response) => {
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

    res.json({ data: dlc, error: null });
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
// DLC Release sub-routes (mounted under /dlc by parent router? No, separate)
// These are convenience routes for creating DLC releases
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

export default router;
