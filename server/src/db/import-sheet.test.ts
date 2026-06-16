import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Re-exported helper functions from import-sheet.ts for testing
// These are pure functions duplicated here for isolated unit testing
// ---------------------------------------------------------------------------

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface DeviceMapping {
  intendedFor: string[];
  playableOn: string[];
}

function mapDevice(deviceRaw: string): DeviceMapping {
  const d = deviceRaw.trim();
  const map: Record<string, DeviceMapping> = {
    PC: { intendedFor: ["Win"], playableOn: ["Win"] },
    XBOX: { intendedFor: ["Xbox"], playableOn: ["Xbox"] },
    X360: { intendedFor: ["X360"], playableOn: ["X360"] },
    XONE: { intendedFor: ["XONE"], playableOn: ["XONE"] },
    XSX: { intendedFor: ["XSX"], playableOn: ["XSX"] },
    "XSX/XONE": { intendedFor: ["XONE"], playableOn: ["XONE", "XSX"] },
    "XSX/X360": { intendedFor: ["X360"], playableOn: ["X360", "XSX"] },
    "XSX/XBOX": { intendedFor: ["Xbox"], playableOn: ["Xbox", "X360", "XONE", "XSX"] },
    "XSX/Xbox": { intendedFor: ["Xbox"], playableOn: ["Xbox", "X360", "XONE", "XSX"] },
    "X360/XBOX": { intendedFor: ["Xbox"], playableOn: ["Xbox", "X360"] },
    "X360?/XBOX": { intendedFor: ["Xbox"], playableOn: ["Xbox", "X360"] },
    PS1: { intendedFor: ["PS1"], playableOn: ["PS1"] },
    PS2: { intendedFor: ["PS2"], playableOn: ["PS2"] },
    PS3: { intendedFor: ["PS3"], playableOn: ["PS3"] },
    PS4: { intendedFor: ["PS4"], playableOn: ["PS4"] },
    PS5: { intendedFor: ["PS5"], playableOn: ["PS5"] },
    PSP: { intendedFor: ["PSP"], playableOn: ["PSP"] },
    "PS3/PS1": { intendedFor: ["PS1"], playableOn: ["PS1", "PS3"] },
    "PS3?/PS1": { intendedFor: ["PS1"], playableOn: ["PS1", "PS3"] },
    "PS3/PS1 (PSN)": { intendedFor: ["PS1"], playableOn: ["PS1", "PS3"] },
    "PS5/PS4": { intendedFor: ["PS4"], playableOn: ["PS4", "PS5"] },
    "PS4/PS2 (PSN)": { intendedFor: ["PS2"], playableOn: ["PS2", "PS4"] },
    NES: { intendedFor: ["NES"], playableOn: ["NES"] },
    SNES: { intendedFor: ["SNES"], playableOn: ["SNES"] },
    N64: { intendedFor: ["N64"], playableOn: ["N64"] },
    GC: { intendedFor: ["GC"], playableOn: ["GC"] },
    Wii: { intendedFor: ["Wii"], playableOn: ["Wii"] },
    "Wii U": { intendedFor: ["WiiU"], playableOn: ["WiiU"] },
    "Wii U/Wii": { intendedFor: ["Wii"], playableOn: ["Wii", "WiiU"] },
    "WiiU/Wii": { intendedFor: ["Wii"], playableOn: ["Wii", "WiiU"] },
    Switch: { intendedFor: ["Switch"], playableOn: ["Switch"] },
    GB: { intendedFor: ["GB"], playableOn: ["GB"] },
    GBA: { intendedFor: ["GBA"], playableOn: ["GBA"] },
    "GBA/GB": { intendedFor: ["GB"], playableOn: ["GB", "GBA"] },
    "GBA/GBC": { intendedFor: ["GBC"], playableOn: ["GBC", "GBA"] },
    NDS: { intendedFor: ["NDS"], playableOn: ["NDS"] },
    "3DS/NDS": { intendedFor: ["NDS"], playableOn: ["NDS", "3DS"] },
    "3DS/GB": { intendedFor: ["GB"], playableOn: ["GB", "3DS"] },
    "3DS": { intendedFor: ["3DS"], playableOn: ["3DS"] },
    Android: { intendedFor: ["And"], playableOn: ["And"] },
  };

  const normalized = d.replace(/\s+/g, " ").trim();
  if (map[normalized]) return map[normalized];

  for (const [key, value] of Object.entries(map)) {
    if (key.trim() === normalized) return value;
  }

  const platformName = normalized === "PC" ? "Win" : normalized.replace(/\s+/g, "");
  return { intendedFor: [platformName], playableOn: [platformName] };
}

