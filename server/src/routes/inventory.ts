import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { ownedInstances, releases, releaseGroups, masterGames, dlcReleases, dlcs } from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { eq, and, desc, count, sql, inArray } from "drizzle-orm";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createInstanceSchema = z
  .object({
    releaseId: z.number().int().optional().nullable(),
    dlcReleaseId: z.number().int().optional().nullable(),
    condition: z.string().max(100).optional().nullable(),
    location: z.string().max(255).optional().nullable(),
    notes: z.string().optional().nullable(),
    acquiredDate: z.string().optional().nullable(),
    purchasePrice: z.string().or(z.number()).optional().nullable(),
  })
  .refine((data) => data.releaseId || data.dlcReleaseId, {
    message: "At least one of releaseId or dlcReleaseId must be set",
  });

const updateInstanceSchema = z.object({
  releaseId: z.number().int().optional().nullable(),
  dlcReleaseId: z.number().int().optional().nullable(),
  condition: z.string().max(100).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  acquiredDate: z.string().optional().nullable(),
  purchasePrice: z.string().or(z.number()).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — List current user's owned instances
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(2500, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(ownedInstances)
      .where(eq(ownedInstances.userId, userId));

    // Fetch base owned instances
    const baseRows = await db
      .select()
      .from(ownedInstances)
      .where(eq(ownedInstances.userId, userId))
      .orderBy(desc(ownedInstances.createdAt))
      .limit(limit)
      .offset(offset);

    // Collect IDs for batch queries
    const releaseIds = baseRows.map((r) => r.releaseId).filter(Boolean) as number[];
    const dlcReleaseIds = baseRows.map((r) => r.dlcReleaseId).filter(Boolean) as number[];

    // Batch query releases with full joins
    const releaseDataMap = new Map<number, any>();
    const dlcReleaseDataMap = new Map<number, any>();

    if (releaseIds.length > 0) {
      const rels = await db.query.releases.findMany({
        where: inArray(releases.id, releaseIds),
        with: {
          releaseGroup: { with: { masterGame: { columns: { id: true, title: true, slug: true, coverImageUrl: true, firstReleaseYear: true } } } },
          provider: true,
          mediaFormat: true,
        },
      });
      for (const rel of rels) {
        releaseDataMap.set(rel.id, {
          id: rel.id, title: rel.title, barcode: rel.barcode, catalogNumber: rel.catalogNumber,
          publisher: rel.publisher, region: rel.region, releaseDate: rel.releaseDate,
          controllerSupport: rel.controllerSupport, localMultiplayer: rel.localMultiplayer,
          onlineMultiplayer: rel.onlineMultiplayer, intendedFor: rel.intendedFor,
          playableOn: rel.playableOn, versionImageUrl: rel.versionImageUrl,
          provider: rel.provider ?? null, mediaFormat: rel.mediaFormat ?? null,
          masterGame: rel.releaseGroup?.masterGame ?? null,
          releaseGroup: rel.releaseGroup ? { id: rel.releaseGroup.id, editionName: rel.releaseGroup.editionName, releaseYear: rel.releaseGroup.releaseYear } : null,
        });
      }
    }

    if (dlcReleaseIds.length > 0) {
      const drs = await db.query.dlcReleases.findMany({
        where: inArray(dlcReleases.id, dlcReleaseIds),
        with: {
          dlc: { columns: { id: true, title: true, dlcType: true } },
          provider: true,
          mediaFormat: true,
        },
      });
      for (const dr of drs) {
        dlcReleaseDataMap.set(dr.id, {
          id: dr.id, releaseDate: dr.releaseDate, onDiscForConsoleOnly: dr.onDiscForConsoleOnly,
          dlc: dr.dlc ?? null, provider: dr.provider ?? null, mediaFormat: dr.mediaFormat ?? null,
        });
      }
    }

    const data = baseRows.map((row) => ({
      id: row.id, condition: row.condition, location: row.location,
      notes: row.notes, acquiredDate: row.acquiredDate, purchasePrice: row.purchasePrice,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
      release: row.releaseId ? releaseDataMap.get(row.releaseId) ?? null : null,
      dlcRelease: row.dlcReleaseId ? dlcReleaseDataMap.get(row.dlcReleaseId) ?? null : null,
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
    console.error("List inventory error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch inventory" },
    });
  }
});

// POST / — Create owned instance
router.post("/", validate(createInstanceSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { releaseId, dlcReleaseId, condition, location, notes, acquiredDate, purchasePrice } = req.body;

    const [created] = await db
      .insert(ownedInstances)
      .values({
        userId,
        releaseId: releaseId ?? null,
        dlcReleaseId: dlcReleaseId ?? null,
        condition: condition ?? null,
        location: location ?? null,
        notes: notes ?? null,
        acquiredDate: acquiredDate ?? null,
        purchasePrice: purchasePrice != null ? String(purchasePrice) : null,
      })
      .returning();

    res.status(201).json({ data: created, error: null });
  } catch (error) {
    console.error("Create owned instance error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to create owned instance" },
    });
  }
});

// PUT /:id — Update owned instance (must belong to current user)
router.put("/:id", validate(updateInstanceSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid instance ID" },
      });
      return;
    }

    const [existing] = await db
      .select()
      .from(ownedInstances)
      .where(and(eq(ownedInstances.id, id), eq(ownedInstances.userId, userId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Owned instance not found" },
      });
      return;
    }

    const { releaseId, dlcReleaseId, condition, location, notes, acquiredDate, purchasePrice } = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (releaseId !== undefined) updateData.releaseId = releaseId ?? null;
    if (dlcReleaseId !== undefined) updateData.dlcReleaseId = dlcReleaseId ?? null;
    if (condition !== undefined) updateData.condition = condition ?? null;
    if (location !== undefined) updateData.location = location ?? null;
    if (notes !== undefined) updateData.notes = notes ?? null;
    if (acquiredDate !== undefined) updateData.acquiredDate = acquiredDate ?? null;
    if (purchasePrice !== undefined) {
      updateData.purchasePrice = purchasePrice != null ? String(purchasePrice) : null;
    }

    const [updated] = await db.update(ownedInstances).set(updateData).where(eq(ownedInstances.id, id)).returning();

    res.json({ data: updated, error: null });
  } catch (error) {
    console.error("Update owned instance error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to update owned instance" },
    });
  }
});

// DELETE /:id — Delete owned instance (must belong to current user)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid instance ID" },
      });
      return;
    }

    const [existing] = await db
      .select({ id: ownedInstances.id })
      .from(ownedInstances)
      .where(and(eq(ownedInstances.id, id), eq(ownedInstances.userId, userId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Owned instance not found" },
      });
      return;
    }

    await db.delete(ownedInstances).where(eq(ownedInstances.id, id));

    res.json({ data: { message: "Owned instance deleted successfully" }, error: null });
  } catch (error) {
    console.error("Delete owned instance error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete owned instance" },
    });
  }
});

export default router;
