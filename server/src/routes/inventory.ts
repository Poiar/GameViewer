import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { ownedInstances, releases, releaseGroups, masterGames, dlcReleases, dlcs, users, editionTypes } from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { eq, and, desc, count, sql, inArray, ilike, isNull } from "drizzle-orm";
import { enrichGame } from "../services/enrichment.js";
import { fetchOwnedGames, resolveSteamVanityUrl } from "../services/steam-webapi.js";

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

// ---------------------------------------------------------------------------
// Steam Import
// ---------------------------------------------------------------------------

const STEAM_PROVIDER_ID = 2;
const DIGITAL_FORMAT_ID = 2;

/**
 * Look up or create a release group + release for a Steam game.
 */
async function ensureSteamRelease(
  masterGameId: number,
  title: string,
  releaseYear: number | null,
): Promise<number> {
  // Check if a Steam release already exists for this game
  const existingRelease = await db
    .select({ id: releases.id })
    .from(releases)
    .innerJoin(releaseGroups, eq(releases.releaseGroupId, releaseGroups.id))
    .where(
      and(
        eq(releaseGroups.masterGameId, masterGameId),
        eq(releases.providerId, STEAM_PROVIDER_ID),
        eq(releases.mediaFormatId, DIGITAL_FORMAT_ID),
      ),
    )
    .limit(1);

  if (existingRelease.length > 0) {
    return existingRelease[0].id;
  }

  // Find or create a release group
  let releaseGroupId: number;

  const existingRg = await db
    .select({ id: releaseGroups.id })
    .from(releaseGroups)
    .where(
      and(
        eq(releaseGroups.masterGameId, masterGameId),
        eq(releaseGroups.editionTypeId, 1), // Original
      ),
    )
    .limit(1);

  if (existingRg.length > 0) {
    releaseGroupId = existingRg[0].id;
  } else {
    const [rg] = await db
      .insert(releaseGroups)
      .values({
        masterGameId,
        editionTypeId: 1, // Original
        releaseYear: releaseYear ?? undefined,
      })
      .returning({ id: releaseGroups.id });
    releaseGroupId = rg.id;
  }

  // Create the Steam digital release
  const [rel] = await db
    .insert(releases)
    .values({
      releaseGroupId,
      title: null,
      providerId: STEAM_PROVIDER_ID,
      mediaFormatId: DIGITAL_FORMAT_ID,
      intendedFor: ["game"],
      playableOn: ["Win"],
      controllerSupport: "unknown",
      localMultiplayer: "unknown",
      onlineMultiplayer: "unknown",
      releaseDate: releaseYear ? `${releaseYear}-01-01` : null,
    })
    .returning({ id: releases.id });

  return rel.id;
}