function mapProvider(storeRaw: string): string {
  const s = storeRaw.trim();
  if (!s) return "Physical";

  if (
    s.startsWith("Diablo") ||
    s.startsWith("Delicious") ||
    s.startsWith("Assassin") ||
    s === "2013" ||
    s === "1998" ||
    s === "2007" ||
    s === "2022" ||
    s === "Serve"
  ) {
    return "Physical";
  }

  const map: Record<string, string> = {
    "-": "Physical",
    Steam: "Steam",
    Epic: "Epic",
    "Epic ": "Epic",
    GOG: "GOG",
    Origin: "Origin",
    Ubisoft: "Ubisoft",
    "Ubisoft ": "Ubisoft",
    Battle: "Battle.net",
    Bethesda: "Bethesda",
    "Rockstar Social Club": "Rockstar Social Club",
    Humble: "Humble",
    "Origin 2": "Origin Alt",
    "Google Play": "Google Play",
  };

  if (map[s]) return map[s];
  return "Physical";
}

function inferEditionType(gameTitle: string, collectionTitle: string): string {
  const combined = `${collectionTitle} ${gameTitle}`.toLowerCase();
  if (combined.includes("demake") || combined.includes("(demake)")) {
    return "Demake";
  }
  if (combined.includes("(hd)") || combined.includes("remastered") || combined.includes("remaster")) {
    return "Remaster";
  }
  if (
    combined.includes("definitive edition") ||
    combined.includes("enhanced edition") ||
    combined.includes("game of the year") ||
    combined.includes("goty") ||
    combined.includes("ultimate edition") ||
    combined.includes("complete edition") ||
    combined.includes("anniversary edition")
  ) {
    return "Enhanced";
  }
  if (combined.includes("downsample") || combined.includes("(downsample)")) {
    return "Downsample";
  }
  return "Original";
}

function normalizeGameTitle(title: string): string {
  return title
    .replace(/\s*\(HD\)\s*/gi, "")
    .replace(/\s*\(Demake\)\s*/gi, "")
    .replace(/\s*\(Downsample\)\s*/gi, "")
    .replace(/\s*\(Remastered\)\s*/gi, "")
    .replace(/\s*\(Definitive Edition\)\s*/gi, "")
    .replace(/\s*\(Game of the Year Edition\)\s*/gi, "")
    .replace(/\s*\(GOTY\)\s*/gi, "")
    .replace(/\s*\(Enhanced\)\s*/gi, "")
    .trim();
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// ===========================================================================
// Tests: slug()
// ===========================================================================

describe("slug", () => {
  it("converts basic strings to URL-safe slugs", () => {
    expect(slug("Mario 2D")).toBe("mario-2d");
    expect(slug("2D Platformer")).toBe("2d-platformer");
    expect(slug("PC")).toBe("pc");
    expect(slug("Heroes of Might And Magic")).toBe("heroes-of-might-and-magic");
  });

  it("removes special characters", () => {
    expect(slug("RPG (ARPG)")).toBe("rpg-arpg");
    expect(slug("Shoot 'em up")).toBe("shoot-em-up");
    expect(slug("Hack 'n' Slash")).toBe("hack-n-slash");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slug("-Test-")).toBe("test");
    expect(slug(" Point and click? ")).toBe("point-and-click");
  });

  it("handles Danish characters", () => {
    expect(slug("Brætspil")).toBe("br-tspil");
  });
});

// ===========================================================================
// Tests: mapDevice()
// ===========================================================================

