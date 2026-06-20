import { describe, it, expect } from "vitest";
// ---------------------------------------------------------------------------
// Pure-function extractions from dashboard.ts for isolated testing
// ---------------------------------------------------------------------------
function safeNumber(val) {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
}
function safeFloat(val) {
    if (val === null || val === undefined)
        return 0;
    const n = typeof val === "string" ? parseFloat(val) : Number(val);
    return Number.isFinite(n) ? n : 0;
}
/**
 * Merges release-based and DLC-based instances, sorts by createdAt desc, takes top N.
 * Mirrors the logic in dashboard.ts GET /stats handler.
 */
function mergeRecentInstances(releaseInstances, dlcInstances, limit = 5) {
    const allRecent = [...releaseInstances, ...dlcInstances]
        .sort((a, b) => {
        const aDate = a.createdAt?.getTime() ?? 0;
        const bDate = b.createdAt?.getTime() ?? 0;
        return bDate - aDate;
    })
        .slice(0, limit);
    return allRecent.map((r) => ({
        id: r.id,
        condition: r.condition,
        location: r.location,
        acquiredDate: r.acquiredDate,
        purchasePrice: r.purchasePrice,
        createdAt: r.createdAt,
        title: r.dlcTitle ?? r.releaseTitle,
        masterGameTitle: r.masterGameTitle,
        masterGameSlug: r.masterGameSlug,
        masterGameCover: r.masterGameCover,
        playableOn: r.playableOn,
        type: r.dlcTitle ? "dlc" : "game",
    }));
}
/**
 * Transforms raw DB rows to platform distribution entries.
 */
