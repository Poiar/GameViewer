interface SgdbGame {
    id: number;
    name: string;
    types: string[];
    verified: boolean;
}
interface SgdbGrid {
    id: number;
    score: number;
    style: string;
    url: string;
    thumb: string;
    tags: string[];
    author: {
        name: string;
        steam64: string;
        avatar: string;
    };
}
interface SgdbHero {
    id: number;
    score: number;
    style: string;
    url: string;
    thumb: string;
}
interface SgdbLogo {
    id: number;
    score: number;
    style: string;
    url: string;
    thumb: string;
}
/** Search SteamGridDB for a game by name. Returns best match or null. */
export declare function searchGame(title: string): Promise<SgdbGame | null>;
/** Fetch the best 600x900 cover grid for a SteamGridDB game ID. */
export declare function getBestGrid(gameId: number): Promise<SgdbGrid | null>;
/** Fetch the best hero image for a SteamGridDB game ID. */
export declare function getBestHero(gameId: number): Promise<SgdbHero | null>;
/** Fetch the best logo for a SteamGridDB game ID. */
export declare function getBestLogo(gameId: number): Promise<SgdbLogo | null>;
/**
 * Full pipeline: search → get best 600x900 grid → return URL.
 * Returns the image URL or null if nothing found.
 */
export declare function fetchCoverUrl(gameTitle: string): Promise<string | null>;
export {};
//# sourceMappingURL=steamgriddb.d.ts.map