describe("mapDevice", () => {
  describe("single platforms", () => {
    it("maps PC to Win", () => {
      expect(mapDevice("PC")).toEqual({ intendedFor: ["Win"], playableOn: ["Win"] });
    });

    it("maps modern consoles correctly", () => {
      expect(mapDevice("PS5")).toEqual({ intendedFor: ["PS5"], playableOn: ["PS5"] });
      expect(mapDevice("XSX")).toEqual({ intendedFor: ["XSX"], playableOn: ["XSX"] });
      expect(mapDevice("Switch")).toEqual({ intendedFor: ["Switch"], playableOn: ["Switch"] });
    });

    it("maps retro consoles correctly", () => {
      expect(mapDevice("SNES")).toEqual({ intendedFor: ["SNES"], playableOn: ["SNES"] });
      expect(mapDevice("N64")).toEqual({ intendedFor: ["N64"], playableOn: ["N64"] });
      expect(mapDevice("GC")).toEqual({ intendedFor: ["GC"], playableOn: ["GC"] });
    });

    it("maps handhelds correctly", () => {
      expect(mapDevice("GB")).toEqual({ intendedFor: ["GB"], playableOn: ["GB"] });
      expect(mapDevice("GBA")).toEqual({ intendedFor: ["GBA"], playableOn: ["GBA"] });
      expect(mapDevice("3DS")).toEqual({ intendedFor: ["3DS"], playableOn: ["3DS"] });
      expect(mapDevice("PSP")).toEqual({ intendedFor: ["PSP"], playableOn: ["PSP"] });
    });
  });

  describe("backward compatible platforms", () => {
    it("XSX plays XONE games", () => {
      expect(mapDevice("XSX/XONE")).toEqual({
        intendedFor: ["XONE"],
        playableOn: ["XONE", "XSX"],
      });
    });

    it("PS5 plays PS4 games", () => {
      expect(mapDevice("PS5/PS4")).toEqual({
        intendedFor: ["PS4"],
        playableOn: ["PS4", "PS5"],
      });
    });

    it("GBA plays GB/GBC games", () => {
      expect(mapDevice("GBA/GB")).toEqual({
        intendedFor: ["GB"],
        playableOn: ["GB", "GBA"],
      });
      expect(mapDevice("GBA/GBC")).toEqual({
        intendedFor: ["GBC"],
        playableOn: ["GBC", "GBA"],
      });
    });

    it("3DS plays NDS games", () => {
      expect(mapDevice("3DS/NDS")).toEqual({
        intendedFor: ["NDS"],
        playableOn: ["NDS", "3DS"],
      });
    });

    it("WiiU plays Wii games", () => {
      expect(mapDevice("WiiU/Wii")).toEqual({
        intendedFor: ["Wii"],
        playableOn: ["Wii", "WiiU"],
      });
    });

    it("XSX backward-compatible with original Xbox", () => {
      expect(mapDevice("XSX/XBOX")).toEqual({
        intendedFor: ["Xbox"],
        playableOn: ["Xbox", "X360", "XONE", "XSX"],
      });
    });
  });

  describe("PS3 backward compatibility", () => {
    it("PS3 plays PS1 discs", () => {
      expect(mapDevice("PS3/PS1")).toEqual({
        intendedFor: ["PS1"],
        playableOn: ["PS1", "PS3"],
      });
    });

    it("handles PSN variants", () => {
      expect(mapDevice("PS3/PS1 (PSN)")).toEqual({
        intendedFor: ["PS1"],
        playableOn: ["PS1", "PS3"],
      });
    });
  });

  describe("unknown devices fall back to slugified name", () => {
    it("returns the name as-is for unknown devices", () => {
      const result = mapDevice("SomeNewConsole");
      expect(result).toEqual({
        intendedFor: ["SomeNewConsole"],
        playableOn: ["SomeNewConsole"],
      });
    });
  });
});

// ===========================================================================
// Tests: mapProvider()
// ===========================================================================

describe("mapProvider", () => {
  it('maps "-" to Physical', () => {
    expect(mapProvider("-")).toBe("Physical");
  });

  it("maps empty string to Physical", () => {
    expect(mapProvider("")).toBe("Physical");
    expect(mapProvider("  ")).toBe("Physical");
  });

  it("maps digital stores correctly", () => {
    expect(mapProvider("Steam")).toBe("Steam");
    expect(mapProvider("Epic")).toBe("Epic");
    expect(mapProvider("Epic ")).toBe("Epic"); // trailing space
    expect(mapProvider("GOG")).toBe("GOG");
    expect(mapProvider("Origin")).toBe("Origin");
    expect(mapProvider("Ubisoft")).toBe("Ubisoft");
    expect(mapProvider("Ubisoft ")).toBe("Ubisoft");
    expect(mapProvider("Battle")).toBe("Battle.net");
    expect(mapProvider("Bethesda")).toBe("Bethesda");
    expect(mapProvider("Rockstar Social Club")).toBe("Rockstar Social Club");
    expect(mapProvider("Humble")).toBe("Humble");
    expect(mapProvider("Origin 2")).toBe("Origin Alt");
    expect(mapProvider("Google Play")).toBe("Google Play");
  });

  it("handles bad data in store column gracefully", () => {
    expect(mapProvider("Diablo 3 (Console)")).toBe("Physical");
    expect(mapProvider("Delicious! 3?!")).toBe("Physical");
    expect(mapProvider("Assassin's Creed: Odyssey: Season Pass")).toBe("Physical");
    expect(mapProvider("2013")).toBe("Physical");
    expect(mapProvider("Serve")).toBe("Physical");
  });

  it("defaults unknown stores to Physical", () => {
    expect(mapProvider("SomeUnknownStore")).toBe("Physical");
  });
});

