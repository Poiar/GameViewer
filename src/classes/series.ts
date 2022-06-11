import {Game} from "./game";

export const allSeries: Series[] = [];

export class Series {
  readonly id: number;
  readonly title: string;
  games: Game[];

  constructor(id: number, title: string) {
    this.id = id;
    this.title = title;
    this.games = [];

    allSeries.push(this);
  }

}

export const s_none = new Series(0, "None");
export const s_warcraft = new Series(1, "Warcraft");
export const s_metalGearSolid = new Series(1, "Metal Gear Solid");
export const s_heroesOfMightAndMagic = new Series(2, "Heroes of Might And Magic");
export const s_halfLife = new Series(3, "Half-Life");
export const s_portal = new Series(4, "Portal");
export const s_teamFortress = new Series(5, "Team Fortress");
export const s_ageOfEmpires = new Series(5, "Age of Empires");

export const series: Series[] = [
  s_none,
  s_warcraft,
  s_metalGearSolid,
  s_heroesOfMightAndMagic,
  s_halfLife,
  s_portal,
  s_teamFortress,
]

console.log(allSeries);
