export abstract class Content {
  readonly id: number;
  readonly title: string;
  readonly firstRelease: number;

  constructor(id: number, title: string, firstRelease: number) {
    this.id = id;
    this.title = title;
    this.firstRelease = firstRelease;
  }
}

export const allSeries: Series[] = [];

export class Series {
  readonly id: number;
  readonly title: string;
  games: Game[];

  constructor(title: string) {
    this.id = allSeries.length;
    this.title = title;
    this.games = [];

    allSeries.push(this);
  }
}

export enum genreEnum {
  undefined,
  rts,
  rpg,
  jrpg,
  karting,
  platformer2d,
  platformer3d,
  fps,
  stealth,
  tbs,
  openWorld,
}

export namespace genreEnum {
  export function toString(input: genreEnum): string {
    switch (input) {
      case genreEnum.undefined:
        return "Undefined";
      case genreEnum.rts:
        return "RTS";
      case genreEnum.rpg:
        return "RPG";
      case genreEnum.jrpg:
        return "JRPG";
      case genreEnum.karting:
        return "Karting";
      case genreEnum.platformer2d:
        return "2D Platformer";
      case genreEnum.platformer3d:
        return "3D Platformer";
      case genreEnum.fps:
        return "FPS";
      case genreEnum.stealth:
        return "Stealth";
      case genreEnum.tbs:
        return "TBS";
      case genreEnum.openWorld:
        return "Open World";
    }
    throw new Error("You called genreEnum.toString() with something that is unhandled - Throwing");
  }
}

export const allGames: Game[] = [];

export class Game extends Content {
  readonly genre: genreEnum;
  readonly superVersions: SuperVersion[];
  readonly series: Series;
  readonly alternativeTitles: string[];

  constructor(title: string, genre: genreEnum, firstRelease: number, series: Series, alternativeTitles: string[]) {
    super(allGames.length, title, firstRelease);
    this.genre = genre;
    this.alternativeTitles = alternativeTitles;

    this.superVersions = [];

    this.series = series;
    series.games.push(this);

    allGames.push(this);
  }

  addGameVersion(superVersion: SuperVersion) {
    this.superVersions.push(superVersion);
  }

  getAllDlcForThisGame(): Dlc[] {
    const allDlcForThisGameVersion: Dlc[] = [];

    this.superVersions.forEach((superVersion) => {
      superVersion.gameVersions.forEach((gameVersion) => {
        allDlcs.forEach((dlc) => {
          dlc.dlcVersions.forEach((dlcVersion) => {
            if (dlcVersion.gameVersionsThisCanBeUsedOn.includes(gameVersion)) {
              allDlcForThisGameVersion.push(dlc);
            }
          });
        });
      });
    });

    return [...new Set(allDlcForThisGameVersion)];
  }

  getGenre(): string {
    return genreEnum.toString(this.genre);
  }
}

export enum versionEnum {
  undefined,
  original,
  remaster,
  remake,
  downsample,
  demake,
  enhanced,
}

export namespace versionEnum {
  export function toString(input: versionEnum): string {
    switch (input) {
      case versionEnum.undefined:
        return "Undefined";
      case versionEnum.original:
        return "Original";
      case versionEnum.remaster:
        return "Remaster";
      case versionEnum.remake:
        return "Remake";
      case versionEnum.downsample:
        return "Downsample";
      case versionEnum.demake:
        return "Demake";
      case versionEnum.enhanced:
        return "Enhanced";
    }
    throw "You called versionEnum.toString() with something that is unhandled - Throwing";
  }
}

export const allSuperVersions: SuperVersion[] = [];

export class SuperVersion {
  readonly id: number;
  readonly game: Game;
  readonly versionType: versionEnum;
  readonly versionName: string;
  readonly versionYear?: number;
  readonly gameVersions: GameVersion[];

  constructor(game: Game, versionType: versionEnum, versionName: string, versionYear?: number) {
    this.id = allSuperVersions.length;
    this.versionType = versionType;
    this.versionName = versionName;
    this.versionYear = versionYear;

    this.game = game;
    game.superVersions.push(this);

    this.gameVersions = [];

    allSuperVersions.push(this);
  }

  getVersionType(): string {
    return versionEnum.toString(this.versionType);
  }

  getVersionYear(): number {
    if (this.versionYear !== undefined) {
      return this.versionYear;
    } else if (this.game.firstRelease) {
      return this.game.firstRelease;
    } else {
      return 9999;
    }
  }
}

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
      case providerEnum.rockstarSocialClub:
        return "Rockstar Social Club";
      case providerEnum.xboxLive:
        return "Xbox Live";
      case providerEnum.psn:
        return "PSN";
      case providerEnum.nintendoEshop:
        return "Nintendo eShop";
    }
    throw "You called providerEnum.toString() with something that is unhandled - Throwing";
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
  readonly controllerSupport: unsureBoolEnum;
  readonly localMultiPlayer: unsureBoolEnum;
  readonly onlineMultiPlayer: unsureBoolEnum;
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
    const playableOn: string[] = this.playableOn.map((playableOn) => systemEnum.toString(playableOn));
    return playableOn;
  }

  getPlayableOnTitles(): string {
    return this.getPlayableOn().join(", ");
  }

  getIntendedFor(): string[] {
    const intendedFor: string[] = this.intendedFor.map((playableOn) => systemEnum.toString(playableOn));
    return intendedFor;
  }

  getIntendedForTitles(): string {
    return this.getIntendedFor().join(", ");
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

  getControllerSupport(): string {
    return unsureBoolEnum.toString(this.controllerSupport);
  }
}

