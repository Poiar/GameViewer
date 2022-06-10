import {Collection, providerEnum} from './collection';
import {
  GameVersion,
  gv_3DS_downsample_metalGearSolid3, gv_PC_original_ageOfEmpires2,
  gv_PC_original_halfLife2,
  gv_PC_original_halfLife2Episode1,
  gv_PC_original_halfLife2Episode2,
  gv_PC_original_heroesOfMightAndMagic,
  gv_PC_original_heroesOfMightAndMagic2,
  gv_PC_original_heroesOfMightAndMagic3,
  gv_PC_original_heroesOfMightAndMagic4,
  gv_PC_original_portal,
  gv_PC_original_teamFortress2,
  gv_PC_original_warcraft3, gv_PC_remaster1_ageOfEmpires2, gv_PC_remaster2_ageOfEmpires2,
  gv_PS3_original_metalGearSolid4,
  gv_PS3_remaster_metalGearSolid2,
  gv_PS3_remaster_metalGearSolid3,
} from './gameVersion';
import {DlcVersion} from "./dlcVersion";

const allGameIterations: GameIteration[] = [];

export class GameIteration {
  readonly id: number;
  readonly gameVersion: GameVersion;
  // readonly provider: providerEnum;
  collections: Collection[];
  dlcVersions: DlcVersion[];

  constructor(gameVersion: GameVersion) { //provider: providerEnum
    this.id = allGameIterations.length;
    this.gameVersion = gameVersion;
    gameVersion.gameIterations.push(this);
    // this.provider = provider
    this.dlcVersions = [];
    this.collections = [];

    allGameIterations.push(this);
  }

  getVersionType(): string {
    return this.gameVersion.getVersionType();
  }

  getProviders(): string {
    const providers: string[] = this.collections.map(collection => providerEnum.toString(collection.provider));
    return providers.join(', ');
  }

  // getDlcVersionTitles(): string {
  //   const dlcVersionTitlesArray: string[] = this.dlcVersions.map(dlcVersion => dlcVersion.dlc.title)
  //   return dlcVersionTitlesArray.join(', ');
  // }

}

export const gi_PC_warcraft3_physical = new GameIteration(gv_PC_original_warcraft3);
export const gi_PC_heroesOfMightAndMagic_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic);
export const gi_PC_heroesOfMightAndMagic2_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic2);
export const gi_PC_heroesOfMightAndMagic3_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic3);
export const gi_PC_heroesOfMightAndMagic3_gog = new GameIteration(gv_PC_original_heroesOfMightAndMagic3);
export const gi_PC_heroesOfMightAndMagic4_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic4);
export const gi_PC_halfLife2_steam = new GameIteration(gv_PC_original_halfLife2);
export const gi_PC_halfLife2Episode1_steam = new GameIteration(gv_PC_original_halfLife2Episode1);
export const gi_PC_halfLife2Episode2_steam = new GameIteration(gv_PC_original_halfLife2Episode2);
export const gi_PC_portal_steam = new GameIteration(gv_PC_original_portal);
export const gi_PC_teamFortress2_steam = new GameIteration(gv_PC_original_teamFortress2);
export const gi_3DS_metalGearSolid3_physical = new GameIteration(gv_3DS_downsample_metalGearSolid3);
export const gi_PS3_metalGearSolid2_physical = new GameIteration(gv_PS3_remaster_metalGearSolid2);
export const gi_PS3_metalGearSolid3_physical = new GameIteration(gv_PS3_remaster_metalGearSolid3);
export const gi_PS3_metalGearSolid4_physical = new GameIteration(gv_PS3_original_metalGearSolid4);
export const gi_PC_ageOfEmpires2_testing1 = new GameIteration(gv_PC_original_ageOfEmpires2);
export const gi_PC_ageOfEmpires2_testing2 = new GameIteration(gv_PC_remaster1_ageOfEmpires2);
export const gi_PC_ageOfEmpires2_testing3 = new GameIteration(gv_PC_remaster2_ageOfEmpires2);

// export const gi_PC_warcraft3_physical = new GameIteration(gv_PC_original_warcraft3, providerEnum.physical);
// export const gi_PC_heroesOfMightAndMagic_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic, providerEnum.physical);
// export const gi_PC_heroesOfMightAndMagic2_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic2, providerEnum.physical);
// export const gi_PC_heroesOfMightAndMagic3_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic3, providerEnum.physical);
// export const gi_PC_heroesOfMightAndMagic3_gog = new GameIteration(gv_PC_original_heroesOfMightAndMagic3, providerEnum.gog);
// export const gi_PC_heroesOfMightAndMagic4_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic4, providerEnum.physical);
// export const gi_PC_halfLife2_steam = new GameIteration(gv_PC_original_halfLife2, providerEnum.steam);
// export const gi_PC_halfLife2Episode1_steam = new GameIteration(gv_PC_original_halfLife2Episode1, providerEnum.steam);
// export const gi_PC_halfLife2Episode2_steam = new GameIteration(gv_PC_original_halfLife2Episode2, providerEnum.steam);
// export const gi_PC_portal_steam = new GameIteration(gv_PC_original_portal, providerEnum.steam);
// export const gi_PC_teamFortress2_steam = new GameIteration(gv_PC_original_teamFortress2, providerEnum.steam);
// export const gi_3DS_metalGearSolid3_physical = new GameIteration(gv_3DS_downsample_metalGearSolid3, providerEnum.physical);
// export const gi_PS3_metalGearSolid2_physical = new GameIteration(gv_PS3_remaster_metalGearSolid2, providerEnum.physical);
// export const gi_PS3_metalGearSolid3_physical = new GameIteration(gv_PS3_remaster_metalGearSolid3, providerEnum.physical);
// export const gi_PS3_metalGearSolid4_physical = new GameIteration(gv_PS3_original_metalGearSolid4, providerEnum.physical);

export function getAllGameIterations(): GameIteration[] {
  return allGameIterations;
}
