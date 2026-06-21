import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";
import {
  ownedInstances,
  releases,
  releaseGroups,
  masterGames,
  providers,
  mediaFormats,
} from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// All export routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Shared query
// ---------------------------------------------------------------------------

async function getExportData(userId: number) {
  return db.execute(sql`
    SELECT
      mg.title AS game,
      COALESCE((SELECT string_agg(DISTINCT elem, ', ') FROM jsonb_array_elements_text(r.playable_on) AS elem), '') AS platform,
      p.name AS provider,
      mf.name AS format,
      r.region,
      oi.condition,
      oi.location,
      oi.purchase_price AS "purchasePrice",
      mg.itad_current_price AS "currentPrice",
      oi.acquired_date AS "acquiredDate",
      r.barcode,
      r.catalog_number AS "catalogNumber",
      mg.steam_app_id AS "steamAppId",
      mg.critic_score AS "criticScore",
      mg.hltb_time AS "hltbTime",
      mg.itad_lowest_price AS "lowestPrice",
      oi.notes,
      r.publisher,
      r.release_date AS "releaseDate",
      rg.edition_name AS edition,
      rg.release_year AS "releaseYear",
      s.name AS "seriesName"
    FROM owned_instances oi
    JOIN releases r ON oi.release_id = r.id
    JOIN release_groups rg ON r.release_group_id = rg.id
    JOIN master_games mg ON rg.master_game_id = mg.id
    LEFT JOIN providers p ON r.provider_id = p.id
    LEFT JOIN media_formats mf ON r.media_format_id = mf.id
    LEFT JOIN series s ON mg.series_id = s.id
    WHERE oi.user_id = ${userId}
      AND oi.release_id IS NOT NULL
    ORDER BY mg.title
  `).then((res) => res.rows);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /csv — Export collection as CSV
router.get("/csv", async (req: Request, res: Response) => {
  try {
    const rows = await getExportData(req.user!.userId);

    const headers = [
      "Game",
      "Platform",
      "Provider",
      "Format",
      "Region",
      "Condition",
      "Location",
      "Purchase Price",
      "Current Price",
      "Lowest Price",
      "Acquired Date",
      "Barcode",
      "Catalog #",
      "Steam App ID",
      "Critic Score",
      "HLTB Time (h)",
      "Notes",
      "Publisher",
      "Release Date",
      "Edition",
      "Release Year",
      "Series",
    ];

    const csvEscape = (val: unknown): string => {
      if (val == null) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    // BOM for Excel compatibility
    const bom = "﻿";
    const csv =
      bom +
      headers.join(",") +
      "\n" +
      rows
        .map((r) =>
          [
            csvEscape(r.game),
            csvEscape(r.platform),
            csvEscape(r.provider),
            csvEscape(r.format),
            csvEscape(r.region),
            csvEscape(r.condition),
            csvEscape(r.location),
            csvEscape(r.purchasePrice),
            csvEscape(r.currentPrice),
            csvEscape(r.lowestPrice),
            csvEscape(r.acquiredDate),
            csvEscape(r.barcode),
            csvEscape(r.catalogNumber),
            csvEscape(r.steamAppId),
            csvEscape(r.criticScore),
            csvEscape(r.hltbTime),
            csvEscape(r.notes),
            csvEscape(r.publisher),
            csvEscape(r.releaseDate),
            csvEscape(r.edition),
            csvEscape(r.releaseYear),
            csvEscape(r.seriesName),
          ].join(","),
        )
        .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="collection-export.csv"',
    );
    res.send(csv);
  } catch (error) {
    console.error("CSV export error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to export collection" },
    });
  }
});

// GET /json — Export collection as JSON
router.get("/json", async (req: Request, res: Response) => {
  try {
    const rows = await getExportData(req.user!.userId);
    res.json({ data: rows, error: null });
  } catch (error) {
    console.error("JSON export error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to export collection" },
    });
  }
});

export default router;
