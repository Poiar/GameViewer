import {
  Content
} from "./content";
import {DlcVersion} from "./dlcVersion";

export const allDlcs: Dlc[] = [];

enum dlcTypeEnum {
  undefined,
  expansion,
  contentPack,
  extras,
}

namespace dlcTypeEnum {
  export function toString(input: dlcTypeEnum): string {
    switch (input) {
      case dlcTypeEnum.undefined:
        return "Undefined"
      case dlcTypeEnum.expansion:
        return "Expansion"
      case dlcTypeEnum.contentPack:
        return "Content pack"
      case dlcTypeEnum.extras:
        return "Extras"
      default:
        throw `You called dlcTypeEnum.toString() with \'${input}\' which is unhandled - Throwing`
    }
  }
}

export class Dlc extends Content{
  dlcVersions: DlcVersion[];
  dlcType: dlcTypeEnum;

  constructor(title: string, firstRelease: number, dlcType: dlcTypeEnum) {
    super(allDlcs.length, title, firstRelease);
    this.dlcVersions = [];
    this.dlcType = dlcType;

    allDlcs.push(this);
  }

  getDlcType(): string {
    return dlcTypeEnum.toString(this.dlcType);
  }
}

export const d_heroesOfMightAndMagic2_thePriceOfLoyalty = new Dlc("The Price of Loyalty", 1997, dlcTypeEnum.expansion);
export const d_heroesOfMightAndMagic3_armageddonsBlade = new Dlc("Armageddon's Blade", 1999, dlcTypeEnum.expansion);
export const d_heroesOfMightAndMagic3_theShadowOfDeath = new Dlc("The Shadow of Death", 2000, dlcTypeEnum.expansion);
export const d_heroesOfMightAndMagic4_theGatheringStorm = new Dlc("The Gathering Storm", 2002, dlcTypeEnum.expansion);
export const d_heroesOfMightAndMagic4_windsOfWar = new Dlc("Winds of War", 2003, dlcTypeEnum.expansion);
export const d_ageOfEmpires2_theConquerors = new Dlc("The Conquerors", 2000, dlcTypeEnum.expansion);
export const d_ageOfEmpires2_theForgotten = new Dlc("The Forgotten", 2013, dlcTypeEnum.expansion);
export const d_ageOfEmpires2_theAfricanKingdoms = new Dlc("The African Kingdoms", 2015, dlcTypeEnum.expansion);
export const d_ageOfEmpires2_riseOfTheRajas = new Dlc("Rise of the Rajas", 2016, dlcTypeEnum.expansion);
export const d_ageOfEmpires2_lordsOfTheWest = new Dlc("Lords of the West", 2021, dlcTypeEnum.expansion);
export const d_ageOfEmpires2_dawnOfTheDukes = new Dlc("Dawn of the Dukes", 2021, dlcTypeEnum.expansion);
export const d_ageOfEmpires2_dynastiesOfIndia = new Dlc("Dynasties of India", 2022, dlcTypeEnum.expansion);
export const d_redDeadRedemption_UndeadNightmare = new Dlc("Undead Nightmare", 2010, dlcTypeEnum.expansion);

export const d_theWitcher3_heartsOfStone = new Dlc("Hearts of Stone", 2015, dlcTypeEnum.expansion);
export const d_theWitcher3_bloodAndWine = new Dlc("Blood and Wine", 2016, dlcTypeEnum.expansion);


console.log({allDlcs});
