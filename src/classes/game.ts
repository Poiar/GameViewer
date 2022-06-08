import {
  Content
} from "./content";
import {GameVersion} from "./gameVersion";
import {
  Series,
  s_none,
  s_warcraft,
  s_metalGearSolid,
  s_heroesOfMightAndMagic,
  s_halfLife,
  s_portal,
  s_teamFortress,
} from "./series";
import {
  d_heroesOfMightAndMagic2_thePriceOfLoyalty,
  d_heroesOfMightAndMagic3_armageddonsBlade,
  d_heroesOfMightAndMagic3_theShadowOfDeath,
  d_heroesOfMightAndMagic4_theGatheringStorm,
  d_heroesOfMightAndMagic4_windsOfWar,
  DLC
} from "./dlc";

enum genreEnum {
  rts,
  rpg,
  jrpg,
  karting,
  platformer2d,
  platformer3d,
  fps,
  stealth,
  tbs,
}

export class Game extends Content{
  readonly genre: genreEnum;
  readonly gameVersions: GameVersion[];
  readonly series: Series;
  readonly dlcs?: DLC[]

  constructor(id: number, title: string, genre: genreEnum, firstRelease: number, series: Series, dlcs?: DLC[]) {
    super(id, title, firstRelease);
    this.genre = genre;
    this.series = series;
    this.gameVersions = [];
    this.dlcs = dlcs;
    dlcs?.forEach(dlc => {
      dlc.game = this;
    })
  }

  addGameVersion(gameVersion: GameVersion) {
    this.gameVersions.push(gameVersion);
  }
}

export const g_warcraft3 = new Game(1, "Warcraft 3: Reign of Chaos", genreEnum.rts, 2002, s_warcraft, []);
export const g_heroesOfMightAndMagic = new Game(2, "Heroes of Might and Magic", genreEnum.rpg, 1995, s_heroesOfMightAndMagic, []);
export const g_heroesOfMightAndMagic2 = new Game(3, "Heroes of Might and Magic 2", genreEnum.rpg, 1996, s_heroesOfMightAndMagic, [d_heroesOfMightAndMagic2_thePriceOfLoyalty]);
export const g_heroesOfMightAndMagic3 = new Game(4, "Heroes of Might and Magic 3", genreEnum.rpg, 1999, s_heroesOfMightAndMagic, [d_heroesOfMightAndMagic3_armageddonsBlade, d_heroesOfMightAndMagic3_theShadowOfDeath]);
export const g_heroesOfMightAndMagic4 = new Game(5, "Heroes of Might and Magic 4", genreEnum.rpg, 2002, s_heroesOfMightAndMagic, [d_heroesOfMightAndMagic4_windsOfWar, d_heroesOfMightAndMagic4_theGatheringStorm]);
export const g_halfLife2 = new Game(6, "Half-Life 2", genreEnum.fps, 2004, s_halfLife, []);
export const g_halfLife2Episode1 = new Game(7, "Half-Life 2: Episode One", genreEnum.fps, 2006, s_halfLife, []);
export const g_halfLife2Episode2 = new Game(8, "Half-Life 2: Episode Two", genreEnum.fps, 2007, s_halfLife, []);
export const g_portal = new Game(9, "Portal", genreEnum.fps, 2007, s_portal, []);
export const g_teamFortress2 = new Game(10, "Team Fortress 2", genreEnum.fps, 2007, s_teamFortress, []);
export const g_MetalGearSolid = new Game(11, "Metal Gear Solid", genreEnum.stealth, 1998, s_metalGearSolid, []);
export const g_MetalGearSolid2 = new Game(12, "Metal Gear Solid 2: Sons of Liberty", genreEnum.stealth, 2001, s_metalGearSolid, []);
export const g_MetalGearSolid3 = new Game(13, "Metal Gear Solid 3: Snake Eater", genreEnum.stealth, 2004, s_metalGearSolid, []);
export const g_MetalGearSolid4 = new Game(14, "Metal Gear Solid 4: Guns of the Patriots", genreEnum.stealth, 2008, s_metalGearSolid, []);

export const games: Game[] = [
  g_warcraft3,
  g_heroesOfMightAndMagic,
  g_heroesOfMightAndMagic2,
  g_heroesOfMightAndMagic3,
  g_heroesOfMightAndMagic4,
  g_halfLife2,
  g_halfLife2Episode1,
  g_halfLife2Episode2,
  g_portal,
  g_teamFortress2,
  g_MetalGearSolid,
  g_MetalGearSolid2,
  g_MetalGearSolid3,
  g_MetalGearSolid4,
];

//Populate series
games.forEach(game => game.series.addGame(game));

export function getAllGames():Game[] {
  return games;
}

export function getAllSeries(): Series[] {
  return [...new Set(games.map(game => game.series))]; //Unique
}