function mapPlatformDistribution(rows) {
    return rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        count: safeNumber(r.count),
    }));
}
// ---------------------------------------------------------------------------
// safeNumber tests
// ---------------------------------------------------------------------------
describe("safeNumber", () => {
    it("returns number for valid numeric input", () => {
        expect(safeNumber(42)).toBe(42);
        expect(safeNumber(0)).toBe(0);
        expect(safeNumber(-5)).toBe(-5);
    });
    it("returns 0 for NaN", () => {
        expect(safeNumber(NaN)).toBe(0);
    });
    it("returns 0 for Infinity", () => {
        expect(safeNumber(Infinity)).toBe(0);
        expect(safeNumber(-Infinity)).toBe(0);
    });
    it("returns 0 for null and undefined", () => {
        expect(safeNumber(null)).toBe(0);
        expect(safeNumber(undefined)).toBe(0);
    });
    it("handles string values", () => {
        expect(safeNumber("42")).toBe(42);
        expect(safeNumber("3.14")).toBe(3.14);
        expect(safeNumber("not-a-number")).toBe(0);
    });
    it("handles bigint", () => {
        expect(safeNumber(BigInt(9007199254740991))).toBe(9007199254740991);
    });
    it("handles boolean values", () => {
        expect(safeNumber(true)).toBe(1);
        expect(safeNumber(false)).toBe(0);
    });
});
// ---------------------------------------------------------------------------
// safeFloat tests
// ---------------------------------------------------------------------------
describe("safeFloat", () => {
    it("returns number for valid numeric input", () => {
        expect(safeFloat(42)).toBe(42);
        expect(safeFloat(3.14)).toBe(3.14);
        expect(safeFloat(0)).toBe(0);
    });
    it("returns 0 for null and undefined", () => {
        expect(safeFloat(null)).toBe(0);
        expect(safeFloat(undefined)).toBe(0);
    });
    it("parses string values with parseFloat", () => {
        expect(safeFloat("42.99")).toBe(42.99);
        expect(safeFloat("3.14")).toBe(3.14);
    });
    it("handles currency strings", () => {
        // parseFloat would parse "19.99" from "$19.99" — we just want "19.99"
        expect(safeFloat("19.99")).toBe(19.99);
    });
    it("returns 0 for NaN", () => {
        expect(safeFloat(NaN)).toBe(0);
    });
    it("returns 0 for Infinity", () => {
        expect(safeFloat(Infinity)).toBe(0);
    });
    it("handles empty string", () => {
        expect(safeFloat("")).toBe(0);
    });
    it("handles objects gracefully", () => {
        expect(safeFloat({})).toBe(0);
        expect(safeFloat([])).toBe(0);
    });
});
// ---------------------------------------------------------------------------
// mapPlatformDistribution tests
// ---------------------------------------------------------------------------
describe("mapPlatformDistribution", () => {
    it("maps rows preserving slug, name, and count", () => {
        const rows = [
            { slug: "Win", name: "Windows", count: 42 },
            { slug: "PS5", name: "PlayStation 5", count: 15 },
        ];
        const result = mapPlatformDistribution(rows);
        expect(result).toEqual([
            { slug: "Win", name: "Windows", count: 42 },
            { slug: "PS5", name: "PlayStation 5", count: 15 },
        ]);
    });
    it("handles empty array", () => {
        expect(mapPlatformDistribution([])).toEqual([]);
    });
    it("sanitizes count via safeNumber", () => {
        const rows = [
            { slug: "Win", name: "Windows", count: NaN },
        ];
        const result = mapPlatformDistribution(rows);
        expect(result[0].count).toBe(0);
    });
});
// ---------------------------------------------------------------------------
// mergeRecentInstances tests
// ---------------------------------------------------------------------------
describe("mergeRecentInstances", () => {
    const makeRelease = (overrides = {}) => ({
        id: 1,
        createdAt: new Date("2024-01-15"),
        releaseTitle: "Halo CE",
        dlcTitle: null,
        masterGameTitle: "Halo: Combat Evolved",
        masterGameSlug: "halo-combat-evolved",
        masterGameCover: "https://example.com/cover.jpg",
        playableOn: ["Win"],
        condition: "CIB",
        location: "Shelf A",
        acquiredDate: "2024-01-10",
        purchasePrice: "29.99",
        ...overrides,
    });
    const makeDlc = (overrides = {}) => ({
        id: 100,
        createdAt: new Date("2024-02-20"),
        releaseTitle: null,
        dlcTitle: "Expansion Pack",
        masterGameTitle: "The Sims",
        masterGameSlug: "the-sims",
        masterGameCover: null,
        playableOn: null,
        condition: null,
        location: null,
        acquiredDate: null,
        purchasePrice: null,
        ...overrides,
    });
    it("merges and sorts by createdAt descending", () => {
        const releases = [
            makeRelease({ id: 1, createdAt: new Date("2024-01-15") }),
            makeRelease({ id: 2, createdAt: new Date("2024-03-10") }),
        ];
        const dlcs = [
            makeDlc({ id: 100, createdAt: new Date("2024-02-20") }),
        ];
        const result = mergeRecentInstances(releases, dlcs, 5);
        expect(result).toHaveLength(3);
        // Most recent first
        expect(result[0].createdAt).toEqual(new Date("2024-03-10"));
        expect(result[1].createdAt).toEqual(new Date("2024-02-20"));
        expect(result[2].createdAt).toEqual(new Date("2024-01-15"));
    });
    it("truncates to the specified limit", () => {
        const releases = Array.from({ length: 10 }, (_, i) => makeRelease({ id: i, createdAt: new Date(2024, 0, i + 1) }));
        const result = mergeRecentInstances(releases, [], 5);
        expect(result).toHaveLength(5);
    });
    it("sets type to 'dlc' when dlcTitle is present", () => {
        const dlcs = [makeDlc({ id: 100, dlcTitle: "Expansion" })];
        const result = mergeRecentInstances([], dlcs, 5);
        expect(result[0].type).toBe("dlc");
    });
    it("sets type to 'game' when dlcTitle is null", () => {
        const releases = [makeRelease({ id: 1, dlcTitle: null })];
        const result = mergeRecentInstances(releases, [], 5);
        expect(result[0].type).toBe("game");
    });
    it("falls back to releaseTitle for game instances", () => {
        const releases = [makeRelease({ id: 1, releaseTitle: "Game Title" })];
        const result = mergeRecentInstances(releases, [], 5);
        expect(result[0].title).toBe("Game Title");
    });
    it("uses dlcTitle when present", () => {
        const dlcs = [makeDlc({ id: 100, dlcTitle: "DLC Name", releaseTitle: "Ignored" })];
        const result = mergeRecentInstances([], dlcs, 5);
        expect(result[0].title).toBe("DLC Name");
    });
    it("handles null createdAt by treating as epoch 0", () => {
        const releases = [
            makeRelease({ id: 1, createdAt: null }),
            makeRelease({ id: 2, createdAt: new Date("2024-06-01") }),
        ];
        const result = mergeRecentInstances(releases, [], 5);
        // The one with a real date should be first
        expect(result[0].id).toBe(2);
    });
    it("handles empty inputs", () => {
        const result = mergeRecentInstances([], [], 5);
        expect(result).toEqual([]);
    });
    it("maps all fields correctly", () => {
        const releases = [makeRelease({
                id: 42,
                condition: "CIB",
                location: "Shelf",
                acquiredDate: "2024-01-01",
                purchasePrice: "59.99",
                masterGameTitle: "Zelda",
                masterGameSlug: "zelda",
                masterGameCover: "cover.jpg",
                playableOn: ["Switch"],
            })];
        const result = mergeRecentInstances(releases, [], 5);
        const r = result[0];
        expect(r.id).toBe(42);
        expect(r.condition).toBe("CIB");
        expect(r.location).toBe("Shelf");
        expect(r.acquiredDate).toBe("2024-01-01");
        expect(r.purchasePrice).toBe("59.99");
        expect(r.masterGameTitle).toBe("Zelda");
        expect(r.masterGameSlug).toBe("zelda");
        expect(r.masterGameCover).toBe("cover.jpg");
        expect(r.playableOn).toEqual(["Switch"]);
        expect(r.type).toBe("game");
    });
});
//# sourceMappingURL=dashboard.test.js.map