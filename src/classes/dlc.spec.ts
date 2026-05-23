import { Dlc, allDlcs } from "./dlc";

describe("Dlc", () => {
  it("should have dlcs registered", () => {
    expect(allDlcs.length).toBeGreaterThan(0);
  });

  it("should assign incremental ids", () => {
    expect(allDlcs[0].id).toBe(0);
    expect(allDlcs[1].id).toBe(1);
  });

  it("should store correct properties", () => {
    const heartsOfStone = allDlcs.find((d) => d.title === "Hearts of Stone")!;
    expect(heartsOfStone).toBeDefined();
    expect(heartsOfStone.firstRelease).toBe(2015);
    expect(heartsOfStone.getDlcType()).toBe("Expansion");
  });

  it("should return correct dlc type strings", () => {
    const expansions = allDlcs.filter((d) => d.getDlcType() === "Expansion");
    expect(expansions.length).toBe(allDlcs.length);
  });

  it("should link dlc versions bidirectionally", () => {
    const dlcWithVersions = allDlcs.find((d) => d.dlcVersions.length > 0)!;
    expect(dlcWithVersions.dlcVersions.length).toBeGreaterThan(0);
    dlcWithVersions.dlcVersions.forEach((dv) => {
      expect(dv.dlc).toBe(dlcWithVersions);
    });
  });
});
