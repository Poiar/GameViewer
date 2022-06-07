import {
  GameIteration,
  gi_3DS_metalGearSolid3,
  gi_PC_halfLife2,
  gi_PC_halfLife2Episode1,
  gi_PC_halfLife2Episode2,
  gi_PC_heroesOfMightAndMagic,
  gi_PC_heroesOfMightAndMagic2,
  gi_PC_heroesOfMightAndMagic3,
  gi_PC_heroesOfMightAndMagic4,
  gi_PC_portal,
  gi_PC_warcraft3,
  gi_PS3_metalGearSolid2,
  gi_PS3_metalGearSolid3,
  gi_PS3_metalGearSolid4,
  unsureBoolEnum
} from "./gameIteration";

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
    switch (input){
      case providerEnum.physical: return "Physical"
      case providerEnum.steam: return "Steam"
      case providerEnum.epic: return "Epic"
      case providerEnum.gog: return "GOG"
      case providerEnum.origin: return "Origin"
      case providerEnum.origin2: return "Origin Alt"
      case providerEnum.ubisoft: return "Ubisoft"
      case providerEnum.humbleBundle: return "Humble"
      case providerEnum.rockstarSocialClub: return "Rockstar"
    }
    throw "You called versionEnum.toString() with something that is unhandled - Throwing"
  }
}

export class Collection {
  readonly id: number;
  readonly title: string;
  readonly gameIterations: GameIteration[];
  readonly media: mediaEnum;
  readonly provider: providerEnum
  readonly blackLabel: unsureBoolEnum;

  constructor(id: number, title: string, gameIterations: GameIteration[], media: mediaEnum, provider: providerEnum, blackLabel: unsureBoolEnum) {

    if(media === mediaEnum.digital && provider === providerEnum.physical){
        throw "Provider cannot be na if media is digital"
    }
    this.id = id;
    this.title = title;
    this.gameIterations = gameIterations;
    this.media = media;
    this.provider = provider
    this.blackLabel = blackLabel;
  }

  getPlayableOnTitles(): string {
    const systemsTitles:string[] = this.gameIterations.map(gameIteration => gameIteration.getPlayableOnTitles());
    return [...new Set(systemsTitles)].join(', '); //unique
  }
}

export const collections: Collection[] = [
  new Collection(1, "Warcraft 3: Reign of Chaos", [gi_PC_warcraft3], mediaEnum.cd, providerEnum.physical, unsureBoolEnum.true),
  new Collection(2, "Heroes of Might and Magic Collection", [gi_PC_heroesOfMightAndMagic, gi_PC_heroesOfMightAndMagic2, gi_PC_heroesOfMightAndMagic3, gi_PC_heroesOfMightAndMagic4], mediaEnum.dvd, providerEnum.physical, unsureBoolEnum.true),
  new Collection(3, "The Orange Box", [gi_PC_halfLife2, gi_PC_halfLife2Episode1, gi_PC_halfLife2Episode2, gi_PC_portal], mediaEnum.digital, providerEnum.steam, unsureBoolEnum.na),
  new Collection(4, "Metal Gear Solid: Snake Eater 3D", [gi_3DS_metalGearSolid3], mediaEnum.na, providerEnum.physical, unsureBoolEnum.true),
  new Collection(5, "Metal Gear Solid: The Legacy Collection", [gi_PS3_metalGearSolid2, gi_PS3_metalGearSolid3, gi_PS3_metalGearSolid4], mediaEnum.na, providerEnum.physical, unsureBoolEnum.true),
];

// collections.forEach(collection => collection.gameIterations.map(gameIteration => gameIteration.addCollection(collection)));
collections.forEach(collection => collection.gameIterations.map(gameIteration => gameIteration.addCollection(collection)));
//xxxxxxxxxx
export function getAllCollections():Collection[]{
  return collections;
}
