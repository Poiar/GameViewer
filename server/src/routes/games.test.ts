import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Pure-function helpers extracted from games.ts for isolated testing.
// These mirror the logic used in the route handlers.
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface OwnedRelease { platforms: string[]; formats: string[] }

interface GameRow {
  id: number;
  title: string;
  slug: string;
  firstReleaseYear: number;
  description: string | null;
  coverImageUrl: string | null;
  seriesId: number | null;
  seriesName: string | null;
  alternativeTitles: string[];
}

interface GenreRow { id: number; name: string; slug: string }

/**
 * Builds the response game object from a game row, genre map, release count map,
 * and ownership map — exactly as the GET / route assembles it.
 */
function assembleGame(
  g: GameRow,
  genreMap: Record<number, GenreRow[]>,
  rgCountMap: Record<number, number>,
  ownedMap: Record<number, OwnedRelease[]>,
) {
  return {
    id: g.id,
    title: g.title,
    slug: g.slug,
    firstReleaseYear: g.firstReleaseYear,
    description: g.description,
    coverImageUrl: g.coverImageUrl,
    series: g.seriesId ? { id: g.seriesId, name: g.seriesName } : null,
    alternativeTitles: g.alternativeTitles,
    genres: genreMap[g.id] || [],
    releaseGroupsCount: rgCountMap[g.id] || 0,
    ownedReleases: ownedMap[g.id] || [],
  };
}

/**
 * Builds ownership map from raw owned instances — mirrors the batch query logic.
 */
function buildOwnedMap(
  ownedReleases: Array<{ releaseId: number; gameId: number; platforms: string[]; format: string }>,
): Record<number, OwnedRelease[]> {
  const map: Record<number, OwnedRelease[]> = {};
  for (const rel of ownedReleases) {
    if (!map[rel.gameId]) map[rel.gameId] = [];
    map[rel.gameId].push({
      platforms: rel.platforms,
      formats: rel.format ? [rel.format] : [],
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// slugify tests
// ---------------------------------------------------------------------------

describe("slugify", () => {
  it("converts a simple title to a slug", () => {
    expect(slugify("Zelda Ocarina of Time")).toBe("zelda-ocarina-of-time");
  });

  it("handles special characters", () => {
    expect(slugify("Super Mario 64™")).toBe("super-mario-64");
    expect(slugify("Ratchet & Clank")).toBe("ratchet-clank");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("- Test -")).toBe("test");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("collapses multiple non-alphanumeric chars", () => {
    expect(slugify("Hello!!!   World")).toBe("hello-world");
  });
});

// ---------------------------------------------------------------------------
// buildOwnedMap tests
// ---------------------------------------------------------------------------

describe("buildOwnedMap", () => {
  it("returns an empty object for empty input", () => {
    expect(buildOwnedMap([])).toEqual({});
  });

  it("groups owned releases by gameId", () => {
    const owned = [
      { releaseId: 1, gameId: 100, platforms: ["Win"], format: "Digital" },
      { releaseId: 2, gameId: 100, platforms: ["PS5"], format: "Blu-ray" },
      { releaseId: 3, gameId: 200, platforms: ["Switch"], format: "Cartridge" },
    ];
    const map = buildOwnedMap(owned);
    expect(map[100]).toHaveLength(2);
    expect(map[200]).toHaveLength(1);
  });

  it("includes platforms array for each owned release", () => {
    const owned = [
      { releaseId: 1, gameId: 100, platforms: ["Win", "Mac"], format: "Digital" },
    ];
    const map = buildOwnedMap(owned);
    expect(map[100][0].platforms).toEqual(["Win", "Mac"]);
    expect(map[100][0].formats).toEqual(["Digital"]);
  });

  it("handles empty format", () => {
    const owned = [
      { releaseId: 1, gameId: 100, platforms: ["PS1"], format: "" },
    ];
    const map = buildOwnedMap(owned);
    expect(map[100][0].formats).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// assembleGame tests
// ---------------------------------------------------------------------------

describe("assembleGame", () => {
  const baseGame: GameRow = {
    id: 42,
    title: "Test Game",
    slug: "test-game",
    firstReleaseYear: 2020,
    description: "A test game",
    coverImageUrl: "https://example.com/cover.jpg",
    seriesId: 7,
    seriesName: "Test Series",
    alternativeTitles: ["Test Alt"],
  };

  const emptyGenreMap: Record<number, GenreRow[]> = {};
  const emptyRgCount: Record<number, number> = {};
  const emptyOwned: Record<number, OwnedRelease[]> = {};

  it("assembles a game with all fields present", () => {
    const result = assembleGame(baseGame, emptyGenreMap, emptyRgCount, emptyOwned);
    expect(result.id).toBe(42);
    expect(result.title).toBe("Test Game");
    expect(result.series).toEqual({ id: 7, name: "Test Series" });
    expect(result.ownedReleases).toEqual([]);
  });

  it("includes genres from genreMap", () => {
    const genres: Record<number, GenreRow[]> = {
      42: [
        { id: 1, name: "Action", slug: "action" },
        { id: 2, name: "RPG", slug: "rpg" },
      ],
    };
    const result = assembleGame(baseGame, genres, emptyRgCount, emptyOwned);
    expect(result.genres).toHaveLength(2);
    expect(result.genres[0].name).toBe("Action");
  });

  it("sets series to null when seriesId is null", () => {
    const noSeriesGame = { ...baseGame, seriesId: null, seriesName: null };
    const result = assembleGame(noSeriesGame, emptyGenreMap, emptyRgCount, emptyOwned);
    expect(result.series).toBeNull();
  });

  it("includes ownedReleases from ownedMap", () => {
    const owned: Record<number, OwnedRelease[]> = {
      42: [
        { platforms: ["Win"], formats: ["Digital"] },
        { platforms: ["PS5"], formats: ["Blu-ray"] },
      ],
    };
    const result = assembleGame(baseGame, emptyGenreMap, emptyRgCount, owned);
    expect(result.ownedReleases).toHaveLength(2);
    expect(result.ownedReleases[0].platforms).toEqual(["Win"]);
    expect(result.ownedReleases[1].formats).toEqual(["Blu-ray"]);
  });

  it("returns empty ownedReleases when game not in ownedMap", () => {
    const owned: Record<number, OwnedRelease[]> = {
      99: [{ platforms: ["Switch"], formats: ["Cartridge"] }],
    };
    const result = assembleGame(baseGame, emptyGenreMap, emptyRgCount, owned);
    expect(result.ownedReleases).toEqual([]);
  });

  it("includes releaseGroupsCount from map", () => {
    const rgCount: Record<number, number> = { 42: 5 };
    const result = assembleGame(baseGame, emptyGenreMap, rgCount, emptyOwned);
    expect(result.releaseGroupsCount).toBe(5);
  });

  it("defaults releaseGroupsCount to 0", () => {
    const result = assembleGame(baseGame, emptyGenreMap, emptyRgCount, emptyOwned);
    expect(result.releaseGroupsCount).toBe(0);
  });
});
