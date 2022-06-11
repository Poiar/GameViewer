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
  d_heroesOfMightAndMagic4_windsOfWar, d_redDeadRedemption_UndeadNightmare,
  Dlc
} from "./dlc";
import {Collection} from "./collection";
import {
  GameVersion,
  gv_PC_physical_original_heroesOfMightAndMagic2,
  gv_PC_physical_original_heroesOfMightAndMagic3,
  gv_PC_gog_original_heroesOfMightAndMagic3,
  gv_PC_physical_original_heroesOfMightAndMagic4,
  gv_PC_steam_original_ageOfEmpires2,
  gv_PC_steam_remaster1_ageOfEmpires2,
  gv_PC_steam_remaster2_ageOfEmpires2,
  gv_X360_physical_original_redDeadRedemption,
  gv_X360_physical_original_redDeadRedemptionUndeadNightmare
} from "./gameVersion";


export const allDlcVersions: DlcVersion[] = [];

export class DlcVersion {
  readonly id: number;
  readonly dlc: Dlc;
  readonly gameVersionsThisCanBeUsedOn: GameVersion[];
  readonly collections: Collection[];

  constructor(gameVersionsThisCanBeUsedOn: GameVersion[], dlc: Dlc) {
    this.id = allDlcVersions.length;
    this.gameVersionsThisCanBeUsedOn = gameVersionsThisCanBeUsedOn;
    gameVersionsThisCanBeUsedOn.forEach(gameVersion => gameVersion.dlcVersionsThatThisCanUse.push(this))

    this.dlc = dlc;
    dlc.dlcVersions.push(this);

    this.collections = [];

    allDlcVersions.push(this);
  }

  getPlayableOnTitles(): string {
    const playableOnTitles: string[] = this.gameVersionsThisCanBeUsedOn.map(gameVersion => gameVersion.getVersionType());

    return [...new Set(playableOnTitles)].join(', '); //unique
    // return playableOnTitles.join(', ');
  }

  getFirstGameVersion(): GameVersion {
    return this.gameVersionsThisCanBeUsedOn[0]
  }

}

export const dv_PC_physical_original_heroesOfMightAndMagic2_thePriceOfLoyalty = new DlcVersion([gv_PC_physical_original_heroesOfMightAndMagic2], d_heroesOfMightAndMagic2_thePriceOfLoyalty);
export const dv_PC_physical_original_heroesOfMightAndMagic3_armageddonsBlade = new DlcVersion([gv_PC_physical_original_heroesOfMightAndMagic3], d_heroesOfMightAndMagic3_armageddonsBlade);
export const dv_PC_physical_original_heroesOfMightAndMagic3_theShadowOfDeath = new DlcVersion([gv_PC_physical_original_heroesOfMightAndMagic3], d_heroesOfMightAndMagic3_theShadowOfDeath);
export const dv_PC_gog_original_heroesOfMightAndMagic3_armageddonsBlade = new DlcVersion([gv_PC_gog_original_heroesOfMightAndMagic3], d_heroesOfMightAndMagic3_armageddonsBlade);
export const dv_PC_gog_original_heroesOfMightAndMagic3_theShadowOfDeath = new DlcVersion([gv_PC_gog_original_heroesOfMightAndMagic3], d_heroesOfMightAndMagic3_theShadowOfDeath);
export const dv_PC_physical_original_heroesOfMightAndMagic4_theGatheringStorm = new DlcVersion([gv_PC_physical_original_heroesOfMightAndMagic4], d_heroesOfMightAndMagic4_theGatheringStorm);
export const dv_PC_physical_original_heroesOfMightAndMagic4_windsOfWar = new DlcVersion([gv_PC_physical_original_heroesOfMightAndMagic4], d_heroesOfMightAndMagic4_windsOfWar);
export const dv_PC_physical_original_ageOfEmpires2_theConquerors = new DlcVersion([gv_PC_steam_original_ageOfEmpires2], d_ageOfEmpires2_theConquerors);
export const dv_PC_steam_remaster1_ageOfEmpires2_theConquerors = new DlcVersion([gv_PC_steam_remaster1_ageOfEmpires2], d_ageOfEmpires2_theConquerors);
export const dv_PC_steam_remaster1_ageOfEmpires2_theForgotten = new DlcVersion([gv_PC_steam_remaster1_ageOfEmpires2], d_ageOfEmpires2_theForgotten);
export const dv_PC_steam_remaster1_ageOfEmpires2_theAfricanKingdoms = new DlcVersion([gv_PC_steam_remaster1_ageOfEmpires2], d_ageOfEmpires2_theAfricanKingdoms);
export const dv_PC_steam_remaster1_ageOfEmpires1_riseOfTheRajas = new DlcVersion([gv_PC_steam_remaster1_ageOfEmpires2], d_ageOfEmpires2_riseOfTheRajas);
export const dv_PC_steam_remaster2_ageOfEmpires2_theConquerors = new DlcVersion([gv_PC_steam_remaster2_ageOfEmpires2], d_ageOfEmpires2_theConquerors);
export const dv_PC_steam_remaster2_ageOfEmpires2_theForgotten = new DlcVersion([gv_PC_steam_remaster2_ageOfEmpires2], d_ageOfEmpires2_theForgotten);
export const dv_PC_steam_remaster2_ageOfEmpires2_theAfricanKingdoms = new DlcVersion([gv_PC_steam_remaster2_ageOfEmpires2], d_ageOfEmpires2_theAfricanKingdoms);
export const dv_PC_steam_remaster2_ageOfEmpires2_riseOfTheRajas = new DlcVersion([gv_PC_steam_remaster2_ageOfEmpires2], d_ageOfEmpires2_riseOfTheRajas);
export const dv_PC_steam_remaster2_ageOfEmpires2_lordsOfTheWest = new DlcVersion([gv_PC_steam_remaster2_ageOfEmpires2], d_ageOfEmpires2_lordsOfTheWest);
export const dv_PC_steam_remaster2_ageOfEmpires2_dawnOfTheDukes = new DlcVersion([gv_PC_steam_remaster2_ageOfEmpires2], d_ageOfEmpires2_dawnOfTheDukes);
export const dv_PC_steam_remaster2_ageOfEmpires2_dynastiesOfIndia = new DlcVersion([gv_PC_steam_remaster2_ageOfEmpires2], d_ageOfEmpires2_dynastiesOfIndia);
export const dv_X360_physical_original_redDeadRedemption_UndeadNightmare = new DlcVersion([gv_X360_physical_original_redDeadRedemption], d_redDeadRedemption_UndeadNightmare);

console.log(allDlcVersions);
