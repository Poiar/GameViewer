import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import {
  collections as collectionsTable,
  collectionReleases,
  collectionDlcReleases,
  releases,
  dlcReleases,
  masterGames,
  providers,
  mediaFormats,
  releaseGroups,
  dlcs,
  ownedInstances,
} from "../db/schema.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { eq, and, desc, asc, count, sql, inArray } from "drizzle-orm";

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createCollectionSchema = z.object({
  title: z.string().min(1).max(255),
  mediaFormatId: z.number().int().optional().nullable(),
  releaseYear: z.number().int().optional().nullable(),
});

const updateCollectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  mediaFormatId: z.number().int().optional().nullable(),
  releaseYear: z.number().int().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — List collections
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const [{ count: total }] = await db.select({ count: count() }).from(collectionsTable);

    const rows = await db
      .select({
        id: collectionsTable.id,
        title: collectionsTable.title,
        releaseYear: collectionsTable.releaseYear,
        createdAt: collectionsTable.createdAt,
        releaseCount: sql<number>`(
          SELECT COUNT(*) FROM ${collectionReleases}
          WHERE ${collectionReleases.collectionId} = ${collectionsTable.id}
        )`,
        dlcReleaseCount: sql<number>`(
          SELECT COUNT(*) FROM ${collectionDlcReleases}
          WHERE ${collectionDlcReleases.collectionId} = ${collectionsTable.id}
        )`,
      })
      .from(collectionsTable)
      .orderBy(desc(collectionsTable.createdAt))
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
    console.error("List collections error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch collections" },
    });
  }
});

// GET /:id — Get collection with releases, DLC releases, games. Auth optional.
router.get("/:id", optionalAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid collection ID" },
      });
      return;
    }

    const collection = await db.query.collections.findFirst({
      where: eq(collectionsTable.id, id),
      with: {
        mediaFormat: true,
        releases: {
          with: {
            release: {
              with: {
                releaseGroup: {
                  with: {
                    masterGame: {
                      columns: { id: true, title: true, slug: true },
                    },
                  },
                },
                provider: true,
                mediaFormat: true,
              },
            },
          },
        },
        dlcReleases: {
          with: {
            dlcRelease: {
              with: {
                dlc: {
                  columns: { id: true, title: true, dlcType: true },
                },
                provider: true,
                mediaFormat: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Collection not found" },
      });
      return;
    }

    // Determine ownership (when authenticated)
    let ownedReleaseIds = new Set<number>();
    let ownedDlcReleaseIds = new Set<number>();
    if (req.user) {
      const releaseIds = collection.releases.map((cr) => cr.release.id);
      const dlcReleaseIds = collection.dlcReleases.map((cdr) => cdr.dlcRelease.id);
      if (releaseIds.length > 0) {
        const owned = await db
          .select({ releaseId: ownedInstances.releaseId })
          .from(ownedInstances)
          .where(
            and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.releaseId, releaseIds)),
          );
        for (const o of owned) {
          if (o.releaseId) ownedReleaseIds.add(o.releaseId);
        }
      }
      if (dlcReleaseIds.length > 0) {
        const ownedDlc = await db
          .select({ dlcReleaseId: ownedInstances.dlcReleaseId })
          .from(ownedInstances)
          .where(
            and(eq(ownedInstances.userId, req.user.userId), inArray(ownedInstances.dlcReleaseId, dlcReleaseIds)),
          );
        for (const o of ownedDlc) {
          if (o.dlcReleaseId) ownedDlcReleaseIds.add(o.dlcReleaseId);
        }
      }
    }

    // Shape the response
    const data = {
      id: collection.id,
      title: collection.title,
      releaseYear: collection.releaseYear,
      mediaFormat: collection.mediaFormat ?? null,
      createdAt: collection.createdAt,
      releases: collection.releases.map((cr) => ({
        id: cr.release.id,
        title: cr.release.title,
        barcode: cr.release.barcode,
        catalogNumber: cr.release.catalogNumber,
        publisher: cr.release.publisher,
        region: cr.release.region,
        releaseDate: cr.release.releaseDate,
        provider: cr.release.provider ?? null,
        mediaFormat: cr.release.mediaFormat ?? null,
        masterGame: cr.release.releaseGroup?.masterGame ?? null,
        releaseGroup: {
          id: cr.release.releaseGroup?.id,
          editionName: cr.release.releaseGroup?.editionName,
          releaseYear: cr.release.releaseGroup?.releaseYear,
        },
        userOwns: ownedReleaseIds.has(cr.release.id),
      })),
      dlcReleases: collection.dlcReleases.map((cdr) => ({
        id: cdr.dlcRelease.id,
        releaseDate: cdr.dlcRelease.releaseDate,
        onDiscForConsoleOnly: cdr.dlcRelease.onDiscForConsoleOnly,
        dlc: cdr.dlcRelease.dlc ?? null,
        provider: cdr.dlcRelease.provider ?? null,
        mediaFormat: cdr.dlcRelease.mediaFormat ?? null,
        userOwns: ownedDlcReleaseIds.has(cdr.dlcRelease.id),
      })),
    };

    res.json({ data, error: null });
  } catch (error) {
    console.error("Get collection error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch collection" },
    });
  }
});

