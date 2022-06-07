import {
  g_halfLife2,
  g_halfLife2Episode1,
  g_halfLife2Episode2,
  g_heroesOfMightAndMagic,
  g_heroesOfMightAndMagic2,
  g_heroesOfMightAndMagic3,
  g_heroesOfMightAndMagic4,
  g_MetalGearSolid2,
  g_MetalGearSolid3,
  g_MetalGearSolid4,
  g_portal,
  g_teamFortress2,
  g_warcraft3,
  Game,
} from "./game";
import {Collection} from "./collection";
import {
  d_heroesOfMightAndMagic2_thePriceOfLoyalty,
  d_heroesOfMightAndMagic3_armageddonsBlade,
  d_heroesOfMightAndMagic3_theShadowOfDeath,
  d_heroesOfMightAndMagic4_theGatheringStorm,
  d_heroesOfMightAndMagic4_windsOfWar,
  DLC
} from "./dlc";
import {GameIteration} from "./gameIteration";

export enum systemEnum {
  windows,
  sd,
  xbox,
  x360,
  xsx,
  ps,
  ps2,
  ps3,
  ps4,
  ps5,
  psp,
  psvita,
  nes,
  snes,
  n64,
  gc,
  wii,
  wiiu,
  switch,
  gb,
  gbc,
  gba,
  ds,
  _3ds,
  android,
}

export namespace systemEnum {
  export function toString(input: systemEnum): string {
    switch (input) {
      case systemEnum.windows:
        return "Win"
      case systemEnum.sd:
        return "SD"
      case systemEnum.xbox:
        return "Xbox"
      case systemEnum.x360:
        return "X360"
      case systemEnum.xsx:
        return "XSX"
      case systemEnum.ps:
        return "PS1"
      case systemEnum.ps2:
        return "PS2"
      case systemEnum.ps3:
        return "PS3"
      case systemEnum.ps4:
        return "PS4"
      case systemEnum.ps5:
        return "PS5"
      case systemEnum.psp:
        return "PSP"
      case systemEnum.psvita:
        return "PSVita"
      case systemEnum.nes:
        return "NES"
      case systemEnum.snes:
        return "SNES"
      case systemEnum.n64:
        return "N64"
      case systemEnum.gc:
        return "GC"
      case systemEnum.wii:
        return "Wii"
      case systemEnum.wiiu:
        return "WiiU"
      case systemEnum.switch:
        return "Switch"
      case systemEnum.gb:
        return "GB"
      case systemEnum.gbc:
        return "GBC"
      case systemEnum.gba:
        return "GBA"
      case systemEnum.ds:
        return "NDS"
      case systemEnum._3ds:
        return "3DS"
      case systemEnum.android:
        return "And"
    }
    throw "You called systemEnum.toString() with something that is unhandled - Throwing"
  }
}

export enum unsureBoolEnum {
  true,
  false,
  maybe,
  na,
}

enum versionEnum {
  original,
  remaster,
  remake,
  downsample,
  demake,
  findOut,
}

namespace versionEnum {
  export function toString(input: versionEnum): string {
    switch (input) {
      case versionEnum.original:
        return "Original"
      case versionEnum.remaster:
        return "Remaster"
      case versionEnum.remake:
        return "Remake"
      case versionEnum.downsample:
        return "Downsample"
      case versionEnum.demake:
        return "Downsample"
      case versionEnum.findOut:
        return "Find out"
    }
    throw "You called versionEnum.toString() with something that is unhandled - Throwing"
  }
}

export class GameVersion {
  readonly id: number;
  readonly game: Game;
  readonly version: versionEnum;
  readonly gameIterations: GameIteration[];
  readonly playableOn: systemEnum[];
  readonly controllerSupport: unsureBoolEnum;
  readonly localCoOp: unsureBoolEnum;
  readonly versionYear?: number;

