// import {
//   GameVersion,
//   gv_3DS_downsample_metalGearSolid3, gv_PC_original_ageOfEmpires2,
//   gv_PC_original_halfLife2,
//   gv_PC_original_halfLife2Episode1,
//   gv_PC_original_halfLife2Episode2,
//   gv_PC_original_heroesOfMightAndMagic,
//   gv_PC_original_heroesOfMightAndMagic2,
//   gv_PC_original_heroesOfMightAndMagic3,
//   gv_PC_original_heroesOfMightAndMagic4,
//   gv_PC_original_portal,
//   gv_PC_original_teamFortress2,
//   gv_PC_original_warcraft3, gv_PC_remaster1_ageOfEmpires2, gv_PC_remaster2_ageOfEmpires2,
//   gv_PS3_original_metalGearSolid4,
//   gv_PS3_remaster_metalGearSolid2,
//   gv_PS3_remaster_metalGearSolid3,
// } from './gameVersion';
// import {Collection} from "./collection";
// import {Dlc} from "./dlc";
//
// export enum providerEnum {
//   physical,
//   steam,
//   epic,
//   gog,
//   origin,
//   origin2,
//   ubisoft,
//   humbleBundle,
//   rockstarSocialClub,
// }
//
// export namespace providerEnum {
//   export function toString(input: providerEnum): string {
//     switch (input) {
//       case providerEnum.physical:
//         return 'Physical';
//       case providerEnum.steam:
//         return 'Steam';
//       case providerEnum.epic:
//         return 'Epic';
//       case providerEnum.gog:
//         return 'GOG';
//       case providerEnum.origin:
//         return 'Origin';
//       case providerEnum.origin2:
//         return 'Origin Alt';
//       case providerEnum.ubisoft:
//         return 'Ubisoft';
//       case providerEnum.humbleBundle:
//         return 'Humble';
//       case providerEnum.rockstarSocialClub:
//         return 'Rockstar';
//     }
//     throw 'You called providerEnum.toString() with something that is unhandled - Throwing';
//   }
// }
//
//
// export const allGameIterations: GameIteration[] = [];
//
// export class GameIteration {
//   readonly id: number;
//   readonly gameVersion: GameVersion;
//   readonly provider: providerEnum;
//   collections: Collection[];
//   dlcs: Dlc[];
//
//   constructor(gameVersion: GameVersion, provider: providerEnum) {
//     this.id = allGameIterations.length;
//     this.gameVersion = gameVersion;
//
//     gameVersion.gameIterations.push(this);
//     this.provider = provider
//
//     this.collections = [];
//     this.dlcs = [];
//
//     allGameIterations.push(this);
//   }
//
//   getVersionType(): string {
//     return this.gameVersion.getVersionType();
//   }
//
//   getProvider(): string {
//     return providerEnum.toString(this.provider);
//   }
//
//   // getProviders(): string {
//   //   const providers: string[] = this.collections.map(collection => providerEnum.toString(collection.provider));
//   //   return providers.join(', ');
//   // }
// }
//
//
// export const gi_PC_original_warcraft3_physical = new GameIteration(gv_PC_original_warcraft3, providerEnum.physical);
// export const gi_PC_original_heroesOfMightAndMagic_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic, providerEnum.physical);
// export const gi_PC_original_heroesOfMightAndMagic2_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic2, providerEnum.physical);
// export const gi_PC_original_heroesOfMightAndMagic3_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic3, providerEnum.physical);
// export const gi_PC_original_heroesOfMightAndMagic3_gog = new GameIteration(gv_PC_original_heroesOfMightAndMagic3, providerEnum.gog);
// export const gi_PC_original_heroesOfMightAndMagic4_physical = new GameIteration(gv_PC_original_heroesOfMightAndMagic4, providerEnum.physical);
// export const gi_PC_original_halfLife2_steam = new GameIteration(gv_PC_original_halfLife2, providerEnum.steam);
// export const gi_PC_original_halfLife2Episode1_steam = new GameIteration(gv_PC_original_halfLife2Episode1, providerEnum.steam);
// export const gi_PC_original_halfLife2Episode2_steam = new GameIteration(gv_PC_original_halfLife2Episode2, providerEnum.steam);
// export const gi_PC_original_portal_steam = new GameIteration(gv_PC_original_portal, providerEnum.steam);
// export const gi_PC_original_teamFortress2_steam = new GameIteration(gv_PC_original_teamFortress2, providerEnum.steam);
// export const gi_3DS_downsample_metalGearSolid3_physical = new GameIteration(gv_3DS_downsample_metalGearSolid3, providerEnum.physical);
// export const gi_PS3_remaster_metalGearSolid2_physical = new GameIteration(gv_PS3_remaster_metalGearSolid2, providerEnum.physical);
// export const gi_PS3_remaster_metalGearSolid3_physical = new GameIteration(gv_PS3_remaster_metalGearSolid3, providerEnum.physical);
// export const gi_PS3_original_metalGearSolid4_physical = new GameIteration(gv_PS3_original_metalGearSolid4, providerEnum.physical);
// export const gi_PC_original_ageOfEmpires2_physical = new GameIteration(gv_PC_original_ageOfEmpires2, providerEnum.physical);
// export const gi_PC_remaster1_ageOfEmpires2_steam = new GameIteration(gv_PC_remaster1_ageOfEmpires2, providerEnum.steam);
// export const gi_PC_remaster2_ageOfEmpires2_steam = new GameIteration(gv_PC_remaster2_ageOfEmpires2, providerEnum.steam);
//
// // export function getAllGameIterations(): GameIteration[] {
// //   return allGameIterations;
// // }
