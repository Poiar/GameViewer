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
  none,
  remaster,
  remake,
  downsample,
  findOut,
}

namespace versionEnum {
  export function toString(input: versionEnum): string {
    switch (input) {
      case versionEnum.none:
        return "None"
      case versionEnum.remaster:
        return "Remaster"
      case versionEnum.remake:
        return "Remake"
      case versionEnum.downsample:
        return "Downsample"
      case versionEnum.findOut:
        return "Find out"
    }
    throw "You called versionEnum.toString() with something that is unhandled - Throwing"
  }
}

export class GameIteration {
  readonly id: number;
  readonly game: Game;
  readonly version: versionEnum;
  readonly collections: Collection[];
  readonly playableOn: systemEnum[];
  readonly controllerSupport: unsureBoolEnum;
  readonly localCoOp: unsureBoolEnum;

  constructor(id: number, game: Game, version: versionEnum, playableOn: systemEnum[], controllerSupport: unsureBoolEnum, localCoOp: unsureBoolEnum) {
    this.id = id;
    this.game = game;
    this.version = version;
    this.playableOn = playableOn;
    this.controllerSupport = controllerSupport;
    this.localCoOp = localCoOp;
    this.collections = [];
  }

  getPlayableOnTitles(): string {
    const playableOnTitles: string[] = this.playableOn.map(playableOn => systemEnum.toString(playableOn)); //deviceEnum[device]
    return playableOnTitles.join(', ');
  }

  addCollection(collection: Collection) {
    this.collections.push(collection);
  }
}

export const gi_PC_warcraft3 = new GameIteration(1, g_warcraft3, versionEnum.none, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false);
export const gi_PC_heroesOfMightAndMagic = new GameIteration(2, g_heroesOfMightAndMagic, versionEnum.none, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false);
export const gi_PC_heroesOfMightAndMagic2 = new GameIteration(3, g_heroesOfMightAndMagic2, versionEnum.none, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false);
export const gi_PC_heroesOfMightAndMagic3 = new GameIteration(4, g_heroesOfMightAndMagic3, versionEnum.none, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false);
export const gi_PC_heroesOfMightAndMagic4 = new GameIteration(5, g_heroesOfMightAndMagic4, versionEnum.none, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false);
export const gi_PC_halfLife2 = new GameIteration(6, g_halfLife2, versionEnum.none, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false);
export const gi_PC_halfLife2Episode1 = new GameIteration(7, g_halfLife2Episode1, versionEnum.none, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false);
export const gi_PC_halfLife2Episode2 = new GameIteration(8, g_halfLife2Episode2, versionEnum.none, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false);
export const gi_PC_portal = new GameIteration(9, g_portal, versionEnum.none, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false);
export const gi_PC_teamFortress2 = new GameIteration(10, g_teamFortress2, versionEnum.none, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.maybe, unsureBoolEnum.false);
export const gi_3DS_metalGearSolid3 = new GameIteration(11, g_MetalGearSolid3, versionEnum.downsample, [systemEnum._3ds], unsureBoolEnum.na, unsureBoolEnum.false);
export const gi_PS3_metalGearSolid2 = new GameIteration(12, g_MetalGearSolid2, versionEnum.remaster, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false);
export const gi_PS3_metalGearSolid3 = new GameIteration(13, g_MetalGearSolid3, versionEnum.remaster, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false);
export const gi_PS3_metalGearSolid4 = new GameIteration(14, g_MetalGearSolid4, versionEnum.remaster, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false);

const gameIterations: GameIteration[] = [
  gi_PC_warcraft3,
  gi_PC_heroesOfMightAndMagic,
  gi_PC_heroesOfMightAndMagic2,
  gi_PC_heroesOfMightAndMagic3,
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
];

gameIterations.forEach(gameIteration => gameIteration.game.addGameIteration(gameIteration));

export function getAllGameIterations(): GameIteration[] {
  return gameIterations;
}

// export function getAllCollections(): Collection[] {
//   const gameIterations = collections.map(collection => collection.gameIterations);
//   return [...new Set(gameIterations)]; //Unique
// }

// ID => x
// Collection => collection.title
// Game => game.title
// Type => game/dlc/arcade
// First release => game.firstRelease
// Device => gameIteration.device
// Store => collection.provider
// Physical => x
// Local Co-Op => gameIteration.localCoOp
// Controller support => gameIteration.controllerSupport

// Blacklabel => collection.blackLabel
// Series => Series

// Type => game.genre
// Validated => Iteration.validated
// Type => collection.media
// Place => collection.place
// Anskaf bedre/anden version => xxx
// Note => ???
// Out => collection.out
// Sealed => collection.sealed
