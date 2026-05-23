import { Game, genreEnum, allGames } from "./game";
import { Series, allSeries } from "./series";
import { allSuperVersions } from "./superVersion";
import { allDlcs } from "./dlc";

describe("genreEnum", () => {
  it("should convert enum values to strings", () => {
    expect(genreEnum.toString(genreEnum.rts)).toBe("RTS");
    expect(genreEnum.toString(genreEnum.fps)).toBe("FPS");
    expect(genreEnum.toString(genreEnum.openWorld)).toBe("Open World");
    expect(genreEnum.toString(genreEnum.platformer2d)).toBe("2D Platformer");
    expect(genreEnum.toString(genreEnum.undefined)).toBe("Undefined");
  });
});

describe("Game", () => {
  it("should have games registered in allGames", () => {
    expect(allGames.length).toBeGreaterThan(0);
  });

  it("should assign incremental ids", () => {
    expect(allGames[0].id).toBe(0);
    expect(allGames[1].id).toBe(1);
  });

  it("should store correct properties", () => {
    const warcraft = allGames.find((g) => g.title === "Warcraft 3: Reign of Chaos");
    expect(warcraft).toBeDefined();
    expect(warcraft!.genre).toBe(genreEnum.rts);
    expect(warcraft!.firstRelease).toBe(2002);
    expect(warcraft!.alternativeTitles).toEqual([]);
  });

  it("should link games to their series", () => {
    const metalGearGames = allGames.filter((g) => g.series.title === "Metal Gear Solid");
    expect(metalGearGames.length).toBe(4);
    metalGearGames.forEach((g) => {
      expect(g.series.games).toContain(g);
    });
  });

  it("should return genre as string", () => {
    const game = allGames.find((g) => g.title === "Half-Life 2")!;
    expect(game.getGenre()).toBe("FPS");
  });

  it("should have alternative titles when provided", () => {
    const indigo = allGames.find((g) => g.title === "Indigo Prophecy")!;
    expect(indigo.alternativeTitles).toEqual(["Fahrenheit"]);
  });

  it("should have superVersions populated via constructor linkage", () => {
    const warcraft = allGames.find((g) => g.title === "Warcraft 3: Reign of Chaos")!;
    expect(warcraft.superVersions.length).toBeGreaterThan(0);
  });
});

describe("Series", () => {
  it("should have all series registered", () => {
    expect(allSeries.length).toBe(10);
  });

  it("should assign incremental ids", () => {
    expect(allSeries[0].id).toBe(0);
    expect(allSeries[1].id).toBe(1);
  });

  it("should link games to series bidirectionally", () => {
    const halfLifeSeries = allSeries.find((s) => s.title === "Half-Life")!;
    expect(halfLifeSeries.games.length).toBe(3);
    expect(halfLifeSeries.games.every((g) => g.series === halfLifeSeries)).toBeTrue();
  });
});
