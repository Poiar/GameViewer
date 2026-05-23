import { Game } from "./game";

export const allSeries: Series[] = [];

export class Series {
  readonly id: number;
  readonly title: string;
  games: Game[];

  constructor(title: string) {
    this.id = allSeries.length;
    this.title = title;
    this.games = [];

    allSeries.push(this);
  }
}

export const s_none = new Series("None");
export const s_warcraft = new Series("Warcraft");
export const s_metalGearSolid = new Series("Metal Gear Solid");
export const s_heroesOfMightAndMagic = new Series("Heroes of Might And Magic");
export const s_halfLife = new Series("Half-Life");
export const s_portal = new Series("Portal");
export const s_teamFortress = new Series("Team Fortress");
export const s_ageOfEmpires = new Series("Age of Empires");
export const s_redDead = new Series("Red Dead");
export const s_theWitcher = new Series("The Witcher");

console.log({ allSeries });