// POST /import-steam — Import owned games from Steam
router.post("/import-steam", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { steamId: bodySteamId } = req.body as { steamId?: string };

    // Get Steam ID from request body or user profile
    let steamId = bodySteamId;
    if (!steamId) {
      const [user] = await db
        .select({ steamId: users.steamId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      steamId = user?.steamId ?? null;
    }

    if (!steamId) {
      res.status(400).json({
        data: null,
        error: {
          code: "MISSING_STEAM_ID",
          message: "Provide a Steam ID or profile URL in the request body, or save one to your profile",
        },
      });
      return;
    }

    // Resolve vanity URL or profile URL to a numeric Steam ID
    const resolvedId = await resolveSteamVanityUrl(steamId);
    if (!resolvedId) {
      res.status(400).json({
        data: null,
        error: {
          code: "INVALID_STEAM_ID",
          message: "Could not resolve Steam profile. Try using your 64-bit Steam ID or your profile's custom URL name.",
        },
      });
      return;
    }

    // Save resolved steamId to user profile
    await db.update(users).set({ steamId: resolvedId }).where(eq(users.id, userId));

    // Fetch owned games from Steam
    const ownedGames = await fetchOwnedGames(resolvedId);
    if (!ownedGames?.length) {
      res.json({
        data: {
          message: "No games found. Make sure your Steam profile game details are set to public.",
          imported: 0,
          skipped: 0,
          total: 0,
          games: [],
        },
        error: null,
      });
      return;
    }

    const results: Array<{
      appid: number;
      name: string;
      matched: boolean;
      imported: boolean;
      message: string;
    }> = [];

    let imported = 0;
    let skipped = 0;

    for (const game of ownedGames) {
      try {
        // Step 1: Try to match by steamAppId
        let [existing] = await db
          .select({ id: masterGames.id, title: masterGames.title })
          .from(masterGames)
          .where(eq(masterGames.steamAppId, game.appid))
          .limit(1);

        let isNew = false;

        if (!existing) {
          // Step 2: Try fuzzy match by title
          const matches = await db
            .select({ id: masterGames.id, title: masterGames.title })
            .from(masterGames)
            .where(ilike(masterGames.title, `%${game.name}%`))
            .orderBy(sql`LENGTH(${masterGames.title})`)
            .limit(1);

          existing = matches[0] ?? null;
        }

        if (!existing) {
          // Step 3: Create new master game
          const slug = game.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

          // Ensure unique slug
          let finalSlug = slug;
          let suffix = 0;
          while (true) {
            const [slugCheck] = await db
              .select({ id: masterGames.id })
              .from(masterGames)
              .where(eq(masterGames.slug, finalSlug))
              .limit(1);
            if (!slugCheck) break;
            suffix++;
            finalSlug = `${slug}-${suffix}`;
          }

          const [created] = await db
            .insert(masterGames)
            .values({
              title: game.name,
              slug: finalSlug,
              steamAppId: game.appid,
              firstReleaseYear: new Date().getFullYear(),
            })
            .returning();

          existing = { id: created.id, title: created.title };
          isNew = true;

          // Fire-and-forget enrichment
          enrichGame(game.name).then((enrichment) => {
            if (enrichment.igdbId || enrichment.opencriticId || enrichment.hltbId) {
              const updateData: Record<string, unknown> = {
                igdbId: enrichment.igdbId ?? undefined,
                opencriticId: enrichment.opencriticId ?? undefined,
                hltbId: enrichment.hltbId ?? undefined,
                hltbTime: enrichment.hltbTime ?? undefined,
                criticScore: enrichment.opencriticScore ?? undefined,
                summary: enrichment.igdbSummary ?? undefined,
                updatedAt: new Date(),
              };
              if (enrichment.igdbCoverUrl && !enrichment.igdbCoverUrl.includes("nocover")) {
                updateData["coverImageUrl"] = enrichment.igdbCoverUrl;
              }
              db.update(masterGames).set(updateData as any).where(eq(masterGames.id, created.id)).execute()
                .catch((e) => console.error("Auto-enrich update failed:", e));
            }
          }).catch((e) => console.error("Auto-enrich search failed:", e));
        }

        // Step 4: Ensure Steam release exists
        const releaseId = await ensureSteamRelease(
          existing.id,
          game.name,
          null, // release year comes from enrichment
        );

        // Step 5: Dedup — check if user already owns this release
        const [ownedCheck] = await db
          .select({ id: ownedInstances.id })
          .from(ownedInstances)
          .where(
            and(
              eq(ownedInstances.userId, userId),
              eq(ownedInstances.releaseId, releaseId),
            ),
          )
          .limit(1);

        if (ownedCheck) {
          results.push({
            appid: game.appid,
            name: game.name,
            matched: true,
            imported: false,
            message: `Already owned — "${existing.title}"`,
          });
          skipped++;
          continue;
        }

        // Step 6: Create owned instance
        await db.insert(ownedInstances).values({
          userId,
          releaseId,
          condition: "Digital",
          location: "Steam",
        });

        imported++;
        results.push({
          appid: game.appid,
          name: game.name,
          matched: true,
          imported: true,
          message: isNew ? `Created + owned — "${existing.title}"` : `Added — "${existing.title}"`,
        });

        // Rate limit
        if (imported % 5 === 0) await new Promise((r) => setTimeout(r, 300));
      } catch (gameErr) {
        console.error(`[Steam Import] Error processing ${game.name} (appid=${game.appid}):`, gameErr);
        results.push({
          appid: game.appid,
          name: game.name,
          matched: false,
          imported: false,
          message: `Error: ${(gameErr as Error).message}`,
        });
        skipped++;
      }
    }

    res.json({
      data: {
        message: `Imported ${imported} games, skipped ${skipped} (out of ${ownedGames.length} total)`,
        total: ownedGames.length,
        imported,
        skipped,
        steamId: resolvedId,
        games: results,
      },
      error: null,
    });
  } catch (error) {
    console.error("Steam import error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to import from Steam" },
    });
  }
});

export default router;
