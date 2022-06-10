import {
  GameVersion,
} from "./gameVersion";
import {
  d_ageOfEmpires2_dawnOfTheDukes, d_ageOfEmpires2_dynastiesOfIndia,
  d_ageOfEmpires2_lordsOfTheWest,
  d_ageOfEmpires2_riseOfTheRajas,
  d_ageOfEmpires2_theAfricanKingdoms,
  d_ageOfEmpires2_theConquerors, d_ageOfEmpires2_theForgotten,
  d_heroesOfMightAndMagic2_thePriceOfLoyalty,
  d_heroesOfMightAndMagic3_armageddonsBlade,
  d_heroesOfMightAndMagic3_theShadowOfDeath,
  d_heroesOfMightAndMagic4_theGatheringStorm,
  d_heroesOfMightAndMagic4_windsOfWar,
  Dlc
} from "./dlc";

export const allDlcVersions: DlcVersion[] = [];

export class DlcVersion {
  readonly id: number;
  readonly dlc: Dlc;
  gameVersion?: GameVersion;

  constructor(dlc: Dlc) {
    this.id = allDlcVersions.length;
    this.dlc = dlc;
    dlc.dlcVersions.push(this);

    allDlcVersions.push(this);
  }
}

export const dv_PC_original_heroesOfMightAndMagic2_thePriceOfLoyalty = new DlcVersion(d_heroesOfMightAndMagic2_thePriceOfLoyalty);
export const dv_PC_original_heroesOfMightAndMagic3_armageddonsBlade = new DlcVersion(d_heroesOfMightAndMagic3_armageddonsBlade);
export const dv_PC_original_heroesOfMightAndMagic3_theShadowOfDeath = new DlcVersion(d_heroesOfMightAndMagic3_theShadowOfDeath);
export const dv_PC_original_heroesOfMightAndMagic4_theGatheringStorm = new DlcVersion(d_heroesOfMightAndMagic4_theGatheringStorm);
export const dv_PC_original_heroesOfMightAndMagic4_windsOfWar = new DlcVersion(d_heroesOfMightAndMagic4_windsOfWar);
export const dv_PC_original_ageOfEmpires2_theConquerors = new DlcVersion(d_ageOfEmpires2_theConquerors);
export const dv_PC_remaster1_ageOfEmpires2_theConquerors = new DlcVersion(d_ageOfEmpires2_theConquerors);
export const dv_PC_remaster2_ageOfEmpires2_theConquerors = new DlcVersion(d_ageOfEmpires2_theConquerors);

export const dv_PC_remaster1_ageOfEmpires2_theForgotten = new DlcVersion(d_ageOfEmpires2_theForgotten);
export const dv_PC_remaster2_ageOfEmpires2_theForgotten = new DlcVersion(d_ageOfEmpires2_theForgotten);

export const dv_PC_remaster1_ageOfEmpires2_theAfricanKingdoms = new DlcVersion(d_ageOfEmpires2_theAfricanKingdoms);
export const dv_PC_remaster2_ageOfEmpires2_theAfricanKingdoms = new DlcVersion(d_ageOfEmpires2_theAfricanKingdoms);

export const dv_PC_remaster1_ageOfEmpires1_riseOfTheRajas = new DlcVersion(d_ageOfEmpires2_riseOfTheRajas);
export const dv_PC_remaster2_ageOfEmpires2_riseOfTheRajas = new DlcVersion(d_ageOfEmpires2_riseOfTheRajas);

export const dv_PC_remaster2_ageOfEmpires2_lordsOfTheWest = new DlcVersion(d_ageOfEmpires2_lordsOfTheWest);
export const dv_PC_remaster2_ageOfEmpires2_dawnOfTheDukes = new DlcVersion(d_ageOfEmpires2_dawnOfTheDukes);
export const dv_PC_remaster2_ageOfEmpires2_dynastiesOfIndia = new DlcVersion(d_ageOfEmpires2_dynastiesOfIndia);
