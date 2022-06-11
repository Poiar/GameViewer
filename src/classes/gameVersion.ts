import {
  g_ageOfEmpires2,
  g_halfLife2,
  g_halfLife2Episode1,
  g_halfLife2Episode2,
  g_heroesOfMightAndMagic,
  g_heroesOfMightAndMagic2,
  g_heroesOfMightAndMagic3,
  g_heroesOfMightAndMagic4, g_indigoProphecy,
  g_metalGearSolid2,
  g_metalGearSolid3,
  g_metalGearSolid4,
  g_portal, g_redDeadRedemption, g_RedDeadRedemptionUndeadNightmare,
  g_teamFortress2,
  g_warcraft3,
  Game,
} from "./game";
import {Collection} from "./collection";
import {DlcVersion} from "./dlcVersion";

export enum systemEnum {
  windows,
  sd,
  xbox,
  x360,
  xone,
  xsx,
  ps,
  ps2,
  ps3,
  ps4,
  ps5,
  psp,
  psVita,
  nes,
  snes,
  n64,
  gc,
  wii,
  wiiU,
  switch,
  gb,
  gbc,
  gba,
  ds,
  _3ds,
  android,
  iOS,
  linux,
  macOs,
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
      case systemEnum.xone:
        return "XONE"
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
      case systemEnum.psVita:
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
      case systemEnum.wiiU:
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
      case systemEnum.iOS:
        return "iOS"
      case systemEnum.linux:
        return "Linux"
      case systemEnum.macOs:
        return "macOS"
    }
    throw "You called systemEnum.toString() with something that is unhandled - Throwing"
  }
}

export enum unsureBoolEnum {
  yes,
  no,
  maybe,
  notApplicable,
}

export namespace unsureBoolEnum {
  export function toString(input: unsureBoolEnum): string {
    switch (input) {
      case unsureBoolEnum.yes:
        return "Yes"
      case unsureBoolEnum.no:
        return "No"
      case unsureBoolEnum.maybe:
        return "Maybe"
      case unsureBoolEnum.notApplicable:
        return "Not applicable"

    }
    throw "You called unsureBoolEnum.toString() with something that is unhandled - Throwing"
  }
}

enum versionEnum {
  undefined,
  original,
  remaster,
  remake,
  downsample,
  demake,
  enhanced,
}

namespace versionEnum {
  export function toString(input: versionEnum): string {
    switch (input) {
      case versionEnum.undefined:
        return "Undefined"
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
      case versionEnum.enhanced:
        return "Enhanced"
    }
    throw "You called versionEnum.toString() with something that is unhandled - Throwing"
  }
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
  xboxLive,
  psn,
  nintendoEshop,
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
      case providerEnum.xboxLive:
        return 'Xbox Live';
      case providerEnum.psn:
        return 'PSN';
      case providerEnum.nintendoEshop:
        return 'Nintendo eShop';
    }
    throw 'You called versionEnum.toString() with something that is unhandled - Throwing';
  }
}

export const allGameVersions: GameVersion[] = [];

export class GameVersion {
  readonly id: number;
  readonly game: Game;
  readonly edition: string;
  readonly versionType: versionEnum;
  readonly provider: providerEnum;
  readonly collections: Collection[];
  readonly playableOn: systemEnum[];
  readonly controllerSupport: unsureBoolEnum;
  readonly localCoOp: unsureBoolEnum;
  private readonly versionYear?: number;
  readonly dlcVersionsThatThisCanUse: DlcVersion[];

  constructor(game: Game, edition: string, versionType: versionEnum, provider: providerEnum, playableOn: systemEnum[], controllerSupport: unsureBoolEnum, localCoOp: unsureBoolEnum, versionYear?: number) {
    this.id = allGameVersions.length;
    this.edition = edition;
    this.versionType = versionType;
    this.provider = provider;
    this.playableOn = playableOn;
    this.controllerSupport = controllerSupport;
    this.localCoOp = localCoOp;
    this.versionYear = versionYear;

    this.game = game;
    game.gameVersions.push(this);

    this.collections = [];
    this.dlcVersionsThatThisCanUse = [];

    allGameVersions.push(this);
  }

