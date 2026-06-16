import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { platforms, providers, genres, editionTypes, mediaFormats } from "../db/schema.js";
import { asc } from "drizzle-orm";

const router = Router();

// GET /platforms
router.get("/platforms", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(platforms)
      .orderBy(asc(platforms.name));

    res.json({ data: rows, error: null });
  } catch (error) {
    console.error("Get platforms error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch platforms" },
    });
  }
});

// GET /providers
router.get("/providers", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(providers)
      .orderBy(asc(providers.name));

    res.json({ data: rows, error: null });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch providers" },
    });
  }
});

// GET /genres
router.get("/genres", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(genres)
      .orderBy(asc(genres.name));

    res.json({ data: rows, error: null });
  } catch (error) {
    console.error("Get genres error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch genres" },
    });
  }
});

// GET /edition-types
router.get("/edition-types", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(editionTypes)
      .orderBy(asc(editionTypes.name));

    res.json({ data: rows, error: null });
  } catch (error) {
    console.error("Get edition types error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch edition types" },
    });
  }
});

// GET /media-formats
router.get("/media-formats", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(mediaFormats)
      .orderBy(asc(mediaFormats.name));

    res.json({ data: rows, error: null });
  } catch (error) {
    console.error("Get media formats error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch media formats" },
    });
  }
});

export default router;
