import { describe, it, expect } from "vitest";
/**
 * Build the DB setData object from enrichment result.
 * Mirrors updateGame in enrichment.ts routes.
 */
function buildEnrichmentSetData(enrichment, existingCover) {
    const setData = {
        igdbId: enrichment.igdbId ?? undefined,
        opencriticId: enrichment.opencriticId ?? undefined,
        hltbId: enrichment.hltbId ?? undefined,
        hltbTime: enrichment.hltbTime ?? undefined,
        criticScore: enrichment.opencriticScore ?? undefined,
        summary: enrichment.igdbSummary ?? undefined,
        screenshots: enrichment.igdbScreenshots?.length ? enrichment.igdbScreenshots : undefined,
        updatedAt: expect.any(Date),
    };
    // Use IGDB cover if no cover exists and it's a valid URL
    if (enrichment.igdbCoverUrl && !enrichment.igdbCoverUrl.includes("nocover")) {
        if (!existingCover) {
            setData["coverImageUrl"] = enrichment.igdbCoverUrl;
        }
    }
    return setData;
}
/**
 * Should IGDB cover be applied given the enrichment result and existing cover state?
 */
function shouldApplyIgdbCover(igdbCoverUrl, existingCover) {
    if (!igdbCoverUrl)
        return false;
    if (igdbCoverUrl.includes("nocover"))
        return false;
    if (existingCover)
        return false;
    return true;
}
/**
 * Match IGDB genre names to local genre IDs.
 */
function matchGenres(igdbGenres, localGenres) {
    return igdbGenres
        .map((igdbName) => {
        const match = localGenres.find((g) => g.name.toLowerCase() === igdbName.toLowerCase());
        return match?.id;
    })
        .filter((id) => id !== undefined);
}
/**
 * Check if game lacks genres (used to decide whether to auto-link IGDB genres).
 */
function shouldLinkGenres(existingGenreCount, igdbGenreCount) {
    return existingGenreCount === 0 && igdbGenreCount > 0;
}
// ---------------------------------------------------------------------------
// buildEnrichmentSetData tests
// ---------------------------------------------------------------------------
describe("buildEnrichmentSetData", () => {
    it("populates all IDs from enrichment result", () => {
        const enrichment = {
            igdbId: 123,
            opencriticId: 456,
            hltbId: 789,
        };
        const data = buildEnrichmentSetData(enrichment, null);
        expect(data.igdbId).toBe(123);
        expect(data.opencriticId).toBe(456);
        expect(data.hltbId).toBe(789);
    });
    it("sets undefined for missing IDs (not null)", () => {
        const enrichment = {};
        const data = buildEnrichmentSetData(enrichment, null);
        expect(data.igdbId).toBeUndefined();
        expect(data.opencriticId).toBeUndefined();
        expect(data.hltbId).toBeUndefined();
    });
    it("sets screenshots when present", () => {
        const enrichment = {
            igdbScreenshots: ["https://example.com/ss1.jpg", "https://example.com/ss2.jpg"],
        };
        const data = buildEnrichmentSetData(enrichment, null);
        expect(data.screenshots).toEqual(["https://example.com/ss1.jpg", "https://example.com/ss2.jpg"]);
    });
    it("sets screenshots to undefined when empty array", () => {
        const enrichment = { igdbScreenshots: [] };
        const data = buildEnrichmentSetData(enrichment, null);
        expect(data.screenshots).toBeUndefined();
    });
    it("sets screenshots to undefined when not present", () => {
        const enrichment = {};
        const data = buildEnrichmentSetData(enrichment, null);
        expect(data.screenshots).toBeUndefined();
    });
    it("sets summary from igdbSummary", () => {
        const enrichment = { igdbSummary: "A great game" };
        const data = buildEnrichmentSetData(enrichment, null);
        expect(data.summary).toBe("A great game");
    });
    it("sets criticScore from opencriticScore", () => {
        const enrichment = { opencriticScore: 92 };
        const data = buildEnrichmentSetData(enrichment, null);
        expect(data.criticScore).toBe(92);
    });
    it("sets hltbTime", () => {
        const enrichment = { hltbTime: 15 };
        const data = buildEnrichmentSetData(enrichment, null);
        expect(data.hltbTime).toBe(15);
    });
});
// ---------------------------------------------------------------------------
// shouldApplyIgdbCover tests
// ---------------------------------------------------------------------------
describe("shouldApplyIgdbCover", () => {
    it("returns true when valid cover URL and no existing cover", () => {
        expect(shouldApplyIgdbCover("https://images.igdb.com/cover.jpg", null)).toBe(true);
        expect(shouldApplyIgdbCover("https://images.igdb.com/cover.jpg", "")).toBe(true);
    });
    it("returns false when cover URL is undefined", () => {
        expect(shouldApplyIgdbCover(undefined, null)).toBe(false);
    });
    it("returns false when cover URL contains nocover", () => {
        expect(shouldApplyIgdbCover("https://images.igdb.com/nocover.jpg", null)).toBe(false);
        expect(shouldApplyIgdbCover("//images.igdb.com/nocover_big.jpg", null)).toBe(false);
    });
    it("returns false when game already has a cover", () => {
        expect(shouldApplyIgdbCover("https://images.igdb.com/cover.jpg", "https://existing.com/cover.jpg")).toBe(false);
    });
    it("returns false for all conditions combined", () => {
        expect(shouldApplyIgdbCover(undefined, "existing.jpg")).toBe(false);
        expect(shouldApplyIgdbCover("https://nocover.jpg", null)).toBe(false);
    });
});
// ---------------------------------------------------------------------------
// matchGenres tests
// ---------------------------------------------------------------------------
describe("matchGenres", () => {
    const localGenres = [
        { id: 1, name: "Action" },
        { id: 2, name: "RPG" },
        { id: 3, name: "FPS" },
        { id: 4, name: "Puzzle" },
        { id: 5, name: "Adventure" },
    ];
    it("matches exact names case-insensitively", () => {
        const result = matchGenres(["action", "RPG", "fps"], localGenres);
        expect(result).toEqual([1, 2, 3]);
    });
    it("skips unmatched genres", () => {
        const result = matchGenres(["Action", "NonExistent", "Puzzle"], localGenres);
        expect(result).toEqual([1, 4]);
    });
    it("returns empty array for empty input", () => {
        expect(matchGenres([], localGenres)).toEqual([]);
    });
    it("returns empty array when no matches", () => {
        expect(matchGenres(["Simulation", "Strategy"], localGenres)).toEqual([]);
    });
    it("handles IGDB genre names with different casing", () => {
        const result = matchGenres(["action", "Action", "ACTION"], localGenres);
        expect(result).toEqual([1, 1, 1]);
    });
});
// ---------------------------------------------------------------------------
// shouldLinkGenres tests
// ---------------------------------------------------------------------------
describe("shouldLinkGenres", () => {
    it("returns true when game has no genres and IGDB provides some", () => {
        expect(shouldLinkGenres(0, 3)).toBe(true);
    });
    it("returns false when game already has genres", () => {
        expect(shouldLinkGenres(2, 5)).toBe(false);
    });
    it("returns false when IGDB has no genres to link", () => {
        expect(shouldLinkGenres(0, 0)).toBe(false);
    });
    it("returns false when both conditions fail", () => {
        expect(shouldLinkGenres(3, 0)).toBe(false);
        expect(shouldLinkGenres(3, 5)).toBe(false);
    });
});
//# sourceMappingURL=enrichment.test.js.map