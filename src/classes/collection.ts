import {
  GameIteration,
  gi_PC_warcraft3_physical,
  gi_PC_heroesOfMightAndMagic_physical,
  gi_PC_heroesOfMightAndMagic2_physical,
  gi_PC_heroesOfMightAndMagic3_physical,
  gi_PC_heroesOfMightAndMagic4_physical,
  gi_PC_halfLife2_steam,
  gi_PC_halfLife2Episode1_steam,
  gi_PC_halfLife2Episode2_steam,
  gi_PC_portal_steam,
  gi_PC_teamFortress2_steam,
  gi_3DS_metalGearSolid3_physical,
  gi_PS3_metalGearSolid2_physical,
  gi_PS3_metalGearSolid3_physical,
  gi_PS3_metalGearSolid4_physical,
  gi_PC_heroesOfMightAndMagic3_gog, gi_PC_ageOfEmpires2_testing1,
} from './gameIteration';
import { GameVersion, unsureBoolEnum } from './gameVersion';
import {
  dv_PC_original_heroesOfMightAndMagic2_thePriceOfLoyalty,
  dv_PC_original_heroesOfMightAndMagic3_armageddonsBlade,
  dv_PC_original_heroesOfMightAndMagic3_theShadowOfDeath,
  dv_PC_original_heroesOfMightAndMagic4_theGatheringStorm,
  dv_PC_original_heroesOfMightAndMagic4_windsOfWar,
  DlcVersion, allDlcVersions,
} from './dlcVersion';

enum mediaEnum {
  na,
  digital,
  dvd,
  cd,
}

export enum providerEnum {
  physical,
  steam,
  epic,
  gog,
  origin,
  origin2,
  ubisoft,
  humbleBundle,
  rockstarSocialClub,
}

export namespace providerEnum {
  export function toString(input: providerEnum): string {
    switch (input) {
      case providerEnum.physical:
        return 'Physical';
      case providerEnum.steam:
        return 'Steam';
      case providerEnum.epic:
        return 'Epic';
      case providerEnum.gog:
        return 'GOG';
      case providerEnum.origin:
        return 'Origin';
      case providerEnum.origin2:
        return 'Origin Alt';
      case providerEnum.ubisoft:
        return 'Ubisoft';
      case providerEnum.humbleBundle:
        return 'Humble';
      case providerEnum.rockstarSocialClub:
        return 'Rockstar';
    }
    throw 'You called versionEnum.toString() with something that is unhandled - Throwing';
  }
}

export const allCollections: Collection[] = [];

export class Collection {
  readonly id: number;
  readonly title: string;
  readonly gameIterations: GameIteration[];
  readonly media: mediaEnum;
  readonly provider: providerEnum;
  readonly blackLabel: unsureBoolEnum;
  readonly releaseYear?: number;

  constructor(
    title: string, gameIterations: GameIteration[], media: mediaEnum, provider: providerEnum, blackLabel: unsureBoolEnum, releaseYear?: number, dlcVersions?: DlcVersion[]
  ) {
    if (media === mediaEnum.digital && provider === providerEnum.physical) {
      throw 'Provider cannot be na if media is digital';
    }
    this.id = allCollections.length;
    this.title = title;
    this.gameIterations = gameIterations;
    gameIterations.forEach(gameIteration => {
      // if(gameIteration.provider !== provider){ throw "Collections must have the same provider as the gameIteration. If not, remove the provider from the collection" }
      gameIteration.collections.push(this)
    });
    this.media = media;
    this.provider = provider;
    this.blackLabel = blackLabel;
    this.releaseYear = releaseYear;

    dlcVersions?.forEach(dlcVersion => {
      this.gameIterations.forEach(gameIteration => {
        if(gameIteration.gameVersion === dlcVersion.gameVersion){
          gameIteration.dlcVersions.push(dlcVersion)
          dlcVersion.gameVersion = gameIteration.gameVersion
        }
      });
    });

    allCollections.push(this);
  }

  getPlayableOnTitles(): string {
    const systemsTitles: string[] = this.gameIterations.map((gameIteration) =>
      gameIteration.gameVersion.getPlayableOnTitles()
    );
    return [...new Set(systemsTitles)].join(', '); //unique
  }

  getVersions(): string {
    const gameVersionVersion: string[] = this.gameIterations.map(
      (gameIteration) => gameIteration.gameVersion.getVersionType()
    );
    return [...new Set(gameVersionVersion)].join(', '); //unique
  }

  getGameVersions(): GameVersion[] {
    return this.gameIterations.map(
      (gameIteration) => gameIteration.gameVersion
    );
  }
}

const c_PC_none_warcraft3 = new Collection('Warcraft 3: Reign of Chaos', [gi_PC_warcraft3_physical], mediaEnum.cd, providerEnum.physical, unsureBoolEnum.true, 2002,undefined,);
const c_PC_none_HeroesOfMightAndMagicCollection = new Collection('Heroes of Might and Magic Collection', [gi_PC_heroesOfMightAndMagic_physical, gi_PC_heroesOfMightAndMagic2_physical, gi_PC_heroesOfMightAndMagic3_physical, gi_PC_heroesOfMightAndMagic4_physical,], mediaEnum.dvd, providerEnum.physical, unsureBoolEnum.true, 2004, [dv_PC_original_heroesOfMightAndMagic2_thePriceOfLoyalty, dv_PC_original_heroesOfMightAndMagic3_armageddonsBlade, dv_PC_original_heroesOfMightAndMagic3_theShadowOfDeath, dv_PC_original_heroesOfMightAndMagic4_windsOfWar, dv_PC_original_heroesOfMightAndMagic4_theGatheringStorm,]);
const c_PC_steam_TheOrangeBox = new Collection('The Orange Box', [gi_PC_halfLife2_steam, gi_PC_halfLife2Episode1_steam, gi_PC_halfLife2Episode2_steam, gi_PC_portal_steam, gi_PC_teamFortress2_steam,], mediaEnum.digital, providerEnum.steam, unsureBoolEnum.na, 2007);
const c_3DS_none_MetalGearSolid3SnakeEater3D = new Collection('Metal Gear Solid: Snake Eater 3D', [gi_3DS_metalGearSolid3_physical], mediaEnum.na, providerEnum.physical, unsureBoolEnum.true, 2012);
const c_PS3_none_MetalGearSolidTheLegacyCollection = new Collection('Metal Gear Solid: The Legacy Collection', [gi_PS3_metalGearSolid2_physical, gi_PS3_metalGearSolid3_physical, gi_PS3_metalGearSolid4_physical], mediaEnum.na, providerEnum.physical, unsureBoolEnum.true, 2011);
const c_PC_gog_HeroesOfMightAndMagic3Complete = new Collection('Heroes of Might and Magic 3: Complete', [gi_PC_heroesOfMightAndMagic3_gog], mediaEnum.na, providerEnum.gog, unsureBoolEnum.maybe, undefined, [dv_PC_original_heroesOfMightAndMagic3_armageddonsBlade,dv_PC_original_heroesOfMightAndMagic3_theShadowOfDeath,]);
const c_PC_testing_ageOfEmpires2_testing1 = new Collection('Age of Empires 2: Age of Kings', [gi_PC_ageOfEmpires2_testing1], mediaEnum.na, providerEnum.gog, unsureBoolEnum.maybe, undefined, [dv_PC_original_heroesOfMightAndMagic3_armageddonsBlade,dv_PC_original_heroesOfMightAndMagic3_theShadowOfDeath,]);

export function getAllCollections(): Collection[] {
  return allCollections;
}