export const allDlcs: Dlc[] = [];

export enum dlcTypeEnum {
  undefined,
  expansion,
  contentPack,
  extras,
}

export namespace dlcTypeEnum {
  export function toString(input: dlcTypeEnum): string {
    switch (input) {
      case dlcTypeEnum.undefined:
        return "Undefined";
      case dlcTypeEnum.expansion:
        return "Expansion";
      case dlcTypeEnum.contentPack:
        return "Content pack";
      case dlcTypeEnum.extras:
        return "Extras";
      default:
        throw `You called dlcTypeEnum.toString() with \'${input}\' which is unhandled - Throwing`;
    }
  }
}

export class Dlc extends Content {
  dlcVersions: DlcVersion[];
  dlcType: dlcTypeEnum;

  constructor(title: string, firstRelease: number, dlcType: dlcTypeEnum) {
    super(allDlcs.length, title, firstRelease);
    this.dlcVersions = [];
    this.dlcType = dlcType;

    allDlcs.push(this);
  }

  getDlcType(): string {
    return dlcTypeEnum.toString(this.dlcType);
  }
}

export const allDlcVersions: DlcVersion[] = [];

export class DlcVersion {
  readonly id: number;
  readonly dlc: Dlc;
  readonly gameVersionsThisCanBeUsedOn: GameVersion[];
  readonly collections: Collection[];
  readonly onDiscForConsoleOnly: boolean;

  constructor(gameVersionsThisCanBeUsedOn: GameVersion[], dlc: Dlc, onDiscForConsoleOnly: boolean) {
    this.id = allDlcVersions.length;
    this.onDiscForConsoleOnly = onDiscForConsoleOnly;
    this.gameVersionsThisCanBeUsedOn = gameVersionsThisCanBeUsedOn;
    gameVersionsThisCanBeUsedOn.forEach((gameVersion) => gameVersion.dlcVersionsThatThisCanUse.push(this));

    this.dlc = dlc;
    dlc.dlcVersions.push(this);

    this.collections = [];

    allDlcVersions.push(this);
  }

  getPlayableOnTitles(): string {
    const playableOnList: string[] = [];
    this.gameVersionsThisCanBeUsedOn.forEach((gameVersion) => {
      gameVersion.getPlayableOn().forEach((playableOn) => playableOnList.push(playableOn));
    });
    return [...new Set(playableOnList)].join(", ");
  }

  getFirstGameVersion(): GameVersion {
    if (this.gameVersionsThisCanBeUsedOn.length === 0) {
      throw new Error("DlcVersion has no associated GameVersions");
    }
    return this.gameVersionsThisCanBeUsedOn[0];
  }
}

export enum mediaEnum {
  na,
  digital,
  dvd,
  cd,
  bluRay,
}

export namespace mediaEnum {
  export function toString(input: mediaEnum): string {
    switch (input) {
      case mediaEnum.na:
        return "N/A";
      case mediaEnum.digital:
        return "Digital";
      case mediaEnum.dvd:
        return "DVD";
      case mediaEnum.cd:
        return "CD";
      case mediaEnum.bluRay:
        return "Blu-ray";
    }
    throw new Error("You called mediaEnum.toString() with something that is unhandled - Throwing");
  }
}

export const allCollections: Collection[] = [];

export class Collection {
  readonly id: number;
  readonly title: string;
  readonly gameVersions: GameVersion[];
  readonly media: mediaEnum;
  readonly releaseYear?: number;
  readonly dlcVersions: DlcVersion[];

  constructor(
    title: string,
    gameVersions: GameVersion[],
    dlcVersions: DlcVersion[],
    media: mediaEnum,
    releaseYear?: number,
  ) {
    this.id = allCollections.length;
    this.title = title;
    this.media = media;
    this.releaseYear = releaseYear;

    this.gameVersions = gameVersions;
    gameVersions.forEach((gameVersion) => gameVersion.collections.push(this));

    this.dlcVersions = dlcVersions;
    dlcVersions.forEach((dlcVersion) => dlcVersion.collections.push(this));

    allCollections.push(this);
  }

  getPlayableOnTitles(): string {
    const playableOnList: string[] = [];

    this.gameVersions.forEach((gameVersion) =>
      gameVersion.getPlayableOn().forEach((playableOn) => playableOnList.push(playableOn)),
    );

    this.dlcVersions.forEach((dlcVersion) => {
      dlcVersion.gameVersionsThisCanBeUsedOn.forEach((gameVersion) => {
        gameVersion.getPlayableOn().forEach((playableOn) => playableOnList.push(playableOn));
      });
    });

    return [...new Set(playableOnList)].join(", ");
  }

  getVersionTypes(): string {
    const versionTypes: string[] = this.gameVersions.map((gameVersion) => gameVersion.superVersion.getVersionType());

    this.dlcVersions.forEach((dlcVersion) => {
      dlcVersion.gameVersionsThisCanBeUsedOn.forEach((gameVersion) => {
        versionTypes.push(gameVersion.superVersion.getVersionType());
      });
    });

    return [...new Set(versionTypes)].join(", ");
  }
}

// Data instances are loaded via side-effect imports in main.ts
