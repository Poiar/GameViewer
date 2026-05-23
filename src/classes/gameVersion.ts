import {
  g_ageOfEmpires2,
  g_halfLife2,
  g_halfLife2Episode1,
  g_halfLife2Episode2,
  g_heroesOfMightAndMagic,
  g_heroesOfMightAndMagic2,
  g_heroesOfMightAndMagic3,
  g_heroesOfMightAndMagic4,
  g_indigoProphecy,
  g_metalGearSolid2,
  g_metalGearSolid3,
  g_metalGearSolid4,
  g_portal,
  g_redDeadRedemption,
  g_redDeadRedemptionUndeadNightmare,
  g_teamFortress2,
  g_theWitcher3,
  g_warcraft3,
  Game,
} from "./game";
import { Collection } from "./collection";
import { DlcVersion } from "./dlcVersion";
import {
  SuperVersion,
  sv_downsample_metalGearSolid3,
  sv_enhanced2016_redDeadRedemption,
  sv_enhanced2016_redDeadRedemptionUndeadNightmare,
  sv_enhanced2018_redDeadRedemption,
  sv_enhanced2018_redDeadRedemptionUndeadNightmare,
  sv_enhanced_indigoProphecy,
  sv_enhanced_theWitcher3,
  sv_original_ageOfEmpires2,
  sv_original_halfLife2,
  sv_original_halfLife2Episode1,
  sv_original_halfLife2Episode2,
  sv_original_heroesOfMightAndMagic,
  sv_original_heroesOfMightAndMagic2,
  sv_original_heroesOfMightAndMagic3,
  sv_original_heroesOfMightAndMagic4,
  sv_original_indigoProphecy,
  sv_original_metalGearSolid4,
  sv_original_portal,
  sv_original_redDeadRedemption,
  sv_original_redDeadRedemptionUndeadNightmare,
  sv_original_teamFortress2,
  sv_original_theWitcher3,
  sv_original_warcraft3,
  sv_remaster2012_ageOfEmpires2,
  sv_remaster2017_ageOfEmpires2,
  sv_remaster_metalGearSolid2,
  sv_remaster_metalGearSolid3,
  sv_remastered_indigoProphecy,
} from "./superVersion";

export enum systemEnum {
  windows,
  sd,
  xbox,
  x360,
  xone,
  xonex,
  xss,
  xsx,
  ps,
  ps2,
  ps3,
  ps4,
  ps5,
  ps5d,
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
        return "Win";
      case systemEnum.sd:
        return "SD";
      case systemEnum.xbox:
        return "Xbox";
      case systemEnum.x360:
        return "X360";
      case systemEnum.xone:
        return "XONE";
      case systemEnum.xonex:
        return "XONEX";
      case systemEnum.xss:
        return "XSS";
      case systemEnum.xsx:
        return "XSX";
      case systemEnum.ps:
        return "PS1";
      case systemEnum.ps2:
        return "PS2";
      case systemEnum.ps3:
        return "PS3";
      case systemEnum.ps4:
        return "PS4";
      case systemEnum.ps5:
        return "PS5";
      case systemEnum.ps5d:
        return "PS5D";
      case systemEnum.psp:
        return "PSP";
      case systemEnum.psVita:
        return "PSVita";
      case systemEnum.nes:
        return "NES";
      case systemEnum.snes:
        return "SNES";
      case systemEnum.n64:
        return "N64";
      case systemEnum.gc:
        return "GC";
      case systemEnum.wii:
        return "Wii";
      case systemEnum.wiiU:
        return "WiiU";
      case systemEnum.switch:
        return "Switch";
      case systemEnum.gb:
        return "GB";
      case systemEnum.gbc:
        return "GBC";
      case systemEnum.gba:
        return "GBA";
      case systemEnum.ds:
        return "NDS";
      case systemEnum._3ds:
        return "3DS";
      case systemEnum.android:
        return "And";
      case systemEnum.iOS:
        return "iOS";
      case systemEnum.linux:
        return "Linux";
      case systemEnum.macOs:
        return "macOS";
    }
    throw "You called systemEnum.toString() with something that is unhandled - Throwing";
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
        return "Yes";
      case unsureBoolEnum.no:
        return "No";
      case unsureBoolEnum.maybe:
        return "Maybe";
      case unsureBoolEnum.notApplicable:
        return "Not applicable";
    }
    throw "You called unsureBoolEnum.toString() with something that is unhandled - Throwing";
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
        return "Physical";
      case providerEnum.steam:
        return "Steam";
      case providerEnum.epic:
        return "Epic";
      case providerEnum.gog:
        return "GOG";
      case providerEnum.origin:
        return "Origin";
      case providerEnum.origin2:
        return "Origin Alt";
      case providerEnum.ubisoft:
        return "Ubisoft";
      case providerEnum.humbleBundle:
        return "Humble";
      case providerEnum.xboxLive:
        return "Xbox Live";
      case providerEnum.psn:
        return "PSN";
      case providerEnum.nintendoEshop:
        return "Nintendo eShop";
    }
    throw "You called) with something that is unhandled - Throwing";
  }
}

