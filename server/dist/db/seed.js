import "dotenv/config";
import { db } from "./index.js";
import * as s from "./schema.js";
import { sql } from "drizzle-orm";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slug(input) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
// Map systemEnum values to the slug used in the platforms table
function systemSlug(system) {
    const map = {
        windows: "Win",
        sd: "SD",
        xbox: "Xbox",
        x360: "X360",
        xone: "XONE",
        xonex: "XONEX",
        xss: "XSS",
        xsx: "XSX",
        ps: "PS1",
        ps2: "PS2",
        ps3: "PS3",
        ps4: "PS4",
        ps5: "PS5",
        ps5d: "PS5D",
        psp: "PSP",
        psVita: "PSVita",
        nes: "NES",
        snes: "SNES",
        n64: "N64",
        gc: "GC",
        wii: "Wii",
        wiiU: "WiiU",
        switch: "Switch",
        gb: "GB",
        gbc: "GBC",
        gba: "GBA",
        ds: "NDS",
        _3ds: "3DS",
        android: "And",
        iOS: "iOS",
        linux: "Linux",
        macOs: "macOS",
    };
    return map[system] ?? system;
}
function unsureBoolString(val) {
    const map = {
        yes: "Yes",
        no: "No",
        maybe: "Maybe",
        notApplicable: "Not applicable",
    };
    return map[val] ?? val;
}
// Provider enum value to DB provider name (matches provider insert order below)
function providerName(val) {
    const map = {
        physical: "Physical",
        steam: "Steam",
        epic: "Epic",
        gog: "GOG",
        origin: "Origin",
        origin2: "Origin Alt",
        ubisoft: "Ubisoft",
        humbleBundle: "Humble",
        rockstarSocialClub: "Rockstar Social Club",
        xboxLive: "Xbox Live",
        psn: "PSN",
        nintendoEshop: "Nintendo eShop",
    };
    return map[val] ?? val;
}
// Provider name -> DB id
const providerLookup = {
    Physical: 1,
    Steam: 2,
    Epic: 3,
    GOG: 4,
    Origin: 5,
    "Origin Alt": 6,
    Ubisoft: 7,
    Humble: 8,
    "Rockstar Social Club": 9,
    "Xbox Live": 10,
    PSN: 11,
    "Nintendo eShop": 12,
};
// Edition type name -> DB id (matches editionTypes insert order)
const editionTypeLookup = {
    Original: 1,
    Remaster: 2,
    Remake: 3,
    Enhanced: 4,
    Downsample: 5,
    Demake: 6,
};
// Media format name -> DB id
const mediaFormatLookup = {
    "N/A": 1,
    Digital: 2,
    DVD: 3,
    CD: 4,
    "Blu-ray": 5,
};
async function main() {
    console.log("[Seed] Connecting to database and clearing existing data...");
    // -----------------------------------------------------------------------
    // Clear all existing data in FK-safe order
    // -----------------------------------------------------------------------
    await db.delete(s.collectionDlcReleases);
    await db.delete(s.collectionReleases);
    await db.delete(s.dlcReleaseCompatibility);
    await db.delete(s.dlcReleases);
    await db.delete(s.dlcs);
    await db.delete(s.releases);
    await db.delete(s.releaseGroups);
    await db.delete(s.masterGameGenres);
    await db.delete(s.masterGames);
    await db.delete(s.userFavorites);
    await db.delete(s.userGamePhotos);
    await db.delete(s.ownedInstances);
    await db.delete(s.refreshTokens);
    await db.delete(s.collections);
    await db.delete(s.users);
    await db.delete(s.series);
    await db.delete(s.editionTypes);
    await db.delete(s.genres);
    await db.delete(s.providers);
    await db.delete(s.platforms);
    await db.delete(s.mediaFormats);
    // -----------------------------------------------------------------------
    // 1. Lookup tables
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting lookup data...");
    await db.insert(s.platforms).values([
        { id: 1, name: "Win", slug: slug("Win") },
        { id: 2, name: "SD", slug: slug("SD") },
        { id: 3, name: "Xbox", slug: slug("Xbox") },
        { id: 4, name: "X360", slug: slug("X360") },
        { id: 5, name: "XONE", slug: slug("XONE") },
        { id: 6, name: "XONEX", slug: slug("XONEX") },
        { id: 7, name: "XSS", slug: slug("XSS") },
        { id: 8, name: "XSX", slug: slug("XSX") },
        { id: 9, name: "PS1", slug: slug("PS1") },
        { id: 10, name: "PS2", slug: slug("PS2") },
        { id: 11, name: "PS3", slug: slug("PS3") },
        { id: 12, name: "PS4", slug: slug("PS4") },
        { id: 13, name: "PS5", slug: slug("PS5") },
        { id: 14, name: "PS5D", slug: slug("PS5D") },
        { id: 15, name: "PSP", slug: slug("PSP") },
        { id: 16, name: "PSVita", slug: slug("PSVita") },
        { id: 17, name: "NES", slug: slug("NES") },
        { id: 18, name: "SNES", slug: slug("SNES") },
        { id: 19, name: "N64", slug: slug("N64") },
        { id: 20, name: "GC", slug: slug("GC") },
        { id: 21, name: "Wii", slug: slug("Wii") },
        { id: 22, name: "WiiU", slug: slug("WiiU") },
        { id: 23, name: "Switch", slug: slug("Switch") },
        { id: 24, name: "GB", slug: slug("GB") },
        { id: 25, name: "GBC", slug: slug("GBC") },
        { id: 26, name: "GBA", slug: slug("GBA") },
        { id: 27, name: "NDS", slug: slug("NDS") },
        { id: 28, name: "3DS", slug: slug("3DS") },
        { id: 29, name: "And", slug: slug("And") },
        { id: 30, name: "iOS", slug: slug("iOS") },
        { id: 31, name: "Linux", slug: slug("Linux") },
        { id: 32, name: "macOS", slug: slug("macOS") },
    ]);
    await db.insert(s.providers).values([
        { id: 1, name: "Physical", slug: slug("Physical") },
        { id: 2, name: "Steam", slug: slug("Steam") },
        { id: 3, name: "Epic", slug: slug("Epic") },
        { id: 4, name: "GOG", slug: slug("GOG") },
        { id: 5, name: "Origin", slug: slug("Origin") },
        { id: 6, name: "Origin Alt", slug: slug("Origin Alt") },
        { id: 7, name: "Ubisoft", slug: slug("Ubisoft") },
        { id: 8, name: "Humble", slug: slug("Humble") },
        { id: 9, name: "Rockstar Social Club", slug: slug("Rockstar Social Club") },
        { id: 10, name: "Xbox Live", slug: slug("Xbox Live") },
        { id: 11, name: "PSN", slug: slug("PSN") },
        { id: 12, name: "Nintendo eShop", slug: slug("Nintendo eShop") },
    ]);
    await db.insert(s.genres).values([
        { id: 1, name: "Undefined", slug: slug("Undefined") },
        { id: 2, name: "RTS", slug: slug("RTS") },
        { id: 3, name: "RPG", slug: slug("RPG") },
        { id: 4, name: "JRPG", slug: slug("JRPG") },
        { id: 5, name: "Karting", slug: slug("Karting") },
        { id: 6, name: "2D Platformer", slug: slug("2D Platformer") },
        { id: 7, name: "3D Platformer", slug: slug("3D Platformer") },
        { id: 8, name: "FPS", slug: slug("FPS") },
        { id: 9, name: "Stealth", slug: slug("Stealth") },
        { id: 10, name: "TBS", slug: slug("TBS") },
        { id: 11, name: "Open World", slug: slug("Open World") },
    ]);
    await db.insert(s.editionTypes).values([
        { id: 1, name: "Original", slug: slug("Original") },
        { id: 2, name: "Remaster", slug: slug("Remaster") },
        { id: 3, name: "Remake", slug: slug("Remake") },
        { id: 4, name: "Enhanced", slug: slug("Enhanced") },
        { id: 5, name: "Downsample", slug: slug("Downsample") },
        { id: 6, name: "Demake", slug: slug("Demake") },
    ]);
    await db.insert(s.mediaFormats).values([
        { id: 1, name: "N/A", slug: slug("N/A") },
        { id: 2, name: "Digital", slug: slug("Digital") },
        { id: 3, name: "DVD", slug: slug("DVD") },
        { id: 4, name: "CD", slug: slug("CD") },
        { id: 5, name: "Blu-ray", slug: slug("Blu-ray") },
    ]);
    // -----------------------------------------------------------------------
    // 2. Series
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting series...");
    await db.insert(s.series).values([
        { id: 1, name: "None", slug: slug("None") },
        { id: 2, name: "Warcraft", slug: slug("Warcraft") },
        { id: 3, name: "Metal Gear Solid", slug: slug("Metal Gear Solid") },
        { id: 4, name: "Heroes of Might And Magic", slug: slug("Heroes of Might And Magic") },
        { id: 5, name: "Half-Life", slug: slug("Half-Life") },
        { id: 6, name: "Portal", slug: slug("Portal") },
        { id: 7, name: "Team Fortress", slug: slug("Team Fortress") },
        { id: 8, name: "Age of Empires", slug: slug("Age of Empires") },
        { id: 9, name: "Red Dead", slug: slug("Red Dead") },
        { id: 10, name: "The Witcher", slug: slug("The Witcher") },
    ]);
    // -----------------------------------------------------------------------
    // 3. Master Games
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting master games...");
    await db.insert(s.masterGames).values([
        {
            id: 1,
            title: "Warcraft 3: Reign of Chaos",
            slug: slug("Warcraft 3: Reign of Chaos"),
            firstReleaseYear: 2002,
            seriesId: 2, // Warcraft
            alternativeTitles: [],
        },
        {
            id: 2,
            title: "Heroes of Might and Magic",
            slug: slug("Heroes of Might and Magic"),
            firstReleaseYear: 1995,
            seriesId: 4, // Heroes
            alternativeTitles: [],
        },
        {
            id: 3,
            title: "Heroes of Might and Magic 2",
            slug: slug("Heroes of Might and Magic 2"),
            firstReleaseYear: 1996,
            seriesId: 4,
            alternativeTitles: [],
        },
        {
            id: 4,
            title: "Heroes of Might and Magic 3",
            slug: slug("Heroes of Might and Magic 3"),
            firstReleaseYear: 1999,
            seriesId: 4,
            alternativeTitles: [],
        },
        {
            id: 5,
            title: "Heroes of Might and Magic 4",
            slug: slug("Heroes of Might and Magic 4"),
            firstReleaseYear: 2002,
            seriesId: 4,
            alternativeTitles: [],
        },
        {
            id: 6,
            title: "Half-Life 2",
            slug: slug("Half-Life 2"),
            firstReleaseYear: 2004,
            seriesId: 5, // Half-Life
            alternativeTitles: [],
        },
        {
            id: 7,
            title: "Half-Life 2: Episode One",
            slug: slug("Half-Life 2: Episode One"),
            firstReleaseYear: 2006,
            seriesId: 5,
            alternativeTitles: [],
        },
        {
            id: 8,
            title: "Half-Life 2: Episode Two",
            slug: slug("Half-Life 2: Episode Two"),
            firstReleaseYear: 2007,
            seriesId: 5,
            alternativeTitles: [],
        },
        {
            id: 9,
            title: "Portal",
            slug: slug("Portal"),
            firstReleaseYear: 2007,
            seriesId: 6,
            alternativeTitles: [],
        },
        {
            id: 10,
            title: "Team Fortress 2",
            slug: slug("Team Fortress 2"),
            firstReleaseYear: 2007,
            seriesId: 7,
            alternativeTitles: [],
        },
        {
            id: 11,
            title: "Metal Gear Solid",
            slug: slug("Metal Gear Solid"),
            firstReleaseYear: 1998,
            seriesId: 3,
            alternativeTitles: [],
        },
        {
            id: 12,
            title: "Metal Gear Solid 2: Sons of Liberty",
            slug: slug("Metal Gear Solid 2: Sons of Liberty"),
            firstReleaseYear: 2001,
            seriesId: 3,
            alternativeTitles: [],
        },
        {
            id: 13,
            title: "Metal Gear Solid 3: Snake Eater",
            slug: slug("Metal Gear Solid 3: Snake Eater"),
            firstReleaseYear: 2004,
            seriesId: 3,
            alternativeTitles: [],
        },
        {
            id: 14,
            title: "Metal Gear Solid 4: Guns of the Patriots",
            slug: slug("Metal Gear Solid 4: Guns of the Patriots"),
            firstReleaseYear: 2008,
            seriesId: 3,
            alternativeTitles: [],
        },
        {
            id: 15,
            title: "Age of Empires II: The Age of Kings",
            slug: slug("Age of Empires II: The Age of Kings"),
            firstReleaseYear: 1999,
            seriesId: 8,
            alternativeTitles: [],
        },
        {
            id: 16,
            title: "Indigo Prophecy",
            slug: slug("Indigo Prophecy"),
            firstReleaseYear: 2005,
            seriesId: 1, // None
            alternativeTitles: ["Fahrenheit"],
        },
        {
            id: 17,
            title: "Red Dead Redemption",
            slug: slug("Red Dead Redemption"),
            firstReleaseYear: 2010,
            seriesId: 9,
            alternativeTitles: [],
        },
        {
            id: 18,
            title: "Red Dead Redemption: Undead Nightmare",
            slug: slug("Red Dead Redemption: Undead Nightmare"),
            firstReleaseYear: 2010,
            seriesId: 9,
            alternativeTitles: [],
        },
        {
            id: 19,
            title: "The Witcher 3: Wild Hunt",
            slug: slug("The Witcher 3: Wild Hunt"),
            firstReleaseYear: 2015,
            seriesId: 10,
            alternativeTitles: [],
        },
    ]);
    // Master Game <-> Genre junction
    await db.insert(s.masterGameGenres).values([
        { gameId: 1, genreId: 2 }, // Warcraft 3 → RTS
        { gameId: 2, genreId: 3 }, // HoMM → RPG
        { gameId: 3, genreId: 3 }, // HoMM2 → RPG
        { gameId: 4, genreId: 3 }, // HoMM3 → RPG
        { gameId: 5, genreId: 3 }, // HoMM4 → RPG
        { gameId: 6, genreId: 8 }, // HL2 → FPS
        { gameId: 7, genreId: 8 }, // HL2:E1 → FPS
        { gameId: 8, genreId: 8 }, // HL2:E2 → FPS
        { gameId: 9, genreId: 8 }, // Portal → FPS
        { gameId: 10, genreId: 8 }, // TF2 → FPS
        { gameId: 11, genreId: 9 }, // MGS → Stealth
        { gameId: 12, genreId: 9 }, // MGS2 → Stealth
        { gameId: 13, genreId: 9 }, // MGS3 → Stealth
        { gameId: 14, genreId: 9 }, // MGS4 → Stealth
        { gameId: 15, genreId: 2 }, // AoE2 → RTS
        { gameId: 16, genreId: 1 }, // Indigo Prophecy → Undefined
        { gameId: 17, genreId: 11 }, // RDR → Open World
        { gameId: 18, genreId: 11 }, // RDR:UN → Open World
        { gameId: 19, genreId: 11 }, // TW3 → Open World
    ]);
    // -----------------------------------------------------------------------
    // 4. Release Groups (mapped from SuperVersion data)
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting release groups...");
    await db.insert(s.releaseGroups).values([
        { id: 1, masterGameId: 1, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_warcraft3
        { id: 2, masterGameId: 2, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_heroes
        { id: 3, masterGameId: 3, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_heroes2
        { id: 4, masterGameId: 4, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_heroes3
        { id: 5, masterGameId: 5, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_heroes4
        { id: 6, masterGameId: 6, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_halfLife2
        { id: 7, masterGameId: 7, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_halfLife2E1
        { id: 8, masterGameId: 8, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_halfLife2E2
        { id: 9, masterGameId: 9, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_portal
        { id: 10, masterGameId: 10, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_tf2
        { id: 11, masterGameId: 13, editionTypeId: 5, editionName: null, releaseYear: 2012 }, // sv_downsample_mgs3
        { id: 12, masterGameId: 12, editionTypeId: 2, editionName: null, releaseYear: 2011 }, // sv_remaster_mgs2
        { id: 13, masterGameId: 13, editionTypeId: 2, editionName: null, releaseYear: 2011 }, // sv_remaster_mgs3
        { id: 14, masterGameId: 14, editionTypeId: 1, editionName: null, releaseYear: null }, // sv_original_mgs4
        { id: 15, masterGameId: 15, editionTypeId: 1, editionName: null, releaseYear: 1999 }, // sv_original_aoe2
        { id: 16, masterGameId: 15, editionTypeId: 2, editionName: "HD Edition", releaseYear: 2012 }, // sv_remaster2012_aoe2
        { id: 17, masterGameId: 15, editionTypeId: 2, editionName: "Definitive Edition", releaseYear: 2017 }, // sv_remaster2017_aoe2
        { id: 18, masterGameId: 16, editionTypeId: 1, editionName: null, releaseYear: 2005 }, // sv_original_indigo
        { id: 19, masterGameId: 16, editionTypeId: 4, editionName: null, releaseYear: 2007 }, // sv_enhanced_indigo
        { id: 20, masterGameId: 16, editionTypeId: 2, editionName: null, releaseYear: 2015 }, // sv_remastered_indigo
        { id: 21, masterGameId: 17, editionTypeId: 1, editionName: null, releaseYear: 2010 }, // sv_original_rdr
        { id: 22, masterGameId: 17, editionTypeId: 4, editionName: null, releaseYear: 2016 }, // sv_enhanced2016_rdr
        { id: 23, masterGameId: 17, editionTypeId: 4, editionName: null, releaseYear: 2018 }, // sv_enhanced2018_rdr
        { id: 24, masterGameId: 18, editionTypeId: 1, editionName: null, releaseYear: 2010 }, // sv_original_rdrun
        { id: 25, masterGameId: 18, editionTypeId: 4, editionName: null, releaseYear: 2016 }, // sv_enhanced2016_rdrun
        { id: 26, masterGameId: 18, editionTypeId: 4, editionName: null, releaseYear: 2018 }, // sv_enhanced2018_rdrun
        { id: 27, masterGameId: 19, editionTypeId: 1, editionName: null, releaseYear: 2015 }, // sv_original_tw3
        { id: 28, masterGameId: 19, editionTypeId: 4, editionName: null, releaseYear: 2022 }, // sv_enhanced_tw3
    ]);
    // -----------------------------------------------------------------------
    // 5. Releases (mapped from GameVersion data)
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting releases...");
    await db.insert(s.releases).values([
        {
            id: 1,
            releaseGroupId: 1,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["CD"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("no"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 2,
            releaseGroupId: 2,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("no"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 3,
            releaseGroupId: 3,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("no"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 4,
            releaseGroupId: 4,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("no"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 5,
            releaseGroupId: 4,
            title: null,
            providerId: providerLookup["GOG"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("no"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 6,
            releaseGroupId: 5,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("no"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 7,
            releaseGroupId: 6,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows"), systemSlug("sd")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 8,
            releaseGroupId: 7,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows"), systemSlug("sd")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 9,
            releaseGroupId: 8,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows"), systemSlug("sd")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 10,
            releaseGroupId: 9,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows"), systemSlug("sd")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 11,
            releaseGroupId: 10,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows"), systemSlug("sd")],
            controllerSupport: unsureBoolString("maybe"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 12,
            releaseGroupId: 11,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("_3ds")],
            playableOn: [systemSlug("_3ds")],
            controllerSupport: unsureBoolString("notApplicable"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 13,
            releaseGroupId: 12,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("ps3")],
            playableOn: [systemSlug("ps3")],
            controllerSupport: unsureBoolString("notApplicable"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 14,
            releaseGroupId: 13,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("ps3")],
            playableOn: [systemSlug("ps3")],
            controllerSupport: unsureBoolString("notApplicable"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 15,
            releaseGroupId: 14,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("ps3")],
            playableOn: [systemSlug("ps3")],
            controllerSupport: unsureBoolString("notApplicable"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 16,
            releaseGroupId: 15,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("notApplicable"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 17,
            releaseGroupId: 16,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("notApplicable"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 18,
            releaseGroupId: 17,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("notApplicable"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 19,
            releaseGroupId: 18,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 20,
            releaseGroupId: 18,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("ps2")],
            playableOn: [systemSlug("ps2")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 21,
            releaseGroupId: 18,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("xbox")],
            playableOn: [systemSlug("xbox")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 22,
            releaseGroupId: 19,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("x360")],
            playableOn: [systemSlug("x360")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 23,
            releaseGroupId: 19,
            title: null,
            providerId: providerLookup["Xbox Live"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("x360")],
            playableOn: [systemSlug("x360")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 24,
            releaseGroupId: 20,
            title: null,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows"), systemSlug("linux"), systemSlug("macOs")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 25,
            releaseGroupId: 20,
            title: null,
            providerId: providerLookup["PSN"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("ps4")],
            playableOn: [systemSlug("ps4"), systemSlug("ps5")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 26,
            releaseGroupId: 20,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("ps4")],
            playableOn: [systemSlug("ps4"), systemSlug("ps5")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 27,
            releaseGroupId: 21,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("x360")],
            playableOn: [systemSlug("x360")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 28,
            releaseGroupId: 22,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("x360")],
            playableOn: [systemSlug("xone")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 29,
            releaseGroupId: 23,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("x360")],
            playableOn: [systemSlug("xonex"), systemSlug("xsx")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 30,
            releaseGroupId: 24,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("x360")],
            playableOn: [systemSlug("x360")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 31,
            releaseGroupId: 25,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("x360")],
            playableOn: [systemSlug("xone")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 32,
            releaseGroupId: 26,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("x360")],
            playableOn: [systemSlug("xonex"), systemSlug("xsx")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 33,
            releaseGroupId: 27,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("xone")],
            playableOn: [systemSlug("xone"), systemSlug("xsx")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 34,
            releaseGroupId: 27,
            title: null,
            providerId: providerLookup["Xbox Live"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("xone")],
            playableOn: [systemSlug("xone"), systemSlug("xsx"), systemSlug("xss")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 35,
            releaseGroupId: 28,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("xsx")],
            playableOn: [systemSlug("xsx")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 36,
            releaseGroupId: 28,
            title: null,
            providerId: providerLookup["Xbox Live"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("xsx"), systemSlug("xss")],
            playableOn: [systemSlug("xsx"), systemSlug("xss")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 37,
            releaseGroupId: 27,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("xone")],
            playableOn: [systemSlug("xone"), systemSlug("xsx")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 38,
            releaseGroupId: 27,
            title: null,
            providerId: providerLookup["Xbox Live"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("xone")],
            playableOn: [systemSlug("xone"), systemSlug("xsx"), systemSlug("xss")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 39,
            releaseGroupId: 28,
            title: null,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            intendedFor: [systemSlug("xsx")],
            playableOn: [systemSlug("xsx")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 40,
            releaseGroupId: 28,
            title: null,
            providerId: providerLookup["Xbox Live"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("xsx"), systemSlug("xss")],
            playableOn: [systemSlug("xsx"), systemSlug("xss")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 41,
            releaseGroupId: 28,
            title: null,
            providerId: providerLookup["GOG"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
        {
            id: 42,
            releaseGroupId: 28,
            title: null,
            providerId: providerLookup["GOG"],
            mediaFormatId: mediaFormatLookup["Digital"],
            intendedFor: [systemSlug("windows")],
            playableOn: [systemSlug("windows")],
            controllerSupport: unsureBoolString("yes"),
            localMultiplayer: unsureBoolString("no"),
            onlineMultiplayer: unsureBoolString("no"),
        },
    ]);
    // -----------------------------------------------------------------------
    // 6. DLCs
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting DLCs...");
    await db.insert(s.dlcs).values([
        { id: 1, title: "The Price of Loyalty", firstReleaseYear: 1997, dlcType: "Expansion", masterGameId: 3 }, // HoMM2
        { id: 2, title: "Armageddon's Blade", firstReleaseYear: 1999, dlcType: "Expansion", masterGameId: 4 }, // HoMM3
        { id: 3, title: "The Shadow of Death", firstReleaseYear: 2000, dlcType: "Expansion", masterGameId: 4 }, // HoMM3
        { id: 4, title: "The Gathering Storm", firstReleaseYear: 2002, dlcType: "Expansion", masterGameId: 5 }, // HoMM4
        { id: 5, title: "Winds of War", firstReleaseYear: 2003, dlcType: "Expansion", masterGameId: 5 }, // HoMM4
        { id: 6, title: "The Conquerors", firstReleaseYear: 2000, dlcType: "Expansion", masterGameId: 15 }, // AoE2
        { id: 7, title: "The Forgotten", firstReleaseYear: 2013, dlcType: "Expansion", masterGameId: 15 }, // AoE2
        { id: 8, title: "The African Kingdoms", firstReleaseYear: 2015, dlcType: "Expansion", masterGameId: 15 }, // AoE2
        { id: 9, title: "Rise of the Rajas", firstReleaseYear: 2016, dlcType: "Expansion", masterGameId: 15 }, // AoE2
        { id: 10, title: "Lords of the West", firstReleaseYear: 2021, dlcType: "Expansion", masterGameId: 15 }, // AoE2
        { id: 11, title: "Dawn of the Dukes", firstReleaseYear: 2021, dlcType: "Expansion", masterGameId: 15 }, // AoE2
        { id: 12, title: "Dynasties of India", firstReleaseYear: 2022, dlcType: "Expansion", masterGameId: 15 }, // AoE2
        { id: 13, title: "Undead Nightmare", firstReleaseYear: 2010, dlcType: "Expansion", masterGameId: 17 }, // RDR
        { id: 14, title: "Hearts of Stone", firstReleaseYear: 2015, dlcType: "Expansion", masterGameId: 19 }, // TW3
        { id: 15, title: "Blood and Wine", firstReleaseYear: 2016, dlcType: "Expansion", masterGameId: 19 }, // TW3
    ]);
    // -----------------------------------------------------------------------
    // 7. DLC Releases (mapped from DlcVersion data)
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting DLC releases...");
    await db.insert(s.dlcReleases).values([
        // dv_HoMM2_PriceOfLoyalty → compatible with gv 2 (release 3, Physical)
        {
            id: 1,
            dlcId: 1,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_HoMM3_ArmageddonsBlade_phys → gv 3 (release 4, Physical)
        {
            id: 2,
            dlcId: 2,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_HoMM3_ShadowOfDeath_phys → gv 3 (release 4, Physical)
        {
            id: 3,
            dlcId: 3,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_HoMM3_ArmageddonsBlade_gog → gv 4 (release 5, GOG)
        {
            id: 4,
            dlcId: 2,
            providerId: providerLookup["GOG"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_HoMM3_ShadowOfDeath_gog → gv 4 (release 5, GOG)
        {
            id: 5,
            dlcId: 3,
            providerId: providerLookup["GOG"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_HoMM4_GatheringStorm → gv 5 (release 6, Physical)
        {
            id: 6,
            dlcId: 4,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_HoMM4_WindsOfWar → gv 5 (release 6, Physical)
        {
            id: 7,
            dlcId: 5,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_Conquerors_original_steam → gv 15 (release 16, Steam)
        {
            id: 8,
            dlcId: 6,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_Conquerors_HD → gv 16 (release 17, Steam)
        {
            id: 9,
            dlcId: 6,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_Forgotten_HD → gv 16 (release 17, Steam)
        {
            id: 10,
            dlcId: 7,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_AfricanKingdoms_HD → gv 16 (release 17, Steam)
        {
            id: 11,
            dlcId: 8,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_RiseOfRajas_HD → gv 16 (release 17, Steam)
        {
            id: 12,
            dlcId: 9,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_Conquerors_DE → gv 17 (release 18, Steam)
        {
            id: 13,
            dlcId: 6,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_Forgotten_DE → gv 17 (release 18, Steam)
        {
            id: 14,
            dlcId: 7,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_AfricanKingdoms_DE → gv 17 (release 18, Steam)
        {
            id: 15,
            dlcId: 8,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_RiseOfRajas_DE → gv 17 (release 18, Steam)
        {
            id: 16,
            dlcId: 9,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_LordsOfWest_DE → gv 17 (release 18, Steam)
        {
            id: 17,
            dlcId: 10,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_DawnOfDukes_DE → gv 17 (release 18, Steam)
        {
            id: 18,
            dlcId: 11,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_AoE2_DynastiesOfIndia_DE → gv 17 (release 18, Steam)
        {
            id: 19,
            dlcId: 12,
            providerId: providerLookup["Steam"],
            mediaFormatId: mediaFormatLookup["Digital"],
            onDiscForConsoleOnly: false,
        },
        // dv_RDR_UndeadNightmare → gv 26 (release 27, Physical)
        {
            id: 20,
            dlcId: 13,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_TW3_HeartsOfStone_XONE_orig → gv 32,33 (releases 33,34, Physical first)
        {
            id: 21,
            dlcId: 14,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_TW3_BloodAndWine_XONE_orig → gv 32,33 (releases 33,34)
        {
            id: 22,
            dlcId: 15,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_TW3_HeartsOfStone_XONE_GOTY → gv 36,37 (releases 37,38, Physical first, onDisc)
        {
            id: 23,
            dlcId: 14,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: true,
        },
        // dv_TW3_BloodAndWine_XONE_GOTY → gv 36,37 (onDisc)
        {
            id: 24,
            dlcId: 15,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: true,
        },
        // dv_TW3_HeartsOfStone_XSX_Enhanced → gv 34,35 (releases 35,36, Physical first)
        {
            id: 25,
            dlcId: 14,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_TW3_BloodAndWine_XSX_Enhanced → gv 34,35
        {
            id: 26,
            dlcId: 15,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: false,
        },
        // dv_TW3_HeartsOfStone_XSX_GOTY → gv 38,39 (releases 39,40, onDisc)
        {
            id: 27,
            dlcId: 14,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: true,
        },
        // dv_TW3_BloodAndWine_XSX_GOTY → gv 38,39 (onDisc)
        {
            id: 28,
            dlcId: 15,
            providerId: providerLookup["Physical"],
            mediaFormatId: mediaFormatLookup["N/A"],
            onDiscForConsoleOnly: true,
        },
    ]);
    // -----------------------------------------------------------------------
    // 8. DLC Release Compatibility
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting DLC release compatibility...");
    await db.insert(s.dlcReleaseCompatibility).values([
        // dv_HoMM2_PriceOfLoyalty → gv_PC_physical_original_heroesOfMightAndMagic2 (release 3)
        { dlcReleaseId: 1, releaseId: 3 },
        // dv_HoMM3_ArmageddonsBlade_phys → gv_PC_physical_original_heroesOfMightAndMagic3 (release 4)
        { dlcReleaseId: 2, releaseId: 4 },
        // dv_HoMM3_ShadowOfDeath_phys → release 4
        { dlcReleaseId: 3, releaseId: 4 },
        // dv_HoMM3_ArmageddonsBlade_gog → gv_PC_gog_original_heroesOfMightAndMagic3 (release 5)
        { dlcReleaseId: 4, releaseId: 5 },
        // dv_HoMM3_ShadowOfDeath_gog → release 5
        { dlcReleaseId: 5, releaseId: 5 },
        // dv_HoMM4_GatheringStorm → gv_PC_physical_original_heroesOfMightAndMagic4 (release 6)
        { dlcReleaseId: 6, releaseId: 6 },
        // dv_HoMM4_WindsOfWar → release 6
        { dlcReleaseId: 7, releaseId: 6 },
        // dv_AoE2_Conquerors_original_steam → gv_PC_steam_original_ageOfEmpires2 (release 16)
        { dlcReleaseId: 8, releaseId: 16 },
        // dv_AoE2_Conquerors_HD → gv_PC_steam_remaster1_ageOfEmpires2 (release 17)
        { dlcReleaseId: 9, releaseId: 17 },
        // dv_AoE2_Forgotten_HD → release 17
        { dlcReleaseId: 10, releaseId: 17 },
        // dv_AoE2_AfricanKingdoms_HD → release 17
        { dlcReleaseId: 11, releaseId: 17 },
        // dv_AoE2_RiseOfRajas_HD → release 17
        { dlcReleaseId: 12, releaseId: 17 },
        // dv_AoE2_Conquerors_DE → gv_PC_steam_remaster2_ageOfEmpires2 (release 18)
        { dlcReleaseId: 13, releaseId: 18 },
        // dv_AoE2_Forgotten_DE → release 18
        { dlcReleaseId: 14, releaseId: 18 },
        // dv_AoE2_AfricanKingdoms_DE → release 18
        { dlcReleaseId: 15, releaseId: 18 },
        // dv_AoE2_RiseOfRajas_DE → release 18
        { dlcReleaseId: 16, releaseId: 18 },
        // dv_AoE2_LordsOfWest_DE → release 18
        { dlcReleaseId: 17, releaseId: 18 },
        // dv_AoE2_DawnOfDukes_DE → release 18
        { dlcReleaseId: 18, releaseId: 18 },
        // dv_AoE2_DynastiesOfIndia_DE → release 18
        { dlcReleaseId: 19, releaseId: 18 },
        // dv_RDR_UndeadNightmare → gv_X360_physical_original_redDeadRedemption (release 27)
        { dlcReleaseId: 20, releaseId: 27 },
        // dv_TW3_HeartsOfStone_XONE_orig → gv 32 (release 33, physical) + gv 33 (release 34, digital)
        { dlcReleaseId: 21, releaseId: 33 },
        { dlcReleaseId: 21, releaseId: 34 },
        // dv_TW3_BloodAndWine_XONE_orig → gv 32 + 33
        { dlcReleaseId: 22, releaseId: 33 },
        { dlcReleaseId: 22, releaseId: 34 },
        // dv_TW3_HeartsOfStone_XONE_GOTY → gv 36 (release 37) + gv 37 (release 38)
        { dlcReleaseId: 23, releaseId: 37 },
        { dlcReleaseId: 23, releaseId: 38 },
        // dv_TW3_BloodAndWine_XONE_GOTY → gv 36 + 37
        { dlcReleaseId: 24, releaseId: 37 },
        { dlcReleaseId: 24, releaseId: 38 },
        // dv_TW3_HeartsOfStone_XSX_Enhanced → gv 34 (release 35) + gv 35 (release 36)
        { dlcReleaseId: 25, releaseId: 35 },
        { dlcReleaseId: 25, releaseId: 36 },
        // dv_TW3_BloodAndWine_XSX_Enhanced → gv 34 + 35
        { dlcReleaseId: 26, releaseId: 35 },
        { dlcReleaseId: 26, releaseId: 36 },
        // dv_TW3_HeartsOfStone_XSX_GOTY → gv 38 (release 39) + gv 39 (release 40)
        { dlcReleaseId: 27, releaseId: 39 },
        { dlcReleaseId: 27, releaseId: 40 },
        // dv_TW3_BloodAndWine_XSX_GOTY → gv 38 + 39
        { dlcReleaseId: 28, releaseId: 39 },
        { dlcReleaseId: 28, releaseId: 40 },
    ]);
    // -----------------------------------------------------------------------
    // 9. Collections
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting collections...");
    await db.insert(s.collections).values([
        { id: 1, title: "Warcraft 3: Reign of Chaos", mediaFormatId: mediaFormatLookup["CD"], releaseYear: 2002 },
        {
            id: 2,
            title: "Heroes of Might and Magic Collection",
            mediaFormatId: mediaFormatLookup["DVD"],
            releaseYear: 2004,
        },
        { id: 3, title: "Metal Gear Solid: Snake Eater 3D", mediaFormatId: mediaFormatLookup["N/A"], releaseYear: 2012 },
        {
            id: 4,
            title: "Metal Gear Solid: The Legacy Collection",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2011,
        },
        {
            id: 5,
            title: "Heroes of Might and Magic 3: Complete",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 1999,
        },
        { id: 6, title: "Age of Empires 2: Age of Kings", mediaFormatId: mediaFormatLookup["N/A"], releaseYear: 1999 },
        {
            id: 7,
            title: "Age of Empires 2: Age of Kings: The Conquerors",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2000,
        },
        {
            id: 8,
            title: "Age of Empires 2: Age of Kings (HD Edition)",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2012,
        },
        {
            id: 9,
            title: "Age of Empires 2: Age of Kings (HD Edition): The Conquerors",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2013,
        },
        {
            id: 10,
            title: "Age of Empires 2: Age of Kings (HD Edition): The Forgotten",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2013,
        },
        {
            id: 11,
            title: "Age of Empires 2: Age of Kings (HD Edition): The African Kingdoms",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2015,
        },
        {
            id: 12,
            title: "Age of Empires 2: Age of Kings (HD Edition): Rise of the Rajas",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2016,
        },
        {
            id: 13,
            title: "Age of Empires 2: Age of Kings (Definitive Edition)",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2017,
        },
        {
            id: 14,
            title: "Age of Empires 2: Age of Kings (Definitive Edition): The Conquerors",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2017,
        },
        {
            id: 15,
            title: "Age of Empires 2: Age of Kings (Definitive Edition): The Forgotten",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2017,
        },
        {
            id: 16,
            title: "Age of Empires 2: Age of Kings (Definitive Edition): The African Kingdoms",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2017,
        },
        {
            id: 17,
            title: "Age of Empires 2: Age of Kings (Definitive Edition): Rise of the Rajas",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2017,
        },
        {
            id: 18,
            title: "Age of Empires 2: Age of Kings (Definitive Edition): Lords of the West",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2021,
        },
        {
            id: 19,
            title: "Age of Empires 2: Age of Kings (Definitive Edition): Dawn of the Dukes",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2021,
        },
        {
            id: 20,
            title: "Age of Empires 2: Age of Kings (Definitive Edition): Dynasties of India",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2022,
        },
        { id: 21, title: "Indigo Prophecy", mediaFormatId: mediaFormatLookup["DVD"], releaseYear: 2005 },
        { id: 22, title: "Indigo Prophecy", mediaFormatId: mediaFormatLookup["DVD"], releaseYear: 2005 },
        { id: 23, title: "Indigo Prophecy", mediaFormatId: mediaFormatLookup["DVD"], releaseYear: 2005 },
        { id: 24, title: "Indigo Prophecy", mediaFormatId: mediaFormatLookup["DVD"], releaseYear: 2007 },
        { id: 25, title: "Indigo Prophecy", mediaFormatId: mediaFormatLookup["Digital"], releaseYear: 2007 },
        {
            id: 26,
            title: "Fahrenheit: Indigo Prophecy Remastered",
            mediaFormatId: mediaFormatLookup["Digital"],
            releaseYear: 2015,
        },
        { id: 27, title: "Indigo Prophecy", mediaFormatId: mediaFormatLookup["Digital"], releaseYear: 2015 },
        {
            id: 28,
            title: "Indigo Prophecy: Limited Run #331",
            mediaFormatId: mediaFormatLookup["Digital"],
            releaseYear: 2020,
        },
        {
            id: 29,
            title: "Red Dead Redemption: Game of the Year Edition",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2011,
        },
        { id: 30, title: "The Witcher 3: Wild Hunt", mediaFormatId: mediaFormatLookup["N/A"], releaseYear: 2015 },
        { id: 31, title: "The Witcher 3: Wild Hunt", mediaFormatId: mediaFormatLookup["N/A"], releaseYear: 2015 },
        {
            id: 32,
            title: "The Witcher 3: Wild Hunt - Game of the Year Edition",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2016,
        },
        {
            id: 33,
            title: "The Witcher 3: Wild Hunt - Game of the Year Edition",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2016,
        },
        { id: 34, title: "The Witcher 3: Wild Hunt", mediaFormatId: mediaFormatLookup["N/A"], releaseYear: 2015 },
        { id: 35, title: "The Witcher 3: Wild Hunt", mediaFormatId: mediaFormatLookup["N/A"], releaseYear: 2015 },
        {
            id: 36,
            title: "The Witcher 3: Wild Hunt (Enhanced)",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2022,
        },
        {
            id: 37,
            title: "The Witcher 3: Wild Hunt - Game of the Year Edition (Enhanced)",
            mediaFormatId: mediaFormatLookup["N/A"],
            releaseYear: 2022,
        },
    ]);
    // -----------------------------------------------------------------------
    // 10. Collection Releases
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting collection-releases...");
    await db.insert(s.collectionReleases).values([
        // Collection 1 (Warcraft 3) → release 1
        { collectionId: 1, releaseId: 1 },
        // Collection 2 (Heroes Collection) → releases 2, 3, 4, 6
        { collectionId: 2, releaseId: 2 },
        { collectionId: 2, releaseId: 3 },
        { collectionId: 2, releaseId: 4 },
        { collectionId: 2, releaseId: 6 },
        // Collection 3 (MGS Snake Eater 3D) → release 12
        { collectionId: 3, releaseId: 12 },
        // Collection 4 (MGS Legacy) → releases 13, 14, 15
        { collectionId: 4, releaseId: 13 },
        { collectionId: 4, releaseId: 14 },
        { collectionId: 4, releaseId: 15 },
        // Collection 5 (HoMM3 Complete) → release 5
        { collectionId: 5, releaseId: 5 },
        // Collection 6 (AoE2 original) → release 16
        { collectionId: 6, releaseId: 16 },
        // Collection 7 (AoE2 Conquerors) → only DLC, no game release
        // Collection 8 (AoE2 HD) → release 17
        { collectionId: 8, releaseId: 17 },
        // Collection 13 (AoE2 DE) → release 18
        { collectionId: 13, releaseId: 18 },
        // Collection 21-28: Indigo Prophecy
        { collectionId: 21, releaseId: 19 }, // PC physical original
        { collectionId: 22, releaseId: 20 }, // PS2 physical original
        { collectionId: 23, releaseId: 21 }, // Xbox physical original
        { collectionId: 24, releaseId: 22 }, // X360 physical enhanced
        { collectionId: 25, releaseId: 23 }, // X360 digital enhanced
        { collectionId: 26, releaseId: 24 }, // PC Steam remastered
        { collectionId: 27, releaseId: 25 }, // PS4 digital remastered
        { collectionId: 28, releaseId: 26 }, // PS4 physical remastered
        // Collection 29 (RDR GOTY) → releases 27, 28, 29, 30, 31, 32
        { collectionId: 29, releaseId: 27 },
        { collectionId: 29, releaseId: 28 },
        { collectionId: 29, releaseId: 29 },
        { collectionId: 29, releaseId: 30 },
        { collectionId: 29, releaseId: 31 },
        { collectionId: 29, releaseId: 32 },
        // Collection 30 (TW3 physical) → releases 33, 35
        { collectionId: 30, releaseId: 33 },
        { collectionId: 30, releaseId: 35 },
        // Collection 31 (TW3 digital) → releases 34, 36
        { collectionId: 31, releaseId: 34 },
        { collectionId: 31, releaseId: 36 },
        // Collection 32 (TW3 GOTY physical) → releases 37, 39
        { collectionId: 32, releaseId: 37 },
        { collectionId: 32, releaseId: 39 },
        // Collection 33 (TW3 GOTY digital) → releases 38, 40
        { collectionId: 33, releaseId: 38 },
        { collectionId: 33, releaseId: 40 },
        // Collection 36 (TW3 Enhanced GOG) → release 41
        { collectionId: 36, releaseId: 41 },
        // Collection 37 (TW3 GOTY Enhanced GOG) → release 42
        { collectionId: 37, releaseId: 42 },
    ]);
    // -----------------------------------------------------------------------
    // 11. Collection DLC Releases
    // -----------------------------------------------------------------------
    console.log("[Seed] Inserting collection-DLC-releases...");
    await db.insert(s.collectionDlcReleases).values([
        // Collection 2 (Heroes Collection) → DLC releases 1, 2, 3, 6, 7
        { collectionId: 2, dlcReleaseId: 1 },
        { collectionId: 2, dlcReleaseId: 2 },
        { collectionId: 2, dlcReleaseId: 3 },
        { collectionId: 2, dlcReleaseId: 6 },
        { collectionId: 2, dlcReleaseId: 7 },
        // Collection 5 (HoMM3 Complete) → DLC releases 4, 5
        { collectionId: 5, dlcReleaseId: 4 },
        { collectionId: 5, dlcReleaseId: 5 },
        // Collection 7 (AoE2 Conquerors) → DLC release 8
        { collectionId: 7, dlcReleaseId: 8 },
        // Collection 9 (AoE2 HD Conquerors) → DLC release 9
        { collectionId: 9, dlcReleaseId: 9 },
        // Collection 10 (AoE2 HD Forgotten) → DLC release 10
        { collectionId: 10, dlcReleaseId: 10 },
        // Collection 11 (AoE2 HD African Kingdoms) → DLC release 11
        { collectionId: 11, dlcReleaseId: 11 },
        // Collection 12 (AoE2 HD Rise of Rajas) → DLC release 12
        { collectionId: 12, dlcReleaseId: 12 },
        // Collection 14 (AoE2 DE Conquerors) → DLC release 13
        { collectionId: 14, dlcReleaseId: 13 },
        // Collection 15 (AoE2 DE Forgotten) → DLC release 14
        { collectionId: 15, dlcReleaseId: 14 },
        // Collection 16 (AoE2 DE African Kingdoms) → DLC release 15
        { collectionId: 16, dlcReleaseId: 15 },
        // Collection 17 (AoE2 DE Rise of Rajas) → DLC release 16
        { collectionId: 17, dlcReleaseId: 16 },
        // Collection 18 (AoE2 DE Lords of West) → DLC release 17
        { collectionId: 18, dlcReleaseId: 17 },
        // Collection 19 (AoE2 DE Dawn of Dukes) → DLC release 18
        { collectionId: 19, dlcReleaseId: 18 },
        // Collection 20 (AoE2 DE Dynasties of India) → DLC release 19
        { collectionId: 20, dlcReleaseId: 19 },
        // Collection 29 (RDR GOTY) → DLC release 20
        { collectionId: 29, dlcReleaseId: 20 },
        // Collection 32 (TW3 GOTY physical) → DLC releases 23, 24, 27, 28
        { collectionId: 32, dlcReleaseId: 23 },
        { collectionId: 32, dlcReleaseId: 24 },
        { collectionId: 32, dlcReleaseId: 27 },
        { collectionId: 32, dlcReleaseId: 28 },
        // Collection 33 (TW3 GOTY digital) → DLC releases 23, 24, 27, 28
        { collectionId: 33, dlcReleaseId: 23 },
        { collectionId: 33, dlcReleaseId: 24 },
        { collectionId: 33, dlcReleaseId: 27 },
        { collectionId: 33, dlcReleaseId: 28 },
        // Collection 37 (TW3 GOTY Enhanced GOG) → DLC releases 27, 28
        { collectionId: 37, dlcReleaseId: 27 },
        { collectionId: 37, dlcReleaseId: 28 },
    ]);
    // Reset sequences
    await db.execute(sql `SELECT setval('platforms_id_seq', (SELECT MAX(id) FROM platforms))`);
    await db.execute(sql `SELECT setval('providers_id_seq', (SELECT MAX(id) FROM providers))`);
    await db.execute(sql `SELECT setval('genres_id_seq', (SELECT MAX(id) FROM genres))`);
    await db.execute(sql `SELECT setval('edition_types_id_seq', (SELECT MAX(id) FROM edition_types))`);
    await db.execute(sql `SELECT setval('media_formats_id_seq', (SELECT MAX(id) FROM media_formats))`);
    await db.execute(sql `SELECT setval('series_id_seq', (SELECT MAX(id) FROM series))`);
    await db.execute(sql `SELECT setval('master_games_id_seq', (SELECT MAX(id) FROM master_games))`);
    await db.execute(sql `SELECT setval('release_groups_id_seq', (SELECT MAX(id) FROM release_groups))`);
    await db.execute(sql `SELECT setval('releases_id_seq', (SELECT MAX(id) FROM releases))`);
    await db.execute(sql `SELECT setval('dlcs_id_seq', (SELECT MAX(id) FROM dlcs))`);
    await db.execute(sql `SELECT setval('dlc_releases_id_seq', (SELECT MAX(id) FROM dlc_releases))`);
    await db.execute(sql `SELECT setval('collections_id_seq', (SELECT MAX(id) FROM collections))`);
    console.log("[Seed] Seeding complete!");
}
main()
    .catch((err) => {
    console.error("[Seed] Error:", err);
    process.exit(1);
})
    .then(() => {
    process.exit(0);
});
//# sourceMappingURL=seed.js.map