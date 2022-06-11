import {
  GameIteration,
  gi_PC_original_warcraft3_physical,
  gi_PC_original_heroesOfMightAndMagic_physical,
  gi_PC_original_heroesOfMightAndMagic2_physical,
  gi_PC_original_heroesOfMightAndMagic3_physical,
  gi_PC_original_heroesOfMightAndMagic4_physical,
  gi_PC_original_halfLife2_steam,
  gi_PC_original_halfLife2Episode1_steam,
  gi_PC_original_halfLife2Episode2_steam,
  gi_PC_original_portal_steam,
  gi_PC_original_teamFortress2_steam,
  gi_3DS_downsample_metalGearSolid3_physical,
  gi_PS3_remaster_metalGearSolid2_physical,
  gi_PS3_remaster_metalGearSolid3_physical,
  gi_PS3_original_metalGearSolid4_physical,
  gi_PC_original_heroesOfMightAndMagic3_gog,
  gi_PC_original_ageOfEmpires2_physical,
  gi_PC_remaster1_ageOfEmpires2_steam,
  gi_PC_remaster2_ageOfEmpires2_steam,
} from './gameIteration';
import { GameVersion, unsureBoolEnum } from './gameVersion';
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

enum mediaEnum {
  na,
  digital,
  dvd,
  cd,
}

export const allCollections: Collection[] = [];

export class Collection {
  readonly id: number;
  readonly title: string;
  readonly gameIterations: GameIteration[];
  readonly media: mediaEnum;
  // readonly provider: providerEnum;
  readonly blackLabel: unsureBoolEnum;
  readonly releaseYear?: number;
  readonly dlcAddedByThisCollection: Dlc[];

