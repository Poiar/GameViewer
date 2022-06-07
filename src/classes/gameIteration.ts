import {DLC} from "./dlc";
import {Collection} from "./collection";

export class GameIteration {
  readonly id: number;
  readonly gameVersion: GameIteration[];
  readonly collections: Collection[];
  readonly dlcs: DLC[];

  constructor(id: number) {
    this.id = id;
    this.gameVersion = [];
    this.dlcs = [];
    this.collections = [];
  }

  addDlc(dlc: DLC) {
    this.dlcs.push(dlc);
  }

  addDlcs(dlcs: DLC[]) {
    dlcs.forEach(dlc => this.dlcs.push(dlc));
  }

  addCollection(collection: Collection) {
    this.collections.push(collection);
  }

}

export const gi_PC_warcraft3 = new GameIteration(1,);
export const gi_PC_heroesOfMightAndMagic = new GameIteration(2,);
export const gi_PC_heroesOfMightAndMagic2 = new GameIteration(3);
export const gi_PC_heroesOfMightAndMagic3_1 = new GameIteration(4);
export const gi_PC_heroesOfMightAndMagic4 = new GameIteration(5);
export const gi_PC_halfLife2 = new GameIteration(6);
export const gi_PC_halfLife2Episode1 = new GameIteration(7);
export const gi_PC_halfLife2Episode2 = new GameIteration(8);
export const gi_PC_portal = new GameIteration(9);
export const gi_PC_teamFortress2 = new GameIteration(10);
export const gi_3DS_metalGearSolid3 = new GameIteration(11);
export const gi_PS3_metalGearSolid2 = new GameIteration(12);
export const gi_PS3_metalGearSolid3 = new GameIteration(13);
export const gi_PS3_metalGearSolid4 = new GameIteration(14);
export const gi_PC_heroesOfMightAndMagic3_2 = new GameIteration(15);

const gameIterations: GameIteration[] = [
  gi_PC_warcraft3,
  gi_PC_heroesOfMightAndMagic,
  gi_PC_heroesOfMightAndMagic2,
  gi_PC_heroesOfMightAndMagic3_1,
  gi_PC_heroesOfMightAndMagic4,
  gi_PC_halfLife2,
  gi_PC_halfLife2Episode1,
  gi_PC_halfLife2Episode2,
  gi_PC_portal,
  gi_PC_teamFortress2,
  gi_3DS_metalGearSolid3,
  gi_PS3_metalGearSolid2,
  gi_PS3_metalGearSolid3,
  gi_PS3_metalGearSolid4,
  gi_PC_heroesOfMightAndMagic3_2,
];

export function getAllGameIterations(): GameIteration[] {
  return gameIterations;
}

// gameIterations.forEach(gameIteration => {
//   gameIteration.dlcs.forEach(dlc => dlc.addGameIteration(gameIteration));
// });


