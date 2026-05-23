import { Collection, allCollections } from "./collection";
import { allGameVersions } from "./gameVersion";

describe("Collection", () => {
  it("should have collections registered", () => {
    expect(allCollections.length).toBeGreaterThan(0);
  });

  it("should assign incremental ids", () => {
    expect(allCollections[0].id).toBe(0);
  });

  it("should store title and release year", () => {
    const warcraftCollection = allCollections.find((c) => c.title === "Warcraft 3: Reign of Chaos")!;
    expect(warcraftCollection).toBeDefined();
    expect(warcraftCollection.releaseYear).toBe(2002);
  });

  it("should return playableOn titles from game versions", () => {
    const warcraftCollection = allCollections.find((c) => c.title === "Warcraft 3: Reign of Chaos")!;
    expect(warcraftCollection.getPlayableOnTitles()).toContain("Win");
  });

  it("should link game versions to collections bidirectionally", () => {
    const collectionWithGv = allCollections.find((c) => c.gameVersions.length > 0)!;
    const gv = collectionWithGv.gameVersions[0];
    expect(gv.collections).toContain(collectionWithGv);
  });
});