// ===========================================================================
// Tests: inferEditionType()
// ===========================================================================

describe("inferEditionType", () => {
  it("detects Demake", () => {
    expect(inferEditionType("Shadowgate (Demake)", "")).toBe("Demake");
    expect(inferEditionType("", "Demake Collection")).toBe("Demake");
  });

  it("detects Remaster / HD", () => {
    expect(inferEditionType("Super Mario Bros. (HD)", "")).toBe("Remaster");
    expect(inferEditionType("Final Fantasy 4 (HD)", "")).toBe("Remaster");
    expect(inferEditionType("", "Remastered Edition")).toBe("Remaster");
  });

  it("detects Enhanced editions", () => {
    expect(inferEditionType("", "Definitive Edition")).toBe("Enhanced");
    expect(inferEditionType("", "Game of the Year Edition")).toBe("Enhanced");
    expect(inferEditionType("", "GOTY")).toBe("Enhanced");
    expect(inferEditionType("", "Ultimate Edition")).toBe("Enhanced");
    expect(inferEditionType("", "Complete Edition")).toBe("Enhanced");
    expect(inferEditionType("", "Anniversary Edition")).toBe("Enhanced");
    expect(inferEditionType("", "Enhanced Edition")).toBe("Enhanced");
  });

  it("detects Downsample", () => {
    expect(inferEditionType("Game (Downsample)", "")).toBe("Downsample");
  });

  it("returns Original for standard games", () => {
    expect(inferEditionType("Tetris", "")).toBe("Original");
    expect(inferEditionType("Mega Man", "Mega Man Legacy Collection")).toBe("Original");
    expect(inferEditionType("", "")).toBe("Original");
  });

  it("combines collection and game title for detection", () => {
    expect(inferEditionType("", "Age of Empires 2: Definitive Edition")).toBe("Enhanced");
    expect(inferEditionType("Normal Game", "Remastered Collection")).toBe("Remaster");
  });
});

// ===========================================================================
// Tests: normalizeGameTitle()
// ===========================================================================

describe("normalizeGameTitle", () => {
  it("removes (HD) suffix", () => {
    expect(normalizeGameTitle("Super Mario Bros. (HD)")).toBe("Super Mario Bros.");
    expect(normalizeGameTitle("The Legend of Zelda (HD)")).toBe("The Legend of Zelda");
  });

  it("removes (Demake) suffix", () => {
    expect(normalizeGameTitle("Shadowgate (Demake)")).toBe("Shadowgate");
  });

  it("removes (GOTY) suffix", () => {
    expect(normalizeGameTitle("The Witcher 3 (GOTY)")).toBe("The Witcher 3");
  });

  it("removes (Definitive Edition)", () => {
    expect(normalizeGameTitle("Age of Empires 2 (Definitive Edition)")).toBe("Age of Empires 2");
  });

  it("handles case-insensitive suffixes", () => {
    expect(normalizeGameTitle("GAME (hd)")).toBe("GAME");
    expect(normalizeGameTitle("GAME (Hd)")).toBe("GAME");
  });

  it("preserves normal titles", () => {
    expect(normalizeGameTitle("Tetris")).toBe("Tetris");
    expect(normalizeGameTitle("Mega Man 2")).toBe("Mega Man 2");
  });
});

// ===========================================================================
// Tests: parseCSVLine()
// ===========================================================================