  constructor(
    title: string, gameIterations: GameIteration[], media: mediaEnum, blackLabel: unsureBoolEnum, releaseYear?: number, dlc?: Dlc[], dlcOnly?: boolean
  ) {
    this.id = allCollections.length;
    this.title = title;
    this.media = media;
    this.blackLabel = blackLabel;
    this.releaseYear = releaseYear;

    if(dlcOnly) {
      this.gameIterations = []
    }
    else{
      this.gameIterations = gameIterations;
      gameIterations.forEach(gameIteration => gameIteration.collections.push(this));

     }

    this.dlcAddedByThisCollection = [];

    dlc?.forEach(dlc => {
      this.gameIterations.forEach(gameIteration => {
        if(dlc.gameVersions.includes(gameIteration.gameVersion)){
          gameIteration.dlcs.push(dlc);
          dlc.gameVersions.push(gameIteration.gameVersion);

          this.dlcAddedByThisCollection.push(dlc)
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

  hasGameIterations(): boolean {
    if(this.gameIterations.length > 0){ return true }
    else{ return false }
  }
}

const c_PC_none_warcraft3 = new Collection('Warcraft 3: Reign of Chaos', [gi_PC_original_warcraft3_physical], mediaEnum.cd, unsureBoolEnum.true, 2002,[]);
const c_PC_none_HeroesOfMightAndMagicCollection = new Collection('Heroes of Might and Magic Collection', [gi_PC_original_heroesOfMightAndMagic_physical, gi_PC_original_heroesOfMightAndMagic2_physical, gi_PC_original_heroesOfMightAndMagic3_physical, gi_PC_original_heroesOfMightAndMagic4_physical,], mediaEnum.dvd, unsureBoolEnum.true, 2004, [d_heroesOfMightAndMagic2_thePriceOfLoyalty, d_heroesOfMightAndMagic3_armageddonsBlade, d_heroesOfMightAndMagic3_theShadowOfDeath, d_heroesOfMightAndMagic4_windsOfWar, d_heroesOfMightAndMagic4_theGatheringStorm]);
const c_PC_steam_TheOrangeBox = new Collection('The Orange Box', [gi_PC_original_halfLife2_steam, gi_PC_original_halfLife2Episode1_steam, gi_PC_original_halfLife2Episode2_steam, gi_PC_original_portal_steam, gi_PC_original_teamFortress2_steam,], mediaEnum.digital, unsureBoolEnum.na, 2007);
const c_3DS_none_MetalGearSolid3SnakeEater3D = new Collection('Metal Gear Solid: Snake Eater 3D', [gi_3DS_downsample_metalGearSolid3_physical], mediaEnum.na, unsureBoolEnum.true, 2012);
const c_PS3_none_MetalGearSolidTheLegacyCollection = new Collection('Metal Gear Solid: The Legacy Collection', [gi_PS3_remaster_metalGearSolid2_physical, gi_PS3_remaster_metalGearSolid3_physical, gi_PS3_original_metalGearSolid4_physical], mediaEnum.na, unsureBoolEnum.true, 2011);
const c_PC_gog_HeroesOfMightAndMagic3Complete = new Collection('Heroes of Might and Magic 3: Complete', [gi_PC_original_heroesOfMightAndMagic3_gog], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_heroesOfMightAndMagic3_armageddonsBlade, d_heroesOfMightAndMagic3_theShadowOfDeath,]);
const c_PC_physical_ageOfEmpires2 = new Collection('Age of Empires 2: Age of Kings', [gi_PC_original_ageOfEmpires2_physical], mediaEnum.na, unsureBoolEnum.maybe, undefined, []);
const c_PC_physical_ageOfEmpires2TheConquerors = new Collection('Age of Empires 2: Age of Kings: The Conquerors', [gi_PC_original_ageOfEmpires2_physical], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_theConquerors],true);

const c_PC_physical_ageOfEmpires2HdEdition = new Collection('Age of Empires 2: Age of Kings (HD Edition)', [gi_PC_remaster1_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, []);
const c_PC_physical_ageOfEmpires2HdEditionTheConquerors = new Collection('Age of Empires 2: Age of Kings (HD Edition): The Conquerors', [gi_PC_remaster1_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_theConquerors],true);
const c_PC_physical_ageOfEmpires2HdEditionTheForgotten = new Collection('Age of Empires 2: Age of Kings (HD Edition): The Forgotten', [gi_PC_remaster1_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_theForgotten],true);
const c_PC_physical_ageOfEmpires2HdEditionTheAfricanKingdoms = new Collection('Age of Empires 2: Age of Kings (HD Edition): The African Kingdoms', [gi_PC_remaster1_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_theAfricanKingdoms],true);
const c_PC_physical_ageOfEmpires2HdEditionRiseOfTheRajas = new Collection('Age of Empires 2: Age of Kings (HD Edition) Rise of the Rajas', [gi_PC_remaster1_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_riseOfTheRajas],true);

const c_PC_physical_ageOfEmpires2DefinitiveEdition = new Collection('Age of Empires 2: Age of Kings (Definitive Edition)', [gi_PC_remaster2_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, []);
const c_PC_physical_ageOfEmpires2DefinitiveEditionTheConquerors = new Collection('Age of Empires 2: Age of Kings (HD Edition): The Conquerors', [gi_PC_remaster2_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_theConquerors],true);
const c_PC_physical_ageOfEmpires2DefinitiveEditionTheForgotten = new Collection('Age of Empires 2: Age of Kings (HD Edition): The Forgotten', [gi_PC_remaster2_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_theForgotten],true);
const c_PC_physical_ageOfEmpires2DefinitiveEditionTheAfricanKingdoms = new Collection('Age of Empires 2: Age of Kings (HD Edition): The African Kingdoms', [gi_PC_remaster2_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_theAfricanKingdoms],true);
const c_PC_physical_ageOfEmpires2DefinitiveEditionRiseOfTheRajas = new Collection('Age of Empires 2: Age of Kings (HD Edition) Rise of the Rajas', [gi_PC_remaster2_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_riseOfTheRajas],true);
const c_PC_physical_ageOfEmpires2DefinitiveEditionLordsOfTheWest = new Collection('Age of Empires 2: Age of Kings (HD Edition): Lords of the West', [gi_PC_remaster2_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_lordsOfTheWest],true);
const c_PC_physical_ageOfEmpires2DefinitiveEditionDawnOfTheDukes = new Collection('Age of Empires 2: Age of Kings (HD Edition): Dawn of the Dukes', [gi_PC_remaster2_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_dawnOfTheDukes],true);
const c_PC_physical_ageOfEmpires2DefinitiveEditionDynastiesOfIndia = new Collection('Age of Empires 2: Age of Kings (HD Edition): Dynasties of India', [gi_PC_remaster2_ageOfEmpires2_steam], mediaEnum.na, unsureBoolEnum.maybe, undefined, [d_ageOfEmpires2_dynastiesOfIndia],true);


export function getAllCollections(): Collection[] {
  return allCollections;
}
