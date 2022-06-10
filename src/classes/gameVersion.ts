import {
  g_AgeOfEmpires2,
  g_halfLife2,
  g_halfLife2Episode1,
  g_halfLife2Episode2,
  g_heroesOfMightAndMagic,
  g_heroesOfMightAndMagic2,
  g_heroesOfMightAndMagic3,
  g_heroesOfMightAndMagic4,
  g_metalGearSolid2,
  g_metalGearSolid3,
  g_metalGearSolid4,
  g_portal,
  g_teamFortress2,
  g_warcraft3,
  Game,
} from "./game";
import {
  DlcVersion,
  dv_PC_original_ageOfEmpires2_theConquerors,
  dv_PC_original_heroesOfMightAndMagic2_thePriceOfLoyalty,
  dv_PC_original_heroesOfMightAndMagic3_armageddonsBlade,
  dv_PC_original_heroesOfMightAndMagic3_theShadowOfDeath,
  dv_PC_original_heroesOfMightAndMagic4_theGatheringStorm,
  dv_PC_original_heroesOfMightAndMagic4_windsOfWar,
  dv_PC_remaster1_ageOfEmpires1_riseOfTheRajas,
  dv_PC_remaster1_ageOfEmpires2_theAfricanKingdoms,
  dv_PC_remaster1_ageOfEmpires2_theConquerors,
  dv_PC_remaster1_ageOfEmpires2_theForgotten,
  dv_PC_remaster2_ageOfEmpires2_dawnOfTheDukes, dv_PC_remaster2_ageOfEmpires2_dynastiesOfIndia,
  dv_PC_remaster2_ageOfEmpires2_lordsOfTheWest,
  dv_PC_remaster2_ageOfEmpires2_riseOfTheRajas,
  dv_PC_remaster2_ageOfEmpires2_theAfricanKingdoms,
  dv_PC_remaster2_ageOfEmpires2_theConquerors,
  dv_PC_remaster2_ageOfEmpires2_theForgotten
} from "./dlcVersion";
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

export const allGameVersions: GameVersion[] = [];

export class GameVersion {
  readonly id: number;
  readonly game: Game;
  readonly versionType: versionEnum;
  gameIterations: GameIteration[];
  readonly playableOn: systemEnum[];
  readonly controllerSupport: unsureBoolEnum;
  readonly localCoOp: unsureBoolEnum;
  private readonly versionYear?: number;
  readonly allDlcVersions?: DlcVersion[]

  constructor(game: Game, versionType: versionEnum, playableOn: systemEnum[], controllerSupport: unsureBoolEnum, localCoOp: unsureBoolEnum, versionYear?: number, allDlcVersions?: DlcVersion[]) {
    this.id = allGameVersions.length;
    this.game = game;
    this.versionType = versionType;
    this.playableOn = playableOn;
    this.controllerSupport = controllerSupport;
    this.localCoOp = localCoOp;
    this.gameIterations = [];
    this.versionYear = versionYear;
    this.allDlcVersions = allDlcVersions;

    allDlcVersions?.forEach(dlcVersion => dlcVersion.gameVersion = this);

    allGameVersions.push(this);
  }

  getPlayableOnTitles(): string {
    const playableOnTitles: string[] = this.playableOn.map(playableOn => systemEnum.toString(playableOn)); //deviceEnum[device]
    return playableOnTitles.join(', ');
  }

  addGameIteration(gameIteration: GameIteration) {
    this.gameIterations.push(gameIteration);
  }

  getVersionType(): string{
    return versionEnum.toString(this.versionType);;
  }

  getVersionYear(): number{
    if (this.versionYear) { return this.versionYear }
    else if(this.game.firstRelease){ return this.game.firstRelease }
    else { return 9999 }
  }
}

