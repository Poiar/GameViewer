import {
  Content
} from "./content";
import {GameIteration} from "./gameIteration";
import {
  GameVersion,
} from "./gameVersion";

export const dlcs: DLC[] = [];

export class DLC extends Content{
  readonly gameIterations: GameIteration[];
  gameVersion?: GameVersion;

  constructor(id: number, title: string, firstRelease: number) {
    super(id, title, firstRelease);
    this.gameIterations = [];

    dlcs.push(this);
  }

  addGameIteration(gameIteration: GameIteration) {
    this.gameIterations.push(gameIteration);
  }
}

export const d_PC_original_heroesOfMightAndMagic2_thePriceOfLoyalty = new DLC(1, "The Price of Loyalty", 1997);
export const d_PC_original_heroesOfMightAndMagic3_armageddonsBlade = new DLC(2, "Armageddon's Blade", 1999);
export const d_PC_original_heroesOfMightAndMagic3_theShadowOfDeath = new DLC(3, "The Shadow of Death", 2000);
export const d_PC_original_heroesOfMightAndMagic4_theGatheringStorm = new DLC(4, "The Gathering Storm", 2002);
export const d_PC_original_heroesOfMightAndMagic4_windsOfWar = new DLC(5, "Winds of War", 2003);



export function getAllDLCs():DLC[] {
  return dlcs;
}