describe("parseCSVLine", () => {
  it("parses simple CSV lines", () => {
    const result = parseCSVLine("a,b,c,d,e");
    expect(result).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("handles quoted fields with commas", () => {
    const result = parseCSVLine('1,"Mario Kart: Double Dash!!",Game,Full,2003');
    expect(result[1]).toBe("Mario Kart: Double Dash!!");
  });

  it("handles escaped quotes", () => {
    const result = parseCSVLine('1,"He said ""hello""",test');
    expect(result[1]).toBe('He said "hello"');
  });

  it("handles empty fields", () => {
    const result = parseCSVLine("1,,Game,,2003,");
    expect(result).toEqual(["1", "", "Game", "", "2003", ""]);
  });

  it("parses a real data row correctly", () => {
    const line = ",372,Rare Replay,Lunar Jetman,Full,1983,XSX/XONE,-,y,,y,y,Jetman,,NA,NA,Her,,,,,,";
    const result = parseCSVLine(line);
    expect(result.length).toBeGreaterThanOrEqual(21);
    expect(result[1]).toBe("372"); // ID
    expect(result[2]).toBe("Rare Replay"); // Collection
    expect(result[3]).toBe("Lunar Jetman"); // Game
    expect(result[4]).toBe("Full"); // Type
    expect(result[5]).toBe("1983"); // First release
    expect(result[6]).toBe("XSX/XONE"); // Device
    expect(result[7]).toBe("-"); // Store
    expect(result[8]).toBe("y"); // Physical
    expect(result[16]).toBe("Her"); // Place
  });

  it("handles empty rows", () => {
    const result = parseCSVLine(",,,,,,,,,,,,,,,,,,,,,");
    expect(result.every((c) => c === "")).toBe(true);
  });
});

// ===========================================================================
// Integration-style tests: mapping end-to-end
// ===========================================================================

describe("data mapping pipeline", () => {
  it("correctly maps a GOG PC game", () => {
    const deviceMap = mapDevice("PC");
    const provider = mapProvider("GOG");
    const edition = inferEditionType("Akalabeth: World of Doom", "Akalabeth: World of Doom");
    const normalized = normalizeGameTitle("Akalabeth: World of Doom");

    expect(deviceMap.intendedFor).toEqual(["Win"]);
    expect(provider).toBe("GOG");
    expect(edition).toBe("Original");
    expect(normalized).toBe("Akalabeth: World of Doom");
  });

  it("correctly maps a physical backward-compatible console game", () => {
    const deviceMap = mapDevice("XSX/XONE");
    const provider = mapProvider("-");
    const edition = inferEditionType("Lunar Jetman", "Rare Replay");

    expect(deviceMap.intendedFor).toEqual(["XONE"]);
    expect(deviceMap.playableOn).toEqual(["XONE", "XSX"]);
    expect(provider).toBe("Physical");
    expect(edition).toBe("Original");
  });

  it("correctly maps an HD remaster on SNES", () => {
    const deviceMap = mapDevice("SNES");
    const edition = inferEditionType("Super Mario Bros. (HD)", "Super Mario All-Stars");
    const normalized = normalizeGameTitle("Super Mario Bros. (HD)");

    expect(deviceMap.intendedFor).toEqual(["SNES"]);
    expect(edition).toBe("Remaster");
    expect(normalized).toBe("Super Mario Bros.");
  });

  it("correctly maps a DLC expansion", () => {
    const edition = inferEditionType("Diablo 2: Lord of Destruction", "Diablo 2 + Expansion Set");
    const normalized = normalizeGameTitle("Diablo 2: Lord of Destruction");

    expect(edition).toBe("Original");
    expect(normalized).toBe("Diablo 2: Lord of Destruction");
  });

  it("correctly maps a Definitive Edition game", () => {
    const edition = inferEditionType("", "Shadow of the Tomb Raider: Definitive Edition");
    expect(edition).toBe("Enhanced");
  });
});

// ===========================================================================
// Edge case tests from real data
// ===========================================================================

describe("real data edge cases", () => {
  it("handles games with '?' in device column", () => {
    const result = mapDevice("PS3?/PS1");
    expect(result.intendedFor).toEqual(["PS1"]);
    expect(result.playableOn).toEqual(["PS1", "PS3"]);
  });

  it("handles Wii U with space", () => {
    const result = mapDevice("Wii U");
    expect(result.intendedFor).toEqual(["WiiU"]);
    expect(result.playableOn).toEqual(["WiiU"]);
  });

  it("handles genre names with inconsistent capitalization", () => {
    // Genre names from the sheet: "RPG (CRPG)", "Rpg (Crpg)", "3D platformer", "3D Platformer"
    // We normalize by using the cleaned name as-is from the sheet
    // The duplicate detection happens at DB insert time via unique slug
    expect(slug("3D Platformer")).toBe("3d-platformer");
    expect(slug("3D platformer")).toBe("3d-platformer");
    expect(slug("3d platformer")).toBe("3d-platformer");
    // Same slug = same genre, which is correct
  });

  it("handles genre names with question marks", () => {
    // "Point and click?" → clean to "Point and click"
    expect(slug("Point and click?")).toBe("point-and-click");
    expect(slug("Point and click")).toBe("point-and-click");
  });

  it("handles Trailing spaces in store names", () => {
    expect(mapProvider("Epic ")).toBe("Epic");
    expect(mapProvider("Ubisoft ")).toBe("Ubisoft");
    expect(mapProvider("Epic")).toBe("Epic");
    expect(mapProvider("Ubisoft")).toBe("Ubisoft");
  });

  it("normalizes 'XSX/Xbox' (mixed case)", () => {
    const result = mapDevice("XSX/Xbox");
    expect(result).toEqual({
      intendedFor: ["Xbox"],
      playableOn: ["Xbox", "X360", "XONE", "XSX"],
    });
  });
});