// POST / — Create collection (auth required)
router.post("/", authenticate, validate(createCollectionSchema), async (req: Request, res: Response) => {
  try {
    const { title, mediaFormatId, releaseYear } = req.body;

    const [created] = await db
      .insert(collectionsTable)
      .values({
        title,
        mediaFormatId: mediaFormatId ?? null,
        releaseYear: releaseYear ?? null,
      })
      .returning();

    res.status(201).json({ data: created, error: null });
  } catch (error) {
    console.error("Create collection error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to create collection" },
    });
  }
});

// PUT /:id — Update collection (auth required)
router.put("/:id", authenticate, validate(updateCollectionSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid collection ID" },
      });
      return;
    }

    const [existing] = await db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Collection not found" },
      });
      return;
    }

    const { title, mediaFormatId, releaseYear } = req.body;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (mediaFormatId !== undefined) updateData.mediaFormatId = mediaFormatId ?? null;
    if (releaseYear !== undefined) updateData.releaseYear = releaseYear ?? null;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        data: null,
        error: { code: "NO_CHANGES", message: "No fields to update" },
      });
      return;
    }

    const [updated] = await db.update(collectionsTable).set(updateData).where(eq(collectionsTable.id, id)).returning();

    res.json({ data: updated, error: null });
  } catch (error) {
    console.error("Update collection error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to update collection" },
    });
  }
});

// DELETE /:id — Delete collection (auth required)
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid collection ID" },
      });
      return;
    }

    const [existing] = await db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Collection not found" },
      });
      return;
    }

    await db.delete(collectionsTable).where(eq(collectionsTable.id, id));

    res.json({ data: { message: "Collection deleted successfully" }, error: null });
  } catch (error) {
    console.error("Delete collection error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete collection" },
    });
  }
});

// ---------------------------------------------------------------------------
// Collection items management (auth required)
// ---------------------------------------------------------------------------

// POST /:id/releases/:releaseId — Add release to collection
router.post("/:id/releases/:releaseId", authenticate, async (req: Request, res: Response) => {
  try {
    const collectionId = parseInt(req.params.id as string, 10);
    const releaseId = parseInt(req.params.releaseId as string, 10);

    if (isNaN(collectionId) || isNaN(releaseId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid collection ID or release ID" },
      });
      return;
    }

    await db.insert(collectionReleases).values({ collectionId, releaseId }).onConflictDoNothing();

    res.status(201).json({
      data: { message: "Release added to collection" },
      error: null,
    });
  } catch (error) {
    console.error("Add release to collection error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to add release to collection" },
    });
  }
});

// DELETE /:id/releases/:releaseId — Remove release from collection
router.delete("/:id/releases/:releaseId", authenticate, async (req: Request, res: Response) => {
  try {
    const collectionId = parseInt(req.params.id as string, 10);
    const releaseId = parseInt(req.params.releaseId as string, 10);

    if (isNaN(collectionId) || isNaN(releaseId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid collection ID or release ID" },
      });
      return;
    }

    await db
      .delete(collectionReleases)
      .where(and(eq(collectionReleases.collectionId, collectionId), eq(collectionReleases.releaseId, releaseId)));

    res.json({
      data: { message: "Release removed from collection" },
      error: null,
    });
  } catch (error) {
    console.error("Remove release from collection error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to remove release from collection" },
    });
  }
});

// POST /:id/dlc-releases/:dlcReleaseId — Add DLC release to collection
router.post("/:id/dlc-releases/:dlcReleaseId", authenticate, async (req: Request, res: Response) => {
  try {
    const collectionId = parseInt(req.params.id as string, 10);
    const dlcReleaseId = parseInt(req.params.dlcReleaseId as string, 10);

    if (isNaN(collectionId) || isNaN(dlcReleaseId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid collection ID or DLC release ID" },
      });
      return;
    }

    await db.insert(collectionDlcReleases).values({ collectionId, dlcReleaseId }).onConflictDoNothing();

    res.status(201).json({
      data: { message: "DLC release added to collection" },
      error: null,
    });
  } catch (error) {
    console.error("Add DLC release to collection error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to add DLC release to collection" },
    });
  }
});

// DELETE /:id/dlc-releases/:dlcReleaseId — Remove DLC release from collection
router.delete("/:id/dlc-releases/:dlcReleaseId", authenticate, async (req: Request, res: Response) => {
  try {
    const collectionId = parseInt(req.params.id as string, 10);
    const dlcReleaseId = parseInt(req.params.dlcReleaseId as string, 10);

    if (isNaN(collectionId) || isNaN(dlcReleaseId)) {
      res.status(400).json({
        data: null,
        error: { code: "INVALID_ID", message: "Invalid collection ID or DLC release ID" },
      });
      return;
    }

    await db
      .delete(collectionDlcReleases)
      .where(
        and(eq(collectionDlcReleases.collectionId, collectionId), eq(collectionDlcReleases.dlcReleaseId, dlcReleaseId)),
      );

    res.json({
      data: { message: "DLC release removed from collection" },
      error: null,
    });
  } catch (error) {
    console.error("Remove DLC release from collection error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to remove DLC release from collection" },
    });
  }
});

export default router;
