// Add new enrichment columns to master_games.
// Run: npx tsx src/db/add-fields.ts  (from server/ directory)

import "dotenv/config";
import { db } from "./index.js";
import { sql } from "drizzle-orm";

const COLS: [string, string][] = [
  ["game_modes", "jsonb DEFAULT '[]'::jsonb"],
  ["player_perspectives", "jsonb DEFAULT '[]'::jsonb"],
  ["age_rating", "varchar(20)"],
  ["trailer_url", "varchar(500)"],
  ["franchise", "varchar(255)"],
  ["steam_app_id", "integer"],
  ["steam_players", "integer"],
  ["steam_players_at", "timestamp"],
];

async function main() {
  for (const [name, type] of COLS) {
    try {
      await db.execute(sql.raw(`ALTER TABLE master_games ADD COLUMN ${name} ${type}`));
      console.log(`  + ${name}`);
    } catch (e: any) {
      if (e.message?.includes("already exists") || e.code === "42701") {
        console.log(`  ~ ${name} (exists)`);
      } else {
        console.warn(`  ! ${name}: ${e.message?.slice(0, 80)}`);
      }
    }
  }
  console.log("Done");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
