import {
  Content
} from "./content";
import {GameVersion} from "./gameVersion";


export const allDlcs: Dlc[] = [];

export class Dlc extends Content{
  gameVersions: GameVersion[];

  constructor(title: string, firstRelease: number) {
    super(allDlcs.length, title, firstRelease);
    this.gameVersions = [];

    allDlcs.push(this);
  }
}

export const d_heroesOfMightAndMagic2_thePriceOfLoyalty = new Dlc("The Price of Loyalty", 1997);
export const d_heroesOfMightAndMagic3_armageddonsBlade = new Dlc("Armageddon's Blade", 1999);
export const d_heroesOfMightAndMagic3_theShadowOfDeath = new Dlc("The Shadow of Death", 2000);
export const d_heroesOfMightAndMagic4_theGatheringStorm = new Dlc("The Gathering Storm", 2002);
export const d_heroesOfMightAndMagic4_windsOfWar = new Dlc("Winds of War", 2003);
export const d_ageOfEmpires2_theConquerors = new Dlc("The Conquerors", 2000);
export const d_ageOfEmpires2_theForgotten = new Dlc("The Forgotten", 2013);
export const d_ageOfEmpires2_theAfricanKingdoms = new Dlc("The African Kingdoms", 2015);
export const d_ageOfEmpires2_riseOfTheRajas = new Dlc("Rise of the Rajas", 2016);
export const d_ageOfEmpires2_lordsOfTheWest = new Dlc("Lords of the West", 2021);
export const d_ageOfEmpires2_dawnOfTheDukes = new Dlc("Dawn of the Dukes", 2021);
export const d_ageOfEmpires2_dynastiesOfIndia = new Dlc("Dynasties of India", 2022);

export function getAllDLCs():Dlc[] {
  return allDlcs;
}
