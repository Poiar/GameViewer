// One-shot migration: strip (HD), (Demake) etc. from master_games.title
// and move the original title to alternativeTitles for searchability.
//
// Run: npx tsx server/src/db/clean-hd-titles.ts

import "dotenv/config";
import { db } from "./index.js";
import { masterGames } from "./schema.js";
import { eq, sql, or, ilike } from "drizzle-orm";

// -------- strip logic (mirrors normalizeGameTitle in import-sheet.ts) ----------

function stripEdition(title: string): string {
  return title
    .replace(/\s*\(HD\)\s*/gi, "")
    .replace(/\s*\(Demake\)\s*/gi, "")
    .replace(/\s*\(Downsample\)\s*/gi, "")
    .replace(/\s*\(Remastered\)\s*/gi, "")
    .replace(/\s*\(Definitive Edition\)\s*/gi, "")
    .replace(/\s*\(Game of the Year Edition\)\s*/gi, "")
    .replace(/\s*\(GOTY\)\s*/gi, "")
    .replace(/\s*\(Enhanced\)\s*/gi, "")
    .trim();
}

// ---------- main -----------------------------------------------------------------

async function main() {
  console.log("[clean-hd] Finding titles with edition markers...");

  // Find rows with edition markers in the title
  const all = await db.select().from(masterGames);
  const candidates = all.filter((g) => {
    const stripped = stripEdition(g.title);
    return stripped !== g.title && stripped.length > 0;
  });

  console.log(`[clean-hd] Found ${candidates.length} titles to clean`);

  let cleaned = 0;
  for (const game of candidates) {
    const cleanTitle = stripEdition(game.title);
    const altTitles: string[] = Array.isArray(game.alternativeTitles)
      ? [...(game.alternativeTitles as string[])]
      : [];

    // Add the original title to alternatives if not already present
    if (!altTitles.includes(game.title) && game.title !== cleanTitle) {
      altTitles.push(game.title);
    }

    await db
      .update(masterGames)
      .set({
        title: cleanTitle,
        alternativeTitles: altTitles,
        updatedAt: new Date(),
      })
      .where(eq(masterGames.id, game.id));

    cleaned++;
    if (cleaned % 20 === 0) console.log(`[clean-hd] Progress: ${cleaned}/${candidates.length}`);
  }

  console.log(`[clean-hd] Done — cleaned ${cleaned} titles`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[clean-hd] Error:", err);
  process.exit(1);
});
