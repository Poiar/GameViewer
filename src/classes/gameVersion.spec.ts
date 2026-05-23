import { GameVersion, systemEnum, unsureBoolEnum, providerEnum, allGameVersions } from "./gameVersion";
import { allSuperVersions } from "./superVersion";

describe("systemEnum", () => {
  it("should convert enum values to strings", () => {
    expect(systemEnum.toString(systemEnum.windows)).toBe("Win");
    expect(systemEnum.toString(systemEnum.ps5)).toBe("PS5");
    expect(systemEnum.toString(systemEnum._3ds)).toBe("3DS");
    expect(systemEnum.toString(systemEnum.macOs)).toBe("macOS");
    expect(systemEnum.toString(systemEnum.linux)).toBe("Linux");
  });
});

describe("unsureBoolEnum", () => {
  it("should convert enum values to strings", () => {
    expect(unsureBoolEnum.toString(unsureBoolEnum.yes)).toBe("Yes");
    expect(unsureBoolEnum.toString(unsureBoolEnum.no)).toBe("No");
    expect(unsureBoolEnum.toString(unsureBoolEnum.maybe)).toBe("Maybe");
    expect(unsureBoolEnum.toString(unsureBoolEnum.notApplicable)).toBe("Not applicable");
  });
});

describe("providerEnum", () => {
  it("should convert enum values to strings", () => {
    expect(providerEnum.toString(providerEnum.physical)).toBe("Physical");
    expect(providerEnum.toString(providerEnum.steam)).toBe("Steam");
    expect(providerEnum.toString(providerEnum.gog)).toBe("GOG");
    expect(providerEnum.toString(providerEnum.xboxLive)).toBe("Xbox Live");
    expect(providerEnum.toString(providerEnum.nintendoEshop)).toBe("Nintendo eShop");
  });
});

describe("GameVersion", () => {
  it("should have game versions registered", () => {
    expect(allGameVersions.length).toBeGreaterThan(0);
  });

  it("should assign incremental ids", () => {
    expect(allGameVersions[0].id).toBe(0);
    expect(allGameVersions[1].id).toBe(1);
  });

  it("should return provider as string", () => {
    const steamVersion = allGameVersions.find((gv) => gv.provider === providerEnum.steam)!;
    expect(steamVersion.getProvider()).toBe("Steam");

    const physicalVersion = allGameVersions.find((gv) => gv.provider === providerEnum.physical)!;
    expect(physicalVersion.getProvider()).toBe("Physical");
  });

  it("should return playableOn as string array", () => {
    const sdVersion = allGameVersions.find((gv) => gv.playableOn.includes(systemEnum.sd))!;
    const playableOn = sdVersion.getPlayableOn();
    expect(playableOn).toContain("SD");
    expect(playableOn).toContain("Win");
  });

  it("should return playableOn titles as comma-joined string", () => {
    const sdVersion = allGameVersions.find((gv) => gv.playableOn.includes(systemEnum.sd))!;
    expect(sdVersion.getPlayableOnTitles()).toBe("Win, SD");
  });

  it("should return intendedFor as string array", () => {
    const ps4Version = allGameVersions.find((gv) => gv.intendedFor.includes(systemEnum.ps4))!;
    expect(ps4Version.getIntendedFor()).toEqual(["PS4"]);
  });

  it("should return local multiplayer as string", () => {
    const version = allGameVersions[0];
    expect(version.getLocalMultiplayer()).toBe("No");
  });

  it("should return online multiplayer as string", () => {
    const version = allGameVersions[0];
    expect(version.getOnlineMultiplayer()).toBe("No");
  });

  it("should link to superVersion bidirectionally", () => {
    const warcraftSv = allSuperVersions.find(
      (sv) => sv.game.title === "Warcraft 3: Reign of Chaos" && sv.versionName === "",
    )!;
    expect(warcraftSv.gameVersions.length).toBeGreaterThan(0);
    expect(warcraftSv.gameVersions[0].superVersion).toBe(warcraftSv);
  });
});