  constructor(id: number, game: Game, version: versionEnum, playableOn: systemEnum[], controllerSupport: unsureBoolEnum, localCoOp: unsureBoolEnum, dlcs?: DLC[], versionYear?: number) {
    this.id = id;
    this.game = game;
    this.version = version;
    this.playableOn = playableOn;
    this.controllerSupport = controllerSupport;
    this.localCoOp = localCoOp;
    this.gameIterations = [];
    this.versionYear = versionYear;
  }

  getPlayableOnTitles(): string {
    const playableOnTitles: string[] = this.playableOn.map(playableOn => systemEnum.toString(playableOn)); //deviceEnum[device]
    return playableOnTitles.join(', ');
  }

  addGameIteration(gameIteration: GameIteration) {
    this.gameIterations.push(gameIteration);
  }

  getVersion(): string{
    return versionEnum.toString(this.version);;
  }

  getVersionYear(): number{
    if     (this.versionYear)      { return this.versionYear       }
    else if(this.game.firstRelease){ return this.game.firstRelease }
    else                           { return 9999                   }
  }
}

export const gv_PC_warcraft3 = new GameVersion(1, g_warcraft3, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false);
export const gv_PC_heroesOfMightAndMagic = new GameVersion(2, g_heroesOfMightAndMagic, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false);
export const gv_PC_heroesOfMightAndMagic2 = new GameVersion(3, g_heroesOfMightAndMagic2, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false, [d_heroesOfMightAndMagic2_thePriceOfLoyalty]);
export const gv_PC_heroesOfMightAndMagic3 = new GameVersion(4, g_heroesOfMightAndMagic3, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false, [d_heroesOfMightAndMagic3_armageddonsBlade, d_heroesOfMightAndMagic3_theShadowOfDeath]);
export const gv_PC_heroesOfMightAndMagic4 = new GameVersion(5, g_heroesOfMightAndMagic4, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false, [d_heroesOfMightAndMagic4_theGatheringStorm, d_heroesOfMightAndMagic4_windsOfWar]);
export const gv_PC_halfLife2 = new GameVersion(6, g_halfLife2, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false);
export const gv_PC_halfLife2Episode1 = new GameVersion(7, g_halfLife2Episode1, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false);
export const gv_PC_halfLife2Episode2 = new GameVersion(8, g_halfLife2Episode2, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false);
export const gv_PC_portal = new GameVersion(9, g_portal, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false);
export const gv_PC_teamFortress2 = new GameVersion(10, g_teamFortress2, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.maybe, unsureBoolEnum.false);
export const gv_3DS_metalGearSolid3 = new GameVersion(11, g_MetalGearSolid3, versionEnum.downsample, [systemEnum._3ds], unsureBoolEnum.na, unsureBoolEnum.false, undefined, 2012);
export const gv_PS3_metalGearSolid2 = new GameVersion(12, g_MetalGearSolid2, versionEnum.remaster, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false, undefined, 2011);
export const gv_PS3_metalGearSolid3 = new GameVersion(13, g_MetalGearSolid3, versionEnum.remaster, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false, undefined, 2011);
export const gv_PS3_metalGearSolid4 = new GameVersion(14, g_MetalGearSolid4, versionEnum.remaster, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false, undefined,2008);

const gameVersions: GameVersion[] = [
  gv_PC_warcraft3,
  gv_PC_heroesOfMightAndMagic,
  gv_PC_heroesOfMightAndMagic2,
  gv_PC_heroesOfMightAndMagic3,
  gv_PC_heroesOfMightAndMagic4,
  gv_PC_halfLife2,
  gv_PC_halfLife2Episode1,
  gv_PC_halfLife2Episode2,
  gv_PC_portal,
  gv_PC_teamFortress2,
  gv_3DS_metalGearSolid3,
  gv_PS3_metalGearSolid2,
  gv_PS3_metalGearSolid3,
  gv_PS3_metalGearSolid4,
];

gameVersions.forEach(gameVersion => {
  gameVersion.game.addGameVersion(gameVersion);
  // gameVersion.dlcs?.forEach(dlc => dlc.addGameVersion(gameVersion));
});

export function getAllGameVersions(): GameVersion[] {
  return gameVersions;
}