export const gv_PC_original_warcraft3 = new GameVersion(g_warcraft3, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false, undefined, []);
export const gv_PC_original_heroesOfMightAndMagic = new GameVersion(g_heroesOfMightAndMagic, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false, undefined, []);
export const gv_PC_original_heroesOfMightAndMagic2 = new GameVersion(g_heroesOfMightAndMagic2, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false, undefined, [dv_PC_original_heroesOfMightAndMagic2_thePriceOfLoyalty]);
export const gv_PC_original_heroesOfMightAndMagic3 = new GameVersion(g_heroesOfMightAndMagic3, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false, undefined, [dv_PC_original_heroesOfMightAndMagic3_armageddonsBlade, dv_PC_original_heroesOfMightAndMagic3_theShadowOfDeath]);
export const gv_PC_original_heroesOfMightAndMagic4 = new GameVersion(g_heroesOfMightAndMagic4, versionEnum.original, [systemEnum.windows], unsureBoolEnum.false, unsureBoolEnum.false, undefined, [dv_PC_original_heroesOfMightAndMagic4_windsOfWar, dv_PC_original_heroesOfMightAndMagic4_theGatheringStorm]);
export const gv_PC_original_halfLife2 = new GameVersion(g_halfLife2, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false, undefined, []);
export const gv_PC_original_halfLife2Episode1 = new GameVersion(g_halfLife2Episode1, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false, undefined, []);
export const gv_PC_original_halfLife2Episode2 = new GameVersion(g_halfLife2Episode2, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false, undefined, []);
export const gv_PC_original_portal = new GameVersion(g_portal, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.true, unsureBoolEnum.false, undefined, []);
export const gv_PC_original_teamFortress2 = new GameVersion(g_teamFortress2, versionEnum.original, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.maybe, unsureBoolEnum.false, undefined, []);
export const gv_3DS_downsample_metalGearSolid3 = new GameVersion(g_metalGearSolid3, versionEnum.downsample, [systemEnum._3ds], unsureBoolEnum.na, unsureBoolEnum.false, 2012, []);
export const gv_PS3_remaster_metalGearSolid2 = new GameVersion(g_metalGearSolid2, versionEnum.remaster, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false, 2011, []);
export const gv_PS3_remaster_metalGearSolid3 = new GameVersion(g_metalGearSolid3, versionEnum.remaster, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false, 2011, []);
export const gv_PS3_original_metalGearSolid4 = new GameVersion(g_metalGearSolid4, versionEnum.original, [systemEnum.ps3], unsureBoolEnum.na, unsureBoolEnum.false, undefined, []);
export const gv_PC_original_ageOfEmpires2 = new GameVersion(g_AgeOfEmpires2, versionEnum.original, [systemEnum.windows], unsureBoolEnum.na, unsureBoolEnum.false, undefined, [dv_PC_original_ageOfEmpires2_theConquerors]);
export const gv_PC_remaster1_ageOfEmpires2 = new GameVersion(g_AgeOfEmpires2, versionEnum.original, [systemEnum.windows], unsureBoolEnum.na, unsureBoolEnum.false, 2012, [dv_PC_remaster1_ageOfEmpires2_theConquerors, dv_PC_remaster1_ageOfEmpires2_theForgotten, dv_PC_remaster1_ageOfEmpires2_theAfricanKingdoms, dv_PC_remaster1_ageOfEmpires1_riseOfTheRajas]);
export const gv_PC_remaster2_ageOfEmpires2 = new GameVersion(g_AgeOfEmpires2, versionEnum.original, [systemEnum.windows], unsureBoolEnum.na, unsureBoolEnum.false, 2017, [dv_PC_remaster2_ageOfEmpires2_theConquerors, dv_PC_remaster2_ageOfEmpires2_theForgotten, dv_PC_remaster2_ageOfEmpires2_theAfricanKingdoms, dv_PC_remaster2_ageOfEmpires2_riseOfTheRajas, dv_PC_remaster2_ageOfEmpires2_lordsOfTheWest, dv_PC_remaster2_ageOfEmpires2_dawnOfTheDukes, dv_PC_remaster2_ageOfEmpires2_dynastiesOfIndia,
]);

allGameVersions.forEach(gameVersion => {
  gameVersion.game.addGameVersion(gameVersion);
});

export function getAllGameVersions(): GameVersion[] {
  return allGameVersions;
}