export const allGameVersions: GameVersion[] = [];

export class GameVersion {
  readonly id: number;
  readonly superVersion: SuperVersion;
  readonly provider: providerEnum;
  readonly collections: Collection[];
  readonly intendedFor: systemEnum[];
  readonly playableOn: systemEnum[];
  readonly controllerSupport: unsureBoolEnum; //Change to input methods
  readonly localMultiPlayer: unsureBoolEnum;
  readonly onlineMultiPlayer: unsureBoolEnum; //comment in
  readonly dlcVersionsThatThisCanUse: DlcVersion[];

  constructor(
    superVersion: SuperVersion,
    provider: providerEnum,
    intendedFor: systemEnum[],
    playableOn: systemEnum[],
    controllerSupport: unsureBoolEnum,
    localMultiPlayer: unsureBoolEnum,
    onlineMultiPlayer: unsureBoolEnum,
  ) {
    this.id = allGameVersions.length;
    this.provider = provider;
    this.intendedFor = intendedFor;
    this.playableOn = playableOn;
    this.controllerSupport = controllerSupport;
    this.localMultiPlayer = localMultiPlayer;
    this.onlineMultiPlayer = onlineMultiPlayer;

    this.superVersion = superVersion;
    superVersion.gameVersions.push(this);

    this.collections = [];
    this.dlcVersionsThatThisCanUse = [];

    allGameVersions.push(this);
  }

  getProvider(): string {
    return providerEnum.toString(this.provider);
  }

  getPlayableOn(): string[] {
    const playableOn: string[] = this.playableOn.map((playableOn) => systemEnum.toString(playableOn)); //deviceEnum[device]
    return playableOn;
  }

  getPlayableOnTitles(): string {
    return this.getPlayableOn().join(", ");
    // return [...new Set(playableOnTitles)].join(', '); //unique
  }

  getIntendedFor(): string[] {
    const intendedFor: string[] = this.intendedFor.map((playableOn) => systemEnum.toString(playableOn)); //deviceEnum[device]
    return intendedFor;
  }

  getIntendedForTitles(): string {
    return this.getIntendedFor().join(", ");
    // return [...new Set(playableOnTitles)].join(', '); //unique
  }

  getCollections(): string {
    return this.collections.map((collection) => collection.title).join();
  }

  getLocalMultiplayer(): string {
    return unsureBoolEnum.toString(this.localMultiPlayer);
  }

  getOnlineMultiplayer(): string {
    return unsureBoolEnum.toString(this.onlineMultiPlayer);
  }
}