  getProvider(): string {
    return providerEnum.toString(this.provider);
  }

  getPlayableOn(): string[] {
    const playableOn: string[] = this.playableOn.map(playableOn => systemEnum.toString(playableOn)); //deviceEnum[device]
    return playableOn;
  }

  getPlayableOnTitles(): string {
    return this.getPlayableOn().join(', ');
    // return [...new Set(playableOnTitles)].join(', '); //unique
  }

  getVersionType(): string {
    return versionEnum.toString(this.versionType);
  }

  getVersionYear(): number {
    if (this.versionYear) { return this.versionYear }
    else if(this.game.firstRelease){ return this.game.firstRelease }
    else { return 9999 }
  }

  getCollections(): string {
    return this.collections.map(collection => collection.title).join();
  }

  getLocalCoOp(): string {
    return unsureBoolEnum.toString(this.localCoOp);
  }

}

export const gv_PC_physical_original_warcraft3 = new GameVersion(g_warcraft3, "", versionEnum.original, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.no, unsureBoolEnum.no, undefined);
export const gv_PC_physical_original_heroesOfMightAndMagic = new GameVersion(g_heroesOfMightAndMagic, "", versionEnum.original, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.no, unsureBoolEnum.no, undefined);
export const gv_PC_physical_original_heroesOfMightAndMagic2 = new GameVersion(g_heroesOfMightAndMagic2, "", versionEnum.original, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.no, unsureBoolEnum.no, undefined);
export const gv_PC_physical_original_heroesOfMightAndMagic3 = new GameVersion(g_heroesOfMightAndMagic3, "", versionEnum.original, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.no, unsureBoolEnum.no, undefined);
export const gv_PC_gog_original_heroesOfMightAndMagic3 = new GameVersion(g_heroesOfMightAndMagic3, "", versionEnum.original, providerEnum.gog, [systemEnum.windows], unsureBoolEnum.no, unsureBoolEnum.no, undefined);
export const gv_PC_physical_original_heroesOfMightAndMagic4 = new GameVersion(g_heroesOfMightAndMagic4, "", versionEnum.original, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.no, unsureBoolEnum.no, undefined);
export const gv_PC_steam_original_halfLife2 = new GameVersion(g_halfLife2, "", versionEnum.original, providerEnum.steam, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.yes, unsureBoolEnum.no, undefined);
export const gv_PC_steam_original_halfLife2Episode1 = new GameVersion(g_halfLife2Episode1, "", versionEnum.original, providerEnum.steam, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.yes, unsureBoolEnum.no, undefined);
export const gv_PC_steam_original_halfLife2Episode2 = new GameVersion(g_halfLife2Episode2, "", versionEnum.original, providerEnum.steam, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.yes, unsureBoolEnum.no, undefined);
export const gv_PC_steam_original_portal = new GameVersion(g_portal, "", versionEnum.original, providerEnum.steam, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.yes, unsureBoolEnum.no, undefined);
export const gv_PC_steam_original_teamFortress2 = new GameVersion(g_teamFortress2, "", versionEnum.original, providerEnum.steam, [systemEnum.windows, systemEnum.sd], unsureBoolEnum.maybe, unsureBoolEnum.no, undefined);
export const gv_3DS_physical_downsample_metalGearSolid3 = new GameVersion(g_metalGearSolid3, "", versionEnum.downsample, providerEnum.physical, [systemEnum._3ds], unsureBoolEnum.notApplicable, unsureBoolEnum.no, 2012);
export const gv_PS3_physical_remaster_metalGearSolid2 = new GameVersion(g_metalGearSolid2, "", versionEnum.remaster, providerEnum.physical, [systemEnum.ps3], unsureBoolEnum.notApplicable, unsureBoolEnum.no, 2011);
export const gv_PS3_physical_remaster_metalGearSolid3 = new GameVersion(g_metalGearSolid3, "", versionEnum.remaster, providerEnum.physical, [systemEnum.ps3], unsureBoolEnum.notApplicable, unsureBoolEnum.no, 2011);
export const gv_PS3_physical_original_metalGearSolid4 = new GameVersion(g_metalGearSolid4, "", versionEnum.original, providerEnum.physical, [systemEnum.ps3], unsureBoolEnum.notApplicable, unsureBoolEnum.no, undefined);
export const gv_PC_steam_original_ageOfEmpires2 = new GameVersion(g_ageOfEmpires2, "", versionEnum.original, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.notApplicable, unsureBoolEnum.no, undefined);
export const gv_PC_steam_remaster1_ageOfEmpires2 = new GameVersion(g_ageOfEmpires2, "HD Edition", versionEnum.remaster, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.notApplicable, unsureBoolEnum.no, 2012);
export const gv_PC_steam_remaster2_ageOfEmpires2 = new GameVersion(g_ageOfEmpires2, "Definitive Edition", versionEnum.remaster, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.notApplicable, unsureBoolEnum.no, 2017);
export const gv_PC_physical_original_indigoProphecy = new GameVersion(g_indigoProphecy, "", versionEnum.original, providerEnum.physical, [systemEnum.windows], unsureBoolEnum.yes, unsureBoolEnum.no, 2005);
export const gv_PS2_physical_original_indigoProphecy = new GameVersion(g_indigoProphecy, "", versionEnum.original, providerEnum.physical, [systemEnum.ps2], unsureBoolEnum.yes, unsureBoolEnum.no, 2005);
export const gv_Xbox_physical_original_indigoProphecy = new GameVersion(g_indigoProphecy, "", versionEnum.original, providerEnum.physical, [systemEnum.xbox], unsureBoolEnum.yes, unsureBoolEnum.no, 2005);
export const gv_X360_physical_original_indigoProphecy = new GameVersion(g_indigoProphecy, "", versionEnum.enhanced, providerEnum.physical, [systemEnum.x360], unsureBoolEnum.yes, unsureBoolEnum.no, 2007);
export const gv_X360_digital_original_indigoProphecy = new GameVersion(g_indigoProphecy, "", versionEnum.enhanced, providerEnum.xboxLive, [systemEnum.x360], unsureBoolEnum.yes, unsureBoolEnum.no, 2007);
export const gv_PC_steam_remastered_indigoProphecy = new GameVersion(g_indigoProphecy, "Remastered", versionEnum.remaster, providerEnum.steam, [systemEnum.windows, systemEnum.linux, systemEnum.macOs], unsureBoolEnum.yes, unsureBoolEnum.no, 2015);
export const gv_PS4_digital_remastered_indigoProphecy = new GameVersion(g_indigoProphecy, "", versionEnum.remaster, providerEnum.psn, [systemEnum.ps4, systemEnum.ps5], unsureBoolEnum.yes, unsureBoolEnum.no, 2015);
export const gv_PS4_physical_remastered_indigoProphecy = new GameVersion(g_indigoProphecy, "", versionEnum.remaster, providerEnum.physical, [systemEnum.ps4, systemEnum.ps5], unsureBoolEnum.yes, unsureBoolEnum.no, 2015);

export const gv_X360_physical_original_redDeadRedemption = new GameVersion(g_redDeadRedemption, "", versionEnum.original, providerEnum.physical, [systemEnum.x360, systemEnum.xsx], unsureBoolEnum.yes, unsureBoolEnum.no, 2010);
export const gv_X360_physical_original_redDeadRedemptionUndeadNightmare = new GameVersion(g_RedDeadRedemptionUndeadNightmare, "", versionEnum.original, providerEnum.physical, [systemEnum.x360, systemEnum.xone, systemEnum.xsx], unsureBoolEnum.yes, unsureBoolEnum.no, 2010);

console.log(allGameVersions);
