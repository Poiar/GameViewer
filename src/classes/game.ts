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
  s_teamFortress, s_ageOfEmpires, allSeries, s_redDead, s_theWitcher,
} from "./series";
import {allDlcs, Dlc} from "./dlc";

export enum genreEnum {
  undefined,
  rts,
  rpg,
  jrpg,
  karting,
  platformer2d,
  platformer3d,
  fps,
  stealth,
  tbs,
  openWorld,
}

export namespace genreEnum {
  export function toString(input: genreEnum): string {
    switch (input) {
      case genreEnum.undefined:
        return 'Undefined';
      case genreEnum.rts:
        return 'RTS';
      case genreEnum.rpg:
        return 'RPG';
      case genreEnum.jrpg:
        return 'JRPG';
      case genreEnum.karting:
        return 'Karting';
      case genreEnum.platformer2d:
        return '2D Platformer';
      case genreEnum.platformer3d:
        return '3D Platformer';
      case genreEnum.fps:
        return 'FPS';
      case genreEnum.stealth:
        return 'Stealth';
      case genreEnum.tbs:
        return 'TBS';
      case genreEnum.openWorld:
        return 'Open World';
    }
    throw 'You called versionEnum.toString() with something that is unhandled - Throwing';
  }
}

export const allGames: Game[] = [];

export class Game extends Content{
  readonly genre: genreEnum;
  readonly gameVersions: GameVersion[];
  readonly series: Series;
  readonly alternativeTitles: string[];

  constructor(title: string, genre: genreEnum, firstRelease: number, series: Series, alternativeTitles: string[]) {
    super(allGames.length, title, firstRelease);
    this.genre = genre;
    this.alternativeTitles = alternativeTitles;

    this.gameVersions = [];

    this.series = series;
    series.games.push(this);

    allGames.push(this);
  }

  addGameVersion(gameVersion: GameVersion) {
    this.gameVersions.push(gameVersion);
  }

  getAllDlcForThisGame(): Dlc[] {
    const allDlcForThisGameVersion: Dlc[] = [];

    this.gameVersions.forEach(gameVersion => {
      allDlcs.forEach(dlc => {
        dlc.dlcVersions.forEach(dlcVersion => {
          if(dlcVersion.gameVersionsThisCanBeUsedOn.includes(gameVersion)){
            allDlcForThisGameVersion.push(dlc);
          }
        })
      })
    })

    return [...new Set(allDlcForThisGameVersion)]
  }

  getGenre(): string {
    return genreEnum.toString(this.genre);
  }
}

export const g_warcraft3 = new Game("Warcraft 3: Reign of Chaos", genreEnum.rts, 2002, s_warcraft, []);
export const g_heroesOfMightAndMagic = new Game("Heroes of Might and Magic", genreEnum.rpg, 1995, s_heroesOfMightAndMagic, []);
export const g_heroesOfMightAndMagic2 = new Game("Heroes of Might and Magic 2", genreEnum.rpg, 1996, s_heroesOfMightAndMagic, []);
export const g_heroesOfMightAndMagic3 = new Game("Heroes of Might and Magic 3", genreEnum.rpg, 1999, s_heroesOfMightAndMagic, []);
export const g_heroesOfMightAndMagic4 = new Game("Heroes of Might and Magic 4", genreEnum.rpg, 2002, s_heroesOfMightAndMagic, []);
export const g_halfLife2 = new Game("Half-Life 2", genreEnum.fps, 2004, s_halfLife, []);
export const g_halfLife2Episode1 = new Game("Half-Life 2: Episode One", genreEnum.fps, 2006, s_halfLife, []);
export const g_halfLife2Episode2 = new Game("Half-Life 2: Episode Two", genreEnum.fps, 2007, s_halfLife, []);
export const g_portal = new Game("Portal", genreEnum.fps, 2007, s_portal, []);
export const g_teamFortress2 = new Game("Team Fortress 2", genreEnum.fps, 2007, s_teamFortress, []);
export const g_metalGearSolid = new Game("Metal Gear Solid", genreEnum.stealth, 1998, s_metalGearSolid, []);
export const g_metalGearSolid2 = new Game("Metal Gear Solid 2: Sons of Liberty", genreEnum.stealth, 2001, s_metalGearSolid, []);
export const g_metalGearSolid3 = new Game("Metal Gear Solid 3: Snake Eater", genreEnum.stealth, 2004, s_metalGearSolid, []);
export const g_metalGearSolid4 = new Game("Metal Gear Solid 4: Guns of the Patriots", genreEnum.stealth, 2008, s_metalGearSolid, []);
export const g_ageOfEmpires2 = new Game("Age of Empires II: The Age of Kings", genreEnum.rts, 1999, s_ageOfEmpires, []);
export const g_indigoProphecy = new Game("Indigo Prophecy", genreEnum.undefined, 1999, s_none, ["Fahrenheit"]);
export const g_redDeadRedemption = new Game("Red Dead Redemption", genreEnum.openWorld, 2010, s_redDead, []);
export const g_redDeadRedemptionUndeadNightmare = new Game("Red Dead Redemption: Undead Nightmare", genreEnum.openWorld, 2010, s_redDead, []);
export const g_theWitcher3 = new Game("The Witcher 3: Wild Hunt", genreEnum.openWorld, 2015, s_theWitcher, []);

console.log({allGames});

// export function getAllSeries(): Series[] {
//   return [...new Set(allGames.map(game => game.series))]; //Unique
// }

