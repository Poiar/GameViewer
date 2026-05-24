import { Game, allGames, genreEnum } from "./model";
import {
  s_none,
  s_warcraft,
  s_metalGearSolid,
  s_heroesOfMightAndMagic,
  s_halfLife,
  s_portal,
  s_teamFortress,
  s_ageOfEmpires,
  s_redDead,
  s_theWitcher,
} from "./seriesData";

export const g_warcraft3 = new Game("Warcraft 3: Reign of Chaos", genreEnum.rts, 2002, s_warcraft, []);
export const g_heroesOfMightAndMagic = new Game(
  "Heroes of Might and Magic",
  genreEnum.rpg,
  1995,
  s_heroesOfMightAndMagic,
  [],
);
export const g_heroesOfMightAndMagic2 = new Game(
  "Heroes of Might and Magic 2",
  genreEnum.rpg,
  1996,
  s_heroesOfMightAndMagic,
  [],
);
export const g_heroesOfMightAndMagic3 = new Game(
  "Heroes of Might and Magic 3",
  genreEnum.rpg,
  1999,
  s_heroesOfMightAndMagic,
  [],
);
export const g_heroesOfMightAndMagic4 = new Game(
  "Heroes of Might and Magic 4",
  genreEnum.rpg,
  2002,
  s_heroesOfMightAndMagic,
  [],
);
export const g_halfLife2 = new Game("Half-Life 2", genreEnum.fps, 2004, s_halfLife, []);
export const g_halfLife2Episode1 = new Game("Half-Life 2: Episode One", genreEnum.fps, 2006, s_halfLife, []);
export const g_halfLife2Episode2 = new Game("Half-Life 2: Episode Two", genreEnum.fps, 2007, s_halfLife, []);
export const g_portal = new Game("Portal", genreEnum.fps, 2007, s_portal, []);
export const g_teamFortress2 = new Game("Team Fortress 2", genreEnum.fps, 2007, s_teamFortress, []);
export const g_metalGearSolid = new Game("Metal Gear Solid", genreEnum.stealth, 1998, s_metalGearSolid, []);
export const g_metalGearSolid2 = new Game(
  "Metal Gear Solid 2: Sons of Liberty",
  genreEnum.stealth,
  2001,
  s_metalGearSolid,
  [],
);
export const g_metalGearSolid3 = new Game(
  "Metal Gear Solid 3: Snake Eater",
  genreEnum.stealth,
  2004,
  s_metalGearSolid,
  [],
);
export const g_metalGearSolid4 = new Game(
  "Metal Gear Solid 4: Guns of the Patriots",
  genreEnum.stealth,
  2008,
  s_metalGearSolid,
  [],
);
export const g_ageOfEmpires2 = new Game("Age of Empires II: The Age of Kings", genreEnum.rts, 1999, s_ageOfEmpires, []);
export const g_indigoProphecy = new Game("Indigo Prophecy", genreEnum.undefined, 2005, s_none, ["Fahrenheit"]);
export const g_redDeadRedemption = new Game("Red Dead Redemption", genreEnum.openWorld, 2010, s_redDead, []);
export const g_redDeadRedemptionUndeadNightmare = new Game(
  "Red Dead Redemption: Undead Nightmare",
  genreEnum.openWorld,
  2010,
  s_redDead,
  [],
);
export const g_theWitcher3 = new Game("The Witcher 3: Wild Hunt", genreEnum.openWorld, 2015, s_theWitcher, []);
