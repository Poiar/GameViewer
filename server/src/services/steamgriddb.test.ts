import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Pure-function extractions from steamgriddb.ts for isolated testing
// ---------------------------------------------------------------------------

/**
 * Clean game title for SGDB search — removes edition suffixes that hurt matching.
 * Mirrors the searchGame function's title cleaning logic.
 */
function cleanGameTitle(title: string): string {
  return title
    .replace(/\s*\(HD\)\s*/gi, "")
    .replace(/\s*\(Remastered\)\s*/gi, "")
    .replace(/\s*\(GOTY\)\s*/gi, "")
    .replace(/\s*\(Definitive Edition\)\s*/gi, "")
    .replace(/\s*\(Enhanced\)\s*/gi, "")
    .replace(/\s*\(Demake\)\s*/gi, "")
    .trim();
}

/**
 * Pick the best grid from an array — highest score wins.
 * Mirrors getBestGrid logic.
 */
interface Grid { id: number; score: number; url: string; style: string }
function pickBestGrid(grids: Grid[]): Grid | null {
  if (!grids?.length) return null;
  return grids.sort((a, b) => b.score - a.score)[0];
}

/**
 * Pick the best result from SGDB autocomplete — prefer exact name match, then verified.
 */
interface SgdbGame { id: number; name: string; verified: boolean }
function pickBestGameMatch(results: SgdbGame[], cleanedTitle: string): SgdbGame | null {
  if (!results?.length) return null;
  const exact = results.find((g) => g.name.toLowerCase() === cleanedTitle.toLowerCase());
  const verified = results.find((g) => g.verified);
  return exact ?? verified ?? results[0];
}

// ---------------------------------------------------------------------------
// cleanGameTitle tests
// ---------------------------------------------------------------------------

describe("cleanGameTitle", () => {
  it("removes (HD) suffix case-insensitively", () => {
    expect(cleanGameTitle("Super Mario Bros. (HD)")).toBe("Super Mario Bros.");
    expect(cleanGameTitle("The Legend of Zelda (hd)")).toBe("The Legend of Zelda");
    expect(cleanGameTitle("Game (Hd)")).toBe("Game");
  });

  it("removes (Remastered) suffix", () => {
    expect(cleanGameTitle("Final Fantasy 4 (Remastered)")).toBe("Final Fantasy 4");
    expect(cleanGameTitle("Game (remastered)")).toBe("Game");
  });

  it("removes (GOTY) suffix", () => {
    expect(cleanGameTitle("The Witcher 3 (GOTY)")).toBe("The Witcher 3");
    expect(cleanGameTitle("Game (goty)")).toBe("Game");
  });

  it("removes (Definitive Edition) suffix", () => {
    expect(cleanGameTitle("Age of Empires 2 (Definitive Edition)")).toBe("Age of Empires 2");
  });

  it("removes (Enhanced) suffix", () => {
    expect(cleanGameTitle("Game Name (Enhanced)")).toBe("Game Name");
  });

  it("removes (Demake) suffix", () => {
    expect(cleanGameTitle("Shadowgate (Demake)")).toBe("Shadowgate");
  });

  it("trims surrounding whitespace", () => {
    expect(cleanGameTitle("  Tetris  ")).toBe("Tetris");
  });

  it("preserves normal titles without suffixes", () => {
    expect(cleanGameTitle("Tetris")).toBe("Tetris");
    expect(cleanGameTitle("Super Mario 64")).toBe("Super Mario 64");
  });

  it("handles title with multiple suffixes (removes all)", () => {
    // Removes (HD), (Remastered), (GOTY) in order — a title might have one
    expect(cleanGameTitle("Game (HD) (Remastered)")).toBe("Game");
  });

  it("does not remove parentheticals that don't match", () => {
    expect(cleanGameTitle("Star Wars (1994)")).toBe("Star Wars (1994)");
    expect(cleanGameTitle("Mega Man (Classic)")).toBe("Mega Man (Classic)");
  });

  it("handles empty string", () => {
    expect(cleanGameTitle("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// pickBestGrid tests
// ---------------------------------------------------------------------------

describe("pickBestGrid", () => {
  it("returns null for empty array", () => {
    expect(pickBestGrid([])).toBeNull();
  });

  it("returns the grid with highest score", () => {
    const grids: Grid[] = [
      { id: 1, score: 3, url: "a.jpg", style: "alternate" },
      { id: 2, score: 10, url: "b.jpg", style: "white_logo" },
      { id: 3, score: 7, url: "c.jpg", style: "no_logo" },
    ];
    const best = pickBestGrid(grids);
    expect(best?.id).toBe(2);
    expect(best?.score).toBe(10);
  });

  it("returns the only element for single-item array", () => {
    const grids: Grid[] = [{ id: 1, score: 5, url: "only.jpg", style: "alternate" }];
    expect(pickBestGrid(grids)?.id).toBe(1);
  });

  it("handles equal scores (first by position after sort)", () => {
    const grids: Grid[] = [
      { id: 1, score: 5, url: "a.jpg", style: "alt" },
      { id: 2, score: 5, url: "b.jpg", style: "wl" },
    ];
    const best = pickBestGrid(grids);
    // sort is stable, so first item stays first
    expect(best?.score).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// pickBestGameMatch tests
// ---------------------------------------------------------------------------

describe("pickBestGameMatch", () => {
  it("returns null for empty results", () => {
    expect(pickBestGameMatch([], "Tetris")).toBeNull();
  });

  it("prefers exact name match", () => {
    const results: SgdbGame[] = [
      { id: 3, name: "Tetris Attack", verified: true },
      { id: 1, name: "Tetris", verified: false },
      { id: 2, name: "Tetris 2", verified: true },
    ];
    const match = pickBestGameMatch(results, "Tetris");
    expect(match?.id).toBe(1);
    expect(match?.name).toBe("Tetris");
  });

  it("falls back to first verified result", () => {
    const results: SgdbGame[] = [
      { id: 1, name: "Super Mario", verified: false },
      { id: 2, name: "Super Mario Advance", verified: true },
      { id: 3, name: "Super Mario World", verified: false },
    ];
    const match = pickBestGameMatch(results, "Super Mario 64");
    expect(match?.id).toBe(2);
    expect(match?.verified).toBe(true);
  });

  it("falls back to first result when no exact or verified", () => {
    const results: SgdbGame[] = [
      { id: 1, name: "Game A", verified: false },
      { id: 2, name: "Game B", verified: false },
    ];
    const match = pickBestGameMatch(results, "Unknown");
    expect(match?.id).toBe(1);
  });

  it("prefers exact over verified", () => {
    const results: SgdbGame[] = [
      { id: 1, name: "Zelda", verified: false },
      { id: 2, name: "Zelda II", verified: true },
    ];
    const match = pickBestGameMatch(results, "Zelda");
    expect(match?.id).toBe(1); // exact name, even though not verified
  });

  it("is case-insensitive for name matching", () => {
    const results: SgdbGame[] = [
      { id: 1, name: "TETRIS", verified: false },
      { id: 2, name: "Tetris 2", verified: true },
    ];
    const match = pickBestGameMatch(results, "tetris");
    expect(match?.id).toBe(1);
  });
});
