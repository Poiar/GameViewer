import {
  Content
} from "./content";
import {GameIteration} from "./gameIteration";
import {Game} from "./game";

export class DLC extends Content{
  readonly gameIterations: GameIteration[];
  game?: Game;

  constructor(id: number, title: string, firstRelease: number) {
    super(id, title, firstRelease);
    this.gameIterations = [];
  }

  addGameIteration(gameIteration: GameIteration) {
    this.gameIterations.push(gameIteration);
  }

/*  addGame(game: Game) {
    this.game = game;
  }*/
}

export const d_heroesOfMightAndMagic2_thePriceOfLoyalty = new DLC(1, "The Price of Loyalty", 1997);
export const d_heroesOfMightAndMagic3_armageddonsBlade = new DLC(2, "Armageddon's Blade", 1999);
export const d_heroesOfMightAndMagic3_theShadowOfDeath = new DLC(3, "The Shadow of Death", 2000);
export const d_heroesOfMightAndMagic4_theGatheringStorm = new DLC(4, "The Gathering Storm", 2002);
export const d_heroesOfMightAndMagic4_windsOfWar = new DLC(5, "Winds of War", 2003);

export const dlcs: DLC[] = [
  d_heroesOfMightAndMagic2_thePriceOfLoyalty,
  d_heroesOfMightAndMagic3_armageddonsBlade,
  d_heroesOfMightAndMagic3_theShadowOfDeath,
  d_heroesOfMightAndMagic4_theGatheringStorm,
  d_heroesOfMightAndMagic4_windsOfWar,
];

export function getAllDLCs():DLC[] {
  return dlcs;
}