export const gv_PC_physical_original_warcraft3 = new GameVersion(
  sv_original_warcraft3,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_heroesOfMightAndMagic = new GameVersion(
  sv_original_heroesOfMightAndMagic,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_heroesOfMightAndMagic2 = new GameVersion(
  sv_original_heroesOfMightAndMagic2,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_heroesOfMightAndMagic3 = new GameVersion(
  sv_original_heroesOfMightAndMagic3,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_gog_original_heroesOfMightAndMagic3 = new GameVersion(
  sv_original_heroesOfMightAndMagic3,
  providerEnum.gog,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_heroesOfMightAndMagic4 = new GameVersion(
  sv_original_heroesOfMightAndMagic4,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.no,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_halfLife2 = new GameVersion(
  sv_original_halfLife2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_halfLife2Episode1 = new GameVersion(
  sv_original_halfLife2Episode1,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_halfLife2Episode2 = new GameVersion(
  sv_original_halfLife2Episode2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_portal = new GameVersion(
  sv_original_portal,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_teamFortress2 = new GameVersion(
  sv_original_teamFortress2,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.sd],
  unsureBoolEnum.maybe,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_3DS_physical_downsample_metalGearSolid3 = new GameVersion(
  sv_downsample_metalGearSolid3,
  providerEnum.physical,
  [systemEnum._3ds],
  [systemEnum._3ds],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS3_physical_remaster_metalGearSolid2 = new GameVersion(
  sv_remaster_metalGearSolid2,
  providerEnum.physical,
  [systemEnum.ps3],
  [systemEnum.ps3],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS3_physical_remaster_metalGearSolid3 = new GameVersion(
  sv_remaster_metalGearSolid3,
  providerEnum.physical,
  [systemEnum.ps3],
  [systemEnum.ps3],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS3_physical_original_metalGearSolid4 = new GameVersion(
  sv_original_metalGearSolid4,
  providerEnum.physical,
  [systemEnum.ps3],
  [systemEnum.ps3],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_original_ageOfEmpires2 = new GameVersion(
  sv_original_ageOfEmpires2,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_remaster1_ageOfEmpires2 = new GameVersion(
  sv_remaster2012_ageOfEmpires2,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_remaster2_ageOfEmpires2 = new GameVersion(
  sv_remaster2017_ageOfEmpires2,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.notApplicable,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_physical_original_indigoProphecy = new GameVersion(
  sv_original_indigoProphecy,
  providerEnum.physical,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS2_physical_original_indigoProphecy = new GameVersion(
  sv_original_indigoProphecy,
  providerEnum.physical,
  [systemEnum.ps2],
  [systemEnum.ps2],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_Xbox_physical_original_indigoProphecy = new GameVersion(
  sv_original_indigoProphecy,
  providerEnum.physical,
  [systemEnum.xbox],
  [systemEnum.xbox],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced_indigoProphecy = new GameVersion(
  sv_enhanced_indigoProphecy,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.x360],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_digital_enhanced_indigoProphecy = new GameVersion(
  sv_enhanced_indigoProphecy,
  providerEnum.xboxLive,
  [systemEnum.x360],
  [systemEnum.x360],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_steam_remastered_indigoProphecy = new GameVersion(
  sv_remastered_indigoProphecy,
  providerEnum.steam,
  [systemEnum.windows],
  [systemEnum.windows, systemEnum.linux, systemEnum.macOs],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS4_digital_remastered_indigoProphecy = new GameVersion(
  sv_remastered_indigoProphecy,
  providerEnum.psn,
  [systemEnum.ps4],
  [systemEnum.ps4, systemEnum.ps5],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PS4_physical_remastered_indigoProphecy = new GameVersion(
  sv_remastered_indigoProphecy,
  providerEnum.physical,
  [systemEnum.ps4],
  [systemEnum.ps4, systemEnum.ps5],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

export const gv_X360_physical_original_redDeadRedemption = new GameVersion(
  sv_original_redDeadRedemption,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.x360],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced2016_redDeadRedemption = new GameVersion(
  sv_enhanced2016_redDeadRedemption,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.xone],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced2018_redDeadRedemption = new GameVersion(
  sv_enhanced2018_redDeadRedemption,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.xonex, systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

export const gv_X360_physical_original_redDeadRedemptionUndeadNightmare = new GameVersion(
  sv_original_redDeadRedemptionUndeadNightmare,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.x360],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced2016_redDeadRedemptionUndeadNightmare = new GameVersion(
  sv_enhanced2016_redDeadRedemptionUndeadNightmare,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.xone],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_X360_physical_enhanced2018_redDeadRedemptionUndeadNightmare = new GameVersion(
  sv_enhanced2018_redDeadRedemptionUndeadNightmare,
  providerEnum.physical,
  [systemEnum.x360],
  [systemEnum.xonex, systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

export const gv_XONE_physical_original_theWitcher3 = new GameVersion(
  sv_original_theWitcher3,
  providerEnum.physical,
  [systemEnum.xone],
  [systemEnum.xone, systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XONE_digital_original_theWitcher3 = new GameVersion(
  sv_original_theWitcher3,
  providerEnum.xboxLive,
  [systemEnum.xone],
  [systemEnum.xone, systemEnum.xsx, systemEnum.xss],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

export const gv_XSX_physical_enhanced_theWitcher3 = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.physical,
  [systemEnum.xsx],
  [systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XSX_digital_enhanced_theWitcher3 = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.xboxLive,
  [systemEnum.xsx, systemEnum.xss],
  [systemEnum.xsx, systemEnum.xss],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

export const gv_XONE_physical_original_theWitcher3Goty = new GameVersion(
  sv_original_theWitcher3,
  providerEnum.physical,
  [systemEnum.xone],
  [systemEnum.xone, systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XONE_digital_original_theWitcher3Goty = new GameVersion(
  sv_original_theWitcher3,
  providerEnum.xboxLive,
  [systemEnum.xone],
  [systemEnum.xone, systemEnum.xsx, systemEnum.xss],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

export const gv_XSX_physical_enhanced_theWitcher3Goty = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.physical,
  [systemEnum.xsx],
  [systemEnum.xsx],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_XSX_digital_enhanced_theWitcher3Goty = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.xboxLive,
  [systemEnum.xsx, systemEnum.xss],
  [systemEnum.xsx, systemEnum.xss],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

export const gv_PC_gog_enhanced_theWitcher3 = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.gog,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);
export const gv_PC_gog_enhanced_theWitcher3Goty = new GameVersion(
  sv_enhanced_theWitcher3,
  providerEnum.gog,
  [systemEnum.windows],
  [systemEnum.windows],
  unsureBoolEnum.yes,
  unsureBoolEnum.no,
  unsureBoolEnum.no,
);

console.log({ allGameVersions });
