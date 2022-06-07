import {Game} from "./game";

export class Series {
  readonly id: number;
  readonly title: string;
  games: Game[];

  constructor(id: number, title: string) {
    this.id = id;
    this.title = title;
    this.games = [];
  }

  addGame(game: Game) {
    this.games.push(game);
  }

  // getGames(): Game[] {
  //   const games:Game[] = getAllGames().filter(game => this.gameIds.includes(game.id));
  //   return games;
  // }

}

export const s_none = new Series(0, "None");
export const s_warcraft = new Series(1, "Warcraft");
export const s_metalGearSolid = new Series(1, "Metal Gear Solid");
export const s_heroesOfMightAndMagic = new Series(2, "Heroes of Might And Magic");
export const s_halfLife = new Series(3, "Half-Life");
export const s_portal = new Series(4, "Portal");
export const s_teamFortress = new Series(5, "Team Fortress");

// export const series: Series[] = [
//   s_none,
//   s_warcraft,
//   s_metalGearSolid,
//   s_heroesOfMightAndMagic,
//   s_halfLife,
//   s_portal,
//   s_teamFortress,
// ]

// export function getAllSeries():Series[]{
//   return series;
// }
