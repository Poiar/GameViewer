import {
  GameIteration,
  gi_PC_warcraft3,
  gi_PC_heroesOfMightAndMagic,
  gi_PC_heroesOfMightAndMagic2,
  gi_PC_heroesOfMightAndMagic3_1,
  gi_PC_heroesOfMightAndMagic4,
  gi_PC_halfLife2,
  gi_PC_halfLife2Episode1,
  gi_PC_halfLife2Episode2,
  gi_PC_portal,
  gi_PC_teamFortress2,
  gi_3DS_metalGearSolid3,
  gi_PS3_metalGearSolid2,
  gi_PS3_metalGearSolid3,
  gi_PS3_metalGearSolid4,
  gi_PC_heroesOfMightAndMagic3_2,
} from './gameIteration';
import { GameVersion, unsureBoolEnum } from './gameVersion';
import {
  d_heroesOfMightAndMagic2_thePriceOfLoyalty,
  d_heroesOfMightAndMagic3_armageddonsBlade,
  d_heroesOfMightAndMagic3_theShadowOfDeath,
  d_heroesOfMightAndMagic4_theGatheringStorm,
  d_heroesOfMightAndMagic4_windsOfWar,
  DLC,
} from './dlc';

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

export class Collection {
  readonly id: number;
  readonly title: string;
  readonly gameIterations: GameIteration[];
  readonly media: mediaEnum;
  readonly provider: providerEnum;
  readonly blackLabel: unsureBoolEnum;
  readonly releaseYear?: number;

  constructor(
    id: number,
    title: string,
    gameIterations: GameIteration[],
    media: mediaEnum,
    provider: providerEnum,
    blackLabel: unsureBoolEnum,
    releaseYear?: number,
    dlcs?: DLC[]
  ) {
    if (media === mediaEnum.digital && provider === providerEnum.physical) {
      throw 'Provider cannot be na if media is digital';
    }
    this.id = id;
    this.title = title;
    this.gameIterations = gameIterations;
    this.media = media;
    this.provider = provider;
    this.blackLabel = blackLabel;
    this.releaseYear = releaseYear;

    if (dlcs) {
      dlcs?.forEach((dlc) => {
        this.gameIterations.forEach((gameIteration) => {
          if (gameIteration.gameVersion.game === dlc.game) {
            gameIteration.dlcs.push(dlc);
          }
        });
      });
    }
  }

  getPlayableOnTitles(): string {
    const systemsTitles: string[] = this.gameIterations.map((gameIteration) =>
      gameIteration.gameVersion.getPlayableOnTitles()
    );
    return [...new Set(systemsTitles)].join(', '); //unique
  }

  getVersions(): string {
    const gameVersionVersion: string[] = this.gameIterations.map(
      (gameIteration) => gameIteration.gameVersion.getVersion()
    );
    return [...new Set(gameVersionVersion)].join(', '); //unique
  }

  getGameVersions(): GameVersion[] {
    return this.gameIterations.map(
      (gameIteration) => gameIteration.gameVersion
    );
  }
}

const c_PC_none_warcraft3 = new Collection(
  1,
  'Warcraft 3: Reign of Chaos',
  [gi_PC_warcraft3],
  mediaEnum.cd,
  providerEnum.physical,
  unsureBoolEnum.true,
  2002
);
const c_PC_none_HeroesOfMightAndMagicCollection = new Collection(
  2,
  'Heroes of Might and Magic Collection',
  [
    gi_PC_heroesOfMightAndMagic,
    gi_PC_heroesOfMightAndMagic2,
    gi_PC_heroesOfMightAndMagic3_1,
    gi_PC_heroesOfMightAndMagic4,
  ],
  mediaEnum.dvd,
  providerEnum.physical,
  unsureBoolEnum.true,
  2004,
  [
    d_heroesOfMightAndMagic2_thePriceOfLoyalty,
    d_heroesOfMightAndMagic3_armageddonsBlade,
    d_heroesOfMightAndMagic3_theShadowOfDeath,
    d_heroesOfMightAndMagic4_windsOfWar,
    d_heroesOfMightAndMagic4_theGatheringStorm,
  ]
);

const c_PC_steam_TheOrangeBox = new Collection(
  3,
  'The Orange Box',
  [
    gi_PC_halfLife2,
    gi_PC_halfLife2Episode1,
    gi_PC_halfLife2Episode2,
    gi_PC_portal,
  ],
  mediaEnum.digital,
  providerEnum.steam,
  unsureBoolEnum.na,
  2007
);
const c_3DS_none_MetalGearSolid3SnakeEater3D = new Collection(
  4,
  'Metal Gear Solid: Snake Eater 3D',
  [gi_3DS_metalGearSolid3],
  mediaEnum.na,
  providerEnum.physical,
  unsureBoolEnum.true,
  2012
);
const c_PS3_none_MetalGearSolidTheLegacyCollection = new Collection(
  5,
  'Metal Gear Solid: The Legacy Collection',
  [gi_PS3_metalGearSolid2, gi_PS3_metalGearSolid3, gi_PS3_metalGearSolid4],
  mediaEnum.na,
  providerEnum.physical,
  unsureBoolEnum.true,
  2011
);
const c_PC_gog_HeroesOfMightAndMagic3Complete = new Collection(
  6,
  'Heroes of Might and Magic 3: Complete',
  [gi_PC_heroesOfMightAndMagic3_2],
  mediaEnum.na,
  providerEnum.gog,
  unsureBoolEnum.maybe,
  undefined,
  [
    d_heroesOfMightAndMagic3_armageddonsBlade,
    d_heroesOfMightAndMagic3_theShadowOfDeath,
  ]
);

export const collections: Collection[] = [
  c_PC_none_warcraft3,
  c_PC_none_HeroesOfMightAndMagicCollection,
  c_PC_steam_TheOrangeBox,
  c_3DS_none_MetalGearSolid3SnakeEater3D,
  c_PS3_none_MetalGearSolidTheLegacyCollection,
  c_PC_gog_HeroesOfMightAndMagic3Complete,
];

collections.forEach((collection) =>
  collection.gameIterations.map((gameVersion) =>
    gameVersion.addCollection(collection)
  )
);

export function getAllCollections(): Collection[] {
  return collections;
}
