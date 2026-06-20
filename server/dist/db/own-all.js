// One-shot script: create OwnedInstance for every release for user ID 1 (demo).
// Run with: npx tsx src/db/own-all.ts
import "dotenv/config";
import { db } from "./index.js";
import { ownedInstances, releases } from "./schema.js";
import { eq } from "drizzle-orm";
async function main() {
    console.log("Fetching all releases...");
    const allReleases = await db.select({ id: releases.id }).from(releases);
    console.log(`Found ${allReleases.length} releases`);
    // Get existing owned instances for user 1
    const existing = await db
        .select({ releaseId: ownedInstances.releaseId })
        .from(ownedInstances)
        .where(eq(ownedInstances.userId, 1));
    const existingIds = new Set(existing.map((e) => e.releaseId).filter(Boolean));
    const toAdd = allReleases.filter((r) => !existingIds.has(r.id));
    console.log(`${existingIds.size} already owned, ${toAdd.length} to add`);
    if (toAdd.length === 0) {
        console.log("Nothing to do.");
        process.exit(0);
    }
    // Insert in batches of 500
    const BATCH = 500;
    for (let i = 0; i < toAdd.length; i += BATCH) {
        const batch = toAdd.slice(i, i + BATCH);
        await db.insert(ownedInstances).values(batch.map((r) => ({
            userId: 1,
            releaseId: r.id,
        })));
        console.log(`Inserted ${Math.min(i + BATCH, toAdd.length)}/${toAdd.length}`);
    }
    console.log("Done!");
    process.exit(0);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=own-all.js.map